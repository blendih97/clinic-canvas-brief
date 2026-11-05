import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const field = "w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";
const EMPTY = { insurer: "", policy_number: "", member_id: "", plan_name: "", insurer_phone: "", valid_until: "", notes: "" };
type Ins = typeof EMPTY;

/** The patient's own insurance details. Private: never part of a share brief, export or partner view. */
const InsuranceCard = () => {
  const { user } = useAuth();
  const [ins, setIns] = useState<Ins>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    void supabase.from("patient_insurance").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) setIns(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, (data as Record<string, string | null>)[k] || ""])) as Ins);
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const row = Object.fromEntries(Object.entries(ins).map(([k, v]) => [k, v.trim() || null]));
    const { error } = await supabase.from("patient_insurance").upsert({ user_id: user.id, ...row, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) toast.error("Insurance details couldn't be saved."); else toast.success("Insurance details saved.");
  };

  const set = (k: keyof Ins) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setIns({ ...ins, [k]: e.target.value });

  return (
    <section className="bg-card border border-border rounded-xl p-6 mb-6">
      <h2 className="font-heading text-lg text-foreground mb-1">Health insurance</h2>
      <p className="flex items-start gap-2 text-xs text-muted-foreground mb-4">
        <Lock className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
        Private to you. Never included when you share with a doctor, export a PDF, or with any partner.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className="text-xs font-medium text-foreground">Insurer</label><input value={ins.insurer} onChange={set("insurer")} className={field} /></div>
        <div><label className="text-xs font-medium text-foreground">Plan</label><input value={ins.plan_name} onChange={set("plan_name")} className={field} /></div>
        <div><label className="text-xs font-medium text-foreground">Policy number</label><input value={ins.policy_number} onChange={set("policy_number")} className={field} /></div>
        <div><label className="text-xs font-medium text-foreground">Member ID</label><input value={ins.member_id} onChange={set("member_id")} className={field} /></div>
        <div><label className="text-xs font-medium text-foreground">Insurer phone</label><input value={ins.insurer_phone} onChange={set("insurer_phone")} className={field} /></div>
        <div><label className="text-xs font-medium text-foreground">Valid until</label><input type="date" value={ins.valid_until} onChange={set("valid_until")} className={field} /></div>
        <div className="sm:col-span-2"><label className="text-xs font-medium text-foreground">Notes</label><textarea value={ins.notes} onChange={set("notes")} rows={2} maxLength={500} className={field + " resize-none"} /></div>
      </div>
      <button onClick={() => void save()} disabled={saving} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
        {saving ? "Saving…" : "Save insurance details"}
      </button>
    </section>
  );
};

export default InsuranceCard;
