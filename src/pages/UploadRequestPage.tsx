import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { Upload, CheckCircle, AlertTriangle, FileText, X, Loader2, Shield, FileImage, ShieldCheck, Download, FolderOpen } from "lucide-react";
import { buildConsentPdf, formatDob, formatSignedAt } from "@/lib/recordConsent";
import { supabase } from "@/integrations/supabase/client";
import { ingestDicom } from "@/lib/dicom/ingest";
import { completeRequest, isDicomCandidate, uploadStudiesForRequest } from "@/lib/dicom/requestUpload";

const ACCEPTED_TYPES = ".pdf,.jpg,.jpeg,.png,.tif,.tiff,.dcm,.dicom,.zip,.mp4,.mov,.avi,.doc,.docx";
const ACCEPTED_LABEL = "PDF · JPEG · PNG · TIFF · DICOM studies (folder, CD or ZIP) · MP4 · MOV · AVI · DOC · DOCX";
const relName = (f: File) => (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;

const UploadRequestPage = () => {
  const { token } = useParams<{ token: string }>();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [alreadyReceived, setAlreadyReceived] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadRequest = async () => {
      if (!token) { setNotFound(true); setLoading(false); return; }
      // Token-gated lookup via secure edge function (no broad anon RLS).
      const { data, error } = await supabase.functions.invoke("get-record-request", {
        body: { token },
      });
      const req = (data as any)?.request;
      if (error || !req) { setNotFound(true); setLoading(false); return; }
      if (new Date(req.expires_at) < new Date()) { setExpired(true); setLoading(false); return; }
      if (req.status === "received") { setAlreadyReceived(true); setLoading(false); return; }
      setRequest(req);
      setLoading(false);
    };
    loadRequest();
  }, [token]);


  const addFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    setFiles((prev) => [...prev, ...arr]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }, []);

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleUpload = async () => {
    if (!files.length || !request) return;
    setUploading(true);
    setProgress(0);
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const endpoint = `${SUPABASE_URL}/functions/v1/upload-record-request`;

      // Scan images (DICOM files, CD folders, ZIPs) go up as whole studies; everything else as documents.
      const scanFiles = files.filter((f) => isDicomCandidate({ name: relName(f), type: f.type }));
      const others = files.filter((f) => !scanFiles.includes(f));
      const share = others.length ? 0.6 : 1;
      let studiesSent = 0;
      if (scanFiles.length) {
        setCurrentFile("scan images (reading)");
        const read = await ingestDicom(scanFiles.map((f) => ({ name: relName(f), blob: f })), (d, t) => setProgress(Math.round((t ? d / t : 0) * 10 * share)));
        if (read.studies.length) {
          setCurrentFile(`${read.studies.length} ${read.studies.length === 1 ? "scan" : "scans"}`);
          studiesSent = await uploadStudiesForRequest(token!, read.studies, (d, t) => setProgress(Math.round((10 + (t ? d / t : 1) * 90) * share)));
        } else if (!others.length) {
          throw new Error("No DICOM images were found in the selected files.");
        }
      }

      for (let i = 0; i < others.length; i++) {
        const file = others[i];
        setCurrentFile(file.name);

        const fd = new FormData();
        fd.append("token", token!);
        fd.append("file", file);
        fd.append("totalFiles", String(others.length + studiesSent));
        fd.append("isLast", String(i === others.length - 1));

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
          body: fd,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Upload failed (${res.status})`);
        }
        const base = scanFiles.length ? 60 : 0;
        setProgress(Math.round(base + ((i + 1) / others.length) * (100 - base)));
      }
      if (!others.length && studiesSent) await completeRequest(token!, studiesSent);

      setProgress(100);
      setUploaded(true);
    } catch (e: any) {
      console.error("Upload error:", e);
      alert("Upload failed: " + (e?.message || "Please try again."));
    } finally {
      setUploading(false);
    }
  };

  const firstName = request?.patient_name?.split(" ")[0] || "the patient";

  const downloadConsent = async () => {
    if (!request?.consent_signed_name) return;
    const bytes = await buildConsentPdf({
      patientName: request.patient_name, patientEmail: request.patient_email || "", patientDob: request.patient_dob,
      providerName: request.provider_name, requestDescription: request.request_description,
      statement: request.consent_statement, signedName: request.consent_signed_name, signedAt: request.consent_signed_at, requestId: request.id,
    });
    const url = URL.createObjectURL(new Blob([bytes.slice()], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url; a.download = `Consent-to-release-${(request.patient_name || "patient").replace(/[^\w-]+/g, "-")}.pdf`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">{children}</div>
  );

  if (loading) {
    return (
      <Shell>
        <div className="text-center space-y-3">
          <h1 className="font-heading text-2xl font-light tracking-[0.15em] gold-gradient-text">RinVita</h1>
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </Shell>
    );
  }

  if (notFound) {
    return (
      <Shell>
        <div className="bg-card border border-border rounded-xl p-8 max-w-md text-center">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <h2 className="font-heading text-xl text-foreground mb-2">Request Not Found</h2>
          <p className="text-sm text-muted-foreground">This upload link is invalid or has been cancelled.</p>
        </div>
      </Shell>
    );
  }

  if (expired) {
    return (
      <Shell>
        <div className="bg-card border border-border rounded-xl p-8 max-w-md text-center">
          <AlertTriangle className="w-10 h-10 text-primary mx-auto mb-3" />
          <h2 className="font-heading text-xl text-foreground mb-2">Link Expired</h2>
          <p className="text-sm text-muted-foreground">This upload link has expired. Please contact the patient to send a new request.</p>
        </div>
      </Shell>
    );
  }

  if (alreadyReceived) {
    return (
      <Shell>
        <div className="bg-card border border-border rounded-xl p-8 max-w-md text-center">
          <CheckCircle className="w-10 h-10 text-primary mx-auto mb-3" />
          <h2 className="font-heading text-xl text-foreground mb-2">Already Uploaded</h2>
          <p className="text-sm text-muted-foreground">Files have already been uploaded for this request.</p>
        </div>
      </Shell>
    );
  }

  if (uploaded) {
    return (
      <Shell>
        <div className="bg-card border border-border rounded-xl p-8 max-w-md text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-primary" />
          </div>
          <h2 className="font-heading text-2xl text-foreground mb-2">Upload Complete</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your files have been securely delivered to your patient. Thank you.
          </p>
          <p className="text-xs text-muted-foreground mt-4">You can safely close this page.</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-sm">
        <div className="p-6 border-b border-border text-center">
          <h1 className="font-heading text-2xl font-light tracking-[0.15em] gold-gradient-text mb-1">RinVita</h1>
          <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">Secure Medical Records Upload</p>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-sm text-foreground">
              <span className="font-medium">{firstName}</span> has requested the following records via RinVita, their secure health record:
            </p>
            <div className="mt-3 p-4 bg-muted rounded-lg border border-border">
              <p className="text-sm text-foreground whitespace-pre-wrap">{request.request_description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="p-3 rounded-lg border border-border"><p className="text-[11px] text-muted-foreground">Patient</p><p className="text-foreground font-medium break-words">{request.patient_name}</p></div>
            <div className="p-3 rounded-lg border border-border"><p className="text-[11px] text-muted-foreground">Date of birth</p><p className="text-foreground font-medium">{request.patient_dob ? formatDob(request.patient_dob) : "Not given"}</p></div>
            <div className="p-3 rounded-lg border border-border"><p className="text-[11px] text-muted-foreground">Patient email</p><p className="text-foreground font-medium break-all">{request.patient_email || "Not given"}</p></div>
          </div>

          {request.consent_signed_name ? (
            <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium text-foreground">Signed consent to release</p>
              </div>
              <p className="text-xs text-foreground leading-relaxed">{request.consent_statement}</p>
              <div>
                <p className="font-heading italic text-2xl text-foreground">{request.consent_signed_name}</p>
                <p className="text-[11px] text-muted-foreground">Signed electronically from the patient's RinVita account · {formatSignedAt(request.consent_signed_at)}</p>
              </div>
              <button onClick={downloadConsent} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-background text-xs font-medium text-foreground hover:border-primary/40">
                <Download className="w-3.5 h-3.5" /> Download signed consent (PDF)
              </button>
            </div>
          ) : null}

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <FileImage className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-foreground">For radiology & medical records teams</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Upload whole <strong>DICOM studies</strong> (choose the study folder, the CD's contents or a ZIP) as well as reports, photos and video. Studies arrive in the patient's account complete, ready to view and share.
                </p>
              </div>
            </div>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
            } ${uploading ? "pointer-events-none opacity-60" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept={ACCEPTED_TYPES}
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
            <input
              ref={folderInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
              {...{ webkitdirectory: "", directory: "" }}
            />
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-foreground font-medium">Drop files here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1.5">{ACCEPTED_LABEL}</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); if (!uploading) folderInputRef.current?.click(); }}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-foreground hover:bg-muted"
            >
              <FolderOpen className="w-3.5 h-3.5" /> Choose a DICOM folder or CD
            </button>
          </div>

          {files.length > 8 && (
            <div className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
              <span className="text-sm text-foreground">{files.length} files · {(files.reduce((n, f) => n + f.size, 0) / 1024 / 1024).toFixed(1)} MB</span>
              {!uploading && <button onClick={() => setFiles([])} className="text-xs text-muted-foreground hover:text-destructive">Clear</button>}
            </div>
          )}
          {files.length > 0 && files.length <= 8 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground truncate">{f.name}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {(f.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  {!uploading && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      className="text-muted-foreground hover:text-destructive flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="truncate">Uploading {currentFile}…</span>
                <span className="flex-shrink-0 ml-2">{progress}%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!files.length || uploading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "Uploading securely…" : `Upload ${files.length || ""} ${files.length === 1 ? "File" : "Files"}`.trim()}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <Shield className="w-3 h-3" />
            <span>Encrypted in transit and at rest · No login required · Link expires in 30 days</span>
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default UploadRequestPage;
