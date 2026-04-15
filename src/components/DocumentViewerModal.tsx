import { useState, useEffect } from "react";
import { X, FileText, Download, Share2, Globe, Languages, Loader2 } from "lucide-react";
import type { Document, BloodResult, ImagingResult, Medication } from "@/store/vaultStore";
import { useVaultStore } from "@/store/vaultStore";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  document: Document;
  onClose: () => void;
  onShare?: () => void;
}

const getTextItems = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return [value];
  }

  return [];
};

const getSummaryContent = (summary?: Document["summary"]) => {
  if (!summary) {
    return { bullets: [] as string[], englishText: [] as string[], originalText: [] as string[], originalLang: undefined as string | undefined };
  }

  if (Array.isArray(summary) || typeof summary === "string") {
    const bullets = getTextItems(summary);
    return { bullets, englishText: bullets, originalText: [], originalLang: undefined as string | undefined };
  }

  return {
    bullets: getTextItems(summary.bullets),
    englishText: getTextItems(summary.englishText),
    originalText: getTextItems(summary.originalText),
    originalLang: typeof summary.originalLang === "string" && summary.originalLang.trim().length > 0 ? summary.originalLang : undefined,
  };
};

const DocumentViewerModal = ({ document: doc, onClose, onShare }: Props) => {
  const [lang, setLang] = useState<"english" | "original">("english");
  const { bloodResults, imagingResults, medications } = useVaultStore();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Get signed URL for the file
  useEffect(() => {
    if (!doc.fileUrl) return;
    // If it's already a full URL (legacy), use directly
    if (doc.fileUrl.startsWith("http")) {
      setSignedUrl(doc.fileUrl);
      return;
    }
    // Otherwise it's a storage path — get signed URL
    supabase.storage
      .from("medical-documents")
      .createSignedUrl(doc.fileUrl, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) setSignedUrl(data.signedUrl);
      });
  }, [doc.fileUrl]);

  const relatedBlood = bloodResults.filter((b) => b.source === doc.name || b.date === doc.date);
  const relatedImaging = imagingResults.filter((i) => i.facility === doc.facility && i.date === doc.date);
  const relatedMeds = medications.filter((m) => m.facility === doc.facility && m.date === doc.date);
  const summaryContent = getSummaryContent(doc.summary);
  const summaryItems = summaryContent.bullets.length > 0 ? summaryContent.bullets : summaryContent.englishText;

  const handleDownload = async () => {
    if (!signedUrl || isDownloading) return;

    try {
      setIsDownloading(true);
      const response = await fetch(signedUrl);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = objectUrl;
      a.download = doc.name;
      window.document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // For the "original" language toggle, show original lang data from related imaging
  const originalLang = summaryContent.originalLang || relatedImaging.find(i => i.originalLang && i.originalLang !== "English")?.originalLang;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      style={{ display: "flex" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-background rounded-xl border border-border w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="font-heading text-xl text-foreground">{doc.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto flex flex-col md:flex-row">
          {/* Left — file viewer */}
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

          {/* Right — structured data */}
          <div className="md:w-1/2 p-5 overflow-auto space-y-5">
            {/* Language toggle */}
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <button
                onClick={() => setLang("english")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${lang === "english" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                <Globe className="w-3 h-3" /> English
              </button>
              <button
                onClick={() => setLang("original")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${lang === "original" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                <Languages className="w-3 h-3" /> Original{originalLang ? ` (${originalLang})` : ""}
              </button>
            </div>

            {lang === "original" && (
              <p className="text-xs text-primary bg-primary/5 border border-primary/10 rounded-lg p-3">
                {originalLang
                  ? `Showing extracted text in ${originalLang} where available.`
                  : "No original language data is available for this document."}
              </p>
            )}

            {/* Metadata */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="text-foreground">{doc.date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Facility</span>
                <span className="text-foreground">{doc.facility}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span className="text-foreground">{doc.type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Country</span>
                <span className="text-foreground">{doc.country}</span>
              </div>
            </div>

            {/* Original text */}
            {lang === "original" && (
              <div>
                <h4 className="text-xs tracking-wider text-muted-foreground uppercase font-medium mb-2">
                  Original Text{originalLang ? ` (${originalLang})` : ""}
                </h4>
                {summaryContent.originalText.length > 0 ? (
                  <div className="space-y-2">
                    {summaryContent.originalText.map((item, i) => (
                      <p key={i} className="text-sm text-foreground/80 leading-relaxed">
                        {item}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Original-language text was not saved for this record, so only the English extraction is available right now.
                  </p>
                )}
              </div>
            )}

            {/* Summary */}
            {lang === "english" && summaryItems.length > 0 && (
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

            {/* Key Data — Blood Results */}
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

            {/* Key Data — Imaging */}
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

            {/* Key Data — Medications */}
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

            {/* Actions */}
            <div className="flex gap-3 pt-3 border-t border-border">
              {onShare && (
                <button onClick={onShare} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/5 transition-colors">
                  <Share2 className="w-4 h-4" /> Share this document
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
            {!signedUrl && (
              <p className="text-[11px] text-muted-foreground">
                This record does not have an original file stored yet, so preview and download are unavailable.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;
