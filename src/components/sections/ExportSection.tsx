import { useState } from "react";
import { FileDown, FileText, Filter, CheckSquare, Loader2, Lock, Languages, Calendar } from "lucide-react";
import { useVaultStore } from "@/store/vaultStore";
import { useAuth } from "@/hooks/useAuth";
import { hasAccess } from "@/lib/planAccess";
import { generateExportPDF, generateSelectionPDF, type ExportOptions } from "@/lib/pdfExport";
import { SUPPORTED_LANGUAGES, getLanguageName } from "@/lib/supportedLanguages";

type ExportMode = "full" | "category" | "selection";
type DateRangeKey = "all" | "12m" | "6m" | "custom";

const ExportSection = () => {
  const [mode, setMode] = useState<ExportMode | null>(null);
  const [generating, setGenerating] = useState(false);

  const store = useVaultStore();
  const { profile } = useAuth();
  const locked = !hasAccess(profile, "export");

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

  const patientName = profile?.full_name || "Patient";
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

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const options = buildOptions();
      if (mode === "selection") {
        await generateSelectionPDF(store, patientName, dob, selectedDocs, options);
      } else {
        await generateExportPDF(store, patientName, dob, options);
      }
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setGenerating(false);
    }
  };

  const cards: { id: ExportMode; icon: React.ElementType; title: string; desc: string }[] = [
    { id: "full", icon: FileText, title: "Full Health Brief", desc: "Complete health record compiled into a single professional PDF" },
    { id: "category", icon: Filter, title: "Export by Category", desc: "Select which sections to include in your export" },
    { id: "selection", icon: CheckSquare, title: "Export by Selection", desc: "Pick individual documents to combine into one PDF" },
  ];

  if (locked) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-3xl font-light text-foreground">Export</h2>
          <p className="text-sm text-muted-foreground mt-2">Generate professional PDF reports from your vault data</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-heading text-xl text-foreground mb-2">Standard Plan Required</h3>
          <p className="text-sm text-muted-foreground mb-2 max-w-md mx-auto">
            PDF Export is available on the Standard plan at £39/month.
          </p>
          <p className="text-xs text-muted-foreground">Upgrade coming soon.</p>
        </div>
      </div>
    );
  }

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
                <Stat label="Blood Results" value={store.bloodResults.length} />
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
                  ["blood", "Blood Results", store.bloodResults.length],
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

          <button
            onClick={handleGenerate}
            disabled={generateDisabled}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {generating ? `Translating & generating…` : `Generate PDF in ${getLanguageName(language)}`}
          </button>
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="p-3 bg-muted rounded-lg">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="font-heading text-lg text-foreground">{value}</p>
  </div>
);

export default ExportSection;
