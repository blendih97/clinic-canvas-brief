// Scans on the doctor's share link: open each in the viewer (2D, MPR, 3D) or download the
// original DICOM for the clinic's PACS. Image URLs are short-lived and issued per scan.
import { Suspense, lazy, useState } from "react";
import { Box, Download, Eye, Loader2, ScanLine, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { exportStudiesZip } from "@/lib/dicom/storage";
import type { DicomManifest } from "@/lib/dicom/types";

const DicomViewer = lazy(() => import("@/components/dicom/DicomViewer"));

export interface SharedStudy {
  id: string;
  title: string | null;
  date: string | null;
  institution: string | null;
  modalities: string[];
  seriesCount: number;
  instanceCount: number;
  volumetric: boolean;
  reportName: string | null;
  keyImageUrl: string | null;
}

const MOD: Record<string, string> = { CT: "CT", MR: "MRI", CR: "X-ray", DX: "X-ray", US: "Ultrasound", MG: "Mammogram", PT: "PET", NM: "Nuclear", XA: "Angiogram", RF: "Fluoroscopy" };
const fmt = (d: string | null) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Date not recorded");

async function fetchManifest(token: string, studyId: string): Promise<DicomManifest> {
  const { data, error } = await supabase.functions.invoke("get-shared-brief", { body: { token, studyId } });
  if (error || !data?.manifest) throw new Error("This scan is no longer available.");
  return data.manifest as DicomManifest;
}

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export default function SharedScans({ token, studies, patientName }: { token: string; studies: SharedStudy[]; patientName?: string }) {
  const [viewing, setViewing] = useState<{ study: SharedStudy; manifest: DicomManifest } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!studies.length) return null;

  const open = async (s: SharedStudy) => {
    setBusy(`open:${s.id}`); setError(null);
    try { setViewing({ study: s, manifest: await fetchManifest(token, s.id) }); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(null); }
  };

  const download = async (list: SharedStudy[], signed?: DicomManifest) => {
    setBusy(`dl:${list.length === 1 ? list[0].id : "all"}`); setError(null); setProgress({ done: 0, total: list.reduce((n, s) => n + s.instanceCount, 0) });
    try {
      const manifests = signed ? [signed] : await Promise.all(list.map((s) => fetchManifest(token, s.id)));
      const blob = await exportStudiesZip(manifests, (done, total) => setProgress({ done, total }));
      const name = list.length === 1 ? `${(list[0].title || "scan").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-")}${list[0].date ? `-${list[0].date}` : ""}-DICOM.zip` : "RinVita-scans-DICOM.zip";
      save(blob, name);
    } catch (e) { setError((e as Error).message || "The download didn't finish. Please try again."); }
    finally { setBusy(null); setProgress(null); }
  };

  return (
    <section data-testid="shared-scans">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <ScanLine className="w-4 h-4 text-primary" />
          <h2 className="font-heading text-lg text-foreground">Scans</h2>
        </div>
        {studies.length > 1 && (
          <button type="button" onClick={() => void download(studies)} disabled={!!busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-foreground hover:bg-muted disabled:opacity-50">
            {busy === "dl:all" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Download all (DICOM)
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-3">Full studies as the hospital provided them. Open them in the viewer, or download the original DICOM files with a DICOMDIR to import into your PACS.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {studies.map((s) => (
          <div key={s.id} className="bg-card border border-border rounded-lg overflow-hidden flex">
            <button type="button" onClick={() => void open(s)} className="relative w-28 shrink-0 bg-black" aria-label={`Open ${s.title || "scan"}`}>
              {s.keyImageUrl ? <img src={s.keyImageUrl} alt="" className="absolute inset-0 w-full h-full object-contain" /> : <ScanLine className="absolute inset-0 m-auto w-7 h-7 text-white/30" />}
              {s.volumetric && <span className="absolute top-1.5 left-1.5 px-1 py-0.5 rounded bg-[#c8a03c]/90 text-[9px] text-black inline-flex items-center gap-0.5"><Box className="w-2.5 h-2.5" />3D</span>}
            </button>
            <div className="p-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{s.title || "Scan"}</p>
              <p className="text-xs text-muted-foreground">{[fmt(s.date), s.institution].filter(Boolean).join(" · ")}</p>
              <p className="text-xs text-muted-foreground">{s.modalities.map((m) => MOD[m] || m).join(", ")} · {s.seriesCount} series · {s.instanceCount} images</p>
              {s.reportName && <p className="text-xs text-foreground/80 mt-1 inline-flex items-center gap-1"><FileText className="w-3 h-3" /> Report: {s.reportName}</p>}
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => void open(s)} disabled={!!busy} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground text-xs disabled:opacity-50">
                  {busy === `open:${s.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />} View
                </button>
                <button type="button" onClick={() => void download([s])} disabled={!!busy} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border text-xs disabled:opacity-50">
                  {busy === `dl:${s.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} DICOM
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {progress && <p className="mt-2 text-xs text-muted-foreground">Preparing download: {progress.done} of {progress.total} images</p>}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      <p className="mt-2 text-[11px] text-muted-foreground">The viewer is for viewing and sharing. It is not for primary diagnosis.</p>

      {viewing && (
        <Suspense fallback={<div className="fixed inset-0 z-[80] bg-[#0b0c0f] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#e6c46a]" /></div>}>
          <DicomViewer manifest={viewing.manifest} subtitle={patientName ? `Shared by ${patientName}` : "Shared through RinVita"} onClose={() => setViewing(null)}
            downloading={busy === `dl:${viewing.study.id}`} onDownload={() => void download([viewing.study], viewing.manifest)} />
        </Suspense>
      )}
    </section>
  );
}
