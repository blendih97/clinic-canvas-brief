import { useEffect } from "react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import PartnerEnquiryForm from "@/components/marketing/PartnerEnquiryForm";
import {
  MarketingFooter,
  MarketingNav,
  MarketingStyles,
  marketingColors,
  useMarketingBreakpoint,
} from "@/components/marketing/shared";
import { captureUtmParams, trackEvent } from "@/lib/analytics";

export type PartnerPageConfig = {
  slug: "for-clinics" | "for-concierges";
  seoTitle: string;
  seoDescription: string;
  eyebrow: string;
  headline: string;
  headlineAccent: string;
  intro: string;
  problems: { title: string; body: string }[];
  benefits: { icon: string; title: string; body: string }[];
};

const WORKFLOW = [
  {
    step: "01",
    title: "Invite the patient",
    body: "Send a co-branded invitation before travel. The patient creates their own RinVita account — you don't hold or administer it.",
  },
  {
    step: "02",
    title: "The patient uploads records",
    body: "Letters, labs, imaging reports and prescriptions from any country, in any language, from a phone or laptop.",
  },
  {
    step: "03",
    title: "RinVita structures and translates",
    body: "Records are organised into medications, results, imaging and visits, with translation alongside the original document.",
  },
  {
    step: "04",
    title: "The patient shares a clinician-ready view",
    body: "A time-limited link the patient can revoke, showing a structured summary with the source documents behind it.",
  },
];

const PILOT_POINTS = [
  "Selected clinics and concierge providers only",
  "30 days",
  "Up to 10 patients",
  "No EHR integration required",
  "Guided setup and co-branded invitation materials",
  "Commercial terms agreed with you before launch",
  "Success review at the end of the pilot",
];

const FAQ = [
  {
    q: "Who owns the account and the data?",
    a: "The patient does. Each patient holds their own RinVita account and decides what is shared, with whom, and for how long. You are the distribution partner, not the account holder.",
  },
  {
    q: "Do we need EHR or PMS integration?",
    a: "No. Nothing needs to connect to your systems. Patients upload their own records and share a view with your clinicians, so a pilot can start without any IT project.",
  },
  {
    q: "Which languages are supported?",
    a: "Records in a wide range of languages — including Arabic, French, German, Turkish, Spanish, Portuguese, Russian, Hindi and Mandarin — can be translated, with the original document always kept alongside the translation.",
  },
  {
    q: "How accurate is the AI, and can clinicians check it?",
    a: "AI-generated structure and translation must be reviewed against the source records. Every extracted item stays traceable to the document it came from, so a clinician can open the original at any time. RinVita does not diagnose and does not replace clinical judgement.",
  },
  {
    q: "How is the information protected?",
    a: "Data is encrypted at rest and in transit, access is scoped to the account holder, and sharing links are time-limited and revocable by the patient. Our Security page sets out exactly what we do and do not claim.",
  },
  {
    q: "What does the founding partner pilot include?",
    a: "Thirty days, up to ten patients, guided setup, co-branded invitation materials, no integration work, and a success review at the end. Commercial terms are agreed with you before the pilot begins.",
  },
  {
    q: "Is RinVita an EHR or a diagnostic tool?",
    a: "Neither. It is a patient-owned medical passport that organises and translates records a patient already has, so they arrive prepared for their appointment.",
  },
];

