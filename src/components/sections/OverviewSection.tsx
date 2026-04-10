import { FileText, Upload, Share2, AlertTriangle, Pill, CheckCircle } from "lucide-react";
import { useVaultStore } from "@/store/vaultStore";

type Section = "overview" | "blood" | "imaging" | "medications" | "documents" | "share" | "billing";

interface OverviewProps {
  onNavigate?: (s: Section) => void;
  onUpload?: () => void;
}

const OverviewSection = ({ onNavigate, onUpload }: OverviewProps) => {
  const { documents, allergies, medications } = useVaultStore();

  const recentDocs = [...documents].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const activeMeds = medications.filter((m) => m.active);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="font-heading text-3xl font-light text-foreground">Your Health Vault</h2>
        <p className="text-sm text-muted-foreground mt-2">
          {documents.length > 0
            ? `${documents.length} document${documents.length !== 1 ? "s" : ""} uploaded`
            : "Upload your first document to get started"}
        </p>
      </div>

      {/* Primary actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={onUpload}
          className="flex items-center gap-4 p-6 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all text-left group"
        >
          <div className="w-11 h-11 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Upload Document</p>
            <p className="text-xs opacity-80">PDF, image, or clinical letter</p>
          </div>
        </button>
        <button
          onClick={() => onNavigate?.("share")}
          className="flex items-center gap-4 p-6 bg-card border border-border rounded-xl hover:border-primary/40 transition-all text-left group"
        >
          <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Share2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Share with Clinician</p>
            <p className="text-xs text-muted-foreground">Generate a secure link</p>
          </div>
        </button>
      </div>

      {/* Recent Documents */}
      {recentDocs.length > 0 && (
        <div>
          <h3 className="font-heading text-lg text-foreground mb-4">Recent Documents</h3>
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {recentDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => onNavigate?.("documents")}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm text-foreground">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.facility}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {doc.extracted && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      <CheckCircle className="w-3 h-3" /> Extracted
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{doc.date}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Key Medical Info */}
      {(allergies.length > 0 || activeMeds.length > 0) && (
        <div>
          <h3 className="font-heading text-lg text-foreground mb-4">Key Medical Info</h3>
          <div className="space-y-4">
            {/* Allergies */}
            {allergies.length > 0 && (
              <div>
                <p className="text-xs tracking-wider text-muted-foreground uppercase font-medium mb-2">Allergies</p>
                <div className="flex flex-wrap gap-2">
                  {allergies.map((a, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-full text-xs font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      {a.substance} — {a.reaction}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Active Medications */}
            {activeMeds.length > 0 && (
              <div>
                <p className="text-xs tracking-wider text-muted-foreground uppercase font-medium mb-2">Active Medications</p>
                <div className="flex flex-wrap gap-2">
                  {activeMeds.map((m) => (
                    <span key={m.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-medium">
                      <Pill className="w-3 h-3" />
                      {m.name} {m.dose}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewSection;
