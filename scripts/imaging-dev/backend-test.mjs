// Backend security + workflow tests for RinVita Imaging against the LOCAL stack only.
// Synthetic users and synthetic DICOM fixtures. Refuses to run against a non-local URL.
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { execSync } from 'node:child_process';

const URL = process.env.LOCAL_SUPABASE_URL ?? 'http://127.0.0.1:54321';
if (!/^http:\/\/(127\.0\.0\.1|localhost)/.test(URL)) throw new Error('Refusing to run outside the local stack');
const ANON = process.env.LOCAL_ANON_KEY;
const SERVICE = process.env.LOCAL_SERVICE_KEY;
const FIX = process.env.FIXTURES ?? 'scripts/imaging-fixtures/fixtures-out';
const FN = `${URL}/functions/v1`;
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const psql = sql => execSync(`psql -h 127.0.0.1 -p 54322 -U postgres -At -c "${sql.replace(/"/g, '\\"')}"`, { env: { ...process.env, PGPASSWORD: 'postgres' } }).toString().trim();

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

async function makeUser(tag) {
  const email = `${tag}-${randomUUID().slice(0, 8)}@example.test`;
  const password = 'Synthetic-' + randomUUID();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: `Synthetic ${tag}` } });
  if (error) throw error;
  const client = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data: s, error: e2 } = await client.auth.signInWithPassword({ email, password });
  if (e2) throw e2;
  return { id: data.user.id, client, jwt: s.session.access_token };
}

const files = dir => readdirSync(dir).map(f => join(dir, f)).filter(f => statSync(f).isFile());

