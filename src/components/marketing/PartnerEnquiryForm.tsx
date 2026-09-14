import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { marketingColors, useMarketingBreakpoint } from "@/components/marketing/shared";
import { getUtmParams, trackEvent } from "@/lib/analytics";

export const ORGANISATION_TYPES = [
  "Medical concierge",
  "Private clinic",
  "International patient department",
  "Executive health",
  "Family office",
  "Other",
];

const PATIENT_BANDS = ["1-10", "11-30", "31-75", "76-150", "150+"];

const NEXT_STEPS = [
  "Apply for a founding pilot",
  "Intro call",
  "See the patient experience",
  "Send information by email",
];

type Props = {
  /** Page slug used in analytics events only. */
  sourcePage: "for-clinics" | "for-concierges";
};

const MAX = { short: 200, long: 1200 } as const;

export default function PartnerEnquiryForm({ sourcePage }: Props) {
  const { isMobile } = useMarketingBreakpoint();
  const startedRef = useRef(false);

  const [organisation, setOrganisation] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [country, setCountry] = useState("");
  const [organisationType, setOrganisationType] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [patients, setPatients] = useState("");
  const [languages, setLanguages] = useState("");
  const [problem, setProblem] = useState("");
  const [nextStep, setNextStep] = useState(NEXT_STEPS[0]);
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markStarted = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackEvent("b2b_form_started", { page: sourcePage });
  };

  const validate = (): string | null => {
    if (!organisation.trim()) return "Please tell us your organisation name.";
    if (!organisationType) return "Please select your organisation type.";
    if (!name.trim()) return "Please add a contact name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Please add a valid work email address.";
    if (!country.trim()) return "Please add the country you are based in.";
    if (!consent) return "Please confirm you're happy for us to contact you about this enquiry.";
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const invalid = validate();
    if (invalid) {
      setError(invalid);
      return;
    }
    setLoading(true);
    const utm = getUtmParams();
    try {
      const { data, error: fnError } = await supabase.functions.invoke("submit-clinic-enquiry", {
        body: {
          name: name.trim().slice(0, MAX.short),
          email: email.trim().toLowerCase().slice(0, MAX.short),
          organisation: organisation.trim().slice(0, MAX.short),
          website_url: websiteUrl.trim().slice(0, MAX.short),
          country: country.trim().slice(0, MAX.short),
          organisation_type: organisationType,
          patients_per_month: patients,
          languages_handled: languages.trim().slice(0, MAX.short),
          current_problem: problem.trim().slice(0, MAX.long),
          preferred_next_step: nextStep,
          consent: true,
          source_page: sourcePage,
          website: honeypot,
          utm_source: utm.utm_source || "",
          utm_medium: utm.utm_medium || "",
          utm_campaign: utm.utm_campaign || "",
        },
      });
      if (fnError) throw new Error(fnError.message || "Submission failed");
      if ((data as any)?.error) throw new Error((data as any).error);
      setSubmitted(true);
      // Page + organisation type only. No free-text, no contact details.
      trackEvent("b2b_form_submitted", { page: sourcePage, organisation_type: organisationType });
    } catch (err: any) {
      trackEvent("b2b_form_failed", { page: sourcePage, organisation_type: organisationType });
      setError(err?.message || "Something went wrong. Please email hello@rinvita.co.uk directly.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div
        role="status"
        style={{
          padding: isMobile ? 26 : 36,
          background: marketingColors.surface,
          border: `1px solid ${marketingColors.goldBorder}`,
          borderRadius: 4,
        }}
      >
        <div style={{ fontSize: 34, color: marketingColors.gold, marginBottom: 10 }} aria-hidden>✓</div>
        <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: 26, fontWeight: 400, marginBottom: 10 }}>
          Application received
        </h3>
        <p style={{ fontSize: 14, lineHeight: 1.75, color: marketingColors.mutedText, marginBottom: 16 }}>
          Thank you. We review founding partner applications individually and reply from a person, not an
          autoresponder — usually within one working day.
        </p>
        <div style={{ fontSize: 13, lineHeight: 1.9, color: marketingColors.mutedText }}>
          <div><strong style={{ color: marketingColors.ink }}>What happens next</strong></div>
          <div>1. A short call to understand your patient flow and the records you receive.</div>
          <div>2. Guided setup and co-branded invitation materials for your patients.</div>
          <div>3. Commercial terms agreed with you before anything goes live.</div>
        </div>
        <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 12 }}>
          <a
            href="/demo"
            style={{
              padding: "12px 22px",
              background: marketingColors.gold,
              color: "hsl(var(--primary-foreground))",
              textDecoration: "none",
              borderRadius: 2,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            View the patient experience
          </a>
          <a
            href="mailto:hello@rinvita.co.uk"
            style={{
              padding: "12px 22px",
              border: `1px solid ${marketingColors.goldBorder}`,
              color: marketingColors.gold,
              textDecoration: "none",
              borderRadius: 2,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Email us directly
          </a>
        </div>
      </div>
    );
  }

  const field = (label: string, id: string, node: React.ReactNode, hint?: string) => (
    <div>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      {node}
      {hint && <div style={{ fontSize: 11, color: marketingColors.softText, marginTop: 5 }}>{hint}</div>}
    </div>
  );

  return (
    <form
      onSubmit={submit}
      onFocus={markStarted}
      noValidate
      style={{
        padding: isMobile ? 22 : 34,
        background: marketingColors.surface,
        border: `1px solid ${marketingColors.goldBorder}`,
        borderRadius: 4,
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: 16,
      }}
    >
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
      />

      {field("Organisation name *", "org-name",
        <input id="org-name" style={inputStyle} value={organisation} maxLength={MAX.short}
          onChange={(e) => setOrganisation(e.target.value)} autoComplete="organization" />)}

      {field("Website", "org-website",
        <input id="org-website" style={inputStyle} value={websiteUrl} maxLength={MAX.short} inputMode="url"
          placeholder="https://" onChange={(e) => setWebsiteUrl(e.target.value)} autoComplete="url" />)}

      {field("Country *", "org-country",
        <input id="org-country" style={inputStyle} value={country} maxLength={MAX.short}
          onChange={(e) => setCountry(e.target.value)} autoComplete="country-name" />)}

      {field("Organisation type *", "org-type",
        <select id="org-type" style={inputStyle} value={organisationType} onChange={(e) => setOrganisationType(e.target.value)}>
          <option value="">Select…</option>
          {ORGANISATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>)}

      {field("Contact name *", "contact-name",
        <input id="contact-name" style={inputStyle} value={name} maxLength={MAX.short}
          onChange={(e) => setName(e.target.value)} autoComplete="name" />)}

      {field("Work email *", "contact-email",
        <input id="contact-email" type="email" style={inputStyle} value={email} maxLength={MAX.short}
          onChange={(e) => setEmail(e.target.value)} autoComplete="email" />)}

      {field("Estimated international patients per month", "patients",
        <select id="patients" style={inputStyle} value={patients} onChange={(e) => setPatients(e.target.value)}>
          <option value="">Select…</option>
          {PATIENT_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>)}

      {field("Languages and countries you handle most", "languages",
        <input id="languages" style={inputStyle} value={languages} maxLength={MAX.short}
          placeholder="e.g. Arabic, French — UAE, Nigeria, France"
          onChange={(e) => setLanguages(e.target.value)} />)}

      <div style={{ gridColumn: isMobile ? "auto" : "1 / -1" }}>
        {field("What is the record-sharing problem you're trying to solve?", "problem",
          <textarea id="problem" rows={4} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
            maxLength={MAX.long} value={problem} onChange={(e) => setProblem(e.target.value)} />,
          "Please don't include patient details or any medical information here.")}
      </div>

      <div style={{ gridColumn: isMobile ? "auto" : "1 / -1" }}>
        {field("Preferred next step", "next-step",
          <select id="next-step" style={inputStyle} value={nextStep} onChange={(e) => setNextStep(e.target.value)}>
            {NEXT_STEPS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>)}
      </div>

      <div style={{ gridColumn: isMobile ? "auto" : "1 / -1", display: "flex", gap: 10, alignItems: "flex-start" }}>
        <input
          id="consent"
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          style={{ marginTop: 3, width: 16, height: 16, accentColor: marketingColors.gold }}
        />
        <label htmlFor="consent" style={{ fontSize: 12.5, lineHeight: 1.6, color: marketingColors.mutedText }}>
          I agree that RinVita may contact me about this enquiry and store these details for that purpose, as
          described in the <a href="/privacy" style={{ color: marketingColors.gold }}>Privacy Policy</a>. *
        </label>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            gridColumn: isMobile ? "auto" : "1 / -1",
            padding: 12,
            background: "hsl(0 70% 50% / 0.08)",
            border: "1px solid hsl(0 70% 50% / 0.3)",
            borderRadius: 2,
            fontSize: 13,
            color: "hsl(0 70% 35%)",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ gridColumn: isMobile ? "auto" : "1 / -1" }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 14,
            background: loading ? marketingColors.goldSoft : marketingColors.gold,
            color: loading ? marketingColors.softText : "hsl(var(--primary-foreground))",
            border: "none",
            borderRadius: 2,
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Sending…" : "Apply for a founding pilot"}
        </button>
        <p style={{ fontSize: 11, color: marketingColors.softText, textAlign: "center", marginTop: 10, lineHeight: 1.6 }}>
          Or email <a href="mailto:hello@rinvita.co.uk" style={{ color: marketingColors.gold }}>hello@rinvita.co.uk</a>.
          Commercial terms are agreed with you before any pilot begins.
        </p>
      </div>
    </form>
  );
}

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
