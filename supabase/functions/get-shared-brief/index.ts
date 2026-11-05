// Public token-gated lookup for shared_briefs.
// Anonymous recipient supplies the share token; service role returns that brief only.
//
// { token }                -> the brief (documents include RinVita's reading, never storage paths)
// { token, documentId }    -> a short-lived URL for ONE original file in that brief, issued only if
//                             the brief is valid (not revoked/expired), the patient shared that
//                             file, and the document belongs to the brief's owner.
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
    const { token, documentId } = await req.json().catch(() => ({}));
    if (!token || typeof token !== "string" || token.length < 16) return json({ error: "invalid_token" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("shared_briefs")
      .select("token, scope, expires_at, revoked_at, blood_results, medications, allergies, no_known_allergies, imaging_results, documents, created_at, user_id")
      .eq("token", token)
      .maybeSingle();

    if (error) return json({ error: "lookup_failed" }, 500);
    if (!data) return json({ brief: null });
    if (data.revoked_at) return json({ brief: null, revoked: true });
    if (data.expires_at && new Date(data.expires_at) < new Date()) return json({ brief: null, expired: true });

    const ownerId = data.user_id as string | null;
    const docs: any[] = Array.isArray(data.documents) ? data.documents : [];

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

    const { user_id: _omit, documents: _docs, ...rest } = data as any;
    return json({ brief: { ...rest, documents: docs.map(publicDoc) } });
  } catch (_e) {
    return json({ error: "server_error" }, 500);
  }
});
