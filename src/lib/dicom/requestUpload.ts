// Hospital side of a records request: sends whole DICOM studies into the patient's account
// through the token-gated request-imaging function (no login needed).
import { supabase } from "@/integrations/supabase/client";
import { studyTitle } from "./ingest";
import type { DicomManifest, PendingStudy } from "./types";

const BUCKET = "medical-documents";

/** Files that may be scan images: .dcm, ZIPs, and the extension-less files found on hospital CDs. */
export function isDicomCandidate(f: { name: string; type?: string }): boolean {
  const base = f.name.split("/").pop() || f.name;
  return /\.(dcm|dicom|zip)$/i.test(base) || f.type === "application/dicom" || !base.includes(".");
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("request-imaging", { body });
  if (error || !data || (data as { error?: string }).error) {
    throw new Error((data as { error?: string })?.error || error?.message || "Upload failed");
  }
  return data as T;
}

/** Uploads each study. Returns how many studies were sent. */
export async function uploadStudiesForRequest(
  token: string,
  studies: PendingStudy[],
  onProgress?: (done: number, total: number) => void,
): Promise<number> {
  const total = studies.reduce((n, s) => n + s.instanceCount, 0);
  let done = 0;
  let sent = 0;
  for (const s of studies) {
    const m = s.manifest;
    const { studyId, alreadyHave } = await call<{ studyId: string; alreadyHave?: boolean }>({
      token, action: "begin",
      study: {
        studyUid: m.studyUid, title: studyTitle(m), description: m.description, bodyPart: m.bodyPart, studyDate: m.studyDate,
        institution: m.institution, accession: m.accession, patientName: m.patientName, modalities: m.modalities,
      },
    });
    if (alreadyHave) { done += s.instanceCount; onProgress?.(done, total); sent++; continue; }

    const sops = [...s.files.keys()];
    const paths = new Map<string, string>();
    for (let i = 0; i < sops.length; i += 100) {
      const { uploads } = await call<{ uploads: { sop: string; path: string; token: string }[] }>({ token, action: "sign", studyId, sops: sops.slice(i, i + 100) });
      let next = 0;
      const worker = async () => {
        while (next < uploads.length) {
          const u = uploads[next++];
          let lastErr: unknown = null;
          for (let attempt = 0; attempt < 3; attempt++) {
            const { error } = await supabase.storage.from(BUCKET).uploadToSignedUrl(u.path, u.token, s.files.get(u.sop)!, { contentType: "application/dicom", upsert: true });
            if (!error) { lastErr = null; break; }
            lastErr = error;
            await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
          }
          if (lastErr) throw lastErr;
          paths.set(u.sop, u.path);
          done++;
          onProgress?.(done, total);
        }
      };
      await Promise.all(Array.from({ length: Math.min(6, uploads.length) }, worker));
    }

    const manifest: DicomManifest = {
      ...m,
      series: m.series.map((se) => ({ ...se, instances: se.instances.filter((i) => paths.has(i.sop)).map((i) => ({ ...i, path: paths.get(i.sop)! })) })).filter((se) => se.instances.length),
    };
    await call({ token, action: "finish", studyId, manifest });
    sent++;
  }
  return sent;
}

export async function completeRequest(token: string, studies: number) {
  await call({ token, action: "complete", studies });
}
