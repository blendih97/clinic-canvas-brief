import { useEffect, useState } from "react";
import { FileDown, FileText, Filter, CheckSquare, Loader2, Languages, Calendar, Sparkles, Lock, ExternalLink } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useVaultStore } from "@/store/vaultStore";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradeModal from "@/components/UpgradeModal";
import { generateExportPDF, generateSelectionPDF, type ExportOptions } from "@/lib/pdfExport";
import { generatePatientSummaryV2, downloadBlob, type ProgressPhase } from "@/lib/pdfExportV2";
import { SUPPORTED_LANGUAGES, getLanguageName } from "@/lib/supportedLanguages";

type ExportMode = "full" | "category" | "selection";
type DateRangeKey = "all" | "12m" | "6m" | "custom";

const ExportSection = () => {
  const [mode, setMode] = useState<ExportMode | null>(null);
  const isMobile = useIsMobile();
  const [generating, setGenerating] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const store = useVaultStore();
  const { profile, user } = useAuth();
  const { isActive } = useSubscription();

  // Modal state — shared across all three modes
  const [language, setLanguage] = useState<string>(profile?.preferred_ui_language || "en");
  const [sections, setSections] = useState({
    blood: true,
    imaging: true,
    medications: true,
    allergies: true,
    documents: true,
  });
  const [includeAppendix, setIncludeAppendix] = useState(true);
  const [dateRange, setDateRange] = useState<DateRangeKey>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // Selection-only state
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  // Demo override for advertising account.
  // Demo override for advertising account.
  const isDemoAccount = (user?.email || "").toLowerCase().includes("greenbears");
  const patientName = isDemoAccount ? "John Doe" : (profile?.full_name || "Patient");
  const dob = profile?.date_of_birth || "";

  const toggleSection = (key: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleDoc = (id: string) => {
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const buildOptions = (): ExportOptions => ({
    language,
    sections: mode === "full" ? { blood: true, imaging: true, medications: true, allergies: true, documents: true } : sections,
    includeOriginalsAppendix: includeAppendix,
    dateRange:
      dateRange === "custom"
        ? { from: customFrom, to: customTo }
        : dateRange,
  });

  const [progressPhase, setProgressPhase] = useState<ProgressPhase | null>(null);

  const handleGenerate = async () => {
    if (!isActive && (mode === "category" || mode === "selection")) {
      setShowUpgrade(true);
      return;
    }
    setGenerating(true);
    setProgressPhase(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewBlob(null);
    setPreviewUrl(null);
    try {
      const options = buildOptions();
      if (mode === "selection") {
        await generateSelectionPDF(store, patientName, dob, selectedDocs, options);
      } else if (mode === "full") {
        const blob = await generatePatientSummaryV2({
          data: {
            bloodResults: store.bloodResults,
            imagingResults: store.imagingResults,
            medications: store.medications,
            documents: store.documents,
            alerts: store.alerts,
            allergies: store.allergies,
          },
          visits: store.visits,
          imagingOverrides: store.imagingLinkOverrides,
          patient: {
            fullName: patientName,
            dob,
            biologicalSex: (profile as any)?.biological_sex || undefined,
            nationality: profile?.nationality || undefined,
            bloodType: profile?.blood_type || undefined,
            chronicConditions: (profile as any)?.current_diagnoses || undefined,
          },
          language,
          onProgress: (phase) => setProgressPhase(phase),
        });
        const safeName = (patientName || "patient").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();
        if (isActive) {
          downloadBlob(blob, `rinvita-health-brief-${safeName}-${language}.pdf`);
        } else {
          setPreviewBlob(blob);
          setPreviewUrl(URL.createObjectURL(blob));
        }
      } else {
        await generateExportPDF(store, patientName, dob, options);
      }
    } catch (err) {
      console.error("PDF generation error:", err);
      const message = err instanceof Error ? err.message : "PDF generation failed. Please try again.";
      (await import("sonner")).toast.error(message);
    } finally {
      setGenerating(false);
      setProgressPhase(null);
    }
  };

  const handleDownloadFromPreview = () => {
    if (!previewBlob) return;
    if (!isActive) { setShowUpgrade(true); return; }
    const safeName = (patientName || "patient").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();
    downloadBlob(previewBlob, `rinvita-health-brief-${safeName}-${language}.pdf`);
  };

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const cards: { id: ExportMode; icon: React.ElementType; title: string; desc: string }[] = [
    { id: "full", icon: FileText, title: "Full Health Brief", desc: "Complete health record compiled into a single professional PDF" },
    { id: "category", icon: Filter, title: "Export by Category", desc: "Select which sections to include in your export" },
    { id: "selection", icon: CheckSquare, title: "Export by Selection", desc: "Pick individual documents to combine into one PDF" },
  ];

  const generateDisabled =
    generating ||
    (mode === "selection" && selectedDocs.size === 0) ||
    (mode === "category" && !Object.values(sections).some(Boolean)) ||
    (dateRange === "custom" && (!customFrom || !customTo));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-3xl font-light text-foreground">Export</h2>
        <p className="text-sm text-muted-foreground mt-2">Generate professional PDF reports from your vault data, in any language</p>
      </div>

      {!mode ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => setMode(card.id)}
              className="text-left bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <card.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading text-lg text-foreground mb-1">{card.title}</h3>
              <p className="text-xs text-muted-foreground">{card.desc}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <button onClick={() => setMode(null)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to export options
          </button>

          {mode === "full" && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-heading text-xl text-foreground mb-2">Full Health Brief</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Complete PDF including every section with source clinic and date for every entry.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Stat label="Lab Results" value={store.bloodResults.length} />
                <Stat label="Imaging" value={store.imagingResults.length} />
                <Stat label="Medications" value={store.medications.length} />
                <Stat label="Allergies" value={store.allergies.length} />
                <Stat label="Documents" value={store.documents.length} />
                <Stat label="Alerts" value={store.alerts.length} />
              </div>
            </div>
          )}

          {mode === "category" && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-heading text-xl text-foreground mb-4">Which records to include</h3>
              <div className="space-y-3">
                {([
                  ["blood", "Lab Results", store.bloodResults.length],
                  ["imaging", "Imaging Findings", store.imagingResults.length],
                  ["medications", "Medications", store.medications.length],
                  ["allergies", "Allergies", store.allergies.length],
                  ["documents", "Documents", store.documents.length],
                ] as const).map(([key, label, count]) => (
                  <label key={key} className="flex items-center justify-between p-4 bg-background border border-border rounded-lg cursor-pointer hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={sections[key]}
                        onChange={() => toggleSection(key)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">{label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{count} items</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {mode === "selection" && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-heading text-xl text-foreground mb-4">Select Documents</h3>
              {store.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents in your vault yet.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {store.documents.map((doc) => (
                    <label key={doc.id} className="flex items-center gap-3 p-4 bg-background border border-border rounded-lg cursor-pointer hover:border-primary/20 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedDocs.has(doc.id)}
                        onChange={() => toggleDoc(doc.id)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.facility} · {doc.date}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full">{doc.type}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Shared options: language, date range, appendix */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-2">
                <Languages className="w-3.5 h-3.5 text-primary" /> Export language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}{l.nativeName && l.nativeName !== l.name ? ` — ${l.nativeName}` : ""}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Section headings, labels, and clinical content will be translated to {getLanguageName(language)}.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-2">
                <Calendar className="w-3.5 h-3.5 text-primary" /> Date range
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  ["all", "All time"],
                  ["12m", "Last 12 months"],
                  ["6m", "Last 6 months"],
                  ["custom", "Custom range"],
                ] as const).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setDateRange(k)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      dateRange === k
                        ? "bg-primary/10 border-primary/40 text-foreground"
                        : "bg-background border-border text-muted-foreground hover:border-primary/20"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {dateRange === "custom" && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  />
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  />
                </div>
              )}
            </div>

            <label className="flex items-center justify-between p-3 bg-background border border-border rounded-lg cursor-pointer">
              <div>
                <p className="text-sm text-foreground">Include original documents as appendix</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Appends the source-language text of each document at the end of the PDF.</p>
              </div>
              <input
                type="checkbox"
                checked={includeAppendix}
                onChange={(e) => setIncludeAppendix(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
            </label>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleGenerate}
              disabled={generateDisabled}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              {generating
                ? progressPhase === "translating"
                  ? "Translating content…"
                  : progressPhase === "rendering"
                  ? "Rendering PDF…"
                  : progressPhase === "ready"
                  ? "Ready — downloading…"
                  : "Preparing…"
                : `Generate PDF in ${getLanguageName(language)}`}
            </button>
            {generating && mode === "full" && (
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <ProgressDot active={progressPhase === "translating"} done={progressPhase === "rendering" || progressPhase === "ready"} label="Translating" />
                <span className="text-muted-foreground/40">→</span>
                <ProgressDot active={progressPhase === "rendering"} done={progressPhase === "ready"} label="Rendering" />
                <span className="text-muted-foreground/40">→</span>
                <ProgressDot active={progressPhase === "ready"} done={false} label="Ready" />
              </div>
            )}
            {!generating && mode === "full" && (
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Sparkles className="w-3 h-3 text-primary" />
                New export engine — full Patient Summary, Visit History, Medications, Blood and Imaging in 45+ languages.
              </p>
            )}
          </div>

          {/* PDF preview for free users — paywalls the download button */}
          {previewUrl && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Preview ready</p>
                    <p className="text-[11px] text-muted-foreground">
                      {isActive ? "Your full Health Brief is ready to download." : "Upgrade to download the full PDF."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadFromPreview}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
                >
                  {isActive ? <FileDown className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {isActive ? "Download PDF" : "Unlock & download"}
                </button>
              </div>
              {isMobile ? (
                <div className="flex flex-col items-center justify-center gap-3 p-8 text-center" style={{ minHeight: "40vh", background: "hsl(var(--muted))" }}>
                  <FileText className="w-10 h-10 text-muted-foreground" />
                  <p className="text-sm text-foreground">PDF preview isn't supported inline on mobile.</p>
                  <p className="text-xs text-muted-foreground">Open the preview in a new tab to view it.</p>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open preview
                  </a>
                </div>
              ) : (
                <iframe
                  src={previewUrl}
                  title="Health Brief preview"
                  className="w-full"
                  style={{ height: "70vh", border: 0, background: "hsl(var(--muted))" }}
                />
              )}
            </div>
          )}
        </div>
      )}

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="export"
        customMessage="Downloading your Health Brief PDF is a Standard feature. Free accounts get full preview — upgrade to download, share, and request records."
      />
    </div>
  );
};

const ProgressDot = ({ active, done, label }: { active: boolean; done: boolean; label: string }) => (
  <span className={`flex items-center gap-1.5 transition-opacity ${active || done ? "opacity-100 text-foreground" : "opacity-50"}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${done ? "bg-primary" : active ? "bg-primary animate-pulse" : "bg-muted-foreground/40"}`} />
    {label}
  </span>
);

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="p-3 bg-muted rounded-lg">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="font-heading text-lg text-foreground">{value}</p>
  </div>
);

export default ExportSection;
