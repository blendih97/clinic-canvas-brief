import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../theme";
import { cormorant, dmSans } from "../MainVideo";
import { SceneFrame } from "./SceneFrame";

const FR = [
  "Diagnostic principal: Infarctus du myocarde sans sus-décalage ST.",
  "Traitement: Atorvastatine 40mg, Bisoprolol 5mg, Aspirine 75mg.",
  "Suivi cardiologique recommandé dans 6 semaines.",
];
const EN = [
  "Primary diagnosis: Non-ST elevation myocardial infarction (NSTEMI).",
  "Treatment: Atorvastatin 40mg, Bisoprolol 5mg, Aspirin 75mg.",
  "Cardiology follow-up recommended in 6 weeks.",
];

export const Translate: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <SceneFrame
      time="0:09"
      label="Step 02 · Translate"
      title={<>Translated <em style={{ fontStyle: "italic", color: COLORS.gold }}>automatically</em></>}
      copy="50+ languages, with the original source preserved alongside every translation."
    >
      <div style={{ width: 880, display: "grid", gridTemplateColumns: "1fr 56px 1fr", gap: 0, alignItems: "stretch" }}>
        {/* Source */}
        <Panel
          tag="ORIGINAL · FR"
          lines={FR}
          appearAt={10}
          frame={frame} fps={fps}
        />
        {/* Arrow */}
        <ArrowCol frame={frame} fps={fps} />
        {/* Translated */}
        <Panel
          tag="ENGLISH"
          lines={EN}
          appearAt={70}
          accent
          frame={frame} fps={fps}
        />
      </div>
    </SceneFrame>
  );
};

const Panel: React.FC<{ tag: string; lines: string[]; appearAt: number; accent?: boolean; frame: number; fps: number }> = ({ tag, lines, appearAt, accent, frame, fps }) => {
  const s = spring({ frame: frame - appearAt, fps, config: { damping: 200 } });
  return (
    <div style={{
      padding: 30,
      background: COLORS.surface,
      border: `1px solid ${accent ? COLORS.goldBorder : COLORS.surfaceBorder}`,
      borderRadius: 4,
      opacity: s, transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)`,
      boxShadow: accent ? "0 20px 60px rgba(184,149,42,0.10)" : "0 8px 28px rgba(0,0,0,0.05)",
      minHeight: 380,
    }}>
      <div style={{
        fontFamily: cormorant, fontSize: 13, letterSpacing: "0.24em",
        color: accent ? COLORS.gold : COLORS.softText, marginBottom: 22, fontWeight: 500,
      }}>{tag}</div>
      {lines.map((l, i) => {
        const lineS = spring({ frame: frame - (appearAt + 14 + i * 14), fps, config: { damping: 200 } });
        return (
          <div key={i} style={{
            fontFamily: dmSans, fontSize: 17, lineHeight: 1.7,
            color: accent ? COLORS.ink : `${COLORS.ink}cc`,
            marginBottom: 14,
            opacity: lineS, transform: `translateY(${interpolate(lineS, [0, 1], [8, 0])}px)`,
          }}>{l}</div>
        );
      })}
    </div>
  );
};

const ArrowCol: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const s = spring({ frame: frame - 45, fps, config: { damping: 200 } });
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity: s }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        background: COLORS.gold, color: "white",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: cormorant, fontSize: 26,
        boxShadow: `0 0 30px ${COLORS.goldGlow}`,
      }}>→</div>
    </div>
  );
};
