// The downloadable Health Brief: the same layout as the link a patient shares with a doctor.
// 1. Fetch each original (newest document first) so the brief knows which are included.
// 2. The render-export-pdf function (v2) renders the summary pages plus one divider page
//    per document, in RinVita's fonts and branding.
// 3. In the browser, pdf-lib inserts each original straight after its divider and stamps
//    page numbers across the whole file.
import { supabase } from "@/integrations/supabase/client";
import type { VaultData } from "@/lib/pdfExport";
import type { Document as VaultDocument } from "@/store/vaultStore";
import { displayRange } from "@/lib/referenceRanges";

export type BriefPhase = "translating" | "collecting" | "rendering" | "merging" | "ready";

import { mergeOriginals, type OriginalFile } from "@/lib/briefMerge";
export type { OriginalFile };

export interface HealthBriefInput {
  data: VaultData;
  patient: { fullName: string; dob?: string; biologicalSex?: string; nationality?: string; bloodType?: string; conditions?: string };
  language: string;
  includeOriginals: boolean;
  /** Returns the stored original for a document, or null. Defaults to the patient's own storage. */
  getFile?: (doc: VaultDocument) => Promise<OriginalFile | null>;
  onProgress?: (phase: BriefPhase, detail?: string) => void;
}

export interface HealthBriefResult { blob: Blob; documents: number; originals: number; missing: string[] }

function fmtDate(iso: string | undefined | null, language: string): string {
  if (!iso) return "";
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(language === "en" ? "en-GB" : language, { day: "numeric", month: "short", year: "numeric" });
}

const byDateDesc = (a?: string | null, b?: string | null) => (b || "").localeCompare(a || "");

/** The summary and text in the brief's language: the translation if it is in that language, else the original if that is. */
export function docInLanguage(d: VaultDocument, language: string): { summary: string[]; text?: string } {
  const lang = (language || "en").toLowerCase().slice(0, 2);
  const tr = (d.translatedLanguageCode || "en").toLowerCase().slice(0, 2);
  const orig = (d.originalLanguageCode || "").toLowerCase().slice(0, 2);
  const sum = d.summary;
  if (tr !== lang && orig === lang && sum && typeof sum === "object" && !Array.isArray(sum) && sum.originalText?.length) {
    return { summary: sum.originalText, text: d.contentOriginal || undefined };
  }
  return { summary: summaryLines(sum), text: d.contentTranslated || d.contentOriginal || undefined };
}

export function summaryLines(sum: VaultDocument["summary"]): string[] {
  if (!sum) return [];
  if (typeof sum === "string") return [sum];
  if (Array.isArray(sum)) return sum.filter((x) => typeof x === "string");
  return (sum.englishText?.length ? sum.englishText : sum.bullets) || [];
}

/** Downloads the original from the patient's own storage. */
export async function ownOriginal(d: VaultDocument): Promise<OriginalFile | null> {
  const path = d.filePath || (d.fileUrl && !/^https?:/i.test(d.fileUrl) ? d.fileUrl : null);
  if (!path) return null;
  const { data: blob } = await supabase.storage.from("medical-documents").download(path);
  if (!blob) return null;
  const isPdf = blob.type === "application/pdf" || /\.pdf$/i.test(path);
  const isImg = blob.type.startsWith("image/") || /\.(jpe?g|png|gif|webp)$/i.test(path);
  return { bytes: await blob.arrayBuffer(), kind: isPdf ? "pdf" : isImg ? "image" : "other", mime: blob.type };
}

// Headings for other languages, reusing the export's translated labels where they exist.
const LOCAL: Record<string, Record<string, string>> = {
  ar: { allergies: "الحساسية المعروفة", medications: "الأدوية", labs: "نتائج الفحوصات", imaging: "دراسات التصوير", documents: "المستندات", colTest: "المؤشر", colResult: "القيمة", colRange: "النطاق المرجعي", colStatus: "الحالة", normal: "طبيعي", flagged: "مُعلَّم", critical: "حرج" },
  es: { title: "Resumen de salud", allergies: "Alergias conocidas", medications: "Medicamentos", labs: "Resultados de laboratorio", imaging: "Imagenología", documents: "Documentos", colTest: "Prueba", colResult: "Resultado", colRange: "Rango", colStatus: "Estado", normal: "Normal", flagged: "Fuera de rango", critical: "Crítico", current: "Actual", past: "Anterior", sampleDate: "Fecha de la muestra", dob: "Fecha de nacimiento", conditions: "Diagnósticos" },
  fr: { title: "Résumé de santé", allergies: "Allergies connues", medications: "Médicaments", labs: "Résultats biologiques", imaging: "Imagerie", documents: "Documents", colTest: "Examen", colResult: "Résultat", colRange: "Valeurs de référence", colStatus: "Statut", normal: "Normal", flagged: "Hors norme", critical: "Critique", current: "En cours", past: "Antérieur", sampleDate: "Date du prélèvement", dob: "Date de naissance", conditions: "Pathologies" },
};

