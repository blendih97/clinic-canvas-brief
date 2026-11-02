// Client-side scan of what the patient picked: expands ZIPs safely, recognises
// DICOM (with or without extension), images and PDFs, and groups DICOM into
// studies/series for a friendly preview. The server re-checks everything.
import dicomParser from "dicom-parser";
import { Unzip, UnzipInflate } from "fflate";

export const LIMITS = {
  maxFiles: 10000,
  maxFileBytes: 500 * 1024 * 1024,
  maxZipBytes: 2 * 1024 * 1024 * 1024,
  maxUnzippedBytes: 4 * 1024 * 1024 * 1024,
  maxCompressionRatio: 200,
  maxZipEntries: 10000,
  maxSelectionBytes: 5 * 1024 * 1024 * 1024,
};

export type Picked = { file: File; name: string };
export type ScannedDicom = {
  kind: "dicom"; file: File; name: string; studyUid: string; seriesUid: string; sopUid: string;
  modality: string; studyDate: string | null; studyDesc: string; seriesDesc: string; bodyPart: string;
  frames: number; seriesNumber: number | null;
};
export type ScannedOther = { kind: "image" | "pdf"; file: File; name: string };
export type Skipped = { name: string; reason: string };
export type ScanResult = { dicom: ScannedDicom[]; images: ScannedOther[]; pdfs: ScannedOther[]; skipped: Skipped[] };

const SYSTEM_FILE = /(^|\/)(DICOMDIR|__MACOSX\/|\.DS_Store|Thumbs\.db|desktop\.ini|autorun\.inf|.*\.(exe|dll|ini|inf|txt|htm|html|xml|js|css|ico|jar|cab|msi|sys|bat|cmd))$/i;

/** Keep only a safe display name; never used as a storage path. */
export const safeDisplayName = (n: string) => n.split(/[\\/]/).pop()!.replace(/[^\w.\- ()]/g, "_").slice(0, 120) || "file";

async function head(file: File, n: number) {
  return new Uint8Array(await file.slice(0, n).arrayBuffer());
}

export async function sniff(file: File): Promise<"dicom" | "jpeg" | "png" | "pdf" | "zip" | "unknown"> {
  const h = await head(file, 132);
  if (h.length >= 132 && h[128] === 0x44 && h[129] === 0x49 && h[130] === 0x43 && h[131] === 0x4d) return "dicom";
  if (h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff) return "jpeg";
  if (h[0] === 0x89 && h[1] === 0x50 && h[2] === 0x4e && h[3] === 0x47) return "png";
  if (h[0] === 0x25 && h[1] === 0x50 && h[2] === 0x44 && h[3] === 0x46) return "pdf";
  if (h[0] === 0x50 && h[1] === 0x4b && (h[2] === 0x03 || h[2] === 0x05)) return "zip";
  return "unknown";
}

/** Streams a ZIP, enforcing entry, size and compression-ratio limits as bytes arrive (ZIP-bomb safe). */
export async function expandZip(zip: File, onProgress?: (msg: string) => void): Promise<{ files: Picked[]; skipped: Skipped[] }> {
  if (zip.size > LIMITS.maxZipBytes) return { files: [], skipped: [{ name: zip.name, reason: "ZIP is larger than 2 GB — please upload the folder instead" }] };
  const files: Picked[] = []; const skipped: Skipped[] = [];
  let total = 0; let entries = 0; let aborted: string | null = null;
  const unz = new Unzip();
  unz.register(UnzipInflate);
  const done = new Promise<void>((resolve) => {
    unz.onfile = (entry) => {
      if (aborted) return;
      entries += 1;
      const name = entry.name;
      if (entries > LIMITS.maxZipEntries) { aborted = "too many files in ZIP"; return; }
      if (name.endsWith("/") || SYSTEM_FILE.test(name)) return;
      if (name.split("/").some(p => p === "..") || name.startsWith("/") || /^[a-z]:/i.test(name)) { skipped.push({ name: safeDisplayName(name), reason: "unsafe path in ZIP" }); return; }
      if (/\.zip$/i.test(name)) { skipped.push({ name: safeDisplayName(name), reason: "ZIP inside a ZIP is not supported" }); return; }
      const chunks: Uint8Array[] = []; let size = 0;
      entry.ondata = (err, chunk, final) => {
        if (aborted) return;
        if (err) { skipped.push({ name: safeDisplayName(name), reason: "damaged ZIP entry" }); return; }
        size += chunk.length; total += chunk.length;
        if (size > LIMITS.maxFileBytes) { aborted = `a file inside the ZIP is larger than 500 MB`; return; }
        if (total > LIMITS.maxUnzippedBytes || total > zip.size * LIMITS.maxCompressionRatio + 50e6) { aborted = "ZIP expands to an unsafe size"; return; }
        chunks.push(chunk);
        if (final) files.push({ file: new File(chunks as BlobPart[], safeDisplayName(name)), name });
      };
      entry.start();
    };
  });
  const reader = zip.stream().getReader();
  let read = 0;
  for (;;) {
    const { done: d, value } = await reader.read();
    if (d) { unz.push(new Uint8Array(0), true); break; }
    read += value.length;
    onProgress?.(`Opening ZIP… ${Math.round((read / zip.size) * 100)}%`);
    unz.push(value);
    if (aborted) { await reader.cancel(); break; }
  }
  void done;
  if (aborted) return { files: [], skipped: [{ name: zip.name, reason: aborted }] };
  return { files, skipped };
}

