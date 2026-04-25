import { useState, useMemo } from "react";
import { LayoutGrid, List, TrendingUp, TrendingDown, Minus, Pin, ChevronDown, ChevronUp, BarChart3, FolderOpen, Calendar, MapPin } from "lucide-react";
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
  if (data.length < 2) return <Minus className="w-3 h-3 text-muted-foreground" />;
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

interface MarkerGroup {
  marker: string;
  latest: typeof import("@/store/vaultStore").useVaultStore extends (s: any) => infer R ? any : any;
  history: any[];
}

const BloodResultsSection = ({ pinnedIds, onTogglePin }: BloodResultsSectionProps) => {
  const [view, setView] = useState<"panels" | "card" | "table" | "compare">("panels");
  const [expandedMarkers, setExpandedMarkers] = useState<Set<string>>(new Set());
  const [expandedPanels, setExpandedPanels] = useState<Set<string>>(new Set());
  const bloodResults = useVaultStore((s) => s.bloodResults);
  const { profile } = useAuth();
  const sex = (profile as any)?.biological_sex as string | null;

  // Group by marker, sort by date desc within each group
  const markerGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    bloodResults.forEach((r) => {
      const key = r.marker.toLowerCase().trim();
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    // Sort each group by date desc
    Object.values(groups).forEach((arr) => arr.sort((a, b) => (b.date || "").localeCompare(a.date || "")));
    // Sort groups by latest result date desc
    return Object.entries(groups)
      .map(([, results]) => ({
        marker: results[0].marker,
        latest: results[0],
        history: results.slice(1),
      }))
      .sort((a, b) => (b.latest.date || "").localeCompare(a.latest.date || ""));
  }, [bloodResults]);

  // For compare view: markers that have multiple entries
  const comparableMarkers = useMemo(
    () => markerGroups.filter((g) => g.history.length > 0),
    [markerGroups]
  );

  // Group by panel (date + source/facility) for the panels view
  const panels = useMemo(() => {
    const groups: Record<string, { key: string; date: string; source: string; results: any[]; isOther: boolean }> = {};
    bloodResults.forEach((r) => {
      const hasDate = !!(r.date && String(r.date).trim());
      const hasSource = !!(r.source && String(r.source).trim());
      const isOther = !hasDate && !hasSource;
      const key = isOther ? "__other__" : `${r.date || "Unknown date"}__${r.source || "Unknown source"}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          date: isOther ? "" : (r.date || "Unknown date"),
          source: isOther ? "Other" : (r.source || "Unknown source"),
          results: [],
          isOther,
        };
      }
      groups[key].results.push(r);
    });
    // Sort: dated panels first (newest first), "Other" last
    return Object.values(groups).sort((a, b) => {
      if (a.isOther) return 1;
      if (b.isOther) return -1;
      return (b.date || "").localeCompare(a.date || "");
    });
  }, [bloodResults]);

  const toggleExpand = (marker: string) => {
    setExpandedMarkers((prev) => {
      const next = new Set(prev);
      if (next.has(marker)) next.delete(marker); else next.add(marker);
      return next;
    });
  };

  const togglePanel = (key: string) => {
    setExpandedPanels((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  if (bloodResults.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="font-heading text-3xl font-light text-foreground">Lab Results</h2>
          <p className="text-sm text-muted-foreground mt-2">Upload a lab report to see extracted biomarkers here.</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground text-sm">
          No lab results yet.
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
          <h2 className="font-heading text-3xl font-light text-foreground">Lab Results</h2>
          <p className="text-sm text-muted-foreground mt-2">Extracted biomarkers from uploaded lab reports</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          <button onClick={() => setView("panels")} className={`p-1.5 rounded ${view === "panels" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`} title="Group by test panel">
            <FolderOpen className="w-4 h-4" />
          </button>
          <button onClick={() => setView("card")} className={`p-1.5 rounded ${view === "card" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setView("table")} className={`p-1.5 rounded ${view === "table" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}>
            <List className="w-4 h-4" />
          </button>
          {comparableMarkers.length > 0 && (
            <button onClick={() => setView("compare")} className={`p-1.5 rounded ${view === "compare" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`} title="Compare over time">
              <BarChart3 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {view === "panels" ? (
        /* Panels View — grouped by date + source */
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{panels.length} test panel{panels.length !== 1 ? "s" : ""} from your uploads. Click to expand.</p>
          {panels.map((panel) => {
            const isOpen = expandedPanels.has(panel.key);
            const flaggedCount = panel.results.filter((r) => r.status === "flagged" || r.status === "critical").length;
            return (
              <div key={panel.key} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => togglePanel(panel.key)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FolderOpen className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {panel.results.length} marker{panel.results.length !== 1 ? "s" : ""}
                        {flaggedCount > 0 && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {flaggedCount} flagged
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{panel.date}</span>
                        <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{panel.source}</span>
                      </p>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                {isOpen && (
                  <div className="border-t border-border divide-y divide-border/60">
                    {panel.results.map((r) => (
                      <div key={r.id} className={`flex items-center justify-between p-4 border-l-4 ${statusColors[r.status].border}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground font-medium">{r.marker}</p>
                          <p className="text-[11px] text-muted-foreground italic mt-0.5">{getBloodInsight(r.status, r.trend)}</p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <p className="text-sm text-foreground">{r.value} <span className="text-xs text-muted-foreground">{r.unit}</span></p>
                            {r.range && <p className="text-[10px] text-muted-foreground">Range: {r.range}</p>}
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColors[r.status].badge}`}>{r.status}</span>
                          {onTogglePin && (
                            <button onClick={() => onTogglePin(r.id)} className={`p-1 rounded hover:bg-muted ${pinnedIds?.has(r.id) ? "text-primary" : "text-muted-foreground/50"}`}>
                              <Pin className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : view === "compare" ? (
        /* Compare Timeline View */
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">Markers with multiple results over time</p>
          {comparableMarkers.map((group) => {
            const allResults = [group.latest, ...group.history];
            return (
              <div key={group.marker} className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-medium text-foreground mb-3">{group.marker}</h3>
                <div className="flex items-end gap-4 overflow-x-auto pb-2">
                  {allResults.map((r, i) => (
                    <div key={r.id} className="flex flex-col items-center min-w-[80px]">
                      <span className={`text-lg font-medium ${
                        r.status === "critical" ? "text-destructive" :
                        r.status === "flagged" ? "text-primary" : "text-foreground"
                      }`}>{r.value}</span>
                      <span className="text-[10px] text-muted-foreground">{r.unit}</span>
                      <div className="w-px h-4 bg-border my-1" />
                      <span className="text-[10px] text-muted-foreground">{r.date}</span>
                      <span className="text-[9px] text-muted-foreground">{r.source}</span>
                      {i < allResults.length - 1 && (
                        <div className="mt-1">
                          {r.value > allResults[i + 1].value
                            ? <TrendingUp className="w-3 h-3 text-primary" />
                            : r.value < allResults[i + 1].value
                            ? <TrendingDown className="w-3 h-3 text-emerald-500" />
                            : <Minus className="w-3 h-3 text-muted-foreground" />}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : view === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {markerGroups.map((group) => {
            const r = group.latest;
            const isExpanded = expandedMarkers.has(group.marker);
            return (
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

                {/* History toggle */}
                {group.history.length > 0 && (
                  <>
                    <button onClick={() => toggleExpand(group.marker)}
                      className="mt-3 flex items-center gap-1 text-[11px] text-primary hover:underline">
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {isExpanded ? "Hide" : "View"} history ({group.history.length} previous)
                    </button>
                    {isExpanded && (
                      <div className="mt-2 space-y-1.5 border-t border-border/50 pt-2">
                        {group.history.map((h) => (
                          <div key={h.id} className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{h.value} {h.unit}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${statusColors[h.status].badge}`}>{h.status}</span>
                            <span>{h.date}</span>
                            <span className="text-[10px]">{h.source}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
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
                <th className="p-4 text-[10px] tracking-wider text-muted-foreground uppercase font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {markerGroups.map((group) => {
                const r = group.latest;
                const isExpanded = expandedMarkers.has(group.marker);
                return (
                  <>
                    <tr key={r.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="p-4 text-sm text-foreground font-medium">{r.marker}</td>
                      <td className="p-4 text-sm text-foreground">{r.value} <span className="text-muted-foreground text-xs">{r.unit}</span></td>
                      <td className="p-4 text-xs text-muted-foreground">{r.range}</td>
                      <td className="p-4"><span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColors[r.status].badge}`}>{r.status}</span></td>
                      <td className="p-4"><Sparkline data={r.trend} status={r.status} /></td>
                      <td className="p-4 text-[11px] text-muted-foreground italic max-w-[200px]">{getBloodInsight(r.status, r.trend)}</td>
                      <td className="p-4 text-xs text-muted-foreground">{r.date}</td>
                      <td className="p-4">
                        {group.history.length > 0 && (
                          <button onClick={() => toggleExpand(group.marker)} className="text-primary text-[10px] hover:underline flex items-center gap-0.5">
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {group.history.length}
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && group.history.map((h) => (
                      <tr key={h.id} className="bg-muted/30 border-b border-border/30">
                        <td className="p-3 pl-8 text-xs text-muted-foreground">{h.marker}</td>
                        <td className="p-3 text-xs text-muted-foreground">{h.value} {h.unit}</td>
                        <td className="p-3 text-xs text-muted-foreground">{h.range}</td>
                        <td className="p-3"><span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColors[h.status].badge}`}>{h.status}</span></td>
                        <td className="p-3"></td>
                        <td className="p-3 text-[10px] text-muted-foreground italic">{getBloodInsight(h.status, h.trend)}</td>
                        <td className="p-3 text-xs text-muted-foreground">{h.date}</td>
                        <td className="p-3 text-[10px] text-muted-foreground">{h.source}</td>
                      </tr>
                    ))}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <MedicalDisclaimer />
    </div>
  );
};

export default BloodResultsSection;
