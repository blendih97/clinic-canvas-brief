import { useState } from "react";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import {
  MarketingFooter,
  MarketingNav,
  MarketingStyles,
  marketingColors,
  useMarketingBreakpoint,
} from "@/components/marketing/shared";

const PRACTICE_TYPES = [
  "Private GP practice",
  "Travel medicine clinic",
  "Specialist consultancy",
  "Cosmetic / aesthetic clinic",
  "Dental practice",
  "Concierge / executive health",
  "Insurer / broker",
  "Other",
];

const ForCliniciansPage = () => {
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [practiceName, setPracticeName] = useState("");
  const [practiceType, setPracticeType] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("submit-b2b-enquiry", {
        body: {
          name: name.trim(),
          email: email.trim(),
          practice_name: practiceName.trim(),
          practice_type: practiceType,
          message: message.trim(),
          website, // honeypot
        },
      });
      if (fnError) throw new Error(fnError.message || "Submission failed");
      if (data?.error) throw new Error(data.error);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please email info@rinvita.co.uk directly.");
    } finally {
      setLoading(false);
    }
  };

  const pillars = [
    {
      icon: "◎",
      title: "Cuts admin time per visit",
      body: "Patients arrive with their full history already organised, translated, and structured. No more flipping through paper or chasing previous providers.",
    },
    {
      icon: "✦",
      title: "Better patient retention",
      body: "Give patients a tangible, branded record of their care they can take anywhere. They'll come back to you to add to it.",
    },
    {
      icon: "↗",
      title: "Effortless referrals",
      body: "When patients see specialists or move abroad, share a complete translated summary in one secure link — without dictating letters.",
    },
    {
      icon: "🔒",
      title: "Patient-owned, clinic-aligned",
      body: "Patients control their data; you stay clinically aligned. UK GDPR compliant, EU-hosted, ICO registered. Audit trail on every share.",
    },
  ];

  return (
    <div className="marketing-page" style={{ background: marketingColors.cream, color: marketingColors.ink, minHeight: "100vh" }}>
      <SEO
        title="RinVita for Clinics & Private Practices — Patient Records Vault"
        description="Offer your patients a secure, multilingual medical records vault. Reduce admin, improve retention, and make referrals effortless. UK GDPR compliant."
        path="/for-clinics"
      />
      <MarketingStyles />
      <MarketingNav currentPage="home" />

      {/* Hero */}
      <section style={{ padding: `${isMobile ? 100 : 140}px ${paddingX}px ${isMobile ? 56 : 80}px`, background: marketingColors.cream }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile || isTablet ? "1fr" : "1.1fr 1fr", gap: isMobile ? 40 : 64, alignItems: "center" }}>
          <div>
            <span className="marketing-section-label">For clinics & practices</span>
            <h1 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 36 : "clamp(40px,4.6vw,58px)", fontWeight: 300, color: marketingColors.ink, lineHeight: 1.1, marginBottom: 18, letterSpacing: "-0.02em" }}>
              Give your patients a medical record
              <br />
              <em style={{ fontStyle: "italic", color: marketingColors.gold }}>they actually keep.</em>
            </h1>
            <p style={{ fontSize: isMobile ? 16 : 17, color: marketingColors.mutedText, lineHeight: 1.7, marginBottom: 24, fontWeight: 300 }}>
              RinVita is a secure, multilingual patient records vault you can offer alongside your existing systems. Patients keep their lab results, scans, prescriptions and letters in one organised place — and bring them back to you, ready for the next visit.
            </p>
            <a href="#enquire" style={{ display: "inline-block", padding: "14px 28px", background: marketingColors.gold, color: "hsl(var(--primary-foreground))", textDecoration: "none", borderRadius: 2, fontSize: 14, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", boxShadow: "0 6px 24px hsl(var(--primary) / 0.35)" }}>
              Enquire now
            </a>
            <p style={{ fontSize: 12, color: marketingColors.softText, marginTop: 12 }}>
              No commitment · We'll show you exactly how it works in your practice
            </p>
          </div>

          <div style={{ padding: 32, background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 4 }}>
            <div style={{ fontFamily: "Cormorant Garamond", fontSize: 11, color: marketingColors.gold, letterSpacing: "0.12em", marginBottom: 16, textTransform: "uppercase" }}>What you get</div>
            {[
              "Co-branded patient vault (your name visible)",
              "Patients can upload records from any provider in any language",
              "AI-translated summaries in 50+ languages",
              "Secure clinician-share links (your team gets full access)",
              "Audit log of every access and share",
              "Optional: branded onboarding emails to your patients",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                <span style={{ color: marketingColors.gold, fontSize: 13, marginTop: 3 }}>✦</span>
                <span style={{ fontSize: 14, color: marketingColors.ink, lineHeight: 1.6, fontWeight: 300 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section style={{ padding: `${isMobile ? 64 : 96}px ${paddingX}px`, background: marketingColors.cream2 }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 40 : 64 }}>
            <span className="marketing-section-label">Why offer RinVita</span>
            <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 30 : "clamp(32px,3.4vw,46px)", fontWeight: 300, color: marketingColors.ink }}>
              Modern patients expect modern records.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 16 }}>
            {pillars.map((p) => (
              <div key={p.title} style={{ padding: isMobile ? "26px 22px" : "32px 28px", background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", border: `1px solid ${marketingColors.goldBorder}`, background: marketingColors.goldSoft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, color: marketingColors.gold, fontSize: 20 }}>{p.icon}</div>
                <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: 22, fontWeight: 400, color: marketingColors.ink, marginBottom: 10, lineHeight: 1.25 }}>{p.title}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.75, color: marketingColors.mutedText, fontWeight: 300 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enquiry form */}
      <section id="enquire" style={{ padding: `${isMobile ? 64 : 96}px ${paddingX}px`, background: marketingColors.cream }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <span className="marketing-section-label">Get in touch</span>
            <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 30 : 40, fontWeight: 300, color: marketingColors.ink, marginBottom: 12 }}>
              Enquire now
            </h2>
            <p style={{ fontSize: 15, color: marketingColors.mutedText, lineHeight: 1.7, fontWeight: 300 }}>
              Tell us a little about your practice and we'll reach out within one working day.
            </p>
          </div>

          {submitted ? (
            <div style={{ padding: 32, background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 4, textAlign: "center" }}>
              <div style={{ fontSize: 40, color: marketingColors.gold, marginBottom: 12 }}>✓</div>
              <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: 24, fontWeight: 400, color: marketingColors.ink, marginBottom: 8 }}>Thank you</h3>
              <p style={{ fontSize: 14, color: marketingColors.mutedText, lineHeight: 1.7 }}>
                We've received your message and will be in touch within one working day.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} style={{ padding: isMobile ? 24 : 36, background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 4, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Honeypot */}
              <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }} aria-hidden="true" />

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: marketingColors.ink, marginBottom: 6 }}>Your name *</label>
                <input required type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: marketingColors.ink, marginBottom: 6 }}>Work email *</label>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: marketingColors.ink, marginBottom: 6 }}>Practice or clinic name</label>
                <input type="text" value={practiceName} onChange={(e) => setPracticeName(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: marketingColors.ink, marginBottom: 6 }}>Type of practice</label>
                <select value={practiceType} onChange={(e) => setPracticeType(e.target.value)} style={inputStyle}>
                  <option value="">Select…</option>
                  {PRACTICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: marketingColors.ink, marginBottom: 6 }}>What are you hoping RinVita could help with?</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} placeholder="e.g. we see a lot of international patients with records in other languages…" />
              </div>

              {error && (
                <div style={{ padding: 12, background: "hsl(0 70% 50% / 0.08)", border: "1px solid hsl(0 70% 50% / 0.3)", borderRadius: 2, fontSize: 13, color: "hsl(0 70% 35%)" }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "14px",
                  background: loading ? marketingColors.goldSoft : marketingColors.gold,
                  color: loading ? marketingColors.softText : "hsl(var(--primary-foreground))",
                  border: "none", borderRadius: 2,
                  fontSize: 14, fontWeight: 600, letterSpacing: "0.06em",
                  cursor: loading ? "not-allowed" : "pointer",
                  textTransform: "uppercase",
                }}
              >
                {loading ? "Sending…" : "Send enquiry"}
              </button>
              <p style={{ fontSize: 11, color: marketingColors.softText, textAlign: "center", lineHeight: 1.6 }}>
                Or email us directly at <a href="mailto:info@rinvita.co.uk" style={{ color: marketingColors.gold }}>info@rinvita.co.uk</a>
              </p>
            </form>
          )}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  border: `1px solid ${marketingColors.goldBorder}`,
  borderRadius: 2,
  background: marketingColors.surface,
  fontSize: 14,
  color: marketingColors.ink,
};

export default ForCliniciansPage;
