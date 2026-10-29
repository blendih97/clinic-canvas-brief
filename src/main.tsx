import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import PartnerDemoPage from "./pages/PartnerDemoPage";
import "./index.css";

// Do not load the live application graph (including payment scripts) for the
// local-only demonstration. Existing application routes are unchanged.
const App = lazy(() => import("./App.tsx"));

// PWA service worker registration — only in production, not in iframes
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (!isPreviewHost && !isInIframe && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
} else if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((regs) =>
    regs.forEach((r) => r.unregister())
  );
}

const root = document.getElementById("root");
if (root) createRoot(root).render(
  <HelmetProvider>
    {window.location.pathname === "/partner-demo"
      ? <BrowserRouter><PartnerDemoPage /></BrowserRouter>
      : <Suspense fallback={null}><App /></Suspense>}
  </HelmetProvider>
);
