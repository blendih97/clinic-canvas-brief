// Reads DICOM files (loose files, folders, hospital CDs, ZIPs) on the device and groups
// them into studies and series. Only headers are parsed; pixel data is untouched.
import dicomParser from "dicom-parser";
import { unzip } from "fflate";
import {
  DICOMDIR_SOP_CLASS, MAX_FILE_BYTES, VOLUME_MODALITIES,
  type DicomInstance, type DicomManifest, type DicomSeries, type IngestResult, type PendingStudy,
} from "./types";

export interface InputFile { name: string; blob: Blob }

const str = (ds: dicomParser.DataSet, tag: string) => (ds.string(tag) || "").trim() || undefined;
const num = (ds: dicomParser.DataSet, tag: string) => {
  const v = ds.string(tag);
  if (v === undefined || v === "") return undefined;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : undefined;
};
const nums = (ds: dicomParser.DataSet, tag: string) => {
  const v = ds.string(tag);
  if (!v) return undefined;
  const a = v.split("\\").map((x) => parseFloat(x));
  return a.every(Number.isFinite) ? a : undefined;
};

/** YYYYMMDD -> YYYY-MM-DD */
export function dicomDate(v?: string): string | undefined {
  if (!v || !/^\d{8}/.test(v)) return undefined;
  return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
}

/** "DOE^JANE^^^" -> "Jane Doe" */
export function personName(v?: string): string | undefined {
  if (!v) return undefined;
  const [family = "", given = ""] = v.split("^");
  const cap = (s: string) => s.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return [cap(given), cap(family)].filter(Boolean).join(" ") || undefined;
}

export function looksLikeDicom(bytes: Uint8Array): boolean {
  return bytes.length > 132 && bytes[128] === 0x44 && bytes[129] === 0x49 && bytes[130] === 0x43 && bytes[131] === 0x4d;
}

const isZip = (bytes: Uint8Array) => bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;

function unzipAsync(bytes: Uint8Array): Promise<Record<string, Uint8Array>> {
  return new Promise((resolve, reject) => unzip(bytes, (err, out) => (err ? reject(err) : resolve(out))));
}

// Files commonly found on hospital CDs that are never images.
const OBVIOUSLY_NOT_DICOM = /\.(exe|dll|inf|ini|htm|html|css|js|txt|pdf|xml|jpg|jpeg|png|gif|bmp|ico|json|cfg|bat|sys|ocx|chm|cab|msi|lnk|db|log)$/i;

interface Parsed {
  studyUid: string; seriesUid: string; sop: string; modality: string;
  manifestFields: Partial<DicomManifest>;
  series: Omit<DicomSeries, "instances" | "volumetric">;
  instance: Omit<DicomInstance, "path">;
  orientation?: number[]; position?: number[];
  blob: Blob;
}

function parseOne(_name: string, bytes: Uint8Array, blob: Blob): Parsed | { skip: string } {
  if (bytes.length > MAX_FILE_BYTES) return { skip: "larger than 50 MB" };
  let ds: dicomParser.DataSet;
  try {
    ds = dicomParser.parseDicom(bytes, { untilTag: "x7fe00010" });
  } catch {
    return { skip: "not a DICOM file" };
  }
  const sopClass = str(ds, "x00020002") || str(ds, "x00080016");
  if (sopClass === DICOMDIR_SOP_CLASS) return { skip: "DICOMDIR index" };
  const studyUid = str(ds, "x0020000d"), seriesUid = str(ds, "x0020000e"), sop = str(ds, "x00080018") || str(ds, "x00020003");
  if (!studyUid || !seriesUid || !sop) return { skip: "not a DICOM image" };
  const modality = (str(ds, "x00080060") || "OT").toUpperCase();
  const ipp = nums(ds, "x00200032"), iop = nums(ds, "x00200037");
  return {
    studyUid, seriesUid, sop, modality, blob,
    manifestFields: {
      studyUid,
      patientName: personName(str(ds, "x00100010")),
      patientId: str(ds, "x00100020"),
      patientBirthDate: dicomDate(str(ds, "x00100030")),
      studyDate: dicomDate(str(ds, "x00080020")),
      description: str(ds, "x00081030"),
      institution: str(ds, "x00080080"),
      accession: str(ds, "x00080050"),
      bodyPart: str(ds, "x00180015"),
    },
    series: {
      uid: seriesUid,
      number: num(ds, "x00200011") ?? null,
      modality,
      description: str(ds, "x0008103e") || "",
      bodyPart: str(ds, "x00180015"),
      rows: ds.uint16("x00280010"),
      columns: ds.uint16("x00280011"),
      sliceThickness: num(ds, "x00180050"),
    },
    instance: { sop, num: num(ds, "x00200013") ?? 0, frames: Math.max(1, num(ds, "x00280008") ?? 1), size: bytes.length },
    orientation: iop, position: ipp,
  };
}

function normal(iop: number[]): number[] {
  const [a, b, c, d, e, f] = iop;
  return [b * f - c * e, c * d - a * f, a * e - b * d];
}

