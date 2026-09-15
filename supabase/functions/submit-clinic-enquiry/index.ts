// Public, no-auth endpoint to capture clinic / partnership enquiries from /clinics.
// Inserts into public.clinic_enquiries and triggers an admin notification email
// to info@rinvita.co.uk via the shared transactional-email infrastructure.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { saveEnquiryAndNotify } from "../_shared/enquiries.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Best-effort in-memory rate limit: 10 per IP per hour
const ipBuckets = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = ipBuckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    ipBuckets.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (bucket.count >= 10) return false;
  bucket.count += 1;
  return true;
}

const PATIENT_BANDS = new Set([
  "<50", "50-200", "200-500", "500+",
  "1-10", "11-30", "31-75", "76-150", "150+",
]);

const ORGANISATION_TYPES = new Set([
  "Medical concierge",
  "Private clinic",
  "International patient department",
  "Executive health",
  "Family office",
  "Other",
]);

const NEXT_STEPS = new Set([
  "Apply for a founding pilot",
  "Intro call",
  "See the patient experience",
  "Send information by email",
]);

const SOURCE_PAGES = new Set(["for-clinics", "for-concierges", "for-concierges-pilot", "clinics", "partners"]);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: any;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const name = String(body?.name || "").trim().slice(0, 200);
  const email = String(body?.email || "").trim().toLowerCase().slice(0, 200);
  const organisation = String(body?.organisation || "").trim().slice(0, 200) || null;
  const role = String(body?.role || "").trim().slice(0, 200) || null;
  const patients_per_month_raw = String(body?.patients_per_month || "").trim();
  const patients_per_month = PATIENT_BANDS.has(patients_per_month_raw) ? patients_per_month_raw : null;
  const message = String(body?.message || "").trim().slice(0, 4000) || null;
  const honeypot = String(body?.website || "").trim();
  const utm_source = String(body?.utm_source || "").trim().slice(0, 100) || null;
  const utm_medium = String(body?.utm_medium || "").trim().slice(0, 100) || null;
  const utm_campaign = String(body?.utm_campaign || "").trim().slice(0, 100) || null;

  // Partner pilot application fields (/for-clinics, /for-concierges)
  const website_url = String(body?.website_url || "").trim().slice(0, 300) || null;
  const country = String(body?.country || "").trim().slice(0, 120) || null;
  const organisation_type_raw = String(body?.organisation_type || "").trim();
  const organisation_type = ORGANISATION_TYPES.has(organisation_type_raw) ? organisation_type_raw : null;
  const languages_handled = String(body?.languages_handled || "").trim().slice(0, 300) || null;
  const current_problem = String(body?.current_problem || "").trim().slice(0, 4000) || null;
  const preferred_next_step_raw = String(body?.preferred_next_step || "").trim();
  const preferred_next_step = NEXT_STEPS.has(preferred_next_step_raw) ? preferred_next_step_raw : null;
  const source_page_raw = String(body?.source_page || "").trim();
  const source_page = SOURCE_PAGES.has(source_page_raw) ? source_page_raw : "clinics";
  const consent_at = body?.consent === true ? new Date().toISOString() : null;


  // Honeypot — bots fill this hidden field
  if (honeypot) {
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: "Please provide your name and a valid email address." }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const result = await saveEnquiryAndNotify(admin, {
      name, email, organisation, role,
      website: website_url, country, organisation_type,
      patients_per_month, languages_handled, current_problem,
      preferred_next_step, message, consent_at, source_page,
      utm_source, utm_medium, utm_campaign,
      origin: source_page,
    });
    if (!result.saved) throw new Error(result.error || "insert failed");

    return new Response(JSON.stringify({ ok: true, notified: result.notified }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("clinic enquiry insert failed", err);
    return new Response(JSON.stringify({ error: "Something went wrong. Please email info@rinvita.co.uk directly." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
