import { MarketingFooter, MarketingNav, MarketingStyles, marketingColors, useMarketingBreakpoint } from "@/components/marketing/shared";

const SecurityPage = () => {
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;

  const sections = [
    {
      title: "Encryption at rest and in transit",
      body: "All medical documents are encrypted using AES-256 in storage and TLS 1.3 in transit. Decryption keys are scoped per user — no RinVita employee can read your documents without an explicit, logged access grant from you.",
    },
    {
      title: "EU data residency",
      body: "All primary infrastructure runs on EU regions (Ireland). Your records do not leave the EU/UK perimeter except when you explicitly generate a share link for a clinician outside that region.",
    },
    {
      title: "UK GDPR & ICO registration",
      body: "RinVita Ltd is registered with the UK Information Commissioner's Office (ICO Registration ZC123014). Health records are processed under Article 9(2)(h) — provision of health care — with explicit consent collected at signup.",
    },
    {
      title: "Source documents always preserved",
      body: "We never replace your records. Every AI translation and structured summary keeps the original document one click away. AI-generated content is visibly marked throughout the app.",
    },
    {
      title: "Audit logging",
      body: "Every record access, share-link generation, and data export is logged with a timestamp and actor. You can download your full audit trail at any time from Settings.",
    },
    {
      title: "Your rights",
      body: "Export every byte of your data (Article 15). Delete your account and all associated records, irreversibly, in one click. Revoke any active share link at any time. We respond to data subject requests within 30 days.",
    },
  ];

  return (
    <div className="marketing-page" style={{ background: marketingColors.cream, color: marketingColors.ink }}>
      <MarketingStyles />
      <MarketingNav currentPage="home" />
      <section style={{ padding: `${isMobile ? 100 : 140}px ${paddingX}px ${isMobile ? 56 : 80}px`, background: marketingColors.cream }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <span className="marketing-section-label">Security & Trust</span>
          <h1 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 36 : 56, fontWeight: 300, color: marketingColors.ink, lineHeight: 1.1, marginBottom: 20, letterSpacing: "-0.02em" }}>
            How we protect your medical data.
          </h1>
          <p style={{ fontSize: isMobile ? 15 : 17, color: marketingColors.mutedText, lineHeight: 1.8, fontWeight: 300, marginBottom: 12 }}>
            Confidential health records demand more than a privacy policy. Here is exactly how RinVita is built — what we do, what we never do, and what you can verify yourself.
          </p>
          <div style={{ fontSize: 12, color: marketingColors.softText, letterSpacing: "0.04em", marginBottom: 48 }}>
            ICO ZC123014 · EU infrastructure (Ireland) · End-to-end encrypted
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {sections.map((s) => (
              <div key={s.title} style={{ padding: "28px 0", borderTop: `1px solid hsl(var(--foreground) / 0.1)` }}>
                <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 22 : 26, fontWeight: 400, color: marketingColors.ink, marginBottom: 10 }}>{s.title}</h2>
                <p style={{ fontSize: 14.5, lineHeight: 1.8, color: marketingColors.mutedText, fontWeight: 300 }}>{s.body}</p>
              </div>
            ))}
            <div style={{ borderTop: `1px solid hsl(var(--foreground) / 0.1)`, paddingTop: 24, marginTop: 12, fontSize: 13, color: marketingColors.softText }}>
              Questions? Email <a href="mailto:security@rinvita.health" style={{ color: marketingColors.gold }}>security@rinvita.health</a>.
            </div>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
};

export default SecurityPage;
