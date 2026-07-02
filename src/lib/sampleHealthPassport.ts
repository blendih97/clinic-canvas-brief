// Generates a downloadable sample RinVita Health Passport PDF using jsPDF.
// Sources data from src/data/sampleAmiraK.ts (fictional patient — Amira K.).
// Six pages: Cover, At-a-glance, Blood results (compare), Medications,
// Visit timeline, Cardiology summary. Discreet footer on every page.

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SAMPLE_DOCS, SAMPLE_PATIENT } from "@/data/sampleAmiraK";

const GOLD: [number, number, number] = [180, 160, 100];
const INK: [number, number, number] = [60, 60, 60];
const MUTED: [number, number, number] = [110, 110, 110];
const SOFT: [number, number, number] = [150, 150, 150];
const CRITICAL: [number, number, number] = [190, 60, 60];
const WARN: [number, number, number] = [190, 140, 50];
const OK: [number, number, number] = [90, 140, 90];

const FOOTER_TEXT = "Sample document — fictional patient data for demonstration.";

function statusColor(status: "normal" | "high" | "low"): [number, number, number] {
  if (status === "high") return CRITICAL;
  if (status === "low") return WARN;
  return OK;
}

function drawFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setDrawColor(220, 220, 220);
  doc.line(20, h - 20, w - 20, h - 20);
  doc.setFontSize(8);
  doc.setTextColor(...SOFT);
  doc.setFont("helvetica", "italic");
  doc.text(FOOTER_TEXT, 20, h - 13);
  doc.setFont("helvetica", "normal");
  doc.text(`${pageNum} / ${totalPages}`, w - 20, h - 13, { align: "right" });
}

function drawHeader(doc: jsPDF, patientName: string) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFontSize(10);
  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.text("RinVita", 20, 15);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text(patientName, w - 20, 15, { align: "right" });
  doc.setDrawColor(220, 220, 220);
  doc.line(20, 18, w - 20, 18);
}

function sectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(15);
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.text(title, 20, y);
  doc.setDrawColor(...GOLD);
  doc.line(20, y + 2.5, 80, y + 2.5);
  doc.setFont("helvetica", "normal");
  return y + 12;
}

