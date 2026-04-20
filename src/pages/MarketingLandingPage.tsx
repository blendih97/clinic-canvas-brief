import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LogoMark,
  MarketingFooter,
  MarketingNav,
  MarketingStyles,
  marketingColors,
  useMarketingBreakpoint,
  useReveal,
} from "@/components/marketing/shared";

function AppMockup({ scale = 1 }: { scale?: number }) {
  const docs = [
    { flag: "🇦🇪", name: "تقرير تحليل الدم الشامل", facility: "Mediclinic Dubai Mall" },
    { flag: "🇫🇷", name: "Compte rendu d'hospitalisation", facility: "Hôpital Lariboisière, Paris" },
    { flag: "🇹🇷", name: "Kardiyoloji Muayene Raporu", facility: "Acıbadem Hastanesi, İstanbul" },
    { flag: "🇸🇬", name: "全血细胞计数报告", facility: "Mount Elizabeth Hospital, Singapore" },
  ];

  const width = 300;
  const height = 640;

  return (
    <div style={{ transform: `scale(${scale})`, transformOrigin: "top center", width, height }}>
      <div
        style={{
          width,
          height,
          borderRadius: 40,
          background: marketingColors.surface,
          boxShadow: "0 28px 64px hsl(var(--foreground) / 0.18), 0 0 0 1px hsl(var(--foreground) / 0.08)",
          overflow: "hidden",
          position: "relative",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ position: "absolute", top: 11, left: "50%", transform: "translateX(-50%)", width: 100, height: 28, borderRadius: 16, background: "hsl(var(--foreground))", zIndex: 50 }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 48, zIndex: 10, display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 20px 7px", background: marketingColors.cream }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: marketingColors.ink }}>9:41</span>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <div style={{ width: 14, height: 8, borderRadius: 2, background: marketingColors.ink }} />
            <div style={{ width: 20, height: 8, borderRadius: 4, border: `1px solid ${marketingColors.softText}` }} />
          </div>
        </div>
        <div style={{ display: "flex", height: "100%", paddingTop: 48 }}>
          <div style={{ width: 68, background: marketingColors.cream2, display: "flex", flexDirection: "column", padding: "12px 0", borderRight: `1px solid ${marketingColors.goldBorder}` }}>
            <div style={{ padding: "0 0 12px", display: "flex", justifyContent: "center", borderBottom: `1px solid ${marketingColors.goldBorder}` }}>
              <LogoMark size={18} color={marketingColors.gold} />
            </div>
            {[
              { icon: "▦", label: "Overview", active: true },
              { icon: "◈", label: "Records", active: false },
              { icon: "⊙", label: "Imaging", active: false },
              { icon: "↗", label: "Share", active: false },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 4px", background: item.active ? marketingColors.goldSoft : "transparent", borderLeft: item.active ? `2px solid ${marketingColors.gold}` : "2px solid transparent" }}>
                <span style={{ fontSize: 12, color: item.active ? marketingColors.gold : marketingColors.softText }}>{item.icon}</span>
                <span style={{ fontSize: 7, color: item.active ? marketingColors.gold : marketingColors.softText, marginTop: 2 }}>{item.label}</span>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, background: marketingColors.cream, overflowY: "auto", padding: "10px 10px 24px" }}>
            <div style={{ background: marketingColors.cream2, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 5, padding: "6px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 8, color: marketingColors.mutedText }}>Free Trial — 8 days remaining</span>
              <div style={{ background: marketingColors.gold, color: "hsl(var(--primary-foreground))", fontSize: 7, fontWeight: 600, padding: "2px 6px", borderRadius: 3 }}>Upgrade</div>
            </div>
            <div style={{ fontFamily: "Cormorant Garamond", fontSize: 16, color: marketingColors.ink, marginBottom: 1 }}>Your Health Overview</div>
            <div style={{ fontSize: 8, color: marketingColors.softText, marginBottom: 10 }}>4 documents · 4 languages</div>
            <div style={{ background: marketingColors.surface, border: `1px solid ${marketingColors.surfaceBorder}`, borderRadius: 5, padding: "5px 8px", display: "flex", gap: 5, alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 9, color: marketingColors.faintText }}>🔍</span>
              <span style={{ fontSize: 8, color: marketingColors.faintText }}>Search records, facilities…</span>
            </div>
            <div style={{ background: marketingColors.gold, borderRadius: 7, padding: "10px 9px", marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: "hsl(var(--primary-foreground))" }}>Upload Document</div>
              <div style={{ fontSize: 7, color: "hsl(var(--primary-foreground) / 0.75)", marginTop: 1 }}>Any language · Any country · Any year</div>
            </div>
            <div style={{ fontSize: 8, fontWeight: 600, color: marketingColors.softText, marginBottom: 7, letterSpacing: "0.06em", textTransform: "uppercase" }}>Recent Documents</div>
            {docs.map((doc) => (
              <div key={doc.name} style={{ background: marketingColors.surface, border: `1px solid hsl(var(--foreground) / 0.07)`, borderRadius: 5, padding: "6px 8px", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 14 }}>{doc.flag}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 8, fontWeight: 500, color: marketingColors.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.name}</div>
                  <div style={{ fontSize: 7, color: marketingColors.softText, marginTop: 1 }}>{doc.facility}</div>
                </div>
                <div style={{ fontSize: 6, padding: "2px 4px", background: marketingColors.successSoft, border: `1px solid ${marketingColors.successBorder}`, borderRadius: 3, color: marketingColors.success, whiteSpace: "nowrap" }}>✓ Done</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)", width: 100, height: 3.5, borderRadius: 2, background: "hsl(var(--foreground) / 0.18)", zIndex: 60 }} />
      </div>
    </div>
  );
}

function Hero() {
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;

  return (
    <section style={{ minHeight: isMobile ? "auto" : "100vh", display: "flex", alignItems: "center", padding: isMobile ? "88px 20px 56px" : `120px ${paddingX}px 80px`, background: marketingColors.cream, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: `linear-gradient(hsl(var(--primary) / 0.05) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.05) 1px, transparent 1px)`, backgroundSize: "72px 72px", maskImage: "radial-gradient(ellipse 70% 60% at 50% 100%, transparent 40%, black 100%)" }} />
      <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: isMobile || isTablet ? "1fr" : "1fr 1fr", gap: isMobile ? 48 : 80, alignItems: "center" }}>
        <div style={{ animation: "marketing-fade-up 0.9s cubic-bezier(.16,1,.3,1) both" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", background: marketingColors.goldSoft, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2, marginBottom: isMobile ? 28 : 44 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: marketingColors.gold, animation: "marketing-pulse 2s infinite" }} />
            <span style={{ fontSize: isMobile ? 9 : 11, letterSpacing: "0.14em", color: marketingColors.gold, fontWeight: 500 }}>EARLY ACCESS — FIRST 100 FOUNDING MEMBERS</span>
          </div>
          <h1 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 40 : isTablet ? 52 : "clamp(44px,5vw,68px)", fontWeight: 300, lineHeight: 1.1, color: marketingColors.ink, marginBottom: isMobile ? 20 : 28, letterSpacing: "-0.02em" }}>
            Your medical history,
            <br />
            finally in one place.
            <br />
            <em style={{ fontStyle: "italic", color: marketingColors.gold }}>In every language.</em>
          </h1>
          <p style={{ fontSize: isMobile ? 16 : 17, lineHeight: 1.8, color: marketingColors.mutedText, maxWidth: 480, marginBottom: isMobile ? 32 : 48, fontWeight: 300 }}>
            For families who've lived in more than one country. Upload records from any hospital, any language, any year — and hand your next doctor a complete, translated health picture in 30 seconds.
          </p>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12, alignItems: isMobile ? "stretch" : "center" }}>
            <Link to="/auth?mode=signup" style={{ padding: isMobile ? "16px 24px" : "15px 32px", background: marketingColors.gold, borderRadius: 2, color: "hsl(var(--primary-foreground))", fontSize: 14, fontWeight: 600, letterSpacing: "0.06em", textDecoration: "none", textAlign: "center", boxShadow: "0 4px 24px hsl(var(--primary) / 0.35)" }}>
              Claim your founding spot
            </Link>
            <Link to="/demo" style={{ padding: isMobile ? "15px 24px" : "15px 28px", background: "transparent", border: `1px solid hsl(var(--foreground) / 0.18)`, borderRadius: 2, color: marketingColors.mutedText, fontSize: 14, textDecoration: "none", textAlign: "center" }}>
              Watch demo →
            </Link>
          </div>
          {isMobile && (
            <div style={{ marginTop: 28, display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  width: "100%",
                  maxWidth: 340,
                  height: 290,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", width: "72%", height: 34, borderRadius: "50%", background: "hsl(var(--primary) / 0.14)", filter: "blur(20px)" }} />
                <div style={{ transform: "translateY(0) scale(0.72)", transformOrigin: "top center" }}>
                  <AppMockup />
                </div>
              </div>
            </div>
          )}
          <div style={{ marginTop: isMobile ? 40 : 64, paddingTop: isMobile ? 28 : 40, borderTop: `1px solid hsl(var(--foreground) / 0.1)`, display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: isMobile ? "20px 16px" : 24 }}>
            {[
              ["50+", "languages", "From Arabic to Mandarin"],
              ["256-bit", "encryption", "Bank-level security"],
              ["EU data", "hosting", "Stored in Ireland"],
              ["UK", "registered", "ICO ZC123014"],
            ].map(([value, unit, sub]) => (
              <div key={value}>
                <div style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 24 : 26, color: marketingColors.gold, fontWeight: 400, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, color: "hsl(var(--foreground) / 0.7)", marginTop: 2, fontWeight: 500 }}>{unit}</div>
                <div style={{ fontSize: 10, color: marketingColors.softText, marginTop: 2, lineHeight: 1.4 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
        {!isMobile && (
          <div style={{ display: "flex", justifyContent: "center", animation: "marketing-fade-up 1s 0.12s cubic-bezier(.16,1,.3,1) both" }}>
            <div style={{ animation: "marketing-float 6s ease-in-out infinite", position: "relative" }}>
              <div style={{ position: "absolute", bottom: -30, left: "10%", right: "10%", height: 60, background: "hsl(var(--primary) / 0.14)", borderRadius: "50%", filter: "blur(24px)" }} />
              <AppMockup scale={isTablet ? 0.88 : 1} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function HowItWorks() {
  const ref = useReveal<HTMLDivElement>();
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;

  const steps = [
    {
      n: "01",
      title: "Send us your records",
      desc: "Photograph, scan, or upload any medical document — prescriptions, lab results, imaging reports, discharge letters, vaccination cards. From any hospital, any country, any decade.",
      icon: "↥",
    },
    {
      n: "02",
      title: "We organise everything",
      desc: "RinVita reads Arabic, Mandarin, Turkish, French, Russian and 50+ more languages — then translates, structures, and files your entire medical history into a clear digital vault.",
      icon: "◎",
    },
    {
      n: "03",
      title: "Share in 30 seconds",
      desc: "Generate a secure, time-limited link for any clinician, anywhere. They see a complete, translated summary in seconds. No accounts, no software, no waiting.",
      icon: "↗",
    },
  ];

  return (
    <section id="how-it-works" style={{ padding: `${isMobile ? 72 : 120}px ${paddingX}px`, background: marketingColors.cream2 }}>
      <div ref={ref} className="marketing-reveal" style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 48 : 80 }}>
          <span className="marketing-section-label">How it works</span>
          <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 34 : "clamp(34px,3.8vw,52px)", fontWeight: 300, color: marketingColors.ink }}>Three steps to total clarity</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: isMobile ? 2 : 0 }}>
          {steps.map((step, index) => (
            <div key={step.n} style={{ padding: isMobile ? "32px 24px" : "48px 44px", background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderLeft: !isMobile && index > 0 ? "none" : `1px solid ${marketingColors.goldBorder}` }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", border: `1px solid ${marketingColors.goldBorder}`, background: marketingColors.goldSoft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, color: marketingColors.gold, fontSize: 22 }}>{step.icon}</div>
              <div style={{ fontFamily: "Cormorant Garamond", fontSize: 11, color: "hsl(var(--primary) / 0.7)", letterSpacing: "0.1em", marginBottom: 8 }}>STEP {step.n}</div>
              <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 22 : 26, fontWeight: 400, color: marketingColors.ink, marginBottom: 12, lineHeight: 1.2 }}>{step.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: marketingColors.mutedText, fontWeight: 300 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyRinVita() {
  const ref = useReveal<HTMLDivElement>();
  const { isMobile } = useMarketingBreakpoint();

  return (
    <section style={{ padding: `${isMobile ? 72 : 100}px ${isMobile ? 20 : 56}px`, background: marketingColors.cream }}>
      <div ref={ref} className="marketing-reveal" style={{ maxWidth: 620, margin: "0 auto", textAlign: "center" }}>
        <span className="marketing-section-label">Why RinVita</span>
        <p style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 18 : "clamp(19px,2.2vw,26px)", fontWeight: 300, lineHeight: 1.85, color: "hsl(var(--foreground) / 0.8)", fontStyle: "italic", marginBottom: 36 }}>
          “We built RinVita for the people we kept seeing in international patient corridors: families arriving with a shoebox of records in three languages, trying to explain a parent's medications to a doctor who couldn't read them. There wasn't a tool for this. So we made one.”
        </p>
        <div style={{ width: 48, height: 1, background: marketingColors.goldStrong, margin: "0 auto" }} />
      </div>
    </section>
  );
}

function Features() {
  const ref = useReveal<HTMLDivElement>();
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;

  const features = [
    ["AI-Powered", "Multilingual AI", "Reads and translates medical records in 50+ languages with clinical-grade accuracy."],
    ["GDPR Compliant", "Secure Sharing", "Generate time-limited, encrypted links for any clinician worldwide and revoke access instantly."],
    ["Unified Record", "Complete History", "Blood results, imaging, medications, allergies, and records from every country in one timeline."],
    ["Up to 6 Members", "Family Plan", "Manage records for elderly parents, children, and dependents under one secure account."],
  ];

  return (
    <section id="features" style={{ padding: `${isMobile ? 72 : 120}px ${paddingX}px`, background: marketingColors.cream2 }}>
      <div ref={ref} className="marketing-reveal" style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 48 : 80 }}>
          <span className="marketing-section-label">Features</span>
          <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 32 : "clamp(34px,3.8vw,52px)", fontWeight: 300, color: marketingColors.ink }}>Built for real international lives</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : "repeat(2,1fr)", gap: 16 }}>
          {features.map(([tag, title, desc]) => (
            <div key={title} style={{ padding: isMobile ? "28px 24px" : 48, background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", border: `1px solid ${marketingColors.goldBorder}`, background: marketingColors.goldSoft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, color: marketingColors.gold, fontSize: 20 }}>✦</div>
              <div style={{ display: "inline-block", fontSize: 10, letterSpacing: "0.1em", color: marketingColors.gold, fontWeight: 500, padding: "3px 10px", border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 1, marginBottom: 12 }}>{tag}</div>
              <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 24 : 27, fontWeight: 400, color: marketingColors.ink, marginBottom: 10, lineHeight: 1.2 }}>{title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: marketingColors.mutedText, fontWeight: 300 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const ref = useReveal<HTMLDivElement>();
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  const plans = [
    { name: "Free Trial", price: "£0", period: "14 days", desc: "Upload one document. See your vault come alive. No card needed.", features: ["1 document upload", "AI extraction & translation", "Full access for 14 days"], cta: "Start free trial", popular: false },
    { name: "Standard", price: billing === "monthly" ? "£39" : "£33", period: "per month", desc: "Your entire medical history, from every country, always ready.", features: ["Unlimited documents", "Clinician sharing links", "Priority support"], cta: "Claim your founding spot", popular: true },
    { name: "Family", price: billing === "monthly" ? "£89.99" : "£74.99", period: "per month", desc: "One plan for the whole family, across every border.", features: ["Up to 6 members", "Separate health passports", "Family admin dashboard"], cta: "Start free trial", popular: false },
  ];

  return (
    <section id="pricing" style={{ padding: `${isMobile ? 72 : 120}px ${paddingX}px`, background: marketingColors.cream }}>
      <div ref={ref} className="marketing-reveal" style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 48 : 64 }}>
          <span className="marketing-section-label">Pricing</span>
          <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 32 : "clamp(34px,3.8vw,52px)", fontWeight: 300, color: marketingColors.ink, marginBottom: 28 }}>Transparent, simple pricing</h2>
          <div style={{ display: "inline-flex", background: marketingColors.surface, border: `1px solid hsl(var(--foreground) / 0.1)`, borderRadius: 2, padding: 3, gap: 2 }}>
            {(["monthly", "annual"] as const).map((option) => (
              <button key={option} onClick={() => setBilling(option)} style={{ padding: isMobile ? "7px 14px" : "8px 22px", background: billing === option ? marketingColors.goldSoft : "transparent", border: billing === option ? `1px solid ${marketingColors.goldStrong}` : "1px solid transparent", borderRadius: 1, color: billing === option ? marketingColors.gold : marketingColors.softText, fontSize: isMobile ? 12 : 13, fontWeight: 500, cursor: "pointer" }}>{option === "monthly" ? "Monthly" : "Annual — Save 15%"}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : "repeat(3,1fr)", gap: isMobile ? 16 : 20, alignItems: "start" }}>
          {plans.map((plan) => (
            <div key={plan.name} style={{ padding: plan.popular ? (isMobile ? "36px 24px" : "52px 44px") : (isMobile ? "28px 24px" : 44), background: marketingColors.surface, border: plan.popular ? `1.5px solid ${marketingColors.gold}` : `1px solid ${marketingColors.goldBorder}`, borderRadius: 2, position: "relative", transform: !isMobile && plan.popular ? "translateY(-8px)" : "none", boxShadow: plan.popular ? "0 12px 48px hsl(var(--primary) / 0.12)" : "none" }}>
              {plan.popular && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: marketingColors.gold, color: "hsl(var(--primary-foreground))", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", padding: "4px 16px", borderRadius: 1, whiteSpace: "nowrap" }}>MOST POPULAR</div>}
              <div style={{ fontFamily: "Cormorant Garamond", fontSize: 11, color: "hsl(var(--primary) / 0.7)", letterSpacing: "0.1em", marginBottom: 8 }}>{plan.name.toUpperCase()}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                <span style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 44 : 52, fontWeight: 300, color: marketingColors.ink, lineHeight: 1 }}>{plan.price}</span>
                <span style={{ fontSize: 13, color: marketingColors.softText }}>{plan.period}</span>
              </div>
              <p style={{ fontSize: 13, color: marketingColors.mutedText, marginTop: 8, marginBottom: 20, lineHeight: 1.6 }}>{plan.desc}</p>
              <div style={{ height: 1, background: marketingColors.goldBorder, marginBottom: 20 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 28 }}>
                {plan.features.map((feature) => (
                  <div key={feature} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: marketingColors.gold, fontSize: 14 }}>✓</span>
                    <span style={{ fontSize: 14, color: "hsl(var(--foreground) / 0.7)", fontWeight: 300 }}>{feature}</span>
                  </div>
                ))}
              </div>
              <Link to="/auth?mode=signup" style={{ width: "100%", display: "block", padding: "14px", background: plan.popular ? marketingColors.gold : "transparent", border: plan.popular ? "none" : `1px solid ${marketingColors.goldBorder}`, borderRadius: 2, color: plan.popular ? "hsl(var(--primary-foreground))" : marketingColors.gold, fontSize: 14, fontWeight: plan.popular ? 600 : 400, letterSpacing: "0.06em", textDecoration: "none", textAlign: "center" }}>{plan.cta}</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const ref = useReveal<HTMLDivElement>();
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;
  const [open, setOpen] = useState<number | null>(null);

  const items = [
    ["Is my medical data safe?", "Yes. Your data is encrypted, stored in Europe, and you control who sees your records."],
    ["What languages does RinVita support?", "50+ languages including Arabic, Mandarin, Spanish, French, Turkish, Russian, Polish, Hindi, Portuguese and more."],
    ["Will a doctor actually use the output?", "Yes. RinVita generates a clear, structured summary clinicians can scan in seconds, with originals alongside."],
    ["Can I manage records for my parents or children?", "Yes. The Family plan lets you manage up to six separate health profiles under one account."],
  ];

  return (
    <section id="faq" style={{ padding: `${isMobile ? 72 : 120}px ${paddingX}px`, background: marketingColors.cream2 }}>
      <div ref={ref} className="marketing-reveal" style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 48 : 72 }}>
          <span className="marketing-section-label">FAQ</span>
          <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 32 : "clamp(34px,3.8vw,52px)", fontWeight: 300, color: marketingColors.ink }}>Questions, answered.</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {items.map(([question, answer], index) => (
            <div key={question} style={{ borderTop: `1px solid hsl(var(--foreground) / 0.1)`, overflow: "hidden" }}>
              <button onClick={() => setOpen(open === index ? null : index)} style={{ width: "100%", padding: isMobile ? "20px 0" : "24px 0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", gap: 16 }}>
                <span style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 19 : 22, fontWeight: 400, color: marketingColors.ink, lineHeight: 1.3, flex: 1 }}>{question}</span>
                <span style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${marketingColors.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transform: open === index ? "rotate(45deg)" : "rotate(0deg)", color: marketingColors.gold, fontSize: 18 }}>+</span>
              </button>
              <div style={{ maxHeight: open === index ? 240 : 0, overflow: "hidden", transition: "max-height 0.4s cubic-bezier(.16,1,.3,1)" }}>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: marketingColors.mutedText, fontWeight: 300, paddingBottom: isMobile ? 20 : 28 }}>{answer}</p>
              </div>
            </div>
          ))}
          <div style={{ borderTop: `1px solid hsl(var(--foreground) / 0.1)` }} />
        </div>
      </div>
    </section>
  );
}

const MarketingLandingPage = () => {
  return (
    <div className="marketing-page" style={{ background: marketingColors.cream, color: marketingColors.ink }}>
      <MarketingStyles />
      <MarketingNav currentPage="home" />
      <Hero />
      <HowItWorks />
      <WhyRinVita />
      <Features />
      <Pricing />
      <FAQ />
      <MarketingFooter />
    </div>
  );
};

export default MarketingLandingPage;
