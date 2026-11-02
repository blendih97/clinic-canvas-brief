// Resumable uploads (TUS) straight into the patient's private folder, then
// server registration in batches. Interrupted uploads resume where they stopped.
import * as tus from "tus-js-client";
import { supabase } from "@/integrations/supabase/client";
import { registerBatch } from "./api";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

/** Supabase recommends the direct storage host for large resumable uploads. */
function tusEndpoint() {
  const m = SUPABASE_URL.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/);
  return m ? `https://${m[1]}.storage.supabase.co/storage/v1/upload/resumable` : `${SUPABASE_URL}/storage/v1/upload/resumable`;
}

export type UploadItem = { file: File; name: string };
export type UploadProgress = { uploadedBytes: number; totalBytes: number; done: number; total: number; failed: number; phase: "uploading" | "registering" | "finished" };
export type UploadOutcome = { registered: number; duplicates: number; rejected: { name: string; reason: string }[]; failed: { name: string; reason: string }[]; studyIds: string[] };

const CONCURRENCY = 4;
const REGISTER_BATCH = 40;

export async function uploadImaging(items: UploadItem[], opts: { imageLabel?: string; onProgress: (p: UploadProgress) => void; signal?: AbortSignal }): Promise<UploadOutcome> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) throw new Error("not_signed_in");
  const batchId = crypto.randomUUID();
  const totalBytes = items.reduce((s, i) => s + i.file.size, 0);
  const loaded = new Map<number, number>();
  const uploaded: { path: string; name: string }[] = [];
  const outcome: UploadOutcome = { registered: 0, duplicates: 0, rejected: [], failed: [], studyIds: [] };
  let next = 0; let done = 0;
  const pendingRegister: { path: string; name: string }[] = [];
  const studyIds = new Set<string>();

  const report = (phase: UploadProgress["phase"] = "uploading") => opts.onProgress({
    uploadedBytes: [...loaded.values()].reduce((s, n) => s + n, 0), totalBytes, done, total: items.length, failed: outcome.failed.length, phase,
  });

  const flush = async (force = false) => {
    while (pendingRegister.length >= REGISTER_BATCH || (force && pendingRegister.length)) {
      const batch = pendingRegister.splice(0, REGISTER_BATCH);
      let results: Awaited<ReturnType<typeof registerBatch>> | null = null;
      for (let attempt = 0; attempt < 3 && !results; attempt++) {
        try { results = await registerBatch(batchId, batch, opts.imageLabel); }
        catch { await new Promise(r => setTimeout(r, 1500 * (attempt + 1))); }
      }
      if (!results) { batch.forEach(b => outcome.failed.push({ name: b.name, reason: "could not be checked — try again" })); continue; }
      for (const r of results) {
        const name = batch.find(b => b.path === r.path)?.name ?? "file";
        if (r.status === "registered") { outcome.registered++; if (r.studyId) studyIds.add(r.studyId); }
        else if (r.status === "duplicate") outcome.duplicates++;
        else if (r.status === "rejected") outcome.rejected.push({ name, reason: friendlyReason(r.reason) });
        else outcome.failed.push({ name, reason: friendlyReason(r.reason) });
      }
    }
  };

  const uploadOne = (index: number) => new Promise<void>((resolve) => {
    const item = items[index];
    let objectName = `${userId}/${batchId}/${crypto.randomUUID()}`;
    let waits = 0;
    const upload = new tus.Upload(item.file, {
      endpoint: tusEndpoint(),
      retryDelays: [0, 1000, 3000, 5000, 10000, 20000],
      chunkSize: 6 * 1024 * 1024,              // required by Supabase
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: { bucketName: "imaging-originals", objectName, contentType: "application/octet-stream", cacheControl: "3600" },
      headers: { apikey: ANON_KEY, "x-upsert": "false" },
      onBeforeRequest: async (req) => {
        const { data: s } = await supabase.auth.getSession();   // refreshes long-running uploads
        req.setHeader("authorization", `Bearer ${s.session?.access_token ?? ""}`);
      },
      onProgress: (sent) => { loaded.set(index, sent); report(); },
      // tus normally refuses to retry while the browser reports "offline"; we retry
      // network/server errors ourselves and, for longer outages, wait for the
      // connection to return and resume from the last confirmed byte.
      onShouldRetry: (err) => {
        const status = (err as tus.DetailedError).originalResponse?.getStatus?.() ?? 0;
        return status === 0 || status >= 500 || status === 409 || status === 423 || status === 429;
      },
      onError: () => {
        if (!opts.signal?.aborted && waits < 3) {
          waits += 1;
          const resume = () => { if (!opts.signal?.aborted) upload.start(); };
          if (typeof navigator !== "undefined" && !navigator.onLine) window.addEventListener("online", () => setTimeout(resume, 500), { once: true });
          else setTimeout(resume, 3000);
          return;
        }
        outcome.failed.push({ name: item.name, reason: "upload interrupted — choose the file again to resume" }); done++; report(); resolve();
      },
      onSuccess: () => {
        loaded.set(index, item.file.size); done++;
        pendingRegister.push({ path: objectName, name: item.name });
        report(); resolve();
      },
    });
    opts.signal?.addEventListener("abort", () => { void upload.abort(); resolve(); }, { once: true });
    upload.findPreviousUploads().then(prev => {
      // Resume an interrupted upload of this same file, keeping its original object name.
      const resumable = prev.find(p => typeof p.metadata?.objectName === "string" && p.metadata.objectName.startsWith(`${userId}/`));
      if (resumable) { objectName = resumable.metadata.objectName; upload.options.metadata = { ...upload.options.metadata, objectName }; upload.resumeFromPreviousUpload(resumable); }
      upload.start();
    }).catch(() => upload.start());
  });

  const worker = async () => {
    while (next < items.length && !opts.signal?.aborted) {
      const i = next++;
      await uploadOne(i);
      await flush();
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker));
  report("registering");
  await flush(true);
  report("finished");
  outcome.studyIds = [...studyIds];
  return outcome;
}

function friendlyReason(r?: string) {
  switch (r) {
    case "malformed_dicom": return "damaged scan file";
    case "not_dicom_or_supported_image": return "not a recognised scan file";
    case "missing_identifiers": return "scan file is missing its study details";
    case "file_too_large": return "file larger than 500 MB";
    case "storage_quota_exceeded": return "your imaging storage is full";
    case "study_too_large": return "this study is over the size limit";
    case "upload_incomplete": return "upload did not finish — try again";
    default: return "could not be added";
  }
}
