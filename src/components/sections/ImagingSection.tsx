import { useState } from "react";
import { ScanLine, Languages, AlertTriangle, CheckCircle } from "lucide-react";
import { imagingResults } from "@/data/mockData";

const statusBadge = {
  normal: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
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
      {/* Simplified body outline */}
      <ellipse cx="100" cy="30" rx="20" ry="24" stroke="hsl(42, 30%, 30%)" strokeWidth="1" />
      <line x1="100" y1="54" x2="100" y2="180" stroke="hsl(42, 30%, 30%)" strokeWidth="1" />
      <line x1="100" y1="70" x2="55" y2="130" stroke="hsl(42, 30%, 30%)" strokeWidth="1" />
      <line x1="100" y1="70" x2="145" y2="130" stroke="hsl(42, 30%, 30%)" strokeWidth="1" />
      <line x1="90" y1="180" x2="75" y2="280" stroke="hsl(42, 30%, 30%)" strokeWidth="1" />
      <line x1="110" y1="180" x2="125" y2="280" stroke="hsl(42, 30%, 30%)" strokeWidth="1" />
      {/* Spine */}
      {[70, 85, 100, 115, 130, 145, 160].map((y) => (
        <rect key={y} x="96" y={y} width="8" height="5" rx="1" fill="hsl(42, 30%, 25%)" />
      ))}
      {/* Highlight */}
      {hl && (
        <ellipse cx={hl.cx} cy={hl.cy} rx={hl.rx} ry={hl.ry} fill="hsl(42, 65%, 44%, 0.15)" stroke="hsl(42, 65%, 44%)" strokeWidth="1.5" strokeDasharray="4 2">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
        </ellipse>
      )}
    </svg>
  );
};

const ImagingSection = () => {
  const [selected, setSelected] = useState(imagingResults[0]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-3xl font-light text-cream">Imaging</h2>
        <p className="text-sm text-muted-foreground mt-1">MRI, CT, and X-ray findings with anatomical mapping</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* List */}
        <div className="space-y-2">
          {imagingResults.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selected.id === r.id
                  ? "bg-card border-primary/40"
                  : "bg-card/50 border-border hover:border-primary/20"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-cream">{r.type} — {r.region}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusBadge[r.status]}`}>
                  {r.status === "flagged" ? <AlertTriangle className="w-3 h-3 inline mr-1" /> : <CheckCircle className="w-3 h-3 inline mr-1" />}
                  {r.status}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">{r.facility} · {r.date}</p>
              {r.originalLang !== "English" && (
                <div className="flex items-center gap-1 mt-1.5">
                  <Languages className="w-3 h-3 text-primary" />
                  <span className="text-[10px] text-primary">Translated from {r.originalLang}</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Anatomical viewer */}
        <div className="bg-card border border-border rounded-lg p-6 flex items-center justify-center">
          <AnatomicalViewer region={selected.region} />
        </div>

        {/* Analysis panel */}
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <ScanLine className="w-4 h-4 text-primary" />
            <h3 className="font-heading text-lg text-cream">AI Analysis</h3>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[10px] tracking-wider text-muted-foreground uppercase mb-1">Study</p>
              <p className="text-sm text-cream">{selected.type} — {selected.region}</p>
            </div>
            <div>
              <p className="text-[10px] tracking-wider text-muted-foreground uppercase mb-1">Facility</p>
              <p className="text-sm text-cream">{selected.facility}</p>
            </div>
            <div>
              <p className="text-[10px] tracking-wider text-muted-foreground uppercase mb-1">Date</p>
              <p className="text-sm text-cream">{selected.date}</p>
            </div>
            {selected.originalLang !== "English" && (
              <div className="p-2 rounded bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-1 mb-1">
                  <Languages className="w-3 h-3 text-primary" />
                  <span className="text-[10px] text-primary">Auto-translated from {selected.originalLang}</span>
                </div>
              </div>
            )}
            <div>
              <p className="text-[10px] tracking-wider text-muted-foreground uppercase mb-1">Findings</p>
              <p className="text-sm text-cream/80 leading-relaxed">{selected.finding}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagingSection;
