import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../theme";
import { cormorant, cormorantItalic, dmSans } from "../MainVideo";
import { LogoMark } from "../components";

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoS = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  const tagS = spring({ frame: frame - 30, fps, config: { damping: 200 } });
  const subS = spring({ frame: frame - 60, fps, config: { damping: 200 } });
  const urlS = spring({ frame: frame - 90, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
      <div style={{ transform: `scale(${0.7 + logoS * 0.3})`, opacity: logoS, marginBottom: 28 }}>
        <LogoMark size={84} />
      </div>
      <div style={{
        fontFamily: cormorant, fontSize: 96, fontWeight: 300,
        color: COLORS.ink, lineHeight: 1.05, letterSpacing: "-0.02em",
        opacity: tagS, transform: `translateY(${interpolate(tagS, [0, 1], [20, 0])}px)`,
        maxWidth: 1300,
      }}>
        Your medical history,
        <br />
        <em style={{ fontFamily: cormorantItalic, color: COLORS.gold, fontStyle: "italic" }}>finally in one place.</em>
      </div>
      <div style={{
        marginTop: 36, fontFamily: dmSans, fontSize: 20, color: COLORS.softText,
        letterSpacing: "0.24em", textTransform: "uppercase",
        opacity: subS,
      }}>
        Early access · GDPR compliant · End-to-end encrypted
      </div>
      <div style={{
        marginTop: 52, fontFamily: cormorant, fontSize: 36, color: COLORS.gold,
        letterSpacing: "0.16em", opacity: urlS,
        transform: `translateY(${interpolate(urlS, [0, 1], [16, 0])}px)`,
      }}>
        rinvita.co.uk
      </div>
    </AbsoluteFill>
  );
};
