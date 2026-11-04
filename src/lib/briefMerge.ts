// Puts each original document straight after its divider page in the rendered Health Brief,
// then stamps page numbers across the whole file. Runs in the browser with pdf-lib.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface OriginalFile { bytes: ArrayBuffer; kind: "pdf" | "image" | "other"; mime?: string }

const A4: [number, number] = [595.28, 841.89];

/** Downscale large photos so the file stays small enough to email. */
async function compressImage(bytes: ArrayBuffer, mime?: string): Promise<{ data: Uint8Array; png: boolean }> {
  try {
    const bmp = await createImageBitmap(new Blob([bytes], { type: mime || "image/jpeg" }));
    const scale = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale); canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob: Blob = await new Promise((ok, no) => canvas.toBlob((b) => (b ? ok(b) : no(new Error("encode"))), "image/jpeg", 0.82));
    return { data: new Uint8Array(await blob.arrayBuffer()), png: false };
  } catch {
    const u = new Uint8Array(bytes);
    return { data: u, png: u[0] === 0x89 && u[1] === 0x50 };
  }
}

/**
 * The rendered brief ends with one divider page per document (none when originals are off).
 * Each original is inserted right after its divider; then every page gets "Page x of y".
 */
export async function mergeOriginals(briefBytes: ArrayBuffer, files: (OriginalFile | null)[], docCount: number, patientName: string): Promise<Uint8Array> {
  const brief = await PDFDocument.load(briefBytes);
  const out = await PDFDocument.create();
  out.setTitle(`Health Brief · ${patientName}`); out.setProducer("RinVita"); out.setCreator("RinVita");
  const total = brief.getPageCount();
  const dividers = files.length ? docCount : 0;
  const summaryCount = total - dividers;
  const copied = await out.copyPages(brief, brief.getPageIndices());
  const isOriginal: boolean[] = [];
  for (let i = 0; i < summaryCount; i++) { out.addPage(copied[i]); isOriginal.push(false); }

  for (let d = 0; d < dividers; d++) {
    out.addPage(copied[summaryCount + d]); isOriginal.push(false);
    const f = files[d];
    if (!f) continue;
    try {
      if (f.kind === "pdf") {
        const src = await PDFDocument.load(f.bytes, { ignoreEncryption: true });
        for (const p of await out.copyPages(src, src.getPageIndices())) { out.addPage(p); isOriginal.push(true); }
      } else {
        const { data, png } = await compressImage(f.bytes, f.mime);
        const img = png ? await out.embedPng(data) : await out.embedJpg(data);
        const page = out.addPage(A4);
        const s = Math.min((A4[0] - 60) / img.width, (A4[1] - 80) / img.height);
        page.drawImage(img, { x: (A4[0] - img.width * s) / 2, y: (A4[1] - img.height * s) / 2 + 8, width: img.width * s, height: img.height * s });
        isOriginal.push(true);
      }
    } catch { /* unreadable original: the divider already carries RinVita's reading */ }
  }

  // Page numbers across the whole file. Brief pages: inside the footer rule. Originals: a small
  // label on a white tab at the bottom edge so it never sits on top of the document's own text.
  const font = await out.embedFont(StandardFonts.Helvetica);
  const muted = rgb(0.37, 0.42, 0.45);
  const pages = out.getPages();
  pages.forEach((page, i) => {
    const label = `Page ${i + 1} of ${pages.length}`;
    const { width } = page.getSize();
    if (!isOriginal[i]) {
      const w = font.widthOfTextAtSize(label, 7.5);
      page.drawText(label, { x: width - 42 - w, y: 23.5, size: 7.5, font, color: muted });
    } else {
      const text = `RinVita · original document · ${label}`;
      const w = font.widthOfTextAtSize(text, 7);
      page.drawRectangle({ x: width - w - 22, y: 4, width: w + 14, height: 13, color: rgb(1, 1, 1), opacity: 0.9 });
      page.drawText(text, { x: width - w - 15, y: 8, size: 7, font, color: muted });
    }
  });
  return out.save({ useObjectStreams: true });
}
