// Saving, listing, opening and exporting DICOM studies in the patient's own storage.
import { supabase } from "@/integrations/supabase/client";
import { studyTitle } from "./ingest";
import type { DicomManifest, DicomSeries, PendingStudy } from "./types";

const BUCKET = "medical-documents";

export interface ImagingStudy {
  id: string;
  user_id: string;
  study_uid: string;
  title: string | null;
  description: string | null;
  modalities: string[];
  body_part: string | null;
  study_date: string | null;
  institution: string | null;
  accession: string | null;
  patient_name: string | null;
  series_count: number;
  instance_count: number;
  size_bytes: number;
  volumetric: boolean;
  manifest_path: string | null;
  key_image_path: string | null;
  document_id: string | null;
  source: "patient" | "request";
  status: "uploading" | "ready" | "failed";
  created_at: string;
}

// The generated database types don't know this table until they are regenerated.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const studiesTable = () => (supabase as any).from("imaging_studies");

export const studyFolder = (userId: string, studyId: string) => `${userId}/dicom/${studyId}`;
export const instancePath = (userId: string, studyId: string, sop: string) => `${studyFolder(userId, studyId)}/${sop.replace(/[^0-9.]/g, "_")}.dcm`;

export async function listStudies(userId: string): Promise<ImagingStudy[]> {
  const { data, error } = await studiesTable().select("*").eq("user_id", userId)
    .order("study_date", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as ImagingStudy[];
}

/** Every instance from both manifests, once, keeping each series' viewing order. */
export function mergeManifests(a: DicomManifest | null, b: DicomManifest): DicomManifest {
  if (!a) return b;
  const series = a.series.map((s) => ({ ...s, instances: [...s.instances] }));
  for (const s of b.series) {
    const existing = series.find((x) => x.uid === s.uid);
    if (!existing) { series.push(s); continue; }
    const have = new Set(existing.instances.map((i) => i.sop));
    const added = s.instances.filter((i) => !have.has(i.sop));
    if (!added.length) continue;
    existing.instances.push(...added);
    if (existing.instances.every((i) => i.pos !== undefined)) existing.instances.sort((x, y) => (y.pos! - x.pos!) || (x.num - y.num));
    else existing.instances.sort((x, y) => x.num - y.num);
    existing.volumetric = existing.volumetric && s.volumetric;
  }
  series.sort((x, y) => (x.number ?? 9999) - (y.number ?? 9999));
  return { ...a, ...Object.fromEntries(Object.entries(b).filter(([, v]) => v !== undefined && v !== "")), modalities: [...new Set([...a.modalities, ...b.modalities])], series };
}

export function summarise(m: DicomManifest) {
  const instances = m.series.reduce((n, s) => n + s.instances.length, 0);
  const size = m.series.reduce((n, s) => n + s.instances.reduce((k, i) => k + i.size, 0), 0);
  return {
    title: studyTitle(m),
    description: m.description || null,
    modalities: m.modalities,
    body_part: m.bodyPart || null,
    study_date: m.studyDate || null,
    institution: m.institution || null,
    accession: m.accession || null,
    patient_name: m.patientName || null,
    series_count: m.series.length,
    instance_count: instances,
    size_bytes: size,
    volumetric: m.series.some((s: DicomSeries) => s.volumetric),
  };
}

async function downloadManifest(path: string): Promise<DicomManifest | null> {
  const { data } = await supabase.storage.from(BUCKET).download(path);
  if (!data) return null;
  try { return JSON.parse(await data.text()) as DicomManifest; } catch { return null; }
}

async function pool<T>(items: T[], size: number, fn: (item: T, i: number) => Promise<void>) {
  let next = 0;
  const run = async () => { while (next < items.length) { const i = next++; await fn(items[i], i); } };
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, run));
}

