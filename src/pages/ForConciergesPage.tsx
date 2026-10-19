import { useEffect } from "react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import ConciergePilotForm from "@/components/marketing/ConciergePilotForm";
import { MarketingFooter, MarketingNav, MarketingStyles, marketingColors, useMarketingBreakpoint } from "@/components/marketing/shared";
import { Button } from "@/components/ui/button";
import { captureUtmParams, trackEvent } from "@/lib/analytics";

const PROBLEMS = [
  ["Records scattered across providers and countries", "Results, letters and reports stay in separate systems, inboxes and languages as clients move between countries."],
  ["Your team re-sends the same PDFs by email", "The same attachments are found, forwarded and explained again whenever a new specialist joins a client's care."],
  ["Clients arrive without their history", "Important context is missing at the appointment because it never reached the client in one usable, portable record."],
];

const PROGRAMME_STEPS = [
  ["01", "Invite your clients", "By email, or with your co-branded link or QR code. Each client creates their own RinVita account."],
  ["02", "Sponsor their plan", "Clients get full access, free for them, while your sponsorship runs."],
  ["03", "Clients keep their own records", "They store and review their records, and can request records from any provider via a secure upload link."],
  ["04", "Clients share with any doctor", "By one-time secure link or PDF. Your team sees sign-up and activity status only, never medical records."],
];

const CLIENT_BENEFITS = [
  "One place for their whole history across countries and languages",
  "Results tracked over time",
  "Medications, allergies and family profiles",
  "Sharing with any doctor by one-time secure link or PDF",
];

const TEAM_BENEFITS = [
  "Fewer email attachments and re-sends",
  "Clients who arrive prepared",
  "A premium, branded-feeling service you can include in your membership",
  "Sign-up and activity status for each client: invite status, join date, last active",
];

const TRUST_POINTS = [
  "UK company",
  "ICO registered — ZC123014",
  "Encrypted storage with UK GDPR-compliant providers",
  "Encrypted at rest and in transit",
  "RinVita does not diagnose or give medical advice",
];

const FAQ = [
  { q: "Can our team see client records?", a: "No. Partners never see medical records. Your team sees names, emails, invite status, join date and last active only. Clients share their records with doctors themselves." },
  { q: "Do clients have to pay?", a: "No. Pricing is agreed before the trial starts. If you continue, your plan begins on day 15; if not, your patients keep their accounts on the free plan." },
  { q: "Do you replace our clinical systems?", a: "No. RinVita sits alongside them as the client's own record." },
  { q: "Where is data stored?", a: "Stored encrypted with UK GDPR-compliant providers. See our Privacy Policy for the full list of processors." },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
};

