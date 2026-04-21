// translate-export: translates an assembled health data JSON payload into a target language.
// Caches results by (user_id, target_language, data_hash) for 24 hours.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const LANG_NAME_MAP: Record<string, string> = {
  en: "English", ar: "Arabic", zh: "Mandarin", es: "Spanish", fr: "French",
  tr: "Turkish", ru: "Russian", pl: "Polish", hi: "Hindi", pt: "Portuguese",
  de: "German", it: "Italian", sq: "Albanian", nl: "Dutch", el: "Greek",
  he: "Hebrew", ja: "Japanese", ko: "Korean", th: "Thai", vi: "Vietnamese",
  ur: "Urdu", fa: "Persian", sw: "Swahili", ro: "Romanian", uk: "Ukrainian",
  cs: "Czech", sv: "Swedish", no: "Norwegian", da: "Danish", fi: "Finnish",
  hu: "Hungarian", bg: "Bulgarian", sr: "Serbian", hr: "Croatian", sk: "Slovak",
  sl: "Slovenian", lt: "Lithuanian", lv: "Latvian", et: "Estonian", bn: "Bengali",
  ta: "Tamil", te: "Telugu", mr: "Marathi", id: "Indonesian", ms: "Malay",
  tl: "Tagalog",
};

async function sha256(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorised" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json();
    const { payload, targetLanguage } = body as { payload: any; targetLanguage: string };

    const target = (typeof targetLanguage === "string" ? targetLanguage : "en").toLowerCase();
    const targetName = LANG_NAME_MAP[target] || "English";

    if (!payload || typeof payload !== "object") {
      return new Response(JSON.stringify({ error: "Missing payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // English requires no translation — return as-is
    if (target === "en") {
      return new Response(
        JSON.stringify({ translated: payload, cached: false, language: target }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const serializedPayload = JSON.stringify(payload);
    const dataHash = await sha256(serializedPayload);

    // Service-role client for cache read/write (bypasses RLS reliably)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check cache (and fresh)
    const { data: cached } = await adminClient
      .from("export_translation_cache")
      .select("translated_payload, expires_at")
      .eq("user_id", userId)
      .eq("target_language", target)
      .eq("data_hash", dataHash)
      .maybeSingle();

    if (cached && new Date(cached.expires_at).getTime() > Date.now()) {
      return new Response(
        JSON.stringify({ translated: cached.translated_payload, cached: true, language: target }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Translate via Claude
    const prompt = `You are a clinical translation engine.

Translate ALL human-readable text fields in the JSON below into ${targetName} (ISO ${target}).

CRITICAL RULES:
- Preserve the EXACT JSON shape (same keys, same array lengths, same nesting).
- Translate values such as marker names, findings, regions, prescribers, facilities, summaries, alert messages, allergy substances/reactions/severities, document names/types, etc.
- DO NOT translate: numerical values, units (mg, mmol/L, etc.), ISO date strings (YYYY-MM-DD), language codes, IDs, status enums ("normal" | "flagged" | "critical"), boolean values.
- Preserve clinical accuracy. Use the standard medical term in ${targetName} where one exists.
- Return ONLY the translated JSON. No markdown fences, no commentary.

JSON to translate:
${serializedPayload}`;

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 16000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("Anthropic translate error:", aiRes.status, errText);
      return new Response(
        JSON.stringify({ error: `Translation failed: ${aiRes.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiData = await aiRes.json();
    const rawText = aiData.content?.[0]?.text || "";
    const jsonStr = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let translated: any;
    try {
      translated = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse translated JSON:", jsonStr.slice(0, 500));
      return new Response(
        JSON.stringify({ error: "Translator returned invalid JSON" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Upsert cache
    await adminClient
      .from("export_translation_cache")
      .upsert(
        {
          user_id: userId,
          target_language: target,
          data_hash: dataHash,
          translated_payload: translated,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: "user_id,target_language,data_hash" },
      );

    return new Response(
      JSON.stringify({ translated, cached: false, language: target }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("translate-export error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
