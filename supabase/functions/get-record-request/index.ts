// Public token-gated lookup for record_requests.
// Anonymous callers supply a token; service role fetches that single row.
// Avoids exposing the whole table via permissive RLS.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token } = await req.json().catch(() => ({}));
    if (!token || typeof token !== "string" || token.length < 16) {
      return new Response(JSON.stringify({ error: "invalid_token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("record_requests")
      .select("id, token, status, expires_at, patient_name, request_description, provider_name, provider_email, created_at, user_id")
      .eq("token", token)
      .maybeSingle();

    if (error) {
      return new Response(JSON.stringify({ error: "lookup_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!data) {
      return new Response(JSON.stringify({ request: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expired = new Date(data.expires_at) < new Date();
    if (!expired && data.status === "pending") {
      await supabase.from("record_requests").update({ status: "link_opened" }).eq("id", data.id);
    }

    // Do not leak user_id back to the anonymous client.
    const { user_id: _omit, ...safe } = data;

    return new Response(JSON.stringify({ request: safe }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_e) {
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
