import { useEffect, useState } from "react";
import { FileText, X, Loader2, ExternalLink, Download, Languages, Globe, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface SharedDoc {
  id: string | null;
  name: string | null;
  type: string | null;
  date: string | null;
  facility: string | null;
  country: string | null;
  summary: unknown;
  contentTranslated: string | null;
  contentOriginal: string | null;
  originalLanguageCode: string | null;
  translatedLanguageCode: string | null;
  fileShared: boolean;
}

const RTL = new Set(["ar", "he", "fa", "ur", "ps", "sd", "yi", "ckb"]);

export function summaryLines(summary: unknown): string[] {
  const take = (v: unknown) => Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : typeof v === "string" && v.trim() ? [v] : [];
  if (!summary) return [];
  if (Array.isArray(summary) || typeof summary === "string") return take(summary);
  const s = summary as Record<string, unknown>;
  const english = take(s.englishText);
  return english.length ? english : take(s.bullets);
}

const PREVIEW_COUNT = 3;

/** Documents section of the doctor's share page: list, "view all", and a side-by-side viewer. */
const SharedDocuments = ({ token, documents }: { token: string; documents: SharedDoc[] }) => {
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState<SharedDoc | null>(null);
  if (documents.length === 0) return null;
  const visible = showAll ? documents : documents.slice(0, PREVIEW_COUNT);

  return (
    <section>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <h2 className="font-heading text-lg text-foreground">Documents ({documents.length})</h2>
        </div>
        {documents.length > PREVIEW_COUNT && (
          <button onClick={() => setShowAll((v) => !v)} className="text-xs font-medium text-primary hover:underline">
            {showAll ? "Show fewer" : `View all ${documents.length} documents`}
          </button>
        )}
      </div>
      <div className="space-y-3">
        {visible.map((d, i) => {
          const lines = summaryLines(d.summary);
          return (
            <div key={d.id || i} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground break-words">{d.name || "Document"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{[d.type, d.facility, d.date].filter(Boolean).join(" · ")}</p>
                </div>
                <button onClick={() => setOpen(d)} className="shrink-0 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90">
                  Open
                </button>
              </div>
              {lines.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {lines.slice(0, 3).map((l, j) => <li key={j} className="text-sm text-foreground/80 flex gap-2"><span className="text-primary">•</span><span>{l}</span></li>)}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      {open && <SharedDocumentViewer token={token} doc={open} onClose={() => setOpen(null)} />}
    </section>
  );
};

const SharedDocumentViewer = ({ token, doc, onClose }: { token: string; doc: SharedDoc; onClose: () => void }) => {
  const [file, setFile] = useState<{ url: string; kind: string } | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [showOriginalText, setShowOriginalText] = useState(false);
  const lines = summaryLines(doc.summary);
  const isSmallScreen = typeof window !== "undefined" && window.matchMedia?.("(max-width: 767px)").matches;
  const origCode = (doc.originalLanguageCode || "").toLowerCase();
  const hasOriginalText = !!doc.contentOriginal && origCode !== "" && origCode !== (doc.translatedLanguageCode || "en").toLowerCase();

  const loadFile = async () => {
    if (!doc.id || loadingFile) return;
    setLoadingFile(true); setFileError(null);
    const { data, error } = await supabase.functions.invoke("get-shared-brief", { body: { token, documentId: doc.id } });
    const url = (data as any)?.url;
    let code: string | undefined = (data as any)?.revoked ? "revoked" : (data as any)?.expired ? "expired" : undefined;
    if (error) { try { code = (await (error as any)?.context?.json?.())?.error; } catch { /* generic */ } }
    if (error || !url) setFileError(
      code === "no_file" ? "The original file wasn't stored for this record. RinVita's reading is shown alongside."
      : code === "revoked" || code === "expired" || !code ? "This link has expired or been revoked, so the original can no longer be opened."
      : "The original file couldn't be opened. Please try again.");
    else setFile({ url, kind: (data as any)?.kind || "other" });
    setLoadingFile(false);
  };

  // Load the original as soon as the viewer opens (each request is checked server-side).
  useEffect(() => { if (doc.fileShared) void loadFile(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id]);

  const text = showOriginalText ? doc.contentOriginal : doc.contentTranslated;
  const rtl = showOriginalText ? RTL.has(origCode) : RTL.has((doc.translatedLanguageCode || "").toLowerCase());

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3 md:p-6" onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label={doc.name || "Document"}>
      <div className="bg-background rounded-xl border border-border w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="min-w-0">
            <h3 className="font-heading text-lg text-foreground truncate">{doc.name || "Document"}</h3>
            <p className="text-xs text-muted-foreground">{[doc.type, doc.facility, doc.country, doc.date].filter(Boolean).join(" · ")}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg" aria-label="Close"><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-auto flex flex-col md:flex-row">
          <div className="md:w-1/2 border-b md:border-b-0 md:border-r border-border bg-muted/30 min-h-[320px] flex flex-col">
            {!doc.fileShared ? (
              <div className="m-auto text-center p-8 text-sm text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />The patient shared RinVita's reading of this document, not the original file.
              </div>
            ) : loadingFile ? (
              <div className="m-auto flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading original…</div>
            ) : fileError ? (
              <div className="m-auto text-center p-8 text-sm text-muted-foreground space-y-3">
                <AlertCircle className="w-8 h-8 mx-auto opacity-50" /><p>{fileError}</p>
                <button onClick={loadFile} className="text-primary text-xs font-medium hover:underline">Try again</button>
              </div>
            ) : file ? (
              <>
                <div className="flex justify-end gap-2 p-2 border-b border-border bg-background/80">
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md text-xs hover:bg-muted"><ExternalLink className="w-3.5 h-3.5" /> Open in new tab</a>
                  <a href={file.url} download={doc.name || undefined} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md text-xs hover:bg-muted"><Download className="w-3.5 h-3.5" /> Download</a>
                </div>
                <div className="flex-1 overflow-auto p-3 flex items-start justify-center">
                  {file.kind === "image" ? <img src={file.url} alt={doc.name || "Original document"} className="max-w-full rounded" />
                    : isSmallScreen ? (
                      // Phones don't display PDFs inside a page reliably: open them in the browser's viewer.
                      <a href={file.url} target="_blank" rel="noopener noreferrer" className="m-auto inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"><ExternalLink className="w-4 h-4" /> Open the original PDF</a>
                    ) : <iframe src={file.url} title={doc.name || "Original document"} className="w-full min-h-[520px] rounded border-0 bg-white" />}
                </div>
              </>
            ) : null}
          </div>
          <div className="md:w-1/2 p-5 overflow-auto space-y-5">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">RinVita's reading of this document</p>
            {hasOriginalText && (
              <div className="flex gap-1 bg-muted rounded-lg p-1" role="tablist">
                <button role="tab" aria-selected={!showOriginalText} onClick={() => setShowOriginalText(false)} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ${!showOriginalText ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}><Globe className="w-3 h-3" /> Translation</button>
                <button role="tab" aria-selected={showOriginalText} onClick={() => setShowOriginalText(true)} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ${showOriginalText ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}><Languages className="w-3 h-3" /> Original text</button>
              </div>
            )}
            {lines.length > 0 && !showOriginalText && (
              <div>
                <h4 className="text-xs tracking-wider text-muted-foreground uppercase font-medium mb-2">Summary</h4>
                <ul className="space-y-1.5">{lines.map((l, j) => <li key={j} className="text-sm text-foreground/85 flex gap-2"><span className="text-primary mt-0.5">•</span><span>{l}</span></li>)}</ul>
              </div>
            )}
            {text ? (
              <div>
                <h4 className="text-xs tracking-wider text-muted-foreground uppercase font-medium mb-2">{showOriginalText ? "Original text" : "Full text"}</h4>
                <div dir={rtl ? "rtl" : "ltr"} className={`text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap p-4 bg-muted/40 rounded-lg border border-border/60 ${rtl ? "text-right" : ""}`}>{text}</div>
              </div>
            ) : lines.length === 0 ? (
              <p className="text-sm text-muted-foreground">RinVita has no extracted text for this document. Please refer to the original.</p>
            ) : null}
            <p className="text-[11px] text-muted-foreground">Extracted and translated by AI at the patient's request. Check against the original before clinical use.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedDocuments;
