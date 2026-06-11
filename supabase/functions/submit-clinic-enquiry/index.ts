// Public, no-auth endpoint to capture clinic / partnership enquiries from /clinics.
// Inserts into public.clinic_enquiries and triggers an admin notification email
// to hello@rinvita.co.uk via the shared transactional-email infrastructure.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

const PATIENT_BANDS = new Set(["<50", "50-200", "200-500", "500+"]);

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
    const { error } = await admin.from("clinic_enquiries").insert({
      name, email, organisation, role, patients_per_month, message,
    });
    if (error) throw error;

    // Fire-and-forget admin email notification. Don't fail the request if email fails.
    try {
      await admin.functions.invoke("send-transactional-email", {
        body: {
          templateName: "clinic-enquiry-admin",
          recipientEmail: "hello@rinvita.co.uk",
          templateData: {
            name,
            email,
            organisation,
            role,
            patientsPerMonth: patients_per_month,
            message,
            submittedAt: new Date().toISOString(),
          },
        },
      });
    } catch (emailErr) {
      console.error("clinic enquiry email notification failed", emailErr);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("clinic enquiry insert failed", err);
    return new Response(JSON.stringify({ error: "Something went wrong. Please email hello@rinvita.co.uk directly." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
