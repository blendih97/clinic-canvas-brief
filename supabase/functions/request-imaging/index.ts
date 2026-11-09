// Hospital upload of full DICOM studies through a patient's records-request link (no login).
// The browser reads the files and groups them into studies; this function only checks the
// request token and hands out upload slots inside the patient's own study folder.
//
// { token, action: "begin", study: {...summary} }            -> { studyId }
// { token, action: "sign", studyId, sops: string[] }          -> { uploads: [{ sop, path, token }] }  (max 200)
// { token, action: "finish", studyId, manifest }              -> { ok }  (writes manifest, marks ready)
// { token, action: "complete", studies: number }              -> { ok }  (marks the request received)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const BUCKET = "medical-documents";
const UID = /^[0-9.]{1,64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_INSTANCES = 20000;
const clip = (v: unknown, n: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, n) : null);
const dateOrNull = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

const folder = (userId: string, studyId: string) => `${userId}/dicom/${studyId}`;
const instancePath = (userId: string, studyId: string, sop: string) => `${folder(userId, studyId)}/${sop.replace(/[^0-9.]/g, "_")}.dcm`;

// deno-lint-ignore no-explicit-any
function summarise(m: any) {
  // deno-lint-ignore no-explicit-any
  const series: any[] = Array.isArray(m?.series) ? m.series : [];
  const instances = series.reduce((n, s) => n + (Array.isArray(s.instances) ? s.instances.length : 0), 0);
  // deno-lint-ignore no-explicit-any
  const size = series.reduce((n, s) => n + (Array.isArray(s.instances) ? s.instances.reduce((k: number, i: any) => k + (Number(i.size) || 0), 0) : 0), 0);
  return {
    series_count: series.length,
    instance_count: instances,
    size_bytes: size,
    volumetric: series.some((s) => s.volumetric === true),
    modalities: Array.isArray(m?.modalities) ? m.modalities.filter((x: unknown) => typeof x === "string").slice(0, 10) : [],
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const { token, action } = body ?? {};
    if (!token || typeof token !== "string" || token.length < 16) return json({ error: "invalid_token" }, 400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: request } = await supabase.from("record_requests")
      .select("id, user_id, status, expires_at, provider_name").eq("token", token).maybeSingle();
    if (!request) return json({ error: "not_found" }, 404);
    if (new Date(request.expires_at) < new Date()) return json({ error: "expired" }, 410);
    if (request.status === "received" && action !== "finish") return json({ error: "already_received" }, 409);
    const userId = request.user_id as string;

    // The study must belong to this patient and have been started through this request.
    const loadStudy = async (studyId: unknown) => {
      if (typeof studyId !== "string" || !UUID.test(studyId)) return null;
      const { data } = await supabase.from("imaging_studies").select("*").eq("id", studyId).eq("user_id", userId).maybeSingle();
      if (!data || data.record_request_id !== request.id) return null;
      return data;
    };

    if (action === "begin") {
      const s = body.study ?? {};
      const studyUid = typeof s.studyUid === "string" && UID.test(s.studyUid) ? s.studyUid : null;
      if (!studyUid) return json({ error: "invalid_study" }, 400);
      const { data: existing } = await supabase.from("imaging_studies").select("id, record_request_id, status").eq("user_id", userId).eq("study_uid", studyUid).maybeSingle();
      if (existing) {
        // Already in the patient's account (perhaps added by the patient): nothing more is needed.
        if (existing.record_request_id !== request.id) return json({ studyId: existing.id, alreadyHave: true });
        return json({ studyId: existing.id });
      }
      const { data, error } = await supabase.from("imaging_studies").insert({
        user_id: userId, study_uid: studyUid, source: "request", record_request_id: request.id, status: "uploading",
        title: clip(s.title, 200), description: clip(s.description, 200), body_part: clip(s.bodyPart, 80),
        study_date: dateOrNull(s.studyDate), institution: clip(s.institution, 200) ?? clip(request.provider_name, 200),
        accession: clip(s.accession, 64), patient_name: clip(s.patientName, 200),
        modalities: Array.isArray(s.modalities) ? s.modalities.filter((x: unknown) => typeof x === "string").slice(0, 10) : [],
      }).select("id").single();
      if (error) return json({ error: "could_not_start" }, 500);
      return json({ studyId: data.id });
    }

    if (action === "sign") {
      const study = await loadStudy(body.studyId);
      if (!study) return json({ error: "not_found" }, 404);
      const sops: unknown[] = Array.isArray(body.sops) ? body.sops.slice(0, 200) : [];
      const uploads = [];
      for (const sop of sops) {
        if (typeof sop !== "string" || !UID.test(sop)) continue;
        const path = instancePath(userId, study.id, sop);
        const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: true });
        if (error || !data) return json({ error: "could_not_sign" }, 500);
        uploads.push({ sop, path, token: data.token });
      }
      return json({ uploads });
    }

    if (action === "finish") {
      const study = await loadStudy(body.studyId);
      if (!study) return json({ error: "not_found" }, 404);
      const m = body.manifest;
      if (!m || m.version !== 1 || m.studyUid !== study.study_uid || !Array.isArray(m.series)) return json({ error: "invalid_manifest" }, 400);
      const prefix = `${folder(userId, study.id)}/`;
      let count = 0;
      // Every instance must point inside this study's folder, at the name the server issued.
      for (const s of m.series) {
        if (!Array.isArray(s?.instances)) return json({ error: "invalid_manifest" }, 400);
        for (const i of s.instances) {
          count++;
          if (typeof i?.sop !== "string" || !UID.test(i.sop) || i.path !== instancePath(userId, study.id, i.sop) || !String(i.path).startsWith(prefix)) {
            return json({ error: "invalid_manifest" }, 400);
          }
        }
      }
      if (count === 0 || count > MAX_INSTANCES) return json({ error: "invalid_manifest" }, 400);
      const manifestPath = `${prefix}manifest.json`;
      const { error: upErr } = await supabase.storage.from(BUCKET)
        .upload(manifestPath, new Blob([JSON.stringify(m)], { type: "application/json" }), { upsert: true, contentType: "application/json" });
      if (upErr) return json({ error: "could_not_save" }, 500);
      await supabase.from("imaging_studies").update({ ...summarise(m), manifest_path: manifestPath, status: "ready" }).eq("id", study.id);
      return json({ ok: true });
    }

    if (action === "complete") {
      const n = Math.max(1, Math.min(50, Number(body.studies) || 1));
      await supabase.from("record_requests").update({ status: "received" }).eq("id", request.id);
      await supabase.from("alerts").insert({
        user_id: userId, type: "records_received",
        message: `${request.provider_name} sent ${n} ${n === 1 ? "scan" : "scans"} for your request. You'll find ${n === 1 ? "it" : "them"} in Imaging.`,
      });
      return json({ ok: true });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (_e) {
    return json({ error: "server_error" }, 500);
  }
});
