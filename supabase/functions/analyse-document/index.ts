const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const EXTRACTION_PROMPT = `You are a medical document extraction engine. Analyse the provided document and extract all health data present.

CRITICAL RULES:
- Only extract information EXPLICITLY present in the document
- NEVER fabricate, guess, or infer values not stated
- If a document is an imaging report with no blood tests, bloodResults MUST be empty
- Return ONLY valid JSON, no markdown fences, no explanation

TRANSLATION RULES:
- Detect the source language of the document.
- ALWAYS return BOTH the full original text AND the full translated English text in the "fullText" object below.
  - fullText.original_content = the COMPLETE verbatim text of the document in its source language (preserve line breaks, headings, lists). Do NOT summarise.
  - fullText.translated_content = a faithful FULL English translation of the same document text (not a summary).
  - fullText.original_language_code = ISO 639-1 code of the source language (e.g. "sq", "ar", "tr", "fr", "en").
  - fullText.translated_language_code = always "en".
- If the source language IS English, set original_content == translated_content and original_language_code = "en".
- For each extracted finding/summary item, also translate to English and preserve the original where indicated.
- Set originalLang to the detected language NAME in English (e.g. "Albanian", "Arabic", "Turkish", "French", "English").

Return this exact JSON structure:
{
  "bloodResults": [
    {
      "id": "<uuid>",
      "marker": "string (in English)",
      "value": number,
      "unit": "string",
      "range": "string",
      "status": "normal" | "flagged" | "critical",
      "trend": [number],
      "date": "YYYY-MM-DD",
      "source": "facility name"
    }
  ],
  "imagingResults": [
    {
      "id": "<uuid>",
      "type": "MRI" | "CT" | "X-Ray" | "Ultrasound",
      "region": "string (in English)",
      "date": "YYYY-MM-DD",
      "facility": "string",
      "finding": "string (translated to English)",
      "findingOriginal": "string (in original language, same as finding if English)",
      "status": "normal" | "flagged",
      "originalLang": "string"
    }
  ],
  "medications": [
    {
      "id": "<uuid>",
      "name": "string",
      "dose": "string",
      "frequency": "string",
      "prescriber": "string",
      "facility": "string",
      "date": "YYYY-MM-DD",
      "active": true
    }
  ],
  "allergies": [
    {
      "substance": "string",
      "reaction": "string",
      "severity": "Mild" | "Moderate" | "Severe"
    }
  ],
  "alerts": [
    {
      "type": "critical" | "flagged",
      "message": "string"
    }
  ],
  "documentMeta": {
    "name": "string",
    "type": "Blood Test" | "Imaging" | "Prescription" | "Clinical Letter" | "Discharge Summary" | "Other",
    "date": "YYYY-MM-DD",
    "facility": "string",
    "country": "string",
    "pages": number,
    "originalLang": "string (detected language name e.g. Albanian, Arabic, English)"
  },
  "summary": {
    "englishText": ["string array of key findings translated to English"],
    "originalText": ["string array of key findings in original language (same as englishText if document is in English)"],
    "originalLang": "string (detected language name)"
  }
}

Arrays must be empty [] if no relevant data is found for that category.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { fileType, mediaType, base64, text, fileName } = body;

    const content: any[] = [];

    if (fileType === "pdf" && base64) {
      content.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: base64 },
      });
    } else if (fileType === "image" && base64) {
      content.push({
        type: "image",
        source: { type: "base64", media_type: mediaType || "image/jpeg", data: base64 },
      });
    } else if (text) {
      content.push({ type: "text", text: `Document content (${fileName}):\n\n${text}` });
    } else {
      return new Response(
        JSON.stringify({ error: "No valid document content provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    content.push({ type: "text", text: EXTRACTION_PROMPT });

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        messages: [{ role: "user", content }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("Anthropic API error:", anthropicRes.status, errText);
      return new Response(
        JSON.stringify({ error: `Anthropic API error: ${anthropicRes.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anthropicData = await anthropicRes.json();
    const rawText = anthropicData.content?.[0]?.text || "";

    // Parse the JSON response, stripping any markdown fences
    const jsonStr = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const extracted = JSON.parse(jsonStr);

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("analyse-document error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
