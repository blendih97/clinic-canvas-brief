import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { loadFont as loadCormorant } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadDM } from "@remotion/google-fonts/DMSans";
import { Intro } from "./scenes/Intro";
import { Upload } from "./scenes/Upload";
import { Translate } from "./scenes/Translate";
import { Timeline } from "./scenes/Timeline";
import { Medications } from "./scenes/Medications";
import { Share } from "./scenes/Share";
import { Outro } from "./scenes/Outro";
import { COLORS } from "./theme";

export const cormorant = loadCormorant("normal", { weights: ["300", "400", "500"], subsets: ["latin"] }).fontFamily;
export const cormorantItalic = loadCormorant("italic", { weights: ["400"], subsets: ["latin"] }).fontFamily;
export const dmSans = loadDM("normal", { weights: ["300", "400", "500", "600"], subsets: ["latin"] }).fontFamily;

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// Scene durations (frames @ 30fps)
const SCENES = [
  { name: "intro", dur: 120 },        // 0:00 – 0:04   intro
  { name: "upload", dur: 240 },       // 0:04 – 0:12   upload
  { name: "translate", dur: 270 },    // 0:12 – 0:21   translate
  { name: "timeline", dur: 270 },     // 0:21 – 0:30   timeline
  { name: "medications", dur: 270 },  // 0:30 – 0:39   medications
  { name: "share", dur: 270 },        // 0:39 – 0:48   share
  { name: "outro", dur: 180 },        // 0:48 – 0:54   outro (~54s total)
];

const offsets: number[] = [];
let acc = 0;
for (const s of SCENES) { offsets.push(acc); acc += s.dur; }
export const TOTAL_FRAMES = acc;

function PersistentBackground() {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 90) * 30;
  return (
    <AbsoluteFill style={{ background: COLORS.cream }}>
      {/* Subtle grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage:
          `linear-gradient(${COLORS.goldFaint} 1px, transparent 1px),` +
          `linear-gradient(90deg, ${COLORS.goldFaint} 1px, transparent 1px)`,
        backgroundSize: "120px 120px",
        maskImage: "radial-gradient(ellipse 75% 75% at 50% 50%, black 30%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 75% 75% at 50% 50%, black 30%, transparent 100%)",
      }} />
      {/* Drifting gold orb */}
      <div style={{
        position: "absolute",
        left: `calc(15% + ${drift}px)`,
        top: `calc(20% + ${drift * 0.6}px)`,
        width: 520, height: 520, borderRadius: "50%",
        background: `radial-gradient(circle, ${COLORS.goldGlow}, transparent 70%)`,
        filter: "blur(40px)",
      }} />
      <div style={{
        position: "absolute",
        right: `calc(10% - ${drift}px)`,
        bottom: `calc(15% - ${drift * 0.4}px)`,
        width: 620, height: 620, borderRadius: "50%",
        background: `radial-gradient(circle, ${COLORS.goldGlow}, transparent 70%)`,
        filter: "blur(60px)",
      }} />
    </AbsoluteFill>
  );
}

function ProgressBar() {
  const frame = useCurrentFrame();
  const pct = interpolate(frame, [0, TOTAL_FRAMES - 1], [0, 100], { extrapolateRight: "clamp" });
  return (
    <div style={{
      position: "absolute", left: 80, right: 80, bottom: 56, zIndex: 50,
      display: "flex", alignItems: "center", gap: 24,
    }}>
      <div style={{ fontFamily: cormorant, fontSize: 22, color: COLORS.gold, letterSpacing: "0.24em", fontWeight: 400 }}>
        RINVITA
      </div>
      <div style={{ flex: 1, height: 1, background: `${COLORS.ink}1f`, position: "relative" }}>
        <div style={{
          position: "absolute", left: 0, top: -0.5,
          height: 2, width: `${pct}%`, background: COLORS.gold,
          boxShadow: `0 0 12px ${COLORS.goldGlow}`,
        }} />
      </div>
      <div style={{ fontFamily: dmSans, fontSize: 13, color: COLORS.softText, letterSpacing: "0.18em" }}>
        {String(Math.floor((frame / FPS))).padStart(2, "0")} / {String(Math.floor(TOTAL_FRAMES / FPS)).padStart(2, "0")}
      </div>
    </div>
  );
}

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily: dmSans, color: COLORS.ink }}>
      <PersistentBackground />
      {SCENES.map((s, i) => (
        <Sequence key={s.name} from={offsets[i]} durationInFrames={s.dur} name={s.name}>
          {s.name === "intro" && <Intro />}
          {s.name === "upload" && <Upload />}
          {s.name === "translate" && <Translate />}
          {s.name === "timeline" && <Timeline />}
          {s.name === "medications" && <Medications />}
          {s.name === "share" && <Share />}
          {s.name === "outro" && <Outro />}
        </Sequence>
      ))}
      <ProgressBar />
    </AbsoluteFill>
  );
};
