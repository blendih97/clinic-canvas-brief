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

const PATIENT_BANDS = ["<50", "50–200", "200–500", "500+"];
// Wire values to what the edge function validates
const PATIENT_VALUE: Record<string, string> = {
  "<50": "<50",
  "50–200": "50-200",
  "200–500": "200-500",
  "500+": "500+",
};

const ONE_PAGER_URL = "/RinVita_ClinicOnePager.pdf";

const ClinicsPartnersPage = () => {
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [role, setRole] = useState("");
  const [band, setBand] = useState("");
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
      const { data, error: fnError } = await supabase.functions.invoke("submit-clinic-enquiry", {
        body: {
          name: name.trim(),
          email: email.trim(),
          organisation: organisation.trim(),
          role: role.trim(),
          patients_per_month: PATIENT_VALUE[band] || "",
          message: message.trim(),
          website,
        },
      });
      if (fnError) throw new Error(fnError.message || "Submission failed");
      if (data?.error) throw new Error(data.error);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please email hello@rinvita.co.uk directly.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: "✦",
      title: "Any language",
      body: "Arabic, French, German, Turkish, Chinese, Hindi and 40+ more — automatically detected and translated.",
    },
    {
      icon: "◎",
      title: "Fully structured",
      body: "Labs, imaging, medications and visit history extracted and organised by AI into one clean record.",
    },
    {
      icon: "🔒",
      title: "Clinically secure",
      body: "ICO registered (ZC123014), UK GDPR compliant, AES-256 encrypted, EU hosted in Ireland.",
    },
  ];

  const steps = [
    { n: "01", t: "Patient uploads", d: "Records in any language, from any provider." },
    { n: "02", t: "AI structures it", d: "Labs, scans and meds organised automatically." },
    { n: "03", t: "Clinician receives", d: "A clean, translated summary in seconds." },
    { n: "04", t: "Better care", d: "Faster consultations, fewer gaps, safer decisions." },
  ];

  const benefits = [
    "Faster consultations — patients arrive with their history already organised and translated.",
    "Reduced clinical risk — flagged out-of-range values and medication conflicts surfaced up front.",
    "Patients arrive prepared — labs, scans and prescriptions ready to discuss, not chase.",
    "Premium patient experience — a tangible, branded record of their care they can take anywhere.",
  ];

  return (
    <div className="marketing-page" style={{ background: marketingColors.cream, color: marketingColors.ink, minHeight: "100vh" }}>
      <SEO
        title="RinVita for Clinics & Concierge Services — Translated Medical Records"
        description="RinVita translates, structures and consolidates international patients' medical history into one clinician-ready record — in 45+ languages, ready in seconds."
        path="/clinics"
      />
      <MarketingStyles />
      <MarketingNav currentPage="home" />

      {/* Hero */}
      <section style={{ padding: `${isMobile ? 110 : 150}px ${paddingX}px ${isMobile ? 60 : 88}px`, background: marketingColors.cream, position: "relative", overflow: "hidden" }}>
        {/* Concentric circle motif */}
        <div aria-hidden style={{ position: "absolute", top: -120, right: -120, width: 460, height: 460, borderRadius: "50%", border: `1px solid ${marketingColors.goldBorder}`, opacity: 0.5 }} />
        <div aria-hidden style={{ position: "absolute", top: -60, right: -60, width: 340, height: 340, borderRadius: "50%", border: `1px solid ${marketingColors.goldBorder}`, opacity: 0.35 }} />
        <div aria-hidden style={{ position: "absolute", top: 0, right: 0, width: 220, height: 220, borderRadius: "50%", border: `1px solid ${marketingColors.goldBorder}`, opacity: 0.25 }} />

        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <span className="marketing-section-label">For clinics & concierge services</span>
          <h1 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 34 : "clamp(40px,4.8vw,62px)", fontWeight: 300, color: marketingColors.ink, lineHeight: 1.1, marginBottom: 22, letterSpacing: "-0.02em" }}>
            Medical records in Arabic.<br />
            Lab results in French.<br />
            <em style={{ fontStyle: "italic", color: marketingColors.gold }}>A new doctor who can read neither.</em>
          </h1>
          <p style={{ fontSize: isMobile ? 16 : 18, color: marketingColors.mutedText, lineHeight: 1.7, marginBottom: 32, fontWeight: 300, maxWidth: 680, marginLeft: "auto", marginRight: "auto" }}>
            RinVita translates, organises and consolidates your international patients' medical history into one structured record — in 45+ languages, ready in seconds.
          </p>
          <a
            href="#enquire"
            style={{
              display: "inline-block",
              padding: "15px 32px",
              background: marketingColors.gold,
              color: "hsl(var(--primary-foreground))",
              textDecoration: "none",
              borderRadius: 2,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              boxShadow: "0 6px 24px hsl(var(--primary) / 0.35)",
            }}
          >
            Get in touch
          </a>
        </div>
      </section>

      {/* Three features */}
      <section style={{ padding: `${isMobile ? 64 : 96}px ${paddingX}px`, background: marketingColors.cream2 }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 20 }}>
            {features.map((f) => (
              <div key={f.title} style={{ padding: isMobile ? "28px 24px" : "36px 30px", background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2, textAlign: "left" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", border: `1px solid ${marketingColors.goldBorder}`, background: marketingColors.goldSoft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, color: marketingColors.gold, fontSize: 22 }}>{f.icon}</div>
                <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: 24, fontWeight: 400, color: marketingColors.ink, marginBottom: 10, lineHeight: 1.25 }}>{f.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.75, color: marketingColors.mutedText, fontWeight: 300 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: `${isMobile ? 64 : 96}px ${paddingX}px`, background: marketingColors.cream }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 40 : 64 }}>
            <span className="marketing-section-label">How it works</span>
            <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 30 : "clamp(32px,3.4vw,46px)", fontWeight: 300, color: marketingColors.ink }}>
              From scattered records to clinician-ready.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4,1fr)", gap: 16 }}>
            {steps.map((s, i) => (
              <div key={s.n} style={{ position: "relative", padding: "28px 24px", background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2 }}>
                <div style={{ fontFamily: "Cormorant Garamond", fontSize: 14, color: marketingColors.gold, letterSpacing: "0.12em", marginBottom: 10 }}>{s.n}</div>
                <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: 22, fontWeight: 400, color: marketingColors.ink, marginBottom: 8, lineHeight: 1.25 }}>{s.t}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.7, color: marketingColors.mutedText, fontWeight: 300 }}>{s.d}</p>
                {!isMobile && i < steps.length - 1 && (
                  <div aria-hidden style={{ position: "absolute", top: "50%", right: -10, fontSize: 18, color: marketingColors.gold, opacity: 0.6 }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why clinics recommend */}
      <section style={{ padding: `${isMobile ? 64 : 96}px ${paddingX}px`, background: marketingColors.cream2 }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 36 : 56 }}>
            <span className="marketing-section-label">Why clinics recommend RinVita</span>
            <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 30 : "clamp(32px,3.4vw,46px)", fontWeight: 300, color: marketingColors.ink }}>
              Modern care for international patients.
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {benefits.map((b) => (
              <div key={b} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "18px 22px", background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2 }}>
                <span style={{ color: marketingColors.gold, fontSize: 16, marginTop: 2 }}>✦</span>
                <span style={{ fontSize: 15, color: marketingColors.ink, lineHeight: 1.65, fontWeight: 300 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enquiry */}
      <section id="enquire" style={{ padding: `${isMobile ? 64 : 96}px ${paddingX}px`, background: marketingColors.cream }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile || isTablet ? "1fr" : "1.4fr 1fr", gap: isMobile ? 36 : 56, alignItems: "start" }}>
          <div>
            <span className="marketing-section-label">Get in touch</span>
            <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 30 : 40, fontWeight: 300, color: marketingColors.ink, marginBottom: 14 }}>
              Tell us about your clinic.
            </h2>
            <p style={{ fontSize: 15, color: marketingColors.mutedText, lineHeight: 1.7, fontWeight: 300, marginBottom: 28 }}>
              We'll be in touch to discuss how RinVita can work for your patients. Usually within one working day.
            </p>

            {submitted ? (
              <div style={{ padding: 32, background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 4, textAlign: "center" }}>
                <div style={{ fontSize: 40, color: marketingColors.gold, marginBottom: 12 }}>✓</div>
                <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: 24, fontWeight: 400, color: marketingColors.ink, marginBottom: 8 }}>Enquiry received</h3>
                <p style={{ fontSize: 14, color: marketingColors.mutedText, lineHeight: 1.7 }}>
                  Thank you. We'll be in touch within one working day at the email you provided.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} style={{ padding: isMobile ? 24 : 36, background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 4, display: "flex", flexDirection: "column", gap: 16 }}>
                <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }} aria-hidden="true" />

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Your name *</label>
                    <input required type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Work email *</label>
                    <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Clinic / organisation</label>
                    <input type="text" value={organisation} onChange={(e) => setOrganisation(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Role / job title</label>
                    <input type="text" value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Approx. international patients per month</label>
                  <select value={band} onChange={(e) => setBand(e.target.value)} style={inputStyle}>
                    <option value="">Select…</option>
                    {PATIENT_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Message</label>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} placeholder="Anything you'd like us to know about your patients or workflow." />
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
                  Or email us directly at <a href="mailto:hello@rinvita.co.uk" style={{ color: marketingColors.gold }}>hello@rinvita.co.uk</a>
                </p>
              </form>
            )}
          </div>

          {/* Download pack */}
          <aside style={{ padding: isMobile ? 24 : 32, background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 4, position: "relative", overflow: "hidden" }}>
            <div aria-hidden style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", border: `1px solid ${marketingColors.goldBorder}`, opacity: 0.4 }} />
            <div aria-hidden style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", border: `1px solid ${marketingColors.goldBorder}`, opacity: 0.3 }} />

            <div style={{ position: "relative" }}>
              <span className="marketing-section-label">Information pack</span>
              <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: 26, fontWeight: 400, color: marketingColors.ink, lineHeight: 1.25, marginBottom: 12 }}>
                Prefer to share this with your team first?
              </h3>
              <p style={{ fontSize: 14, color: marketingColors.mutedText, lineHeight: 1.7, fontWeight: 300, marginBottom: 22 }}>
                Download our one-page overview covering security, languages supported and how RinVita fits alongside your existing systems.
              </p>
              <a
                href={ONE_PAGER_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 22px",
                  border: `1px solid ${marketingColors.gold}`,
                  background: "transparent",
                  color: marketingColors.gold,
                  textDecoration: "none",
                  borderRadius: 2,
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                <span>↓</span> Download information pack
              </a>
              <p style={{ fontSize: 11, color: marketingColors.softText, marginTop: 14 }}>PDF · ~1 page</p>
            </div>
          </aside>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: marketingColors.ink,
  marginBottom: 6,
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

export default ClinicsPartnersPage;
