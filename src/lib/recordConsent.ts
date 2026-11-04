// Patient's signed consent for a provider to release records to them via RinVita.
// The same statement is shown when signing, stored with the request, shown on the
// provider's upload page and in the request email, and printed on the consent PDF.
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

export interface ConsentDetails {
  patientName: string;
  patientEmail: string;
  patientDob?: string | null;
  providerName: string;
  requestDescription: string;
}

export function consentStatement(c: ConsentDetails): string {
  const who = `${c.patientName}${c.patientDob ? ` (date of birth ${formatDob(c.patientDob)})` : ""}`;
  return `I, ${who}, authorise ${c.providerName} to release copies of my medical records described in this request to me, ` +
    `by uploading them to my personal health record on RinVita (rinvita.co.uk), which I control. ` +
    `My contact email is ${c.patientEmail}. This consent covers only the records described and expires after 30 days. ` +
    `I can withdraw it at any time before the records are uploaded by contacting ${c.providerName}.`;
}

export function formatDob(iso: string): string {
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00` : iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function formatSignedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC`;
}

/** True when the typed signature matches the patient's name (case and spacing ignored). */
export function signatureMatches(typed: string, name: string): boolean {
  const n = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  return !!n(typed) && n(typed) === n(name);
}

export interface SignedConsent extends ConsentDetails {
  statement: string;
  signedName: string;
  signedAt: string;
  requestId: string;
}

function wrap(font: PDFFont, text: string, size: number, width: number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const w of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(next, size) <= width) line = next;
      else { if (line) out.push(line); line = w; }
    }
    out.push(line);
  }
  return out;
}

const latin = (font: PDFFont, s: string) => [...s].map((ch) => { try { font.encodeText(ch); return ch; } catch { return "?"; } }).join("");

/** A one-page signed consent form the provider can file. */
export async function buildConsentPdf(c: SignedConsent): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Consent to release medical records - ${c.patientName}`); pdf.setProducer("RinVita"); pdf.setCreator("RinVita");
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const sig = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const gold = rgb(0.72, 0.58, 0.16), ink = rgb(0.12, 0.16, 0.2), muted = rgb(0.37, 0.42, 0.45), line = rgb(0.89, 0.88, 0.84);
  const M = 56, W = 595.28 - 2 * M;
  let y = 841.89 - 60;

  page.drawText("RinVita", { x: M, y, size: 18, font: serif, color: gold });
  page.drawText("Consent to release medical records", { x: M, y: y - 34, size: 17, font: bold, color: ink });
  y -= 52;
  page.drawLine({ start: { x: M, y }, end: { x: M + W, y }, thickness: 0.6, color: line });
  y -= 22;

  const row = (k: string, v: string) => {
    page.drawText(k, { x: M, y, size: 9, font: bold, color: muted });
    const lines = wrap(font, latin(font, v), 10, W - 130);
    lines.forEach((l, i) => page.drawText(l, { x: M + 130, y: y - i * 14, size: 10, font, color: ink }));
    y -= Math.max(1, lines.length) * 14 + 6;
  };
  row("Patient", c.patientName);
  if (c.patientDob) row("Date of birth", formatDob(c.patientDob));
  row("Patient email", c.patientEmail);
  row("Released by", c.providerName);
  row("Records requested", c.requestDescription);
  row("Request reference", c.requestId);
  y -= 8;

  page.drawText("Statement", { x: M, y, size: 11, font: bold, color: ink }); y -= 18;
  for (const l of wrap(font, latin(font, c.statement), 10.5, W)) { page.drawText(l, { x: M, y, size: 10.5, font, color: ink }); y -= 15.5; }
  y -= 24;

  page.drawText(latin(sig, c.signedName), { x: M, y, size: 22, font: sig, color: ink });
  y -= 8;
  page.drawLine({ start: { x: M, y }, end: { x: M + 260, y }, thickness: 0.8, color: ink });
  y -= 14;
  page.drawText(`Signed electronically by ${latin(font, c.signedName)}`, { x: M, y, size: 9, font, color: muted }); y -= 13;
  page.drawText(`Date and time: ${formatSignedAt(c.signedAt)}`, { x: M, y, size: 9, font, color: muted }); y -= 13;
  page.drawText("Signed while signed in to the patient's own RinVita account.", { x: M, y, size: 9, font, color: muted });

  page.drawText("RinVita · rinvita.co.uk · info@rinvita.co.uk", { x: M, y: 40, size: 8, font, color: muted });
  return pdf.save();
}
