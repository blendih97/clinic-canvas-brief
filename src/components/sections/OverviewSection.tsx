import { FileText, AlertTriangle, Globe, Pill, Upload, Share2, Droplets, ScanLine, AlertCircle, Clock } from "lucide-react";
import { useVaultStore } from "@/store/vaultStore";

type Section = "overview" | "blood" | "imaging" | "medications" | "documents" | "share" | "billing";

interface OverviewProps {
  onNavigate?: (s: Section) => void;
  onUpload?: () => void;
}

const OverviewSection = ({ onNavigate, onUpload }: OverviewProps) => {
  const { bloodResults, imagingResults, medications, documents, alerts, allergies } = useVaultStore();

  const totalRecords = bloodResults.length + imagingResults.length + medications.length + documents.length;
  const activeFlags = alerts.length;
  const countries = new Set(documents.map((d) => d.country)).size;
  const activeMeds = medications.filter((m) => m.active).length;

  const kpis = [
    { label: "Records", value: totalRecords, icon: FileText },
    { label: "Active Flags", value: activeFlags, icon: AlertTriangle, accent: activeFlags > 0 },
    { label: "Countries", value: countries, icon: Globe },
    { label: "Medications", value: activeMeds, icon: Pill },
  ];

  const shortcuts = [
    { id: "blood" as Section, label: "Blood Results", icon: Droplets, count: bloodResults.length },
    { id: "imaging" as Section, label: "Imaging", icon: ScanLine, count: imagingResults.length },
    { id: "medications" as Section, label: "Medications", icon: Pill, count: medications.length },
    { id: "documents" as Section, label: "Documents", icon: FileText, count: documents.length },
  ];

  const recentDocs = [...documents].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-heading text-3xl font-light text-foreground">Your Vault</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {totalRecords > 0
            ? `${totalRecords} records across ${countries || 0} ${countries === 1 ? "country" : "countries"}`
            : "Upload your first document to get started"}
        </p>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={onUpload}
          className="flex items-center gap-4 p-5 bg-card border border-border rounded-lg hover:border-primary/40 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Upload Document</p>
            <p className="text-xs text-muted-foreground">PDF, image, or clinical letter</p>
          </div>
        </button>
        <button
          onClick={() => onNavigate?.("share")}
          className="flex items-center gap-4 p-5 bg-card border border-border rounded-lg hover:border-primary/40 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Share2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Share Access</p>
            <p className="text-xs text-muted-foreground">Generate a secure link for your clinician</p>
          </div>
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <kpi.icon className={`w-4 h-4 ${kpi.accent ? "text-primary" : "text-muted-foreground"}`} />
              <span className="text-[10px] tracking-wider text-muted-foreground uppercase">{kpi.label}</span>
            </div>
            <p className={`font-heading text-3xl font-light ${kpi.accent ? "text-primary" : "text-foreground"}`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Section shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {shortcuts.map((s) => (
          <button
            key={s.id}
            onClick={() => onNavigate?.(s.id)}
            className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-all text-left"
          >
            <s.icon className="w-5 h-5 text-primary mb-2" />
            <p className="text-sm font-medium text-foreground">{s.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.count} records</p>
          </button>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-primary" />
            <h3 className="font-heading text-lg text-foreground">Intelligence Alerts</h3>
          </div>
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`p-3 rounded border text-xs leading-relaxed ${
                  alert.type === "critical"
                    ? "bg-destructive/5 text-destructive border-destructive/20"
                    : "bg-primary/5 text-primary border-primary/20"
                }`}
              >
                {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent uploads */}
      {recentDocs.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-heading text-lg text-foreground">Recent Uploads</h3>
          </div>
          <div className="space-y-2">
            {recentDocs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">{doc.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{doc.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewSection;
