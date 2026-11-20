// End-of-pilot staging test. Synthetic patients only; runs against a LOCAL Supabase staging stack, never the live backend.
// deno run -A --import-map=supabase/pilot-staging/tests/import_map.json supabase/pilot-staging/tests/end_of_pilot.staging.ts
// Needs SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY and PG_URL for the local stack.
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { unzipSync, strFromU8 } from "npm:fflate@0.8.2";
import { handle } from "close-account";
import { buildDataExport } from "rinvita/dataExport";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
if (!/127\.0\.0\.1|localhost/.test(URL_)) throw new Error("Refusing to run: this test only runs against a local staging stack.");
const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });
const RUN = crypto.randomUUID().slice(0, 6);
const results: { case: string; check: string; ok: boolean; detail?: string }[] = [];
let current = "";
const check = (name: string, ok: boolean, detail?: unknown) => {
  results.push({ case: current, check: name, ok, detail: detail === undefined ? undefined : String(typeof detail === "object" ? JSON.stringify(detail) : detail) });
  console.log(`${ok ? "PASS" : "FAIL"}  [${current}] ${name}${detail !== undefined && !ok ? ` -> ${JSON.stringify(detail)}` : ""}`);
};
const psql = async (sql: string) => {
  const p = new Deno.Command("docker", { args: ["exec", "supabase_db_rinvita-staging", "psql", "-U", "postgres", "-tAc", sql] });
  const o = await p.output();
  if (!o.success) throw new Error(new TextDecoder().decode(o.stderr));
  return new TextDecoder().decode(o.stdout).trim();
};
const days = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();
const ymd = (n: number) => days(n).slice(0, 10);

// ---------- synthetic fixtures ----------
const must = <T extends { error: unknown }>(r: T): T => { if (r.error) throw new Error(JSON.stringify(r.error)); return r; };
const PDF = new TextEncoder().encode("%PDF-1.4\n% synthetic test document, not a real patient record\n%%EOF\n");
const DCM = (i: number) => { const b = new Uint8Array(200); b.set(new TextEncoder().encode("DICM"), 128); b[199] = i; return b; };

