// Public, no-auth translator tool. Rate-limited per IP. Reuses Anthropic
// for high-quality multilingual extraction. Returns translation + summary
// only — never writes to any user's vault.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// In-memory IP rate limiter — best-effort (resets on cold start)
const RATE_LIMIT_PER_DAY = 5;
const ipBuckets = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  const bucket = ipBuckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    ipBuckets.set(ip, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
    return { ok: true, remaining: RATE_LIMIT_PER_DAY - 1 };
  }
  if (bucket.count >= RATE_LIMIT_PER_DAY) return { ok: false, remaining: 0 };
  bucket.count += 1;
  return { ok: true, remaining: RATE_LIMIT_PER_DAY - bucket.count };
}

const LANG_NAME_MAP: Record<string, string> = {
  en: "English", ar: "Arabic", zh: "Mandarin", es: "Spanish", fr: "French",
  tr: "Turkish", ru: "Russian", pl: "Polish", hi: "Hindi", pt: "Portuguese",
  de: "German", it: "Italian", sq: "Albanian", nl: "Dutch", el: "Greek",
  he: "Hebrew", ja: "Japanese", ko: "Korean", th: "Thai", vi: "Vietnamese",
  ur: "Urdu", fa: "Persian", ro: "Romanian", uk: "Ukrainian",
};

const buildPrompt = (targetLang: string, targetLangName: string) => `You are a medical document translator and explainer. Read the supplied medical document and respond with ONLY valid JSON (no markdown fences, no commentary).

RULES:
- Only use information explicitly present in the document. Never fabricate values, diagnoses or numbers.
- Detect the source language. Translate the FULL document into ${targetLangName} (ISO ${targetLang}) faithfully — preserve line breaks, headings, lists.
- Write a short plain-English summary (5–8 bullet points) in ${targetLangName} that a non-medical person can understand. Define any jargon in brackets.
- If anything looks abnormal or worth raising with a doctor, flag it under "flags" — but only if explicitly stated. Never invent concerns.

Return this exact JSON shape:
{
  "originalLanguage": "language name in English (e.g. Albanian, Arabic, French)",
  "documentType": "Blood Test | Imaging | Prescription | Clinical Letter | Discharge Summary | Other",
  "summary": ["bullet 1 in ${targetLangName}", "bullet 2 in ${targetLangName}"],
  "flags": ["plain-English flag in ${targetLangName}"],
  "translatedFullText": "full ${targetLangName} translation of the document"
}`;

const BodyShape = (v: unknown): v is {
  fileType: "pdf" | "image";
  mediaType?: string;
  base64: string;
  targetLanguage?: string;
  email?: string;
  consent?: boolean;
} => {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (o.fileType !== "pdf" && o.fileType !== "image") return false;
  if (typeof o.base64 !== "string" || o.base64.length < 32) return false;
  return true;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "Translator unavailable" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = checkRateLimit(ip);
  if (!limit.ok) {
    return new Response(JSON.stringify({
      error: "You've reached the free daily limit (5 documents per day). Create a free account to keep going.",
    }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!BodyShape(body)) {
    return new Response(JSON.stringify({ error: "Invalid file payload" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Reject files over ~8MB base64 (~6MB raw) to keep public tool affordable
  if (body.base64.length > 8 * 1024 * 1024) {
    return new Response(JSON.stringify({ error: "File too large. Please use a document under 6MB, or create a free account to upload larger files." }), {
      status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const targetLang = (body.targetLanguage || "en").toLowerCase();
  const targetLangName = LANG_NAME_MAP[targetLang] || "English";

  const content: unknown[] = [];
  if (body.fileType === "pdf") {
    content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: body.base64 } });
  } else {
    content.push({ type: "image", source: { type: "base64", media_type: body.mediaType || "image/jpeg", data: body.base64 } });
  }
  content.push({ type: "text", text: buildPrompt(targetLang, targetLangName) });

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 6000,
        messages: [{ role: "user", content }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("anthropic error", anthropicRes.status, errText);
      return new Response(JSON.stringify({ error: "Translation service is busy. Please try again in a moment." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await anthropicRes.json();
    const rawText = data.content?.[0]?.text || "";
    const jsonStr = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const result = JSON.parse(jsonStr);

    // Persist lead if email + consent provided (best-effort, never block response)
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (email && body.consent === true && /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      try {
        const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await admin.from("translate_tool_leads").insert({
          email,
          source: "public-translator",
          consent_at: new Date().toISOString(),
        });
      } catch (e) { console.warn("lead capture failed", e); }
    }

    return new Response(JSON.stringify({ ...result, remaining: limit.remaining }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("translator error", err);
    return new Response(JSON.stringify({ error: "We couldn't read that document. Make sure it's a clear PDF or photo." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
