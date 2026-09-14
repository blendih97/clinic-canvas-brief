import { useEffect } from "react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import ShareRinVita from "@/components/marketing/ShareRinVita";
import {
  MarketingFooter,
  MarketingNav,
  MarketingStyles,
  marketingColors,
  useMarketingBreakpoint,
} from "@/components/marketing/shared";
import { captureUtmParams } from "@/lib/analytics";

export const SIGNUP_PATH = "/auth?mode=signup";
export const SIGNUP_CTA = "Create your medical passport";
export const SIGNUP_SUPPORT_LINE = "Free plan · 3 documents · no card required. Paid plans start at £39/month.";

export type ConsumerPageConfig = {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  eyebrow: string;
  headline: string;
  headlineAccent: string;
  intro: string;
  /** Short problem statements shown as cards under the hero. */
  problems: { title: string; body: string }[];
  /** Longer, genuinely useful prose blocks. */
  sections: { heading: string; paragraphs: string[]; bullets?: string[] }[];
  /** Honest limitations — what RinVita does not do. */
  limitations: string[];
  faq: { q: string; a: string }[];
  /** Internal links to sibling pages. */
  related: { label: string; href: string }[];
};

const STEPS = [
  {
    step: "01",
    title: "Upload records",
    body: "Letters, lab results, imaging reports, discharge summaries and prescriptions — from any country, in any language, from your phone or laptop.",
  },
  {
    step: "02",
    title: "Understand your history",
    body: "RinVita translates and organises them into medications, results, imaging and visits, with every entry traceable back to the original document.",
  },
  {
    step: "03",
    title: "Share when needed",
    body: "Give a clinician a structured view through a time-limited link you can revoke at any time. You decide what is shared and for how long.",
  },
];

const TRUST = [
  {
    title: "Every entry traces back to a source document",
    body: "Anything RinVita extracts stays linked to the record it came from, so you or a clinician can open the original page at any moment.",
  },
  {
    title: "Encrypted at rest and in transit",
    body: "Your records are encrypted while stored and while moving between your device and RinVita. We do not describe this as end-to-end encrypted, because we hold the keys needed to process your documents.",
  },
  {
    title: "Time-limited sharing you can revoke",
    body: "Sharing links expire, and you can revoke one immediately from your account. Nobody sees your records unless you deliberately share them.",
  },
  {
    title: "Reviewed against the original, never a diagnosis",
    body: "RinVita organises and translates records. It does not diagnose, does not give medical advice, and AI output should be checked against the source records.",
  },
];

