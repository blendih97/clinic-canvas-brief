// Outbound campaign destination for partner organisations arriving from a cold
// email. Noindexed on purpose: this is a sales asset, not an organic landing
// page. Every fragment shown comes from the fictional Amira K. demo dataset.

import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import InstantDemo from "@/components/marketing/InstantDemo";
import {
  LogoMark,
  MarketingFooter,
  MarketingStyles,
  marketingColors,
  useMarketingBreakpoint,
  useReveal,
} from "@/components/marketing/shared";
import { SAMPLE_DOCS } from "@/data/sampleAmiraK";
import { captureUtmParams, getUtmParams, trackEvent } from "@/lib/analytics";

const PILOT_MAILTO =
  "mailto:info@rinvita.co.uk" +
  "?subject=" +
  encodeURIComponent("Founding partner pilot — 10 patients") +
  "&body=" +
  encodeURIComponent(
    [
      "Hello RinVita team,",
      "",
      "We would like to discuss a 30-day founding partner pilot for up to 10 patients.",
      "",
      "Organisation:",
      "Country:",
      "Type (clinic / concierge / international patient team / other):",
      "Roughly how many international patients per month:",
      "Best time for a short call:",
      "",
      "Thank you,",
    ].join("\n"),
  );

/** Campaign attribution only — never a name, email address or medical content. */
function campaignPayload(extra: Record<string, string> = {}) {
  const { utm_source, utm_medium, utm_campaign, utm_content } = getUtmParams();
  return { utm_source, utm_medium, utm_campaign, utm_content, ...extra };
}

const VALUE_CARDS = [
  {
    audience: "Clinics",
    title: "The history arrives before the patient does",
    points: [
      "Prior imaging reports, labs and discharge letters organised in one view.",
      "Foreign-language documents translated with the original kept alongside.",
      "Your coordinators stop chasing records across time zones.",
    ],
  },
  {
    audience: "Concierge & family offices",
    title: "Continuity for clients treated in several countries",
    points: [
      "One health history per family member, maintained as they move.",
      "No sensitive documents living in ad-hoc email or messaging threads.",
      "Clients control who sees what, and for how long.",
    ],
  },
  {
    audience: "International patient teams",
    title: "Fewer incomplete files at intake",
    points: [
      "Invite the patient once; they add records from any provider or country.",
      "Structured medications, allergies and results ready for triage.",
      "No integration with your existing systems required to start.",
    ],
  },
];

const CLINICIAN_RECEIVES = [
  {
    title: "Structured medical timeline",
    body: "Visits, procedures and results ordered by date across every provider the patient has used.",
  },
  {
    title: "Current medications and allergies",
    body: "Extracted from the patient's own documents and listed together, with duplicates merged.",
  },
  {
    title: "Translated source documents",
    body: "Records in other languages are translated into English, and the original stays attached.",
  },
  {
    title: "Source traceability",
    body: "Every extracted item points back to the document it came from, so it can be checked against the original.",
  },
  {
    title: "Controlled, time-limited sharing",
    body: "The patient creates the link, it expires, and they can revoke it at any moment from their account.",
  },
];

const PILOT_POINTS = [
  "30 days, start to review",
  "Up to 10 patients",
  "Guided setup with our team",
  "Co-branded invitation materials",
  "No EHR integration required",
  "Success and commercial review at the end",
];

