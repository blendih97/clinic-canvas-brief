// Every lab result shows a reference range.
// - The laboratory's own printed range always wins and is shown as printed.
// - When a report prints none, we show a TYPICAL UK adult range from the
//   vetted table below, labelled as typical and "not printed on your report".
// - Units must match exactly (after normalisation). Ranges are never converted
//   between units, and the AI never supplies typical ranges itself.
// - The status (normal / flagged) is always the laboratory's, never recomputed
//   from a typical range, because each lab uses its own range.
//
// Sources (adult ranges, as printed):
//   OUH  = Oxford University Hospitals, Biochemistry reference ranges
//          https://www.ouh.nhs.uk/media/22pfm4ac/biochemistry-reference-ranges.pdf
//   LTHT = Leeds Teaching Hospitals, Blood Sciences reference range database v3.19
//          https://www.leedsth.nhs.uk/wp-content/uploads/2026/06/BSHC-REC-317b_Blood-Sciences-Reference-Range-Database_v3.19-1.pdf
// Markers with no published range (glucose, cholesterol, HDL, LDL, eGFR) or no
// unambiguous source are deliberately absent: those show "Range: not provided".
//
// This file is pure (no imports). It is copied verbatim to
// supabase/functions/_shared/referenceRanges.ts; a test keeps the two identical.

export const TYPICAL_PREFIX = "Typical:";

type Entry = { names: string[]; units: string[]; range: string; source: "OUH" | "LTHT" | "OUH (HbA1c % = IFCC converted)" };

