// Public token-gated lookup for shared_briefs.
// Anonymous recipient supplies the share token; service role returns that brief only.
//
// { token }                -> the brief (documents include RinVita's reading, never storage paths)
// { token, documentId }    -> a short-lived URL for ONE original file in that brief, issued only if
//                             the brief is valid (not revoked/expired), the patient shared that
//                             file, and the document belongs to the brief's owner.
// { token, studyId }       -> ONE shared scan's manifest with short-lived URLs for its images, issued
//                             only if the patient included that scan and it is still theirs.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FILE_URL_SECONDS = 120;
const STUDY_URL_SECONDS = 2 * 3600;

// Fields of a shared document the recipient may see.
const publicDoc = (d: any) => ({
  id: d?.id ?? null, name: d?.name ?? null, type: d?.type ?? null, date: d?.date ?? null,
  facility: d?.facility ?? null, country: d?.country ?? null, summary: d?.summary ?? null,
  contentTranslated: d?.contentTranslated ?? null, contentOriginal: d?.contentOriginal ?? null,
  originalLanguageCode: d?.originalLanguageCode ?? null, translatedLanguageCode: d?.translatedLanguageCode ?? null,
  fileShared: d?.fileShared === true,
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token, documentId, studyId } = await req.json().catch(() => ({}));
    if (!token || typeof token !== "string" || token.length < 16) return json({ error: "invalid_token" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("shared_briefs")
      .select("token, scope, expires_at, revoked_at, blood_results, medications, allergies, no_known_allergies, imaging_results, imaging_studies, documents, created_at, user_id")
      .eq("token", token)
      .maybeSingle();

    if (error) return json({ error: "lookup_failed" }, 500);
    if (!data) return json({ brief: null });
    if (data.revoked_at) return json({ brief: null, revoked: true });
    if (data.expires_at && new Date(data.expires_at) < new Date()) return json({ brief: null, expired: true });

    const ownerId = data.user_id as string | null;
    const docs: any[] = Array.isArray(data.documents) ? data.documents : [];
    const sharedStudies: any[] = Array.isArray((data as any).imaging_studies) ? (data as any).imaging_studies : [];

    // One shared scan, with signed URLs for every image.
    if (studyId !== undefined) {
      if (typeof studyId !== "string" || !UUID.test(studyId) || !ownerId) return json({ error: "not_found" }, 404);
      if (!sharedStudies.some((x) => x?.id === studyId)) return json({ error: "not_shared" }, 403);
      const { data: study } = await supabase.from("imaging_studies")
        .select("id, user_id, manifest_path, status").eq("id", studyId).eq("user_id", ownerId).maybeSingle();
      if (!study || study.status !== "ready" || !study.manifest_path) return json({ error: "not_found" }, 404);
      const prefix = `${ownerId}/dicom/${study.id}/`;
      if (!String(study.manifest_path).startsWith(prefix)) return json({ error: "not_found" }, 404);
      const { data: file } = await supabase.storage.from("medical-documents").download(study.manifest_path);
      if (!file) return json({ error: "not_found" }, 404);
      const manifest = JSON.parse(await file.text());
      const paths: string[] = [];
      for (const se of manifest.series || []) for (const i of se.instances || []) {
        if (typeof i?.path === "string" && i.path.startsWith(prefix)) paths.push(i.path);
      }
      const urls = new Map<string, string>();
      for (let i = 0; i < paths.length; i += 500) {
        const { data: signed } = await supabase.storage.from("medical-documents").createSignedUrls(paths.slice(i, i + 500), STUDY_URL_SECONDS);
        signed?.forEach((d: any) => { if (d?.path && d?.signedUrl) urls.set(d.path, d.signedUrl); });
      }
      manifest.series = (manifest.series || []).map((se: any) => ({
        ...se, instances: (se.instances || []).filter((i: any) => urls.has(i.path)).map((i: any) => ({ ...i, path: urls.get(i.path) })),
      })).filter((se: any) => se.instances.length);
      return json({ manifest, expiresIn: STUDY_URL_SECONDS });
    }

    // One original file, on request.
    if (documentId !== undefined) {
      if (typeof documentId !== "string" || !UUID.test(documentId) || !ownerId) return json({ error: "not_found" }, 404);
      const shared = docs.find((d) => d?.id === documentId);
      if (!shared || shared.fileShared !== true) return json({ error: "not_shared" }, 403);

      const { data: doc } = await supabase.from("documents")
        .select("id, user_id, name, file_path, file_url")
        .eq("id", documentId).eq("user_id", ownerId).maybeSingle();
      if (!doc) return json({ error: "not_found" }, 404);

      const legacy = doc.file_url && !/^https?:/i.test(doc.file_url) && doc.file_url.startsWith(`${ownerId}/`) ? doc.file_url : null;
      const path = doc.file_path && doc.file_path.startsWith(`${ownerId}/`) ? doc.file_path : legacy;
      if (!path) return json({ error: "no_file" }, 404);

      const { data: signed, error: signErr } = await supabase.storage
        .from("medical-documents")
        .createSignedUrl(path, FILE_URL_SECONDS);
      if (signErr || !signed?.signedUrl) return json({ error: "no_file" }, 404);

      const kind = /\.pdf$/i.test(path) || /\.pdf$/i.test(doc.name || "") ? "pdf"
        : /\.(jpe?g|png|gif|webp)$/i.test(path) || /\.(jpe?g|png|gif|webp)$/i.test(doc.name || "") ? "image" : "other";
      return json({ url: signed.signedUrl, kind, expiresIn: FILE_URL_SECONDS });
    }

    // Scans: the patient's chosen summary, plus a short-lived card image for each still present.
    let studies: any[] = [];
    if (sharedStudies.length && ownerId) {
      const ids = sharedStudies.map((x) => x?.id).filter((x) => typeof x === "string" && UUID.test(x));
      const { data: live } = await supabase.from("imaging_studies").select("id, key_image_path, status").eq("user_id", ownerId).in("id", ids);
      const byId = new Map((live || []).map((x: any) => [x.id, x]));
      const keyPaths = (live || []).filter((x: any) => x.key_image_path && String(x.key_image_path).startsWith(`${ownerId}/dicom/${x.id}/`)).map((x: any) => x.key_image_path);
      const keyUrls = new Map<string, string>();
      if (keyPaths.length) {
        const { data: signed } = await supabase.storage.from("medical-documents").createSignedUrls(keyPaths, STUDY_URL_SECONDS);
        signed?.forEach((d: any) => { if (d?.path && d?.signedUrl) keyUrls.set(d.path, d.signedUrl); });
      }
      studies = sharedStudies.filter((x) => (byId.get(x.id) as any)?.status === "ready").map((x) => ({
        id: x.id, title: x.title ?? null, date: x.date ?? null, institution: x.institution ?? null,
        modalities: Array.isArray(x.modalities) ? x.modalities : [], seriesCount: x.seriesCount ?? 0, instanceCount: x.instanceCount ?? 0,
        volumetric: x.volumetric === true, reportName: x.reportName ?? null,
        keyImageUrl: keyUrls.get((byId.get(x.id) as any)?.key_image_path) ?? null,
      }));
    }

    const { user_id: _omit, documents: _docs, imaging_studies: _studies, ...rest } = data as any;
    return json({ brief: { ...rest, documents: docs.map(publicDoc), imaging_studies: studies } });
  } catch (_e) {
    return json({ error: "server_error" }, 500);
  }
});