export default function PartnerDemoPage() {
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;
  const viewed = useRef(false);

  useEffect(() => {
    captureUtmParams();
    if (viewed.current) return;
    viewed.current = true;
    trackEvent("partner_demo_view", campaignPayload());
  }, []);

  const scrollToSample = () => {
    trackEvent("sample_passport_click", campaignPayload({ placement: "partner_demo" }));
    document.getElementById("sample-passport-demo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onPilotEmail = () => {
    trackEvent("pilot_email_click", campaignPayload({ placement: "partner_demo" }));
  };

  const goldButton: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: isMobile ? "16px 24px" : "17px 34px",
    background: marketingColors.gold,
    color: "hsl(var(--primary-foreground))",
    border: "none",
    borderRadius: 2,
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    textDecoration: "none",
    cursor: "pointer",
    width: isMobile ? "100%" : "auto",
  };

  const ghostButton: React.CSSProperties = {
    ...goldButton,
    background: "transparent",
    color: marketingColors.gold,
    border: `1px solid ${marketingColors.goldBorder}`,
  };

  return (
    <div className="marketing-page" style={{ background: marketingColors.cream, minHeight: "100vh" }}>
      <SEO
        title="RinVita partner demo — see the record before the appointment"
        description="A 60-second look at how RinVita organises and translates a patient's records from multiple countries into a clinician-reviewable health history."
        path="/partner-demo"
        noindex
      />
      <MarketingStyles />

      {/* Minimal campaign header — no navigation maze for a cold visitor. */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `18px ${paddingX}px`,
          borderBottom: `1px solid ${marketingColors.goldBorder}`,
          background: marketingColors.surface,
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <LogoMark size={22} color={marketingColors.gold} />
          <span style={{ fontFamily: "Cormorant Garamond", fontSize: 20, fontWeight: 500, letterSpacing: "0.03em", color: marketingColors.ink }}>
            RinVita
          </span>
        </Link>
        <a href={PILOT_MAILTO} onClick={onPilotEmail} style={{ fontSize: 13, color: marketingColors.gold, textDecoration: "none", fontWeight: 500 }}>
          Talk to us →
        </a>
      </header>

      <Hero
        isMobile={isMobile}
        paddingX={paddingX}
        goldButton={goldButton}
        ghostButton={ghostButton}
        onSample={scrollToSample}
        onPilotEmail={onPilotEmail}
      />

      <Transformation isMobile={isMobile} isTablet={isTablet} paddingX={paddingX} />

      <section id="sample-passport-demo" style={{ background: marketingColors.cream }}>
        <InstantDemo variant="clinics" />
      </section>

      <ValueCards isMobile={isMobile} isTablet={isTablet} paddingX={paddingX} />

      <ClinicianReceives isMobile={isMobile} isTablet={isTablet} paddingX={paddingX} />

      <PilotBlock
        isMobile={isMobile}
        paddingX={paddingX}
        goldButton={goldButton}
        ghostButton={ghostButton}
        onPilotEmail={onPilotEmail}
        onSample={scrollToSample}
      />

      <MarketingFooter />
    </div>
  );
}

type SectionProps = { isMobile: boolean; isTablet?: boolean; paddingX: number };

function Hero({
  isMobile,
  paddingX,
  goldButton,
  ghostButton,
  onSample,
  onPilotEmail,
}: SectionProps & {
  goldButton: React.CSSProperties;
  ghostButton: React.CSSProperties;
  onSample: () => void;
  onPilotEmail: () => void;
}) {
  return (
    <section style={{ padding: `${isMobile ? 56 : 96}px ${paddingX}px`, background: marketingColors.cream }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <span className="marketing-section-label">60-second partner demo</span>
        <h1
          style={{
            fontFamily: "Cormorant Garamond",
            fontSize: isMobile ? 38 : "clamp(44px,5vw,68px)",
            fontWeight: 300,
            lineHeight: 1.08,
            color: marketingColors.ink,
            marginBottom: 22,
          }}
        >
          See the record before the appointment.
        </h1>
        <p style={{ fontSize: isMobile ? 15.5 : 18, lineHeight: 1.75, color: marketingColors.mutedText, fontWeight: 300, maxWidth: 640, marginBottom: 14 }}>
          Patients arrive with a history spread across providers, countries, languages and formats. With RinVita they bring
          those records with them: uploaded once, organised and translated into a clinician-reviewable health history, with
          every extracted item traceable back to the original document.
        </p>
        <p style={{ fontSize: isMobile ? 13.5 : 15, lineHeight: 1.7, color: marketingColors.softText, fontWeight: 300, maxWidth: 640, marginBottom: 32 }}>
          RinVita does not diagnose, interpret results clinically or replace clinical review. It organises what the patient
          already has so your clinicians can review it against the source.
        </p>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12, marginBottom: 18 }}>
          <button type="button" onClick={onSample} style={goldButton}>
            View the sample passport
          </button>
          <a href={PILOT_MAILTO} onClick={onPilotEmail} style={ghostButton}>
            Discuss a 10-patient pilot
          </a>
        </div>
        <p style={{ fontSize: 13, color: marketingColors.softText, fontWeight: 300 }}>
          We are selecting a small founding group of partner organisations for the first live pilots.
        </p>
      </div>
    </section>
  );
}

