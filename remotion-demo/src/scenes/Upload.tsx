import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../theme";
import { cormorant, dmSans } from "../MainVideo";
import { SceneFrame } from "./SceneFrame";

const docs = [
  { flag: "🇫🇷", lang: "FR", name: "Compte rendu d'hospitalisation", facility: "Hôpital Lariboisière, Paris" },
  { flag: "🇦🇪", lang: "AR", name: "تقرير تحليل الدم الشامل", facility: "Mediclinic Dubai Mall" },
  { flag: "🇹🇷", lang: "TR", name: "Kardiyoloji Muayene Raporu", facility: "Acıbadem Hastanesi, İstanbul" },
];

export const Upload: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <SceneFrame
      time="0:00"
      label="Step 01 · Upload"
      title={<>Upload from <em style={{ fontStyle: "italic", color: COLORS.gold }}>any country</em></>}
      copy="PDFs, scans, photographs of paper records — from any hospital, in any language. Drag in or share by email."
    >
      {/* Upload card with documents floating in */}
      <div style={{
        width: 760, padding: 48,
        background: COLORS.surface,
        border: `1px solid ${COLORS.goldBorder}`,
        borderRadius: 6,
        boxShadow: "0 30px 80px rgba(0,0,0,0.10)",
        position: "relative",
      }}>
        <div style={{
          border: `1.5px dashed ${COLORS.goldBorder}`, borderRadius: 4,
          padding: "40px 24px", textAlign: "center", marginBottom: 28,
          background: COLORS.goldFaint,
        }}>
          <div style={{ fontFamily: cormorant, fontSize: 30, color: COLORS.gold, marginBottom: 6 }}>
            Drop documents here
          </div>
          <div style={{ fontFamily: dmSans, fontSize: 15, color: COLORS.softText, letterSpacing: "0.04em" }}>
            Any language · Any country · Any year
          </div>
        </div>
        {docs.map((d, i) => {
          const delay = 20 + i * 22;
          const s = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 120 } });
          const y = interpolate(s, [0, 1], [60, 0]);
          const x = interpolate(s, [0, 1], [-30, 0]);
          return (
            <div key={d.name} style={{
              display: "flex", alignItems: "center", gap: 18,
              padding: "18px 20px", marginBottom: 12,
              background: COLORS.surface, border: `1px solid ${COLORS.surfaceBorder}`,
              borderRadius: 4,
              transform: `translate(${x}px, ${y}px)`, opacity: s,
              boxShadow: "0 6px 20px rgba(0,0,0,0.04)",
            }}>
              <div style={{ fontSize: 30 }}>{d.flag}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: dmSans, fontSize: 18, fontWeight: 500, color: COLORS.ink, marginBottom: 4 }}>
                  {d.name}
                </div>
                <div style={{ fontFamily: dmSans, fontSize: 13, color: COLORS.softText }}>
                  {d.facility}
                </div>
              </div>
              <div style={{
                fontFamily: dmSans, fontSize: 11, fontWeight: 600,
                padding: "5px 11px", border: `1px solid ${COLORS.goldBorder}`,
                color: COLORS.gold, letterSpacing: "0.1em",
              }}>
                {d.lang}
              </div>
            </div>
          );
        })}
      </div>
    </SceneFrame>
  );
};
