// "Download a copy of my data": one ZIP with the patient's health data (JSON), every original document,
// and every scan file. Runs with the patient's own session, so it only ever reads their own records.
// Available on every plan, including free and at the end of a pilot.
import { zipSync, strToU8 } from "fflate";
import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "medical-documents";
const TABLES = [
  "documents", "blood_results", "medications", "allergies", "imaging_results", "imaging_studies",
  "visits", "alerts", "record_requests", "patient_insurance", "family_members",
] as const;
// Internal or secret fields that are not health data and should not travel in an export.
const OMIT: Record<string, string[]> = {
  profiles: ["stripe_customer_id", "stripe_subscription_id"],
  record_requests: ["token"],
};

export interface ExportProgress { stage: "data" | "originals" | "scans" | "zip"; done: number; total: number }
export interface ExportResult { blob: Blob; counts: { tables: Record<string, number>; originals: number; scanFiles: number; missing: string[] } }

const safe = (s: string) => s.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "file";
const strip = (table: string, rows: Record<string, unknown>[]) =>
  rows.map((r) => { const c = { ...r }; for (const k of OMIT[table] ?? []) delete c[k]; return c; });

async function listFolder(client: SupabaseClient, prefix: string): Promise<string[]> {
  const out: string[] = [];
  const stack = [prefix];
  while (stack.length) {
    const folder = stack.pop()!;
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await client.storage.from(BUCKET).list(folder, { limit: 1000, offset });
      if (error) throw error;
      for (const f of data ?? []) (f.id ? out : stack).push(`${folder}/${f.name}`);
      if (!data || data.length < 1000) break;
    }
  }
  return out;
}

async function download(client: SupabaseClient, path: string): Promise<Uint8Array | null> {
  const { data, error } = await client.storage.from(BUCKET).download(path);
  if (error || !data) return null;
  return new Uint8Array(await data.arrayBuffer());
}

export async function buildDataExport(client: SupabaseClient, userId: string, onProgress?: (p: ExportProgress) => void): Promise<ExportResult> {
  const files: Record<string, Uint8Array> = {};
  const data: Record<string, unknown> = { exported_at: new Date().toISOString(), format: "RinVita data export v1" };
  const counts: ExportResult["counts"] = { tables: {}, originals: 0, scanFiles: 0, missing: [] };

  const { data: profile, error: pErr } = await client.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (pErr) throw pErr;
  data.profile = profile ? strip("profiles", [profile])[0] : null;
  for (const [i, table] of TABLES.entries()) {
    onProgress?.({ stage: "data", done: i, total: TABLES.length });
    const col = table === "family_members" ? "owner_id" : "user_id";
    const { data: rows, error } = await client.from(table).select("*").eq(col, userId);
    if (error) throw error;
    data[table] = strip(table, rows ?? []);
    counts.tables[table] = rows?.length ?? 0;
  }
  files["health-data.json"] = strToU8(JSON.stringify(data, null, 2));

  // Original documents, exactly as uploaded.
  const docs = (data.documents as { id: string; name: string | null; file_path: string | null }[]).filter((d) => d.file_path);
  for (const [i, d] of docs.entries()) {
    onProgress?.({ stage: "originals", done: i, total: docs.length });
    const bytes = await download(client, d.file_path!);
    if (!bytes) { counts.missing.push(d.file_path!); continue; }
    const ext = d.file_path!.split(".").pop();
    const base = safe(d.name || d.id);
    const name = `${base}${ext && !base.endsWith(`.${ext}`) ? `.${ext}` : ""}`;
    files[files[`originals/${name}`] ? `originals/${d.id.slice(0, 8)}-${name}` : `originals/${name}`] = bytes;
    counts.originals++;
  }

  // Scans: every DICOM file of every study, in the hospital's original form.
  const studies = data.imaging_studies as { id: string; title: string | null; study_date: string | null }[];
  for (const s of studies) {
    const paths = await listFolder(client, `${userId}/dicom/${s.id}`);
    const folder = `scans/${safe(`${s.study_date ?? ""} ${s.title ?? s.id}`.trim())}`;
    for (const [i, p] of paths.entries()) {
      onProgress?.({ stage: "scans", done: i, total: paths.length });
      const bytes = await download(client, p);
      if (!bytes) { counts.missing.push(p); continue; }
      files[`${folder}/${p.slice(`${userId}/dicom/${s.id}/`.length)}`] = bytes;
      counts.scanFiles++;
    }
  }

  files["README.txt"] = strToU8([
    "Your RinVita data export",
    "",
    "health-data.json  Everything RinVita holds about your health: your profile, the details read from each document,",
    "                  results, medications, allergies, visits, scans and record requests.",
    "originals/        Every document you or a hospital uploaded, exactly as it was uploaded.",
    "scans/            Every scan, as the original DICOM files. Any DICOM viewer or hospital system can open them.",
    "",
    counts.missing.length ? `${counts.missing.length} file(s) could not be included. Please contact RinVita before closing your account.` : "All files were included.",
  ].join("\n"));

  onProgress?.({ stage: "zip", done: 0, total: 1 });
  const zipped = zipSync(files, { level: 0 });
  return { blob: new Blob([zipped], { type: "application/zip" }), counts };
}