function Transformation({ isMobile, isTablet, paddingX }: SectionProps) {
  const ref = useReveal<HTMLDivElement>();
  const dubai = SAMPLE_DOCS.find((d) => d.id === "dubai-labs") ?? SAMPLE_DOCS[0];
  const paris = SAMPLE_DOCS.find((d) => d.id === "paris-discharge") ?? SAMPLE_DOCS[1];
  const istanbul = SAMPLE_DOCS.find((d) => d.id === "istanbul-cardiology") ?? SAMPLE_DOCS[2];

  const panel: React.CSSProperties = {
    background: marketingColors.surface,
    border: `1px solid ${marketingColors.goldBorder}`,
    borderRadius: 3,
    padding: isMobile ? "22px 20px" : "26px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  };

  const stageLabel = (n: string, title: string) => (
    <div style={{ marginBottom: 4 }}>
      <div style={{ fontSize: 10, letterSpacing: "0.16em", color: marketingColors.gold, fontWeight: 500, marginBottom: 6 }}>{n}</div>
      <div style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 22 : 24, fontWeight: 400, color: marketingColors.ink }}>{title}</div>
    </div>
  );

  const fragment = (children: React.ReactNode, muted = false) => (
    <div
      style={{
        border: `1px solid ${muted ? "hsl(var(--foreground) / 0.1)" : marketingColors.goldBorder}`,
        borderRadius: 2,
        padding: "10px 12px",
        background: muted ? "hsl(var(--foreground) / 0.02)" : marketingColors.cream,
        fontSize: 12.5,
        lineHeight: 1.5,
        color: marketingColors.mutedText,
      }}
    >
      {children}
    </div>
  );

  return (
    <section style={{ padding: `${isMobile ? 64 : 100}px ${paddingX}px`, background: marketingColors.cream2 }}>
      <div ref={ref} className="marketing-reveal" style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 36 : 56 }}>
          <span className="marketing-section-label">What changes</span>
          <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 30 : "clamp(32px,3.6vw,46px)", fontWeight: 300, color: marketingColors.ink }}>
            From scattered paperwork to a reviewable history.
          </h2>
          <p style={{ fontSize: 13, color: marketingColors.softText, marginTop: 10 }}>
            Fragments below come from our fictional demo patient, Amira K. Nothing here is a real medical record.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : "repeat(3, 1fr)", gap: 16, alignItems: "stretch" }}>
          <div style={panel}>
            {stageLabel("01", "Scattered records")}
            {fragment(
              <>
                <div style={{ direction: "rtl", fontSize: 13, color: marketingColors.ink, marginBottom: 4 }}>{dubai.originalTitle}</div>
                <div style={{ fontSize: 11, color: marketingColors.faintText }}>{dubai.facility} · PDF · {dubai.language}</div>
              </>,
              true,
            )}
            {fragment(
              <>
                <div style={{ fontSize: 13, color: marketingColors.ink, marginBottom: 4 }}>{paris.originalTitle}</div>
                <div style={{ fontSize: 11, color: marketingColors.faintText }}>{paris.facility} · scan · {paris.language}</div>
              </>,
              true,
            )}
            {fragment(
              <>
                <div style={{ fontSize: 13, color: marketingColors.ink, marginBottom: 4 }}>{istanbul.originalTitle}</div>
                <div style={{ fontSize: 11, color: marketingColors.faintText }}>{istanbul.facility} · photo · {istanbul.language}</div>
              </>,
              true,
            )}
            <p style={{ fontSize: 12.5, color: marketingColors.softText, lineHeight: 1.6 }}>
              Three countries, three languages, three formats. No one has seen them together.
            </p>
          </div>

          <div style={panel}>
            {stageLabel("02", "Organised & translated")}
            {fragment(
              <>
                <div style={{ fontSize: 13, color: marketingColors.ink, marginBottom: 6 }}>{dubai.translatedTitle}</div>
                {(dubai.markers ?? []).slice(0, 3).map((m) => (
                  <div key={m.name} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11.5, marginBottom: 3 }}>
                    <span>{m.name}</span>
                    <span style={{ color: m.status === "normal" ? marketingColors.success : marketingColors.gold, fontWeight: 500 }}>
                      {m.value}
                    </span>
                  </div>
                ))}
              </>,
            )}
            {fragment(
              <>
                <div style={{ fontSize: 11, letterSpacing: "0.1em", color: marketingColors.gold, marginBottom: 6 }}>TIMELINE</div>
                {[dubai, paris, istanbul].map((d) => (
                  <div key={d.id} style={{ fontSize: 11.5, marginBottom: 3 }}>
                    <span style={{ color: marketingColors.ink }}>{d.timeline.label}</span> — {d.timeline.note}
                  </div>
                ))}
              </>,
            )}
            <p style={{ fontSize: 12.5, color: marketingColors.softText, lineHeight: 1.6 }}>
              Translated into English, structured into results, medications and visits, with the original attached to each entry.
            </p>
          </div>

          <div style={panel}>
            {stageLabel("03", "Shared with the right clinician")}
            {fragment(
              <>
                <div style={{ fontSize: 11, letterSpacing: "0.1em", color: marketingColors.gold, marginBottom: 6 }}>SHARED VIEW</div>
                <div style={{ fontSize: 12, color: marketingColors.ink, marginBottom: 4 }}>Amira K. · health history</div>
                <div style={{ fontSize: 11.5 }}>Link expires automatically</div>
                <div style={{ fontSize: 11.5 }}>Revocable at any time by the patient</div>
                <div style={{ fontSize: 11.5 }}>Source document beside every entry</div>
              </>,
            )}
            {fragment(
              <>
                <div style={{ fontSize: 11.5, color: marketingColors.ink, marginBottom: 4 }}>Reviewed by the clinician</div>
                <div style={{ fontSize: 11.5 }}>
                  Extracted items are shown next to the record they came from, so anything can be checked before it is relied on.
                </div>
              </>,
            )}
            <p style={{ fontSize: 12.5, color: marketingColors.softText, lineHeight: 1.6 }}>
              The patient decides who receives the link and can withdraw it afterwards.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ValueCards({ isMobile, isTablet, paddingX }: SectionProps) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section style={{ padding: `${isMobile ? 64 : 100}px ${paddingX}px`, background: marketingColors.cream }}>
      <div ref={ref} className="marketing-reveal" style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 36 : 56 }}>
          <span className="marketing-section-label">Where it fits</span>
          <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 30 : "clamp(32px,3.6vw,46px)", fontWeight: 300, color: marketingColors.ink }}>
            Built around how your team already works.
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(3,1fr)", gap: 16 }}>
          {VALUE_CARDS.map((card) => (
            <div
              key={card.audience}
              style={{
                padding: isMobile ? "26px 22px" : "32px 28px",
                background: marketingColors.surface,
                border: `1px solid ${marketingColors.goldBorder}`,
                borderRadius: 2,
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  color: marketingColors.gold,
                  fontWeight: 500,
                  padding: "3px 10px",
                  border: `1px solid ${marketingColors.goldBorder}`,
                  marginBottom: 14,
                  textTransform: "uppercase",
                }}
              >
                {card.audience}
              </div>
              <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 22 : 25, fontWeight: 400, color: marketingColors.ink, marginBottom: 12, lineHeight: 1.25 }}>
                {card.title}
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {card.points.map((p) => (
                  <li key={p} style={{ display: "flex", gap: 8, fontSize: 14, lineHeight: 1.65, color: marketingColors.mutedText, fontWeight: 300, marginBottom: 8 }}>
                    <span aria-hidden="true" style={{ color: marketingColors.gold }}>✓</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClinicianReceives({ isMobile, isTablet, paddingX }: SectionProps) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section style={{ padding: `${isMobile ? 64 : 100}px ${paddingX}px`, background: marketingColors.cream2 }}>
      <div ref={ref} className="marketing-reveal" style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ marginBottom: isMobile ? 32 : 48 }}>
          <span className="marketing-section-label">What a clinician receives</span>
          <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 30 : "clamp(32px,3.6vw,46px)", fontWeight: 300, color: marketingColors.ink }}>
            A history that can be reviewed, not a summary to take on trust.
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "1fr 1fr", gap: 14 }}>
          {CLINICIAN_RECEIVES.map((item) => (
            <div
              key={item.title}
              style={{
                padding: isMobile ? "20px 18px" : "24px 24px",
                background: marketingColors.surface,
                border: `1px solid ${marketingColors.surfaceBorder}`,
                borderRadius: 2,
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 500, color: marketingColors.ink, marginBottom: 8 }}>{item.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: marketingColors.mutedText, fontWeight: 300 }}>{item.body}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: marketingColors.softText, marginTop: 20, fontWeight: 300 }}>
          Records are encrypted at rest and in transit, access is scoped to the patient's account, and sharing is time-limited
          and revocable. AI-extracted content is intended to be reviewed against the source documents by a clinician.
        </p>
      </div>
    </section>
  );
}

