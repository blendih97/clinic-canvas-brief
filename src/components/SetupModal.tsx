import { useState } from "react";
import { ArrowLeft, ArrowRight, Lock, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useVaultStore } from "@/store/vaultStore";

// First sign-in "About you": the details a doctor needs first. Every step is optional.
// Medications and allergies go into the patient's record (merged with anything from documents,
// never duplicated). Insurance is stored privately and is never shared or exported.

interface Props { open: boolean; onDone: () => void }
interface MedRow { name: string; dose: string; frequency: string }
interface AllergyRow { substance: string; reaction: string }

const field = "w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";
const label = "text-xs font-medium text-foreground";
const STEPS = 4;

const SetupModal = ({ open, onDone }: Props) => {
  const { user, profile, refreshProfile } = useAuth();
  const addMedications = useVaultStore((s) => s.addMedications);
  const addAllergies = useVaultStore((s) => s.addAllergies);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [dob, setDob] = useState(profile?.date_of_birth || "");
  const [sex, setSex] = useState(profile?.biological_sex || "");
  const [conditions, setConditions] = useState(profile?.current_diagnoses || "");
  const [noAllergies, setNoAllergies] = useState(false);
  const [allergies, setAllergies] = useState<AllergyRow[]>([{ substance: "", reaction: "" }]);
  const [meds, setMeds] = useState<MedRow[]>([{ name: "", dose: "", frequency: "" }]);
  const [ins, setIns] = useState({ insurer: "", policy_number: "", member_id: "", insurer_phone: "", valid_until: "" });

  if (!open || !user) return null;

  const finish = async (skipped: boolean) => {
    setSaving(true);
    try {
      const profileUpdate: Record<string, unknown> = { setup_completed_at: new Date().toISOString() };
      if (!skipped || step > 1) {
        if (fullName.trim()) profileUpdate.full_name = fullName.trim();
        if (dob) profileUpdate.date_of_birth = dob;
        if (sex) profileUpdate.biological_sex = sex;
        if (conditions.trim()) profileUpdate.current_diagnoses = conditions.trim();
        const enteredAllergies = allergies.filter((a) => a.substance.trim());
        profileUpdate.no_known_allergies = noAllergies && enteredAllergies.length === 0;
        if (enteredAllergies.length && !noAllergies) {
          await addAllergies(enteredAllergies.map((a) => ({ substance: a.substance.trim(), reaction: a.reaction.trim(), severity: "", source: "patient" })), user.id);
        }
        const enteredMeds = meds.filter((m) => m.name.trim());
        if (enteredMeds.length) {
          await addMedications(enteredMeds.map((m) => ({
            id: "", name: m.name.trim(), dose: m.dose.trim(), frequency: m.frequency.trim(), prescriber: "", facility: "",
            date: new Date().toISOString().slice(0, 10), active: true, source: "patient",
          })), user.id);
        }
        const insurance = Object.fromEntries(Object.entries(ins).map(([k, v]) => [k, v.trim() || null]));
        if (Object.values(insurance).some(Boolean)) {
          await supabase.from("patient_insurance").upsert({ user_id: user.id, ...insurance, updated_at: new Date().toISOString() } as never);
        }
      }
      await supabase.from("profiles").update(profileUpdate as never).eq("id", user.id);
      await refreshProfile();
      if (!skipped) toast.success("Saved. You can change these any time in your profile.");
      onDone();
    } catch {
      toast.error("Something didn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const next = () => (step < STEPS ? setStep(step + 1) : void finish(false));

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center gap-1 px-6 pt-5">
          {Array.from({ length: STEPS }, (_, i) => i + 1).map((s) => (
            <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>

        <div className="p-6 space-y-4">
          {step === 1 && (
            <>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-primary">Welcome to RinVita</p>
                <h2 className="mt-1 font-heading text-2xl text-foreground">A few details about you</h2>
                <p className="mt-1 text-sm text-muted-foreground">These help doctors read your records correctly. Every step is optional.</p>
              </div>
              <div>
                <label className={label}>Full name</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={field} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Date of birth</label>
                  <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={field} />
                </div>
                <div>
                  <label className={label}>Sex</label>
                  <select value={sex} onChange={(e) => setSex(e.target.value)} className={field}>
                    <option value="">Select</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">Sex is used to show the right reference ranges for your lab results.</p>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <h2 className="font-heading text-2xl text-foreground">Allergies</h2>
                <p className="mt-1 text-sm text-muted-foreground">This is the first thing a doctor checks.</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={noAllergies} onChange={(e) => setNoAllergies(e.target.checked)} className="w-4 h-4" />
                I have no known allergies
              </label>
              {!noAllergies && (
                <div className="space-y-2">
                  {allergies.map((a, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={a.substance} onChange={(e) => setAllergies(allergies.map((x, j) => (j === i ? { ...x, substance: e.target.value } : x)))}
                        placeholder="e.g. Penicillin" className={field + " mt-0"} />
                      <input value={a.reaction} onChange={(e) => setAllergies(allergies.map((x, j) => (j === i ? { ...x, reaction: e.target.value } : x)))}
                        placeholder="Reaction (optional)" className={field + " mt-0"} />
                      {allergies.length > 1 && (
                        <button type="button" onClick={() => setAllergies(allergies.filter((_, j) => j !== i))} aria-label="Remove" className="px-2 text-muted-foreground"><X className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setAllergies([...allergies, { substance: "", reaction: "" }])} className="inline-flex items-center gap-1 text-xs text-primary"><Plus className="w-3.5 h-3.5" /> Add another</button>
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <h2 className="font-heading text-2xl text-foreground">Current medications and conditions</h2>
                <p className="mt-1 text-sm text-muted-foreground">Anything you take regularly. If a report you upload lists the same medicine, it won't be added twice.</p>
              </div>
              <div className="space-y-2">
                {meds.map((m, i) => (
                  <div key={i} className="grid grid-cols-[1fr_90px_1fr_auto] gap-2">
                    <input value={m.name} onChange={(e) => setMeds(meds.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="e.g. Metformin" className={field + " mt-0"} />
                    <input value={m.dose} onChange={(e) => setMeds(meds.map((x, j) => (j === i ? { ...x, dose: e.target.value } : x)))} placeholder="Dose" className={field + " mt-0"} />
                    <input value={m.frequency} onChange={(e) => setMeds(meds.map((x, j) => (j === i ? { ...x, frequency: e.target.value } : x)))} placeholder="How often" className={field + " mt-0"} />
                    {meds.length > 1 ? (
                      <button type="button" onClick={() => setMeds(meds.filter((_, j) => j !== i))} aria-label="Remove" className="px-2 text-muted-foreground"><X className="w-4 h-4" /></button>
                    ) : <span />}
                  </div>
                ))}
                <button type="button" onClick={() => setMeds([...meds, { name: "", dose: "", frequency: "" }])} className="inline-flex items-center gap-1 text-xs text-primary"><Plus className="w-3.5 h-3.5" /> Add another</button>
              </div>
              <div>
                <label className={label}>Ongoing conditions</label>
                <textarea value={conditions} onChange={(e) => setConditions(e.target.value)} rows={2} placeholder="e.g. Type 2 diabetes, asthma" className={field + " resize-none"} />
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div>
                <h2 className="font-heading text-2xl text-foreground">Health insurance</h2>
                <p className="mt-1 text-sm text-muted-foreground">Keep your policy details to hand when you need them.</p>
              </div>
              <p className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-foreground">
                <Lock className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                Private to you. Insurance details are never included when you share with a doctor, export a PDF, or with any partner.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className={label}>Insurer</label><input value={ins.insurer} onChange={(e) => setIns({ ...ins, insurer: e.target.value })} placeholder="e.g. Bupa Global" className={field} /></div>
                <div><label className={label}>Policy number</label><input value={ins.policy_number} onChange={(e) => setIns({ ...ins, policy_number: e.target.value })} className={field} /></div>
                <div><label className={label}>Member ID</label><input value={ins.member_id} onChange={(e) => setIns({ ...ins, member_id: e.target.value })} className={field} /></div>
                <div><label className={label}>Insurer phone</label><input value={ins.insurer_phone} onChange={(e) => setIns({ ...ins, insurer_phone: e.target.value })} className={field} /></div>
                <div><label className={label}>Valid until</label><input type="date" value={ins.valid_until} onChange={(e) => setIns({ ...ins, valid_until: e.target.value })} className={field} /></div>
              </div>
            </>
          )}

          <div className="flex items-center gap-2 pt-2">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} disabled={saving} className="py-2.5 px-4 border border-border rounded-lg text-sm text-foreground hover:bg-muted inline-flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            <button onClick={next} disabled={saving} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 inline-flex items-center justify-center gap-2">
              {saving ? "Saving…" : step < STEPS ? <>Continue <ArrowRight className="w-4 h-4" /></> : "Finish"}
            </button>
          </div>
          <button onClick={() => void finish(true)} disabled={saving} className="w-full text-xs text-muted-foreground hover:text-foreground">Skip for now</button>
        </div>
      </div>
    </div>
  );
};

export default SetupModal;
