import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../theme";
import { cormorant, dmSans } from "../MainVideo";
import { SceneFrame } from "./SceneFrame";

const events = [
  { year: "2019", title: "Annual physical", facility: "London GP" },
  { year: "2021", title: "NSTEMI — admission", facility: "Hôpital Lariboisière, Paris" },
  { year: "2022", title: "Cardiology follow-up", facility: "Cleveland Clinic, Abu Dhabi" },
  { year: "2024", title: "Lipid panel · normal range", facility: "Mediclinic, Dubai" },
  { year: "2025", title: "Stress echocardiogram", facility: "Acıbadem, İstanbul" },
];

export const Timeline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lineProg = spring({ frame: frame - 20, fps, config: { damping: 200, stiffness: 80 } });

  return (
    <SceneFrame
      time="0:18"
      label="Step 03 · Understand"
      title={<>A clear <em style={{ fontStyle: "italic", color: COLORS.gold }}>timeline</em>, finally</>}
      copy="Every diagnosis, test and treatment, organised chronologically across providers and countries."
    >
      <div style={{ width: 760, position: "relative", padding: "16px 0" }}>
        {/* vertical line */}
        <div style={{
          position: "absolute", left: 110, top: 24, bottom: 24,
          width: 2, background: COLORS.surfaceBorder, transformOrigin: "top",
        }} />
        <div style={{
          position: "absolute", left: 110, top: 24,
          width: 2, height: `calc((100% - 48px) * ${lineProg})`,
          background: COLORS.gold, boxShadow: `0 0 12px ${COLORS.goldGlow}`,
        }} />
        {events.map((e, i) => {
          const delay = 30 + i * 22;
          const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
          return (
            <div key={e.year} style={{
              display: "flex", alignItems: "center", gap: 28,
              padding: "18px 0",
              opacity: s, transform: `translateX(${interpolate(s, [0, 1], [-20, 0])}px)`,
            }}>
              <div style={{
                fontFamily: cormorant, fontSize: 28, fontWeight: 400,
                color: COLORS.gold, width: 84, textAlign: "right",
              }}>{e.year}</div>
              <div style={{
                width: 14, height: 14, borderRadius: "50%",
                background: COLORS.surface, border: `2px solid ${COLORS.gold}`,
                boxShadow: `0 0 0 6px ${COLORS.cream}`, flexShrink: 0,
              }} />
              <div>
                <div style={{ fontFamily: cormorant, fontSize: 26, color: COLORS.ink, fontWeight: 400, marginBottom: 4 }}>
                  {e.title}
                </div>
                <div style={{ fontFamily: dmSans, fontSize: 14, color: COLORS.softText }}>
                  {e.facility}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SceneFrame>
  );
};