async function uploadAndRegister(user, paths, { names } = {}) {
  const batchId = randomUUID();
  const items = [];
  for (const p of paths) {
    const objectPath = `${user.id}/${batchId}/${randomUUID()}`;
    const { error } = await user.client.storage.from('imaging-originals').upload(objectPath, readFileSync(p), { contentType: 'application/octet-stream' });
    if (error) throw new Error(`upload failed ${error.message}`);
    items.push({ path: objectPath, name: names ? p.split('/').pop() : undefined });
  }
  const out = [];
  for (let i = 0; i < items.length; i += 50) {
    const res = await fetch(`${FN}/imaging-register`, {
      method: 'POST', headers: { Authorization: `Bearer ${user.jwt}`, apikey: ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchId, files: items.slice(i, i + 50) }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(`register ${res.status} ${JSON.stringify(j)}`);
    out.push(...j.results);
  }
  return out;
}

const stream = (id, headers, purpose = 'view') => fetch(`${FN}/imaging-stream?id=${id}&purpose=${purpose}`, { headers: { apikey: ANON, ...headers } });

(async () => {
  const patient = await makeUser('patient');
  const other = await makeUser('other');
  psql(`update profiles set comped_plan='standard', comped_until=now()+interval '30 days' where id='${patient.id}'`);

  // 1-3 Upload + grouping
  const ct = await uploadAndRegister(patient, files(join(FIX, 'ct_abdomen')), { names: true });
  const mri = await uploadAndRegister(patient, files(join(FIX, 'mri_brain')));
  const xr = await uploadAndRegister(patient, files(join(FIX, 'xray_chest')));
  const us = await uploadAndRegister(patient, files(join(FIX, 'us_multiframe')));
  const defl = await uploadAndRegister(patient, files(join(FIX, 'ct_deflated')));
  check('CT upload: 60 files incl. extensionless registered', ct.filter(r => r.status === 'registered').length === 60);
  const { data: studies } = await patient.client.from('imaging_studies').select('id,label,series_count,instance_count,modalities,study_date,status').order('created_at');
  const byLabel = {};
  for (const s of studies) if (!byLabel[s.label] || s.instance_count > byLabel[s.label].instance_count) byLabel[s.label] = s;
  check('Grouping: CT study has 2 series / 60 images', byLabel['CT Abdomen']?.series_count === 2 && byLabel['CT Abdomen']?.instance_count === 60, JSON.stringify(byLabel['CT Abdomen']));
  check('Grouping: MRI study has 3 series / 64 images', byLabel['MRI Brain']?.series_count === 3 && byLabel['MRI Brain']?.instance_count === 64, JSON.stringify(byLabel['MRI Brain']));
  check('Friendly labels', ['CT Abdomen', 'MRI Brain', 'X-ray Chest', 'Ultrasound Abdomen'].every(l => byLabel[l]), studies.map(s => s.label).join(', '));
  check('Study date parsed', byLabel['MRI Brain']?.study_date === '2026-09-15');
  const { data: usInst } = await patient.client.from('imaging_instances').select('number_of_frames').eq('study_id', byLabel['Ultrasound Abdomen'].id);
  check('Multi-frame recorded (24 frames)', usInst?.[0]?.number_of_frames === 24);
  check('Deflated transfer syntax accepted', defl[0]?.status === 'registered');

  // Re-upload same MRI study: duplicates collapse, no new rows
  const dup = await uploadAndRegister(patient, files(join(FIX, 'mri_brain')).slice(0, 5));
  check('Duplicate images dropped', dup.every(r => r.status === 'duplicate'));

  // 15 Unsupported / corrupted
  const bad = await uploadAndRegister(patient, [join(FIX, 'corrupt.dcm'), join(FIX, 'not_dicom.dcm')]);
  check('Corrupt DICOM rejected', bad[0].status === 'rejected', bad[0].reason);
  check('Non-DICOM rejected', bad[1].status === 'rejected', bad[1].reason);

  // Integrity: hash matches original file
  const { data: one } = await patient.client.from('imaging_instances').select('id,sha256,original_name').eq('study_id', byLabel['CT Abdomen'].id).eq('original_name', 'ct_1_001.dcm').single();
  const orig = createHash('sha256').update(readFileSync(join(FIX, 'ct_abdomen', 'ct_1_001.dcm'))).digest('hex');
  check('Stored original is byte-identical (sha256)', one.sha256 === orig);

  // 6 Owner can stream; bytes identical
  let r = await stream(one.id, { Authorization: `Bearer ${patient.jwt}` });
  const bytes = Buffer.from(await r.arrayBuffer());
  check('Owner streams own image', r.status === 200 && createHash('sha256').update(bytes).digest('hex') === orig);
  check('Stream response is no-store', /no-store/.test(r.headers.get('cache-control') ?? ''));

  // 13 Unauthorised direct access
  r = await stream(one.id, { Authorization: `Bearer ${other.jwt}` });
  check('Other user cannot stream patient image', r.status === 404);
  r = await stream(one.id, { Authorization: `Bearer ${ANON}` });
  check('Anonymous cannot stream', r.status === 401);
  const { data: path } = await admin.from('imaging_instances').select('storage_path').eq('id', one.id).single();
  const { data: dl, error: dlErr } = await other.client.storage.from('imaging-originals').download(path.storage_path);
  check('Other user cannot read storage object directly', !dl && !!dlErr);
  const pub = await fetch(`${URL}/storage/v1/object/public/imaging-originals/${path.storage_path}`);
  check('No public URL access', pub.status >= 400);
  const { data: rows } = await other.client.from('imaging_studies').select('id');
  check('RLS: other user sees no studies', rows.length === 0);
  const { error: wrongFolder } = await other.client.storage.from('imaging-originals').upload(`${patient.id}/x/${randomUUID()}`, Buffer.from('x'));
  check('Cannot upload into another patient\'s folder', !!wrongFolder);
  const regOther = await fetch(`${FN}/imaging-register`, { method: 'POST', headers: { Authorization: `Bearer ${other.jwt}`, apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ batchId: path.storage_path.split('/')[1], files: [{ path: path.storage_path }] }) });
  const regOtherJ = await regOther.json();
  check('Cannot register another patient\'s file', regOtherJ.results?.[0]?.status === 'rejected');
  const { error: tamper } = await patient.client.from('imaging_studies').update({ user_id: other.id }).eq('id', byLabel['MRI Brain'].id);
  check('Patient cannot change ownership/server fields', !!tamper);

  // 7-9 Share Brief with imaging
  const token = randomBytes(24).toString('hex');
  const { error: briefErr } = await patient.client.from('shared_briefs').insert({
    token, user_id: patient.id, scope: 'Imaging · English', expires_at: new Date(Date.now() + 3600e3).toISOString(),
    blood_results: [], medications: [], allergies: [], imaging_results: [],
    imaging_study_ids: [byLabel['MRI Brain'].id], allow_imaging_download: false,
  });
  check('Patient creates Share Brief with selected MRI', !briefErr, briefErr?.message);
  const { error: stealErr } = await other.client.from('shared_briefs').insert({
    token: randomBytes(24).toString('hex'), user_id: other.id, scope: 'x', expires_at: new Date(Date.now() + 3600e3).toISOString(),
    blood_results: [], medications: [], allergies: [], imaging_results: [], imaging_study_ids: [byLabel['MRI Brain'].id],
  });
  check('Cannot share another patient\'s study', !!stealErr);
  const { error: widen } = await patient.client.from('shared_briefs').update({ allow_imaging_download: true }).eq('token', token);
  check('Existing link scope cannot be widened', !!widen || (await admin.from('shared_briefs').select('allow_imaging_download').eq('token', token).single()).data.allow_imaging_download === false);

  const recipient = randomBytes(32).toString('hex');
  const callFn = (name, body) => fetch(`${FN}/${name}`, { method: 'POST', headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(x => x.json());
  const brief = await callFn('get-shared-brief', { token, recipientSecret: recipient });
  check('Doctor claims brief (protocol 2)', brief.protocol === 2 && !!brief.brief);
  const sess = await callFn('imaging-session', { token, recipientSecret: recipient });
  const manifest = sess.imaging;
  check('Doctor gets imaging session + manifest', !!manifest?.sessionSecret && manifest.studies.length === 1 && manifest.studies[0].series.length === 3);
  check('Manifest exposes no storage paths', !JSON.stringify(manifest).includes('imaging-originals') && !JSON.stringify(manifest).includes(patient.id));
  const firstInst = manifest.studies[0].series[0].instances[0].id;
  r = await stream(firstInst, { 'x-rinvita-view-session': manifest.sessionSecret });
  check('Doctor streams included study', r.status === 200);
  // 12 Reuse by another person
  const thief = randomBytes(32).toString('hex');
  const stolen = await callFn('imaging-session', { token, recipientSecret: thief });
  check('Single-use: second recipient denied', stolen.imaging === null);
  const again = await callFn('imaging-session', { token, recipientSecret: recipient });
  check('Same recipient can reopen (link not re-consumed per request)', !!again.imaging?.sessionSecret);
  // scope
  r = await stream(one.id, { 'x-rinvita-view-session': manifest.sessionSecret });
  check('Doctor cannot fetch study outside brief scope', r.status === 403);
  r = await stream(firstInst, { 'x-rinvita-view-session': randomBytes(32).toString('hex') });
  check('Forged session denied', r.status === 403);
  r = await stream(firstInst, { 'x-rinvita-view-session': manifest.sessionSecret }, 'download');
  check('Download refused when not permitted', r.status === 403);
  // many slices in one session do not consume link
  let okCount = 0;
  for (const s of manifest.studies[0].series) for (const i of s.instances.slice(0, 10)) { const x = await stream(i.id, { 'x-rinvita-view-session': manifest.sessionSecret }); okCount += x.status === 200 ? 1 : 0; await x.arrayBuffer(); }
  check('30 slice requests in one session all succeed', okCount === 30);

  // 11 Revocation during active session
  const { data: revoked } = await patient.client.rpc('revoke_shared_brief', { _token: token });
  r = await stream(firstInst, { 'x-rinvita-view-session': manifest.sessionSecret });
  check('Revocation blocks the open session immediately', revoked === true && r.status === 403);
  const afterRevoke = await callFn('imaging-session', { token, recipientSecret: recipient });
  check('Revoked link cannot start new session', afterRevoke.imaging === null);

  // Expiry
  const token2 = randomBytes(24).toString('hex');
  await patient.client.from('shared_briefs').insert({
    token: token2, user_id: patient.id, scope: 'Imaging', expires_at: new Date(Date.now() + 4000).toISOString(),
    blood_results: [], medications: [], allergies: [], imaging_results: [], imaging_study_ids: [byLabel['CT Abdomen'].id], allow_imaging_download: true,
  });
  const rec2 = randomBytes(32).toString('hex');
  await callFn('get-shared-brief', { token: token2, recipientSecret: rec2 });
  const s2 = (await callFn('imaging-session', { token: token2, recipientSecret: rec2 })).imaging;
  const ctInst = s2.studies[0].series[0].instances[0].id;
  r = await stream(ctInst, { 'x-rinvita-view-session': s2.sessionSecret }, 'download');
  check('Download allowed when patient permitted it', r.status === 200);
  await new Promise(res => setTimeout(res, 4500));
  r = await stream(ctInst, { 'x-rinvita-view-session': s2.sessionSecret });
  check('Expired link blocks the open session', r.status === 403);

  // Audit
  const ev = psql(`select string_agg(distinct event_type, ',') from platform_events where user_id='${patient.id}'`);
  check('Audit events recorded', ['imaging_uploaded', 'imaging_shared', 'imaging_view_session_started', 'share_brief_revoked'].every(e => ev.includes(e)), ev);
  const leak = psql(`select count(*) from platform_events where user_id='${patient.id}' and event_type like 'imaging%' and (details_json::text ilike '%Synthetic%' or details_json::text ilike '%SYNTHETIC%' or details_json::text ilike '%${token}%' or details_json::text ilike '%.dcm%')`);
  check('Audit contains no names, tokens or file names', leak === '0');

  // Delete
  const del = await fetch(`${FN}/imaging-delete`, { method: 'POST', headers: { Authorization: `Bearer ${patient.jwt}`, apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ studyId: byLabel['X-ray Chest'].id }) });
  const left = psql(`select count(*) from storage.objects where bucket_id='imaging-originals' and name in (select storage_path from imaging_instances where study_id='${byLabel['X-ray Chest'].id}')`);
  check('Delete removes study and files', del.status === 200 && left === '0');

  const failed = results.filter(x => !x.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
