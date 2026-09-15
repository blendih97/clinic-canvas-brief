import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getUtmParams } from "@/lib/analytics";
import { marketingColors } from "@/components/marketing/shared";

export const TRANSLATOR_LANGS = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "ar", label: "Arabic" },
  { code: "zh", label: "Mandarin" },
  { code: "tr", label: "Turkish" },
  { code: "ru", label: "Russian" },
  { code: "pl", label: "Polish" },
  { code: "hi", label: "Hindi" },
  { code: "nl", label: "Dutch" },
  { code: "el", label: "Greek" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "ur", label: "Urdu" },
  { code: "fa", label: "Persian" },
  { code: "sq", label: "Albanian" },
  { code: "ro", label: "Romanian" },
];

export type TranslationResult = {
  originalLanguage: string;
  documentType: string;
  summary: string[];
  flags: string[];
  translatedFullText: string;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type Props = {
  /** Which language the translation is produced in. Defaults to English. */
  defaultTargetLanguage?: string;
  /** Path recorded against the attempt so we can tell which page drove it. */
  landingPath: string;
  isMobile: boolean;
};

/**
 * The free public medical-document translator. Shared by /translate and every
 * /translate/<language>-medical-records-to-english landing page. The document
 * itself is never stored — only an anonymous attempt row is recorded server-side.
 */
export default function TranslatorTool({ defaultTargetLanguage = "en", landingPath, isMobile }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [targetLang, setTargetLang] = useState(defaultTargetLanguage);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = (f: File | null) => {
    setError(null);
    setResult(null);
    if (!f) return setFile(null);
    if (f.size > 6 * 1024 * 1024) {
      setError("File too large. Please use a document under 6MB.");
      return;
    }
    setFile(f);
  };

  const submit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const base64 = await fileToBase64(file);
      const fileType: "pdf" | "image" = file.type === "application/pdf" ? "pdf" : "image";
      const utm = getUtmParams();
      const { data, error: fnError } = await supabase.functions.invoke("public-translate-document", {
        body: {
          fileType,
          mediaType: file.type,
          base64,
          targetLanguage: targetLang,
          email: email.trim() || undefined,
          consent: consent && email.trim().length > 0,
          landingPath,
          utmSource: utm.utm_source,
          utmMedium: utm.utm_medium,
          utmCampaign: utm.utm_campaign,
        },
      });
      if (fnError) throw new Error(fnError.message || "Translation failed");
      if (data?.error) throw new Error(data.error);
      setResult(data as TranslationResult);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: marketingColors.gold,
    fontWeight: 600,
    marginBottom: 10,
  };

  return (
    <>
      {!result && (
        <div style={{ background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 4, padding: isMobile ? 24 : 40 }}>
          <label style={labelStyle}>1. Choose a document</label>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFile(e.dataTransfer.files?.[0] || null);
            }}
            style={{
              border: `1.5px dashed ${marketingColors.goldBorder}`,
              background: file ? marketingColors.goldSoft : marketingColors.cream2,
              borderRadius: 4,
              padding: isMobile ? "24px 16px" : "32px 24px",
              textAlign: "center",
              cursor: "pointer",
              marginBottom: 24,
            }}
          >
            <input
              ref={inputRef}
              type="file"
              aria-label="Choose a medical document to translate"
              accept="application/pdf,image/jpeg,image/png,image/heic,image/webp"
              onChange={(e) => onFile(e.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
            {file ? (
              <>
                <div style={{ fontSize: 14, color: marketingColors.ink, fontWeight: 500 }}>{file.name}</div>
                <div style={{ fontSize: 12, color: marketingColors.softText, marginTop: 4 }}>
                  {(file.size / 1024).toFixed(0)} KB · click to change
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 14, color: marketingColors.ink, fontWeight: 500 }}>Drop a PDF or photo here</div>
                <div style={{ fontSize: 12, color: marketingColors.softText, marginTop: 4 }}>
                  or click to browse · max 6 MB · PDF, JPG, PNG
                </div>
              </>
            )}
          </div>

          <label style={labelStyle} htmlFor="translator-target-language">2. Translate into</label>
          <select
            id="translator-target-language"
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              border: `1px solid ${marketingColors.goldBorder}`,
              borderRadius: 2,
              background: marketingColors.surface,
              fontSize: 14,
              color: marketingColors.ink,
              marginBottom: 24,
            }}
          >
            {TRANSLATOR_LANGS.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>

          <label style={labelStyle} htmlFor="translator-email">3. Email a copy (optional)</label>
          <input
            id="translator-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{
              width: "100%",
              padding: "12px 14px",
              border: `1px solid ${marketingColors.goldBorder}`,
              borderRadius: 2,
              background: marketingColors.surface,
              fontSize: 14,
              color: marketingColors.ink,
              marginBottom: 12,
            }}
          />
          {email.trim().length > 0 && (
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12.5, color: marketingColors.mutedText, lineHeight: 1.6, cursor: "pointer", marginBottom: 24 }}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3 }} />
              <span>I'd like RinVita to send me occasional product updates. You can unsubscribe at any time.</span>
            </label>
          )}

          {error && (
            <div role="alert" style={{ padding: 12, background: "hsl(0 70% 50% / 0.08)", border: "1px solid hsl(0 70% 50% / 0.3)", borderRadius: 2, fontSize: 13, color: "hsl(0 70% 35%)", marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={!file || loading}
            style={{
              width: "100%",
              padding: "16px",
              background: !file || loading ? marketingColors.goldSoft : marketingColors.gold,
              color: !file || loading ? marketingColors.softText : "hsl(var(--primary-foreground))",
              border: "none",
              borderRadius: 2,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.06em",
              cursor: !file || loading ? "not-allowed" : "pointer",
              textTransform: "uppercase",
            }}
          >
            {loading ? "Translating… this can take 30–60 seconds" : "Translate document"}
          </button>

          <p style={{ fontSize: 11, color: marketingColors.softText, marginTop: 16, lineHeight: 1.6, textAlign: "center" }}>
            Your document is processed in memory and not stored. For a permanent, searchable vault of all your records,{" "}
            <Link to="/auth?mode=signup" style={{ color: marketingColors.gold, textDecoration: "underline" }}>create a free account</Link>.
          </p>
        </div>
      )}

      {result && (
        <div style={{ background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 4, padding: isMobile ? 24 : 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: marketingColors.gold, fontWeight: 600 }}>
              {result.documentType} · {result.originalLanguage} → {TRANSLATOR_LANGS.find((l) => l.code === targetLang)?.label}
            </div>
            <button onClick={reset} style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2, fontSize: 12, color: marketingColors.mutedText, cursor: "pointer" }}>
              Translate another
            </button>
          </div>

          {/* Acquisition card — shown as soon as a translation succeeds. */}
          <div style={{ padding: isMobile ? 20 : 24, background: marketingColors.goldSoft, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2, marginBottom: 28 }}>
            <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: 24, fontWeight: 400, color: marketingColors.ink, marginBottom: 8 }}>
              Your translation is ready. Now keep it.
            </h2>
            <p style={{ fontSize: 14, color: marketingColors.mutedText, lineHeight: 1.7, marginBottom: 16 }}>
              Add it to your free RinVita hub so it sits with your other records instead of in your downloads folder.
            </p>
            <Link
              to="/auth?mode=signup&from=translate"
              style={{ display: "inline-block", padding: "12px 28px", background: marketingColors.gold, color: "hsl(var(--primary-foreground))", textDecoration: "none", borderRadius: 2, fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}
            >
              Start your medical hub — free
            </Link>
            <p style={{ fontSize: 12, color: marketingColors.softText, marginTop: 12 }}>
              Free plan · 3 documents · no card required.
            </p>
          </div>

          <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: 26, fontWeight: 400, color: marketingColors.ink, marginBottom: 14 }}>Plain-English summary</h2>
          <ul style={{ paddingLeft: 18, marginBottom: 28 }}>
            {result.summary?.map((s, i) => (
              <li key={i} style={{ fontSize: 14, lineHeight: 1.75, color: marketingColors.mutedText, marginBottom: 6 }}>{s}</li>
            ))}
          </ul>

          {result.flags?.length > 0 && (
            <div style={{ padding: 16, background: "hsl(28 90% 50% / 0.08)", border: "1px solid hsl(28 90% 50% / 0.3)", borderRadius: 2, marginBottom: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "hsl(28 90% 35%)", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>Worth raising with a doctor</div>
              <ul style={{ paddingLeft: 16, margin: 0 }}>
                {result.flags.map((f, i) => (
                  <li key={i} style={{ fontSize: 13.5, lineHeight: 1.7, color: marketingColors.ink, marginBottom: 4 }}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: 22, fontWeight: 400, color: marketingColors.ink, marginBottom: 12 }}>Full translation</h3>
          <div style={{ padding: 20, background: marketingColors.cream2, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2, fontSize: 13.5, lineHeight: 1.8, color: marketingColors.ink, whiteSpace: "pre-wrap", maxHeight: 600, overflowY: "auto" }}>
            {result.translatedFullText}
          </div>
        </div>
      )}
    </>
  );
}
