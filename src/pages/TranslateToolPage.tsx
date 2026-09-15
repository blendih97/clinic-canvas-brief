import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import TranslatorTool from "@/components/marketing/TranslatorTool";
import {
  TranslatorHubCta,
  TranslatorHubPositioning,
  TranslatorHubStrip,
} from "@/components/marketing/TranslatorHubCopy";
import { TRANSLATE_LANGUAGES, translatePath } from "@/data/translateLanguages";
import {
  MarketingFooter,
  MarketingNav,
  MarketingStyles,
  marketingColors,
  useMarketingBreakpoint,
} from "@/components/marketing/shared";

const TranslateToolPage = () => {
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;

  return (
    <div className="marketing-page" style={{ background: marketingColors.cream, color: marketingColors.ink, minHeight: "100vh" }}>
      <SEO
        title="Translate a Medical Document — Free | RinVita"
        description="Upload any medical report, lab result or prescription and get an instant translation plus a plain-English summary. Free, no signup, 45+ languages."
        path="/translate"
      />
      <MarketingStyles />
      <MarketingNav currentPage="home" />

      <section style={{ padding: `${isMobile ? 100 : 140}px ${paddingX}px ${isMobile ? 48 : 72}px`, background: marketingColors.cream }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 32 : 48 }}>
            <span className="marketing-section-label">Free tool</span>
            <h1 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 36 : "clamp(40px,4.6vw,60px)", fontWeight: 300, color: marketingColors.ink, lineHeight: 1.1, marginBottom: 16, letterSpacing: "-0.02em" }}>
              Translate a medical document
              <br />
              <em style={{ fontStyle: "italic", color: marketingColors.gold }}>in any language.</em>
            </h1>
            <p style={{ fontSize: isMobile ? 15 : 17, color: marketingColors.mutedText, maxWidth: 580, margin: "0 auto", lineHeight: 1.7, fontWeight: 300 }}>
              Upload a lab report, prescription or clinical letter. We'll translate it and give you a plain-English summary you can actually understand — in under a minute. No signup. No credit card. 5 free a day.
            </p>
            <TranslatorHubPositioning />
          </div>

          <TranslatorTool landingPath="/translate" isMobile={isMobile} />
          <TranslatorHubCta isMobile={isMobile} />
          <TranslatorHubStrip isMobile={isMobile} />

          {/* Language landing-page index */}
          <div style={{ marginTop: isMobile ? 48 : 64 }}>
            <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 26 : 32, fontWeight: 300, marginBottom: 10 }}>
              Translating from a specific language?
            </h2>
            <p style={{ fontSize: 14.5, color: marketingColors.mutedText, lineHeight: 1.8, fontWeight: 300, marginBottom: 18 }}>
              Each page explains the documents people usually need translated and lists the terms you'll see on them.
            </p>
            <nav aria-label="Language translation guides" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {TRANSLATE_LANGUAGES.map((l) => (
                <Link key={l.slug} to={translatePath(l.slug)} style={chipStyle}>
                  {l.name} → English
                </Link>
              ))}
            </nav>
          </div>

          <div style={{ marginTop: 48, padding: 20, fontSize: 12, color: marketingColors.softText, lineHeight: 1.7, textAlign: "center", borderTop: `1px solid hsl(var(--foreground) / 0.06)` }}>
            <strong>Important:</strong> This translator is an aid, not medical advice. Always discuss your results with a qualified clinician. Documents are processed by AI; review carefully before acting on any information.
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
};

const chipStyle: React.CSSProperties = {
  padding: "9px 16px",
  border: `1px solid ${marketingColors.goldBorder}`,
  borderRadius: 2,
  color: marketingColors.gold,
  fontSize: 12.5,
  fontWeight: 600,
  letterSpacing: "0.04em",
  textDecoration: "none",
};

export default TranslateToolPage;
