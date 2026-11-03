// Analyses a document from the original file kept in storage: retries a failed
// upload, or reads a stored-but-never-analysed record (e.g. received from a provider).
// Callable by the document's owner or an admin. Quota is enforced by
// analyse-document (failed documents never counted towards it).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { persistExtraction } from "../_shared/persistExtraction.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const imageMimeFromPath = (p: string) => /\.png$/i.test(p) ? "image/png" : /\.gif$/i.test(p) ? "image/gif" : /\.webp$/i.test(p) ? "image/webp" : "image/jpeg";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toBase64 = (buf: ArrayBuffer): string => {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)) as any);
  }
  return btoa(binary);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
  if (!jwt) return json({ error: "Not authenticated" }, 401);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  const callerId = userData?.user?.id;
  if (userErr || !callerId) return json({ error: "Not authenticated" }, 401);

  let documentId = "";
  try { documentId = String((await req.json())?.documentId || ""); } catch { /* invalid */ }
  if (!UUID.test(documentId)) return json({ error: "documentId is required" }, 400);

  const { data: doc } = await admin.from("documents")
    .select("id,user_id,name,file_path,file_url,processing_status,date,facility")
    .eq("id", documentId).maybeSingle();
  if (!doc) return json({ error: "Document not found" }, 404);

  if (doc.user_id !== callerId) {
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: callerId, _role: "admin" });
    if (!isAdmin) return json({ error: "Document not found" }, 404);
  }
  const ANALYSABLE = new Set(["failed", "stored", "pending"]);
  if (!ANALYSABLE.has(String(doc.processing_status || ""))) return json({ error: "This document has already been analysed", code: "not_failed" }, 409);
  // Older received records kept the storage path in file_url only. Only paths inside the owner's own folder are accepted.
  const legacyPath = doc.file_url && !/^https?:/i.test(doc.file_url) && doc.file_url.startsWith(`${doc.user_id}/`) ? doc.file_url : null;
  const storagePath: string | null = doc.file_path || legacyPath;
  const alreadyCounted = doc.processing_status !== "failed"; // stored/pending already use a document slot
  if (!storagePath) return json({ error: "The original file wasn't kept for this upload, so it can't be retried. Please upload it again.", code: "no_file" }, 409);

  const { data: blob, error: dlErr } = await admin.storage.from("medical-documents").download(storagePath);
  if (dlErr || !blob) return json({ error: "Original file could not be loaded", code: "no_file" }, 409);

  const mime = blob.type || "";
  const isPdf = mime === "application/pdf" || /\.pdf$/i.test(storagePath);
  const isImage = mime.startsWith("image/") || /\.(jpe?g|png|gif|webp)$/i.test(storagePath);
  if (!isPdf && !isImage) return json({ error: "Only PDFs and images can be analysed", code: "unsupported" }, 409);

  const { data: profile } = await admin.from("profiles")
    .select("preferred_translation_language").eq("id", doc.user_id).maybeSingle();
  const targetLanguage = profile?.preferred_translation_language || "en";

  await admin.from("documents").update({ processing_status: "processing", processing_started_at: new Date().toISOString() }).eq("id", doc.id);

  const { data: extracted, error: aiError } = await admin.functions.invoke("analyse-document", {
    body: {
      fileType: isPdf ? "pdf" : "image",
      mediaType: isPdf ? "application/pdf" : (mime.startsWith("image/") ? mime : imageMimeFromPath(storagePath)),
      base64: toBase64(await blob.arrayBuffer()),
      fileName: doc.name,
      targetLanguage,
      forUserId: doc.user_id,
      alreadyCounted,
    },
  });

  if (aiError || !extracted) {
    let reason = "Analysis failed";
    let code: string | undefined;
    try {
      const body = await (aiError as any)?.context?.json?.();
      reason = body?.error || reason;
      code = body?.code;
    } catch { /* keep generic */ }
    await admin.from("documents").update({ processing_status: "failed", processing_error: String(reason).slice(0, 500) }).eq("id", doc.id);
    return json({ error: reason, code: code || "analysis_failed" }, code === "free_document_limit_reached" ? 402 : 502);
  }

  const meta = extracted.documentMeta || {};
  const docDate = meta.date || doc.date || new Date().toISOString().split("T")[0];
  const docFacility = meta.facility || doc.facility || "";

  const { error: updErr } = await admin.from("documents").update({
    name: meta.name || doc.name,
    type: meta.type || "Other",
    date: docDate,
    facility: docFacility,
    country: meta.country || "",
    pages: meta.pages || 1,
    extracted: true,
    file_path: storagePath,
    original_language: meta.originalLang || extracted.fullText?.original_language_code || null,
    original_language_code: extracted.fullText?.original_language_code || null,
    translated_language_code: extracted.fullText?.translated_language_code || targetLanguage,
    content_original: extracted.fullText?.original_content || null,
    content_translated: extracted.fullText?.translated_content || null,
    summary: extracted.summary || null,
    processing_status: "completed",
    processing_error: null,
    processed_at: new Date().toISOString(),
  }).eq("id", doc.id);
  if (updErr) {
    await admin.from("documents").update({ processing_status: "failed", processing_error: updErr.message.slice(0, 500) }).eq("id", doc.id);
    return json({ error: updErr.message.includes("free_document_limit_reached") ? "You have used all 3 documents on the free plan." : "Could not save the result", code: updErr.message.includes("free_document_limit_reached") ? "free_document_limit_reached" : "save_failed" }, 500);
  }

  await persistExtraction(admin, doc.user_id, doc.id, extracted, docDate, docFacility);
  return json({ success: true });
});
