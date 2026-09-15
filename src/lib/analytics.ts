// Named funnel-event tracker layered on top of Meta Pixel.
// All events pull the persisted UTM parameters from sessionStorage so ad
// attribution and B2B outreach batches can be reconstructed.

const UTM_KEY = "rv_utm_v1";

export type UtmParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
};

/** Persist any UTM params from the current URL to sessionStorage. Idempotent. */
export function captureUtmParams(): UtmParams {
  if (typeof window === "undefined") return {};
  try {
    const url = new URL(window.location.href);
    const captured: UtmParams = {};
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const) {
      const v = url.searchParams.get(key);
      if (v) captured[key] = v.slice(0, 100);
    }
    if (Object.keys(captured).length > 0) {
      const existing = getUtmParams();
      const merged = { ...existing, ...captured };
      sessionStorage.setItem(UTM_KEY, JSON.stringify(merged));
      return merged;
    }
    return getUtmParams();
  } catch {
    return {};
  }
}

export function getUtmParams(): UtmParams {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(UTM_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export type FunnelEvent =
  | "demo_started"
  | "demo_completed"
  | "clinic_demo_started"
  | "clinic_demo_completed"
  | "sample_pdf_downloaded"
  | "trial_signup_started"
  | "trial_signup_completed"
  | "clinic_form_submitted"
  | "clinic_walkthrough_clicked"
  | "clinic_onepager_downloaded"
  | "pricing_viewed"
  // Product funnel. These carry NO health data, file names or file contents —
  // counts, plan identifiers and error codes only.
  | "document_upload_completed"
  | "document_upload_failed"
  | "free_limit_reached"
  | "paywall_shown"
  | "checkout_started"
  | "purchase_completed"
  // B2B partner funnel. Page slug and organisation type ONLY — never free-text,
  // contact details or any medical content.
  | "b2b_page_view"
  | "pilot_cta_clicked"
  | "b2b_form_started"
  | "b2b_form_submitted"
  | "b2b_form_failed"
  | "concierge_pilot_form_submitted"
  // Outbound partner campaign page (/partner-demo). Campaign attribution only —
  // never a name, email address or any medical content.
  | "partner_demo_view"
  | "sample_passport_click"
  | "pilot_email_click"
  // Referral/share hooks. Channel and placement ONLY — the share payload never
  // contains health data, document names or personal identifiers.
  | "share_cta_clicked";

/**
 * Fire a named funnel event. Attaches persisted UTM params. Also mirrors to
 * Meta Pixel as a custom event (`trackCustom`) when marketing consent is on.
 */
export function trackEvent(event: FunnelEvent, extra: Record<string, unknown> = {}) {
  const payload = { ...getUtmParams(), ...extra };
  try {
    // eslint-disable-next-line no-console
    if (import.meta.env.DEV) console.debug("[analytics]", event, payload);
    const fbq = (window as any).fbq;
    if (typeof fbq === "function") {
      fbq("trackCustom", event, payload);
    }
  } catch {
    // never break the app on analytics
  }
}
