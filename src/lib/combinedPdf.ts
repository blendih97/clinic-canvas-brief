// Builds ONE PDF containing a RinVita summary followed by every original document,
// so a hospital can file a patient's whole record set as a single attachment.
// Runs entirely in the browser; files are fetched from short-lived authorised URLs.
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export interface BundleDoc {
  name: string;
  type?: string | null;
  facility?: string | null;
  date?: string | null;
  summary: string[];
  text?: string | null;               // RinVita's (translated) text, used when there is no original
  /** Returns the original file, or null when none was stored or shared. */
  getFile?: () => Promise<{ bytes: ArrayBuffer; kind: "pdf" | "image" | "other"; mime?: string } | null>;
}

export interface BundleInput {
  title: string;                       // e.g. "Medical records — Eleanor Morgan"
  subtitle?: string;                   // e.g. "Shared via RinVita on 3 Nov 2026"
  allergies?: string[];
  medications?: string[];
  labs?: { marker: string; value: string; range: string; status: string }[];
  docs: BundleDoc[];
}

export interface BundleResult { bytes: Uint8Array; included: number; missing: string[] }

const A4: [number, number] = [595.28, 841.89];
const M = 50;
const GOLD = rgb(0.72, 0.58, 0.16);
const INK = rgb(0.12, 0.16, 0.2);
const MUTED = rgb(0.42, 0.46, 0.5);

/** Standard PDF fonts only cover Latin-1-ish text; replace anything else so rendering never fails. */
function safe(font: PDFFont, s: string): string {
  let out = "";
  for (const ch of s.replace(/\r/g, "")) {
    try { font.encodeText(ch); out += ch; } catch { out += ch === "\n" ? "\n" : "?"; }
  }
  return out;
}

function wrap(font: PDFFont, text: string, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const para of safe(font, text).split("\n")) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) { lines.push(""); continue; }
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(next, size) <= width) { line = next; continue; }
      if (line) lines.push(line);
      // Break very long words.
      let word = w;
      while (font.widthOfTextAtSize(word, size) > width && word.length > 1) {
        let cut = word.length - 1;
        while (cut > 1 && font.widthOfTextAtSize(word.slice(0, cut), size) > width) cut--;
        lines.push(word.slice(0, cut)); word = word.slice(cut);
      }
      line = word;
    }
    if (line) lines.push(line);
  }
  return lines;
}

class Writer {
  page!: PDFPage; y = 0;
  constructor(private pdf: PDFDocument, private font: PDFFont, private bold: PDFFont) { this.newPage(); }
  newPage() { this.page = this.pdf.addPage(A4); this.y = A4[1] - M; }
  ensure(h: number) { if (this.y - h < M) this.newPage(); }
  text(s: string, opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; gap?: number; indent?: number } = {}) {
    const size = opts.size ?? 10, f = opts.bold ? this.bold : this.font, indent = opts.indent ?? 0;
    for (const line of wrap(f, s, size, A4[0] - 2 * M - indent)) {
      this.ensure(size * 1.4);
      this.page.drawText(line, { x: M + indent, y: this.y - size, size, font: f, color: opts.color ?? INK });
      this.y -= size * 1.4;
    }
    this.y -= opts.gap ?? 4;
  }
  rule() { this.ensure(10); this.page.drawLine({ start: { x: M, y: this.y }, end: { x: A4[0] - M, y: this.y }, thickness: 0.5, color: rgb(0.85, 0.83, 0.78) }); this.y -= 10; }
}

/** Downscale large photos so the bundle stays small enough to email. */
async function compressImage(bytes: ArrayBuffer, mime?: string): Promise<{ data: Uint8Array; png: boolean }> {
  try {
    const blob = new Blob([bytes], { type: mime || "image/jpeg" });
    const bmp = await createImageBitmap(blob);
    const scale = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale); canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const out: Blob = await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", 0.82));
    return { data: new Uint8Array(await out.arrayBuffer()), png: false };
  } catch {
    const u = new Uint8Array(bytes);
    return { data: u, png: u[0] === 0x89 && u[1] === 0x50 };
  }
}

