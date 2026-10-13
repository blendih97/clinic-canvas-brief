import { useEffect, useRef, useState } from "react";
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

export type TranslationMedication = { name: string; dose: string | null; frequency: string | null };
export type TranslationLabValue = {
  test: string;
  value: string;
  unit: string | null;
  range: string | null;
  flag: string | null;
};

/**
 * Signed-out visitors receive `locked: true`: summary and flags only, plus counts
 * of what is locked. The locked content is never sent to the browser.
 */
export type TranslationResult = {
  originalLanguage: string;
  documentType: string;
  summary: string[];
  flags: string[];
  locked: boolean;
  lockedCounts?: { medications: number; labValues: number };
  medications?: TranslationMedication[];
  labValues?: TranslationLabValue[];
  translatedFullText?: string;
};

const SIGNUP_PATH = "/auth?mode=signup&from=translate";
const SESSION_KEY = "rv_translate_session";

function getSessionId(): string {
  try {
    let id = window.localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

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

/** The edge function returns { error, code } in the body; supabase-js hides it behind a generic message. */
async function readFunctionError(err: unknown): Promise<{ message?: string; code?: string }> {
  const ctx = (err as { context?: unknown } | null)?.context;
  if (ctx instanceof Response) {
    try {
      const body = await ctx.clone().json();
      return { message: body?.error, code: body?.code };
    } catch {
      return {};
    }
  }
  return {};
}

type Props = {
  /** Which language the translation is produced in. Defaults to English. */
  defaultTargetLanguage?: string;
  /** Path recorded against the attempt so we can tell which page drove it. */
  landingPath: string;
  isMobile: boolean;
};

const headingStyle: React.CSSProperties = {
  fontFamily: "Cormorant Garamond",
  fontSize: 22,
  fontWeight: 400,
  color: marketingColors.ink,
  marginBottom: 12,
};

const unlockButtonStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 20px",
  background: marketingColors.gold,
  color: "hsl(var(--primary-foreground))",
  textDecoration: "none",
  borderRadius: 2,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

/** Blurred placeholder rows. They contain no real data; the server never sent it. */
function LockedSection({ title, count, rows = 3 }: { title: string; count?: number; rows?: number }) {
  if (count === 0) return null;
  return (
    <section style={{ marginBottom: 28 }}>
      <h3 style={headingStyle}>
        {title}
        {count ? ` (${count})` : ""}
      </h3>
      <div style={{ position: "relative", border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2, overflow: "hidden" }}>
        <div aria-hidden style={{ filter: "blur(4px)", padding: 18, userSelect: "none" }}>
          {Array.from({ length: Math.min(Math.max(count ?? rows, 2), 5) }, (_, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
              <span style={{ height: 10, width: `${45 + ((i * 17) % 30)}%`, background: "hsl(var(--foreground) / 0.18)", borderRadius: 2 }} />
              <span style={{ height: 10, width: 64, background: "hsl(var(--foreground) / 0.12)", borderRadius: 2 }} />
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "hsl(var(--background) / 0.35)" }}>
          <Link to={SIGNUP_PATH} style={unlockButtonStyle}>
            Unlock with a free account
          </Link>
        </div>
      </div>
    </section>
  );
}

function OriginalPreview({ url, file }: { url: string; file: File }) {
  const frame: React.CSSProperties = { width: "100%", height: "100%", border: 0, objectFit: "contain", background: marketingColors.cream2 };
  return (
    <figure style={{ margin: 0, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2, overflow: "hidden", height: "100%", minHeight: 420, display: "flex", flexDirection: "column" }}>
      <figcaption style={{ padding: "10px 14px", fontSize: 12, color: marketingColors.softText, borderBottom: `1px solid ${marketingColors.goldBorder}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        Original: {file.name}
      </figcaption>
      <div style={{ flex: 1, minHeight: 380 }}>
        {file.type === "application/pdf" ? (
          <object data={url} type="application/pdf" style={frame} aria-label={`Original document ${file.name}`}>
            <p style={{ padding: 16, fontSize: 13, color: marketingColors.mutedText }}>
              Your browser can't show PDFs here.{" "}
              <a href={url} target="_blank" rel="noreferrer" style={{ color: marketingColors.gold }}>Open the original</a>.
            </p>
          </object>
        ) : (
          <img src={url} alt={`Original document ${file.name}`} style={frame} />
        )}
      </div>
    </figure>
  );
}

/**
 * The free public medical-document translator. Shared by /translate and every
 * /translate/<language>-medical-records-to-english landing page. The document
 * itself is never stored — only an anonymous attempt row is recorded server-side.
 */
export default function TranslatorTool({ defaultTargetLanguage = "en", landingPath, isMobile }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState(defaultTargetLanguage);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Local preview of the original; released when the file changes or the tool unmounts.
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onFile = (f: File | null) => {
    setError(null);
    setResult(null);
    if (!f) return setFile(null);
    const name = f.name.toLowerCase();
    if (f.type === "image/heic" || name.endsWith(".heic") || name.endsWith(".heif")) {
      setError("That's an iPhone HEIC photo. Export it as JPG (or take a screenshot), then upload it again.");
      return;
    }
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
          sessionId: getSessionId(),
          utmSource: utm.utm_source,
          utmMedium: utm.utm_medium,
          utmCampaign: utm.utm_campaign,
        },
      });
      if (fnError) {
        const { message, code } = await readFunctionError(fnError);
        if (code === "guest_limit") {
          setLimitReached(true);
          return;
        }
        throw new Error(message || "Translation failed. Please try again.");
      }
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

  if (limitReached && !result) {
    return (
      <div style={{ background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 4, padding: isMobile ? 24 : 40, textAlign: "center" }}>
        <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: 28, fontWeight: 400, color: marketingColors.ink, marginBottom: 10 }}>
          You've used your free translation
        </h2>
        <p style={{ fontSize: 14, color: marketingColors.mutedText, lineHeight: 1.7, maxWidth: 480, margin: "0 auto 20px" }}>
          Create a free RinVita account to translate more documents and see the medications, lab values and full
          translation, saved in one place you can share with any doctor.
        </p>
        <Link to={SIGNUP_PATH} style={{ ...unlockButtonStyle, padding: "12px 28px", fontSize: 13 }}>
          Create my free account
        </Link>
      </div>
    );
  }

  const targetLabel = TRANSLATOR_LANGS.find((l) => l.code === targetLang)?.label;

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
              accept="application/pdf,image/jpeg,image/png,image/webp"
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
            Your first document is free, no account needed. Your document is processed in memory and not stored. For a
            permanent, searchable vault of all your records,{" "}
            <Link to={SIGNUP_PATH} style={{ color: marketingColors.gold, textDecoration: "underline" }}>create a free account</Link>.
          </p>
        </div>
      )}

      {result && (
        <div style={{ background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 4, padding: isMobile ? 24 : 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: marketingColors.gold, fontWeight: 600 }}>
              {result.documentType} · {result.originalLanguage} → {targetLabel}
            </div>
            <button onClick={reset} style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2, fontSize: 12, color: marketingColors.mutedText, cursor: "pointer" }}>
              Translate another
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)", gap: isMobile ? 20 : 28, alignItems: "start" }}>
            {/* Left: the original, as uploaded */}
            {file && previewUrl && (
              isMobile ? (
                <details style={{ border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2 }}>
                  <summary style={{ padding: "10px 14px", fontSize: 13, color: marketingColors.mutedText, cursor: "pointer" }}>
                    View the original document
                  </summary>
                  <OriginalPreview url={previewUrl} file={file} />
                </details>
              ) : (
                <div style={{ position: "sticky", top: 96 }}>
                  <OriginalPreview url={previewUrl} file={file} />
                </div>
              )
            )}

            {/* Right: the structured brief */}
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: 26, fontWeight: 400, color: marketingColors.ink, marginBottom: 14 }}>
                Plain-language summary
              </h2>
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

              {result.locked ? (
                <>
                  <LockedSection title="Medications" count={result.lockedCounts?.medications} />
                  <LockedSection title="Key lab values" count={result.lockedCounts?.labValues} />
                  <LockedSection title="Full translation" rows={4} />

                  <div style={{ padding: isMobile ? 20 : 24, background: marketingColors.goldSoft, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2 }}>
                    <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: 24, fontWeight: 400, color: marketingColors.ink, marginBottom: 8 }}>
                      See the complete translation
                    </h2>
                    <p style={{ fontSize: 14, color: marketingColors.mutedText, lineHeight: 1.7, marginBottom: 16 }}>
                      Sign up free to unlock your complete translated summary and doctor export. Then upload this document to
                      your hub: you'll see the medications, lab values and full translation, saved permanently.
                    </p>
                    <Link to={SIGNUP_PATH} style={{ ...unlockButtonStyle, padding: "12px 28px", fontSize: 13 }}>
                      Unlock with a free account
                    </Link>
                    <p style={{ fontSize: 12, color: marketingColors.softText, marginTop: 12 }}>Free plan · 3 documents · no card required.</p>
                  </div>
                </>
              ) : (
                <>
                  {(result.medications?.length ?? 0) > 0 && (
                    <section style={{ marginBottom: 28 }}>
                      <h3 style={headingStyle}>Medications</h3>
                      <ul style={{ paddingLeft: 18, margin: 0 }}>
                        {result.medications!.map((m, i) => (
                          <li key={i} style={{ fontSize: 14, lineHeight: 1.75, color: marketingColors.ink, marginBottom: 4 }}>
                            <strong style={{ fontWeight: 600 }}>{m.name}</strong>
                            {[m.dose, m.frequency].filter(Boolean).length > 0 && (
                              <span style={{ color: marketingColors.mutedText }}> — {[m.dose, m.frequency].filter(Boolean).join(", ")}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {(result.labValues?.length ?? 0) > 0 && (
                    <section style={{ marginBottom: 28 }}>
                      <h3 style={headingStyle}>Key lab values</h3>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                          <thead>
                            <tr style={{ textAlign: "left", color: marketingColors.softText }}>
                              <th style={{ padding: "6px 12px 6px 0", fontWeight: 400 }}>Test</th>
                              <th style={{ padding: "6px 12px 6px 0", fontWeight: 400 }}>Result</th>
                              <th style={{ padding: "6px 0", fontWeight: 400 }}>Range</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.labValues!.map((l, i) => {
                              const abnormal = l.flag === "high" || l.flag === "low" || l.flag === "abnormal";
                              return (
                                <tr key={i} style={{ borderTop: `1px solid ${marketingColors.goldBorder}` }}>
                                  <td style={{ padding: "8px 12px 8px 0", color: marketingColors.ink }}>{l.test}</td>
                                  <td style={{ padding: "8px 12px 8px 0", color: abnormal ? "hsl(0 70% 38%)" : marketingColors.ink, fontWeight: abnormal ? 600 : 400, whiteSpace: "nowrap" }}>
                                    {l.value} {l.unit ?? ""}
                                    {abnormal && <span style={{ fontSize: 11, marginLeft: 4 }}>({l.flag})</span>}
                                  </td>
                                  <td style={{ padding: "8px 0", color: marketingColors.softText, whiteSpace: "nowrap" }}>{l.range ?? "–"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}

                  <h3 style={headingStyle}>Full translation</h3>
                  <div style={{ padding: 20, background: marketingColors.cream2, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2, fontSize: 13.5, lineHeight: 1.8, color: marketingColors.ink, whiteSpace: "pre-wrap", maxHeight: 600, overflowY: "auto", marginBottom: 28 }}>
                    {result.translatedFullText}
                  </div>

                  <div style={{ padding: isMobile ? 20 : 24, background: marketingColors.goldSoft, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2 }}>
                    <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: 24, fontWeight: 400, color: marketingColors.ink, marginBottom: 8 }}>
                      Keep it with your other records
                    </h2>
                    <p style={{ fontSize: 14, color: marketingColors.mutedText, lineHeight: 1.7, marginBottom: 16 }}>
                      Upload this document to your hub so it sits with the rest of your history and can be shared with any doctor.
                    </p>
                    <Link to="/app" style={{ ...unlockButtonStyle, padding: "12px 28px", fontSize: 13 }}>
                      Open my hub
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
