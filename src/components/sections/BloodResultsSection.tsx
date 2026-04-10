import { useState } from "react";
import { Droplets, LayoutGrid, List, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { bloodResults } from "@/data/mockData";

const statusBadge = {
  normal: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  flagged: "bg-primary/10 text-primary border-primary/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
};

const Sparkline = ({ data, status }: { data: number[]; status: string }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 24;
  const w = 60;
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
  if (last < prev) return <TrendingDown className="w-3 h-3 text-emerald-400" />;
  return <Minus className="w-3 h-3 text-muted-foreground" />;
};

const BloodResultsSection = () => {
  const [view, setView] = useState<"card" | "table">("card");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-3xl font-light text-cream">Blood Results</h2>
          <p className="text-sm text-muted-foreground mt-1">Extracted biomarkers from uploaded lab reports</p>
        </div>
        <div className="flex gap-1 bg-secondary rounded-md p-0.5">
          <button onClick={() => setView("card")} className={`p-1.5 rounded ${view === "card" ? "bg-card text-primary" : "text-muted-foreground"}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setView("table")} className={`p-1.5 rounded ${view === "table" ? "bg-card text-primary" : "text-muted-foreground"}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {view === "card" ? (
        <div className="grid grid-cols-2 gap-3">
          {bloodResults.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-cream">{r.marker}</p>
                  <p className="text-[10px] text-muted-foreground">{r.source}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusBadge[r.status]}`}>
                  {r.status}
                </span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-heading text-3xl font-light text-cream">
                    {r.value}
                    <span className="text-sm text-muted-foreground ml-1">{r.unit}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">Range: {r.range}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Sparkline data={r.trend} status={r.status} />
                  <div className="flex items-center gap-1">
                    <TrendIcon data={r.trend} />
                    <span className="text-[10px] text-muted-foreground">{r.date}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="p-3 text-[10px] tracking-wider text-muted-foreground uppercase font-medium">Marker</th>
                <th className="p-3 text-[10px] tracking-wider text-muted-foreground uppercase font-medium">Value</th>
                <th className="p-3 text-[10px] tracking-wider text-muted-foreground uppercase font-medium">Range</th>
                <th className="p-3 text-[10px] tracking-wider text-muted-foreground uppercase font-medium">Status</th>
                <th className="p-3 text-[10px] tracking-wider text-muted-foreground uppercase font-medium">Trend</th>
                <th className="p-3 text-[10px] tracking-wider text-muted-foreground uppercase font-medium">Source</th>
                <th className="p-3 text-[10px] tracking-wider text-muted-foreground uppercase font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {bloodResults.map((r) => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="p-3 text-sm text-cream font-medium">{r.marker}</td>
                  <td className="p-3 text-sm text-cream font-heading">{r.value} <span className="text-muted-foreground text-xs">{r.unit}</span></td>
                  <td className="p-3 text-xs text-muted-foreground">{r.range}</td>
                  <td className="p-3"><span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusBadge[r.status]}`}>{r.status}</span></td>
                  <td className="p-3"><Sparkline data={r.trend} status={r.status} /></td>
                  <td className="p-3 text-xs text-muted-foreground">{r.source}</td>
                  <td className="p-3 text-xs text-muted-foreground">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BloodResultsSection;
