// Imaging: the patient's scans (CT, MRI, X-ray, ultrasound...) as full DICOM studies.
// Add from a folder, a hospital CD or a ZIP; view in 2D, MPR and 3D; download for a clinic's PACS.
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ScanLine, Upload, FolderOpen, FileArchive, Loader2, Eye, Download, Trash2, Box, FileText, Send, Lock, AlertTriangle, X, Check, Link2,
  Disc3, Usb, ChevronDown, HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { hasAccess } from "@/lib/planAccess";
import { useVaultStore } from "@/store/vaultStore";
import { ingestDicom, studyTitle } from "@/lib/dicom/ingest";
import {
  deleteStudy, exportStudiesZip, formatBytes, listStudies, openStudy, saveKeyImage, saveStudy, setStudyReport, type ImagingStudy,
} from "@/lib/dicom/storage";
import type { DicomManifest, IngestResult } from "@/lib/dicom/types";
import RequestImagingModal from "@/components/RequestImagingModal";

const DicomViewer = lazy(() => import("@/components/dicom/DicomViewer"));

const MOD_LABEL: Record<string, string> = { CT: "CT", MR: "MRI", CR: "X-ray", DX: "X-ray", US: "Ultrasound", MG: "Mammogram", PT: "PET", NM: "Nuclear", XA: "Angiogram", RF: "Fluoroscopy", OT: "Other", SR: "Report", KO: "Key images", PR: "Annotations" };
const fmtDate = (d?: string | null) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Date not recorded");

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export const exportFileName = (title: string, date?: string | null) =>
  `${title.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-") || "scan"}${date ? `-${date}` : ""}-DICOM.zip`;