export default function ConsumerPage({ config }: { config: ConsumerPageConfig }) {
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;
  const headingFont = "Cormorant Garamond";

  useEffect(() => {
    captureUtmParams();
  }, []);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: config.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div className="marketing-page" style={{ background: marketingColors.cream, color: marketingColors.ink, minHeight: "100vh" }}>
      <SEO
        title={config.seoTitle}
        description={config.seoDescription}
        path={`/${config.slug}`}
        jsonLd={faqSchema}
      />
      <MarketingStyles />
      <MarketingNav currentPage="home" />

      {/* Hero */}
      <section style={{ padding: `${isMobile ? 100 : 148}px ${paddingX}px ${isMobile ? 48 : 72}px` }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <span className="marketing-section-label">{config.eyebrow}</span>
          <h1 style={{ fontFamily: headingFont, fontSize: isMobile ? 36 : "clamp(40px,4.6vw,58px)", fontWeight: 300, lineHeight: 1.1, marginBottom: 18, letterSpacing: "-0.02em" }}>
            {config.headline}{" "}
            <em style={{ fontStyle: "italic", color: marketingColors.gold }}>{config.headlineAccent}</em>
          </h1>
          <p style={{ fontSize: isMobile ? 16 : 17.5, color: marketingColors.mutedText, lineHeight: 1.8, marginBottom: 26, fontWeight: 300 }}>
            {config.intro}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link to={SIGNUP_PATH} style={primaryCta}>{SIGNUP_CTA}</Link>
            <Link to="/demo" style={secondaryCta}>See an example</Link>
          </div>
          <p style={{ fontSize: 12.5, color: marketingColors.softText, marginTop: 14 }}>{SIGNUP_SUPPORT_LINE}</p>
        </div>
      </section>

      {/* Problems */}
      <section style={{ padding: `${isMobile ? 56 : 88}px ${paddingX}px`, background: marketingColors.cream2 }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 16 }}>
            {config.problems.map((p) => (
              <div key={p.title} style={cardStyle(isMobile)}>
                <h2 style={{ fontFamily: headingFont, fontSize: 22, fontWeight: 400, marginBottom: 10, lineHeight: 1.25 }}>{p.title}</h2>
                <p style={{ fontSize: 13.5, lineHeight: 1.8, color: marketingColors.mutedText, fontWeight: 300 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prose sections */}
      <section style={{ padding: `${isMobile ? 56 : 88}px ${paddingX}px` }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          {config.sections.map((s) => (
            <div key={s.heading} style={{ marginBottom: isMobile ? 40 : 56 }}>
              <h2 style={{ fontFamily: headingFont, fontSize: isMobile ? 27 : 34, fontWeight: 300, marginBottom: 14, lineHeight: 1.25 }}>
                {s.heading}
              </h2>
              {s.paragraphs.map((para) => (
                <p key={para} style={{ fontSize: 15.5, lineHeight: 1.9, color: marketingColors.mutedText, fontWeight: 300, marginBottom: 14 }}>
                  {para}
                </p>
              ))}
              {s.bullets && (
                <ul style={{ margin: "6px 0 0", padding: 0, listStyle: "none" }}>
                  {s.bullets.map((b) => (
                    <li key={b} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                      <span aria-hidden style={{ color: marketingColors.gold, marginTop: 2 }}>✦</span>
                      <span style={{ fontSize: 15, lineHeight: 1.8, color: marketingColors.mutedText, fontWeight: 300 }}>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Three steps */}
      <section style={{ padding: `${isMobile ? 56 : 88}px ${paddingX}px`, background: marketingColors.cream2 }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 32 : 52 }}>
            <span className="marketing-section-label">How it works</span>
            <h2 style={{ fontFamily: headingFont, fontSize: isMobile ? 29 : "clamp(32px,3.4vw,44px)", fontWeight: 300 }}>
              Upload records → Understand your history → Share when needed
            </h2>
          </div>
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 16 }}>
            {STEPS.map((s) => (
              <li key={s.step} style={cardStyle(isMobile)}>
                <div style={{ fontFamily: headingFont, fontSize: 26, color: marketingColors.gold, marginBottom: 8 }}>{s.step}</div>
                <h3 style={{ fontFamily: headingFont, fontSize: 21, fontWeight: 400, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.8, color: marketingColors.mutedText, fontWeight: 300 }}>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Trust */}
      <section style={{ padding: `${isMobile ? 56 : 88}px ${paddingX}px` }}>
        <div style={{ maxWidth: 1020, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 30 : 48 }}>
            <span className="marketing-section-label">What you can rely on</span>
            <h2 style={{ fontFamily: headingFont, fontSize: isMobile ? 29 : 40, fontWeight: 300 }}>Your records stay yours.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 16 }}>
            {TRUST.map((t) => (
              <div key={t.title} style={cardStyle(isMobile)}>
                <h3 style={{ fontFamily: headingFont, fontSize: 21, fontWeight: 400, marginBottom: 10, lineHeight: 1.3 }}>{t.title}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.8, color: marketingColors.mutedText, fontWeight: 300 }}>{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Limitations */}
      <section style={{ padding: `${isMobile ? 56 : 80}px ${paddingX}px`, background: marketingColors.cream2 }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <span className="marketing-section-label">Being clear about the limits</span>
          <h2 style={{ fontFamily: headingFont, fontSize: isMobile ? 27 : 34, fontWeight: 300, marginBottom: 18 }}>
            What RinVita does not do
          </h2>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {config.limitations.map((l) => (
              <li key={l} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
                <span aria-hidden style={{ color: marketingColors.gold, marginTop: 2 }}>—</span>
                <span style={{ fontSize: 15, lineHeight: 1.8, color: marketingColors.mutedText, fontWeight: 300 }}>{l}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: `${isMobile ? 56 : 88}px ${paddingX}px` }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 26 : 40 }}>
            <span className="marketing-section-label">Questions</span>
            <h2 style={{ fontFamily: headingFont, fontSize: isMobile ? 29 : 40, fontWeight: 300 }}>Answers before you start.</h2>
          </div>
          {config.faq.map((item) => (
            <details
              key={item.q}
              style={{
                background: marketingColors.surface,
                border: `1px solid ${marketingColors.goldBorder}`,
                borderRadius: 2,
                padding: isMobile ? "16px 18px" : "18px 22px",
                marginBottom: 10,
              }}
            >
              <summary style={{ cursor: "pointer", fontSize: 15.5, fontWeight: 500, lineHeight: 1.5, listStyle: "none" }}>
                {item.q}
              </summary>
              <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.8, color: marketingColors.mutedText, fontWeight: 300 }}>
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA + share + internal links */}
      <section style={{ padding: `${isMobile ? 56 : 80}px ${paddingX}px`, background: marketingColors.cream2 }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: headingFont, fontSize: isMobile ? 29 : 40, fontWeight: 300, marginBottom: 14 }}>
            Start your medical passport today.
          </h2>
          <p style={{ fontSize: 15, color: marketingColors.mutedText, lineHeight: 1.8, fontWeight: 300, marginBottom: 22 }}>
            Upload your first records and see your history organised in one place.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            <Link to={SIGNUP_PATH} style={primaryCta}>{SIGNUP_CTA}</Link>
            <Link to="/demo" style={secondaryCta}>See an example</Link>
          </div>
          <p style={{ fontSize: 12.5, color: marketingColors.softText, marginTop: 14 }}>{SIGNUP_SUPPORT_LINE}</p>

          <div style={{ marginTop: 40, textAlign: "left" }}>
            <ShareRinVita placement={config.slug} url={`https://rinvita.co.uk/${config.slug}`} />
          </div>

          <nav aria-label="Related pages" style={{ marginTop: 36, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            {config.related.map((r) => (
              <Link key={r.href} to={r.href} style={relatedLink}>
                {r.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

const primaryCta: React.CSSProperties = {
  display: "inline-block",
  padding: "14px 28px",
  background: marketingColors.gold,
  color: "hsl(var(--primary-foreground))",
  border: "none",
  borderRadius: 2,
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  cursor: "pointer",
  textDecoration: "none",
};

const secondaryCta: React.CSSProperties = {
  display: "inline-block",
  padding: "14px 28px",
  background: "transparent",
  color: marketingColors.gold,
  border: `1px solid ${marketingColors.goldBorder}`,
  borderRadius: 2,
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  cursor: "pointer",
  textDecoration: "none",
};

const relatedLink: React.CSSProperties = {
  padding: "9px 18px",
  border: `1px solid ${marketingColors.goldBorder}`,
  borderRadius: 2,
  color: marketingColors.gold,
  fontSize: 12.5,
  fontWeight: 600,
  letterSpacing: "0.04em",
  textDecoration: "none",
};

const cardStyle = (isMobile: boolean): React.CSSProperties => ({
  padding: isMobile ? "24px 20px" : "30px 26px",
  background: marketingColors.surface,
  border: `1px solid ${marketingColors.goldBorder}`,
  borderRadius: 2,
  height: "100%",
});
