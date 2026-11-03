// Emails a patient's Share Brief link to a hospital or doctor.
// - Only the brief's owner can send it, and only while it is valid (not revoked or expired).
// - The link is built here from the token; callers cannot supply a URL (no phishing relay).
// - The email contains a link, never attachments, so access can expire or be revoked.
// - Rate-limited per patient (durable, via platform_events) and audited without storing the address.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const SITE_URL = "https://rinvita.co.uk";
const MAX_PER_HOUR = 10;
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;
const clean = (v: unknown, max: number) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return json({ error: "Not authenticated" }, 401);
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  const userId = userData?.user?.id;
  if (userErr || !userId) return json({ error: "Not authenticated" }, 401);

  let body: any = {};
  try { body = await req.json(); } catch { /* invalid */ }
  const token = clean(body?.token, 200);
  const recipientEmail = clean(body?.recipientEmail, 254).toLowerCase();
  const hospitalName = clean(body?.hospitalName, 120);
  // Free text from the patient; newlines kept, rendered as plain text by React (escaped).
  const note = String(body?.note ?? "").replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ").trim().slice(0, 600);

  if (!token || token.length < 16) return json({ error: "Missing link", code: "invalid_token" }, 400);
  if (!EMAIL.test(recipientEmail)) return json({ error: "Please enter a valid email address", code: "invalid_email" }, 400);

  const { data: brief } = await admin.from("shared_briefs")
    .select("id, token, user_id, expires_at, revoked_at, documents")
    .eq("token", token).eq("user_id", userId).maybeSingle();
  if (!brief) return json({ error: "Link not found", code: "not_found" }, 404);
  if (brief.revoked_at) return json({ error: "This link has been revoked", code: "revoked" }, 409);
  if (brief.expires_at && new Date(brief.expires_at) < new Date()) return json({ error: "This link has expired", code: "expired" }, 409);

  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await admin.from("platform_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId).eq("event_type", "share_brief_emailed").gte("created_at", since);
  if ((count ?? 0) >= MAX_PER_HOUR) return json({ error: "Too many emails sent in the last hour. Please try again later.", code: "rate_limited" }, 429);

  const { data: profile } = await admin.from("profiles").select("full_name").eq("id", userId).maybeSingle();
  const documentCount = Array.isArray(brief.documents) ? brief.documents.length : 0;
  const expiresText = brief.expires_at
    ? `on ${new Date(brief.expires_at).toLocaleString("en-GB", { timeZone: "Europe/London", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} (UK time)`
    : undefined;

  const { error: sendErr } = await admin.functions.invoke("send-transactional-email", {
    body: {
      templateName: "share-brief",
      recipientEmail,
      idempotencyKey: `share-brief-${brief.id}-${recipientEmail}`,
      templateData: {
        hospitalName: hospitalName || undefined,
        patientName: clean(profile?.full_name, 120) || undefined,
        documentCount,
        shareUrl: `${SITE_URL}/share/${encodeURIComponent(brief.token)}`,
        expiresText,
        note: note || undefined,
      },
    },
  });
  if (sendErr) return json({ error: "The email could not be sent. Please try again.", code: "send_failed" }, 502);

  // Audit without storing the full address.
  await admin.from("platform_events").insert({
    user_id: userId, actor_user_id: userId, event_type: "share_brief_emailed",
    details_json: { brief_id: brief.id, recipient_domain: recipientEmail.split("@")[1], documents: documentCount },
  });
  return json({ sent: true });
});
