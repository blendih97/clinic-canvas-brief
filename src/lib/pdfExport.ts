import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import type { BloodResult, ImagingResult, Medication, Allergy, Document as VaultDoc, Alert } from "@/store/vaultStore";
import { getPdfStrings, getLanguageName } from "@/lib/supportedLanguages";
import { supabase } from "@/integrations/supabase/client";

async function downloadPdf(doc: jsPDF, filename: string) {
  await doc.save(filename, { returnPromise: true });
}

export interface VaultData {
  bloodResults: BloodResult[];
  imagingResults: ImagingResult[];
  medications: Medication[];
  documents: VaultDoc[];
  alerts: Alert[];
  allergies: Allergy[];
}

export interface ExportOptions {
  language?: string; // ISO code; defaults to "en"
  sections?: {
    blood?: boolean;
    imaging?: boolean;
    medications?: boolean;
    allergies?: boolean;
    documents?: boolean;
    visits?: boolean;
  };
  includeOriginalsAppendix?: boolean;
  dateRange?: "all" | "12m" | "6m" | { from: string; to: string };
}

// ---------- helpers ----------

function withinDateRange(dateStr: string | undefined, range: ExportOptions["dateRange"]): boolean {
  if (!range || range === "all") return true;
  if (!dateStr) return true;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return true;
  if (range === "12m") return d >= new Date(Date.now() - 365 * 24 * 3600 * 1000);
  if (range === "6m") return d >= new Date(Date.now() - 182 * 24 * 3600 * 1000);
  if (typeof range === "object") {
    const from = range.from ? new Date(range.from) : null;
    const to = range.to ? new Date(range.to) : null;
    if (from && d < from) return false;
    if (to && d > to) return false;
  }
  return true;
}

function filterData(data: VaultData, options: ExportOptions): VaultData {
  const range = options.dateRange;
  return {
    bloodResults: data.bloodResults.filter((r) => withinDateRange(r.date, range)),
    imagingResults: data.imagingResults.filter((r) => withinDateRange(r.date, range)),
    medications: data.medications.filter((r) => withinDateRange(r.date, range)),
    documents: data.documents.filter((r) => withinDateRange(r.date, range)),
    allergies: data.allergies,
    alerts: data.alerts,
  };
}

// Translate the assembled health payload via the edge function (cached server-side).
async function translatePayload(data: VaultData, language: string): Promise<VaultData> {
  if (!language || language === "en") return data;
  try {
    const { data: result, error } = await supabase.functions.invoke("translate-export", {
      body: { payload: data, targetLanguage: language },
    });
    if (error) throw new Error(error.message || "Translation failed");
    return (result?.translated as VaultData) || data;
  } catch (err) {
    console.warn("translate-export failed, falling back to source data:", err);
    return data;
  }
}

// ---------- chrome ----------

function addHeader(doc: jsPDF, patientName: string, pageNum: number, totalPages: number, lang: string) {
  const t = getPdfStrings(lang);
  const w = doc.internal.pageSize.getWidth();
  doc.setFontSize(10);
  doc.setTextColor(180, 160, 100);
  doc.setFont("helvetica", "bold");
  doc.text("RinVita", 20, 15);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(patientName, 60, 15);
  doc.text(`${t.page} ${pageNum} ${t.of} ${totalPages}`, w - 20, 15, { align: "right" });
  doc.setDrawColor(220, 220, 220);
  doc.line(20, 18, w - 20, 18);
}

function addFooter(doc: jsPDF, lang: string) {
  const t = getPdfStrings(lang);
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setDrawColor(220, 220, 220);
  doc.line(20, h - 20, w - 20, h - 20);
  doc.setFontSize(6);
  doc.setTextColor(150, 150, 150);
  const lines = doc.splitTextToSize(t.footer, w - 40);
  doc.text(lines, 20, h - 15);
}

