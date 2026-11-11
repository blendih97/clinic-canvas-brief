import { MarketingFooter, MarketingNav, MarketingStyles, marketingColors, useMarketingBreakpoint } from "@/components/marketing/shared";
import SEO from "@/components/SEO";

const SecurityPage = () => {
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;

  const sections = [
    {
      title: "Encryption at rest and in transit",
      body: "All medical documents are encrypted with AES-256 in storage and TLS 1.3 in transit. Access is isolated per user through row-level security. Only RinVita administrators can reach the systems that hold records, using two-step sign-in, and only to support you or meet a legal obligation. We do not currently offer end-to-end (zero-knowledge) encryption — our AI translation and extraction features require documents to be processed on secure server infrastructure.",
    },
    {
      title: "Encrypted storage with UK GDPR-compliant providers",
      body: "Your records are stored encrypted (AES-256 at rest, TLS 1.3 in transit) with UK GDPR-compliant providers. See our Privacy Policy for the full list of processors.",
    },
    {
      title: "Data protection & ICO registration",
      body: "RinVita Ltd is registered with the UK Information Commissioner's Office (ICO Registration ZC123014). Registration is a legal requirement for data controllers, not a certification or an audit. The service is designed with UK GDPR principles in mind: health data is processed on the basis of your explicit consent, collected at signup, and the legal basis and condition for processing special category data are kept under ongoing review.",
    },
    {
      title: "Source documents always preserved",
      body: "We never replace your records. Every AI translation and structured summary keeps the original document one click away. AI-generated content is visibly marked throughout the app.",
    },
    {
      title: "Sharing you control",
      body: "Doctors see your records through secure links you create. Links are view only, so documents and scans cannot be downloaded from them, and they expire automatically. Doctors accept access terms before viewing, and that acceptance is recorded. You can revoke any link at any time.",
    },
    {
      title: "Your rights",
      body: "Download your health data, original documents and scans at any time (Article 15). Delete your account and all associated records, irreversibly, in one click. Revoke any active share link at any time. We respond to data subject requests within 30 days.",
    },
  ];

  return (
    <div className="marketing-page" style={{ background: marketingColors.cream, color: marketingColors.ink }}>
      <SEO title="Security & Trust — RinVita" description="AES-256 encryption at rest, TLS 1.3 in transit, UK GDPR-compliant providers, ICO registered, view-only sharing you control. How RinVita protects your medical data." path="/security" />
      <MarketingStyles />
      <MarketingNav />
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
            ICO ZC123014 · AES-256 at rest · TLS 1.3 in transit · UK GDPR-compliant providers
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {sections.map((s) => (
              <div key={s.title} style={{ padding: "28px 0", borderTop: `1px solid hsl(var(--foreground) / 0.1)` }}>
                <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 22 : 26, fontWeight: 400, color: marketingColors.ink, marginBottom: 10 }}>{s.title}</h2>
                <p style={{ fontSize: 14.5, lineHeight: 1.8, color: marketingColors.mutedText, fontWeight: 300 }}>{s.body}</p>
              </div>
            ))}
            <div style={{ borderTop: `1px solid hsl(var(--foreground) / 0.1)`, paddingTop: 24, marginTop: 12, fontSize: 13, color: marketingColors.softText }}>
              Questions? Email <a href="mailto:info@rinvita.co.uk" style={{ color: marketingColors.gold }}>info@rinvita.co.uk</a>.
            </div>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
};

export default SecurityPage;
