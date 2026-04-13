import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { Upload, CheckCircle, AlertTriangle, FileText, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const UploadRequestPage = () => {
  const { token } = useParams<{ token: string }>();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [alreadyReceived, setAlreadyReceived] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadRequest = async () => {
      if (!token) { setNotFound(true); setLoading(false); return; }

      const { data, error } = await supabase
        .from("record_requests")
        .select("*")
        .eq("token", token)
        .maybeSingle();

      if (error || !data) { setNotFound(true); setLoading(false); return; }

      if (new Date(data.expires_at) < new Date()) { setExpired(true); setLoading(false); return; }
      if (data.status === "received") { setAlreadyReceived(true); setLoading(false); return; }

      // Mark as link_opened
      if (data.status === "pending") {
        await supabase.from("record_requests").update({ status: "link_opened" }).eq("id", data.id);
      }

      setRequest(data);
      setLoading(false);
    };
    loadRequest();
  }, [token]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleUpload = async () => {
    if (!file || !request) return;
    setUploading(true);

    try {
      const filePath = `${request.user_id}/received-requests/${request.id}/${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("medical-documents")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("medical-documents")
        .getPublicUrl(filePath);

      // Update request status
      await supabase.from("record_requests").update({ status: "received" }).eq("id", request.id);

      // Create document entry for patient
      await supabase.from("documents").insert({
        user_id: request.user_id,
        name: file.name,
        type: "Received Records",
        date: new Date().toISOString().split("T")[0],
        facility: request.provider_name,
        country: "",
        pages: 1,
        extracted: false,
        file_url: urlData.publicUrl,
        ai_note: `Received via request from ${request.provider_name}`,
      });

      setUploaded(true);
    } catch (e: any) {
      console.error("Upload error:", e);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const firstName = request?.patient_name?.split(" ")[0] || "the patient";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="font-heading text-2xl font-light tracking-[0.2em] gold-gradient-text">VAULT</h1>
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-xl p-8 max-w-md text-center">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <h2 className="font-heading text-xl text-foreground mb-2">Request Not Found</h2>
          <p className="text-sm text-muted-foreground">This upload link is invalid or has been cancelled.</p>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-xl p-8 max-w-md text-center">
          <AlertTriangle className="w-10 h-10 text-primary mx-auto mb-3" />
          <h2 className="font-heading text-xl text-foreground mb-2">Link Expired</h2>
          <p className="text-sm text-muted-foreground">This upload link has expired. Please contact the patient to send a new request.</p>
        </div>
      </div>
    );
  }

  if (alreadyReceived) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-xl p-8 max-w-md text-center">
          <CheckCircle className="w-10 h-10 text-primary mx-auto mb-3" />
          <h2 className="font-heading text-xl text-foreground mb-2">Already Uploaded</h2>
          <p className="text-sm text-muted-foreground">Files have already been uploaded for this request.</p>
        </div>
      </div>
    );
  }

  if (uploaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-xl p-8 max-w-md text-center">
          <CheckCircle className="w-10 h-10 text-primary mx-auto mb-3" />
          <h2 className="font-heading text-xl text-foreground mb-2">Upload Complete</h2>
          <p className="text-sm text-muted-foreground">
            The records have been securely uploaded to {firstName}'s health vault. You can close this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg">
        <div className="p-6 border-b border-border">
          <h1 className="font-heading text-2xl font-light tracking-[0.15em] gold-gradient-text mb-1">VAULT</h1>
          <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">Secure Medical Records Upload</p>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-sm text-foreground">
              <span className="font-medium">{firstName}</span> has requested the following records:
            </p>
            <div className="mt-3 p-4 bg-muted rounded-lg">
              <p className="text-sm text-foreground">{request.request_description}</p>
            </div>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer ${
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif,.dcm,.mp4,.avi,.mov,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-sm text-foreground">{file.name}</span>
                <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-muted-foreground hover:text-destructive">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-foreground font-medium">Drop files here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, JPEG, PNG, DICOM, MP4, Word documents accepted
                </p>
              </>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "Uploading securely…" : "Upload Records"}
          </button>

          <p className="text-[10px] text-muted-foreground text-center">
            All files are transmitted securely and encrypted. No login required.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UploadRequestPage;