export default function PartnerPage({ config }: { config: PartnerPageConfig }) {
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;

  useEffect(() => {
    captureUtmParams();
    trackEvent("b2b_page_view", { page: config.slug });
  }, [config.slug]);

  const goToForm = () => {
    trackEvent("pilot_cta_clicked", { page: config.slug });
    document.getElementById("apply")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const headingFont = "Cormorant Garamond";

  return (
    <div className="marketing-page" style={{ background: marketingColors.cream, color: marketingColors.ink, minHeight: "100vh" }}>
      <SEO title={config.seoTitle} description={config.seoDescription} path={`/${config.slug}`} />
      <MarketingStyles />
      <MarketingNav currentPage="home" />

      {/* Hero */}
      <section style={{ padding: `${isMobile ? 100 : 148}px ${paddingX}px ${isMobile ? 52 : 76}px` }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile || isTablet ? "1fr" : "1.05fr 0.95fr", gap: isMobile ? 36 : 60, alignItems: "center" }}>
          <div>
            <span className="marketing-section-label">{config.eyebrow}</span>
            <h1 style={{ fontFamily: headingFont, fontSize: isMobile ? 36 : "clamp(40px,4.6vw,58px)", fontWeight: 300, lineHeight: 1.1, marginBottom: 18, letterSpacing: "-0.02em" }}>
              {config.headline}{" "}
              <em style={{ fontStyle: "italic", color: marketingColors.gold }}>{config.headlineAccent}</em>
            </h1>
            <p style={{ fontSize: isMobile ? 16 : 17.5, color: marketingColors.mutedText, lineHeight: 1.75, marginBottom: 26, fontWeight: 300 }}>
              {config.intro}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <button onClick={goToForm} style={primaryCta}>Apply for a founding pilot</button>
              <Link to="/demo" style={secondaryCta}>View the patient experience</Link>
            </div>
            <p style={{ fontSize: 12, color: marketingColors.softText, marginTop: 14, lineHeight: 1.6 }}>
              A patient-owned medical passport distributed by trusted healthcare partners. Not an EHR. Not a
              diagnostic tool.
            </p>
          </div>

          <div style={{ padding: isMobile ? 24 : 32, background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 4 }}>
            <div style={{ fontFamily: headingFont, fontSize: 11, color: marketingColors.gold, letterSpacing: "0.12em", marginBottom: 16, textTransform: "uppercase" }}>
              Founding Partner Pilot
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {PILOT_POINTS.map((point) => (
                <li key={point} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
                  <span aria-hidden style={{ color: marketingColors.gold, fontSize: 13, marginTop: 3 }}>✦</span>
                  <span style={{ fontSize: 14, lineHeight: 1.6, fontWeight: 300 }}>{point}</span>
                </li>
              ))}
            </ul>
            <button onClick={goToForm} style={{ ...primaryCta, width: "100%", marginTop: 8 }}>
              Apply for a founding pilot
            </button>
          </div>
        </div>
      </section>

      {/* The operational problem */}
      <section style={{ padding: `${isMobile ? 60 : 92}px ${paddingX}px`, background: marketingColors.cream2 }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 34 : 56 }}>
            <span className="marketing-section-label">The operational problem</span>
            <h2 style={{ fontFamily: headingFont, fontSize: isMobile ? 29 : "clamp(32px,3.4vw,44px)", fontWeight: 300 }}>
              The records arrive late, in the wrong language, or not at all.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 16 }}>
            {config.problems.map((p) => (
              <div key={p.title} style={cardStyle(isMobile)}>
                <h3 style={{ fontFamily: headingFont, fontSize: 22, fontWeight: 400, marginBottom: 10, lineHeight: 1.25 }}>{p.title}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.75, color: marketingColors.mutedText, fontWeight: 300 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section style={{ padding: `${isMobile ? 60 : 92}px ${paddingX}px` }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 34 : 56 }}>
            <span className="marketing-section-label">How a partnership works</span>
            <h2 style={{ fontFamily: headingFont, fontSize: isMobile ? 29 : "clamp(32px,3.4vw,44px)", fontWeight: 300 }}>
              Four steps. No integration.
            </h2>
          </div>
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4,1fr)", gap: 16 }}>
            {WORKFLOW.map((s) => (
              <li key={s.step} style={cardStyle(isMobile)}>
                <div style={{ fontFamily: headingFont, fontSize: 26, color: marketingColors.gold, marginBottom: 8 }}>{s.step}</div>
                <h3 style={{ fontFamily: headingFont, fontSize: 21, fontWeight: 400, marginBottom: 8, lineHeight: 1.25 }}>{s.title}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.75, color: marketingColors.mutedText, fontWeight: 300 }}>{s.body}</p>
              </li>
            ))}
          </ol>
          <p style={{ maxWidth: 760, margin: `${isMobile ? 28 : 40}px auto 0`, textAlign: "center", fontSize: 13.5, lineHeight: 1.8, color: marketingColors.mutedText }}>
            AI-generated structure and translation must be reviewed against the source records before any clinical
            use — every item stays traceable to the original document. Patients decide what is shared, with whom,
            and for how long, and can revoke a link at any time.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section style={{ padding: `${isMobile ? 60 : 92}px ${paddingX}px`, background: marketingColors.cream2 }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 34 : 56 }}>
            <span className="marketing-section-label">What partners get</span>
            <h2 style={{ fontFamily: headingFont, fontSize: isMobile ? 29 : "clamp(32px,3.4vw,44px)", fontWeight: 300 }}>
              A better-prepared patient, without new admin.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 16 }}>
            {config.benefits.map((b) => (
              <div key={b.title} style={cardStyle(isMobile)}>
                <div aria-hidden style={{ width: 44, height: 44, borderRadius: "50%", border: `1px solid ${marketingColors.goldBorder}`, background: marketingColors.goldSoft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, color: marketingColors.gold, fontSize: 19 }}>
                  {b.icon}
                </div>
                <h3 style={{ fontFamily: headingFont, fontSize: 22, fontWeight: 400, marginBottom: 10, lineHeight: 1.25 }}>{b.title}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.75, color: marketingColors.mutedText, fontWeight: 300 }}>{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Apply */}
      <section id="apply" style={{ padding: `${isMobile ? 60 : 92}px ${paddingX}px`, scrollMarginTop: 80 }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <span className="marketing-section-label">Founding Partner Pilot</span>
            <h2 style={{ fontFamily: headingFont, fontSize: isMobile ? 29 : 40, fontWeight: 300, marginBottom: 12 }}>
              Apply for a founding pilot
            </h2>
            <p style={{ fontSize: 15, color: marketingColors.mutedText, lineHeight: 1.75, fontWeight: 300 }}>
              Tell us how your patients reach you and what happens to their records today. Please don't include any
              patient or medical information in this form.
            </p>
          </div>
          <PartnerEnquiryForm sourcePage={config.slug} />
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: `${isMobile ? 60 : 92}px ${paddingX}px`, background: marketingColors.cream2 }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 28 : 44 }}>
            <span className="marketing-section-label">Partner questions</span>
            <h2 style={{ fontFamily: headingFont, fontSize: isMobile ? 29 : 40, fontWeight: 300 }}>
              Answers before you commit.
            </h2>
          </div>
          {FAQ.map((item) => (
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
          <div style={{ textAlign: "center", marginTop: 28, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            <button onClick={goToForm} style={primaryCta}>Apply for a founding pilot</button>
            <Link to="/demo" style={secondaryCta}>View the patient experience</Link>
          </div>
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

const cardStyle = (isMobile: boolean): React.CSSProperties => ({
  padding: isMobile ? "24px 20px" : "30px 26px",
  background: marketingColors.surface,
  border: `1px solid ${marketingColors.goldBorder}`,
  borderRadius: 2,
  height: "100%",
});
