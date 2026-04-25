import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

    const { error: docError } = await supabase.from("documents").insert({
      user_id: request.user_id,
      name: file.name,
      type: "Received Records",
      date: new Date().toISOString().split("T")[0],
      facility: request.provider_name,
      country: "",
      pages: 1,
      extracted: false,
      file_url: filePath,
      ai_note: `Received via request from ${request.provider_name}`,
    });
    if (docError) throw docError;

    if (isLast) {
      await supabase.from("record_requests").update({ status: "received" }).eq("id", request.id);
      await supabase.from("alerts").insert({
        user_id: request.user_id,
        type: "records_received",
        message: `${request.provider_name} uploaded ${totalFiles} file${totalFiles > 1 ? "s" : ""} for your records request.`,
      });
    }

    return new Response(JSON.stringify({ success: true, filePath }), {
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
