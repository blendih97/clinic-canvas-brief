// Scans on the doctor's share link: open each in the viewer (2D, MPR, 3D). View only: downloading
// the original DICOM stays with the patient. Image URLs are short-lived and issued per scan.
import { Suspense, lazy, useState } from "react";
import { Box, Eye, Loader2, ScanLine, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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


export default function SharedScans({ token, studies, patientName }: { token: string; studies: SharedStudy[]; patientName?: string }) {
  const [viewing, setViewing] = useState<{ study: SharedStudy; manifest: DicomManifest } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!studies.length) return null;

  const open = async (s: SharedStudy) => {
    setBusy(`open:${s.id}`); setError(null);
    try { setViewing({ study: s, manifest: await fetchManifest(token, s.id) }); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(null); }
  };


  return (
    <section data-testid="shared-scans">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <ScanLine className="w-4 h-4 text-primary" />
          <h2 className="font-heading text-lg text-foreground">Scans</h2>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-3">Full studies as the hospital provided them, to view in 2D, multi-plane and 3D. If you need the original DICOM files for your PACS, ask the patient: they can send them to you.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {studies.map((s) => (
          <div key={s.id} className="bg-card border border-border rounded-lg overflow-hidden flex">
            <button type="button" onClick={() => void open(s)} className="relative w-28 shrink-0 bg-black" aria-label={`Open ${s.title || "scan"}`}>
              {s.keyImageUrl ? <img src={s.keyImageUrl} alt="" className="absolute inset-0 w-full h-full object-contain" /> : <ScanLine className="absolute inset-0 m-auto w-7 h-7 text-white/30" />}
              {s.volumetric && <span className="absolute top-1.5 left-1.5 px-1 py-0.5 rounded bg-[#c8a03c]/90 text-[9px] text-black inline-flex items-center gap-0.5"><Box className="w-2.5 h-2.5" />3D</span>}
            </button>
            <div className="p-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground line-clamp-2">{s.title || "Scan"}</p>
              <p className="text-xs text-muted-foreground">{[fmt(s.date), s.institution].filter(Boolean).join(" · ")}</p>
              <p className="text-xs text-muted-foreground">{s.modalities.map((m) => MOD[m] || m).join(", ")} · {s.seriesCount} series · {s.instanceCount} {s.instanceCount === 1 ? "image" : "images"}</p>
              {s.reportName && <p className="text-xs text-foreground/80 mt-1 inline-flex items-center gap-1"><FileText className="w-3 h-3" /> Report: {s.reportName}</p>}
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => void open(s)} disabled={!!busy} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground text-xs disabled:opacity-50">
                  {busy === `open:${s.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />} View
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      <p className="mt-2 text-[11px] text-muted-foreground">The viewer is for viewing and sharing. It is not for primary diagnosis.</p>

      {viewing && (
        <Suspense fallback={<div className="fixed inset-0 z-[80] bg-[#0b0c0f] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#e6c46a]" /></div>}>
          <DicomViewer manifest={viewing.manifest} title={viewing.study.title || undefined} subtitle={patientName ? `Shared by ${patientName}` : "Shared through RinVita"} onClose={() => setViewing(null)}
/>
        </Suspense>
      )}
    </section>
  );
}
