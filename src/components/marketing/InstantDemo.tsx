// Anonymous, client-side "Try it live" demo. No account, no upload, no API call.
// Visitor picks one of 4 pre-loaded fictional documents, watches a staged
// processing animation (detect → translate → structure → flag), then sees the
// finished structured output. Reused on the homepage and on /clinics.

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { SAMPLE_DOCS, type SampleDoc } from "@/data/sampleAmiraK";
import { marketingColors, useMarketingBreakpoint } from "@/components/marketing/shared";
import { trackEvent } from "@/lib/analytics";

type Phase = "picker" | "detecting" | "translating" | "structuring" | "flagging" | "revealed";

const PHASES: { key: Exclude<Phase, "picker" | "revealed">; label: string; duration: number }[] = [
  { key: "detecting", label: "Detecting language", duration: 1600 },
  { key: "translating", label: "Translating to English", duration: 2600 },
  { key: "structuring", label: "Structuring lab values", duration: 2600 },
  { key: "flagging", label: "Flagging out-of-range results", duration: 2000 },
];

const STATUS_COLOR: Record<"normal" | "high" | "low", { bg: string; fg: string; label: string }> = {
  normal: { bg: "rgba(59, 140, 94, 0.10)", fg: "#3B8C5E", label: "IN RANGE" },
  high:   { bg: "rgba(176, 65, 62, 0.10)",  fg: "#B0413E", label: "HIGH" },
  low:    { bg: "rgba(201, 138, 42, 0.12)", fg: "#B37515", label: "LOW" },
};

export type InstantDemoVariant = "homepage" | "clinics";

interface Props {
  variant?: InstantDemoVariant;
  onEnquireClick?: () => void;
}

