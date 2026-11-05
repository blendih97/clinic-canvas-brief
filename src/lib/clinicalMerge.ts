// Merges new medications and allergies into what a patient already has, without duplicates.
// The same rules run in the browser and on the server (mirrored in supabase/functions/_shared).
//
// Medications: the same drug (name without dose or form words) is one entry when the doses match
// or one side has no dose. A newer document then fills in missing details and updates the
// current/past status. A different dose is kept as its own entry (a genuine dose change).
// Allergies: the same substance is one entry; missing reaction or severity is filled in.

export interface MedLike { id?: string; name: string; dose?: string | null; frequency?: string | null; prescriber?: string | null; facility?: string | null; date?: string | null; active?: boolean | null }
export interface AllergyLike { id?: string; substance: string; reaction?: string | null; severity?: string | null }

const FORM_WORDS = /\b(tablets?|tabs?|capsules?|caps?|oral|solution|suspension|syrup|cream|ointment|gel|injection|inj|inhaler|patch(es)?|drops|film[- ]coated|modified[- ]release|prolonged[- ]release|extended[- ]release|er|sr|xl|mr|xr|od)\b/g;
const DOSE = /\b\d+(?:[.,]\d+)?\s*(mg|mcg|µg|ug|g|ml|iu|units?|%|mmol)\b/g;

export function medName(name: string | null | undefined): string {
  return String(name || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(DOSE, " ")
    .replace(FORM_WORDS, " ")
    .replace(/sulph/g, "sulf")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function medDose(dose: string | null | undefined): string {
  return String(dose || "").toLowerCase().replace(/,/g, ".").replace(/\s+/g, "").replace(/micrograms?/g, "mcg").replace(/µg|ug/g, "mcg").trim();
}

export function allergyName(substance: string | null | undefined): string {
  const s = String(substance || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(allergy|allergic to|allergic|sensitivity)\b/g, " ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return s.split(" ").map((w) => (w.length > 4 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w)).join(" ");
}

const blank = (v: unknown) => v === undefined || v === null || String(v).trim() === "";
const newer = (a?: string | null, b?: string | null) => !!a && (!b || a > b);

export interface MergePlan<U, P> { inserts: U[]; updates: { id: string; patch: Partial<P> }[] }

export function planMedicationMerge<U extends MedLike>(existing: MedLike[], incoming: U[]): MergePlan<U, MedLike> {
  const pool: MedLike[] = [...existing];
  const inserts: U[] = [];
  const patches = new Map<string, Partial<MedLike>>();
  for (const m of incoming) {
    const name = medName(m.name);
    if (!name) continue;
    const dose = medDose(m.dose);
    const same = pool.find((e) => medName(e.name) === name && (medDose(e.dose) === dose || !medDose(e.dose) || !dose));
    if (!same) { pool.push(m); inserts.push(m); continue; }
    const patch: Record<string, unknown> = {};
    for (const k of ["dose", "frequency", "prescriber", "facility"] as const) {
      if (blank(same[k]) && !blank(m[k])) patch[k] = m[k];
    }
    if (newer(m.date, same.date)) {
      patch.date = m.date;
      if (m.active !== undefined && m.active !== null && m.active !== same.active) patch.active = m.active;
    }
    if (Object.keys(patch).length) {
      Object.assign(same, patch);
      if (same.id) patches.set(same.id, { ...(patches.get(same.id) || {}), ...patch });
    }
  }
  return { inserts, updates: [...patches].map(([id, patch]) => ({ id, patch })) };
}

export function planAllergyMerge<U extends AllergyLike>(existing: AllergyLike[], incoming: U[]): MergePlan<U, AllergyLike> {
  const pool: AllergyLike[] = [...existing];
  const inserts: U[] = [];
  const patches = new Map<string, Partial<AllergyLike>>();
  for (const a of incoming) {
    const name = allergyName(a.substance);
    if (!name) continue;
    const same = pool.find((e) => allergyName(e.substance) === name);
    if (!same) { pool.push(a); inserts.push(a); continue; }
    const patch: Record<string, unknown> = {};
    for (const k of ["reaction", "severity"] as const) {
      if (blank(same[k]) && !blank(a[k])) patch[k] = a[k];
    }
    if (Object.keys(patch).length) {
      Object.assign(same, patch);
      if (same.id) patches.set(same.id, { ...(patches.get(same.id) || {}), ...patch });
    }
  }
  return { inserts, updates: [...patches].map(([id, patch]) => ({ id, patch })) };
}
