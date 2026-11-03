import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { buildCombinedPdf } from "@/lib/combinedPdf";

const toAB = (b: Buffer) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
// 1x1 PNG
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

describe("combined PDF", () => {
  it("puts a summary, every original and a fallback for missing files into one PDF", async () => {
    const src = await PDFDocument.create(); src.addPage(); src.addPage();
    const srcBytes = await src.save();
    const res = await buildCombinedPdf({
      title: "Medical records — Test Patient", subtitle: "Shared via RinVita",
      allergies: ["Penicillin — urticaria"], medications: ["Metformin · 500 mg"],
      labs: [{ marker: "HbA1c", value: "6.8 %", range: "4.0 – 5.9, typical UK adult range", status: "flagged" }],
      docs: [
        { name: "Referral letter", summary: ["Second opinion requested"], getFile: async () => ({ bytes: srcBytes.buffer.slice(0) as ArrayBuffer, kind: "pdf" }) },
        { name: "Scan photo", summary: [], getFile: async () => ({ bytes: toAB(PNG), kind: "image", mime: "image/png" }) },
        { name: "تقرير طبي (Arabic name)", summary: ["Résumé — ünïcode ok"], text: "Translated text only", getFile: async () => null },
      ],
    });
    const out = await PDFDocument.load(res.bytes);
    // cover + (divider + 2 pages) + (divider + image) + divider-with-text
    expect(out.getPageCount()).toBe(1 + 3 + 2 + 1);
    expect(res.included).toBe(2);
    expect(res.missing).toEqual(["تقرير طبي (Arabic name)"]);
  });
});
