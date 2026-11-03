import { describe, it, expect } from "vitest";
import { displayRange, typicalRange } from "@/lib/referenceRanges";

describe("reference ranges", () => {
  it("keeps the lab's own range untouched", () => {
    expect(displayRange({ marker: "Haemoglobin", unit: "g/dL", range: "Male: 14 - 16 g%, Female: 12 - 14 g%" }, "male"))
      .toEqual({ text: "Male: 14 - 16 g%, Female: 12 - 14 g%", typical: false });
  });
  it("labels extraction-supplied typical ranges", () => {
    expect(displayRange({ marker: "Albumin", unit: "g/L", range: "Typical: 35 - 50" })).toEqual({ text: "35 - 50", typical: true });
  });
  it("falls back to a typical range for the same unit when none is stored", () => {
    expect(displayRange({ marker: "C Reactive Protein", unit: "mg/L", range: null })).toEqual({ text: "< 5", typical: true });
    expect(displayRange({ marker: "Uric Acid", unit: "umol/L", range: null }, "female")).toEqual({ text: "140 – 360", typical: true });
    expect(displayRange({ marker: "Uric Acid", unit: "µmol/L", range: null })?.text).toBe("Male: 200 – 430, Female: 140 – 360");
  });
  it("never guesses across units or unknown markers", () => {
    expect(typicalRange("Albumin", "mmol/L")).toBeNull();
    expect(displayRange({ marker: "Mystery marker", unit: "U/L", range: null })).toBeNull();
  });
});