function PilotBlock({
  isMobile,
  paddingX,
  goldButton,
  ghostButton,
  onPilotEmail,
  onSample,
}: SectionProps & {
  goldButton: React.CSSProperties;
  ghostButton: React.CSSProperties;
  onPilotEmail: () => void;
  onSample: () => void;
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section id="pilot" style={{ padding: `${isMobile ? 64 : 100}px ${paddingX}px`, background: marketingColors.cream }}>
      <div
        ref={ref}
        className="marketing-reveal"
        style={{
          maxWidth: 940,
          margin: "0 auto",
          background: marketingColors.surface,
          border: `1px solid ${marketingColors.goldStrong}`,
          borderRadius: 3,
          padding: isMobile ? "32px 24px" : "52px 56px",
        }}
      >
        <span className="marketing-section-label">Founding partner pilot</span>
        <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 30 : 44, fontWeight: 300, color: marketingColors.ink, marginBottom: 14, lineHeight: 1.1 }}>
          Run it with ten patients, then decide.
        </h2>
        <p style={{ fontSize: isMobile ? 14.5 : 16, lineHeight: 1.75, color: marketingColors.mutedText, fontWeight: 300, marginBottom: 24 }}>
          A short, contained pilot with your own patients — no systems work, no change to how your clinicians practise.
          Commercial terms are agreed with you before anything goes live.
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
          {PILOT_POINTS.map((p) => (
            <li key={p} style={{ display: "flex", gap: 10, fontSize: 14.5, color: marketingColors.ink, fontWeight: 300 }}>
              <span aria-hidden="true" style={{ color: marketingColors.gold }}>✓</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12, marginBottom: 16 }}>
          <a href={PILOT_MAILTO} onClick={onPilotEmail} style={goldButton}>
            Discuss a 10-patient pilot
          </a>
          <button type="button" onClick={onSample} style={ghostButton}>
            View the sample passport
          </button>
        </div>
        <p style={{ fontSize: 13, color: marketingColors.softText, fontWeight: 300 }}>
          We are selecting a small founding group of partner organisations for the first live pilots.{" "}
          <Link to="/for-clinics" style={{ color: marketingColors.gold, textDecoration: "none" }}>
            More for clinics →
          </Link>{" "}
          <Link to="/for-concierges" style={{ color: marketingColors.gold, textDecoration: "none" }}>
            More for concierges →
          </Link>
        </p>
      </div>
    </section>
  );
}