function applyHeadersAndFooters(doc: jsPDF, patientName: string, lang: string) {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeader(doc, patientName, i, totalPages, lang);
    addFooter(doc, lang);
  }
}

function addCoverPage(doc: jsPDF, patientName: string, dob: string, lang: string) {
  const t = getPdfStrings(lang);
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  doc.setFontSize(32);
  doc.setTextColor(180, 160, 100);
  doc.setFont("helvetica", "bold");
  doc.text("RinVita", w / 2, h / 2 - 40, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.text(t.cover_subtitle, w / 2, h / 2 - 28, { align: "center" });

  doc.setDrawColor(180, 160, 100);
  doc.line(w / 2 - 30, h / 2 - 20, w / 2 + 30, h / 2 - 20);

  doc.setFontSize(16);
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "bold");
  doc.text(patientName, w / 2, h / 2, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  if (dob) doc.text(`${t.date_of_birth}: ${dob}`, w / 2, h / 2 + 12, { align: "center" });
  doc.text(`${t.generated}: ${new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}`, w / 2, h / 2 + 24, { align: "center" });

  // Language line
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text(getLanguageName(lang), w / 2, h / 2 + 36, { align: "center" });
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "bold");
  doc.text(title, 20, y);
  doc.setDrawColor(180, 160, 100);
  doc.line(20, y + 2, 80, y + 2);
  return y + 10;
}

function checkPageBreak(doc: jsPDF, y: number, needed: number = 30): number {
  if (y + needed > doc.internal.pageSize.getHeight() - 30) {
    doc.addPage();
    return 28;
  }
  return y;
}

// ---------- sections ----------

function addAlerts(doc: jsPDF, alerts: Alert[], y: number, lang: string): number {
  if (alerts.length === 0) return y;
  const t = getPdfStrings(lang);
  y = checkPageBreak(doc, y, 20 + alerts.length * 8);
  y = addSectionTitle(doc, t.alerts, y);
  doc.setFontSize(9);
  alerts.forEach((a) => {
    y = checkPageBreak(doc, y);
    doc.setTextColor(a.type === "critical" ? 200 : 180, a.type === "critical" ? 50 : 120, 50);
    doc.text(`${a.type === "critical" ? "⚠" : "●"} ${a.message}`, 22, y);
    y += 7;
  });
  return y + 4;
}

function addBloodResults(doc: jsPDF, results: BloodResult[], y: number, lang: string): number {
  if (results.length === 0) return y;
  const t = getPdfStrings(lang);
  doc.addPage();
  y = 28;
  y = addSectionTitle(doc, t.blood_results, y);

  autoTable(doc, {
    startY: y,
    margin: { left: 20, right: 20 },
    head: [[t.marker, t.value, t.unit, t.range, t.status, t.source, t.date]],
    body: results.map((r) => [r.marker, String(r.value), r.unit, r.range, r.status, r.source, r.date]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [180, 160, 100], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 4) {
        const val = String(data.cell.raw);
        if (val === "critical") data.cell.styles.textColor = [200, 50, 50];
        else if (val === "flagged") data.cell.styles.textColor = [200, 150, 50];
      }
    },
  });

  return (doc as any).lastAutoTable?.finalY + 8 || y + 20;
}

function addImaging(doc: jsPDF, results: ImagingResult[], y: number, lang: string): number {
  if (results.length === 0) return y;
  const t = getPdfStrings(lang);
  doc.addPage();
  y = 28;
  y = addSectionTitle(doc, t.imaging, y);
  doc.setFontSize(9);
  results.forEach((r) => {
    y = checkPageBreak(doc, y, 25);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text(`${r.type} — ${r.region}`, 22, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`${r.facility} · ${r.date}`, 22, y);
    y += 6;
    doc.setTextColor(80, 80, 80);
    const lines = doc.splitTextToSize(r.finding || t.no_findings, 160);
    doc.text(lines, 22, y);
    y += lines.length * 5 + 8;
  });
  return y;
}