function drawCover(doc: jsPDF) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Concentric-circle motif (subtle, top-right)
  doc.setDrawColor(220, 205, 165);
  for (let r = 10; r <= 40; r += 8) {
    doc.circle(w - 30, 40, r);
  }

  doc.setFontSize(36);
  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.text("RinVita", w / 2, h / 2 - 46, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...SOFT);
  doc.text("HEALTH PASSPORT · SAMPLE", w / 2, h / 2 - 34, { align: "center" });

  doc.setDrawColor(...GOLD);
  doc.line(w / 2 - 30, h / 2 - 24, w / 2 + 30, h / 2 - 24);

  doc.setFontSize(22);
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.text(SAMPLE_PATIENT.fullName, w / 2, h / 2 - 6, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text(
    `DOB ${SAMPLE_PATIENT.dob}  ·  ${SAMPLE_PATIENT.biologicalSex}  ·  ${SAMPLE_PATIENT.nationality}  ·  Blood type ${SAMPLE_PATIENT.bloodType}`,
    w / 2,
    h / 2 + 6,
    { align: "center" }
  );

  doc.setFontSize(10);
  doc.setTextColor(...SOFT);
  doc.text(
    `Generated ${new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}`,
    w / 2,
    h / 2 + 20,
    { align: "center" }
  );

  // Route line
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("Dubai  →  Paris  →  Istanbul  →  Singapore", w / 2, h - 60, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor(...SOFT);
  doc.text("18 months of care, one document.", w / 2, h - 52, { align: "center" });
}

function drawAtAGlance(doc: jsPDF) {
  drawHeader(doc, SAMPLE_PATIENT.fullName);
  let y = 30;
  y = sectionTitle(doc, "At a glance", y);

  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  const summary =
    "Four records spanning four countries. One recent surgery (uncomplicated appendicectomy, Paris, Mar 2025). Iron-deficiency anaemia and vitamin D insufficiency identified in Dubai (Nov 2024), both resolved by Singapore follow-up (Feb 2026). Cardiology review in Istanbul (Jul 2025) — normal ECG and echocardiogram; blood pressure at upper limit.";
  const lines = doc.splitTextToSize(summary, doc.internal.pageSize.getWidth() - 40);
  doc.text(lines, 20, y);
  y += lines.length * 5 + 6;

  // Counts
  const w = doc.internal.pageSize.getWidth();
  const boxW = (w - 40 - 24) / 3;
  const boxes: Array<[string, string]> = [
    ["4", "Records"],
    ["1", "Surgery"],
    ["2", "Resolved flags"],
  ];
  boxes.forEach(([num, label], i) => {
    const x = 20 + i * (boxW + 12);
    doc.setDrawColor(...GOLD);
    doc.setFillColor(252, 250, 245);
    doc.rect(x, y, boxW, 28, "FD");
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GOLD);
    doc.text(num, x + 10, y + 14);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(label, x + 10, y + 22);
  });
  y += 40;

  // Clinical highlights
  y = sectionTitle(doc, "Clinical highlights", y);
  doc.setFontSize(10);
  const highlights = [
    ["Iron-deficiency anaemia (Nov 2024)", "Resolved by Feb 2026 with oral iron supplementation.", "resolved"],
    ["Vitamin D insufficiency (Nov 2024)", "Corrected to 32 ng/mL by Feb 2026.", "resolved"],
    ["Laparoscopic appendicectomy (Mar 2025)", "Uneventful recovery. Clinique Saint-Rémi, Paris.", "note"],
    ["BP at upper limit (Jul 2025)", "128/82 — recheck in 3 months, home BP diary advised.", "watch"],
  ];
  highlights.forEach(([title, note, kind]) => {
    doc.setFillColor(
      kind === "resolved" ? 240 : kind === "watch" ? 253 : 248,
      kind === "resolved" ? 248 : kind === "watch" ? 246 : 246,
      kind === "resolved" ? 240 : kind === "watch" ? 232 : 240
    );
    doc.rect(20, y, doc.internal.pageSize.getWidth() - 40, 16, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...INK);
    doc.setFontSize(10);
    doc.text(title, 24, y + 6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.setFontSize(9);
    doc.text(note, 24, y + 12.5);
    y += 20;
  });
}

function drawBloodResults(doc: jsPDF) {
  drawHeader(doc, SAMPLE_PATIENT.fullName);
  let y = 30;
  y = sectionTitle(doc, "Blood results — trend", y);

  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  doc.text(
    "Comparing Dubai (Nov 2024) with Singapore follow-up (Feb 2026). Reference ranges shown alongside.",
    20,
    y
  );
  y += 8;

  const dubai = SAMPLE_DOCS.find((d) => d.id === "dubai-labs")!;
  const singapore = SAMPLE_DOCS.find((d) => d.id === "singapore-blood")!;

  const markerNames = Array.from(
    new Set([...(dubai.markers || []), ...(singapore.markers || [])].map((m) => m.name))
  );

  const body = markerNames.map((name) => {
    const a = dubai.markers?.find((m) => m.name === name);
    const b = singapore.markers?.find((m) => m.name === name);
    return [
      name,
      a ? a.value : "—",
      a ? a.status : "—",
      b ? b.value : "—",
      b ? b.status : "—",
      (a || b)!.range,
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: 20, right: 20 },
    head: [["Marker", "Nov 2024 · Dubai", "Status", "Feb 2026 · Singapore", "Status", "Reference range"]],
    body,
    styles: { fontSize: 9, cellPadding: 3.5 },
    headStyles: { fillColor: GOLD, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 248, 244] },
    didParseCell: (data) => {
      if (data.section === "body" && (data.column.index === 2 || data.column.index === 4)) {
        const v = String(data.cell.raw);
        if (v === "high" || v === "low") data.cell.styles.textColor = v === "high" ? CRITICAL : WARN;
        else if (v === "normal") data.cell.styles.textColor = OK;
      }
    },
  });

  y = (doc as any).lastAutoTable?.finalY + 10 || y + 40;

  // Legend
  doc.setFontSize(8.5);
  doc.setTextColor(...SOFT);
  doc.text("Status colours: ", 20, y);
  const legendX = 42;
  const items: Array<[string, [number, number, number]]> = [
    ["normal", OK],
    ["low / watch", WARN],
    ["high / flag", CRITICAL],
  ];
  let lx = legendX;
  items.forEach(([label, color]) => {
    doc.setTextColor(...color);
    doc.text(`● ${label}`, lx, y);
    lx += 34;
  });

  y += 12;
  doc.setTextColor(...MUTED);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.text("Interpretation", 20, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  const interp =
    "Haemoglobin recovered from 11.2 to 13.4 g/dL. Ferritin from 9 to 38 ng/mL. Vitamin D from 18 to 32 ng/mL. Supplementation successful; no further treatment required beyond maintenance.";
  const iLines = doc.splitTextToSize(interp, doc.internal.pageSize.getWidth() - 40);
  doc.text(iLines, 20, y);
}

function drawMedications(doc: jsPDF) {
  drawHeader(doc, SAMPLE_PATIENT.fullName);
  let y = 30;
  y = sectionTitle(doc, "Medications", y);

  const paris = SAMPLE_DOCS.find((d) => d.id === "paris-discharge")!;
  const body = (paris.medications || []).map((m) => [
    m.name,
    m.dose,
    m.freq,
    "Mar 2025",
    "Clinique Saint-Rémi, Paris",
    "Completed",
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: 20, right: 20 },
    head: [["Medication", "Dose", "Frequency", "Started", "Prescriber", "Status"]],
    body,
    styles: { fontSize: 9, cellPadding: 3.5 },
    headStyles: { fillColor: GOLD, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 248, 244] },
  });

  y = (doc as any).lastAutoTable?.finalY + 10 || y + 40;

  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "bold");
  doc.text("Known allergies", 20, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.text("None recorded.", 20, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("Chronic conditions", 20, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.text("None recorded.", 20, y);
}

function drawTimeline(doc: jsPDF) {
  drawHeader(doc, SAMPLE_PATIENT.fullName);
  let y = 30;
  y = sectionTitle(doc, "Visit timeline", y);

  const order: Array<typeof SAMPLE_DOCS[number]["id"]> = [
    "dubai-labs",
    "paris-discharge",
    "istanbul-cardiology",
    "singapore-blood",
  ];

  const w = doc.internal.pageSize.getWidth();
  // Vertical rule
  doc.setDrawColor(...GOLD);
  doc.line(30, y, 30, y + order.length * 34);

  order.forEach((id, i) => {
    const d = SAMPLE_DOCS.find((x) => x.id === id)!;
    const rowY = y + i * 34;
    // Dot
    doc.setFillColor(...GOLD);
    doc.circle(30, rowY + 4, 2.2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    doc.text(`${d.flag} ${d.timeline.label}`, 40, rowY + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...MUTED);
    doc.text(d.translatedTitle, 40, rowY + 11);

    doc.setFontSize(9);
    doc.setTextColor(...SOFT);
    const noteLines = doc.splitTextToSize(d.translatedSummary, w - 60);
    doc.text(noteLines.slice(0, 2), 40, rowY + 18);
  });
}

function drawCardiologySummary(doc: jsPDF) {
  drawHeader(doc, SAMPLE_PATIENT.fullName);
  let y = 30;
  y = sectionTitle(doc, "Cardiology consultation — Istanbul", y);

  const c = SAMPLE_DOCS.find((d) => d.id === "istanbul-cardiology")!;

  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(`${c.facility}  ·  ${new Date(c.dateISO).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}`, 20, y);
  y += 8;

  doc.setTextColor(...INK);
  const sumLines = doc.splitTextToSize(c.translatedSummary, doc.internal.pageSize.getWidth() - 40);
  doc.text(sumLines, 20, y);
  y += sumLines.length * 5 + 6;

  // Markers table
  const body = (c.markers || []).map((m) => [m.name, m.value, m.range, m.status]);
  autoTable(doc, {
    startY: y,
    margin: { left: 20, right: 20 },
    head: [["Measurement", "Value", "Reference", "Status"]],
    body,
    styles: { fontSize: 9, cellPadding: 3.5 },
    headStyles: { fillColor: GOLD, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 248, 244] },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 3) {
        const v = String(data.cell.raw);
        data.cell.styles.textColor = statusColor(v as "normal" | "high" | "low");
      }
    },
  });

  y = (doc as any).lastAutoTable?.finalY + 10 || y + 40;

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...INK);
  doc.text("Flags & follow-up", 20, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  (c.flags || []).forEach((f) => {
    doc.setFont("helvetica", "bold");
    doc.text(`• ${f.label}`, 22, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const dLines = doc.splitTextToSize(f.detail, doc.internal.pageSize.getWidth() - 48);
    doc.text(dLines, 26, y);
    y += dLines.length * 5 + 2;
  });

  // Closing note
  y += 6;
  doc.setDrawColor(...GOLD);
  doc.line(20, y, doc.internal.pageSize.getWidth() - 20, y);
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(...SOFT);
  doc.setFont("helvetica", "italic");
  const closing =
    "This sample Health Passport was generated from four fictional records in four languages. In your real vault, RinVita organises your own documents the same way — with originals always preserved alongside.";
  const cLines = doc.splitTextToSize(closing, doc.internal.pageSize.getWidth() - 40);
  doc.text(cLines, 20, y);
}

export async function generateSampleHealthPassport(): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  drawCover(doc);
  doc.addPage();
  drawAtAGlance(doc);
  doc.addPage();
  drawBloodResults(doc);
  doc.addPage();
  drawMedications(doc);
  doc.addPage();
  drawTimeline(doc);
  doc.addPage();
  drawCardiologySummary(doc);

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(doc, i, total);
  }

  doc.save("RinVita-Sample-Health-Passport.pdf");
}
