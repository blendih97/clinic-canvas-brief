import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { Upload, CheckCircle, AlertTriangle, FileText, X, Loader2, Shield, FileImage } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ACCEPTED_TYPES = ".pdf,.jpg,.jpeg,.png,.tif,.tiff,.dcm,.dicom,.mp4,.mov,.avi,.doc,.docx";
const ACCEPTED_LABEL = "PDF · JPEG · PNG · TIFF · DICOM (.dcm) · MP4 · MOV · AVI · DOC · DOCX";

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

  useEffect(() => {
    const loadRequest = async () => {
      if (!token) { setNotFound(true); setLoading(false); return; }
      const { data, error } = await supabase.from("record_requests").select("*").eq("token", token).maybeSingle();
      if (error || !data) { setNotFound(true); setLoading(false); return; }
      if (new Date(data.expires_at) < new Date()) { setExpired(true); setLoading(false); return; }
      if (data.status === "received") { setAlreadyReceived(true); setLoading(false); return; }
      if (data.status === "pending") {
        await supabase.from("record_requests").update({ status: "link_opened" }).eq("id", data.id);
      }
      setRequest(data);
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

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentFile(file.name);

        const fd = new FormData();
        fd.append("token", token!);
        fd.append("file", file);
        fd.append("totalFiles", String(files.length));
        fd.append("isLast", String(i === files.length - 1));

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
          body: fd,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Upload failed (${res.status})`);
        }
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      setUploaded(true);
    } catch (e: any) {
      console.error("Upload error:", e);
      alert("Upload failed: " + (e?.message || "Please try again."));
    } finally {
      setUploading(false);
    }
  };

  const firstName = request?.patient_name?.split(" ")[0] || "the patient";

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

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <FileImage className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-foreground">For radiology & medical records teams</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  You can upload scan images directly in <strong>DICOM (.dcm)</strong> format, as well as reports, photos, and video studies. Multiple files supported.
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
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-foreground font-medium">Drop files here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1.5">{ACCEPTED_LABEL}</p>
          </div>

          {files.length > 0 && (
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