function addMedications(doc: jsPDF, meds: Medication[], y: number, lang: string): number {
  if (meds.length === 0) return y;
  const t = getPdfStrings(lang);
  doc.addPage();
  y = 28;
  y = addSectionTitle(doc, t.medications, y);

  autoTable(doc, {
    startY: y,
    margin: { left: 20, right: 20 },
    head: [[t.name, t.dose, t.frequency, t.prescriber, t.facility, t.date, t.active]],
    body: meds.map((m) => [m.name, m.dose, m.frequency, m.prescriber, m.facility, m.date, m.active ? t.yes : t.no]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [180, 160, 100], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 248, 248] },
  });

  return (doc as any).lastAutoTable?.finalY + 8 || y + 20;
}

function addAllergies(doc: jsPDF, allergies: Allergy[], y: number, lang: string): number {
  if (allergies.length === 0) return y;
  const t = getPdfStrings(lang);
  y = checkPageBreak(doc, y, 20 + allergies.length * 10);
  y = addSectionTitle(doc, t.allergies, y);

  const boxH = 10 + allergies.length * 8;
  doc.setDrawColor(220, 60, 60);
  doc.setLineWidth(0.5);
  doc.roundedRect(20, y - 2, doc.internal.pageSize.getWidth() - 40, boxH, 2, 2);

  doc.setFontSize(9);
  allergies.forEach((a) => {
    doc.setTextColor(180, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.text(a.substance, 25, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`${a.reaction} · ${t.severity}: ${a.severity}`, 80, y + 5);
    y += 8;
  });

  return y + 12;
}

function addDocumentsList(doc: jsPDF, docs: VaultDoc[], y: number, lang: string): number {
  if (docs.length === 0) return y;
  const t = getPdfStrings(lang);
  doc.addPage();
  y = 28;
  y = addSectionTitle(doc, t.documents, y);

  autoTable(doc, {
    startY: y,
    margin: { left: 20, right: 20 },
    head: [[t.name, t.type, t.facility, t.country, t.date, t.pages, t.extracted]],
    body: docs.map((d) => [d.name, d.type, d.facility, d.country, d.date, String(d.pages), d.extracted ? t.yes : t.no]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [180, 160, 100], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 248, 248] },
  });

  return (doc as any).lastAutoTable?.finalY + 8 || y + 20;
}

function addOriginalsAppendix(doc: jsPDF, docs: VaultDoc[], lang: string) {
  const withOriginals = docs.filter((d) => d.contentOriginal && d.contentOriginal.trim().length > 0);
  if (withOriginals.length === 0) return;
  const t = getPdfStrings(lang);
  doc.addPage();
  let y = 28;
  y = addSectionTitle(doc, t.appendix_originals, y);

  doc.setFontSize(9);
  withOriginals.forEach((d) => {
    y = checkPageBreak(doc, y, 30);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text(d.name, 22, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`${d.facility || ""} · ${d.date || ""} · ${d.country || ""}`, 22, y);
    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    const lines = doc.splitTextToSize(d.contentOriginal || "", 170);
    // Render block-by-block with page-break checks
    for (const line of lines) {
      y = checkPageBreak(doc, y, 6);
      doc.text(line, 22, y);
      y += 4;
    }
    y += 6;
    doc.setFontSize(9);
  });
}

// ---------- public API ----------