function finishSeries(base: Omit<DicomSeries, "instances" | "volumetric">, items: Parsed[]): DicomSeries {
  const iop = items[0].orientation;
  const sameGeometry = !!iop && items.every((p) =>
    p.orientation && p.position && p.orientation.every((v, i) => Math.abs(v - iop[i]) < 1e-3)
    && p.instance.frames === 1);
  const n = iop ? normal(iop) : null;
  const instances: DicomInstance[] = items.map((p) => ({
    ...p.instance,
    path: "",
    ...(sameGeometry && n && p.position ? { pos: p.position[0] * n[0] + p.position[1] * n[1] + p.position[2] * n[2] } : {}),
  }));
  // Highest position first (for axial stacks: head end first, as most viewers show them).
  if (sameGeometry) instances.sort((a, b) => (b.pos! - a.pos!) || (a.num - b.num));
  else instances.sort((a, b) => a.num - b.num);
  const distinct = sameGeometry && new Set(instances.map((i) => i.pos!.toFixed(2))).size === instances.length;
  const sameSize = items.every((p) => p.series.rows === base.rows && p.series.columns === base.columns);
  return {
    ...base,
    volumetric: VOLUME_MODALITIES.has(base.modality) && sameGeometry && distinct && sameSize && instances.length >= 10,
    instances,
  };
}

/**
 * Reads the given files (and any ZIPs among them) into studies. `onProgress` gets
 * the number of files read so far.
 */
export async function ingestDicom(inputs: InputFile[], onProgress?: (done: number, total: number) => void): Promise<IngestResult> {
  const skipped: IngestResult["skipped"] = [];
  const queue: InputFile[] = [];
  for (const f of inputs) {
    if (/\.zip$/i.test(f.name) || f.blob.type === "application/zip") {
      const bytes = new Uint8Array(await f.blob.arrayBuffer());
      if (!isZip(bytes)) { skipped.push({ name: f.name, reason: "not a ZIP file" }); continue; }
      try {
        const entries = await unzipAsync(bytes);
        for (const [entry, data] of Object.entries(entries)) {
          if (entry.endsWith("/") || data.length === 0) continue;
          queue.push({ name: `${f.name}/${entry}`, blob: new Blob([new Uint8Array(data).buffer]) });
        }
      } catch {
        skipped.push({ name: f.name, reason: "the ZIP could not be opened" });
      }
    } else queue.push(f);
  }

  const parsed: Parsed[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < queue.length; i++) {
    const f = queue[i];
    onProgress?.(i, queue.length);
    const base = f.name.split("/").pop() || f.name;
    if (OBVIOUSLY_NOT_DICOM.test(base) || /^(dicomdir|autorun\.inf|readme.*)$/i.test(base)) {
      if (!/^dicomdir$/i.test(base)) skipped.push({ name: f.name, reason: "not a DICOM file" });
      continue;
    }
    const bytes = new Uint8Array(await f.blob.arrayBuffer());
    const p = parseOne(f.name, bytes, f.blob);
    if ("skip" in p) {
      if (p.skip !== "DICOMDIR index") skipped.push({ name: f.name, reason: p.skip });
      continue;
    }
    if (seen.has(p.sop)) continue; // the same image twice
    seen.add(p.sop);
    parsed.push(p);
  }
  onProgress?.(queue.length, queue.length);

  const byStudy = new Map<string, Parsed[]>();
  for (const p of parsed) byStudy.set(p.studyUid, [...(byStudy.get(p.studyUid) || []), p]);

  const studies: PendingStudy[] = [];
  for (const [studyUid, items] of byStudy) {
    const fields: Partial<DicomManifest> = {};
    for (const p of items) for (const [k, v] of Object.entries(p.manifestFields)) if (v && !(fields as any)[k]) (fields as any)[k] = v;
    const bySeries = new Map<string, Parsed[]>();
    for (const p of items) bySeries.set(p.seriesUid, [...(bySeries.get(p.seriesUid) || []), p]);
    const series = [...bySeries.values()]
      .map((s) => finishSeries(s[0].series, s))
      .sort((a, b) => (a.number ?? 9999) - (b.number ?? 9999));
    const files = new Map<string, Blob>();
    let size = 0;
    for (const p of items) { files.set(p.sop, p.blob); size += p.instance.size; }
    const manifest: DicomManifest = {
      version: 1,
      ...fields,
      studyUid,
      bodyPart: fields.bodyPart || series.find((s) => s.bodyPart)?.bodyPart,
      modalities: [...new Set(series.map((s) => s.modality))],
      series,
    };
    studies.push({ manifest, files, sizeBytes: size, instanceCount: items.length });
  }
  studies.sort((a, b) => (b.manifest.studyDate || "").localeCompare(a.manifest.studyDate || ""));
  return { studies, skipped };
}

/** "CT Chest with contrast" from the study's own description, falling back to modality and body part. */
export function studyTitle(m: Pick<DicomManifest, "description" | "modalities" | "bodyPart">): string {
  const MOD: Record<string, string> = { CT: "CT", MR: "MRI", CR: "X-ray", DX: "X-ray", US: "Ultrasound", MG: "Mammogram", PT: "PET", NM: "Nuclear medicine", XA: "Angiogram", RF: "Fluoroscopy", OT: "Scan" };
  if (m.description) {
    const d = m.description.trim();
    return d === d.toUpperCase() ? d.toLowerCase().replace(/^\w/, (c) => c.toUpperCase()).replace(/\b(ct|mri|mr|pet|xr|pa|ap|t1|t2|flair|dwi|us)\b/gi, (x) => x.toUpperCase()) : d;
  }
  const mod = m.modalities.map((x) => MOD[x] || x).filter((v, i, a) => a.indexOf(v) === i).join(" + ") || "Scan";
  return m.bodyPart ? `${mod} ${m.bodyPart.toLowerCase()}` : mod;
}