export default function InstantDemo({ variant = "homepage", onEnquireClick }: Props) {
  const { isMobile } = useMarketingBreakpoint();
  const [phase, setPhase] = useState<Phase>("picker");
  const [selected, setSelected] = useState<SampleDoc | null>(null);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const timer = useRef<number | null>(null);
  const startedRef = useRef(false);

  const isClinics = variant === "clinics";

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const startProcessing = (doc: SampleDoc) => {
    setSelected(doc);
    setPhase("detecting");
    setPhaseIndex(0);
    startedRef.current = false;
    trackEvent(isClinics ? "clinic_demo_started" : "demo_started", { doc: doc.id });
    startedRef.current = true;
  };

  // Drive the staged animation
  useEffect(() => {
    if (phase === "picker" || phase === "revealed") return;
    const current = PHASES[phaseIndex];
    if (!current) return;
    timer.current = window.setTimeout(() => {
      if (phaseIndex + 1 >= PHASES.length) {
        setPhase("revealed");
        if (selected) {
          trackEvent(isClinics ? "clinic_demo_completed" : "demo_completed", { doc: selected.id });
        }
      } else {
        setPhaseIndex((i) => i + 1);
        setPhase(PHASES[phaseIndex + 1].key);
      }
    }, current.duration);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [phase, phaseIndex, selected, isClinics]);

  const reset = () => {
    setSelected(null);
    setPhase("picker");
    setPhaseIndex(0);
  };

  return (
    <div
      style={{
        background: marketingColors.surface,
        border: `1px solid ${marketingColors.goldBorder}`,
        borderRadius: 4,
        padding: isMobile ? 20 : 32,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 12px 40px hsl(var(--foreground) / 0.05)",
      }}
    >
      <div aria-hidden style={{ position: "absolute", top: -80, right: -80, width: 240, height: 240, borderRadius: "50%", border: `1px solid ${marketingColors.goldBorder}`, opacity: 0.25 }} />
      <div aria-hidden style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", border: `1px solid ${marketingColors.goldBorder}`, opacity: 0.18 }} />

      {phase === "picker" && <Picker onPick={startProcessing} isMobile={isMobile} />}
      {phase !== "picker" && phase !== "revealed" && selected && (
        <Processing doc={selected} phase={phase} phaseIndex={phaseIndex} isMobile={isMobile} />
      )}
      {phase === "revealed" && selected && (
        <Revealed
          doc={selected}
          isMobile={isMobile}
          isClinics={isClinics}
          onReset={reset}
          onEnquireClick={onEnquireClick}
        />
      )}
    </div>
  );
}

/* -------------------- Picker -------------------- */

function Picker({ onPick, isMobile }: { onPick: (d: SampleDoc) => void; isMobile: boolean }) {
  return (
    <div style={{ position: "relative" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.14em", color: marketingColors.gold, fontWeight: 500, textTransform: "uppercase", marginBottom: 8 }}>Try it live · No account · No upload</div>
        <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 24 : 30, fontWeight: 400, color: marketingColors.ink, lineHeight: 1.2, marginBottom: 8 }}>
          Pick a sample medical record.
        </h3>
        <p style={{ fontSize: 14, color: marketingColors.mutedText, lineHeight: 1.7, fontWeight: 300 }}>
          Watch RinVita translate and structure it in about 10 seconds.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
        {SAMPLE_DOCS.map((doc) => (
          <button
            key={doc.id}
            onClick={() => onPick(doc)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 16px",
              background: marketingColors.cream,
              border: `1px solid ${marketingColors.goldBorder}`,
              borderRadius: 3,
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.2s",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = marketingColors.cream2; e.currentTarget.style.borderColor = marketingColors.gold; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = marketingColors.cream; e.currentTarget.style.borderColor = marketingColors.goldBorder; }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>{doc.flag}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: marketingColors.ink, lineHeight: 1.3 }}>{doc.translatedTitle}</div>
              <div style={{ fontSize: 11.5, color: marketingColors.softText, marginTop: 2 }}>{doc.originCity} · {doc.language}</div>
            </div>
            <span style={{ fontSize: 16, color: marketingColors.gold }}>→</span>
          </button>
        ))}
      </div>
      <p style={{ marginTop: 16, fontSize: 11, color: marketingColors.faintText, lineHeight: 1.6 }}>
        Sample records use fictional patient data. Nothing is uploaded or stored.
      </p>
    </div>
  );
}

/* -------------------- Processing -------------------- */

function Processing({ doc, phase, phaseIndex, isMobile }: { doc: SampleDoc; phase: Phase; phaseIndex: number; isMobile: boolean }) {
  const isArabic = doc.languageCode === "ar";
  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 22 }}>{doc.flag}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: marketingColors.ink }}>{doc.originalTitle}</div>
          <div style={{ fontSize: 11.5, color: marketingColors.softText }}>{doc.facility} · {doc.language}</div>
        </div>
      </div>

      {/* Original snippet */}
      <div
        dir={isArabic ? "rtl" : "ltr"}
        style={{
          background: marketingColors.cream,
          border: `1px dashed ${marketingColors.goldBorder}`,
          borderRadius: 3,
          padding: "16px 18px",
          fontFamily: isArabic ? "'Noto Naskh Arabic', system-ui" : "system-ui, sans-serif",
          fontSize: 13,
          color: marketingColors.ink,
          lineHeight: 1.9,
          marginBottom: 20,
          minHeight: 130,
        }}
      >
        {doc.originalSnippet.map((line, i) => (
          <div key={i} style={{ opacity: 0.85 }}>{line}</div>
        ))}
      </div>

      {/* Phase list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {PHASES.map((p, i) => {
          const isDone = i < phaseIndex;
          const isActive = i === phaseIndex && phase !== "revealed";
          const isPending = i > phaseIndex;
          return (
            <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 12, opacity: isPending ? 0.4 : 1, transition: "opacity 0.3s" }}>
              <span style={{
                width: 20, height: 20, borderRadius: "50%",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                background: isDone ? marketingColors.gold : isActive ? "transparent" : "transparent",
                border: isDone ? `1px solid ${marketingColors.gold}` : `1px solid ${marketingColors.goldBorder}`,
                color: isDone ? "hsl(var(--primary-foreground))" : marketingColors.gold,
                fontSize: 11,
                flexShrink: 0,
              }}>
                {isDone ? "✓" : isActive ? <Spinner /> : ""}
              </span>
              <span style={{ fontSize: 13.5, color: isDone ? marketingColors.softText : marketingColors.ink, fontWeight: isActive ? 500 : 400 }}>
                {p.label}
                {isActive && <span style={{ marginLeft: 6, color: marketingColors.gold, fontSize: 12 }}>…</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 10, height: 10,
        border: `1.5px solid currentColor`,
        borderTopColor: "transparent",
        borderRadius: "50%",
        animation: "rv-spin 0.8s linear infinite",
      }}
    />
  );
}

/* -------------------- Revealed -------------------- */

function Revealed({
  doc, isMobile, isClinics, onReset, onEnquireClick,
}: {
  doc: SampleDoc; isMobile: boolean; isClinics: boolean;
  onReset: () => void; onEnquireClick?: () => void;
}) {
  const dateLabel = useMemo(() => {
    try {
      return new Date(doc.dateISO).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch { return doc.dateISO; }
  }, [doc.dateISO]);

  return (
    <div style={{ position: "relative", animation: "marketing-fade-up 0.5s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20, paddingBottom: 18, borderBottom: `1px solid ${marketingColors.goldBorder}` }}>
        <span style={{ fontSize: 22, marginTop: 2 }}>{doc.flag}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10.5, color: marketingColors.gold, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>Translated · Structured</div>
          <div style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 20 : 24, fontWeight: 400, color: marketingColors.ink, lineHeight: 1.25 }}>
            {doc.translatedTitle}
          </div>
          <div style={{ fontSize: 12, color: marketingColors.softText, marginTop: 4 }}>
            {doc.facility} · {dateLabel}
          </div>
        </div>
      </div>

      {/* Summary */}
      <Section title="Clinical summary">
        <p style={{ fontSize: 13.5, lineHeight: 1.75, color: marketingColors.ink, fontWeight: 300, margin: 0 }}>{doc.translatedSummary}</p>
      </Section>

      {/* Markers */}
      {doc.markers && doc.markers.length > 0 && (
        <Section title="Blood results">
          <div style={{ border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 3, overflow: "hidden" }}>
            {doc.markers.map((m, i) => {
              const s = STATUS_COLOR[m.status];
              return (
                <div key={m.name} style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr auto" : "1.5fr 1fr 1fr auto",
                  gap: 10, alignItems: "center",
                  padding: "10px 14px",
                  background: i % 2 === 0 ? marketingColors.surface : marketingColors.cream,
                  fontSize: 12.5,
                }}>
                  <span style={{ color: marketingColors.ink, fontWeight: 500 }}>{m.name}</span>
                  {!isMobile && <span style={{ color: marketingColors.ink, fontFamily: "'SF Mono', ui-monospace, monospace" }}>{m.value}</span>}
                  {!isMobile && <span style={{ color: marketingColors.softText, fontSize: 11.5 }}>ref {m.range}</span>}
                  <span style={{
                    justifySelf: "end",
                    padding: "3px 8px", borderRadius: 999,
                    background: s.bg, color: s.fg,
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                  }}>{s.label}</span>
                  {isMobile && (
                    <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", fontSize: 11.5, color: marketingColors.softText, marginTop: -4 }}>
                      <span style={{ fontFamily: "'SF Mono', ui-monospace, monospace" }}>{m.value}</span>
                      <span>ref {m.range}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Medications */}
      {doc.medications && doc.medications.length > 0 && (
        <Section title="Extracted medications">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {doc.medications.map((m) => (
              <div key={m.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 14px", background: marketingColors.cream, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 3, fontSize: 13 }}>
                <div>
                  <div style={{ color: marketingColors.ink, fontWeight: 500 }}>{m.name}</div>
                  <div style={{ fontSize: 11.5, color: marketingColors.softText, marginTop: 2 }}>{m.freq}</div>
                </div>
                <div style={{ fontFamily: "'SF Mono', ui-monospace, monospace", fontSize: 12, color: marketingColors.gold }}>{m.dose}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Flags */}
      {doc.flags && doc.flags.length > 0 && (
        <Section title="Flagged for the clinician">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {doc.flags.map((f) => (
              <div key={f.label} style={{ display: "flex", gap: 12, padding: "12px 14px", background: "rgba(201, 138, 42, 0.08)", border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 3 }}>
                <span style={{ color: marketingColors.gold, fontSize: 14, marginTop: 1 }}>⚑</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: marketingColors.ink }}>{f.label}</div>
                  <div style={{ fontSize: 12, color: marketingColors.mutedText, marginTop: 2, lineHeight: 1.6 }}>{f.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Timeline entry */}
      <Section title="Added to timeline">
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: marketingColors.cream, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: marketingColors.gold, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: marketingColors.ink }}>{doc.timeline.label}</div>
            <div style={{ fontSize: 11.5, color: marketingColors.softText, marginTop: 2 }}>{doc.timeline.note}</div>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${marketingColors.goldBorder}`, display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12, alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between" }}>
        {isClinics ? (
          <button
            onClick={onEnquireClick}
            style={{
              padding: isMobile ? "14px 20px" : "13px 26px",
              background: marketingColors.gold, color: "hsl(var(--primary-foreground))",
              border: "none", borderRadius: 2,
              fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
              cursor: "pointer",
              boxShadow: "0 4px 18px hsl(var(--primary) / 0.28)",
              fontFamily: "inherit",
            }}
          >
            Enquire about offering this to your patients
          </button>
        ) : (
          <Link
            to="/auth?mode=signup"
            style={{
              padding: isMobile ? "14px 20px" : "13px 26px",
              background: marketingColors.gold, color: "hsl(var(--primary-foreground))",
              textDecoration: "none", borderRadius: 2,
              fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
              boxShadow: "0 4px 18px hsl(var(--primary) / 0.28)",
              textAlign: "center",
            }}
          >
            Now try it with your own document → Start Free Trial
          </Link>
        )}
        <button
          onClick={onReset}
          style={{
            padding: isMobile ? "12px 16px" : "11px 20px",
            background: "transparent",
            border: `1px solid ${marketingColors.goldBorder}`,
            color: marketingColors.mutedText,
            borderRadius: 2,
            fontSize: 12.5, fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ↺ Try another
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 10.5, color: marketingColors.softText, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}
