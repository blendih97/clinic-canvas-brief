import { useState, useMemo, useEffect } from "react";
import { Play, Image, Upload, FileText, Search, Download, Share2, X, Film, Camera, Heart, Zap } from "lucide-react";
import { useVaultStore } from "@/store/vaultStore";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type FilterType = "all" | "imaging" | "cardiac" | "video" | "photos";

interface MediaItem {
  id: string;
  name: string;
  type: string;
  fileType: "image" | "video" | "dicom" | "ecg";
  badge: string;
  region: string;
  facility: string;
  date: string;
  country: string;
  fileUrl?: string;
  filePath?: string;
}

const countryFlags: Record<string, string> = { UAE: "🇦🇪", UK: "🇬🇧", Qatar: "🇶🇦", Switzerland: "🇨🇭", USA: "🇺🇸" };

const fileTypeBadgeColors: Record<string, string> = {
  MRI: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "X-Ray": "bg-amber-500/10 text-amber-600 border-amber-500/20",
  CT: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  Echo: "bg-red-500/10 text-red-600 border-red-500/20",
  ECG: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Photo: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  Video: "bg-pink-500/10 text-pink-600 border-pink-500/20",
};

const MediaSection = ({ onRequestRecords, onUpload }: { onRequestRecords?: () => void; onUpload?: () => void }) => {
  const { documents } = useVaultStore();
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [sharing, setSharing] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  // Derive media items from documents and imaging results
  const mediaItems: MediaItem[] = useMemo(() => {
    const items: MediaItem[] = [];

    // Only include files with actual visual/playable file extensions
    documents.forEach((doc) => {
      const name = doc.name.toLowerCase();
      const url = (doc.fileUrl || "").toLowerCase();

      const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|tiff|tif)$/i.test(name) || /\.(jpg|jpeg|png|gif|bmp|webp|tiff|tif)$/i.test(url);
      const isVideo = /\.(mp4|mov|avi|mkv)$/i.test(name) || /\.(mp4|mov|avi|mkv)$/i.test(url);
      const isDicom = /\.(dcm|dicom)$/i.test(name) || /\.(dcm|dicom)$/i.test(url);

      // Only actual visual/playable files — no PDFs, DOCs, or text reports
      if (!isImage && !isVideo && !isDicom) return;

      let fileType: MediaItem["fileType"] = "image";
      let badge = "Photo";
      const type = (doc.type || "").toLowerCase();

      if (isVideo) { fileType = "video"; badge = "Video"; }
      else if (isDicom) { fileType = "dicom"; badge = "DICOM"; }
      else if (type.includes("mri")) badge = "MRI";
      else if (type.includes("ct")) badge = "CT";
      else if (type.includes("x-ray") || type.includes("xray")) badge = "X-Ray";
      else if (type.includes("echo") || type.includes("cardiac")) badge = "Echo";
      else if (type.includes("ecg")) badge = "ECG";

      items.push({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        fileType,
        badge,
        region: type,
        facility: doc.facility,
        date: doc.date,
        country: doc.country,
        fileUrl: doc.fileUrl,
        filePath: doc.filePath,
      });
    });

    return items;
  }, [documents]);

  // Resolve signed URLs for storage-backed media files
  useEffect(() => {
    let cancelled = false;
    const toResolve = mediaItems.filter((item) => {
      const path = item.filePath || item.fileUrl;
      if (!path) return false;
      if (path.startsWith("http")) return false;
      if (signedUrls[item.id]) return false;
      return true;
    });
    if (toResolve.length === 0) return;

    (async () => {
      const entries = await Promise.all(
        toResolve.map(async (item) => {
          const path = item.filePath || item.fileUrl!;
          const { data } = await supabase.storage
            .from("medical-documents")
            .createSignedUrl(path, 3600);
          return [item.id, data?.signedUrl] as const;
        })
      );
      if (cancelled) return;
      setSignedUrls((prev) => {
        const next = { ...prev };
        for (const [id, url] of entries) if (url) next[id] = url;
        return next;
      });
    })();

    return () => { cancelled = true; };
  }, [mediaItems, signedUrls]);

  const resolveUrl = (item: MediaItem): string | undefined => {
    const raw = item.filePath || item.fileUrl;
    if (!raw) return undefined;
    if (raw.startsWith("http")) return raw;
    return signedUrls[item.id];
  };

  const filteredItems = useMemo(() => {
    let items = mediaItems;

    if (filter === "imaging") items = items.filter((i) => ["MRI", "X-Ray", "CT", "DICOM"].includes(i.badge));
    else if (filter === "cardiac") items = items.filter((i) => ["Echo", "ECG"].includes(i.badge));
    else if (filter === "video") items = items.filter((i) => i.fileType === "video");
    else if (filter === "photos") items = items.filter((i) => i.badge === "Photo");

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((i) =>
        i.facility.toLowerCase().includes(q) ||
        i.region.toLowerCase().includes(q) ||
        i.date.includes(q) ||
        i.name.toLowerCase().includes(q)
      );
    }

    return items;
  }, [mediaItems, filter, search]);

  const handleShare = async (item: MediaItem) => {
    if (!user || !item.fileUrl) return;
    setSharing(true);
    try {
      const shareToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase.from("media_shares").insert({
        user_id: user.id,
        file_path: item.fileUrl,
        token: shareToken,
        expires_at: expiresAt,
      });

      if (error) throw error;

      const shareUrl = `${window.location.origin}/media-share/${shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard");
    } catch (e) {
      console.error(e);
      toast.error("Failed to create share link");
    } finally {
      setSharing(false);
    }
  };

  const filters: { id: FilterType; label: string; icon: React.ElementType }[] = [
    { id: "all", label: "All", icon: FileText },
    { id: "imaging", label: "Imaging", icon: Image },
    { id: "cardiac", label: "Cardiac", icon: Heart },
    { id: "video", label: "Video", icon: Film },
    { id: "photos", label: "Photos", icon: Camera },
  ];

  // Empty state
  if (mediaItems.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="font-heading text-3xl font-light text-foreground">Media</h2>
          <p className="text-sm text-muted-foreground mt-2">Visual library for imaging, videos, and medical media</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Image className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="font-heading text-lg text-foreground mb-2">No media files yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Your imaging scans, echo videos, and medical photos will appear here once uploaded or received via a records request.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onUpload}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Upload className="w-4 h-4" /> Upload Document
            </button>
            <button
              onClick={onRequestRecords}
              className="flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-lg text-sm font-medium hover:border-primary/30 transition-colors"
            >
              <FileText className="w-4 h-4" /> Request Records
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-3xl font-light text-foreground">Media</h2>
        <p className="text-sm text-muted-foreground mt-2">Visual library for imaging, videos, and medical media</p>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === f.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <f.icon className="w-3 h-3" />
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by facility, region, date…"
            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Media grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const url = resolveUrl(item);
          return (
          <button
            key={item.id}
            onClick={() => setSelectedMedia(item)}
            className="text-left bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all group"
          >
            {/* Thumbnail */}
            <div className="aspect-[4/3] bg-muted/50 flex items-center justify-center relative">
              {url && item.fileType === "image" ? (
                <img src={url} alt={item.name} className="w-full h-full object-cover" />
              ) : item.fileType === "video" ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <div className="w-12 h-12 rounded-full bg-foreground/10 flex items-center justify-center">
                    <Play className="w-5 h-5" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Image className="w-8 h-8 opacity-40" />
                </div>
              )}
              {/* Badge */}
              <span className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full border font-medium ${fileTypeBadgeColors[item.badge] || "bg-muted text-muted-foreground border-border"}`}>
                {item.badge}
              </span>
            </div>
            {/* Info */}
            <div className="p-3">
              <p className="text-xs font-medium text-foreground truncate">{item.region || item.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{item.facility}</p>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-muted-foreground">{item.date}</span>
                {item.country && <span className="text-xs">{countryFlags[item.country] || "🌍"}</span>}
              </div>
            </div>
          </button>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground text-sm">
          No media files match your filters.
        </div>
      )}

      {/* Media Viewer Modal */}
      {selectedMedia && (
        <MediaViewerModal
          item={{ ...selectedMedia, fileUrl: resolveUrl(selectedMedia) || selectedMedia.fileUrl }}
          onClose={() => setSelectedMedia(null)}
          onShare={() => handleShare(selectedMedia)}
          sharing={sharing}
        />
      )}
    </div>
  );
};

