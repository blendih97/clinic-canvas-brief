import { useState } from "react";
import { Pill, AlertTriangle, CheckCircle, Plus, X, Edit2, Trash2 } from "lucide-react";
import { useVaultStore } from "@/store/vaultStore";
import { useAuth } from "@/hooks/useAuth";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";

const MedicationsSection = () => {
  const { medications, allergies, addMedications, addAllergies, removeMedication, removeAllergy, updateMedication } = useVaultStore();
  const { user } = useAuth();
  const [showMedModal, setShowMedModal] = useState(false);
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [editingMed, setEditingMed] = useState<string | null>(null);

  // Med form state
  const [medName, setMedName] = useState("");
  const [medDose, setMedDose] = useState("");
  const [medFreq, setMedFreq] = useState("");
  const [medDate, setMedDate] = useState("");
  const [medPrescriber, setMedPrescriber] = useState("");

  // Allergy form state
  const [allergySubstance, setAllergySubstance] = useState("");
  const [allergyReaction, setAllergyReaction] = useState("");
  const [allergySeverity, setAllergySeverity] = useState("Mild");

  const resetMedForm = () => {
    setMedName(""); setMedDose(""); setMedFreq(""); setMedDate(""); setMedPrescriber("");
    setEditingMed(null);
  };

  const resetAllergyForm = () => {
    setAllergySubstance(""); setAllergyReaction(""); setAllergySeverity("Mild");
  };

  const handleSaveMed = async () => {
    if (!medName.trim() || !user) return;
    if (editingMed) {
      await updateMedication(editingMed, {
        name: medName, dose: medDose, frequency: medFreq, date: medDate, prescriber: medPrescriber,
      });
    } else {
      await addMedications([{
        id: crypto.randomUUID(), name: medName, dose: medDose, frequency: medFreq,
        date: medDate || new Date().toISOString().split("T")[0], prescriber: medPrescriber,
        facility: "", active: true, source: "manual",
      }], user.id);
    }
    resetMedForm();
    setShowMedModal(false);
  };

  const handleSaveAllergy = async () => {
    if (!allergySubstance.trim() || !user) return;
    await addAllergies([{
      substance: allergySubstance, reaction: allergyReaction, severity: allergySeverity,
      source: "manual",
    }], user.id);
    resetAllergyForm();
    setShowAllergyModal(false);
  };

  const openEditMed = (m: typeof medications[0]) => {
    setMedName(m.name); setMedDose(m.dose); setMedFreq(m.frequency);
    setMedDate(m.date); setMedPrescriber(m.prescriber); setEditingMed(m.id);
    setShowMedModal(true);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-3xl font-light text-foreground">Medications & Allergies</h2>
        <p className="text-sm text-muted-foreground mt-2">Extracted prescriptions, manually added entries, and known sensitivities</p>
      </div>

      {/* Allergies */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <h3 className="text-sm font-medium text-destructive">Known Allergies</h3>
          </div>
          <button onClick={() => setShowAllergyModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors">
            <Plus className="w-3 h-3" /> Add Allergy
          </button>
        </div>
        {allergies.length > 0 ? (
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
            <div className="flex gap-3 flex-wrap">
              {allergies.map((a, i) => (
                <div key={a.id || i} className="bg-destructive/10 rounded px-3 py-2 border border-destructive/15 flex items-center gap-2">
                  <div>
                    <p className="text-sm text-foreground font-medium">{a.substance}</p>
                    <p className="text-[10px] text-destructive">
                      {a.reaction} · {a.severity}
                      {a.source === "manual" && <span className="ml-1 px-1 py-0.5 bg-muted text-muted-foreground rounded text-[9px]">Manual</span>}
                    </p>
                  </div>
                  {a.source === "manual" && a.id && (
                    <button onClick={() => removeAllergy(a.id!)} className="text-destructive/60 hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-6 text-center text-muted-foreground text-sm">
            No known allergies recorded.
          </div>
        )}
      </div>

      {/* Medications */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-primary" />
            <h3 className="font-heading text-lg text-foreground">Medications</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {medications.filter((m) => m.active).length} active
            </span>
          </div>
          <button onClick={() => { resetMedForm(); setShowMedModal(true); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors">
            <Plus className="w-3 h-3" /> Add Medication
          </button>
        </div>
        {medications.length > 0 ? (
          <div className="bg-card border border-border rounded-lg overflow-hidden divide-y divide-border/50">
            {medications.map((m) => (
              <div key={m.id} className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {m.name} <span className="text-primary">{m.dose}</span>
                    {m.source === "manual" && <span className="ml-2 px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-[9px]">Manual</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.frequency}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-foreground">{m.prescriber}</p>
                  <p className="text-[10px] text-muted-foreground">{m.facility ? `${m.facility} · ` : ""}{m.date}</p>
                </div>
                {m.source === "manual" && (
                  <div className="flex gap-1">
                    <button onClick={() => openEditMed(m)} className="p-1 text-muted-foreground hover:text-foreground"><Edit2 className="w-3 h-3" /></button>
                    <button onClick={() => removeMedication(m.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground text-sm">
            No medications yet. Upload a prescription or add one manually.
          </div>
        )}
      </div>

      <MedicalDisclaimer />

      {/* Add/Edit Medication Modal */}
      {showMedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ display: "flex" }}>
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => { setShowMedModal(false); resetMedForm(); }} />
          <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg text-foreground">{editingMed ? "Edit Medication" : "Add Medication"}</h3>
              <button onClick={() => { setShowMedModal(false); resetMedForm(); }} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground">Medication Name *</label>
                <input value={medName} onChange={(e) => setMedName(e.target.value)} placeholder="e.g. Metformin"
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground">Dose</label>
                  <input value={medDose} onChange={(e) => setMedDose(e.target.value)} placeholder="e.g. 500mg"
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Frequency</label>
                  <input value={medFreq} onChange={(e) => setMedFreq(e.target.value)} placeholder="e.g. Once daily"
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground">Start Date</label>
                  <input type="date" value={medDate} onChange={(e) => setMedDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Prescribing Doctor</label>
                  <input value={medPrescriber} onChange={(e) => setMedPrescriber(e.target.value)} placeholder="Optional"
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <button onClick={handleSaveMed} disabled={!medName.trim()}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40">
                {editingMed ? "Update Medication" : "Add Medication"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Allergy Modal */}
      {showAllergyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ display: "flex" }}>
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => { setShowAllergyModal(false); resetAllergyForm(); }} />
          <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg text-foreground">Add Allergy</h3>
              <button onClick={() => { setShowAllergyModal(false); resetAllergyForm(); }} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground">Substance / Allergen *</label>
                <input value={allergySubstance} onChange={(e) => setAllergySubstance(e.target.value)} placeholder="e.g. Penicillin"
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Reaction Type</label>
                <input value={allergyReaction} onChange={(e) => setAllergyReaction(e.target.value)} placeholder="e.g. Rash, Anaphylaxis"
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Severity</label>
                <select value={allergySeverity} onChange={(e) => setAllergySeverity(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                </select>
              </div>
              <button onClick={handleSaveAllergy} disabled={!allergySubstance.trim()}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40">
                Add Allergy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationsSection;
