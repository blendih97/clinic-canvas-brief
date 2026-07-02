import { useState } from "react";
import { marketingColors } from "./shared";
import { useMarketingBreakpoint } from "./shared";
import { trackEvent } from "@/lib/analytics";

const useReveal = () => {
  // simple no-op wrapper — parent section already animates
  return null;
};

export default function SampleHealthPassport() {
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      trackEvent("sample_pdf_downloaded");
      const mod = await import("@/lib/sampleHealthPassport");
      await mod.generateSampleHealthPassport();
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  // Fanned-pages preview: three stacked cards at slight angles.
  const cardBase: React.CSSProperties = {
    position: "absolute",
    width: isMobile ? 180 : 220,
    height: isMobile ? 244 : 300,
    background: marketingColors.surface,
    border: `1px solid ${marketingColors.goldBorder}`,
    borderRadius: 4,
    boxShadow: "0 20px 60px hsl(var(--foreground) / 0.12)",
    transformOrigin: "bottom center",
    overflow: "hidden",
  };

  const miniLine = (w: string, o = 0.5): React.CSSProperties => ({
    height: 6,
    width: w,
    background: `hsl(var(--foreground) / ${o * 0.14})`,
    borderRadius: 2,
    marginBottom: 6,
  });

  return (
    <section
      id="sample-passport"
      style={{
        padding: `${isMobile ? 72 : 100}px ${paddingX}px`,
        background: marketingColors.cream,
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? 40 : 64,
          alignItems: "center",
        }}
      >
        {/* Visual */}
        <div
          style={{
            position: "relative",
            height: isMobile ? 300 : 380,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            order: isMobile ? 2 : 1,
          }}
          aria-hidden
        >
          {/* Back card */}
          <div style={{ ...cardBase, transform: "rotate(-9deg) translateX(-38px)" }}>
            <div style={{ padding: 18 }}>
              <div style={{ fontFamily: "Cormorant Garamond", fontSize: 14, color: marketingColors.gold, fontWeight: 600, marginBottom: 10 }}>RinVita</div>
              <div style={miniLine("70%", 0.6)} />
              <div style={miniLine("55%")} />
              <div style={{ marginTop: 14 }}>
                <div style={miniLine("90%")} />
                <div style={miniLine("85%")} />
                <div style={miniLine("60%")} />
              </div>
            </div>
          </div>
          {/* Middle card */}
          <div style={{ ...cardBase, transform: "rotate(4deg) translateX(4px)" }}>
            <div style={{ padding: 18 }}>
              <div style={{ fontFamily: "Cormorant Garamond", fontSize: 14, color: marketingColors.gold, fontWeight: 600, marginBottom: 10 }}>Blood results</div>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 0.6fr", gap: 4 }}>
                {["Haemoglobin", "11.2 → 13.4", "✓", "Ferritin", "9 → 38", "✓", "Vit D", "18 → 32", "✓", "TSH", "2.1", "✓", "HbA1c", "5.2", "✓"].map((v, i) => (
                  <div key={i} style={{ fontSize: 9, color: i % 3 === 2 ? "#5a8c5a" : marketingColors.mutedText, padding: "3px 0", borderBottom: `1px solid ${marketingColors.goldBorder}` }}>
                    {v}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Front card */}
          <div style={{ ...cardBase, transform: "rotate(-1deg) translateX(46px) translateY(-6px)", zIndex: 2 }}>
            <div style={{ padding: 20, height: "100%", display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: "Cormorant Garamond", fontSize: 22, color: marketingColors.gold, fontWeight: 600, marginBottom: 4 }}>RinVita</div>
              <div style={{ fontSize: 8, letterSpacing: "0.16em", color: marketingColors.softText, marginBottom: 24, textTransform: "uppercase" }}>Health Passport</div>
              <div style={{ fontFamily: "Cormorant Garamond", fontSize: 18, color: marketingColors.ink, marginBottom: 4 }}>Amira K.</div>
              <div style={{ fontSize: 9, color: marketingColors.mutedText, marginBottom: 20 }}>DOB 12 Jun 1990 · A+</div>
              <div style={{ marginTop: "auto", fontSize: 8, color: marketingColors.softText }}>
                Dubai → Paris → Istanbul → Singapore
              </div>
            </div>
          </div>
        </div>

        {/* Copy */}
        <div style={{ order: isMobile ? 1 : 2 }}>
          <span className="marketing-section-label">Sample health passport</span>
          <h2
            style={{
              fontFamily: "Cormorant Garamond",
              fontSize: isMobile ? 30 : "clamp(32px,3.4vw,44px)",
              fontWeight: 300,
              color: marketingColors.ink,
              lineHeight: 1.15,
              marginBottom: 16,
            }}
          >
            See what a Health Passport looks like.
          </h2>
          <p
            style={{
              fontSize: isMobile ? 15 : 16,
              color: marketingColors.mutedText,
              fontWeight: 300,
              lineHeight: 1.75,
              marginBottom: 20,
            }}
          >
            A 6-page PDF built from four fictional records — a Dubai lab panel, a Paris hospital discharge,
            an Istanbul cardiology review and a Singapore follow-up. Everything a clinician needs on the
            first page, originals kept alongside.
          </p>
          <ul style={{ margin: "0 0 28px", padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {[
              "At-a-glance summary with clinical highlights",
              "Blood results shown as trends across dates",
              "Medications, visit timeline, cardiology review",
            ].map((item) => (
              <li key={item} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 14, color: "hsl(var(--foreground) / 0.78)", fontWeight: 300, lineHeight: 1.6 }}>
                <span style={{ color: marketingColors.gold, marginTop: 3 }}>◆</span>
                {item}
              </li>
            ))}
          </ul>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <button
              onClick={handleDownload}
              disabled={downloading}
              style={{
                padding: "14px 30px",
                background: marketingColors.gold,
                color: "hsl(var(--primary-foreground))",
                border: "none",
                borderRadius: 2,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: downloading ? "wait" : "pointer",
                opacity: downloading ? 0.7 : 1,
              }}
            >
              {downloading ? "Preparing…" : "Download sample PDF"}
            </button>
            <span style={{ fontSize: 12, color: marketingColors.softText }}>
              ~180 KB · fictional patient
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
