// imaging-register: verifies files the patient uploaded to their private folder,
// re-parses them server-side (never trusting the browser's grouping) and records
// studies / series / instances. Originals are stored untouched.
import dicomParser from 'npm:dicom-parser@1.8.21';
import { inflateSync } from 'npm:fflate@0.8.3';
import { sha256 } from 'npm:@noble/hashes@1.5.0/sha256';
import { z } from 'npm:zod@3.23.8';
import {
  admin, audit, cors, dicomDate, fetchObject, friendlyLabel, isImageSop, json, userIdFrom,
  UUID_RE, VIEWABLE_TS,
} from '../_shared/imaging.ts';

const MAX_FILES_PER_CALL = 50;
const HEADER_BYTES = 8 * 1024 * 1024;          // enough for any real DICOM header
const MAX_OBJECT_BYTES = 500 * 1024 * 1024;    // matches bucket limit
const MAX_STUDY_INSTANCES = 5000;
const MAX_STUDY_BYTES = 5 * 1024 * 1024 * 1024;
const MAX_USER_BYTES = 20 * 1024 * 1024 * 1024;

const body = z.object({
  batchId: z.string().regex(UUID_RE),
  imageLabel: z.string().trim().min(1).max(80).optional(),
  files: z.array(z.object({
    path: z.string().max(200),
    name: z.string().max(255).optional(),
  })).min(1).max(MAX_FILES_PER_CALL),
});

type Parsed =
  | { kind: 'dicom'; studyUid: string; seriesUid: string; sopUid: string; sopClass?: string; modality?: string;
      studyDate: string | null; studyDesc?: string; seriesDesc?: string; bodyPart?: string; institution?: string;
      seriesNumber: number | null; instanceNumber: number | null; frames: number; ts?: string; viewable: boolean }
  | { kind: 'image'; mime: string }
  | { kind: 'rejected'; reason: string };

const UID_RE = /^[0-9]+(\.[0-9]+)*$/;
const clean = (v?: string) => {
  const s = v?.replace(/\0/g, '').trim();
  return s ? s.slice(0, 200) : undefined;
};
const intOrNull = (v?: string) => {
  const n = Number.parseInt(v ?? '', 10);
  return Number.isFinite(n) ? n : null;
};
const safeName = (n?: string) =>
  n ? n.split(/[\\/]/).pop()!.replace(/[^\w.\- ()]/g, '_').slice(0, 120) : null;

function parse(header: Uint8Array, complete: boolean): Parsed {
  if (header.length >= 4 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) return { kind: 'image', mime: 'image/jpeg' };
  if (header.length >= 8 && header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47) return { kind: 'image', mime: 'image/png' };
  const hasPreamble = header.length > 132 &&
    header[128] === 0x44 && header[129] === 0x49 && header[130] === 0x43 && header[131] === 0x4d;
  if (!hasPreamble) return { kind: 'rejected', reason: 'not_dicom_or_supported_image' };
  let ds: dicomParser.DataSet;
  try {
    ds = dicomParser.parseDicom(header, {
      untilTag: 'x7fe00010',
      inflater: (arr: Uint8Array, pos: number) => {
        const inflated = inflateSync(arr.subarray(pos));
        const out = new Uint8Array(pos + inflated.length);
        out.set(arr.subarray(0, pos)); out.set(inflated, pos);
        return out;
      },
    } as dicomParser.ParseDicomOptions);
  } catch {
    return { kind: 'rejected', reason: complete ? 'malformed_dicom' : 'header_too_large' };
  }
  const studyUid = clean(ds.string('x0020000d'));
  const seriesUid = clean(ds.string('x0020000e'));
  const sopUid = clean(ds.string('x00080018'));
  if (!studyUid || !seriesUid || !sopUid || ![studyUid, seriesUid, sopUid].every(u => u.length <= 64 && UID_RE.test(u))) {
    return { kind: 'rejected', reason: 'missing_identifiers' };
  }
  const ts = clean(ds.string('x00020010'));
  const sopClass = clean(ds.string('x00080016'));
  const rows = ds.uint16('x00280010') ?? 0;
  const viewable = isImageSop(sopClass, rows > 0) && (!ts || VIEWABLE_TS.has(ts));
  return {
    kind: 'dicom', studyUid, seriesUid, sopUid, sopClass, ts, viewable,
    modality: clean(ds.string('x00080060'))?.toUpperCase().slice(0, 16),
    studyDate: dicomDate(ds.string('x00080020')),
    studyDesc: clean(ds.string('x00081030')), seriesDesc: clean(ds.string('x0008103e')),
    bodyPart: clean(ds.string('x00180015')), institution: clean(ds.string('x00080080')),
    seriesNumber: intOrNull(ds.string('x00200011')), instanceNumber: intOrNull(ds.string('x00200013')),
    frames: Math.max(1, intOrNull(ds.string('x00280008')) ?? 1),
  };
}

