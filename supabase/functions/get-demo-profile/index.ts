// Read-only demo of a fictional patient's account, opened with a demo link (no login).
// Only users listed in public.demo_accounts can be exposed; links expire or can be revoked.
//
// { token }               -> { profile, vault, brief, link }  (vault: the app's own shapes; brief: the doctor-page shape)
// { token, documentId }   -> a short-lived URL for one of the demo patient's original files
// { token, studyId }      -> one scan's manifest with short-lived image URLs
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BUCKET = "medical-documents";
const FILE_SECONDS = 120;
const STUDY_SECONDS = 2 * 3600;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { token, documentId, studyId } = await req.json().catch(() => ({}));
    if (!token || typeof token !== "string" || token.length < 20) return json({ error: "invalid_token" }, 400);
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: link } = await sb.from("demo_links").select("token, label, demo_user_id, expires_at, revoked_at, brand_name, brand_logo_url, brand_tagline").eq("token", token).maybeSingle();
    if (!link || link.revoked_at || (link.expires_at && new Date(link.expires_at) < new Date())) return json({ demo: null, expired: true });
    const { data: account } = await sb.from("demo_accounts").select("user_id").eq("user_id", link.demo_user_id).maybeSingle();
    if (!account) return json({ demo: null, expired: true });
    const uid = account.user_id as string;

    if (documentId !== undefined) {
      if (typeof documentId !== "string" || !UUID.test(documentId)) return json({ error: "not_found" }, 404);
      const { data: doc } = await sb.from("documents").select("id, name, file_path, file_url").eq("id", documentId).eq("user_id", uid).maybeSingle();
      const path = doc?.file_path?.startsWith(`${uid}/`) ? doc.file_path
        : doc?.file_url && !/^https?:/i.test(doc.file_url) && doc.file_url.startsWith(`${uid}/`) ? doc.file_url : null;
      if (!doc || !path) return json({ error: "no_file" }, 404);
      const { data: signed } = await sb.storage.from(BUCKET).createSignedUrl(path, FILE_SECONDS);
      if (!signed?.signedUrl) return json({ error: "no_file" }, 404);
      const kind = /\.pdf$/i.test(path) ? "pdf" : /\.(jpe?g|png|gif|webp)$/i.test(path) ? "image" : "other";
      return json({ url: signed.signedUrl, kind, expiresIn: FILE_SECONDS });
    }

    if (studyId !== undefined) {
      if (typeof studyId !== "string" || !UUID.test(studyId)) return json({ error: "not_found" }, 404);
      const { data: st } = await sb.from("imaging_studies").select("id, manifest_path, status").eq("id", studyId).eq("user_id", uid).maybeSingle();
      const prefix = `${uid}/dicom/${studyId}/`;
      if (!st || st.status !== "ready" || !st.manifest_path?.startsWith(prefix)) return json({ error: "not_found" }, 404);
      const { data: file } = await sb.storage.from(BUCKET).download(st.manifest_path);
      if (!file) return json({ error: "not_found" }, 404);
      const manifest = JSON.parse(await file.text());
      const paths: string[] = [];
      for (const se of manifest.series || []) for (const i of se.instances || []) if (String(i?.path || "").startsWith(prefix)) paths.push(i.path);
      const urls = new Map<string, string>();
      for (let i = 0; i < paths.length; i += 500) {
        const { data: signed } = await sb.storage.from(BUCKET).createSignedUrls(paths.slice(i, i + 500), STUDY_SECONDS);
        signed?.forEach((d: any) => { if (d?.path && d?.signedUrl) urls.set(d.path, d.signedUrl); });
      }
      manifest.series = (manifest.series || []).map((se: any) => ({
        ...se, instances: (se.instances || []).filter((i: any) => urls.has(i.path)).map((i: any) => ({ ...i, path: urls.get(i.path) })),
      })).filter((se: any) => se.instances.length);
      return json({ manifest, expiresIn: STUDY_SECONDS });
    }

    // Whole account, read only.
    const [prof, blood, imaging, meds, docs, allergies, alerts, studies] = await Promise.all([
      sb.from("profiles").select("full_name, date_of_birth, biological_sex, nationality, blood_type, current_diagnoses, no_known_allergies").eq("id", uid).maybeSingle(),
      sb.from("blood_results").select("*").eq("user_id", uid),
      sb.from("imaging_results").select("*").eq("user_id", uid),
      sb.from("medications").select("*").eq("user_id", uid),
      sb.from("documents").select("*").eq("user_id", uid).order("date", { ascending: false }),
      sb.from("allergies").select("*").eq("user_id", uid),
      sb.from("alerts").select("type, message").eq("user_id", uid).in("type", ["critical", "flagged"]),
      sb.from("imaging_studies").select("*").eq("user_id", uid).eq("status", "ready").order("study_date", { ascending: false, nullsFirst: false }),
    ]);

    const vault = {
      bloodResults: (blood.data || []).map((r: any) => ({
        id: r.id, marker: r.marker, value: Number(r.value), unit: r.unit, range: r.range || "", status: r.status,
        trend: Array.isArray(r.trend) ? r.trend : [], date: r.date || "", source: r.source || "",
      })),
      imagingResults: (imaging.data || []).map((r: any) => ({
        id: r.id, type: r.type, region: r.region || "", date: r.date || "", facility: r.facility || "",
        finding: r.finding || "", findingOriginal: r.finding_original || "", status: r.status, originalLang: r.original_lang || "",
      })),
      medications: (meds.data || []).map((r: any) => ({
        id: r.id, name: r.name, dose: r.dose || "", frequency: r.frequency || "", prescriber: r.prescriber || "",
        facility: r.facility || "", date: r.date || "", active: r.active, source: r.source || "ai",
      })),
      documents: (docs.data || []).map((r: any) => ({
        id: r.id, name: r.name, type: r.type || "", date: r.date || "", facility: r.facility || "", country: r.country || "",
        pages: r.pages || 1, extracted: !!r.extracted, summary: r.summary || undefined,
        contentOriginal: r.content_original || undefined, contentTranslated: r.content_translated || undefined,
        originalLanguageCode: r.original_language_code || undefined, translatedLanguageCode: r.translated_language_code || undefined,
        processingStatus: r.processing_status || undefined, fileShared: !!(r.file_path || r.file_url),
      })),
      allergies: Object.values((allergies.data || []).reduce((acc: Record<string, any>, r: any) => {
        const k = String(r.substance || "").trim().toLowerCase();
        if (!acc[k] || String(r.reaction || "").length > String(acc[k].reaction || "").length) acc[k] = r;
        return acc;
      }, {})).map((r: any) => ({ id: r.id, substance: r.substance, reaction: r.reaction || "", severity: r.severity || "", source: r.source || "ai" })),
      alerts: alerts.data || [],
    };

    // Scans with a short-lived card image each.
    const st = (studies.data || []) as any[];
    const keyPaths = st.filter((s) => s.key_image_path?.startsWith(`${uid}/dicom/${s.id}/`)).map((s) => s.key_image_path);
    const keyUrls = new Map<string, string>();
    if (keyPaths.length) {
      const { data: signed } = await sb.storage.from(BUCKET).createSignedUrls(keyPaths, STUDY_SECONDS);
      signed?.forEach((d: any) => { if (d?.path && d?.signedUrl) keyUrls.set(d.path, d.signedUrl); });
    }
    const docName = new Map(vault.documents.map((d: any) => [d.id, d.name]));
    const scans = st.map((s) => ({
      id: s.id, title: s.title, date: s.study_date, institution: s.institution, modalities: s.modalities || [],
      seriesCount: s.series_count, instanceCount: s.instance_count, volumetric: s.volumetric,
      reportName: s.document_id ? docName.get(s.document_id) ?? null : null, keyImageUrl: keyUrls.get(s.key_image_path) ?? null,
    }));

    const p = prof.data || {};
    const activeMeds = vault.medications;
    const brief = {
      token, scope: "Demo: full health history", expires_at: link.expires_at || new Date(Date.now() + 30 * 864e5).toISOString(),
      created_at: new Date().toISOString(),
      blood_results: vault.bloodResults, medications: activeMeds, allergies: vault.allergies,
      no_known_allergies: !!(p as any).no_known_allergies && vault.allergies.length === 0,
      imaging_results: vault.imagingResults, imaging_studies: scans,
      documents: vault.documents.map((d: any) => ({
        id: d.id, name: d.name, type: d.type, date: d.date, facility: d.facility, country: d.country, summary: d.summary ?? null,
        contentTranslated: d.contentTranslated ?? null, contentOriginal: d.contentOriginal ?? null,
        originalLanguageCode: d.originalLanguageCode ?? null, translatedLanguageCode: d.translatedLanguageCode ?? null, fileShared: d.fileShared,
      })),
    };

    await sb.rpc("demo_link_opened", { _token: token });
    const brand = link.brand_name ? { name: link.brand_name, logoUrl: link.brand_logo_url || null, tagline: link.brand_tagline || null } : null;
    return json({ demo: { label: link.label, expiresAt: link.expires_at, brand, profile: p, vault, scans, brief } });
  } catch (_e) {
    return json({ error: "server_error" }, 500);
  }
});