/** Uploads a study into the patient's account, adding to it if it is already there. */
export async function saveStudy(userId: string, pending: PendingStudy, onProgress?: (done: number, total: number) => void): Promise<ImagingStudy> {
  const m = pending.manifest;
  const { data: existing } = await studiesTable().select("*").eq("user_id", userId).eq("study_uid", m.studyUid).maybeSingle();
  let study = existing as ImagingStudy | null;
  if (!study) {
    const { data, error } = await studiesTable().insert({ user_id: userId, study_uid: m.studyUid, source: "patient", status: "uploading", ...summarise(m) }).select("*").single();
    if (error) throw error;
    study = data as ImagingStudy;
  }
  const prior = study.manifest_path ? await downloadManifest(study.manifest_path) : null;
  const already = new Set(prior?.series.flatMap((s) => s.instances.map((i) => i.sop)) || []);

  const toUpload = [...pending.files.entries()].filter(([sop]) => !already.has(sop));
  let done = 0;
  onProgress?.(0, toUpload.length);
  await pool(toUpload, 6, async ([sop, blob]) => {
    const path = instancePath(userId, study!.id, sop);
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { upsert: true, contentType: "application/dicom" });
      if (!error) { lastError = null; break; }
      lastError = error;
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
    if (lastError) throw lastError;
    done++;
    onProgress?.(done, toUpload.length);
  });

  const withPaths: DicomManifest = {
    ...m,
    series: m.series.map((s) => ({ ...s, instances: s.instances.map((i) => ({ ...i, path: instancePath(userId, study!.id, i.sop) })) })),
  };
  const merged = mergeManifests(prior, withPaths);
  const manifestPath = `${studyFolder(userId, study.id)}/manifest.json`;
  const { error: mErr } = await supabase.storage.from(BUCKET).upload(manifestPath, new Blob([JSON.stringify(merged)], { type: "application/json" }), { upsert: true, contentType: "application/json" });
  if (mErr) throw mErr;
  const { data: updated, error: uErr } = await studiesTable()
    .update({ ...summarise(merged), manifest_path: manifestPath, status: "ready" })
    .eq("id", study.id).select("*").single();
  if (uErr) throw uErr;
  return updated as ImagingStudy;
}

/** The study's manifest with every instance path replaced by a signed URL. */
export async function openStudy(study: Pick<ImagingStudy, "manifest_path">, expiresIn = 3600): Promise<DicomManifest> {
  if (!study.manifest_path) throw new Error("This scan is still uploading.");
  const m = await downloadManifest(study.manifest_path);
  if (!m) throw new Error("This scan could not be opened.");
  const paths = m.series.flatMap((s) => s.instances.map((i) => i.path));
  const urls = new Map<string, string>();
  for (let i = 0; i < paths.length; i += 500) {
    const chunk = paths.slice(i, i + 500);
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(chunk, expiresIn);
    if (error) throw error;
    data?.forEach((d) => { if (d.path && d.signedUrl) urls.set(d.path, d.signedUrl); });
  }
  return { ...m, series: m.series.map((s) => ({ ...s, instances: s.instances.filter((i) => urls.has(i.path)).map((i) => ({ ...i, path: urls.get(i.path)! })) })).filter((s) => s.instances.length) };
}

export async function deleteStudy(study: ImagingStudy): Promise<void> {
  const folder = studyFolder(study.user_id, study.id);
  for (;;) {
    const { data } = await supabase.storage.from(BUCKET).list(folder, { limit: 1000 });
    if (!data?.length) break;
    const { error } = await supabase.storage.from(BUCKET).remove(data.map((f) => `${folder}/${f.name}`));
    if (error) throw error;
    if (data.length < 1000) break;
  }
  const { error } = await studiesTable().delete().eq("id", study.id);
  if (error) throw error;
}

export async function setStudyReport(studyId: string, documentId: string | null) {
  const { error } = await studiesTable().update({ document_id: documentId }).eq("id", studyId);
  if (error) throw error;
}

export async function saveKeyImage(study: ImagingStudy, png: Blob): Promise<string> {
  const path = `${studyFolder(study.user_id, study.id)}/key.png`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, png, { upsert: true, contentType: "image/png" });
  if (error) throw error;
  await studiesTable().update({ key_image_path: path }).eq("id", study.id);
  return path;
}

/** Downloads every image of the given (signed) manifests and packs them for a PACS. */
export async function exportStudiesZip(manifests: DicomManifest[], onProgress?: (done: number, total: number) => void): Promise<Blob> {
  const { buildExportZip } = await import("./exportZip");
  const total = manifests.reduce((n, m) => n + m.series.reduce((k, s) => k + s.instances.length, 0), 0);
  let done = 0;
  const studies = [];
  for (const m of manifests) {
    const series = [];
    for (const s of m.series) {
      const out: Uint8Array[] = new Array(s.instances.length);
      await pool(s.instances, 6, async (inst, i) => {
        const res = await fetch(inst.path);
        if (!res.ok) throw new Error("An image could not be downloaded. Please try again.");
        out[i] = new Uint8Array(await res.arrayBuffer());
        done++;
        onProgress?.(done, total);
      });
      series.push({ instances: out });
    }
    studies.push({ series });
  }
  const zip = await buildExportZip(studies);
  return new Blob([zip.slice()], { type: "application/zip" });
}

export function formatBytes(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB`;
  if (n >= 1e6) return `${Math.round(n / 1e6)} MB`;
  return `${Math.max(1, Math.round(n / 1e3))} KB`;
}
