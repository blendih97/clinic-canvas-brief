import { useState } from "react";
import { LayoutGrid, List, TrendingUp, TrendingDown, Minus, Pin } from "lucide-react";
import { useVaultStore } from "@/store/vaultStore";
import { useAuth } from "@/hooks/useAuth";
import { getBloodInsight } from "@/lib/insights";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";

const statusColors = {
  normal: { badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", border: "border-l-emerald-500" },
  flagged: { badge: "bg-primary/10 text-primary border-primary/20", border: "border-l-primary" },
  critical: { badge: "bg-destructive/10 text-destructive border-destructive/20", border: "border-l-destructive" },
};

const Sparkline = ({ data, status }: { data: number[]; status: string }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 20;
  const w = 48;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  const color = status === "critical" ? "#ef4444" : status === "flagged" ? "#B8952A" : "#22c55e";

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const TrendIcon = ({ data }: { data: number[] }) => {
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  if (last > prev) return <TrendingUp className="w-3 h-3 text-primary" />;
  if (last < prev) return <TrendingDown className="w-3 h-3 text-emerald-500" />;
  return <Minus className="w-3 h-3 text-muted-foreground" />;
};

interface BloodResultsSectionProps {
  pinnedIds?: Set<string>;
  onTogglePin?: (id: string) => void;
}

const BloodResultsSection = ({ pinnedIds, onTogglePin }: BloodResultsSectionProps) => {
  const [view, setView] = useState<"card" | "table">("table");
  const bloodResults = useVaultStore((s) => s.bloodResults);
  const { profile } = useAuth();
  const sex = (profile as any)?.biological_sex as string | null;

  if (bloodResults.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="font-heading text-3xl font-light text-foreground">Blood Results</h2>
          <p className="text-sm text-muted-foreground mt-2">Upload a lab report to see extracted biomarkers here.</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground text-sm">
          No blood results yet.
        </div>
      </div>
    );
  }

  const renderRange = (range: string) => {
    if (!sex) {
      return (
        <span>
          {range}
          <span className="block text-[9px] text-muted-foreground mt-0.5">Complete your profile to see your personalised range.</span>
        </span>
      );
    }
    return range;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-3xl font-light text-foreground">Blood Results</h2>
          <p className="text-sm text-muted-foreground mt-2">Extracted biomarkers from uploaded lab reports</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          <button onClick={() => setView("card")} className={`p-1.5 rounded ${view === "card" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setView("table")} className={`p-1.5 rounded ${view === "table" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {view === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {bloodResults.map((r) => (
            <div key={r.id} className={`bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors border-l-4 ${statusColors[r.status].border}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.marker}</p>
                  <p className="text-[10px] text-muted-foreground">{r.source}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {onTogglePin && (
                    <button onClick={() => onTogglePin(r.id)} className={`p-1 rounded hover:bg-muted ${pinnedIds?.has(r.id) ? "text-primary" : "text-muted-foreground"}`}>
                      <Pin className="w-3 h-3" />
                    </button>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColors[r.status].badge}`}>
                    {r.status}
                  </span>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-lg font-medium text-foreground">
                    {r.value}
                    <span className="text-xs text-muted-foreground ml-1">{r.unit}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">Range: {renderRange(r.range)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Sparkline data={r.trend} status={r.status} />
                  <div className="flex items-center gap-1">
                    <TrendIcon data={r.trend} />
                    <span className="text-[10px] text-muted-foreground">{r.date}</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed italic">
                {getBloodInsight(r.status, r.trend)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="p-4 text-[10px] tracking-wider text-muted-foreground uppercase font-medium">Marker</th>
                <th className="p-4 text-[10px] tracking-wider text-muted-foreground uppercase font-medium">Value</th>
                <th className="p-4 text-[10px] tracking-wider text-muted-foreground uppercase font-medium">Range</th>
                <th className="p-4 text-[10px] tracking-wider text-muted-foreground uppercase font-medium">Status</th>
                <th className="p-4 text-[10px] tracking-wider text-muted-foreground uppercase font-medium">Trend</th>
                <th className="p-4 text-[10px] tracking-wider text-muted-foreground uppercase font-medium">Insight</th>
                <th className="p-4 text-[10px] tracking-wider text-muted-foreground uppercase font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {bloodResults.map((r) => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                  <td className="p-4 text-sm text-foreground font-medium">{r.marker}</td>
                  <td className="p-4 text-sm text-foreground">{r.value} <span className="text-muted-foreground text-xs">{r.unit}</span></td>
                  <td className="p-4 text-xs text-muted-foreground">{r.range}</td>
                  <td className="p-4"><span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColors[r.status].badge}`}>{r.status}</span></td>
                  <td className="p-4"><Sparkline data={r.trend} status={r.status} /></td>
                  <td className="p-4 text-[11px] text-muted-foreground italic max-w-[200px]">{getBloodInsight(r.status, r.trend)}</td>
                  <td className="p-4 text-xs text-muted-foreground">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <MedicalDisclaimer />
    </div>
  );
};

export default BloodResultsSection;
