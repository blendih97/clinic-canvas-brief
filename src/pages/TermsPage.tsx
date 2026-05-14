import { MarketingFooter, MarketingNav, MarketingStyles, marketingColors, useMarketingBreakpoint } from "@/components/marketing/shared";
import SEO from "@/components/SEO";

const TermsPage = () => {
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;

  const headingStyle: React.CSSProperties = {
    fontFamily: "Cormorant Garamond",
    fontSize: isMobile ? 22 : 26,
    fontWeight: 400,
    color: marketingColors.ink,
    marginTop: 36,
    marginBottom: 12,
  };
  const bodyStyle: React.CSSProperties = {
    fontSize: 14.5,
    lineHeight: 1.8,
    color: marketingColors.mutedText,
    fontWeight: 300,
    marginBottom: 12,
  };

  return (
    <div className="marketing-page" style={{ background: marketingColors.cream, color: marketingColors.ink }}>
      <SEO title="Terms of Service — RinVita" description="Interim Terms of Service governing use of RinVita during Early Access. Full terms from our solicitor coming shortly." path="/terms" />
      <MarketingStyles />
      <MarketingNav currentPage="home" />
      <section style={{ padding: `${isMobile ? 100 : 140}px ${paddingX}px ${isMobile ? 56 : 80}px`, background: marketingColors.cream }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <span className="marketing-section-label">Legal</span>
          <h1 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 36 : 56, fontWeight: 300, color: marketingColors.ink, lineHeight: 1.1, marginBottom: 12, letterSpacing: "-0.02em" }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: 13, color: marketingColors.softText, letterSpacing: "0.04em", marginBottom: 28 }}>
            RinVita — last updated 8 May 2026
          </p>

          <div style={{
            background: marketingColors.goldSoft,
            border: `1px solid ${marketingColors.goldBorder}`,
            borderLeft: `3px solid ${marketingColors.gold}`,
            padding: "18px 22px",
            borderRadius: 6,
            marginBottom: 36,
          }}>
            <p style={{
              fontFamily: "Cormorant Garamond",
              fontStyle: "italic",
              fontSize: isMobile ? 15 : 17,
              lineHeight: 1.6,
              color: marketingColors.gold,
              margin: 0,
              fontWeight: 500,
            }}>
              Our Terms of Service are being finalised by our solicitor and will be published shortly. The interim Terms below apply during our Early Access period. For any questions, please contact <a href="mailto:hello@rinvita.co.uk" style={{ color: marketingColors.gold, textDecoration: "underline" }}>hello@rinvita.co.uk</a>.
            </p>
          </div>

          <div style={{
            background: "hsl(var(--card))",
            border: `1px solid ${marketingColors.goldBorder}`,
            borderLeft: `3px solid ${marketingColors.gold}`,
            padding: "18px 22px",
            borderRadius: 6,
            marginBottom: 36,
          }}>
            <div style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              color: marketingColors.gold,
              fontWeight: 600,
              textTransform: "uppercase",
              marginBottom: 8,
            }}>
              AI Usage Disclaimer
            </div>
            <p style={{
              fontSize: isMobile ? 14 : 15,
              lineHeight: 1.7,
              color: marketingColors.ink,
              margin: 0,
              fontWeight: 400,
            }}>
              RinVita uses artificial intelligence to extract and structure
              information from uploaded medical documents. This process is
              automated and may contain inaccuracies. Always verify important
              medical information with a qualified healthcare professional.
              RinVita is not a medical device and does not provide medical advice.
            </p>
          </div>

          <h2 style={headingStyle}>1. About these Terms</h2>
          <p style={bodyStyle}>These interim Terms of Service ("Terms") govern your use of the RinVita web application and related services (the "Service") provided by RinVita Ltd, a company registered in England and Wales (company number 17163153), with registered office at Unit A435, 4-6 Greatorex Street, London E1 5NF, United Kingdom ("RinVita", "we", "us"). By creating an account or otherwise using the Service, you agree to be bound by these Terms.</p>

          <h2 style={headingStyle}>2. Early Access</h2>
          <p style={bodyStyle}>The Service is currently offered in Early Access. Features may change, be added, or be removed without notice. Free access is provided until 1 June 2026; paid pricing thereafter will be communicated in advance, with any promised discounts honoured. Early Access is provided on an "as is" basis and you should not rely on the Service as a sole record of medical information.</p>

          <h2 style={headingStyle}>3. Your account</h2>
          <p style={bodyStyle}>You are responsible for keeping your login credentials confidential and for all activity that occurs under your account. You must be at least 18 years old to create an account. Information you provide during signup must be accurate and kept up to date. You must notify us immediately at <a href="mailto:hello@rinvita.co.uk" style={{ color: marketingColors.gold }}>hello@rinvita.co.uk</a> if you suspect unauthorised access.</p>

          <h2 style={headingStyle}>4. Acceptable use</h2>
          <p style={bodyStyle}>You agree not to:</p>
          <ul style={{ ...bodyStyle, paddingLeft: 20 }}>
            <li>Upload content you do not have the right to upload, or content concerning another person without their consent (except where you are their legal representative);</li>
            <li>Use the Service to provide medical advice to others, to diagnose or treat any condition, or in any way that requires regulatory authorisation we do not hold;</li>
            <li>Attempt to access, probe, or disrupt the Service or its underlying infrastructure, including reverse engineering, scraping, or rate-limit evasion;</li>
            <li>Use the Service for unlawful, fraudulent, harassing, or harmful activity;</li>
            <li>Upload malware or content that infringes intellectual property, privacy, or other rights.</li>
          </ul>

          <h2 style={headingStyle}>5. Medical disclaimer</h2>
          <p style={bodyStyle}>RinVita is a personal records workspace. It is not a medical device and does not provide medical advice, diagnosis, or treatment. AI-generated translations and summaries are an aid to understanding your records, not a substitute for professional clinical judgement. Always consult a qualified healthcare professional for medical decisions. In an emergency, contact local emergency services.</p>

          <h2 style={headingStyle}>6. Your content</h2>
          <p style={bodyStyle}>You retain all ownership of records, documents, and other content you upload ("Your Content"). You grant RinVita a limited licence to host, store, process, and display Your Content solely for the purpose of providing the Service to you (including AI extraction, translation, and the share-link features you initiate). We do not use Your Content to train AI models. We do not sell Your Content.</p>

          <h2 style={headingStyle}>7. Our intellectual property</h2>
          <p style={bodyStyle}>The Service, including its software, design, branding, and the RinVita name and logo, is owned by RinVita Ltd or its licensors and is protected by intellectual property laws. These Terms do not transfer any of those rights to you.</p>

          <h2 style={headingStyle}>8. Limitation of liability</h2>
          <p style={bodyStyle}>To the fullest extent permitted by law, and given the Early Access nature of the Service, RinVita's total liability to you for any claim arising out of or in connection with these Terms or the Service is limited to the greater of (a) the fees you have paid us in the twelve months preceding the claim, or (b) £50. We are not liable for indirect, incidental, special, consequential, or punitive damages, or for loss of data, profit, revenue, or goodwill. Nothing in these Terms limits liability that cannot be limited by law (including liability for death or personal injury caused by negligence, or for fraud).</p>

          <h2 style={headingStyle}>9. Termination</h2>
          <p style={bodyStyle}>You may delete your account at any time from Settings; this irreversibly removes your records from the Service. We may suspend or terminate your account if you breach these Terms, if required by law, or if we discontinue the Service, in which case we will give reasonable notice where possible.</p>

          <h2 style={headingStyle}>10. Changes to these Terms</h2>
          <p style={bodyStyle}>We will publish updated Terms on this page once finalised by our solicitor. Material changes will be notified by email or in-app where required. Continued use of the Service after changes take effect constitutes acceptance.</p>

          <h2 style={headingStyle}>11. Governing law</h2>
          <p style={bodyStyle}>These Terms are governed by the laws of England and Wales. The courts of England and Wales have exclusive jurisdiction over any dispute arising out of or in connection with these Terms or the Service, except that consumers may bring proceedings in the courts of their country of residence where this right cannot be excluded.</p>

          <h2 style={headingStyle}>12. Contact us</h2>
          <p style={bodyStyle}>Questions about these Terms? Email <a href="mailto:hello@rinvita.co.uk" style={{ color: marketingColors.gold }}>hello@rinvita.co.uk</a>.</p>

          <div style={{ borderTop: `1px solid hsl(var(--foreground) / 0.1)`, paddingTop: 24, marginTop: 40, fontSize: 13, color: marketingColors.softText, lineHeight: 1.7 }}>
            RinVita Ltd · Unit A435, 4-6 Greatorex Street, London E1 5NF, United Kingdom<br />
            Company registration number: 17163153 · ICO registration number: ZC123014<br />
            <span style={{ fontStyle: "italic" }}>Last updated: 8 May 2026 (interim version, pending solicitor finalisation)</span>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
};

export default TermsPage;
