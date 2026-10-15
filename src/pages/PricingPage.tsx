import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { MarketingFooter, MarketingNav, MarketingStyles, marketingColors, useMarketingBreakpoint } from "@/components/marketing/shared";
import { Pricing } from "@/pages/MarketingLandingPage";

const PricingPage = () => {
  const { isMobile } = useMarketingBreakpoint();
  return (
    <div className="marketing-page" style={{ background: marketingColors.cream, color: marketingColors.ink }}>
      <SEO
        title="Pricing — RinVita"
        description="Start free with 3 documents. Standard £149/year, Family £249/year for up to 6 members. Clinics and concierges can sponsor their patients."
        path="/pricing"
      />
      <MarketingStyles />
      <MarketingNav />
      <section style={{ padding: isMobile ? "104px 20px 0" : "140px 56px 0" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", padding: isMobile ? "22px 20px" : "26px 32px", background: marketingColors.surface, border: `1px solid ${marketingColors.gold}`, borderRadius: 2, display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", gap: 16 }}>
          <p style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 22 : 26, fontWeight: 400, lineHeight: 1.3, margin: 0 }}>
            Clinics and concierges: <em style={{ color: marketingColors.gold }}>sponsor your patients</em>
          </p>
          <Link to="/for-clinics" style={{ padding: "13px 24px", background: marketingColors.gold, color: "hsl(var(--primary-foreground))", borderRadius: 2, fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", textDecoration: "none", textAlign: "center", whiteSpace: "nowrap" }}>
            Book a demo
          </Link>
        </div>
      </section>
      <Pricing />
      <MarketingFooter />
    </div>
  );
};

export default PricingPage;
