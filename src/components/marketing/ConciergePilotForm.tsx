import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUtmParams, trackEvent } from "@/lib/analytics";
import { marketingColors, useMarketingBreakpoint } from "@/components/marketing/shared";
import { Button } from "@/components/ui/button";

const CLIENT_BANDS = ["1-10", "11-30", "31-75", "76-150", "150+"];
const MAX = { short: 200, long: 1200 } as const;

export default function ConciergePilotForm() {
  const { isMobile } = useMarketingBreakpoint();
  const startedRef = useRef(false);
  const [name, setName] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [clients, setClients] = useState("");
  const [careCountries, setCareCountries] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markStarted = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackEvent("b2b_form_started", { page: "for-concierges-pilot" });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!name.trim() || !organisation.trim() || !role.trim()) {
      setError("Please add your name, organisation and role.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please add a valid work email address.");
      return;
    }
    if (!clients || !careCountries.trim()) {
      setError("Please add your approximate client number and main countries of care.");
      return;
    }
    if (!consent) {
      setError("Please confirm you're happy for us to contact you about the pilot.");
      return;
    }

    setLoading(true);
    const utm = getUtmParams();
    const details = [
      `Approximate number of clients: ${clients}`,
      `Main countries clients receive care in: ${careCountries.trim()}`,
      message.trim() ? `Message: ${message.trim()}` : "",
    ].filter(Boolean).join("\n\n");

    try {
      const { data, error: functionError } = await supabase.functions.invoke("submit-clinic-enquiry", {
        body: {
          name: name.trim().slice(0, MAX.short),
          organisation: organisation.trim().slice(0, MAX.short),
          role: role.trim().slice(0, MAX.short),
          email: email.trim().toLowerCase().slice(0, MAX.short),
          organisation_type: "Medical concierge",
          patients_per_month: clients,
          message: details.slice(0, 4000),
          consent: true,
          source_page: "for-concierges-pilot",
          website: honeypot,
          utm_source: utm.utm_source || "",
          utm_medium: utm.utm_medium || "",
          utm_campaign: utm.utm_campaign || "",
        },
      });
      if (functionError) throw new Error(functionError.message || "Submission failed");
      if ((data as { error?: string } | null)?.error) throw new Error((data as { error: string }).error);
      setSubmitted(true);
      trackEvent("concierge_pilot_form_submitted", { page: "for-concierges-pilot" });
    } catch (submissionError) {
      trackEvent("b2b_form_failed", { page: "for-concierges-pilot", organisation_type: "Medical concierge" });
      setError(submissionError instanceof Error ? submissionError.message : "Something went wrong. Please email info@rinvita.co.uk directly.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div role="status" style={{ ...panelStyle, padding: isMobile ? 26 : 36 }}>
        <div aria-hidden style={{ color: marketingColors.gold, fontSize: 34, marginBottom: 10 }}>✓</div>
        <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: 28, fontWeight: 400, marginBottom: 10 }}>
          Application received
        </h3>
        <p style={{ color: marketingColors.mutedText, fontSize: 15, lineHeight: 1.75 }}>
          Thank you — we'll be in touch within two working days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} onFocus={markStarted} noValidate style={{ ...panelStyle, padding: isMobile ? 22 : 34, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
      <input type="text" name="website" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }} />
      <Field label="Name *" id="concierge-name"><input id="concierge-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={MAX.short} autoComplete="name" style={inputStyle} /></Field>
      <Field label="Organisation *" id="concierge-organisation"><input id="concierge-organisation" value={organisation} onChange={(event) => setOrganisation(event.target.value)} maxLength={MAX.short} autoComplete="organization" style={inputStyle} /></Field>
      <Field label="Role *" id="concierge-role"><input id="concierge-role" value={role} onChange={(event) => setRole(event.target.value)} maxLength={MAX.short} autoComplete="organization-title" style={inputStyle} /></Field>
      <Field label="Work email *" id="concierge-email"><input id="concierge-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={MAX.short} autoComplete="email" style={inputStyle} /></Field>
      <Field label="Approximate number of clients *" id="concierge-clients">
        <select id="concierge-clients" value={clients} onChange={(event) => setClients(event.target.value)} style={inputStyle}><option value="">Select…</option>{CLIENT_BANDS.map((band) => <option key={band} value={band}>{band}</option>)}</select>
      </Field>
      <Field label="Main countries your clients receive care in *" id="concierge-countries"><input id="concierge-countries" value={careCountries} onChange={(event) => setCareCountries(event.target.value)} maxLength={MAX.short} placeholder="e.g. UK, UAE, Switzerland" style={inputStyle} /></Field>
      <div style={{ gridColumn: isMobile ? "auto" : "1 / -1" }}>
        <Field label="Message" id="concierge-message" hint="Please don't include client details or medical information."><textarea id="concierge-message" rows={4} value={message} onChange={(event) => setMessage(event.target.value)} maxLength={MAX.long} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} /></Field>
      </div>
      <div style={{ gridColumn: isMobile ? "auto" : "1 / -1", display: "flex", gap: 10, alignItems: "flex-start" }}>
        <input id="concierge-consent" type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} style={{ marginTop: 3, width: 16, height: 16, accentColor: marketingColors.gold }} />
        <label htmlFor="concierge-consent" style={{ color: marketingColors.mutedText, fontSize: 12.5, lineHeight: 1.6 }}>
          I agree that RinVita may contact me about this enquiry and store these details for that purpose, as described in the <a href="/privacy" style={{ color: marketingColors.gold }}>Privacy Policy</a>. *
        </label>
      </div>
      {error && <div role="alert" className="border-destructive/30 bg-destructive/10 text-destructive" style={{ gridColumn: isMobile ? "auto" : "1 / -1", padding: 12, borderWidth: 1, borderRadius: 2, fontSize: 13 }}>{error}</div>}
      <div style={{ gridColumn: isMobile ? "auto" : "1 / -1" }}>
        <Button type="submit" disabled={loading} className="h-auto w-full rounded-sm px-6 py-3.5 uppercase" style={{ letterSpacing: "0.06em" }}>{loading ? "Sending…" : "Apply for the founding partner pilot"}</Button>
      </div>
    </form>
  );
}

function Field({ label, id, children, hint }: { label: string; id: string; children: React.ReactNode; hint?: string }) {
  return <div><label htmlFor={id} style={labelStyle}>{label}</label>{children}{hint && <div style={{ color: marketingColors.softText, fontSize: 11, marginTop: 5 }}>{hint}</div>}</div>;
}

const panelStyle: React.CSSProperties = { background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 4 };
const labelStyle: React.CSSProperties = { display: "block", color: marketingColors.ink, fontSize: 12, fontWeight: 600, marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "11px 14px", border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2, background: marketingColors.surface, color: marketingColors.ink, fontSize: 14 };