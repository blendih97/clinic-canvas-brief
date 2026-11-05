import { describe, it, expect } from "vitest";
import { planMedicationMerge, planAllergyMerge, medName, allergyName } from "@/lib/clinicalMerge";
import * as server from "../../supabase/functions/_shared/clinicalMerge";

describe("medication merge", () => {
  it("treats a hand-entered name and a report entry with a dose as one medicine, filling in details", () => {
    const existing = [{ id: "1", name: "Metformin", dose: "", frequency: "", date: "", active: true }];
    const plan = planMedicationMerge(existing, [{ name: "Metformin 500 mg tablets", dose: "500 mg", frequency: "Twice daily", date: "2026-10-21", active: true }]);
    expect(plan.inserts).toHaveLength(0);
    expect(plan.updates).toEqual([{ id: "1", patch: { dose: "500 mg", frequency: "Twice daily", date: "2026-10-21" } }]);
  });
  it("skips the same medicine in two reports and in the same batch", () => {
    const existing = [{ id: "1", name: "Atorvastatin", dose: "20mg", date: "2026-10-21", active: true }];
    const plan = planMedicationMerge(existing, [
      { name: "Atorvastatin", dose: "20 mg", date: "2026-09-01", active: true },
      { name: "Ferrous sulphate", dose: "200 mg", date: "2026-10-01", active: true },
      { name: "Ferrous sulfate", dose: "200mg", date: "2026-10-01", active: true },
    ]);
    expect(plan.inserts.map((m) => m.name)).toEqual(["Ferrous sulphate"]);
    expect(plan.updates).toEqual([]);
  });
  it("keeps a genuine dose change and lets a newer document mark a medicine as stopped", () => {
    const existing = [{ id: "1", name: "Tramadol", dose: "50 mg", date: "2026-07-23", active: true }];
    const plan = planMedicationMerge(existing, [
      { name: "Tramadol", dose: "50 mg", date: "2026-08-10", active: false },
      { name: "Tramadol", dose: "100 mg", date: "2026-08-10", active: true },
    ]);
    expect(plan.updates).toEqual([{ id: "1", patch: { date: "2026-08-10", active: false } }]);
    expect(plan.inserts.map((m) => m.dose)).toEqual(["100 mg"]);
  });
  it("normalises names", () => {
    expect(medName("Colecalciferol (vitamin D) 800 units capsules")).toBe("colecalciferol");
  });
});

describe("allergy merge", () => {
  it("matches spelling and plural variants and fills in the reaction", () => {
    const existing = [{ id: "a", substance: "Penicillin", reaction: "", severity: "" }];
    const plan = planAllergyMerge(existing, [
      { substance: "PENICILLINS", reaction: "Urticaria", severity: "Moderate" },
      { substance: "Penicillin allergy", reaction: "Rash", severity: "Mild" },
      { substance: "Codeine", reaction: "Vomiting", severity: "Mild" },
    ]);
    expect(plan.updates).toEqual([{ id: "a", patch: { reaction: "Urticaria", severity: "Moderate" } }]);
    expect(plan.inserts.map((a) => a.substance)).toEqual(["Codeine"]);
    expect(allergyName("Latex (gloves)")).toBe("latex");
  });
  it("server copy matches the browser copy", () => {
    expect(server.planAllergyMerge).toBeDefined();
    expect(server.medName("Metformin 500mg tablets")).toBe(medName("Metformin 500mg tablets"));
  });
});
