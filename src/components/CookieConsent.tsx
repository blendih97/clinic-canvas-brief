import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "rinvita.cookieConsent.v1";

type Preferences = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
};

export function getCookieConsent(): Preferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Preferences;
  } catch {
    return null;
  }
}

export function hasConsent(category: "analytics" | "marketing"): boolean {
  const prefs = getCookieConsent();
  return !!prefs && prefs[category] === true;
}

const save = (prefs: Preferences) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new CustomEvent("cookie-consent-changed", { detail: prefs }));
};

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    // Don't show inside iframes (Lovable preview) or on share routes
    const inIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
    if (inIframe) return;
    if (!getCookieConsent()) {
      // Slight delay so it doesn't flash on load
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  if (!visible) return null;

  const acceptAll = () => {
    save({ essential: true, analytics: true, marketing: true, decidedAt: new Date().toISOString() });
    setVisible(false);
  };
  const rejectAll = () => {
    save({ essential: true, analytics: false, marketing: false, decidedAt: new Date().toISOString() });
    setVisible(false);
  };
  const savePrefs = () => {
    save({ essential: true, analytics, marketing, decidedAt: new Date().toISOString() });
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 9999,
        maxWidth: 720,
        margin: "0 auto",
        background: "hsl(var(--card))",
        color: "hsl(var(--foreground))",
        border: "1px solid hsl(var(--border))",
        borderRadius: 10,
        boxShadow: "0 10px 40px -10px hsl(var(--foreground) / 0.18)",
        padding: 18,
        fontFamily: "var(--font-body)",
      }}
    >
      {!showPrefs ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: "hsl(var(--foreground) / 0.78)" }}>
            We use cookies to improve your experience and for analytics. By
            clicking Accept you consent to our use of cookies. See our{" "}
            <Link to="/privacy" style={{ color: "hsl(var(--primary))", textDecoration: "underline" }}>
              Privacy Policy
            </Link>{" "}
            for details.
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={() => setShowPrefs(true)}
              style={{
                padding: "8px 14px",
                fontSize: 13,
                background: "transparent",
                color: "hsl(var(--foreground) / 0.85)",
                border: "1px solid hsl(var(--border))",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Manage preferences
            </button>
            <button
              onClick={acceptAll}
              style={{
                padding: "8px 16px",
                fontSize: 13,
                background: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Accept
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 400 }}>Cookie preferences</div>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "hsl(var(--foreground) / 0.78)" }}>
            <input type="checkbox" checked disabled style={{ marginTop: 3 }} />
            <span><strong>Essential</strong> — required for authentication, security, and the service to function. Always on.</span>
          </label>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "hsl(var(--foreground) / 0.78)", cursor: "pointer" }}>
            <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} style={{ marginTop: 3 }} />
            <span><strong>Analytics</strong> — helps us understand usage so we can improve the product.</span>
          </label>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "hsl(var(--foreground) / 0.78)", cursor: "pointer" }}>
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} style={{ marginTop: 3 }} />
            <span><strong>Marketing</strong> — measures advertising performance (e.g. Meta Pixel, Google Ads).</span>
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={rejectAll}
              style={{ padding: "8px 14px", fontSize: 13, background: "transparent", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))", borderRadius: 6, cursor: "pointer" }}
            >
              Reject all
            </button>
            <button
              onClick={savePrefs}
              style={{ padding: "8px 16px", fontSize: 13, background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 500 }}
            >
              Save preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CookieConsent;