export async function generateExportPDF(
  data: VaultData,
  patientName: string,
  dob: string,
  options: ExportOptions = {},
) {
  const lang = (options.language || "en").toLowerCase();
  const sections = options.sections || { blood: true, imaging: true, medications: true, allergies: true, documents: true };

  // 1. Filter by date range
  const filtered = filterData(data, options);

  // 2. Build the payload that needs translation (only the sections being exported)
  const payloadForTranslation: VaultData = {
    bloodResults: sections.blood ? filtered.bloodResults : [],
    imagingResults: sections.imaging ? filtered.imagingResults : [],
    medications: sections.medications ? filtered.medications : [],
    allergies: sections.allergies ? filtered.allergies : [],
    documents: sections.documents ? filtered.documents : [],
    alerts: filtered.alerts,
  };

  // 3. Translate (cached server-side)
  const translated = await translatePayload(payloadForTranslation, lang);

  // 4. Render
  const doc = new jsPDF();
  addCoverPage(doc, patientName, dob, lang);

  doc.addPage();
  let y = 28;
  y = addAlerts(doc, translated.alerts, y, lang);
  if (sections.allergies) y = addAllergies(doc, translated.allergies, y, lang);
  if (sections.blood) y = addBloodResults(doc, translated.bloodResults, y, lang);
  if (sections.imaging) y = addImaging(doc, translated.imagingResults, y, lang);
  if (sections.medications) y = addMedications(doc, translated.medications, y, lang);
  if (sections.documents) addDocumentsList(doc, translated.documents, y, lang);

  // 5. Optional appendix of original-language source text
  if (options.includeOriginalsAppendix !== false) {
    addOriginalsAppendix(doc, filtered.documents, lang);
  }

  applyHeadersAndFooters(doc, patientName, lang);
  await downloadPdf(doc, `RinVita_Health_Brief_${lang}_${new Date().toISOString().split("T")[0]}.pdf`);
}

// Selection-only export (specific document IDs) — kept for the "Export by Selection" mode.
export async function generateSelectionPDF(
  data: VaultData,
  patientName: string,
  dob: string,
  selectedIds: Set<string>,
  options: ExportOptions = {},
) {
  const lang = (options.language || "en").toLowerCase();
  const t = getPdfStrings(lang);
  const selectedDocs = data.documents.filter((d) => selectedIds.has(d.id));
  const subset: VaultData = {
    bloodResults: [], imagingResults: [], medications: [], allergies: [], alerts: [],
    documents: selectedDocs,
  };
  const translated = await translatePayload(subset, lang);

  const doc = new jsPDF();
  addCoverPage(doc, patientName, dob, lang);

  doc.addPage();
  let y = 28;
  y = addSectionTitle(doc, t.selected_documents, y);

  translated.documents.forEach((d) => {
    y = checkPageBreak(doc, y, 30);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text(d.name, 22, y);
    y += 6;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(`${d.type} · ${d.facility} · ${d.country} · ${d.date} · ${d.pages} ${t.pages}`, 22, y);
    y += 6;
    if (d.summary) {
      doc.setTextColor(80, 80, 80);
      const summaryText = Array.isArray(d.summary) ? d.summary.join(". ") : typeof d.summary === "string" ? d.summary : (d.summary as any).bullets?.join(". ") || "";
      const lines = doc.splitTextToSize(summaryText, 160);
      doc.text(lines, 22, y);
      y += lines.length * 5;
    }
    if (d.contentTranslated) {
      const lines = doc.splitTextToSize(d.contentTranslated, 170);
      for (const line of lines.slice(0, 80)) {
        y = checkPageBreak(doc, y, 6);
        doc.text(line, 22, y);
        y += 4;
      }
    }
    y += 8;
  });

  if (options.includeOriginalsAppendix !== false) {
    addOriginalsAppendix(doc, selectedDocs, lang);
  }

  applyHeadersAndFooters(doc, patientName, lang);
  await downloadPdf(doc, `RinVita_Selection_${lang}_${new Date().toISOString().split("T")[0]}.pdf`);
}

// Legacy wrappers retained so existing callers continue to compile.
export async function generateFullBriefPDF(data: VaultData, patientName: string, dob: string) {
  return generateExportPDF(data, patientName, dob, { language: "en" });
}

export async function generateCategoryPDF(
  data: VaultData,
  patientName: string,
  dob: string,
  categories: { blood: boolean; imaging: boolean; medications: boolean; allergies: boolean; documents: boolean },
) {
  return generateExportPDF(data, patientName, dob, { language: "en", sections: categories });
}
