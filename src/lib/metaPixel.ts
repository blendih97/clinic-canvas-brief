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

// Pages with health information or private links. Meta must never load or fire on these:
// the patient app, doctor share links, upload requests, partner and admin areas, demo patients.
const PRIVATE_PATHS = ["/app", "/share", "/upload-request", "/media-share", "/partner", "/admin", "/demo/", "/preview", "/reset-password", "/.lovable"];
export function isPrivatePath(pathname: string): boolean {
  // "/demo" alone is the public product tour; "/demo/<name>" is a demo patient.
  return PRIVATE_PATHS.some((p) => p.endsWith("/") ? pathname.startsWith(p) : pathname === p || pathname.startsWith(`${p}/`));
}
function onPrivatePage(): boolean {
  return typeof window !== "undefined" && isPrivatePath(window.location.pathname);
}

let loaded = false;

function loadPixel() {
  if (onPrivatePage()) return;
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

  // No automatic page tracking when the app changes page, and no automatic collection of
  // button text or page details: Meta only gets the events we send, from public pages.
  window.fbq.disablePushState = true;
  window.fbq("set", "autoConfig", false, PIXEL_ID);
  window.fbq("init", PIXEL_ID);
  loaded = true;
}

export function initMetaPixel() {
  if (inIframe()) return;
  // Consent can be given on a private page; the pixel then waits until a public page.
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
  if (onPrivatePage()) return;
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
