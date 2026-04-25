import { useState, useEffect } from "react";
import { X, FileText, Download, Share2, Globe, Languages, Loader2, AlertCircle, RefreshCw, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import type { Document } from "@/store/vaultStore";
import { useVaultStore } from "@/store/vaultStore";
import { supabase } from "@/integrations/supabase/client";
import { SUPPORTED_LANGUAGES, getLanguageName } from "@/lib/supportedLanguages";

interface Props {
  document: Document;
  onClose: () => void;
  onShare?: () => void;
}

const RTL_CODES = new Set(["ar", "he", "fa", "ur", "ps", "sd", "yi", "ckb"]);

const LANG_NAME_TO_CODE: Record<string, string> = {
  english: "en",
  albanian: "sq",
  arabic: "ar",
  hebrew: "he",
  persian: "fa",
  farsi: "fa",
  urdu: "ur",
  turkish: "tr",
  french: "fr",
  spanish: "es",
  german: "de",
  italian: "it",
  portuguese: "pt",
  russian: "ru",
  chinese: "zh",
  japanese: "ja",
  korean: "ko",
  hindi: "hi",
};

const LANG_CODE_TO_NAME: Record<string, string> = {
  en: "English", sq: "Albanian", ar: "Arabic", he: "Hebrew", fa: "Persian",
  ur: "Urdu", tr: "Turkish", fr: "French", es: "Spanish", de: "German",
  it: "Italian", pt: "Portuguese", ru: "Russian", zh: "Chinese", ja: "Japanese",
  ko: "Korean", hi: "Hindi",
};

const resolveLangCode = (code?: string, name?: string): string | undefined => {
  if (code && code.length <= 5) return code.toLowerCase();
  if (name) return LANG_NAME_TO_CODE[name.trim().toLowerCase()];
  return undefined;
};

const resolveLangName = (code?: string, name?: string): string | undefined => {
  if (name && name.trim()) return name.trim();
  if (code) return LANG_CODE_TO_NAME[code.toLowerCase()] || code.toUpperCase();
  return undefined;
};

const getTextItems = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof value === "string" && value.trim().length > 0) return [value];
  return [];
};

const getSummaryContent = (summary?: Document["summary"]) => {
  if (!summary) return { bullets: [] as string[], englishText: [] as string[], originalText: [] as string[], originalLang: undefined as string | undefined };
  if (Array.isArray(summary) || typeof summary === "string") {
    const bullets = getTextItems(summary);
    return { bullets, englishText: bullets, originalText: [], originalLang: undefined as string | undefined };
  }
  return {
    bullets: getTextItems(summary.bullets),
    englishText: getTextItems(summary.englishText),
    originalText: getTextItems(summary.originalText),
    originalLang: typeof summary.originalLang === "string" && summary.originalLang.trim() ? summary.originalLang : undefined,
  };
};

