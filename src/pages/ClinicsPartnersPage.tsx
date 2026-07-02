import { useEffect, useRef, useState } from "react";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import {
  MarketingFooter,
  MarketingNav,
  MarketingStyles,
  marketingColors,
  useMarketingBreakpoint,
} from "@/components/marketing/shared";
import InstantDemo from "@/components/marketing/InstantDemo";
import { captureUtmParams, getUtmParams, trackEvent } from "@/lib/analytics";

import onePagerAsset from "@/assets/RinVita_ClinicOnePager.pdf.asset.json";
const ONE_PAGER_URL = onePagerAsset.url;

const ClinicsPartnersPage = () => {
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;
  const formRef = useRef<HTMLFormElement | null>(null);
  const enquireSectionRef = useRef<HTMLElement | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Capture UTM params once when the page loads
  useEffect(() => { captureUtmParams(); }, []);

  const scrollToEnquiry = () => {
    enquireSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleWalkthroughClick = () => {
    trackEvent("clinic_walkthrough_clicked");
    setMessage((m) => m || "I'd like to book a walkthrough.");
    // Focus the message field after scroll
    setTimeout(() => {
      scrollToEnquiry();
      const textarea = formRef.current?.querySelector<HTMLTextAreaElement>("textarea[name='message']");
      textarea?.focus();
    }, 50);
  };

  const handleOnePagerClick = () => {
    trackEvent("clinic_onepager_downloaded");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const utm = getUtmParams();
    try {
      const { data, error: fnError } = await supabase.functions.invoke("submit-clinic-enquiry", {
        body: {
          name: name.trim(),
          email: email.trim(),
          organisation: organisation.trim(),
          message: message.trim(),
          website,
          utm_source: utm.utm_source || "",
          utm_medium: utm.utm_medium || "",
          utm_campaign: utm.utm_campaign || "",
        },
      });
      if (fnError) throw new Error(fnError.message || "Submission failed");
      if (data?.error) throw new Error(data.error);
      setSubmitted(true);
      trackEvent("clinic_form_submitted", { has_message: !!message.trim() });
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

  const whatYouGet = [
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
      <section style={{ padding: `${isMobile ? 110 : 150}px ${paddingX}px ${isMobile ? 48 : 72}px`, background: marketingColors.cream, position: "relative", overflow: "hidden" }}>
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
            href="#try-live"
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
            See it live — 10 seconds
          </a>
        </div>
      </section>

      {/* Instant demo */}
      <section id="try-live" style={{ padding: `${isMobile ? 40 : 64}px ${paddingX}px ${isMobile ? 60 : 88}px`, background: marketingColors.cream }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 28 : 36 }}>
            <span className="marketing-section-label">Try it live</span>
            <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 28 : "clamp(30px,3.4vw,42px)", fontWeight: 300, color: marketingColors.ink, marginBottom: 12, lineHeight: 1.15 }}>
              See what your patients experience.
            </h2>
            <p style={{ fontSize: isMobile ? 14.5 : 16, color: marketingColors.mutedText, lineHeight: 1.7, fontWeight: 300, maxWidth: 620, margin: "0 auto" }}>
              Watch a foreign medical record become a clinician-ready English summary — 10 seconds, no account needed.
            </p>
          </div>
          <InstantDemo variant="clinics" onEnquireClick={scrollToEnquiry} />
        </div>
      </section>

      {/* Benefit cards */}
      <section style={{ padding: `${isMobile ? 64 : 96}px ${paddingX}px`, background: marketingColors.cream2 }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 36 : 52 }}>
            <span className="marketing-section-label">Why clinics recommend RinVita</span>
            <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 30 : "clamp(32px,3.4vw,44px)", fontWeight: 300, color: marketingColors.ink }}>
              Modern patients expect modern records.
            </h2>
          </div>
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

      {/* What you get */}
      <section style={{ padding: `${isMobile ? 64 : 96}px ${paddingX}px`, background: marketingColors.cream }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 32 : 44 }}>
            <span className="marketing-section-label">What you get</span>
            <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 30 : "clamp(32px,3.4vw,44px)", fontWeight: 300, color: marketingColors.ink }}>
              A calmer clinic, a better first consult.
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {whatYouGet.map((b) => (
              <div key={b} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 22px", background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2 }}>
                <span style={{ color: marketingColors.gold, fontSize: 16, marginTop: 2 }}>✦</span>
                <span style={{ fontSize: 15, color: marketingColors.ink, lineHeight: 1.65, fontWeight: 300 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enquiry */}
      <section
        id="enquire"
        ref={enquireSectionRef as any}
        style={{ padding: `${isMobile ? 64 : 96}px ${paddingX}px`, background: marketingColors.cream2 }}
      >
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile || isTablet ? "1fr" : "1.4fr 1fr", gap: isMobile ? 36 : 56, alignItems: "start" }}>
          <div>
            <span className="marketing-section-label">Get in touch</span>
            <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 30 : 40, fontWeight: 300, color: marketingColors.ink, marginBottom: 14 }}>
              Tell us about your clinic.
            </h2>
            <p style={{ fontSize: 14, color: marketingColors.gold, fontWeight: 500, marginBottom: 24, letterSpacing: "0.01em" }}>
              Enquiries answered personally within one working day — no sales sequences.
            </p>

            {submitted ? (
              <div style={{ padding: 32, background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 4, textAlign: "center" }}>
                <div style={{ fontSize: 40, color: marketingColors.gold, marginBottom: 12 }}>✓</div>
                <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: 24, fontWeight: 400, color: marketingColors.ink, marginBottom: 8 }}>Thank you — we'll reply within one working day.</h3>
                <p style={{ fontSize: 14, color: marketingColors.mutedText, lineHeight: 1.7 }}>
                  Your enquiry is with Arla at RinVita. We'll be in touch at the email you provided.
                </p>
              </div>
            ) : (
              <form ref={formRef} onSubmit={submit} style={{ padding: isMobile ? 24 : 32, background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 4, display: "flex", flexDirection: "column", gap: 16 }}>
                <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }} aria-hidden="true" />

                <div>
                  <label style={labelStyle}>Your name *</label>
                  <input required type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Work email *</label>
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Practice name <span style={{ color: marketingColors.softText, fontWeight: 400 }}>(optional)</span></label>
                  <input type="text" value={organisation} onChange={(e) => setOrganisation(e.target.value)} style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Message</label>
                  <textarea
                    name="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                    placeholder="e.g. we see a lot of international patients with records in other languages…"
                  />
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

          {/* Sidebar: walkthrough + one-pager */}
          <aside style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ padding: isMobile ? 24 : 28, background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 4, position: "relative", overflow: "hidden" }}>
              <div aria-hidden style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: "50%", border: `1px solid ${marketingColors.goldBorder}`, opacity: 0.35 }} />
              <div style={{ position: "relative" }}>
                <span className="marketing-section-label">Prefer to talk?</span>
                <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: 24, fontWeight: 400, color: marketingColors.ink, lineHeight: 1.25, marginBottom: 10 }}>
                  Book a 15-minute walkthrough.
                </h3>
                <p style={{ fontSize: 13.5, color: marketingColors.mutedText, lineHeight: 1.7, fontWeight: 300, marginBottom: 20 }}>
                  A short call with a member of the RinVita team — we'll show you exactly how it would work for your patients.
                </p>
                <button
                  onClick={handleWalkthroughClick}
                  style={{
                    width: "100%",
                    padding: "13px 20px",
                    background: marketingColors.gold,
                    color: "hsl(var(--primary-foreground))",
                    border: "none",
                    borderRadius: 2,
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Book a walkthrough
                </button>
              </div>
            </div>

            <div style={{ padding: isMobile ? 24 : 28, background: marketingColors.cream, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 4 }}>
              <span className="marketing-section-label">Information pack</span>
              <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: 22, fontWeight: 400, color: marketingColors.ink, lineHeight: 1.25, marginBottom: 10 }}>
                Share this with your team first.
              </h3>
              <p style={{ fontSize: 13.5, color: marketingColors.mutedText, lineHeight: 1.7, fontWeight: 300, marginBottom: 18 }}>
                A one-page overview: security, languages, and how RinVita fits alongside your existing systems.
              </p>
              <a
                href={ONE_PAGER_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleOnePagerClick}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  padding: "11px 20px",
                  border: `1px solid ${marketingColors.gold}`,
                  background: "transparent",
                  color: marketingColors.gold,
                  textDecoration: "none",
                  borderRadius: 2,
                  fontSize: 12.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
                }}
              >
                <span>↓</span> Download the clinic one-pager
              </a>
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