export default function ForConciergesPage() {
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;

  useEffect(() => {
    captureUtmParams();
    trackEvent("b2b_page_view", { page: "for-concierges" });
  }, []);

  const goToForm = () => {
    trackEvent("pilot_cta_clicked", { page: "for-concierges" });
    document.getElementById("apply")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="marketing-page" style={{ background: marketingColors.cream, color: marketingColors.ink, minHeight: "100vh" }}>
      <SEO title="RinVita Partner Programme for Medical Concierges" description="Give every client a private, organised medical hub. Free 14-day trial — invite as many patients as you like." path="/for-concierges" jsonLd={faqJsonLd} />
      <MarketingStyles />
      <MarketingNav />

      <main>
        <section style={{ padding: `${isMobile ? 108 : 156}px ${paddingX}px ${isMobile ? 68 : 104}px` }}>
          <div style={{ maxWidth: 1040, margin: "0 auto" }}>
            <span className="marketing-section-label">For medical concierges and family offices</span>
            <h1 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 40 : "clamp(52px,6vw,76px)", fontWeight: 300, lineHeight: 1.04, maxWidth: 930, marginBottom: 24, letterSpacing: 0 }}>
              Every result you arrange, in your client's hands — organised.
            </h1>
            <p style={{ color: marketingColors.mutedText, fontSize: isMobile ? 16 : 19, fontWeight: 300, lineHeight: 1.75, maxWidth: 820, marginBottom: 30 }}>
              RinVita gives each of your clients a private medical hub, co-branded with your name. Your clients store, review and share their own records with any doctor, anywhere. You see who has joined, never their medical records.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Button onClick={goToForm} size="lg" className="h-auto rounded-sm px-7 py-3.5 uppercase" style={{ letterSpacing: "0.06em" }}>Start a 14-day trial</Button>
              <Button asChild variant="outline" size="lg" className="h-auto rounded-sm px-7 py-3.5 uppercase" style={{ letterSpacing: "0.06em" }}><Link to="/demo?utm_source=for-concierges">See a sample medical passport</Link></Button>
            </div>
          </div>
        </section>

        <Section tone="secondary" label="The problem" title="Your service connects the care. The records still fall between the gaps." paddingX={paddingX} isMobile={isMobile}>
          <div style={gridStyle(isMobile ? 1 : 3)}>{PROBLEMS.map(([title, body]) => <InfoCard key={title} title={title} body={body} />)}</div>
        </Section>

        <Section label="How the partner programme works" title="A client-owned hub, supported by your team." paddingX={paddingX} isMobile={isMobile} intro="The client owns their account and records at every step. Coming later, with each client's consent: sending records directly into their account.">
          <ol style={{ ...gridStyle(isMobile || isTablet ? 1 : 4), listStyle: "none", padding: 0, margin: 0 }}>{PROGRAMME_STEPS.map(([step, title, body]) => <li key={step} style={cardStyle}><div style={{ color: marketingColors.gold, fontFamily: "Cormorant Garamond", fontSize: 27, marginBottom: 10 }}>{step}</div><h3 style={cardTitle}>{title}</h3><p style={cardBody}>{body}</p></li>)}</ol>
        </Section>

        <Section tone="secondary" label="A better experience on both sides" title="Built around the client. Useful to the team around them." paddingX={paddingX} isMobile={isMobile}>
          <div style={gridStyle(isMobile ? 1 : 2)}>
            <BenefitList title="What your clients get" items={CLIENT_BENEFITS} />
            <BenefitList title="What your team gets" items={TEAM_BENEFITS} />
          </div>
        </Section>

        <section aria-label="Trust and security" style={{ padding: `${isMobile ? 34 : 42}px ${paddingX}px`, background: marketingColors.ink, color: marketingColors.cream }}>
          <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(5,1fr)", gap: 18 }}>
            {TRUST_POINTS.map((point) => <div key={point} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 13, lineHeight: 1.55 }}><span aria-hidden style={{ color: marketingColors.gold }}>✦</span><span>{point}</span></div>)}
          </div>
        </section>

        <section id="apply" style={{ padding: `${isMobile ? 68 : 100}px ${paddingX}px`, scrollMarginTop: 80 }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 34 }}>
              <span className="marketing-section-label">Free 14-day trial</span>
              <h2 style={sectionTitle(isMobile)}>Help shape the partner programme.</h2>
              <p style={{ ...cardBody, maxWidth: 720, margin: "14px auto 0", fontSize: 15 }}>
                Free 14-day trial — invite as many patients as you like. Setup and onboarding for your team are included. Pricing is agreed before the trial starts. If you continue, your plan begins on day 15; if not, your patients keep their accounts on the free plan.
              </p>
            </div>
            <ConciergePilotForm />
          </div>
        </section>

        <Section tone="secondary" label="Partner questions" title="What to know before applying." paddingX={paddingX} isMobile={isMobile}>
          <div style={{ maxWidth: 820, margin: "0 auto" }}>{FAQ.map((item) => <details key={item.q} style={{ ...cardStyle, height: "auto", padding: isMobile ? "16px 18px" : "18px 22px", marginBottom: 10 }}><summary style={{ cursor: "pointer", fontSize: 15.5, fontWeight: 500, lineHeight: 1.5, listStyle: "none" }}>{item.q}</summary><p style={{ ...cardBody, marginTop: 12 }}>{item.a}</p></details>)}</div>
        </Section>
      </main>

      <MarketingFooter />
    </div>
  );
}

function Section({ children, label, title, intro, tone, paddingX, isMobile }: { children: React.ReactNode; label: string; title: string; intro?: string; tone?: "secondary"; paddingX: number; isMobile: boolean }) {
  return <section style={{ padding: `${isMobile ? 64 : 94}px ${paddingX}px`, background: tone === "secondary" ? marketingColors.cream2 : marketingColors.cream }}><div style={{ maxWidth: 1120, margin: "0 auto" }}><div style={{ textAlign: "center", maxWidth: 760, margin: `${0} auto ${isMobile ? 34 : 52}px` }}><span className="marketing-section-label">{label}</span><h2 style={sectionTitle(isMobile)}>{title}</h2>{intro && <p style={{ ...cardBody, fontSize: 15, marginTop: 14 }}>{intro}</p>}</div>{children}</div></section>;
}

function InfoCard({ title, body }: { title: string; body: string }) { return <article style={cardStyle}><h3 style={cardTitle}>{title}</h3><p style={cardBody}>{body}</p></article>; }
function BenefitList({ title, items }: { title: string; items: string[] }) { return <div style={cardStyle}><h3 style={{ ...cardTitle, fontSize: 27, marginBottom: 20 }}>{title}</h3><ul style={{ listStyle: "none", padding: 0, margin: 0 }}>{items.map((item) => <li key={item} style={{ display: "flex", gap: 11, marginBottom: 14, fontSize: 14, lineHeight: 1.65 }}><span aria-hidden style={{ color: marketingColors.gold }}>✦</span><span>{item}</span></li>)}</ul></div>; }

const gridStyle = (columns: number): React.CSSProperties => ({ display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: 16 });
const sectionTitle = (isMobile: boolean): React.CSSProperties => ({ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 31 : "clamp(34px,3.5vw,46px)", fontWeight: 300, lineHeight: 1.12, letterSpacing: 0 });
const cardStyle: React.CSSProperties = { padding: "28px 25px", background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2, height: "100%" };
const cardTitle: React.CSSProperties = { fontFamily: "Cormorant Garamond", fontSize: 23, fontWeight: 400, lineHeight: 1.25, marginBottom: 10 };
const cardBody: React.CSSProperties = { color: marketingColors.mutedText, fontSize: 13.5, fontWeight: 300, lineHeight: 1.75 };