import { supabase } from "@/integrations/supabase/client";

/** Feature flag: imaging vault stays off until the staged backend is released. */
export const IMAGING_ENABLED = import.meta.env.VITE_IMAGING_VAULT === "1";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
export const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

export type ImagingStudy = {
  id: string;
  kind: "dicom" | "image";
  label: string;
  label_auto: boolean;
  modalities: string[];
  body_part: string | null;
  description: string | null;
  study_date: string | null;
  institution: string | null;
  series_count: number;
  instance_count: number;
  image_count: number;
  total_bytes: number;
  status: "uploading" | "ready" | "partial" | "failed";
  report_document_id: string | null;
  created_at: string;
};

export type ViewerInstance = { id: string; frames: number; number: number | null; mime: string; viewable: boolean };
export type ViewerSeries = { id: string; description: string | null; modality: string | null; series_number: number | null; instances: ViewerInstance[] };
export type ViewerStudy = { id: string; label: string; study_date: string | null; modalities: string[]; kind: "dicom" | "image"; series: ViewerSeries[]; instance_count?: number; total_bytes?: number };

/** Who is asking for image bytes: the signed-in owner, or a Share Brief viewing session. */
export type ImagingAuth = { mode: "owner" } | { mode: "session"; secret: string };

export async function authHeaders(auth: ImagingAuth): Promise<Record<string, string>> {
  if (auth.mode === "session") {
    return { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, "x-rinvita-view-session": auth.secret };
  }
  const { data } = await supabase.auth.getSession();
  const jwt = data.session?.access_token;
  if (!jwt) throw new Error("not_signed_in");
  return { apikey: ANON_KEY, Authorization: `Bearer ${jwt}` };
}

export const streamUrl = (instanceId: string, purpose: "view" | "download" = "view") =>
  `${FUNCTIONS_URL}/imaging-stream?id=${instanceId}&purpose=${purpose}`;

export async function listStudies(): Promise<ImagingStudy[]> {
  const { data, error } = await (supabase as any)
    .from("imaging_studies")
    .select("id,kind,label,label_auto,modalities,body_part,description,study_date,institution,series_count,instance_count,image_count,total_bytes,status,report_document_id,created_at")
    .order("study_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Owner manifest for the viewer (RLS limits rows to the signed-in patient). */
export async function loadOwnStudy(study: ImagingStudy): Promise<ViewerStudy> {
  const db = supabase as any;
  const [{ data: series }, { data: inst }] = await Promise.all([
    db.from("imaging_series").select("id,description,modality,series_number,created_at").eq("study_id", study.id),
    db.from("imaging_instances").select("id,series_id,number_of_frames,instance_number,mime,viewable,created_at").eq("study_id", study.id),
  ]);
  const bySeries = new Map<string, ViewerInstance[]>();
  for (const i of inst ?? []) {
    const list = bySeries.get(i.series_id) ?? [];
    list.push({ id: i.id, frames: i.number_of_frames, number: i.instance_number, mime: i.mime, viewable: i.viewable });
    bySeries.set(i.series_id, list);
  }
  const sorted = [...(series ?? [])].sort((a, b) => (a.series_number ?? 1e9) - (b.series_number ?? 1e9) || a.created_at.localeCompare(b.created_at));
  return {
    id: study.id, label: study.label, study_date: study.study_date, modalities: study.modalities, kind: study.kind,
    instance_count: study.image_count, total_bytes: study.total_bytes,
    series: sorted.map(s => ({
      id: s.id, description: s.description, modality: s.modality, series_number: s.series_number,
      instances: (bySeries.get(s.id) ?? []).sort((a, b) => (a.number ?? 1e9) - (b.number ?? 1e9)),
    })),
  };
}

export async function registerBatch(batchId: string, files: { path: string; name?: string }[], imageLabel?: string) {
  const headers = await authHeaders({ mode: "owner" });
  const res = await fetch(`${FUNCTIONS_URL}/imaging-register`, {
    method: "POST", headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ batchId, files, imageLabel }),
  });
  if (!res.ok) throw new Error(`register_failed_${res.status}`);
  return (await res.json()).results as { path: string; status: string; reason?: string; studyId?: string }[];
}

export async function deleteStudy(studyId: string) {
  const headers = await authHeaders({ mode: "owner" });
  const res = await fetch(`${FUNCTIONS_URL}/imaging-delete`, {
    method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ studyId }),
  });
  if (!res.ok) throw new Error("delete_failed");
}

export async function startRecipientSession(token: string, recipientSecret: string) {
  const res = await fetch(`${FUNCTIONS_URL}/imaging-session`, {
    method: "POST",
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ token, recipientSecret }),
  });
  if (!res.ok) return null;
  const j = await res.json();
  return (j.imaging ?? null) as null | { studies: ViewerStudy[]; allow_download: boolean; expires_at: string; sessionSecret: string | null };
}

export const formatBytes = (n: number) =>
  n >= 1e9 ? `${(n / 1e9).toFixed(1)} GB` : n >= 1e6 ? `${(n / 1e6).toFixed(0)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`;

export const formatStudyDate = (d: string | null) =>
  d ? new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Date unknown";
