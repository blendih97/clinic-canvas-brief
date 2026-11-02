import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Plus, ScanLine, Share2, Download, Trash2, HelpCircle, FileText, Pencil, Copy, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useVaultStore } from "@/store/vaultStore";
import {
  listStudies, loadOwnStudy, deleteStudy, formatBytes, formatStudyDate, type ImagingStudy, type ViewerStudy,
} from "@/lib/imaging/api";
import { downloadOriginalStudy } from "@/lib/imaging/download";
import AddImagingDialog from "./AddImagingDialog";
import ImagingStudyPicker from "./ImagingStudyPicker";
import PhotoViewer from "./PhotoViewer";

const DicomViewer = lazy(() => import("./DicomViewer"));

const EXPIRIES = [
  { id: "24h", label: "24 hours", seconds: 86400 },
  { id: "7d", label: "7 days", seconds: 604800 },
  { id: "30d", label: "30 days", seconds: 2592000 },
];

const REQUEST_TEMPLATE = `Dear Medical Records / Radiology Department,

Under data protection law I am requesting a copy of my imaging and the radiologist's report:

Full name:
Date of birth:
Hospital / patient number (if known):
Scan type and body part (e.g. MRI brain):
Approximate date of scan:

Please provide the complete original study in DICOM format (all series and images, not screenshots or a JPEG preview), together with the final radiology report, either by secure download link or on CD/USB.

Thank you,
`;

