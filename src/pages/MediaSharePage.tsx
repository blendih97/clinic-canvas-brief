import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Download, AlertTriangle, FileText, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const MediaSharePage = () => {
  const { token } = useParams<{ token: string }>();
  const [share, setShare] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadShare = async () => {
      if (!token) { setNotFound(true); setLoading(false); return; }
      const { data, error } = await supabase.from("media_shares").select("*").eq("token", token).maybeSingle();
      if (error || !data) { setNotFound(true); setLoading(false); return; }
      if (new Date(data.expires_at) < new Date()) { setExpired(true); setLoading(false); return; }
      setShare(data);
      setLoading(false);
    };
    loadShare();
  }, [token]);

  const handleDownload = () => {
    if (share?.file_path) {
      const a = document.createElement("a");
      a.href = share.file_path;
      a.download = share.file_path.split("/").pop() || "file";
      a.target = "_blank";
      a.click();
    }
  };

  const fileName = share?.file_path?.split("/").pop() || "Medical File";
  const isImage = /\.(jpg|jpeg|png|tiff|webp)$/i.test(fileName);
  const isDicom = /\.(dcm|dicom)$/i.test(fileName);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="font-heading text-2xl font-light tracking-[0.15em] gold-gradient-text">RinVita</h1>
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (notFound || expired) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-xl p-8 max-w-md text-center">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <h2 className="font-heading text-xl text-foreground mb-2">{notFound ? "Link Not Found" : "Link Expired"}</h2>
          <p className="text-sm text-muted-foreground">{notFound ? "This share link is invalid." : "This share link has expired."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg">
        <div className="p-6 border-b border-border">
          <h1 className="font-heading text-2xl font-light tracking-[0.15em] gold-gradient-text mb-1">RinVita</h1>
          <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">Shared Medical File</p>
        </div>
        <div className="p-6 space-y-5">
          <div className="aspect-video bg-muted/50 rounded-lg flex items-center justify-center overflow-hidden">
            {isImage && share?.file_path ? (
              <img src={share.file_path} alt={fileName} className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="text-center text-muted-foreground">
                {isDicom ? <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" /> : <Image className="w-10 h-10 mx-auto mb-2 opacity-40" />}
                <p className="text-sm font-medium">{fileName}</p>
                {isDicom && <p className="text-xs mt-1">DICOM file — download to view in PACS</p>}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">File</span><span className="text-foreground">{fileName}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Shared</span><span className="text-foreground">{new Date(share.created_at).toLocaleDateString()}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Expires</span><span className="text-foreground">{new Date(share.expires_at).toLocaleDateString()}</span></div>
          </div>
          <button onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Download className="w-4 h-4" /> Download Original File
          </button>
          <p className="text-[10px] text-muted-foreground text-center">
            This file is shared via RinVita. Original file integrity is preserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MediaSharePage;
