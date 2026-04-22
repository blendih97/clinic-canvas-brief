import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, FileText, Loader2, CheckCircle, X, AlertTriangle, Clipboard, Languages } from "lucide-react";
import { useVaultStore } from "@/store/vaultStore";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SUPPORTED_LANGUAGES, getLanguageName } from "@/lib/supportedLanguages";

type Phase = "input" | "processing" | "confirm" | "done";

interface ExtractedVisit {
  visit_date?: string | null;
  facility_name?: string | null;
  facility_country?: string | null;
  reason_for_visit?: string | null;
  investigations_performed?: string[] | null;
  findings?: string | null;
  diagnosis?: string | null;
  medications_prescribed?: string[] | null;
  follow_up_recommendations?: string[] | null;
  original_lang?: string | null;
}

interface ExtractionResult {
  bloodResults?: any[];
  imagingResults?: any[];
  medications?: any[];
  allergies?: any[];
  alerts?: any[];
  visits?: ExtractedVisit[];
  documentMeta?: {
    name: string;
    type: string;
    date: string;
    facility: string;
    country: string;
    pages: number;
    originalLang?: string;
  };
  summary?: {
    englishText?: string[];
    originalText?: string[];
    originalLang?: string;
  };
  fullText?: {
    original_content?: string;
    translated_content?: string;
    original_language_code?: string;
    translated_language_code?: string;
  };
}

const processingSteps = [
  "Reading document…",
  "Detecting language…",
  "Extracting health data…",
  "Classifying results…",
  "Validating extraction…",
];

