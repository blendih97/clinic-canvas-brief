import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const arrayBufferToBase64 = (buf: ArrayBuffer): string => {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
  }
  return btoa(binary);
};

const inferType = (mime: string): "pdf" | "image" | "other" => {
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("image/")) return "image";
  return "other";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const form = await req.formData();
    const token = String(form.get("token") || "");
    const file = form.get("file") as File | null;
    const isLast = String(form.get("isLast") || "false") === "true";
    const totalFiles = parseInt(String(form.get("totalFiles") || "1"), 10);

    if (!token || !file) {
      return new Response(JSON.stringify({ error: "Missing token or file" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate request
    const { data: request, error: reqError } = await supabase
      .from("record_requests")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (reqError || !request) {
      return new Response(JSON.stringify({ error: "Request not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (new Date(request.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Request expired" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (request.status === "received") {
      return new Response(JSON.stringify({ error: "Already received" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload file with service role
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const filePath = `${request.user_id}/received-requests/${request.id}/${Date.now()}-${safeName}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("medical-documents")
      .upload(filePath, arrayBuffer, {
        upsert: true,
        contentType: file.type || "application/octet-stream",
      });
    if (uploadError) throw uploadError;

    // Look up patient's preferred translation language
    const { data: profile } = await supabase
      .from("profiles")
      .select("preferred_translation_language")
      .eq("id", request.user_id)
      .maybeSingle();
    const targetLanguage = profile?.preferred_translation_language || "en";

    // Try AI extraction for PDFs and images
    const fileType = inferType(file.type || "");
    let extracted: any = null;
    let extractionError: string | null = null;

    if (fileType !== "other") {
      try {
        const base64 = arrayBufferToBase64(arrayBuffer);
        const { data: aiData, error: aiError } = await supabase.functions.invoke("analyse-document", {
          body: {
            fileType,
            mediaType: file.type,
            base64,
            fileName: file.name,
            targetLanguage,
          },
        });
        if (aiError) throw aiError;
        extracted = aiData;
      } catch (e: any) {
        console.error("AI extraction failed for received record:", e);
        extractionError = e?.message || "Extraction failed";
      }
    }

    const meta = extracted?.documentMeta || {};
    const docName = meta.name || file.name;
    const docType = meta.type || (fileType === "other" ? "Received Records" : "Other");
    const docDate = meta.date || new Date().toISOString().split("T")[0];
    const docFacility = meta.facility || request.provider_name;
    const docCountry = meta.country || "";
    const docPages = meta.pages || 1;

    const { data: insertedDoc, error: docError } = await supabase
      .from("documents")
      .insert({
        user_id: request.user_id,
        name: docName,
        type: docType,
        date: docDate,
        facility: docFacility,
        country: docCountry,
        pages: docPages,
        extracted: !!extracted,
        file_url: filePath,
        file_path: filePath,
        ai_note: `Received via request from ${request.provider_name}${extractionError ? ` (extraction error: ${extractionError})` : ""}`,
        original_language: meta.originalLang || extracted?.fullText?.original_language_code || null,
        original_language_code: extracted?.fullText?.original_language_code || null,
        translated_language_code: extracted?.fullText?.translated_language_code || (extracted ? targetLanguage : null),
        content_original: extracted?.fullText?.original_content || null,
        content_translated: extracted?.fullText?.translated_content || null,
        summary: extracted?.summary || null,
        processing_status: extracted ? "completed" : (extractionError ? "failed" : "pending"),
        processing_error: extractionError,
        processed_at: extracted ? new Date().toISOString() : null,
      })
      .select("id")
      .single();
    if (docError) throw docError;

    // Persist structured extractions
    if (extracted) {
      const userId = request.user_id;

      if (Array.isArray(extracted.bloodResults) && extracted.bloodResults.length) {
        const rows = extracted.bloodResults
          .filter((b: any) => b && b.marker && b.unit !== undefined && b.value !== undefined)
          .map((b: any) => ({
            user_id: userId,
            marker: String(b.marker),
            value: Number(b.value),
            unit: String(b.unit ?? ""),
            range: b.range ? String(b.range) : null,
            status: b.status || "normal",
            trend: Array.isArray(b.trend) ? b.trend : [],
            date: b.date || docDate,
            source: b.source || docFacility,
          }));
        if (rows.length) await supabase.from("blood_results").insert(rows);
      }

      if (Array.isArray(extracted.imagingResults) && extracted.imagingResults.length) {
        const rows = extracted.imagingResults
          .filter((i: any) => i && i.type)
          .map((i: any) => ({
            user_id: userId,
            type: i.type,
            region: i.region || null,
            date: i.date || docDate,
            facility: i.facility || docFacility,
            finding: i.finding || null,
            status: i.status || "normal",
            original_lang: i.originalLang || null,
          }));
        if (rows.length) await supabase.from("imaging_results").insert(rows);
      }

      if (Array.isArray(extracted.medications) && extracted.medications.length) {
        const rows = extracted.medications
          .filter((m: any) => m && m.name)
          .map((m: any) => ({
            user_id: userId,
            name: m.name,
            dose: m.dose || null,
            frequency: m.frequency || null,
            prescriber: m.prescriber || null,
            facility: m.facility || docFacility,
            date: m.date || docDate,
            active: m.active !== false,
            source: "ai",
          }));
        if (rows.length) await supabase.from("medications").insert(rows);
      }

      if (Array.isArray(extracted.allergies) && extracted.allergies.length) {
        const rows = extracted.allergies
          .filter((a: any) => a && a.substance)
          .map((a: any) => ({
            user_id: userId,
            substance: a.substance,
            reaction: a.reaction || null,
            severity: a.severity || null,
            source: "ai",
          }));
        if (rows.length) await supabase.from("allergies").insert(rows);
      }

      if (Array.isArray(extracted.alerts) && extracted.alerts.length) {
        const rows = extracted.alerts
          .filter((a: any) => a && a.message)
          .map((a: any) => ({
            user_id: userId,
            type: a.type || "flagged",
            message: a.message,
          }));
        if (rows.length) await supabase.from("alerts").insert(rows);
      }

      if (Array.isArray(extracted.visits) && extracted.visits.length) {
        const rows = extracted.visits
          .filter((v: any) => v && (v.visit_date || v.reason_for_visit || v.diagnosis || v.findings))
          .map((v: any) => ({
            user_id: userId,
            document_id: insertedDoc?.id || null,
            visit_date: v.visit_date || null,
            facility_name: v.facility_name || docFacility,
            facility_country: v.facility_country || null,
            reason_for_visit: v.reason_for_visit || null,
            investigations_performed: v.investigations_performed || [],
            findings: v.findings || null,
            diagnosis: v.diagnosis || null,
            medications_prescribed: v.medications_prescribed || [],
            follow_up_recommendations: v.follow_up_recommendations || [],
            original_lang: v.original_lang || null,
            source: "ai",
          }));
        if (rows.length) await supabase.from("visits").insert(rows);
      }
    }

    if (isLast) {
      await supabase.from("record_requests").update({ status: "received" }).eq("id", request.id);
      await supabase.from("alerts").insert({
        user_id: request.user_id,
        type: "records_received",
        message: `${request.provider_name} uploaded ${totalFiles} file${totalFiles > 1 ? "s" : ""} for your records request.`,
      });
    }

    return new Response(JSON.stringify({ success: true, filePath, extracted: !!extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("upload-record-request error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Upload failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