export default function ImagingVault({ canShare, onOpenDocuments }: { canShare: boolean; onOpenDocuments?: () => void }) {
  const documents = useVaultStore(s => s.documents) as { id: string; name: string }[];
  const [studies, setStudies] = useState<ImagingStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [viewing, setViewing] = useState<ViewerStudy | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareIds, setShareIds] = useState<string[]>([]);
  const [shareDownload, setShareDownload] = useState(false);
  const [shareExpiry, setShareExpiry] = useState("7d");
  const [shareLink, setShareLink] = useState<{ url: string; token: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revoked, setRevoked] = useState(false);

  const refresh = useCallback(async () => {
    try { setStudies(await listStudies()); } catch { toast.error("Couldn't load your imaging."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const open = async (s: ImagingStudy) => {
    try { setViewing(await loadOwnStudy(s)); } catch { toast.error("Couldn't open this study."); }
  };

  const download = async (s: ViewerStudy) => {
    setDownloading("Preparing…");
    try {
      await downloadOriginalStudy(s, { mode: "owner" }, (d, t) => setDownloading(`${d} / ${t} files`));
      toast.success("Original study downloaded.");
    } catch { toast.error("Download failed. Please try again."); }
    finally { setDownloading(null); }
  };

  const rename = async (s: ImagingStudy) => {
    const label = window.prompt("Name this study", s.label)?.trim();
    if (!label || label === s.label) return;
    const { error } = await (supabase as any).from("imaging_studies").update({ label: label.slice(0, 80), label_auto: false }).eq("id", s.id);
    if (error) toast.error("Couldn't rename."); else void refresh();
  };

  const attachReport = async (s: ImagingStudy, documentId: string) => {
    const { error } = await (supabase as any).from("imaging_studies").update({ report_document_id: documentId || null }).eq("id", s.id);
    if (error) toast.error("Couldn't link the report."); else { toast.success("Report linked."); void refresh(); }
  };

  const remove = async (s: ImagingStudy) => {
    if (!window.confirm(`Delete "${s.label}" and its original files from RinVita? This can't be undone.`)) return;
    try { await deleteStudy(s.id); toast.success("Study deleted."); void refresh(); } catch { toast.error("Couldn't delete. Please try again."); }
  };

  const createShare = async () => {
    setCreating(true);
    const { data: auth } = await supabase.auth.getUser();
    const token = crypto.randomUUID();
    const expiry = EXPIRIES.find(e => e.id === shareExpiry)!;
    const { error } = await (supabase as any).from("shared_briefs").insert({
      token, user_id: auth.user?.id, scope: "Imaging",
      expires_at: new Date(Date.now() + expiry.seconds * 1000).toISOString(),
      blood_results: [], medications: [], allergies: [], imaging_results: [],
      imaging_study_ids: shareIds, allow_imaging_download: shareDownload,
    });
    setCreating(false);
    if (error) { toast.error("Couldn't create the link."); return; }
    setShareLink({ url: `${window.location.origin}/share/${token}`, token }); setRevoked(false);
  };

  const revoke = async () => {
    if (!shareLink) return;
    const { data, error } = await supabase.rpc("revoke_shared_brief" as any, { _token: shareLink.token });
    if (!error && data) { setRevoked(true); toast.success("Access revoked. Any open viewer stops loading images immediately."); }
  };

  return (
    <section className="space-y-4" data-testid="imaging-vault">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-heading text-xl text-foreground">Your scans</h3>
          <p className="text-xs text-muted-foreground">Original MRI, CT, X-ray and ultrasound images, viewable in your browser.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canShare && studies.some(s => s.status !== "uploading") && (
            <button onClick={() => { setShareIds([]); setShareLink(null); setShareDownload(false); setShareOpen(true); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm hover:border-primary/40">
              <Share2 className="w-4 h-4 text-primary" />Share imaging
            </button>
          )}
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium" data-testid="add-imaging">
            <Plus className="w-4 h-4" />Add imaging
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : studies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <ScanLine className="w-7 h-7 text-primary mx-auto mb-2" />
          <p className="text-sm text-foreground">No scans yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add the files from your hospital CD, USB stick or download link.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {studies.map(s => {
            const report = documents.find(d => d.id === s.report_document_id);
            return (
              <div key={s.id} className="rounded-xl border border-border bg-card p-4 space-y-2" data-testid="study-card">
                <button className="text-left w-full" onClick={() => open(s)} disabled={s.status === "uploading"}>
                  <p className="text-base font-medium text-foreground">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{formatStudyDate(s.study_date)}{s.institution ? ` · ${s.institution}` : ""}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.series_count} series · {s.image_count} {s.kind === "image" ? (s.image_count === 1 ? "photo" : "photos") : (s.image_count === 1 ? "image" : "images")} · {formatBytes(s.total_bytes)}</p>
                  {s.status === "partial" && <p className="text-[11px] text-primary mt-1">Some files can't be shown in the browser, but all originals are kept.</p>}
                  {s.status === "uploading" && <p className="text-[11px] text-muted-foreground mt-1">Still being added…</p>}
                </button>
                <div className="flex items-center gap-1.5 text-xs">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <select value={s.report_document_id ?? ""} onChange={e => attachReport(s, e.target.value)} className="flex-1 bg-transparent text-xs text-muted-foreground border-0 p-0 focus:ring-0" aria-label="Radiology report">
                    <option value="">{report ? "Unlink report" : "Link a radiology report…"}</option>
                    {documents.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  <button onClick={() => open(s)} className="px-2.5 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium">View</button>
                  <button onClick={async () => download(await loadOwnStudy(s))} className="px-2.5 py-1.5 rounded-md border border-border text-xs flex items-center gap-1"><Download className="w-3 h-3" />Original</button>
                  <button onClick={() => rename(s)} aria-label="Rename" className="p-1.5 rounded-md border border-border"><Pencil className="w-3 h-3" /></button>
                  <button onClick={() => remove(s)} aria-label="Delete" className="p-1.5 rounded-md border border-border"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button onClick={() => setHelpOpen(true)} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
        <HelpCircle className="w-3.5 h-3.5" />Don't have your images?
      </button>

      <AddImagingDialog open={addOpen} onOpenChange={setAddOpen} onComplete={refresh} onOpenDocuments={onOpenDocuments} />

      <Dialog open={!!viewing} onOpenChange={o => !o && setViewing(null)}>
        <DialogContent className="max-w-6xl w-[96vw] h-[90vh] p-0 overflow-hidden [&>button]:hidden">
          <DialogTitle className="sr-only">{viewing?.label}</DialogTitle>
          {viewing && (viewing.kind === "image"
            ? <PhotoViewer study={viewing} auth={{ mode: "owner" }} onClose={() => setViewing(null)} onDownload={() => download(viewing)} downloading={downloading} />
            : <Suspense fallback={<div className="p-6 text-sm">Loading viewer…</div>}>
                <DicomViewer study={viewing} auth={{ mode: "owner" }} onClose={() => setViewing(null)} onDownload={() => download(viewing)} downloading={downloading} />
              </Suspense>)}
        </DialogContent>
      </Dialog>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-light">Share imaging</DialogTitle>
            <DialogDescription>Creates a private link for one doctor. They can open the actual scans in their browser, with no account or software needed.</DialogDescription>
          </DialogHeader>
          {!shareLink ? (
            <div className="space-y-4">
              <ImagingStudyPicker studies={studies} selected={shareIds} onChange={setShareIds} allowDownload={shareDownload} onAllowDownload={setShareDownload} />
              <div>
                <p className="text-xs font-medium mb-1.5">Link expires after</p>
                <div className="grid grid-cols-3 gap-2">
                  {EXPIRIES.map(e => (
                    <button key={e.id} onClick={() => setShareExpiry(e.id)} className={`px-2 py-2 rounded-lg text-xs border ${shareExpiry === e.id ? "bg-primary/10 border-primary/40" : "border-border"}`}>{e.label}</button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">The link opens for the first person who uses it. You can revoke it at any time, including while it's open.</p>
              <button onClick={createShare} disabled={!shareIds.length || creating} className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40">
                {creating ? "Creating…" : "Create link"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-2 rounded-lg border border-border">
                <code className={`flex-1 text-xs truncate ${revoked ? "line-through text-muted-foreground" : ""}`}>{shareLink.url}</code>
                <button disabled={revoked} onClick={() => { void navigator.clipboard.writeText(shareLink.url); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="p-1.5 rounded-md border border-border">
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              {revoked ? <p className="text-xs text-muted-foreground">Revoked. The link no longer opens.</p>
                : <button onClick={revoke} className="w-full px-4 py-2 rounded-lg border border-border text-sm">Revoke access</button>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-light">Getting your scans</DialogTitle>
            <DialogDescription>RinVita can't fetch images from hospitals for you, but you have the right to a copy.</DialogDescription>
          </DialogHeader>
          <ol className="list-decimal pl-5 space-y-1.5 text-sm text-foreground">
            <li>Contact the hospital's medical records or radiology department where the scan was done.</li>
            <li>Ask for the <b>complete original study in DICOM format</b> and the <b>radiologist's report</b>. A screenshot or JPEG preview isn't enough for another doctor.</li>
            <li>When you receive a CD, USB stick or download, use <b>Add imaging</b> and choose the whole folder.</li>
          </ol>
          <p className="text-xs text-muted-foreground">In the UK, hospitals usually respond within one month and copies are normally free.</p>
          <textarea defaultValue={REQUEST_TEMPLATE} rows={14} className="w-full text-xs p-3 rounded-lg border border-border bg-background font-mono" aria-label="Request template" id="imaging-request-template" />
          <button onClick={() => { const t = (document.getElementById("imaging-request-template") as HTMLTextAreaElement).value; void navigator.clipboard.writeText(t); toast.success("Copied. Paste it into an email to the hospital."); }}
            className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Copy request</button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
