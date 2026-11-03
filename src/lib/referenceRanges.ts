// Every lab result shows a reference range. The lab's own range (as printed on
// the report) always wins. When a report prints none, we show a typical adult
// range for the same marker AND unit, clearly labelled as typical, so it is
// never mistaken for the laboratory's range. Units must match exactly
// (after normalisation) — a range is never converted between units.

export const TYPICAL_PREFIX = "Typical:";

type Entry = { names: string[]; units: string[]; range: string };

// Widely used adult reference ranges (UK/European conventions). Labs differ;
// these are shown only as "typical" when the report itself gives none.
const TABLE: Entry[] = [
  { names: ["uric acid", "urate", "serum uric acid"], units: ["umol/l"], range: "Male: 200 – 430, Female: 140 – 360" },
  { names: ["uric acid", "urate"], units: ["mg/dl"], range: "Male: 3.4 – 7.0, Female: 2.4 – 6.0" },
  { names: ["c reactive protein", "c-reactive protein", "crp"], units: ["mg/l"], range: "< 5" },
  { names: ["calcium", "serum calcium", "total calcium"], units: ["mmol/l"], range: "2.20 – 2.60" },
  { names: ["adjusted calcium", "corrected calcium"], units: ["mmol/l"], range: "2.20 – 2.60" },
  { names: ["albumin", "serum albumin"], units: ["g/l"], range: "35 – 50" },
  { names: ["albumin"], units: ["g/dl"], range: "3.5 – 5.0" },
  { names: ["total protein"], units: ["g/l"], range: "60 – 80" },
  { names: ["creatine kinase", "creatine kinase (ck)", "creatine phosphokinase", "ck", "cpk"], units: ["iu/l", "u/l"], range: "Male: 40 – 320, Female: 25 – 200" },
  { names: ["vitamin b12", "b12", "serum vitamin b12", "cobalamin"], units: ["ng/l", "pg/ml"], range: "180 – 900" },
  { names: ["vitamin b12", "b12"], units: ["pmol/l"], range: "133 – 664" },
  { names: ["active b12", "holotranscobalamin"], units: ["pmol/l"], range: "> 37.5" },
  { names: ["folate", "serum folate"], units: ["ug/l", "ng/ml"], range: "3.0 – 20.0" },
  { names: ["ferritin", "serum ferritin"], units: ["ug/l", "ng/ml"], range: "Male: 30 – 400, Female: 15 – 150" },
  { names: ["haemoglobin", "hemoglobin", "hb", "hgb"], units: ["g/dl"], range: "Male: 13.0 – 17.0, Female: 12.0 – 15.0" },
  { names: ["haemoglobin", "hemoglobin", "hb", "hgb"], units: ["g/l"], range: "Male: 130 – 170, Female: 120 – 150" },
  { names: ["white cell count", "white blood cells", "wbc", "total wbc count", "leukocytes"], units: ["x10^9/l", "10^9/l"], range: "4.0 – 11.0" },
  { names: ["platelets", "platelet count", "plt"], units: ["x10^9/l", "10^9/l"], range: "150 – 400" },
  { names: ["mcv", "mean cell volume", "mean cell volume (mcv)", "mean corpuscular volume"], units: ["fl"], range: "80 – 100" },
  { names: ["haematocrit", "hematocrit", "pcv", "hct"], units: ["%"], range: "Male: 40 – 50, Female: 36 – 46" },
  { names: ["hba1c", "haemoglobin a1c", "hemoglobin a1c", "glycated haemoglobin"], units: ["%"], range: "< 6.0" },
  { names: ["hba1c", "haemoglobin a1c", "hemoglobin a1c", "glycated haemoglobin"], units: ["mmol/mol"], range: "< 42" },
  { names: ["glucose", "fasting glucose", "glucose (fasting)", "fasting plasma glucose"], units: ["mmol/l"], range: "3.9 – 5.6" },
  { names: ["glucose", "fasting glucose", "glucose (fasting)"], units: ["mg/dl"], range: "70 – 100" },
  { names: ["creatinine", "serum creatinine"], units: ["umol/l"], range: "Male: 60 – 110, Female: 45 – 90" },
  { names: ["urea", "urea (bun)", "serum urea"], units: ["mmol/l"], range: "2.5 – 7.8" },
  { names: ["egfr", "estimated gfr"], units: ["ml/min/1.73m2", "ml/min/1.73m^2", "ml/min"], range: "> 90" },
  { names: ["sodium"], units: ["mmol/l"], range: "135 – 145" },
  { names: ["potassium"], units: ["mmol/l"], range: "3.5 – 5.3" },
  { names: ["total cholesterol", "cholesterol"], units: ["mmol/l"], range: "< 5.0" },
  { names: ["ldl cholesterol", "ldl"], units: ["mmol/l"], range: "< 3.0" },
  { names: ["hdl cholesterol", "hdl"], units: ["mmol/l"], range: "> 1.0" },
  { names: ["triglycerides"], units: ["mmol/l"], range: "< 1.7" },
  { names: ["alt", "alt (sgpt)", "alanine aminotransferase"], units: ["u/l", "iu/l"], range: "< 40" },
  { names: ["ast", "ast (sgot)", "aspartate aminotransferase"], units: ["u/l", "iu/l"], range: "< 40" },
  { names: ["alkaline phosphatase", "alp"], units: ["u/l", "iu/l"], range: "30 – 130" },
  { names: ["total bilirubin", "bilirubin"], units: ["umol/l"], range: "< 21" },
  { names: ["tsh", "thyroid stimulating hormone"], units: ["miu/l", "mu/l", "uiu/ml"], range: "0.4 – 4.0" },
  { names: ["free t4", "ft4"], units: ["pmol/l"], range: "12 – 22" },
  { names: ["vitamin d", "25 oh vitamin d", "25-oh vitamin d", "vitamin d (25-oh)", "25-hydroxyvitamin d"], units: ["nmol/l"], range: "50 – 175" },
  { names: ["vitamin d", "25 oh vitamin d", "vitamin d (25-oh)", "25-hydroxyvitamin d"], units: ["ng/ml"], range: "20 – 70" },
];

