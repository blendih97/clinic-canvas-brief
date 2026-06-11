import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../theme";
import { cormorant, dmSans } from "../MainVideo";
import { SceneFrame } from "./SceneFrame";

type Status = "normal" | "high" | "low";

const rows: {
  name: string;
  value: string;
  unit: string;
  range: string;
  status: Status;
  trend: number[];
}[] = [
  { name: "Haemoglobin", value: "14.6", unit: "g/dL", range: "13.0 – 17.0", status: "normal", trend: [13.8, 14.1, 14.3, 14.6, 14.6] },
  { name: "LDL Cholesterol", value: "4.2", unit: "mmol/L", range: "< 3.0", status: "high", trend: [3.6, 3.8, 4.0, 4.1, 4.2] },
  { name: "HDL Cholesterol", value: "1.5", unit: "mmol/L", range: "> 1.0", status: "normal", trend: [1.3, 1.4, 1.4, 1.5, 1.5] },
  { name: "Vitamin D", value: "38", unit: "nmol/L", range: "50 – 125", status: "low", trend: [60, 55, 48, 42, 38] },
  { name: "HbA1c", value: "37", unit: "mmol/mol", range: "< 42", status: "normal", trend: [35, 36, 36, 37, 37] },
  { name: "TSH", value: "5.8", unit: "mIU/L", range: "0.4 – 4.0", status: "high", trend: [3.2, 3.9, 4.6, 5.3, 5.8] },
];

const statusColor = (s: Status) =>
  s === "normal" ? COLORS.success : s === "high" ? COLORS.danger : COLORS.warn;
const statusSoft = (s: Status) =>
  s === "normal" ? COLORS.successSoft : s === "high" ? COLORS.dangerSoft : COLORS.warnSoft;
const statusLabel = (s: Status) =>
  s === "normal" ? "IN RANGE" : s === "high" ? "HIGH" : "LOW";

const Sparkline: React.FC<{ data: number[]; color: string; progress: number }> = ({ data, color, progress }) => {
  const w = 110, h = 28;
  const min = Math.min(...data), max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * h;
    return [x, y] as const;
  });
  const path = pts.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(" ");
  const dash = 200;
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <path d={path} fill="none" stroke={color} strokeWidth={1.6}
        strokeDasharray={dash} strokeDashoffset={dash * (1 - progress)} />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.6} fill={color} opacity={progress} />
    </svg>
  );
};

export const BloodResults: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <SceneFrame
      time="0:21"
      label="Step 04 · Organise"
      title={<>Blood results, <em style={{ fontStyle: "italic", color: COLORS.gold }}>read at a glance.</em></>}
      copy="Every value tagged against its reference range. Trends tracked across visits, so anything drifting out of range is impossible to miss."
    >
      <div style={{
        width: 820, background: COLORS.surface,
        border: `1px solid ${COLORS.goldBorder}`, borderRadius: 6,
        padding: 32, boxShadow: "0 30px 80px rgba(0,0,0,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ fontFamily: cormorant, fontSize: 28, color: COLORS.ink, fontWeight: 400 }}>
            Blood panel · 12 Mar 2026
          </div>
          <div style={{
            fontFamily: dmSans, fontSize: 11, letterSpacing: "0.18em",
            color: COLORS.gold, padding: "5px 10px",
            border: `1px solid ${COLORS.goldBorder}`, background: COLORS.goldFaint,
          }}>
            6 MARKERS
          </div>
        </div>

        {/* Header row */}
        <div style={{
          display: "grid", gridTemplateColumns: "1.5fr 0.9fr 1fr 1fr 0.9fr",
          gap: 16, padding: "0 4px 10px",
          borderBottom: `1px solid ${COLORS.goldBorder}`,
          fontFamily: dmSans, fontSize: 11, letterSpacing: "0.16em",
          color: COLORS.faintText, textTransform: "uppercase",
        }}>
          <div>Marker</div>
          <div>Result</div>
          <div>Reference</div>
          <div>Trend</div>
          <div style={{ textAlign: "right" }}>Status</div>
        </div>

        {rows.map((r, i) => {
          const delay = 14 + i * 10;
          const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
          const trendProgress = interpolate(frame - delay - 8, [0, 28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const c = statusColor(r.status);
          return (
            <div key={r.name} style={{
              display: "grid", gridTemplateColumns: "1.5fr 0.9fr 1fr 1fr 0.9fr",
              gap: 16, padding: "18px 4px", alignItems: "center",
              borderBottom: i < rows.length - 1 ? `1px solid ${COLORS.surfaceBorder}` : "none",
              opacity: s, transform: `translateY(${interpolate(s, [0, 1], [8, 0])}px)`,
            }}>
              <div style={{ fontFamily: cormorant, fontSize: 22, color: COLORS.ink, fontWeight: 500, lineHeight: 1.1 }}>
                {r.name}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontFamily: dmSans, fontSize: 22, color: c, fontWeight: 600 }}>{r.value}</span>
                <span style={{ fontFamily: dmSans, fontSize: 12, color: COLORS.faintText }}>{r.unit}</span>
              </div>
              <div style={{ fontFamily: dmSans, fontSize: 13, color: COLORS.softText }}>{r.range}</div>
              <div><Sparkline data={r.trend} color={c} progress={trendProgress} /></div>
              <div style={{ textAlign: "right" }}>
                <span style={{
                  fontFamily: dmSans, fontSize: 10, fontWeight: 600,
                  letterSpacing: "0.16em", color: c,
                  padding: "5px 9px", background: statusSoft(r.status),
                  border: `1px solid ${c}55`, borderRadius: 2,
                }}>
                  {statusLabel(r.status)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </SceneFrame>
  );
};