function parseDicomHeader(bytes: Uint8Array) {
  const ds = dicomParser.parseDicom(bytes, { untilTag: "x7fe00010" } as any);
  const s = (t: string) => (ds.string(t) ?? "").replace(/\0/g, "").trim();
  const d = s("x00080020");
  return {
    studyUid: s("x0020000d"), seriesUid: s("x0020000e"), sopUid: s("x00080018"),
    modality: s("x00080060").toUpperCase(), studyDesc: s("x00081030"), seriesDesc: s("x0008103e"),
    bodyPart: s("x00180015"), frames: Math.max(1, parseInt(s("x00280008") || "1", 10) || 1),
    seriesNumber: Number.isFinite(parseInt(s("x00200011"), 10)) ? parseInt(s("x00200011"), 10) : null,
    studyDate: /^\d{8}$/.test(d) ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : null,
  };
}

export async function scanSelection(picked: Picked[], onProgress?: (msg: string) => void): Promise<ScanResult> {
  const out: ScanResult = { dicom: [], images: [], pdfs: [], skipped: [] };
  const queue: Picked[] = [];
  let totalBytes = 0;
  for (const p of picked) {
    if (SYSTEM_FILE.test(p.name)) continue;
    const kind = await sniff(p.file);
    if (kind === "zip") {
      const { files, skipped } = await expandZip(p.file, onProgress);
      queue.push(...files); out.skipped.push(...skipped);
    } else queue.push(p);
  }
  if (queue.length > LIMITS.maxFiles) {
    out.skipped.push({ name: `${queue.length} files`, reason: "more than 10,000 files in one go — please upload one study at a time" });
    return out;
  }
  const seenSop = new Set<string>();
  let i = 0;
  for (const p of queue) {
    i += 1;
    if (i % 25 === 0) onProgress?.(`Checking files… ${i} of ${queue.length}`);
    const name = safeDisplayName(p.name);
    if (p.file.size === 0) continue;
    if (p.file.size > LIMITS.maxFileBytes) { out.skipped.push({ name, reason: "file larger than 500 MB" }); continue; }
    totalBytes += p.file.size;
    if (totalBytes > LIMITS.maxSelectionBytes) { out.skipped.push({ name, reason: "selection larger than 5 GB — upload in parts" }); continue; }
    const kind = await sniff(p.file);
    if (kind === "jpeg" || kind === "png") { out.images.push({ kind: "image", file: p.file, name }); continue; }
    if (kind === "pdf") { out.pdfs.push({ kind: "pdf", file: p.file, name }); continue; }
    if (kind !== "dicom") { out.skipped.push({ name, reason: "not a recognised scan file" }); continue; }
    try {
      // Read up to 2 MB for the header; enough for virtually all files.
      const h = parseDicomHeader(await head(p.file, Math.min(p.file.size, 2 * 1024 * 1024)));
      if (!h.studyUid || !h.seriesUid || !h.sopUid) { out.skipped.push({ name, reason: "scan file is missing its study details" }); continue; }
      if (seenSop.has(h.sopUid)) continue;           // duplicate copy on the same CD
      seenSop.add(h.sopUid);
      out.dicom.push({ kind: "dicom", file: p.file, name, ...h });
    } catch {
      out.skipped.push({ name, reason: "damaged or unreadable scan file" });
    }
  }
  return out;
}

const MODALITY: Record<string, string> = { MR: "MRI", CT: "CT", CR: "X-ray", DX: "X-ray", DR: "X-ray", US: "Ultrasound", MG: "Mammogram", NM: "Nuclear medicine", PT: "PET", XA: "Angiography", RF: "Fluoroscopy" };
const REGION: [RegExp, string][] = [[/BRAIN|HEAD|SKULL/, "Brain"], [/CHEST|THORAX|LUNG/, "Chest"], [/ABD|LIVER|KIDNEY/, "Abdomen"], [/PELVIS/, "Pelvis"], [/LUMBAR|L-?SPINE/, "Lumbar spine"], [/CERVICAL|C-?SPINE/, "Cervical spine"], [/SPINE/, "Spine"], [/KNEE/, "Knee"], [/SHOULDER/, "Shoulder"], [/HIP/, "Hip"], [/BREAST|MAMMO/, "Breast"], [/HEART|CARDIAC/, "Heart"]];

export type StudyPreview = { studyUid: string; label: string; date: string | null; series: number; images: number; bytes: number; files: ScannedDicom[] };

export function groupStudies(dicom: ScannedDicom[]): StudyPreview[] {
  const map = new Map<string, ScannedDicom[]>();
  for (const d of dicom) map.set(d.studyUid, [...(map.get(d.studyUid) ?? []), d]);
  return [...map.entries()].map(([studyUid, files]) => {
    const f = files[0];
    const mod = MODALITY[files.map(x => x.modality).find(m => MODALITY[m]) ?? ""] ?? "Scan";
    const region = REGION.find(([re]) => re.test(`${f.bodyPart} ${f.studyDesc}`.toUpperCase()))?.[1];
    return {
      studyUid, label: region ? `${mod} ${region}` : mod, date: f.studyDate,
      series: new Set(files.map(x => x.seriesUid)).size,
      images: files.reduce((s, x) => s + x.frames, 0),
      bytes: files.reduce((s, x) => s + x.file.size, 0), files,
    };
  }).sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}