export async function buildCombinedPdf(input: BundleInput, onProgress?: (done: number, total: number) => void): Promise<BundleResult> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(input.title); pdf.setProducer("RinVita"); pdf.setCreator("RinVita");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(pdf, font, bold);

  // Cover: summary of what is enclosed.
  w.text("RinVita", { size: 11, bold: true, color: GOLD, gap: 2 });
  w.text(input.title, { size: 18, bold: true, gap: 2 });
  if (input.subtitle) w.text(input.subtitle, { size: 9, color: MUTED, gap: 8 });
  w.text("This file was compiled by RinVita at the patient's request. Summaries and translations are AI-generated; the enclosed originals are the authoritative records.", { size: 8.5, color: MUTED, gap: 10 });
  w.rule();
  if (input.allergies?.length) { w.text("Allergies", { size: 12, bold: true }); input.allergies.forEach((a) => w.text(`• ${a}`, { indent: 6, gap: 1 })); w.y -= 6; }
  if (input.medications?.length) { w.text("Medications", { size: 12, bold: true }); input.medications.forEach((m) => w.text(`• ${m}`, { indent: 6, gap: 1 })); w.y -= 6; }
  if (input.labs?.length) {
    w.text("Lab results", { size: 12, bold: true });
    input.labs.forEach((l) => w.text(`• ${l.marker}: ${l.value}${l.range ? `  (range ${l.range})` : ""}${l.status && l.status !== "normal" ? `  [${l.status}]` : ""}`, { indent: 6, gap: 1 }));
    w.y -= 6;
  }
  w.text(`Enclosed documents (${input.docs.length})`, { size: 12, bold: true });
  input.docs.forEach((d, i) => w.text(`${i + 1}. ${d.name}${[d.type, d.facility, d.date].filter(Boolean).length ? ` — ${[d.type, d.facility, d.date].filter(Boolean).join(" · ")}` : ""}`, { indent: 6, gap: 1 }));

  const missing: string[] = [];
  let included = 0;
  for (let i = 0; i < input.docs.length; i++) {
    const d = input.docs[i];
    onProgress?.(i, input.docs.length);
    // Divider page with RinVita's reading.
    w.newPage();
    w.text(`Document ${i + 1} of ${input.docs.length}`, { size: 9, color: GOLD, bold: true, gap: 2 });
    w.text(d.name, { size: 15, bold: true, gap: 2 });
    const meta = [d.type, d.facility, d.date].filter(Boolean).join(" · ");
    if (meta) w.text(meta, { size: 9, color: MUTED, gap: 8 });
    if (d.summary.length) { w.text("RinVita summary", { size: 11, bold: true }); d.summary.forEach((s) => w.text(`• ${s}`, { indent: 6, gap: 1 })); }

    let file: Awaited<ReturnType<NonNullable<BundleDoc["getFile"]>>> = null;
    try { file = d.getFile ? await d.getFile() : null; } catch { file = null; }
    if (file?.kind === "pdf") {
      try {
        const src = await PDFDocument.load(file.bytes, { ignoreEncryption: true });
        const pages = await pdf.copyPages(src, src.getPageIndices());
        pages.forEach((p) => pdf.addPage(p));
        included++; continue;
      } catch { /* fall through to text */ }
    } else if (file?.kind === "image") {
      try {
        const { data, png } = await compressImage(file.bytes, file.mime);
        const img = png ? await pdf.embedPng(data) : await pdf.embedJpg(data);
        const page = pdf.addPage(A4);
        const s = Math.min((A4[0] - 2 * 30) / img.width, (A4[1] - 2 * 30) / img.height);
        page.drawImage(img, { x: (A4[0] - img.width * s) / 2, y: (A4[1] - img.height * s) / 2, width: img.width * s, height: img.height * s });
        included++; continue;
      } catch { /* fall through to text */ }
    }
    // No original available: include RinVita's text so nothing is silently dropped.
    missing.push(d.name);
    w.y -= 6;
    w.text("Original file not included", { size: 10, bold: true, color: MUTED });
    if (d.text) w.text(d.text, { size: 9 });
  }
  onProgress?.(input.docs.length, input.docs.length);
  const bytes = await pdf.save({ useObjectStreams: true });
  return { bytes, included, missing };
}

export function downloadBytes(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes.slice()], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function safeFileName(s: string) {
  return s.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").slice(0, 60) || "records";
}