const ScansSection = () => {
  const { user, profile } = useAuth();
  const { isActive, planTier } = useSubscription();
  const documents = useVaultStore((s) => s.documents);
  const canUse = hasAccess(profile, "dicom_imaging", { isActive, planTier });

  const [studies, setStudies] = useState<ImagingStudy[] | null>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [viewing, setViewing] = useState<{ study: ImagingStudy; manifest: DicomManifest } | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [exporting, setExporting] = useState<{ id: string; done: number; total: number } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ImagingStudy | null>(null);
  const [linking, setLinking] = useState<ImagingStudy | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try { setStudies(await listStudies(user.id)); } catch { setStudies([]); }
  }, [user]);
  useEffect(() => { void load(); }, [load]);

  // Card images: signed URLs for key images, and create any that are missing (once per study).
  const makingKeys = useRef(new Set<string>());
  useEffect(() => {
    if (!studies?.length) return;
    const withKey = studies.filter((s) => s.key_image_path);
    if (withKey.length) {
      supabase.storage.from("medical-documents").createSignedUrls(withKey.map((s) => s.key_image_path!), 3600).then(({ data }) => {
        const map: Record<string, string> = {};
        data?.forEach((d, i) => { if (d.signedUrl) map[withKey[i].id] = d.signedUrl; });
        setThumbs((t) => ({ ...t, ...map }));
      });
    }
    const missing = studies.filter((s) => s.status === "ready" && !s.key_image_path && !makingKeys.current.has(s.id));
    if (!missing.length) return;
    (async () => {
      const { renderKeyImage } = await import("@/lib/dicom/keyImage");
      for (const s of missing) {
        makingKeys.current.add(s.id);
        try {
          const png = await renderKeyImage(await openStudy(s, 600));
          if (!png) continue;
          const path = await saveKeyImage(s, png);
          setThumbs((t) => ({ ...t, [s.id]: URL.createObjectURL(png) }));
          setStudies((list) => list?.map((x) => (x.id === s.id ? { ...x, key_image_path: path } : x)) ?? list);
        } catch { /* the card shows a placeholder */ }
      }
    })();
  }, [studies]);

  const totals = useMemo(() => ({
    size: (studies || []).reduce((n, s) => n + Number(s.size_bytes || 0), 0),
    images: (studies || []).reduce((n, s) => n + s.instance_count, 0),
  }), [studies]);

  const reportFor = (s: ImagingStudy) => documents.find((d) => d.id === s.document_id);

  const upgrade = () => window.dispatchEvent(new CustomEvent("show-upgrade", { detail: { feature: "dicom_imaging" } }));

  const open = async (s: ImagingStudy) => {
    if (!canUse) return upgrade();
    setOpening(s.id);
    try { setViewing({ study: s, manifest: await openStudy(s) }); }
    catch (e) { toast.error((e as Error).message || "This scan could not be opened."); }
    finally { setOpening(null); }
  };

  const download = async (s: ImagingStudy, signed?: DicomManifest) => {
    if (!canUse) return upgrade();
    setExporting({ id: s.id, done: 0, total: s.instance_count });
    try {
      const m = signed ?? await openStudy(s);
      const blob = await exportStudiesZip([m], (done, total) => setExporting({ id: s.id, done, total }));
      saveBlob(blob, exportFileName(s.title || "scan", s.study_date));
      toast.success("Downloaded. Clinics can import this ZIP into their PACS or open it in any DICOM viewer.");
    } catch (e) {
      toast.error((e as Error).message || "The download didn't finish. Please try again.");
    } finally { setExporting(null); }
  };

  const remove = async (s: ImagingStudy) => {
    try {
      await deleteStudy(s);
      setStudies((list) => list?.filter((x) => x.id !== s.id) ?? list);
      toast.success("Scan deleted.");
    } catch { toast.error("The scan couldn't be deleted. Please try again."); }
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl text-foreground">Imaging</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your scans in full, as the hospital took them. View them in 2D, multi-plane and 3D, and share them with any doctor.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => (canUse ? setRequestOpen(true) : upgrade())}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted">
            <Send className="w-4 h-4" /> Request from a hospital
          </button>
          <button type="button" onClick={() => (canUse ? setAdding(true) : upgrade())}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Upload className="w-4 h-4" /> Add scans
          </button>
        </div>
      </div>

      {!canUse && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
          <Lock className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Full scans are part of the Standard and Family plans</p>
            <p className="text-xs text-muted-foreground mt-0.5">Keep CT, MRI and X-ray studies from any hospital, view them in 3D, and share them with your doctor in one link.</p>
          </div>
          <button type="button" onClick={upgrade} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Upgrade</button>
        </div>
      )}

      {studies === null ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading your scans…</div>
      ) : studies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <ScanLine className="w-10 h-10 mx-auto text-muted-foreground/60" />
          <p className="mt-3 font-heading text-xl text-foreground">No scans yet</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">Add the folder from a hospital CD or USB stick, a ZIP the hospital emailed you, or ask the hospital to send them to you directly.</p>
          {canUse && (
            <button type="button" onClick={() => setAdding(true)} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
              <Upload className="w-4 h-4" /> Add scans
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{studies.length} {studies.length === 1 ? "scan" : "scans"} · {totals.images.toLocaleString("en-GB")} images · {formatBytes(totals.size)}</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" data-testid="scan-list">
            {studies.map((s) => {
              const report = reportFor(s);
              const exp = exporting?.id === s.id ? exporting : null;
              return (
                <div key={s.id} className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
                  <button type="button" onClick={() => void open(s)} disabled={s.status !== "ready"} className="relative aspect-[4/3] bg-black group" aria-label={`Open ${s.title || "scan"}`}>
                    {thumbs[s.id] ? <img src={thumbs[s.id]} alt="" className="absolute inset-0 w-full h-full object-contain" />
                      : <ScanLine className="absolute inset-0 m-auto w-10 h-10 text-white/30" />}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 text-black text-xs font-medium">
                        {opening === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />} Open viewer
                      </span>
                    </div>
                    <div className="absolute top-2 left-2 flex gap-1">
                      {s.modalities.filter((m) => !["SR", "KO", "PR"].includes(m)).map((m) => <span key={m} className="px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white">{MOD_LABEL[m] || m}</span>)}
                      {s.volumetric && <span className="px-1.5 py-0.5 rounded bg-[#c8a03c]/90 text-[10px] text-black inline-flex items-center gap-0.5"><Box className="w-3 h-3" />3D</span>}
                    </div>
                    {s.status === "uploading" && <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-white">Upload not finished</span>}
                  </button>
                  <div className="p-4 flex-1 flex flex-col">
                    <p className="font-medium text-foreground">{s.title || "Scan"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{[fmtDate(s.study_date), s.institution].filter(Boolean).join(" · ")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.series_count} {s.series_count === 1 ? "series" : "series"} · {s.instance_count.toLocaleString("en-GB")} {s.instance_count === 1 ? "image" : "images"} · {formatBytes(Number(s.size_bytes))}{s.source === "request" ? " · Sent by the hospital" : ""}</p>
                    <button type="button" onClick={() => setLinking(s)} className="mt-2 self-start inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      {report ? <><FileText className="w-3.5 h-3.5" /> Report: {report.name}</> : <><Link2 className="w-3.5 h-3.5" /> Link the radiology report</>}
                    </button>
                    {exp && (
                      <div className="mt-3">
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${exp.total ? (exp.done / exp.total) * 100 : 5}%` }} /></div>
                        <p className="mt-1 text-[11px] text-muted-foreground">Preparing download: {exp.done} of {exp.total} images</p>
                      </div>
                    )}
                    <div className="mt-auto pt-3 flex gap-2">
                      <button type="button" onClick={() => void open(s)} disabled={s.status !== "ready" || opening === s.id}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50">
                        {opening === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />} View
                      </button>
                      <button type="button" onClick={() => void download(s)} disabled={s.status !== "ready" || !!exporting} title="Download for a clinic (DICOM)"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-foreground hover:bg-muted disabled:opacity-50">
                        <Download className="w-3.5 h-3.5" /> DICOM
                      </button>
                      <button type="button" onClick={() => setConfirmDelete(s)} aria-label="Delete scan" className="px-2.5 py-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-muted">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {studies !== null && (
        <AddScansGuide key={studies.length === 0 ? "open" : "closed"} defaultOpen={studies.length === 0}
          onAdd={() => (canUse ? setAdding(true) : upgrade())} onRequest={() => (canUse ? setRequestOpen(true) : upgrade())} />
      )}

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        The viewer is for viewing and sharing your scans. It is not for primary diagnosis. Always have scans read by a qualified radiologist or doctor. Downloads contain the original images, exactly as the hospital sent them.
      </p>

      {adding && user && (
        <AddScansModal userId={user.id} profileName={profile?.full_name || ""} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); void load(); }} />
      )}
      <RequestImagingModal open={requestOpen} onClose={() => setRequestOpen(false)} />

      {linking && (
        <LinkReportModal study={linking} onClose={() => setLinking(null)} onSaved={(docId) => {
          setStudies((list) => list?.map((x) => (x.id === linking.id ? { ...x, document_id: docId } : x)) ?? list);
          setLinking(null);
        }} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-heading text-xl text-foreground">Delete this scan?</h2>
            <p className="text-sm text-muted-foreground">{confirmDelete.title} ({fmtDate(confirmDelete.study_date)}) and all {confirmDelete.instance_count} images will be permanently deleted from RinVita. Links you've already shared will no longer show it. This can't be undone.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmDelete(null)} className="flex-1 py-2 rounded-lg border border-border text-sm">Cancel</button>
              <button type="button" onClick={() => void remove(confirmDelete)} className="flex-1 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <Suspense fallback={<div className="fixed inset-0 z-[80] bg-[#0b0c0f] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#e6c46a]" /></div>}>
          <DicomViewer manifest={viewing.manifest} title={viewing.study.title || undefined} onClose={() => setViewing(null)}
            downloading={exporting?.id === viewing.study.id}
            onDownload={() => void download(viewing.study, viewing.manifest)} />
        </Suspense>
      )}
    </div>
  );
};

// How scans get into RinVita: from a CD or DVD, a USB stick or download, or sent by the hospital (or a facilitator) through a link.
function AddScansGuide({ defaultOpen, onAdd, onRequest }: { defaultOpen: boolean; onAdd: () => void; onRequest: () => void }) {
  const [open, setOpen] = useState(defaultOpen);
  const [tab, setTab] = useState<"cd" | "usb" | "link">("cd");
  const tabs = [
    { id: "cd" as const, icon: Disc3, label: "From a CD or DVD" },
    { id: "usb" as const, icon: Usb, label: "From a USB stick or download" },
    { id: "link" as const, icon: Send, label: "Ask the hospital to send them" },
  ];
  const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
    <li className="flex gap-3">
      <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">{n}</span>
      <span className="text-sm text-foreground leading-relaxed pt-0.5">{children}</span>
    </li>
  );
  return (
    <div className="rounded-xl border border-border bg-card" data-testid="scans-guide">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="w-full flex items-center justify-between gap-3 p-4 text-left">
        <span className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground">How to add your scans</span>
          <span className="hidden sm:inline text-xs text-muted-foreground">CD, USB stick, download or straight from the hospital</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-5">
          <div className="flex flex-wrap gap-2 border-b border-border pb-3">
            {tabs.map((t) => (
              <button key={t.id} type="button" onClick={() => setTab(t.id)} aria-pressed={tab === t.id}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border ${tab === t.id ? "border-primary bg-primary/5 text-primary font-medium" : "border-border text-muted-foreground hover:text-foreground"}`}>
                <t.icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            ))}
          </div>

          {tab === "cd" && (
            <div className="pt-4 space-y-4">
              <ol className="space-y-3">
                <Step n={1}>Put the CD or DVD from the hospital into your computer. No CD drive? An external USB CD drive costs about £15 to £25, or ask your clinic or facilitator to do it for you (see "Ask the hospital to send them").</Step>
                <Step n={2}>In RinVita, open <strong>Imaging</strong>, then <strong>Add scans</strong>, then <strong>Choose a folder</strong>.</Step>
                <Step n={3}>Select the CD drive itself, for example <strong>D:</strong> on Windows or the CD icon on a Mac. You don't need to open the hospital's viewer program on the disc.</Step>
                <Step n={4}>RinVita reads the disc and shows the scans it found, with their dates and number of images. It skips anything that isn't a scan image.</Step>
                <Step n={5}>Check the scans are yours, then click <strong>Add scans</strong>. Keep the page open until the upload finishes.</Step>
              </ol>
              <p className="text-xs text-muted-foreground">Works on a Windows PC or Mac. Phones and tablets can't read CDs. If RinVita says no scan images were found, the disc may be encrypted or use the hospital's own format: ask the hospital to send the scans through a link instead.</p>
            </div>
          )}

          {tab === "usb" && (
            <div className="pt-4 space-y-4">
              <ol className="space-y-3">
                <Step n={1}><strong>USB stick:</strong> plug it into your computer. <strong>Download link or email:</strong> download the file the hospital sent you, usually a ZIP. You don't need to unzip it.</Step>
                <Step n={2}>In RinVita, open <strong>Imaging</strong>, then <strong>Add scans</strong>.</Step>
                <Step n={3}>For a USB stick, click <strong>Choose a folder</strong> and select the USB drive. For a ZIP or loose files, click <strong>Choose files or a ZIP</strong>. You can also drag the folder or ZIP onto the window.</Step>
                <Step n={4}>Check the scans RinVita found are yours, then click <strong>Add scans</strong>.</Step>
              </ol>
              <p className="text-xs text-muted-foreground">If the hospital gave you a link to an online viewer rather than a download, look for a "Download" or "Export DICOM" button there first. Images saved as JPEG or PDF can go in Documents instead, but they can't be viewed in 3D or imported by another hospital.</p>
            </div>
          )}

          {tab === "link" && (
            <div className="pt-4 space-y-4">
              <ol className="space-y-3">
                <Step n={1}>Click <strong>Request from a hospital</strong> and enter the hospital's radiology or medical records email, and which scan you need.</Step>
                <Step n={2}>You sign a consent to release, and the hospital receives an email with a secure upload link. They don't need an account.</Step>
                <Step n={3}>They export the scan from their imaging system (PACS) and upload the folder, CD contents or ZIP through the link.</Step>
                <Step n={4}>The scan appears here in Imaging and you get a notification. The link expires after 30 days.</Step>
              </ol>
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-foreground">
                <strong>Have a CD but no computer to read it?</strong> Send the request to your clinic, concierge or medical travel coordinator's email instead. They put the CD in their computer and upload it through the link, and it goes straight into your account. They can't see anything else in your records.
              </div>
              <p className="text-xs text-muted-foreground">Some hospitals only send scans directly between imaging systems (PACS to PACS). If yours says so, ask them for a copy on CD or USB, which you are entitled to, and add it yourself.</p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {tab === "link" ? (
              <button type="button" onClick={onRequest} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"><Send className="w-4 h-4" /> Request from a hospital</button>
            ) : (
              <button type="button" onClick={onAdd} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"><Upload className="w-4 h-4" /> Add scans</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AddScansModal({ userId, profileName, onClose, onSaved }: { userId: string; profileName: string; onClose: () => void; onSaved: () => void }) {
  const [reading, setReading] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<IngestResult | null>(null);
  const [saving, setSaving] = useState<{ study: number; done: number; total: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const folderRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);

  const read = async (files: { name: string; blob: Blob }[]) => {
    if (!files.length) return;
    setResult(null);
    setReading({ done: 0, total: files.length });
    try {
      const r = await ingestDicom(files, (done, total) => setReading({ done, total }));
      setResult(r);
      if (!r.studies.length) toast.error("No scan images were found in what you added.");
    } catch {
      toast.error("These files couldn't be read.");
    } finally { setReading(null); }
  };

  const fromInput = (list: FileList | null) => read([...(list || [])].map((f) => ({ name: (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name, blob: f })));

  // Folders dropped from the desktop.
  const fromDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const items = [...e.dataTransfer.items];
    const out: { name: string; blob: Blob }[] = [];
    const walk = async (entry: FileSystemEntry, prefix: string): Promise<void> => {
      if (entry.isFile) {
        const file = await new Promise<File>((res, rej) => (entry as FileSystemFileEntry).file(res, rej));
        out.push({ name: prefix + file.name, blob: file });
      } else if (entry.isDirectory) {
        const reader = (entry as FileSystemDirectoryEntry).createReader();
        for (;;) {
          const batch = await new Promise<FileSystemEntry[]>((res, rej) => reader.readEntries(res, rej));
          if (!batch.length) break;
          for (const child of batch) await walk(child, `${prefix}${entry.name}/`);
        }
      }
    };
    const entries = items.map((i) => i.webkitGetAsEntry?.()).filter(Boolean) as FileSystemEntry[];
    if (entries.length) for (const en of entries) await walk(en, "");
    else out.push(...[...e.dataTransfer.files].map((f) => ({ name: f.name, blob: f as Blob })));
    void read(out);
  };

  const names = useMemo(() => [...new Set(result?.studies.map((s) => s.manifest.patientName).filter(Boolean) as string[])], [result]);
  const nameMismatch = useMemo(() => {
    if (!profileName || !names.length) return false;
    const norm = (x: string) => x.toLowerCase().replace(/[^a-z]/g, " ").split(/\s+/).filter(Boolean);
    const mine = new Set(norm(profileName));
    return names.some((n) => !norm(n).some((w) => mine.has(w)));
  }, [names, profileName]);

  const save = async () => {
    if (!result) return;
    try {
      for (let i = 0; i < result.studies.length; i++) {
        setSaving({ study: i, done: 0, total: result.studies[i].instanceCount });
        await saveStudy(userId, result.studies[i], (done, total) => setSaving({ study: i, done, total }));
      }
      toast.success(result.studies.length === 1 ? "Scan added." : `${result.studies.length} scans added.`);
      onSaved();
    } catch (e) {
      const msg = (e as Error)?.message || "";
      toast.error(/row-level security|policy/i.test(msg) ? "Adding scans needs a Standard or Family plan." : "The upload didn't finish. Please try again: images already uploaded won't be sent twice.");
      setSaving(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-xl shadow-xl max-h-[92vh] overflow-y-auto" data-testid="add-scans">
        <div className="flex items-center justify-between px-6 pt-5">
          <h2 className="font-heading text-2xl text-foreground">Add scans</h2>
          <button type="button" onClick={onClose} disabled={!!saving} aria-label="Close" className="p-1 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {!result && (
            <>
              <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => void fromDrop(e)}
                className={`rounded-xl border-2 border-dashed p-8 text-center ${dragOver ? "border-primary bg-primary/5" : "border-border"}`}>
                {reading ? (
                  <>
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                    <p className="mt-2 text-sm text-foreground">Reading files: {reading.done} of {reading.total}</p>
                  </>
                ) : (
                  <>
                    <ScanLine className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-foreground">Drop a scan folder, a CD's contents or a ZIP here</p>
                    <p className="text-xs text-muted-foreground mt-1">DICOM files from any hospital: CT, MRI, X-ray, ultrasound, mammography and more</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <button type="button" onClick={() => folderRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm"><FolderOpen className="w-4 h-4" /> Choose a folder</button>
                      <button type="button" onClick={() => filesRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm"><FileArchive className="w-4 h-4" /> Choose files or a ZIP</button>
                    </div>
                  </>
                )}
              </div>
              <input ref={folderRef} type="file" className="hidden" multiple onChange={(e) => void fromInput(e.target.files)} {...{ webkitdirectory: "", directory: "" }} />
              <input ref={filesRef} type="file" className="hidden" multiple accept=".dcm,.dicom,.zip,application/dicom,application/zip,*/*" onChange={(e) => void fromInput(e.target.files)} />
              <p className="text-xs text-muted-foreground">Hospital CD? Open it on your computer and choose the whole CD as the folder. Everything is read on your device first, and only the scan images are uploaded.</p>
            </>
          )}

          {result && result.studies.length > 0 && (
            <>
              <p className="text-sm text-foreground">Found {result.studies.length} {result.studies.length === 1 ? "scan" : "scans"}:</p>
              <div className="space-y-2">
                {result.studies.map((s, i) => (
                  <div key={s.manifest.studyUid} className="rounded-lg border border-border p-3 flex items-start gap-3">
                    <ScanLine className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{studyTitle(s.manifest)}</p>
                      <p className="text-xs text-muted-foreground">{[fmtDate(s.manifest.studyDate), s.manifest.institution].filter(Boolean).join(" · ")}</p>
                      <p className="text-xs text-muted-foreground">{s.manifest.series.length} series · {s.instanceCount} {s.instanceCount === 1 ? "image" : "images"} · {formatBytes(s.sizeBytes)}{s.manifest.patientName ? ` · Name on scan: ${s.manifest.patientName}` : ""}</p>
                      {saving && saving.study === i && (
                        <div className="mt-2">
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${saving.total ? (saving.done / saving.total) * 100 : 3}%` }} /></div>
                          <p className="mt-1 text-[11px] text-muted-foreground">Uploading {saving.done} of {saving.total}</p>
                        </div>
                      )}
                      {saving && saving.study > i && <p className="mt-1 text-[11px] text-emerald-600 inline-flex items-center gap-1"><Check className="w-3 h-3" /> Uploaded</p>}
                    </div>
                  </div>
                ))}
              </div>
              {nameMismatch && (
                <p className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-foreground">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  The name on {names.length > 1 ? "these scans" : "this scan"} ({names.join(", ")}) doesn't match your profile name. Only add scans that belong to you.
                </p>
              )}
              {result.skipped.length > 0 && (
                <p className="text-xs text-muted-foreground">{result.skipped.length} other {result.skipped.length === 1 ? "file was" : "files were"} not scan images and won't be uploaded{result.skipped.some((x) => x.reason.includes("50 MB")) ? " (some images over 50 MB can't be added yet)" : ""}.</p>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => setResult(null)} disabled={!!saving} className="py-2.5 px-4 border border-border rounded-lg text-sm">Back</button>
                <button type="button" onClick={() => void save()} disabled={!!saving}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : `Add ${result.studies.length === 1 ? "scan" : `${result.studies.length} scans`}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LinkReportModal({ study, onClose, onSaved }: { study: ImagingStudy; onClose: () => void; onSaved: (docId: string | null) => void }) {
  const documents = useVaultStore((s) => s.documents);
  const [choice, setChoice] = useState<string>(study.document_id || "");
  const [busy, setBusy] = useState(false);
  // Likely reports first: imaging-type documents, closest in date to the scan.
  const sorted = useMemo(() => {
    const t = study.study_date ? new Date(study.study_date).getTime() : 0;
    const score = (d: { type: string; name: string; date: string }) =>
      (/(radiol|imag|scan|mri|ct|x-?ray|ultra|report)/i.test(`${d.type} ${d.name}`) ? 0 : 1e13) + (t && d.date ? Math.abs(new Date(d.date).getTime() - t) : 1e12);
    return [...documents].sort((a, b) => score(a) - score(b));
  }, [documents, study.study_date]);
  const save = async () => {
    setBusy(true);
    try { await setStudyReport(study.id, choice || null); onSaved(choice || null); toast.success(choice ? "Report linked." : "Report unlinked."); }
    catch { toast.error("That didn't save. Please try again."); }
    finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 space-y-4">
        <div>
          <h2 className="font-heading text-xl text-foreground">Link the radiology report</h2>
          <p className="text-sm text-muted-foreground mt-1">Doctors will see the report next to {study.title || "this scan"}.</p>
        </div>
        <select value={choice} onChange={(e) => setChoice(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm">
          <option value="">No report</option>
          {sorted.map((d) => <option key={d.id} value={d.id}>{d.name}{d.date ? ` (${fmtDate(d.date)})` : ""}</option>)}
        </select>
        {!documents.length && <p className="text-xs text-muted-foreground">Upload the report in Documents first, then link it here.</p>}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-border text-sm">Cancel</button>
          <button type="button" onClick={() => void save()} disabled={busy} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">Save</button>
        </div>
      </div>
    </div>
  );
}

export default ScansSection;
