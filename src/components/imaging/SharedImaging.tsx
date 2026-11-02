import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ScanLine, Download, Info } from "lucide-react";
import { startRecipientSession, formatStudyDate, formatBytes, type ViewerStudy } from "@/lib/imaging/api";
import { downloadOriginalStudy } from "@/lib/imaging/download";
import PhotoViewer from "./PhotoViewer";

const DicomViewer = lazy(() => import("./DicomViewer"));

type Session = { secret: string; studies: ViewerStudy[]; allowDownload: boolean };

/**
 * Imaging section on the doctor's Share Brief page. Rendered only while the brief
 * is live; the parent unmounts it on expiry, revocation or failed revalidation.
 * The session secret is held in memory only, never in storage or the URL.
 */
export default function SharedImaging({ token, recipientSecret }: { token: string; recipientSecret: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<"loading" | "none" | "ready" | "error">("loading");
  const [open, setOpen] = useState<ViewerStudy | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    startRecipientSession(token, recipientSecret).then(res => {
      if (!res || !res.sessionSecret || !res.studies.length) { setState("none"); return; }
      setSession({ secret: res.sessionSecret, studies: res.studies, allowDownload: res.allow_download });
      setState("ready");
    }).catch(() => setState("error"));
  }, [token, recipientSecret]);

  if (state === "none") return null;
  if (state === "loading") return <p className="text-sm text-muted-foreground">Loading shared imaging…</p>;
  if (state === "error" || !session) return <p className="text-sm text-muted-foreground">Shared imaging could not be loaded. Refresh the page to try again.</p>;

  const auth = { mode: "session" as const, secret: session.secret };
  const download = async (s: ViewerStudy) => {
    setDownloadError(null); setDownloading("Preparing…");
    try { await downloadOriginalStudy(s, auth, (d, t) => setDownloading(`${d} / ${t} files`)); }
    catch { setDownloadError("Download is no longer available (the link may have been revoked or expired)."); }
    finally { setDownloading(null); }
  };

  return (
    <section data-testid="shared-imaging">
      <div className="flex items-center gap-2 mb-3">
        <ScanLine className="w-4 h-4 text-primary" />
        <h2 className="font-heading text-lg text-foreground">Imaging</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-3 flex gap-1.5"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        These are the patient's original DICOM images, opened directly in your browser. Scroll through slices, change series, zoom, pan and adjust window/level.
        {session.allowDownload ? " The patient has allowed you to download the original files, for example to pass to your radiology team." : " The patient has not enabled downloading."}
      </p>
      <div className="space-y-2">
        {session.studies.map(s => (
          <div key={s.id} className="bg-card border border-border rounded-lg p-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-foreground">{s.label}</p>
              <p className="text-xs text-muted-foreground">{formatStudyDate(s.study_date)} · {s.series.length} series · {s.instance_count ?? s.series.reduce((n, x) => n + x.instances.length, 0)} images{s.total_bytes ? ` · ${formatBytes(s.total_bytes)}` : ""}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setOpen(s)} className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium" data-testid="open-shared-study">Open scan</button>
              {session.allowDownload && (
                <button onClick={() => download(s)} disabled={!!downloading} className="px-3 py-1.5 rounded-md border border-border text-xs flex items-center gap-1"><Download className="w-3 h-3" />{downloading ?? "Download original"}</button>
              )}
            </div>
          </div>
        ))}
      </div>
      {downloadError && <p className="text-xs text-destructive mt-2">{downloadError}</p>}
      {open && (
        <div className="mt-4 h-[75vh] relative left-1/2 -translate-x-1/2 w-[min(96vw,1200px)]">
          {open.kind === "image"
            ? <PhotoViewer study={open} auth={auth} onClose={() => setOpen(null)} />
            : <Suspense fallback={<p className="text-sm">Loading viewer…</p>}>
                <DicomViewer study={open} auth={auth} onClose={() => setOpen(null)}
                  onDownload={session.allowDownload ? () => download(open) : undefined} downloading={downloading} />
              </Suspense>}
        </div>
      )}
      <p className="text-[11px] text-muted-foreground mt-3">To pass these images to your hospital's radiology or records team, ask the patient to enable downloading or to share with them directly. RinVita does not send images into hospital systems (PACS/EPR).</p>
    </section>
  );
}
