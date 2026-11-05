// Saves extracted medications and allergies without duplicating what the patient already has.
// deno-lint-ignore-file no-explicit-any
import { planAllergyMerge, planMedicationMerge } from "./clinicalMerge.ts";

export async function saveMedications(supabase: any, userId: string, rows: any[]): Promise<void> {
  if (!rows.length) return;
  const { data: existing } = await supabase.from("medications").select("id,name,dose,frequency,prescriber,facility,date,active").eq("user_id", userId);
  const plan = planMedicationMerge(existing || [], rows);
  for (const u of plan.updates) await supabase.from("medications").update(u.patch).eq("id", u.id).eq("user_id", userId);
  if (plan.inserts.length) await supabase.from("medications").insert(plan.inserts);
}

export async function saveAllergies(supabase: any, userId: string, rows: any[]): Promise<void> {
  if (!rows.length) return;
  const { data: existing } = await supabase.from("allergies").select("id,substance,reaction,severity").eq("user_id", userId);
  const plan = planAllergyMerge(existing || [], rows);
  for (const u of plan.updates) await supabase.from("allergies").update(u.patch).eq("id", u.id).eq("user_id", userId);
  if (plan.inserts.length) {
    await supabase.from("allergies").insert(plan.inserts);
    // A recorded allergy replaces any earlier "no known allergies" confirmation.
    await supabase.from("profiles").update({ no_known_allergies: false }).eq("id", userId).eq("no_known_allergies", true);
  }
}