const DocumentUpload = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [phase, setPhase] = useState<Phase>("input");
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const store = useVaultStore();
  const { user, profile } = useAuth();
  const [targetLanguage, setTargetLanguage] = useState<string>(profile?.preferred_translation_language || "en");

  useEffect(() => {
    if (profile?.preferred_translation_language) {
      setTargetLanguage(profile.preferred_translation_language);
    }
  }, [profile?.preferred_translation_language]);

  useEffect(() => {
    if (phase !== "processing") return;
    if (stepIndex >= processingSteps.length) return;
    const t = setTimeout(() => setStepIndex((i) => i + 1), 1200);
    return () => clearTimeout(t);
  }, [phase, stepIndex]);

  const reset = () => {
    setPhase("input");
    setFile(null);
    setPastedText("");
    setStepIndex(0);
    setResult(null);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const readFileAsBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

  const handleSubmit = useCallback(async () => {
    setPhase("processing");
    setStepIndex(0);
    setError(null);

    try {
      let payload: any = {};

      if (file) {
        const base64 = await readFileAsBase64(file);
        const isPdf = file.type === "application/pdf";
        const isImage = file.type.startsWith("image/");
        payload = {
          fileName: file.name,
          fileType: isPdf ? "pdf" : isImage ? "image" : "text",
          mediaType: file.type,
          base64,
        };
      } else if (pastedText.trim()) {
        payload = {
          fileName: "pasted-text.txt",
          fileType: "text",
          text: pastedText.trim(),
        };
      } else {
        setError("Please upload a file or paste text.");
        setPhase("input");
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke("analyse-document", {
        body: { ...payload, targetLanguage },
      });

      if (fnError) throw new Error(fnError.message || "Analysis failed");

      setResult(data);
      setPhase("confirm");
    } catch (e: any) {
      setError(e.message || "Something went wrong");
      setPhase("input");
    }
  }, [file, pastedText, targetLanguage]);

  const handleConfirm = async () => {
    if (!result || !user) return;
    const uid = user.id;

    // Upload original file to storage and get file_path
    let filePath: string | undefined;
    if (file) {
      const storagePath = `${uid}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("medical-documents")
        .upload(storagePath, file, { upsert: true });
      if (!uploadErr) {
        filePath = storagePath;
      }
    }

    if (result.bloodResults?.length) store.addBloodResults(result.bloodResults, uid);
    if (result.imagingResults?.length) store.addImagingResults(result.imagingResults, uid);
    if (result.medications?.length) store.addMedications(result.medications, uid);
    if (result.allergies?.length) store.addAllergies(result.allergies, uid);
    if (result.alerts?.length) store.addAlerts(result.alerts, uid);

    let createdDocumentId: string | undefined;
    if (result.documentMeta) {
      createdDocumentId = crypto.randomUUID();
      store.addDocuments([
        {
          id: createdDocumentId,
          name: result.documentMeta.name || file?.name || "Document",
          type: result.documentMeta.type || "Unknown",
          date: result.documentMeta.date || new Date().toISOString().split("T")[0],
          facility: result.documentMeta.facility || "Unknown",
          country: result.documentMeta.country || "Unknown",
          pages: result.documentMeta.pages || 1,
          extracted: true,
          fileUrl: filePath, // legacy field kept for compatibility
          filePath, // new dedicated field
          summary: result.summary || undefined,
          contentOriginal: result.fullText?.original_content || undefined,
          contentTranslated: result.fullText?.translated_content || undefined,
          originalLanguageCode: result.fullText?.original_language_code || undefined,
          translatedLanguageCode: result.fullText?.translated_language_code || targetLanguage,
        },
      ], uid);
    }

    if (result.visits?.length) {
      const visitRows = result.visits
        .filter((v) => v && (v.visit_date || v.reason_for_visit || v.diagnosis || v.findings))
        .map((v) => ({
          documentId: createdDocumentId,
          visitDate: v.visit_date || undefined,
          facilityName: v.facility_name || undefined,
          facilityCountry: v.facility_country || undefined,
          reasonForVisit: v.reason_for_visit || undefined,
          investigationsPerformed: v.investigations_performed || [],
          findings: v.findings || undefined,
          diagnosis: v.diagnosis || undefined,
          medicationsPrescribed: v.medications_prescribed || [],
          followUpRecommendations: v.follow_up_recommendations || [],
          originalLang: v.original_lang || undefined,
        }));
      if (visitRows.length > 0) await store.addVisits(visitRows, uid);
    }

    setPhase("done");
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ display: open ? "flex" : "none" }}
    >
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-heading text-xl text-foreground">
            {phase === "input" && "Upload Document"}
            {phase === "processing" && "Analysing…"}
            {phase === "confirm" && "Review Extraction"}
            {phase === "done" && "Success"}
          </h3>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {phase === "input" && (
            <div className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded bg-destructive/5 text-destructive text-xs border border-destructive/20">
                  <AlertTriangle className="w-4 h-4" /> {error}
                </div>
              )}

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-sm text-foreground">{file.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-foreground">Drop a file here or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF or image · Any language</p>
                  </>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground">or paste text</span></div>
              </div>

              <div className="relative">
                <Clipboard className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste clinical text, lab results, or report content…"
                  className="w-full pl-9 pr-3 py-3 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground resize-none h-24 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Languages className="w-3.5 h-3.5 text-primary" />
                  Translate this document into
                </label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}{l.nativeName && l.nativeName !== l.name ? ` — ${l.nativeName}` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  We'll detect the original language automatically. You'll always be able to view the original alongside the translation.
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!file && !pastedText.trim()}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
              >
                Upload and translate to {getLanguageName(targetLanguage)}
              </button>
            </div>
          )}

          {phase === "processing" && (
            <div className="py-8 space-y-4">
              {processingSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  {i < stepIndex ? (
                    <CheckCircle className="w-4 h-4 text-primary" />
                  ) : i === stepIndex ? (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-border" />
                  )}
                  <span className={`text-sm ${i <= stepIndex ? "text-foreground" : "text-muted-foreground"}`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          )}

          {phase === "confirm" && result && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We extracted the following from your document. Review and confirm to save.
              </p>

              {result.documentMeta && (
                <div className="p-3 bg-muted rounded-lg text-xs space-y-1">
                  <p><span className="text-muted-foreground">Type:</span> <span className="text-foreground">{result.documentMeta.type}</span></p>
                  <p><span className="text-muted-foreground">Facility:</span> <span className="text-foreground">{result.documentMeta.facility}</span></p>
                  <p><span className="text-muted-foreground">Date:</span> <span className="text-foreground">{result.documentMeta.date}</span></p>
                  <p><span className="text-muted-foreground">Country:</span> <span className="text-foreground">{result.documentMeta.country}</span></p>
                  {result.documentMeta.originalLang && result.documentMeta.originalLang !== "English" && (
                    <p><span className="text-muted-foreground">Language:</span> <span className="text-foreground">{result.documentMeta.originalLang} → English</span></p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                {(result.bloodResults?.length ?? 0) > 0 && (
                  <div className="p-2.5 bg-muted rounded flex items-center gap-2">
                    <span className="text-primary font-medium">{result.bloodResults!.length}</span> blood markers
                  </div>
                )}
                {(result.imagingResults?.length ?? 0) > 0 && (
                  <div className="p-2.5 bg-muted rounded flex items-center gap-2">
                    <span className="text-primary font-medium">{result.imagingResults!.length}</span> imaging findings
                  </div>
                )}
                {(result.medications?.length ?? 0) > 0 && (
                  <div className="p-2.5 bg-muted rounded flex items-center gap-2">
                    <span className="text-primary font-medium">{result.medications!.length}</span> medications
                  </div>
                )}
                {(result.allergies?.length ?? 0) > 0 && (
                  <div className="p-2.5 bg-muted rounded flex items-center gap-2">
                    <span className="text-primary font-medium">{result.allergies!.length}</span> allergies
                  </div>
                )}
                {(result.alerts?.length ?? 0) > 0 && (
                  <div className="p-2.5 bg-muted rounded flex items-center gap-2">
                    <span className="text-primary font-medium">{result.alerts!.length}</span> alerts
                  </div>
                )}
                {(result.visits?.length ?? 0) > 0 && (
                  <div className="p-2.5 bg-muted rounded flex items-center gap-2">
                    <span className="text-primary font-medium">{result.visits!.length}</span> clinical {result.visits!.length === 1 ? "visit" : "visits"}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={reset} className="flex-1 py-2 bg-muted text-foreground rounded-lg text-sm">
                  Discard
                </button>
                <button onClick={handleConfirm} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                  Confirm & Save
                </button>
              </div>
            </div>
          )}

          {phase === "done" && (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-heading text-xl text-foreground">Document Added</h4>
              <p className="text-sm text-muted-foreground">Your health record has been updated.</p>
              <button onClick={handleClose} className="mt-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
