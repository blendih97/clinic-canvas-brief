import { Pill, AlertTriangle, CheckCircle } from "lucide-react";
import { useVaultStore } from "@/store/vaultStore";

const MedicationsSection = () => {
  const medications = useVaultStore((s) => s.medications);
  const allergies = useVaultStore((s) => s.allergies);

  if (medications.length === 0 && allergies.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-3xl font-light text-foreground">Medications & Allergies</h2>
          <p className="text-sm text-muted-foreground mt-1">Upload a prescription or clinical letter to see medications here.</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground text-sm">
          No medications or allergies yet.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-3xl font-light text-foreground">Medications & Allergies</h2>
        <p className="text-sm text-muted-foreground mt-1">Extracted prescriptions and known sensitivities</p>
      </div>

      {allergies.length > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <h3 className="text-sm font-medium text-destructive">Known Allergies</h3>
          </div>
          <div className="flex gap-3 flex-wrap">
            {allergies.map((a) => (
              <div key={a.substance} className="bg-destructive/10 rounded px-3 py-2 border border-destructive/15">
                <p className="text-sm text-foreground font-medium">{a.substance}</p>
                <p className="text-[10px] text-destructive">{a.reaction} · {a.severity}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {medications.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Pill className="w-4 h-4 text-primary" />
            <h3 className="font-heading text-lg text-foreground">Active Medications</h3>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {medications.filter((m) => m.active).length} active
            </span>
          </div>
          <div className="divide-y divide-border/50">
            {medications.map((m) => (
              <div key={m.id} className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{m.name} <span className="text-primary">{m.dose}</span></p>
                  <p className="text-xs text-muted-foreground">{m.frequency}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-foreground">{m.prescriber}</p>
                  <p className="text-[10px] text-muted-foreground">{m.facility} · {m.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationsSection;
