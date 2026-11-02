import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, Download } from "lucide-react";
import { authHeaders, streamUrl, type ImagingAuth, type ViewerStudy } from "@/lib/imaging/api";

/** Simple viewer for JPG/PNG scan photos. Bytes come only from the authorised stream. */
export default function PhotoViewer({ study, auth, onClose, onDownload, downloading }: {
  study: ViewerStudy; auth: ImagingAuth; onClose?: () => void; onDownload?: () => void; downloading?: string | null;
}) {
  const items = study.series.flatMap(s => s.instances);
  const [i, setI] = useState(0);
  const [src, setSrc] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let url: string | null = null; let cancelled = false;
    setSrc(null); setErr(false);
    (async () => {
      const res = await fetch(streamUrl(items[i].id), { headers: await authHeaders(auth), cache: "no-store" });
      if (!res.ok) throw new Error();
      url = URL.createObjectURL(await res.blob());
      if (!cancelled) setSrc(url);
    })().catch(() => !cancelled && setErr(true));
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [i, study.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="flex flex-col bg-black text-white rounded-lg overflow-hidden min-h-[420px] h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <p className="text-sm font-medium">{study.label} · {i + 1} / {items.length}</p>
        <div className="flex gap-1">
          {onDownload && <button onClick={onDownload} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-white/10"><Download className="w-3.5 h-3.5" />{downloading ?? "Download original"}</button>}
          {onClose && <button onClick={onClose} aria-label="Close" className="p-2 rounded-md hover:bg-white/10"><X className="w-4 h-4" /></button>}
        </div>
      </div>
      <div className="relative flex-1 flex items-center justify-center p-2">
        {err ? <p className="text-sm text-white/70">This image could not be shown.</p>
          : src ? <img src={src} alt={`${study.label} image ${i + 1}`} className="max-h-[70vh] max-w-full object-contain" />
          : <p className="text-sm text-white/60">Loading…</p>}
        {items.length > 1 && (<>
          <button aria-label="Previous" onClick={() => setI(v => Math.max(0, v - 1))} className="absolute left-2 p-2 rounded-full bg-white/10"><ChevronLeft className="w-4 h-4" /></button>
          <button aria-label="Next" onClick={() => setI(v => Math.min(items.length - 1, v + 1))} className="absolute right-2 p-2 rounded-full bg-white/10"><ChevronRight className="w-4 h-4" /></button>
        </>)}
      </div>
    </div>
  );
}
