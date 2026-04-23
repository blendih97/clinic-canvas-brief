import { useState, useMemo } from "react";
import { ScanLine, Languages, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Send, Link2Off, Link } from "lucide-react";
import { useVaultStore } from "@/store/vaultStore";
import { useAuth } from "@/hooks/useAuth";
import { hasAccess } from "@/lib/planAccess";
import { getImagingInsight } from "@/lib/insights";
import { dedupeImaging } from "@/lib/visitDedupe";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";
import RequestImagingModal from "@/components/RequestImagingModal";
import { toast } from "sonner";

const statusBadge = {
  normal: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  flagged: "bg-primary/10 text-primary border-primary/20",
};

const AnatomicalViewer = ({ region }: { region: string }) => {
  const regionHighlights: Record<string, { cx: number; cy: number; rx: number; ry: number }> = {
    "Lumbar Spine": { cx: 100, cy: 155, rx: 18, ry: 25 },
    "Chest": { cx: 100, cy: 80, rx: 35, ry: 30 },
    "Right Knee": { cx: 115, cy: 250, rx: 12, ry: 18 },
  };
  const hl = regionHighlights[region];

  return (
    <svg viewBox="0 0 200 320" className="w-full h-full max-h-[280px]" fill="none">
      <ellipse cx="100" cy="30" rx="20" ry="24" stroke="hsl(215, 15%, 75%)" strokeWidth="1" />
      <line x1="100" y1="54" x2="100" y2="180" stroke="hsl(215, 15%, 75%)" strokeWidth="1" />
      <line x1="100" y1="70" x2="55" y2="130" stroke="hsl(215, 15%, 75%)" strokeWidth="1" />
      <line x1="100" y1="70" x2="145" y2="130" stroke="hsl(215, 15%, 75%)" strokeWidth="1" />
      <line x1="90" y1="180" x2="75" y2="280" stroke="hsl(215, 15%, 75%)" strokeWidth="1" />
      <line x1="110" y1="180" x2="125" y2="280" stroke="hsl(215, 15%, 75%)" strokeWidth="1" />
      {[70, 85, 100, 115, 130, 145, 160].map((y) => (
        <rect key={y} x="96" y={y} width="8" height="5" rx="1" fill="hsl(215, 15%, 82%)" />
      ))}
      {hl && (
        <ellipse cx={hl.cx} cy={hl.cy} rx={hl.rx} ry={hl.ry} fill="hsl(42, 65%, 44%, 0.15)" stroke="hsl(42, 65%, 44%)" strokeWidth="1.5" strokeDasharray="4 2">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
        </ellipse>
      )}
    </svg>
  );
};

