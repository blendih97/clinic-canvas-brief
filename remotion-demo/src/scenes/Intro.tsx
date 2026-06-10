import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../theme";
import { cormorant, cormorantItalic, dmSans } from "../MainVideo";
import { LogoMark } from "../components";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoS = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  const titleY = interpolate(spring({ frame: frame - 20, fps, config: { damping: 200 } }), [0, 1], [40, 0]);
  const titleO = spring({ frame: frame - 20, fps, config: { damping: 200 } });
  const subO = spring({ frame: frame - 50, fps, config: { damping: 200 } });
  const lineW = interpolate(spring({ frame: frame - 70, fps, config: { damping: 200 } }), [0, 1], [0, 240]);
  const outO = interpolate(frame, [100, 119], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: outO, justifyContent: "center", alignItems: "center" }}>
      <div style={{ transform: `scale(${0.6 + logoS * 0.4})`, opacity: logoS, marginBottom: 36 }}>
        <LogoMark size={96} />
      </div>
      <div style={{
        fontFamily: cormorant, fontSize: 110, fontWeight: 300,
        color: COLORS.ink, letterSpacing: "-0.02em", lineHeight: 1,
        transform: `translateY(${titleY}px)`, opacity: titleO,
      }}>
        Rin<em style={{ fontFamily: cormorantItalic, color: COLORS.gold, fontStyle: "italic" }}>Vita</em>
      </div>
      <div style={{
        marginTop: 28, fontFamily: dmSans, fontSize: 20, color: COLORS.softText,
        letterSpacing: "0.28em", textTransform: "uppercase", opacity: subO,
      }}>
        The Medical Passport for International Families
      </div>
      <div style={{ marginTop: 40, height: 1, width: lineW, background: COLORS.gold }} />
    </AbsoluteFill>
  );
};
