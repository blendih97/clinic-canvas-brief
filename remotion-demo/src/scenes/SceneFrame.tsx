import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../theme";
import { cormorant, dmSans } from "../MainVideo";
import { SectionLabel, TimecodeBadge } from "../components";

// Scene layout pattern reused across content scenes
export const SceneFrame: React.FC<{
  time: string;
  label: string;
  title: React.ReactNode;
  copy?: string;
  children: React.ReactNode;
}> = ({ time, label, title, copy, children }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const inSpring = spring({ frame, fps, config: { damping: 200 } });
  const inY = interpolate(inSpring, [0, 1], [24, 0]);
  const outO = interpolate(frame, [durationInFrames - 18, durationInFrames - 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: outO, padding: "120px 120px 140px", display: "flex", flexDirection: "row", gap: 80 }}>
      {/* Left text column */}
      <div style={{ width: 560, display: "flex", flexDirection: "column", justifyContent: "center", transform: `translateY(${inY}px)`, opacity: inSpring }}>
        <TimecodeBadge time={time} />
        <div style={{ marginTop: 28 }}>
          <SectionLabel>{label}</SectionLabel>
        </div>
        <h2 style={{
          fontFamily: cormorant, fontWeight: 300, color: COLORS.ink,
          fontSize: 84, lineHeight: 1.05, letterSpacing: "-0.02em",
          margin: "20px 0 24px",
        }}>{title}</h2>
        {copy && (
          <p style={{ fontFamily: dmSans, fontSize: 22, lineHeight: 1.65, color: COLORS.softText, fontWeight: 300, maxWidth: 540 }}>
            {copy}
          </p>
        )}
      </div>
      {/* Right canvas */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {children}
      </div>
    </AbsoluteFill>
  );
};