const norm = (s: string | null | undefined) =>
  (s ?? "").toLowerCase().replace(/µ|μ/g, "u").replace(/\s+/g, " ").trim();
const normUnit = (s: string | null | undefined) => norm(s).replace(/\s/g, "").replace(/×/g, "x");

export function typicalRange(marker: string, unit: string | null | undefined): string | null {
  const m = norm(marker);
  const u = normUnit(unit);
  if (!m || !u) return null;
  const hit = TABLE.find((e) => e.units.includes(u) && e.names.includes(m));
  return hit ? hit.range : null;
}

/** Picks the line for the patient's sex from "Male: a – b, Female: c – d". */
function forSex(range: string, sex?: string | null): string {
  const s = norm(sex);
  if (s !== "male" && s !== "female") return range;
  const parts = range.split(/,\s*(?=(?:male|female)\s*:)/i);
  const mine = parts.find((p) => norm(p).startsWith(s + ":"));
  return mine ? mine.replace(/^\s*(male|female)\s*:\s*/i, "") : range;
}

export interface DisplayRange { text: string; typical: boolean }

/**
 * The range to show for a result. Lab-printed ranges are shown as is.
 * "Typical:"-prefixed ranges (from extraction) and lookup fallbacks are typical.
 */
export function displayRange(r: { marker: string; unit?: string | null; range?: string | null }, sex?: string | null): DisplayRange | null {
  const raw = (r.range ?? "").trim();
  if (raw && !raw.toLowerCase().startsWith(TYPICAL_PREFIX.toLowerCase())) return { text: raw, typical: false };
  const typical = raw ? raw.slice(TYPICAL_PREFIX.length).trim() : typicalRange(r.marker, r.unit);
  if (!typical) return null;
  return { text: forSex(typical, sex), typical: true };
}

export const TYPICAL_NOTE = "Typical adult range — your report did not print one";