// Viewer Modal
const MediaViewerModal = ({
  item,
  onClose,
  onShare,
  sharing,
}: {
  item: MediaItem;
  onClose: () => void;
  onShare: () => void;
  sharing: boolean;
}) => {
  const [brightness, setBrightness] = useState(100);

  const handleDownload = () => {
    if (item.fileUrl) {
      const a = document.createElement("a");
      a.href = item.fileUrl;
      a.download = item.name;
      a.target = "_blank";
      a.click();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/80 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-border rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-heading text-lg text-foreground">{item.name}</h3>
            <p className="text-xs text-muted-foreground">{item.facility} · {item.date}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 flex flex-col items-center justify-center min-h-[400px]">
          {item.fileType === "image" && item.fileUrl ? (
            <div className="max-w-full max-h-[60vh] overflow-auto">
              <img
                src={item.fileUrl}
                alt={item.name}
                className="max-w-full h-auto rounded"
                style={{ filter: `brightness(${brightness}%)` }}
              />
            </div>
          ) : item.fileType === "video" && item.fileUrl ? (
            <video controls className="max-w-full max-h-[60vh] rounded">
              <source src={item.fileUrl} />
              Your browser does not support video playback.
            </video>
          ) : item.fileType === "dicom" ? (
            <div className="text-center space-y-3">
              <Zap className="w-10 h-10 text-primary mx-auto opacity-60" />
              <h4 className="font-heading text-lg text-foreground">DICOM File</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Study: {item.name}</p>
                <p>Modality: {item.badge}</p>
                <p>Date: {item.date}</p>
                <p>Facility: {item.facility}</p>
              </div>
              <p className="text-xs text-primary bg-primary/5 border border-primary/10 rounded-lg p-3">
                DICOM viewer coming soon. Download the original file to view in your PACS system.
              </p>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <Image className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Preview not available</p>
              <p className="text-xs mt-1">Download the original file to view</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-border space-y-3">
          {item.fileType === "image" && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-20">Brightness</span>
              <input
                type="range"
                min={30}
                max={200}
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="text-xs text-muted-foreground w-10 text-right">{brightness}%</span>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              disabled={!item.fileUrl}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              <Download className="w-4 h-4" /> Download Original
            </button>
            <button
              onClick={onShare}
              disabled={!item.fileUrl || sharing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/5 transition-colors disabled:opacity-40"
            >
              <Share2 className="w-4 h-4" /> {sharing ? "Sharing…" : "Share"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaSection;
