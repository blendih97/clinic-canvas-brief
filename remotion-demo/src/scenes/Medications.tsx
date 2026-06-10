import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../theme";
import { cormorant, dmSans } from "../MainVideo";
import { SceneFrame } from "./SceneFrame";

const meds = [
  { name: "Atorvastatin", dose: "40 mg", schedule: "Once daily, evening", purpose: "Cholesterol" },
  { name: "Bisoprolol", dose: "5 mg", schedule: "Once daily, morning", purpose: "Heart rate" },
  { name: "Aspirin", dose: "75 mg", schedule: "Once daily", purpose: "Antiplatelet" },
  { name: "Ramipril", dose: "2.5 mg", schedule: "Once daily, morning", purpose: "Blood pressure" },
];

export const Medications: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <SceneFrame
      time="0:27"
      label="Step 04 · Understand"
      title={<>A current <em style={{ fontStyle: "italic", color: COLORS.gold }}>medication list</em></>}
      copy="Auto-extracted, deduplicated and easy for any doctor to scan in seconds."
    >
      <div style={{
        width: 780, background: COLORS.surface,
        border: `1px solid ${COLORS.goldBorder}`, borderRadius: 6,
        padding: 36, boxShadow: "0 30px 80px rgba(0,0,0,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ fontFamily: cormorant, fontSize: 30, color: COLORS.ink, fontWeight: 400 }}>
            Active medications
          </div>
          <div style={{
            fontFamily: dmSans, fontSize: 12, letterSpacing: "0.18em",
            color: COLORS.gold, padding: "5px 10px",
            border: `1px solid ${COLORS.goldBorder}`, background: COLORS.goldFaint,
          }}>
            4 ACTIVE
          </div>
        </div>
        <div style={{ height: 1, background: COLORS.goldBorder, marginBottom: 8 }} />
        {meds.map((m, i) => {
          const delay = 20 + i * 18;
          const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
          return (
            <div key={m.name} style={{
              display: "grid", gridTemplateColumns: "1.4fr 0.7fr 1.3fr 1fr",
              gap: 16, padding: "20px 4px",
              borderBottom: i < meds.length - 1 ? `1px solid ${COLORS.surfaceBorder}` : "none",
              opacity: s, transform: `translateY(${interpolate(s, [0, 1], [10, 0])}px)`,
            }}>
              <div>
                <div style={{ fontFamily: cormorant, fontSize: 24, color: COLORS.ink, fontWeight: 500, lineHeight: 1 }}>
                  {m.name}
                </div>
              </div>
              <div style={{ fontFamily: dmSans, fontSize: 18, color: COLORS.gold, fontWeight: 600, alignSelf: "center" }}>
                {m.dose}
              </div>
              <div style={{ fontFamily: dmSans, fontSize: 14, color: COLORS.softText, alignSelf: "center" }}>
                {m.schedule}
              </div>
              <div style={{
                fontFamily: dmSans, fontSize: 12, color: COLORS.gold,
                letterSpacing: "0.14em", textTransform: "uppercase",
                alignSelf: "center", textAlign: "right",
              }}>
                {m.purpose}
              </div>
            </div>
          );
        })}
      </div>
    </SceneFrame>
  );
};
