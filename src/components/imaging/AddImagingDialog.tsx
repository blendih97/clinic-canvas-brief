import { useRef, useState } from "react";
import { Upload, FolderOpen, FileArchive, CheckCircle2, AlertTriangle, Loader2, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { scanSelection, groupStudies, type Picked, type ScanResult, type StudyPreview } from "@/lib/imaging/scan";
import { uploadImaging, type UploadOutcome, type UploadProgress } from "@/lib/imaging/upload";
import { formatBytes, formatStudyDate } from "@/lib/imaging/api";

type Stage = "pick" | "scanning" | "review" | "uploading" | "done";

export default function AddImagingDialog({ open, onOpenChange, onComplete, onOpenDocuments }: {
  open: boolean; onOpenChange: (o: boolean) => void; onComplete: () => void; onOpenDocuments?: () => void;
}) {
  const [stage, setStage] = useState<Stage>("pick");
  const [scanMsg, setScanMsg] = useState("");
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [studies, setStudies] = useState<StudyPreview[]>([]);
  const [photoLabel, setPhotoLabel] = useState("");
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [outcome, setOutcome] = useState<UploadOutcome | null>(null);
  const [dragging, setDragging] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);

  const reset = () => { setStage("pick"); setScan(null); setStudies([]); setProgress(null); setOutcome(null); setPhotoLabel(""); };

  const handlePicked = async (picked: Picked[]) => {
    if (!picked.length) return;
    setStage("scanning"); setScanMsg("Checking your files…");
    try {
      const result = await scanSelection(picked, setScanMsg);
      setScan(result); setStudies(groupStudies(result.dicom)); setStage("review");
    } catch {
      setScan({ dicom: [], images: [], pdfs: [], skipped: [{ name: "Selection", reason: "could not be read" }] }); setStage("review");
    }
  };

  const fromInput = (list: FileList | null) => handlePicked(Array.from(list ?? []).map(f => ({ file: f, name: (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name })));

  // Drag & drop, including whole folders (webkitGetAsEntry)
  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const out: Picked[] = [];
    const walk = async (entry: any, path = ""): Promise<void> => {
      if (!entry) return;
      if (entry.isFile) { const f: File = await new Promise((res, rej) => entry.file(res, rej)); out.push({ file: f, name: path + f.name }); return; }
      if (entry.isDirectory) {
        const reader = entry.createReader();
        for (;;) {
          const batch: any[] = await new Promise(res => reader.readEntries(res));
          if (!batch.length) break;
          for (const ch of batch) await walk(ch, `${path}${entry.name}/`);
        }
      }
    };
    const items = Array.from(e.dataTransfer.items ?? []);
    if (items.length && typeof (items[0] as any).webkitGetAsEntry === "function") {
      for (const it of items) await walk((it as any).webkitGetAsEntry());
    } else Array.from(e.dataTransfer.files).forEach(f => out.push({ file: f, name: f.name }));
    void handlePicked(out);
  };

  const startUpload = async () => {
    if (!scan) return;
    const items = [...scan.dicom.map(d => ({ file: d.file, name: d.name })), ...scan.images.map(i => ({ file: i.file, name: i.name }))];
    if (!items.length) return;
    setStage("uploading");
    abort.current = new AbortController();
    try {
      const res = await uploadImaging(items, { imageLabel: photoLabel.trim() || undefined, onProgress: setProgress, signal: abort.current.signal });
      setOutcome(res); setStage("done"); onComplete();
    } catch {
      setOutcome({ registered: 0, duplicates: 0, rejected: [], failed: items.map(i => ({ name: i.name, reason: "upload failed — please try again" })), studyIds: [] });
      setStage("done");
    }
  };

  const pct = progress && progress.totalBytes ? Math.round((progress.uploadedBytes / progress.totalBytes) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (stage === "uploading" && !o) return; onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-light">Add imaging</DialogTitle>
          <DialogDescription>MRI, CT, X-ray or ultrasound from a hospital CD, USB stick, download link or ZIP. Your original files are kept exactly as they are.</DialogDescription>
        </DialogHeader>

        {stage === "pick" && (
          <div className="space-y-3">
            <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border"}`}>
              <Upload className="w-7 h-7 text-primary mx-auto mb-2" />
              <p className="text-sm text-foreground">Drag files or a whole folder here</p>
              <p className="text-xs text-muted-foreground mt-1">DICOM (including files with no extension), ZIP, JPG, PNG, and PDF reports</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => fileInput.current?.click()} className="flex items-center justify-center gap-2 p-3 rounded-lg border border-border text-sm hover:border-primary/40">
                <FileArchive className="w-4 h-4 text-primary" /> Choose files or ZIP
              </button>
              <button type="button" onClick={() => folderInput.current?.click()} className="flex items-center justify-center gap-2 p-3 rounded-lg border border-border text-sm hover:border-primary/40">
                <FolderOpen className="w-4 h-4 text-primary" /> Choose a folder (CD/USB)
              </button>
            </div>
            <input ref={fileInput} type="file" multiple className="hidden" data-testid="imaging-file-input" onChange={e => fromInput(e.target.files)} />
            <input ref={folderInput} type="file" multiple className="hidden" {...({ webkitdirectory: "", directory: "" } as any)} onChange={e => fromInput(e.target.files)} />
            <p className="text-[11px] text-muted-foreground">Tip: on a hospital CD, choose the whole CD drive as the folder. We find the scan files automatically.</p>
          </div>
        )}

        {stage === "scanning" && (
          <div className="py-8 text-center text-sm text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />{scanMsg}</div>
        )}

        {stage === "review" && scan && (
          <div className="space-y-3">
            {studies.length === 0 && scan.images.length === 0 && scan.pdfs.length === 0 && (
              <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-sm">We couldn't find any scan files in what you chose. If this came from a hospital CD, try choosing the whole CD folder.</div>
            )}
            {studies.map(s => (
              <div key={s.studyUid} className="rounded-lg border border-border p-3" data-testid="study-preview">
                <p className="text-sm font-medium text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground">{formatStudyDate(s.date)} · {s.series} series · {s.images} images · {formatBytes(s.bytes)}</p>
              </div>
            ))}
            {scan.images.length > 0 && (
              <div className="rounded-lg border border-border p-3 space-y-2">
                <p className="text-sm text-foreground">{scan.images.length} photo{scan.images.length > 1 ? "s" : ""} of scans</p>
                <input value={photoLabel} onChange={e => setPhotoLabel(e.target.value)} maxLength={80} placeholder="Name them, e.g. Knee X-ray photos"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm" />
              </div>
            )}
            {scan.pdfs.length > 0 && (
              <div className="rounded-lg border border-border p-3 text-sm flex gap-2">
                <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p>{scan.pdfs.length} PDF report{scan.pdfs.length > 1 ? "s" : ""} found. Add reports in <b>Documents</b> so they're read and translated, then link one to the scan.</p>
                  {onOpenDocuments && <button type="button" className="text-primary text-xs underline mt-1" onClick={onOpenDocuments}>Go to Documents</button>}
                </div>
              </div>
            )}
            {scan.skipped.length > 0 && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer">{scan.skipped.length} file{scan.skipped.length > 1 ? "s" : ""} skipped</summary>
                <ul className="mt-1 space-y-0.5 max-h-32 overflow-auto">{scan.skipped.slice(0, 50).map((s, i) => <li key={i}>{s.name}: {s.reason}</li>)}</ul>
              </details>
            )}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={reset} className="px-4 py-2 rounded-lg border border-border text-sm">Back</button>
              <button type="button" onClick={startUpload} disabled={!studies.length && !scan.images.length} data-testid="start-upload"
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40">
                Upload {studies.length ? `${studies.length} stud${studies.length > 1 ? "ies" : "y"}` : "photos"}
              </button>
            </div>
          </div>
        )}

        {stage === "uploading" && progress && (
          <div className="space-y-3 py-2">
            <Progress value={pct} />
            <p className="text-sm text-foreground">{progress.phase === "registering" ? "Checking and organising your scans…" : `Uploading ${progress.done} of ${progress.total} files · ${formatBytes(progress.uploadedBytes)} of ${formatBytes(progress.totalBytes)}`}</p>
            <p className="text-xs text-muted-foreground">You can keep this window open. If your connection drops, choose the same files again and the upload resumes where it stopped.</p>
            <button type="button" onClick={() => abort.current?.abort()} className="text-xs text-muted-foreground underline">Cancel</button>
          </div>
        )}

        {stage === "done" && outcome && (
          <div className="space-y-3" data-testid="upload-done">
            {outcome.registered > 0 && <p className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-emerald-600" />{outcome.registered} files added{outcome.duplicates ? ` (${outcome.duplicates} duplicates ignored)` : ""}.</p>}
            {[...outcome.rejected, ...outcome.failed].length > 0 && (
              <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-xs space-y-1">
                <p className="flex items-center gap-1.5 font-medium text-sm"><AlertTriangle className="w-4 h-4 text-primary" />Some files weren't added</p>
                <ul className="max-h-32 overflow-auto">{[...outcome.rejected, ...outcome.failed].slice(0, 50).map((r, i) => <li key={i}>{r.name}: {r.reason}</li>)}</ul>
              </div>
            )}
            <button type="button" onClick={() => { onOpenChange(false); reset(); }} className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Done</button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