const TABLE: Entry[] = [
  { names: ["uric acid", "urate", "serum uric acid", "urate (uric acid)", "serum urate"], units: ["umol/l"], range: "Male: 200 – 430, Female: 140 – 360", source: "OUH" },
  { names: ["creatine kinase", "creatine kinase (ck)", "creatine phosphokinase", "ck", "cpk"], units: ["iu/l", "u/l"], range: "Male: 40 – 320, Female: 25 – 200", source: "OUH" },
  { names: ["albumin", "serum albumin"], units: ["g/l"], range: "32 – 50", source: "OUH" },
  { names: ["adjusted calcium", "corrected calcium", "calcium (adjusted)", "calcium", "serum calcium", "total calcium"], units: ["mmol/l"], range: "2.20 – 2.60", source: "OUH" },
  { names: ["c reactive protein", "c-reactive protein", "crp"], units: ["mg/l"], range: "0 – 5", source: "OUH" },
  { names: ["vitamin b12", "b12", "serum vitamin b12", "cobalamin"], units: ["ng/l", "pg/ml"], range: "211 – 911", source: "LTHT" },
  { names: ["folate", "serum folate"], units: ["ug/l", "ng/ml"], range: "3.1 – 20.0", source: "OUH" },
  { names: ["ferritin", "serum ferritin"], units: ["ug/l", "ng/ml"], range: "30 – 336", source: "OUH" },
  { names: ["creatinine", "serum creatinine"], units: ["umol/l"], range: "Male: 64 – 104, Female: 49 – 90", source: "OUH" },
  { names: ["urea", "urea (bun)", "serum urea"], units: ["mmol/l"], range: "2.5 – 7.8", source: "OUH" },
  { names: ["sodium", "serum sodium"], units: ["mmol/l"], range: "133 – 146", source: "OUH" },
  { names: ["potassium", "serum potassium"], units: ["mmol/l"], range: "3.5 – 5.3", source: "OUH" },
  { names: ["alt", "alt (sgpt)", "alanine aminotransferase", "alanine transaminase"], units: ["iu/l", "u/l"], range: "10 – 35", source: "OUH" },
  { names: ["ast", "ast (sgot)", "aspartate aminotransferase", "aspartate transaminase"], units: ["iu/l", "u/l"], range: "15 – 34", source: "OUH" },
  { names: ["alkaline phosphatase", "alp"], units: ["iu/l", "u/l"], range: "30 – 130", source: "OUH" },
  { names: ["bilirubin", "total bilirubin"], units: ["umol/l"], range: "0 – 21", source: "OUH" },
  { names: ["total protein", "serum total protein"], units: ["g/l"], range: "60 – 80", source: "OUH" },
  { names: ["hba1c", "haemoglobin a1c", "hemoglobin a1c", "glycated haemoglobin", "glycated hemoglobin"], units: ["mmol/mol"], range: "20 – 41", source: "OUH" },
  { names: ["hba1c", "haemoglobin a1c", "hemoglobin a1c", "glycated haemoglobin", "glycated hemoglobin"], units: ["%"], range: "4.0 – 5.9", source: "OUH (HbA1c % = IFCC converted)" },
  { names: ["tsh", "thyroid stimulating hormone"], units: ["miu/l", "mu/l", "uiu/ml"], range: "0.35 – 4.94", source: "OUH" },
  { names: ["free t4", "ft4", "free thyroxine"], units: ["pmol/l"], range: "9.0 – 19.0", source: "OUH" },
  { names: ["vitamin d", "25 oh vitamin d", "25-oh vitamin d", "vitamin d (25-oh)", "25-hydroxyvitamin d", "total 25-oh vitamin d"], units: ["nmol/l"], range: "> 50 (adequate)", source: "OUH" },
  { names: ["triglycerides", "triglyceride"], units: ["mmol/l"], range: "< 1.70 (fasting)", source: "OUH" },
  { names: ["platelets", "platelet count", "plt"], units: ["x10^9/l", "10^9/l"], range: "150 – 400", source: "LTHT" },
  { names: ["mcv", "mean cell volume", "mean cell volume (mcv)", "mean corpuscular volume"], units: ["fl"], range: "80 – 100", source: "LTHT" },
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

/** "4,0 – 5,6" -> "4.0 – 5.6". Only decimal commas (1–2 digits after); "1,000" is left alone. */
export function normaliseDecimalCommas(s: string): string {
  return s.replace(/(\d),(\d{1,2})(?!\d)/g, "$1.$2");
}

const isLabRange = (r: string | null | undefined) => {
  const t = (r ?? "").trim();
  return !!t && !t.toLowerCase().startsWith(TYPICAL_PREFIX.toLowerCase()) && !/^(null|n\/?a|none|-|—)$/i.test(t);
};

/** The value to store in blood_results.range: the lab's range, else "Typical: …", else null. */
export function rangeForStorage(marker: string, unit: string | null | undefined, labRange: string | null | undefined): string | null {
  const lab = (labRange ?? "").trim();
  if (isLabRange(lab)) return normaliseDecimalCommas(lab);
  const typical = typicalRange(marker, unit);
  return typical ? `${TYPICAL_PREFIX} ${typical}` : null;
}

/** true/false when the value is outside/inside the range; null when the range can't be read.
 *  For "Male: …, Female: …" it is outside only if outside every listed range. */
export function outsideRange(value: number, range: string): boolean | null {
  if (!Number.isFinite(value)) return null;
  const parts = range.split(/,\s*(?=(?:male|female)\s*:)/i).map((p) => p.replace(/^\s*(male|female)\s*:\s*/i, ""));
  const verdicts = parts.map((p) => {
    const t = normaliseDecimalCommas(p).replace(/\(.*?\)/g, "").trim();
    let m = t.match(/^(-?\d+(?:\.\d+)?)\s*(?:–|—|-|to)\s*(-?\d+(?:\.\d+)?)/i);
    if (m) return value < Number(m[1]) || value > Number(m[2]);
    m = t.match(/^(<=|≤|<)\s*(-?\d+(?:\.\d+)?)/);
    if (m) return m[1] === "<" ? value >= Number(m[2]) : value > Number(m[2]);
    m = t.match(/^(>=|≥|>)\s*(-?\d+(?:\.\d+)?)/);
    if (m) return m[1] === ">" ? value <= Number(m[2]) : value < Number(m[2]);
    return null;
  });
  if (verdicts.some((v) => v === null)) return null;
  return verdicts.every((v) => v === true);
}

/**
 * The status to store. A lab-printed range or a document flag always wins.
 * With neither, a value outside the vetted typical range is marked "flagged".
 */
export function statusForStorage(marker: string, unit: string | null | undefined, value: number, labRange: string | null | undefined, aiStatus: string | null | undefined): string {
  const status = aiStatus === "flagged" || aiStatus === "critical" ? aiStatus : "normal";
  if (isLabRange(labRange) || status !== "normal") return status;
  const typical = typicalRange(marker, unit);
  return typical && outsideRange(value, typical) === true ? "flagged" : "normal";
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

/** The range to show for a result. Stored "Typical:" ranges are re-resolved from the vetted table. */
export function displayRange(r: { marker: string; unit?: string | null; range?: string | null }, sex?: string | null): DisplayRange | null {
  const raw = (r.range ?? "").trim();
  if (raw && !raw.toLowerCase().startsWith(TYPICAL_PREFIX.toLowerCase())) {
    // Lab printed separate male/female ranges: show the one for the patient's recorded sex, labelled.
    const own = forSex(raw, sex);
    const label = norm(sex) === "female" ? "Female" : "Male";
    return { text: own === raw ? raw : `${label}: ${own}`, typical: false };
  }
  const typical = typicalRange(r.marker, r.unit);
  if (!typical) return null;
  return { text: forSex(typical, sex), typical: true };
}

export const TYPICAL_NOTE = "Typical UK adult range. Your report did not print the laboratory's own range.";