const ImagingSection = () => {
  const imagingResults = useVaultStore((s) => s.imagingResults);
  const imagingLinkOverrides = useVaultStore((s) => s.imagingLinkOverrides);
  const unlinkImaging = useVaultStore((s) => s.unlinkImaging);
  const relinkImaging = useVaultStore((s) => s.relinkImaging);
  const { profile, user } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAnatomy, setShowAnatomy] = useState(false);
  const [requestImagingOpen, setRequestImagingOpen] = useState(false);

  // Show deduped studies in the list (M2). Each merged row also surfaces the
  // raw duplicate ids so users can split them apart again.
  const dedupedStudies = useMemo(
    () => dedupeImaging(imagingResults, imagingLinkOverrides),
    [imagingResults, imagingLinkOverrides],
  );

  const selected =
    dedupedStudies.find((r) => r.id === selectedId) || dedupedStudies[0];

  const handleUnlink = async (primaryId: string, duplicateId: string) => {
    if (!user) return;
    await unlinkImaging(primaryId, duplicateId, user.id);
    toast.success("Study unlinked — it will appear separately on next refresh.");
  };

  const handleRelink = async () => {
    // Relink the most recent override (used as a quick "undo")
    const last = imagingLinkOverrides[imagingLinkOverrides.length - 1];
    if (!last) return;
    await relinkImaging(last.imaging_id_a, last.imaging_id_b);
    toast.success("Studies re-linked.");
  };

  const handleRequestImaging = () => {
    if (!hasAccess(profile, "request_imaging")) {
      window.dispatchEvent(new CustomEvent("show-upgrade", { detail: { feature: "request_imaging" } }));
      return;
    }
    setRequestImagingOpen(true);
  };

  const headerBlock = (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="font-heading text-3xl font-light text-foreground">Imaging</h2>
        <p className="text-sm text-muted-foreground mt-2">MRI, CT, and X-ray findings with anatomical mapping</p>
      </div>
      <button onClick={handleRequestImaging}
        className="shrink-0 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
        <Send className="w-4 h-4" />
        Request Imaging
      </button>
    </div>
  );

  if (imagingResults.length === 0) {
    return (
      <div className="space-y-8">
        {headerBlock}
        <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground text-sm">
          No imaging results yet. Request a scan from your radiology provider to get started.
        </div>
        <RequestImagingModal open={requestImagingOpen} onClose={() => setRequestImagingOpen(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {headerBlock}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Study list */}
        <div className="space-y-3">
          {dedupedStudies.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedId(r.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selected?.id === r.id ? "bg-card border-primary/40" : "bg-card border-border hover:border-primary/20"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-foreground">{r.type} — {r.region}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusBadge[r.status]}`}>
                  {r.status === "flagged" ? <AlertTriangle className="w-3 h-3 inline mr-1" /> : <CheckCircle className="w-3 h-3 inline mr-1" />}
                  {r.status}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">{r.facility} · {r.date}</p>
              <p className="text-[11px] text-muted-foreground mt-1.5 italic">{getImagingInsight(r.status)}</p>
              {r.originalLang && r.originalLang !== "English" && (
                <div className="flex items-center gap-1 mt-2">
                  <Languages className="w-3 h-3 text-primary" />
                  <span className="text-[10px] text-primary">Translated from {r.originalLang}</span>
                </div>
              )}
              {r.duplicateIds.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <p className="text-[10px] text-muted-foreground mb-1.5">
                    Auto-merged with {r.duplicateIds.length} other {r.duplicateIds.length === 1 ? "study" : "studies"}.
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {r.duplicateIds.map((dupId) => (
                      <button
                        key={dupId}
                        onClick={(e) => { e.stopPropagation(); handleUnlink(r.id, dupId); }}
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-muted hover:bg-destructive/10 hover:text-destructive border border-border transition-colors"
                      >
                        <Link2Off className="w-2.5 h-2.5" /> Unlink
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </button>
          ))}
          {imagingLinkOverrides.length > 0 && (
            <button
              onClick={handleRelink}
              className="w-full flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground py-2 border border-dashed border-border rounded-lg transition-colors"
            >
              <Link className="w-3 h-3" /> Undo last unlink
            </button>
          )}
        </div>

        {/* Anatomical viewer */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setShowAnatomy(!showAnatomy)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <span className="text-xs font-medium text-foreground">Anatomical View</span>
            {showAnatomy ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {showAnatomy && selected && (
            <div className="p-6 pt-0 flex items-center justify-center">
              <AnatomicalViewer region={selected.region} />
            </div>
          )}
        </div>

        {/* AI Analysis */}
        {selected && (
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <ScanLine className="w-4 h-4 text-primary" />
              <h3 className="font-heading text-lg text-foreground">AI Analysis</h3>
            </div>
            <div className="space-y-4 text-sm">
              <div><p className="text-[10px] tracking-wider text-muted-foreground uppercase mb-1">Study</p><p className="text-foreground">{selected.type} — {selected.region}</p></div>
              <div><p className="text-[10px] tracking-wider text-muted-foreground uppercase mb-1">Facility</p><p className="text-foreground">{selected.facility}</p></div>
              <div><p className="text-[10px] tracking-wider text-muted-foreground uppercase mb-1">Date</p><p className="text-foreground">{selected.date}</p></div>
              {selected.originalLang !== "English" && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-1">
                    <Languages className="w-3 h-3 text-primary" />
                    <span className="text-[10px] text-primary">Auto-translated from {selected.originalLang}</span>
                  </div>
                </div>
              )}
              <div><p className="text-[10px] tracking-wider text-muted-foreground uppercase mb-1">Findings</p><p className="text-foreground/80 leading-relaxed">{selected.finding}</p></div>
              <p className="text-[11px] text-muted-foreground italic">{getImagingInsight(selected.status)}</p>
            </div>
            <MedicalDisclaimer />
          </div>
        )}
      </div>

      <MedicalDisclaimer />
      <RequestImagingModal open={requestImagingOpen} onClose={() => setRequestImagingOpen(false)} />
    </div>
  );
};

export default ImagingSection;
