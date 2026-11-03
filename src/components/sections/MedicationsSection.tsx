import { useState } from "react";
import { Pill, AlertTriangle, CheckCircle, Plus, X, Edit2, Trash2, History, RotateCcw, CircleStop } from "lucide-react";
import { dedupeMedications, useVaultStore } from "@/store/vaultStore";
import { useAuth } from "@/hooks/useAuth";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";

const MedicationsSection = () => {
  const { medications, allergies, addMedications, addAllergies, removeMedication, removeAllergy, updateMedication } = useVaultStore();
  const uniqueMedications = dedupeMedications(medications).unique;
  const byDateDesc = (a: { date: string }, b: { date: string }) => (b.date || "").localeCompare(a.date || "");
  const currentMeds = uniqueMedications.filter((m) => m.active !== false).sort(byDateDesc);
  const pastMeds = uniqueMedications.filter((m) => m.active === false).sort(byDateDesc);
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
  const [medActive, setMedActive] = useState(true);

  // Allergy form state
  const [allergySubstance, setAllergySubstance] = useState("");
  const [allergyReaction, setAllergyReaction] = useState("");
  const [allergySeverity, setAllergySeverity] = useState("Mild");

  const resetMedForm = () => {
    setMedName(""); setMedDose(""); setMedFreq(""); setMedDate(""); setMedPrescriber(""); setMedActive(true);
    setEditingMed(null);
  };

  const resetAllergyForm = () => {
    setAllergySubstance(""); setAllergyReaction(""); setAllergySeverity("Mild");
  };

  const handleSaveMed = async () => {
    if (!medName.trim() || !user) return;
    if (editingMed) {
      await updateMedication(editingMed, {
        name: medName, dose: medDose, frequency: medFreq, date: medDate, prescriber: medPrescriber, active: medActive,
      });
    } else {
      await addMedications([{
        id: crypto.randomUUID(), name: medName, dose: medDose, frequency: medFreq,
        date: medDate || new Date().toISOString().split("T")[0], prescriber: medPrescriber,
        facility: "", active: medActive, source: "manual",
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
    setMedDate(m.date); setMedPrescriber(m.prescriber); setMedActive(m.active !== false); setEditingMed(m.id);
    setShowMedModal(true);
  };

  const renderMed = (m: typeof medications[0], current: boolean) => (
    <div key={m.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${current ? "bg-emerald-500/10" : "bg-muted"}`}>
          {current ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <History className="w-4 h-4 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${current ? "text-foreground" : "text-muted-foreground"}`}>
            {m.name} <span className={current ? "text-primary" : ""}>{m.dose}</span>
            <span className={`ml-2 align-middle px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${current
              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
              : "bg-muted text-muted-foreground border-border"}`}>
              {current ? "Current" : "Completed"}
            </span>
            {m.source === "manual" && <span className="ml-2 px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-[9px]">Manual</span>}
          </p>
          <p className="text-xs text-muted-foreground">{m.frequency}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 pl-12 sm:pl-0">
        <div className="text-left sm:text-right">
          <p className={`text-xs ${current ? "text-foreground" : "text-muted-foreground"}`}>{m.prescriber}</p>
          <p className="text-[10px] text-muted-foreground">{m.facility ? `${m.facility} · ` : ""}{m.date}</p>
        </div>
        <button
          onClick={() => updateMedication(m.id, { active: !current })}
          className="shrink-0 flex items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground border border-border rounded-md hover:text-foreground hover:bg-muted transition-colors"
          title={current ? "Move to past medications" : "Move back to current medications"}
        >
          {current ? <><CircleStop className="w-3 h-3" /> Mark stopped</> : <><RotateCcw className="w-3 h-3" /> Mark current</>}
        </button>
        {m.source === "manual" && (
          <div className="flex gap-1">
            <button onClick={() => openEditMed(m)} className="p-1 text-muted-foreground hover:text-foreground"><Edit2 className="w-3 h-3" /></button>
            <button onClick={() => removeMedication(m.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
          </div>
        )}
      </div>
    </div>
  );

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
              {currentMeds.length} current
            </span>
          </div>
          <button onClick={() => { resetMedForm(); setShowMedModal(true); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors">
            <Plus className="w-3 h-3" /> Add Medication
          </button>
        </div>
        {uniqueMedications.length > 0 ? (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 mb-2">Currently taking</p>
              {currentMeds.length > 0 ? (
                <div className="bg-card border border-border rounded-lg overflow-hidden divide-y divide-border/50">
                  {currentMeds.map((m) => renderMed(m, true))}
                </div>
              ) : (
                <div className="bg-card border border-border rounded-lg p-6 text-center text-muted-foreground text-sm">
                  No current medications.
                </div>
              )}
            </div>
            {pastMeds.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" /> Past medications
                </p>
                <div className="bg-muted/30 border border-border rounded-lg overflow-hidden divide-y divide-border/50">
                  {pastMeds.map((m) => renderMed(m, false))}
                </div>
              </div>
            )}
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
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={medActive} onChange={(e) => setMedActive(e.target.checked)} className="accent-primary" />
                I'm currently taking this
              </label>
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