const DocumentViewerModal = ({ document: doc, onClose, onShare }: Props) => {
  const [lang, setLang] = useState<"english" | "original">("english");
  const { bloodResults, imagingResults, medications, updateDocument } = useVaultStore();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [reprocessError, setReprocessError] = useState<string | null>(null);

  const storagePath = doc.filePath || doc.fileUrl;

  useEffect(() => {
    if (!storagePath) return;
    if (storagePath.startsWith("http")) { setSignedUrl(storagePath); return; }
    supabase.storage
      .from("medical-documents")
      .createSignedUrl(storagePath, 3600)
      .then(({ data }) => { if (data?.signedUrl) setSignedUrl(data.signedUrl); });
  }, [storagePath]);

  const relatedBlood = bloodResults.filter((b) => b.source === doc.name || b.date === doc.date);
  const relatedImaging = imagingResults.filter((i) => i.facility === doc.facility && i.date === doc.date);
  const relatedMeds = medications.filter((m) => m.facility === doc.facility && m.date === doc.date);
  const summaryContent = getSummaryContent(doc.summary);
  const summaryItems = summaryContent.englishText.length > 0 ? summaryContent.englishText : summaryContent.bullets;

  const originalLangName = resolveLangName(
    doc.originalLanguageCode,
    summaryContent.originalLang || relatedImaging.find(i => i.originalLang && i.originalLang !== "English")?.originalLang
  );
  const originalLangCode = resolveLangCode(
    doc.originalLanguageCode,
    summaryContent.originalLang || relatedImaging.find(i => i.originalLang && i.originalLang !== "English")?.originalLang
  );
  const isRtl = !!originalLangCode && RTL_CODES.has(originalLangCode);
  const hasOriginalLanguage = !!originalLangName && originalLangName.toLowerCase() !== "english";

  const hasFullOriginal = !!doc.contentOriginal && doc.contentOriginal.trim().length > 0;
  const hasFullTranslated = !!doc.contentTranslated && doc.contentTranslated.trim().length > 0;

  const handleDownload = async () => {
    if (!signedUrl || isDownloading) return;
    try {
      setIsDownloading(true);
      const response = await fetch(signedUrl);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = objectUrl; a.download = doc.name;
      window.document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleReprocess = async (overrideTargetLang?: string) => {
    if (!storagePath || isReprocessing) return;
    const targetLang = overrideTargetLang || doc.translatedLanguageCode || "en";
    setIsReprocessing(true);
    setReprocessError(null);
    try {
      const { data: fileBlob, error: dlErr } = await supabase.storage
        .from("medical-documents")
        .download(storagePath);
      if (dlErr || !fileBlob) throw new Error(dlErr?.message || "Could not load original file");

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(fileBlob);
      });

      const isPdf = fileBlob.type === "application/pdf" || doc.name.toLowerCase().endsWith(".pdf");
      const isImage = fileBlob.type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.name);

      const { data, error: fnError } = await supabase.functions.invoke("analyse-document", {
        body: {
          fileName: doc.name,
          fileType: isPdf ? "pdf" : isImage ? "image" : "text",
          mediaType: fileBlob.type || "application/pdf",
          base64,
          targetLanguage: targetLang,
        },
      });
      if (fnError) throw new Error(fnError.message || "Analysis failed");

      await updateDocument(doc.id, {
        summary: data.summary || doc.summary,
        contentOriginal: data.fullText?.original_content || undefined,
        contentTranslated: data.fullText?.translated_content || undefined,
        originalLanguageCode: data.fullText?.original_language_code || undefined,
        translatedLanguageCode: data.fullText?.translated_language_code || targetLang,
        extracted: true,
      });
    } catch (e: any) {
      setReprocessError(e.message || "Reprocess failed");
    } finally {
      setIsReprocessing(false);
    }
  };

  const showOriginal = lang === "original";
  const originalDisplayText = doc.contentOriginal || summaryContent.originalText.join("\n\n");
  const translatedDisplayText = doc.contentTranslated;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      style={{ display: "flex" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-background rounded-xl border border-border w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="font-heading text-xl text-foreground">{doc.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-auto flex flex-col md:flex-row">
          <div className="md:w-1/2 border-b md:border-b-0 md:border-r border-border p-5 flex items-center justify-center min-h-[300px] bg-muted/30">
            {signedUrl ? (
              doc.type?.toLowerCase().includes("image") || doc.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img src={signedUrl} alt={doc.name} className="max-w-full max-h-full object-contain rounded" />
              ) : (
                <iframe src={signedUrl} className="w-full h-full min-h-[400px] rounded" title={doc.name} />
              )
            ) : (
              <div className="text-center text-muted-foreground text-sm p-8">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Original file preview</p>
                <p className="text-xs mt-1">Upload a file to see it displayed here.</p>
              </div>
            )}
          </div>

          <div className="md:w-1/2 p-5 overflow-auto space-y-5">
            {hasOriginalLanguage && (
              <div className="flex gap-1 bg-muted rounded-lg p-1" role="tablist" aria-label="Document language">
                <button
                  role="tab"
                  aria-selected={lang === "english"}
                  onClick={() => setLang("english")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    lang === "english"
                      ? "bg-card text-foreground shadow-sm ring-1 ring-primary/30 border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Globe className="w-3 h-3" /> English
                </button>
                <button
                  role="tab"
                  aria-selected={lang === "original"}
                  onClick={() => setLang("original")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    lang === "original"
                      ? "bg-card text-foreground shadow-sm ring-1 ring-primary/30 border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Languages className="w-3 h-3" /> Original ({originalLangName})
                </button>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Date</span><span className="text-foreground">{doc.date}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Facility</span><span className="text-foreground">{doc.facility}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Type</span><span className="text-foreground">{doc.type}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Country</span><span className="text-foreground">{doc.country}</span></div>
              {hasOriginalLanguage && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Original Language</span>
                  <span className="text-foreground">{originalLangName}{originalLangCode ? ` (${originalLangCode})` : ""}</span>
                </div>
              )}
            </div>

            {showOriginal ? (
              <div>
                <h4 className="text-xs tracking-wider text-muted-foreground uppercase font-medium mb-2">
                  Original Text {originalLangName ? `(${originalLangName})` : ""}
                </h4>

                {hasFullOriginal ? (
                  <div
                    dir={isRtl ? "rtl" : "ltr"}
                    lang={originalLangCode}
                    className={`text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap p-4 bg-muted/40 rounded-lg border border-border/60 ${isRtl ? "text-right" : "text-left"}`}
                  >
                    {originalDisplayText}
                  </div>
                ) : summaryContent.originalText.length > 0 ? (
                  <div
                    dir={isRtl ? "rtl" : "ltr"}
                    lang={originalLangCode}
                    className={`space-y-2 ${isRtl ? "text-right" : "text-left"}`}
                  >
                    {summaryContent.originalText.map((item, i) => (
                      <p key={i} className="text-sm text-foreground/80 leading-relaxed">{item}</p>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>
                        The original-language text wasn't saved for this older record. Re-process it to extract the source-language text from the original file.
                      </span>
                    </div>
                    {storagePath ? (
                      <button
                        onClick={() => handleReprocess()}
                        disabled={isReprocessing}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
                      >
                        {isReprocessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        {isReprocessing ? "Re-processing…" : "Re-process document"}
                      </button>
                    ) : (
                      <p className="text-xs text-muted-foreground">Original file is not available, so this record cannot be re-processed.</p>
                    )}
                    {reprocessError && (
                      <p className="text-xs text-destructive">{reprocessError}</p>
                    )}
                  </div>
                )}

                {relatedImaging.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs tracking-wider text-muted-foreground uppercase font-medium mb-2">Imaging Findings {originalLangName ? `(${originalLangName})` : ""}</h4>
                    <div className="space-y-2">
                      {relatedImaging.map((im) => (
                        <div
                          key={im.id}
                          dir={isRtl ? "rtl" : "ltr"}
                          lang={originalLangCode}
                          className={`text-sm text-foreground/80 p-3 bg-muted/50 rounded-lg ${isRtl ? "text-right" : "text-left"}`}
                        >
                          <span className="font-medium text-foreground">{im.type} — {im.region}:</span>{" "}
                          {(im as any).findingOriginal || im.finding}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {hasFullTranslated && (
                  <div>
                    <h4 className="text-xs tracking-wider text-muted-foreground uppercase font-medium mb-2">Full Text (English)</h4>
                    <div className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap p-4 bg-muted/40 rounded-lg border border-border/60 max-h-72 overflow-auto">
                      {translatedDisplayText}
                    </div>
                  </div>
                )}

                {summaryItems.length > 0 && (
                  <div>
                    <h4 className="text-xs tracking-wider text-muted-foreground uppercase font-medium mb-2">Summary</h4>
                    <ul className="space-y-1.5">
                      {summaryItems.slice(0, 5).map((item, i) => (
                        <li key={i} className="text-sm text-foreground/80 flex gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {relatedBlood.length > 0 && (
                  <div>
                    <h4 className="text-xs tracking-wider text-muted-foreground uppercase font-medium mb-2">Blood Results</h4>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50 text-left">
                            <th className="p-3 text-xs text-muted-foreground font-medium">Marker</th>
                            <th className="p-3 text-xs text-muted-foreground font-medium">Value</th>
                            <th className="p-3 text-xs text-muted-foreground font-medium">Unit</th>
                            <th className="p-3 text-xs text-muted-foreground font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {relatedBlood.map((b) => (
                            <tr key={b.id} className="border-t border-border/50">
                              <td className="p-3 text-foreground">{b.marker}</td>
                              <td className="p-3 text-foreground">{b.value}</td>
                              <td className="p-3 text-muted-foreground">{b.unit}</td>
                              <td className="p-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                  b.status === "critical" ? "bg-destructive/10 text-destructive border-destructive/20" :
                                  b.status === "flagged" ? "bg-primary/10 text-primary border-primary/20" :
                                  "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                }`}>{b.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {relatedImaging.length > 0 && (
                  <div>
                    <h4 className="text-xs tracking-wider text-muted-foreground uppercase font-medium mb-2">Imaging Findings</h4>
                    <div className="space-y-2">
                      {relatedImaging.map((im) => (
                        <div key={im.id} className="text-sm text-foreground/80 p-3 bg-muted/50 rounded-lg">
                          <span className="font-medium text-foreground">{im.type} — {im.region}:</span> {im.finding}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {relatedMeds.length > 0 && (
                  <div>
                    <h4 className="text-xs tracking-wider text-muted-foreground uppercase font-medium mb-2">Medications</h4>
                    <ul className="space-y-1">
                      {relatedMeds.map((m) => (
                        <li key={m.id} className="text-sm text-foreground/80 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {m.name} — {m.dose} ({m.frequency})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {storagePath && (
              <div className="space-y-2 pt-3 border-t border-border">
                <label className="flex items-center gap-1.5 text-[11px] tracking-wider text-muted-foreground uppercase font-medium">
                  <Languages className="w-3 h-3" /> Retranslate to
                </label>
                <div className="flex gap-2">
                  <select
                    value={doc.translatedLanguageCode || "en"}
                    onChange={(e) => handleReprocess(e.target.value)}
                    disabled={isReprocessing}
                    className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-40"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>{l.name}</option>
                    ))}
                  </select>
                  {isReprocessing && <Loader2 className="w-4 h-4 text-primary animate-spin self-center" />}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Currently translated to {getLanguageName(doc.translatedLanguageCode)}. Selecting another language re-runs the AI translation.
                </p>
                {reprocessError && <p className="text-[11px] text-destructive">{reprocessError}</p>}
              </div>
            )}

            <div className="flex gap-3 pt-3 border-t border-border">
              {onShare && (
                <button onClick={onShare} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/5 transition-colors">
                  <Share2 className="w-4 h-4" /> Share
                </button>
              )}
              <button
                onClick={handleDownload}
                disabled={!signedUrl || isDownloading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download original
              </button>
            </div>
            {!storagePath && (
              <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-muted/50 rounded-lg p-3">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>Original file not available for documents uploaded before file storage was enabled.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;
