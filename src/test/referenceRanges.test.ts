import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { displayRange, typicalRange, rangeForStorage } from "@/lib/referenceRanges";
import { getBloodInsight } from "@/lib/insights";

describe("reference ranges", () => {
  it("keeps the lab's own range untouched", () => {
    expect(displayRange({ marker: "Haemoglobin", unit: "g/dL", range: "Male: 14 - 16 g%, Female: 12 - 14 g%" }, "male"))
      .toEqual({ text: "Male: 14 - 16 g%, Female: 12 - 14 g%", typical: false });
    expect(rangeForStorage("Albumin", "g/L", "35 - 52")).toBe("35 - 52");
  });
  it("uses the vetted table (OUH) when the report prints none, same unit only", () => {
    expect(displayRange({ marker: "Uric Acid", unit: "umol/L", range: null })).toEqual({ text: "Male: 200 – 430, Female: 140 – 360", typical: true });
    expect(displayRange({ marker: "Uric Acid", unit: "µmol/L", range: null }, "female")?.text).toBe("140 – 360");
    expect(displayRange({ marker: "C Reactive Protein", unit: "mg/L", range: null })?.text).toBe("0 – 5");
    expect(displayRange({ marker: "Albumin", unit: "g/L", range: null })?.text).toBe("32 – 50");
    expect(rangeForStorage("Calcium", "mmol/L", null)).toBe("Typical: 2.20 – 2.60");
  });
  it("ignores AI-written typical ranges and re-resolves from the table", () => {
    expect(displayRange({ marker: "Albumin", unit: "g/L", range: "Typical: 35 - 55" })?.text).toBe("32 – 50");
    expect(displayRange({ marker: "Glucose", unit: "mmol/L", range: "Typical: 3.9 - 5.6" })).toBeNull();
  });
  it("never guesses across units or for markers without a published range", () => {
    expect(typicalRange("Albumin", "mmol/L")).toBeNull();
    expect(typicalRange("Total Cholesterol", "mmol/L")).toBeNull();
    expect(rangeForStorage("Mystery", "U/L", null)).toBeNull();
  });
  it("explains a lab flag that a typical range would not explain", () => {
    expect(getBloodInsight("flagged", [], true)).toMatch(/laboratory marked this result as abnormal/);
    expect(getBloodInsight("normal", [], true)).toBe("Your laboratory did not flag this result.");
  });
  it("edge-function copy is identical", () => {
    expect(readFileSync("supabase/functions/_shared/referenceRanges.ts", "utf8")).toBe(readFileSync("src/lib/referenceRanges.ts", "utf8"));
  });
});