/** Streams the object once: hashes every byte, keeps only the header for parsing. */
async function readObject(path: string) {
  const res = await fetchObject(path);
  if (!res.ok || !res.body) return null;
  const hasher = sha256.create();
  const head = new Uint8Array(HEADER_BYTES);
  let headLen = 0; let size = 0;
  const reader = res.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_OBJECT_BYTES) { await reader.cancel(); return { tooLarge: true as const }; }
    hasher.update(value);
    if (headLen < HEADER_BYTES) {
      const take = Math.min(value.length, HEADER_BYTES - headLen);
      head.set(value.subarray(0, take), headLen); headLen += take;
    }
  }
  const digest = Array.from(hasher.digest(), b => b.toString(16).padStart(2, '0')).join('');
  return { header: head.subarray(0, headLen), size, sha256: digest, complete: size <= HEADER_BYTES };
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method !== 'POST') return json(req, { error: 'method_not_allowed' }, 405);
  const userId = await userIdFrom(req);
  if (!userId) return json(req, { error: 'not_authenticated' }, 401);
  const parsedBody = body.safeParse(await req.json().catch(() => null));
  if (!parsedBody.success) return json(req, { error: 'invalid_request' }, 400);
  const { batchId, files, imageLabel } = parsedBody.data;
  const db = admin();
  // Any of the patient's own batches (a resumed upload keeps its original folder).
  const pathRe = new RegExp(`^${userId}/[0-9a-f-]{36}/[0-9a-f-]{36}$`);

  // Storage quota
  const { data: usage } = await db.from('imaging_studies').select('total_bytes').eq('user_id', userId);
  let userBytes = (usage ?? []).reduce((s, r) => s + Number(r.total_bytes ?? 0), 0);

  const results: { path: string; status: string; reason?: string; studyId?: string }[] = [];
  const touchedStudies = new Set<string>();
  let addedBytes = 0;
  const studyCache = new Map<string, string>();
  const seriesCache = new Map<string, string>();

  const removeObject = async (path: string) => { await db.storage.from('imaging-originals').remove([path]); };

  for (const f of files) {
    if (!pathRe.test(f.path)) { results.push({ path: f.path, status: 'rejected', reason: 'invalid_path' }); continue; }
    // Already registered (retry after a dropped response) -> idempotent success.
    const { data: existing } = await db.from('imaging_instances').select('study_id').eq('storage_path', f.path).maybeSingle();
    if (existing) { results.push({ path: f.path, status: 'registered', studyId: existing.study_id }); continue; }

    const obj = await readObject(f.path);
    if (!obj) { results.push({ path: f.path, status: 'missing', reason: 'upload_incomplete' }); continue; }
    if ('tooLarge' in obj) { await removeObject(f.path); results.push({ path: f.path, status: 'rejected', reason: 'file_too_large' }); continue; }
    if (userBytes + obj.size > MAX_USER_BYTES) { await removeObject(f.path); results.push({ path: f.path, status: 'rejected', reason: 'storage_quota_exceeded' }); continue; }

    const p = parse(obj.header, obj.complete);
    if (p.kind === 'rejected') { await removeObject(f.path); results.push({ path: f.path, status: 'rejected', reason: p.reason }); continue; }

    let studyId: string; let seriesId: string; let sopUid: string;
    if (p.kind === 'dicom') {
      sopUid = p.sopUid;
      const sKey = p.studyUid;
      studyId = studyCache.get(sKey) ?? '';
      if (!studyId) {
        const { data: st } = await db.from('imaging_studies').select('id, instance_count, total_bytes')
          .eq('user_id', userId).eq('study_uid', p.studyUid).maybeSingle();
        if (st) {
          if (st.instance_count >= MAX_STUDY_INSTANCES || Number(st.total_bytes) + obj.size > MAX_STUDY_BYTES) {
            await removeObject(f.path); results.push({ path: f.path, status: 'rejected', reason: 'study_too_large' }); continue;
          }
          studyId = st.id;
        } else {
          const { data: ins, error } = await db.from('imaging_studies').insert({
            user_id: userId, kind: 'dicom', study_uid: p.studyUid,
            label: friendlyLabel(p.modality ? [p.modality] : [], p.bodyPart, p.studyDesc),
            body_part: p.bodyPart ?? null, description: p.studyDesc ?? null,
            study_date: p.studyDate, institution: p.institution ?? null, status: 'uploading',
          }).select('id').single();
          if (error) {
            const { data: again } = await db.from('imaging_studies').select('id').eq('user_id', userId).eq('study_uid', p.studyUid).single();
            if (!again) { results.push({ path: f.path, status: 'failed', reason: 'study_create_failed' }); continue; }
            studyId = again.id;
          } else studyId = ins.id;
        }
        studyCache.set(sKey, studyId);
      }
      const seKey = `${studyId}|${p.seriesUid}`;
      seriesId = seriesCache.get(seKey) ?? '';
      if (!seriesId) {
        const { data: se } = await db.from('imaging_series').upsert({
          study_id: studyId, user_id: userId, series_uid: p.seriesUid, modality: p.modality ?? null,
          description: p.seriesDesc ?? null, series_number: p.seriesNumber,
        }, { onConflict: 'study_id,series_uid' }).select('id').single();
        if (!se) { results.push({ path: f.path, status: 'failed', reason: 'series_create_failed' }); continue; }
        seriesId = se.id; seriesCache.set(seKey, seriesId);
      }
    } else {
      // Plain JPG/PNG: one study per upload batch.
      sopUid = crypto.randomUUID();
      const sKey = `image:${batchId}`;
      studyId = studyCache.get(sKey) ?? '';
      if (!studyId) {
        const { data: ins } = await db.from('imaging_studies').insert({
          user_id: userId, kind: 'image', label: imageLabel ?? 'Imaging photos', status: 'uploading',
        }).select('id').single();
        if (!ins) { results.push({ path: f.path, status: 'failed', reason: 'study_create_failed' }); continue; }
        studyId = ins.id; studyCache.set(sKey, studyId);
      }
      const seKey = `${studyId}|images`;
      seriesId = seriesCache.get(seKey) ?? '';
      if (!seriesId) {
        const { data: se } = await db.from('imaging_series').upsert({
          study_id: studyId, user_id: userId, series_uid: batchId, modality: 'OT', description: 'Images',
        }, { onConflict: 'study_id,series_uid' }).select('id').single();
        if (!se) { results.push({ path: f.path, status: 'failed', reason: 'series_create_failed' }); continue; }
        seriesId = se.id; seriesCache.set(seKey, seriesId);
      }
    }

    const { error: insErr } = await db.from('imaging_instances').insert({
      series_id: seriesId, study_id: studyId, user_id: userId, sop_uid: sopUid,
      instance_number: p.kind === 'dicom' ? p.instanceNumber : null,
      number_of_frames: p.kind === 'dicom' ? p.frames : 1,
      transfer_syntax: p.kind === 'dicom' ? p.ts ?? null : null,
      mime: p.kind === 'dicom' ? 'application/dicom' : p.mime,
      storage_path: f.path, size_bytes: obj.size, sha256: obj.sha256,
      original_name: safeName(f.name), viewable: p.kind === 'dicom' ? p.viewable : true,
    });
    if (insErr) {
      // Same image already in this series (common on hospital CDs) -> drop the copy.
      await removeObject(f.path);
      results.push({ path: f.path, status: 'duplicate', studyId });
      continue;
    }
    userBytes += obj.size; addedBytes += obj.size;
    touchedStudies.add(studyId);
    results.push({ path: f.path, status: 'registered', studyId });
  }

  for (const id of touchedStudies) await db.rpc('imaging_refresh_study', { _study_id: id });
  // Re-label DICOM studies once all series modalities are known.
  if (touchedStudies.size) {
    const { data: studies } = await db.from('imaging_studies').select('id, kind, label_auto, modalities, body_part, description').in('id', [...touchedStudies]);
    for (const s of studies ?? []) {
      if (s.kind === 'dicom' && s.label_auto) {
        await db.from('imaging_studies').update({ label: friendlyLabel(s.modalities ?? [], s.body_part, s.description) }).eq('id', s.id);
      }
    }
    await audit('imaging_uploaded', userId, {
      study_count: touchedStudies.size, files: results.filter(r => r.status === 'registered').length, bytes: addedBytes,
    }, userId);
  }
  return json(req, { results });
});
