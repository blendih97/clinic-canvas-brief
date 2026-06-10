import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../theme";
import { cormorant, dmSans } from "../MainVideo";
import { SceneFrame } from "./SceneFrame";

export const Share: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardS = spring({ frame: frame - 10, fps, config: { damping: 200 } });
  const linkS = spring({ frame: frame - 60, fps, config: { damping: 200 } });
  const checkS = spring({ frame: frame - 120, fps, config: { damping: 14, stiffness: 90 } });
  const sentS = spring({ frame: frame - 150, fps, config: { damping: 200 } });

  return (
    <SceneFrame
      time="0:36"
      label="Step 05 · Share"
      title={<>Share with <em style={{ fontStyle: "italic", color: COLORS.gold }}>any clinician</em>, anywhere</>}
      copy="Time-limited, revocable links. Doctors see a structured, translated summary — no account required."
    >
      <div style={{
        width: 780, background: COLORS.surface,
        border: `1px solid ${COLORS.goldBorder}`, borderRadius: 6,
        padding: 36, boxShadow: "0 30px 80px rgba(0,0,0,0.10)",
        opacity: cardS, transform: `translateY(${interpolate(cardS, [0, 1], [20, 0])}px)`,
      }}>
        <div style={{ fontFamily: cormorant, fontSize: 30, color: COLORS.ink, marginBottom: 6 }}>
          Share clinician brief
        </div>
        <div style={{ fontFamily: dmSans, fontSize: 14, color: COLORS.softText, marginBottom: 28 }}>
          Generated for Dr. M. Yılmaz · Acıbadem, İstanbul
        </div>

        {/* Recipient */}
        <Row label="Recipient" value="m.yilmaz@acibadem.com.tr" />
        <Row label="Language" value="Turkish (auto)" gold />
        <Row label="Expires" value="In 7 days · revocable anytime" />

        {/* Link */}
        <div style={{
          marginTop: 28, padding: "20px 22px",
          border: `1px dashed ${COLORS.goldBorder}`, background: COLORS.goldFaint,
          borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "space-between",
          opacity: linkS, transform: `translateY(${interpolate(linkS, [0, 1], [10, 0])}px)`,
        }}>
          <div style={{ fontFamily: dmSans, fontSize: 16, color: COLORS.ink, letterSpacing: "0.02em" }}>
            rinvita.co.uk/s/<span style={{ color: COLORS.gold, fontWeight: 600 }}>a8f2-91xq-77wp</span>
          </div>
          <div style={{ fontFamily: dmSans, fontSize: 11, letterSpacing: "0.16em", color: COLORS.gold, fontWeight: 600 }}>
            ENCRYPTED
          </div>
        </div>

        {/* Send button + sent confirmation */}
        <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            padding: "16px 28px", background: COLORS.gold, color: "white",
            fontFamily: dmSans, fontSize: 14, fontWeight: 600, letterSpacing: "0.14em",
            textTransform: "uppercase", borderRadius: 2,
            boxShadow: `0 8px 24px ${COLORS.goldGlow}`,
          }}>
            Send Securely
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            opacity: sentS, transform: `translateX(${interpolate(sentS, [0, 1], [-10, 0])}px)`,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: COLORS.success, color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 700,
              transform: `scale(${checkS})`,
            }}>✓</div>
            <div style={{ fontFamily: dmSans, fontSize: 14, color: COLORS.success, fontWeight: 500 }}>
              Sent · viewed in Istanbul, 2 minutes ago
            </div>
          </div>
        </div>
      </div>
    </SceneFrame>
  );
};

const Row: React.FC<{ label: string; value: string; gold?: boolean }> = ({ label, value, gold }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 0", borderBottom: `1px solid ${COLORS.surfaceBorder}`,
  }}>
    <div style={{ fontFamily: dmSans, fontSize: 12, letterSpacing: "0.18em", color: COLORS.softText, textTransform: "uppercase" }}>
      {label}
    </div>
    <div style={{ fontFamily: dmSans, fontSize: 16, color: gold ? COLORS.gold : COLORS.ink, fontWeight: gold ? 600 : 400 }}>
      {value}
    </div>
  </div>
);