async function makeOrg(name: string, sponsorUntil: string) {
  const { data, error } = await admin.from("partner_orgs").insert({ name, slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${RUN}`, sponsor_until: sponsorUntil, sponsored_plan: "standard" }).select("id").single();
  if (error) throw error;
  return data.id as string;
}

async function makePatient(label: string, orgId: string, opts: { docs: number; scans?: number; extras?: boolean }) {
  const email = `${label.toLowerCase()}-${RUN}@staging.rinvita.test`;
  const password = crypto.randomUUID();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: "Synthetic", last_name: label } });
  if (error) throw error;
  const id = data.user.id;
  // Joined through the partner while the pilot was running (sponsored standard plan).
  must(await admin.from("partner_patient_links").insert({ org_id: orgId, patient_user_id: id, invited_email: email, status: "joined", joined_at: days(-60) }));
  must(await admin.from("profiles").update({ comped_plan: "standard", comped_until: days(30) }).eq("id", id));
  for (let i = 1; i <= opts.docs; i++) {
    const path = `${id}/synthetic-${i}.pdf`;
    must(await admin.storage.from("medical-documents").upload(path, PDF, { contentType: "application/pdf" }));
    const { data: doc, error: dErr } = await admin.from("documents").insert({ user_id: id, name: `Synthetic letter ${i}`, type: "letter", file_path: path, processing_status: "completed", extracted: true, content_original: "Synthetic text", content_translated: "Synthetic translation" }).select("id").single();
    if (dErr) throw dErr;
    must(await admin.from("blood_results").insert({ user_id: id, marker: `Synthetic marker ${i} (doc ${doc.id.slice(0, 4)})`, value: "5.0", unit: "mmol/L", date: "2026-01-01" }));
  }
  for (let s = 0; s < (opts.scans ?? 0); s++) {
    const { data: st, error: sErr } = await admin.from("imaging_studies").insert({ user_id: id, study_uid: `1.2.826.0.1.${RUN.charCodeAt(0)}.${s}`, title: `Synthetic MRI ${s + 1}`, modalities: ["MR"], series_count: 1, instance_count: 3, size_bytes: 600, source: "patient", status: "ready"}).select("id").single();
    if (sErr) throw sErr;
    must(await admin.from("imaging_studies").update({ manifest_path: `${id}/dicom/${st.id}/manifest.json` }).eq("id", st.id));
    for (let i = 0; i < 3; i++) must(await admin.storage.from("medical-documents").upload(`${id}/dicom/${st.id}/series1/${i}.dcm`, DCM(i), { contentType: "application/dicom" }));
    must(await admin.storage.from("medical-documents").upload(`${id}/dicom/${st.id}/manifest.json`, new TextEncoder().encode("{}"), { contentType: "application/json" }));
  }
  if (opts.extras) {
    must(await admin.from("medications").insert({ user_id: id, name: "Synthetic medicine", dose: "1 tablet" }));
    must(await admin.from("allergies").insert({ user_id: id, substance: "Synthetic allergen", severity: "mild" }));
    must(await admin.from("shared_briefs").insert({ user_id: id, token: `tok${RUN}${label}`.padEnd(40, "x"), scope: "full", expires_at: days(7) }));
    must(await admin.from("media_shares").insert({ user_id: id, file_path: `${id}/synthetic-1.pdf`, token: `med${RUN}${label}`.padEnd(40, "x"), expires_at: days(7) }));
    must(await admin.from("export_translation_cache").insert({ user_id: id, data_hash: `h${RUN}`, target_language: "ar", translated_payload: { synthetic: true }, expires_at: days(30) }));
    must(await admin.from("platform_events").insert({ event_type: "synthetic_test", user_id: id, actor_user_id: id, details_json: {} }));
    must(await admin.from("email_send_log").insert({ message_id: `m-${RUN}-${label}`, template_name: "synthetic", recipient_email: email, status: "sent" }));
    must(await admin.storage.from("avatars").upload(`${id}/avatar.png`, new Uint8Array([137, 80, 78, 71]), { contentType: "image/png" }));
  }
  // The pilot ends: sponsorship date passes.
  return { id, email, password };
}

async function endPilot(userId: string) {
  await admin.from("profiles").update({ comped_until: days(-1) }).eq("id", userId);
}

async function signIn(email: string, password: string) {
  const c = createClient(URL_, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await c.auth.signInWithPassword({ email, password });
  return { client: c, session: data.session, error };
}

async function countFor(userId: string) {
  const out = await psql(`select json_build_object(
    'documents',(select count(*) from public.documents where user_id='${userId}'),
    'blood_results',(select count(*) from public.blood_results where user_id='${userId}'),
    'medications',(select count(*) from public.medications where user_id='${userId}'),
    'allergies',(select count(*) from public.allergies where user_id='${userId}'),
    'imaging_studies',(select count(*) from public.imaging_studies where user_id='${userId}'),
    'translations',(select count(*) from public.export_translation_cache where user_id='${userId}'),
    'shared_briefs',(select count(*) from public.shared_briefs where user_id='${userId}'),
    'media_shares',(select count(*) from public.media_shares where user_id='${userId}'),
    'partner_links',(select count(*) from public.partner_patient_links where patient_user_id='${userId}'),
    'events',(select count(*) from public.platform_events where user_id='${userId}' or actor_user_id='${userId}'),
    'profiles',(select count(*) from public.profiles where id='${userId}'),
    'storage_objects',(select count(*) from storage.objects where split_part(name,'/',1)='${userId}'),
    'auth_user',(select count(*) from auth.users where id='${userId}'),
    'sessions',(select count(*) from auth.sessions where user_id='${userId}'),
    'refresh_tokens',(select count(*) from auth.refresh_tokens where user_id='${userId}'))`);
  return JSON.parse(out) as Record<string, number>;
}

const callClose = (token: string, body: unknown) =>
  handle(new Request("http://local/close-account", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) }));

// ---------- run ----------
await psql("update public.admin_settings set end_of_pilot_enabled = true where id = 1"); // staging only
const orgEnded = await makeOrg(`Synthetic Partner ${RUN}`, ymd(-1));

// 0. Before the end date: "ending soon" shows, nothing is lost.
current = "Before end";
{
  const p = await makePatient("Soon", orgEnded, { docs: 2 });
  await admin.from("profiles").update({ comped_until: days(5) }).eq("id", p.id);
  const { client } = await signIn(p.email, p.password);
  const { data: st } = await client.rpc("get_my_pilot_status");
  check("pilot shows as ending soon, not ended", st?.ending_soon === true && st?.ended === false, st);
  const { data: paid } = await client.rpc("user_has_paid_access", { _user_id: p.id });
  check("still has sponsored access before the end date", paid === true, paid);
}

// 1. Move to a paid plan.
current = "Paid";
{
  const p = await makePatient("Paid", orgEnded, { docs: 4 });
  await endPilot(p.id);
  const { client } = await signIn(p.email, p.password);
  const { data: st } = await client.rpc("record_pilot_choice", { _choice: "paid" });
  check("choice recorded as paid", st?.choice === "paid", st);
  const subs = await psql(`select count(*) from public.subscriptions where user_id='${p.id}'`);
  check("no subscription or charge is created by choosing (checkout not completed)", subs === "0", subs);
  const { data: before } = await client.rpc("user_has_paid_access", { _user_id: p.id });
  check("paid access stays locked until checkout succeeds", before === false, before);
  const { data: docs } = await client.from("documents").select("id");
  check("all 4 existing records kept and readable", docs?.length === 4, docs?.length);
  // Simulate the row payments-webhook writes when Stripe confirms the checkout (customer.subscription.created).
  await admin.from("subscriptions").insert({ user_id: p.id, environment: "live", stripe_customer_id: `cus_synthetic_${RUN}`, stripe_subscription_id: `sub_synthetic_${RUN}`, status: "active", price_id: "standard_annual", current_period_end: days(365) });
  const { data: after } = await client.rpc("user_has_paid_access", { _user_id: p.id });
  check("paid access unlocks once checkout succeeds", after === true, after);
  const ins = await client.from("documents").insert({ user_id: p.id, name: "Synthetic 5th upload", type: "letter", processing_status: "pending" });
  check("5th upload allowed on paid plan", !ins.error, ins.error?.message);
  const { data: st2 } = await client.rpc("get_my_pilot_status");
  check("status reports paid", st2?.paid === true, st2);
}

// 2. Stay on the free plan, already above the free limit.
current = "Free (above limit)";
{
  const p = await makePatient("Free", orgEnded, { docs: 5, scans: 1 });
  await endPilot(p.id);
  const { client } = await signIn(p.email, p.password);
  const { data: st } = await client.rpc("record_pilot_choice", { _choice: "free" });
  check("choice recorded as free", st?.choice === "free", st);
  check("status flags 5 documents over the 3-document free limit", st?.over_free_limit === true && st?.documents === 5, st);
  const { data: docs } = await client.from("documents").select("id, file_path");
  check("all 5 existing documents still readable", docs?.length === 5, docs?.length);
  let downloads = 0;
  for (const d of docs ?? []) { const r = await client.storage.from("medical-documents").download(d.file_path!); if (!r.error) downloads++; }
  check("all 5 originals still downloadable", downloads === 5, downloads);
  const { data: studies } = await client.from("imaging_studies").select("id");
  const dcm = await client.storage.from("medical-documents").download(`${p.id}/dicom/${studies?.[0]?.id}/series1/0.dcm`);
  check("existing scan still readable and downloadable", studies?.length === 1 && !dcm.error, dcm.error?.message);
  const ins = await client.from("documents").insert({ user_id: p.id, name: "Synthetic new upload", type: "letter", processing_status: "pending" });
  check("new upload blocked by free-plan limit", /free_document_limit_reached/.test(ins.error?.message ?? ""), ins.error?.message);
  const { data: can } = await client.rpc("user_can_upload_document", { _user_id: p.id });
  check("upload check reports no room on free plan", can === false, can);
  const share = await client.from("shared_briefs").insert({ user_id: p.id, token: `free${RUN}`.padEnd(40, "y"), scope: "full", expires_at: days(7) });
  check("paid feature (share brief) blocked on free plan", !!share.error, share.error?.message);
  const scan = await client.from("imaging_studies").insert({ user_id: p.id, study_uid: "1.2.3.free", source: "patient", status: "ready" });
  check("adding new scans blocked on free plan", !!scan.error, scan.error?.message);
  const exp = await buildDataExport(client as unknown as SupabaseClient, p.id);
  check("free patient can still download a full copy of their data", exp.counts.originals === 5 && exp.counts.scanFiles === 4 && exp.counts.missing.length === 0, exp.counts);
}

// 3. Close my account (with download first).
current = "Close account";
{
  const p = await makePatient("Close", orgEnded, { docs: 3, scans: 1, extras: true });
  await endPilot(p.id);
  const second = await signIn(p.email, p.password); // a second device
  const { client, session } = await signIn(p.email, p.password);
  const exp = await buildDataExport(client as unknown as SupabaseClient, p.id);
  const zip = unzipSync(new Uint8Array(await exp.blob.arrayBuffer()));
  const names = Object.keys(zip);
  const health = JSON.parse(strFromU8(zip["health-data.json"]));
  check("download offered first: ZIP has health data, 3 originals and 4 scan files", exp.counts.originals === 3 && exp.counts.scanFiles === 4 && names.includes("health-data.json"), { originals: exp.counts.originals, scans: exp.counts.scanFiles });
  check("health data includes extracted results and medications", health.documents.length === 3 && health.medications.length === 1 && health.allergies.length === 1, Object.keys(health));
  check("export leaves out billing identifiers", !("stripe_customer_id" in (health.profile ?? {})), Object.keys(health.profile ?? {}));
  const before = await countFor(p.id);
  const wrong = await callClose(session!.access_token, { action: "request", confirmation: "delete" });
  check("nothing happens without typing DELETE exactly", wrong.status === 400 && (await countFor(p.id)).documents === 3, wrong.status);
  const res = await callClose(session!.access_token, { action: "request", confirmation: "DELETE", source: "end_of_pilot" });
  const body = await res.json();
  check("deletion completes", body.status === "completed", body);
  const after = await countFor(p.id);
  const leftovers = Object.entries(after).filter(([, n]) => n !== 0);
  check("documents, extracted data, translations, scans, shares, partner link and files all gone", leftovers.length === 0, { before, leftovers });
  const refresh = await second.client.auth.refreshSession({ refresh_token: second.session!.refresh_token });
  check("other device's session revoked", !!refresh.error, refresh.error?.message);
  const again = await signIn(p.email, p.password);
  check("cannot sign in after closing", !!again.error, again.error?.message);
  const row = JSON.parse(await psql(`select row_to_json(r) from (select status, user_id, attempts, last_error, steps_done from public.account_deletion_requests where id='${body.id}') r`));
  check("deletion record keeps no personal data", row.status === "completed" && row.user_id === null && row.last_error === null, row);
  const subsKept = await psql(`select count(*) from public.subscriptions where user_id='${p.id}'`);
  check("no billing rows existed to keep for this patient", subsKept === "0", subsKept);
  const emailRows = await psql(`select (select count(*) from public.email_send_log where lower(recipient_email)=lower('${p.email}')) + (select count(*) from public.partner_patient_links where lower(invited_email)=lower('${p.email}'))`);
  check("email log entries and partner invite with their address removed", emailRows === "0", emailRows);
}

// 4. Failed deletion, then retried.
current = "Failed deletion, retried";
{
  const p = await makePatient("Retry", orgEnded, { docs: 3, scans: 1, extras: true });
  await endPilot(p.id);
  const { session } = await signIn(p.email, p.password);
  // Simulate a database outage during the row-deletion step for this patient only.
  await psql(`create or replace function public._staging_fail() returns trigger language plpgsql as $$ begin raise exception 'simulated database outage'; end $$;
    create trigger _staging_fail before delete on public.medications for each row when (old.user_id = '${p.id}') execute function public._staging_fail();`);
  const res = await callClose(session!.access_token, { action: "request", confirmation: "DELETE", source: "end_of_pilot" });
  const body = await res.json();
  check("first attempt fails at the database step and is saved for retry", body.status === "failed" && body.step === "db_rows", body);
  const mid = await countFor(p.id);
  check("files already removed before the failure stay removed", mid.storage_objects === 0, mid);
  check("no half-deleted records: all rows still intact for the retry", mid.documents === 3 && mid.medications === 1 && mid.profiles === 1, mid);
  check("share links already revoked", Number(await psql(`select count(*) from public.shared_briefs where user_id='${p.id}' and revoked_at is null`)) === 0);
  const blocked = await signIn(p.email, p.password);
  check("patient cannot sign back in while deletion is pending", !!blocked.error, blocked.error?.message);
  const notDue = await (await handle(new Request("http://local", { method: "POST", headers: { Authorization: `Bearer ${SERVICE}` }, body: JSON.stringify({ action: "process" }) }))).json();
  check("scheduled worker waits for the back-off before retrying", !notDue.results.some((r: { id: string }) => r.id === body.id), notDue);
  const unauth = await handle(new Request("http://local", { method: "POST", headers: { Authorization: `Bearer ${ANON}` }, body: JSON.stringify({ action: "process" }) }));
  check("worker refuses callers without the service key", unauth.status === 401, unauth.status);
  await psql(`drop trigger _staging_fail on public.medications; drop function public._staging_fail();`);
  await psql(`update public.account_deletion_requests set next_attempt_at = now() where id='${body.id}'`); // time passes
  const retry = await (await handle(new Request("http://local", { method: "POST", headers: { Authorization: `Bearer ${SERVICE}` }, body: JSON.stringify({ action: "process" }) }))).json();
  const mine = retry.results.find((r: { id: string }) => r.id === body.id);
  check("retry completes the deletion", mine?.status === "completed" && mine?.attempts === 2, retry);
  const after = await countFor(p.id);
  check("everything gone after retry", Object.values(after).every((n) => n === 0), after);
  const third = await (await handle(new Request("http://local", { method: "POST", headers: { Authorization: `Bearer ${SERVICE}` }, body: JSON.stringify({ action: "process" }) }))).json();
  check("running the worker again does nothing (safe to repeat)", !third.results.some((r: { id: string }) => r.id === body.id), third);
}

// 5. No response.
current = "No response";
{
  const p = await makePatient("Silent", orgEnded, { docs: 4 });
  await endPilot(p.id);
  const { client, error } = await signIn(p.email, p.password);
  check("can still sign in after the pilot ends", !error, error?.message);
  const { data: st } = await client.rpc("get_my_pilot_status");
  check("three choices still offered (ended, no choice yet)", st?.ended === true && st?.choice === null && st?.enabled === true, st);
  const { data: paid } = await client.rpc("user_has_paid_access", { _user_id: p.id });
  check("pilot access ended", paid === false, paid);
  const subs = await psql(`select count(*) from public.subscriptions where user_id='${p.id}'`);
  check("not charged (no subscription created)", subs === "0", subs);
  const del = await psql(`select count(*) from public.account_deletion_requests where user_id='${p.id}'`);
  check("not treated as a deletion request", del === "0", del);
  const { data: docs } = await client.from("documents").select("id");
  check("all 4 records kept and readable", docs?.length === 4, docs?.length);
  const ins = await client.from("documents").insert({ user_id: p.id, name: "Synthetic new upload", type: "letter", processing_status: "pending" });
  check("free-plan limit applies to new uploads", /free_document_limit_reached/.test(ins.error?.message ?? ""), ins.error?.message);
}

// 6. Off switch.
current = "Switched off";
{
  await psql("update public.admin_settings set end_of_pilot_enabled = false where id = 1");
  const p = await makePatient("Off", orgEnded, { docs: 1 });
  await endPilot(p.id);
  const { client } = await signIn(p.email, p.password);
  const { data: st } = await client.rpc("get_my_pilot_status");
  check("with the switch off, patients are not shown the choice screen", st?.enabled === false, st);
}

const failed = results.filter((r) => !r.ok);
await Deno.writeTextFile(Deno.env.get("RESULTS_FILE") ?? "end_of_pilot_results.json", JSON.stringify({ run: RUN, at: new Date().toISOString(), results }, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) Deno.exit(1);