/** Fetches originals, renders the brief and merges everything into one PDF. */
export async function buildHealthBrief(input: HealthBriefInput): Promise<HealthBriefResult> {
  const { patient, language, includeOriginals, onProgress } = input;
  const getFile = input.getFile ?? ownOriginal;

  let data = input.data;
  if (language && language !== "en") {
    onProgress?.("translating");
    try {
      const { data: res, error } = await supabase.functions.invoke("translate-export", { body: { payload: data, targetLanguage: language } });
      if (!error && res?.translated) data = res.translated as VaultData;
    } catch { /* fall back to the source language */ }
  }

  // Newest first everywhere.
  const docs = [...(data.documents as VaultDocument[])].sort((a, b) => byDateDesc(a.date, b.date));

  // Originals first, so each divider truthfully says whether its original follows.
  const files: (OriginalFile | null)[] = [];
  if (includeOriginals) {
    for (let i = 0; i < docs.length; i++) {
      onProgress?.("collecting", `Collecting original ${i + 1} of ${docs.length}…`);
      let f: OriginalFile | null = null;
      try { f = await getFile(docs[i]); } catch { f = null; }
      files.push(f && (f.kind === "pdf" || f.kind === "image") ? f : null);
    }
  }

  onProgress?.("rendering");
  const groups = new Map<string, typeof data.bloodResults>();
  for (const r of data.bloodResults) {
    const k = r.date || "";
    groups.set(k, [...(groups.get(k) || []), r]);
  }
  const labGroups = [...groups.keys()].sort(byDateDesc).map((k) => ({
    dateLabel: k ? fmtDate(k, language) : "Date not recorded",
    rows: groups.get(k)!.map((r) => {
      const range = displayRange(r, patient.biologicalSex);
      return { marker: r.marker, value: `${r.value} ${r.unit || ""}`.trim(), range: range?.text || "", typical: !!range?.typical, status: r.status };
    }),
  }));

  // Imaging: one row per study (re-extractions collapse onto the fullest finding).
  const imaging: { type: string; region: string; date: string; facility: string; finding: string; status: string }[] = [];
  for (const i of data.imagingResults) {
    const hit = imaging.find((x) => x.type.toLowerCase() === (i.type || "").toLowerCase() && x.date === i.date && (x.facility || "").toLowerCase() === (i.facility || "").toLowerCase());
    if (!hit) imaging.push({ ...i });
    else {
      if ((i.finding || "").length > (hit.finding || "").length) hit.finding = i.finding;
      if (i.status === "flagged") hit.status = "flagged";
    }
  }

  const strings = LOCAL[language];
  const payload = {
    version: 2,
    language,
    includeOriginals,
    generatedAtLabel: fmtDate(new Date().toISOString(), language),
    patient: {
      fullName: patient.fullName,
      dobLabel: fmtDate(patient.dob, language) || undefined,
      sex: patient.biologicalSex ? patient.biologicalSex[0].toUpperCase() + patient.biologicalSex.slice(1) : undefined,
      nationality: patient.nationality,
      bloodType: patient.bloodType,
      conditions: patient.conditions,
    },
    allergies: data.allergies.map((a) => ({ substance: a.substance, reaction: a.reaction, severity: a.severity })),
    medications: [...data.medications]
      .sort((a, b) => (a.active === b.active ? byDateDesc(a.date, b.date) : a.active ? -1 : 1))
      .map((m) => ({ name: m.name, dose: m.dose, frequency: m.frequency, prescriber: m.prescriber, facility: m.facility, dateLabel: fmtDate(m.date, language), active: m.active !== false })),
    labGroups,
    imaging: imaging.sort((a, b) => byDateDesc(a.date, b.date)).map((i) => ({
      title: [i.type, i.region].filter(Boolean).join(" · "), dateLabel: fmtDate(i.date, language), facility: i.facility, finding: i.finding, status: i.status,
    })),
    documents: docs.map((d, i) => ({
      name: d.name, type: d.type, dateLabel: fmtDate(d.date, language), facility: d.facility, country: d.country,
      summary: docInLanguage(d, language).summary, hasOriginal: !!files[i], text: files[i] ? undefined : docInLanguage(d, language).text,
    })),
    ...(strings ? { strings } : {}),
  };

  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
  const session = (await supabase.auth.getSession()).data.session;
  const res = await fetch(`${url}/functions/v1/render-export-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: anon, Authorization: `Bearer ${session?.access_token || anon}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`The Health Brief couldn't be created (${res.status}). Please try again.`);
  const briefBytes = await res.arrayBuffer();

  onProgress?.("merging");
  const out = await mergeOriginals(briefBytes, includeOriginals ? files : [], docs.length, patient.fullName);
  onProgress?.("ready");
  const missing = includeOriginals ? docs.filter((_, i) => !files[i]).map((d) => d.name) : [];
  return {
    blob: new Blob([out.slice()], { type: "application/pdf" }),
    documents: docs.length,
    originals: files.filter(Boolean).length,
    missing,
  };
}
