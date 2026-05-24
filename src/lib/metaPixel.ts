// Meta Pixel loader with cookie-consent gating (PECR/GDPR).
// Only loads and fires after the user grants `marketing` consent.

const PIXEL_ID = "1522018366309762";
const STORAGE_KEY = "rinvita.cookieConsent.v1";

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}

function hasMarketingConsent(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const prefs = JSON.parse(raw);
    return prefs?.marketing === true;
  } catch {
    return false;
  }
}

function inIframe(): boolean {
  try { return window.self !== window.top; } catch { return true; }
}

let loaded = false;

function loadPixel() {
  if (loaded || typeof window === "undefined") return;
  if (window.fbq) { loaded = true; return; }

  /* eslint-disable */
  (function (f: any, b: any, e: string, v: string) {
    let n: any, t: any, s: any;
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */

  window.fbq("init", PIXEL_ID);
  loaded = true;
}

export function initMetaPixel() {
  if (inIframe()) return;
  if (hasMarketingConsent()) {
    loadPixel();
    trackPageView();
  }
  window.addEventListener("cookie-consent-changed", () => {
    if (hasMarketingConsent()) {
      loadPixel();
      trackPageView();
    }
  });
}

function fire(event: string, params?: Record<string, any>) {
  if (inIframe()) return;
  if (!hasMarketingConsent()) return;
  loadPixel();
  if (window.fbq) window.fbq("track", event, params);
}

export const trackPageView = () => fire("PageView");
export const trackLead = () => fire("Lead");
export const trackCompleteRegistration = (params?: { content_name?: string }) =>
  fire("CompleteRegistration", params);
export const trackInitiateCheckout = (params?: { value?: number; currency?: string; content_name?: string }) =>
  fire("InitiateCheckout", params);
export const trackPurchase = (params: { value: number; currency: string }) =>
  fire("Purchase", params);
