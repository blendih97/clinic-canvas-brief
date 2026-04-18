import { useState } from "react";
import { FileDown, FileText, Filter, CheckSquare, Loader2, Lock } from "lucide-react";
import { useVaultStore } from "@/store/vaultStore";
import { useAuth } from "@/hooks/useAuth";
import { hasAccess } from "@/lib/planAccess";
import { generateFullBriefPDF, generateCategoryPDF, generateSelectionPDF } from "@/lib/pdfExport";

type ExportMode = "full" | "category" | "selection";

const ExportSection = () => {
  const [mode, setMode] = useState<ExportMode | null>(null);
  const [generating, setGenerating] = useState(false);

  // Category toggles
  const [categories, setCategories] = useState({
    blood: true,
    imaging: true,
    medications: true,
    allergies: true,
    documents: true,
  });

  // Selection checkboxes
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  const store = useVaultStore();
  const { profile } = useAuth();

  const patientName = profile?.full_name || "Patient";
  const dob = profile?.date_of_birth || "";

  const toggleCategory = (key: keyof typeof categories) => {
    setCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleDoc = (id: string) => {
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      if (mode === "full") {
        await generateFullBriefPDF(store, patientName, dob);
      } else if (mode === "category") {
        await generateCategoryPDF(store, patientName, dob, categories);
      } else if (mode === "selection") {
        await generateSelectionPDF(store, patientName, dob, selectedDocs);
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-3xl font-light text-foreground">Export</h2>
        <p className="text-sm text-muted-foreground mt-2">Generate professional PDF reports from your vault data</p>
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
                This will generate a comprehensive PDF including all your health data with source clinic and date for every entry.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
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
              <h3 className="font-heading text-xl text-foreground mb-4">Select Categories</h3>
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
                        checked={categories[key]}
                        onChange={() => toggleCategory(key)}
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

          <button
            onClick={handleGenerate}
            disabled={generating || (mode === "selection" && selectedDocs.size === 0) || (mode === "category" && !Object.values(categories).some(Boolean))}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {generating ? "Generating…" : "Generate PDF"}
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
