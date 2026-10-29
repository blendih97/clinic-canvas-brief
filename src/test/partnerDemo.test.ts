import { describe, expect, it, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { trackEvent } from "@/lib/analytics";

const page = readFileSync("src/pages/PartnerDemoPage.tsx", "utf8");

describe("/partner-demo route", () => {
  it("is registered in the router", () => {
    expect(readFileSync("src/App.tsx", "utf8")).toContain('path="/partner-demo"');
  });

  it("is kept out of the sitemap and disallowed for crawlers", () => {
    expect(readFileSync("public/sitemap.xml", "utf8")).not.toContain("/partner-demo");
    expect(readFileSync("public/robots.txt", "utf8")).toContain("Disallow: /partner-demo");
  });

  it("sets noindex head metadata", () => {
    expect(page).toContain("noindex");
    expect(page).toContain('path="/partner-demo"');
  });
});

describe("partner demo content and CTAs", () => {
  it("uses the required hero copy and fictional badge", () => {
    expect(page).toContain("See the entire patient journey");
    expect(page).toContain("A medical passport that travels with the patient, not the provider.");
    expect(page).toContain("Fictional demonstration. No real patient information.");
  });

  it("links to the partner page and the inquiry mailto", () => {
    expect(page).toContain("/for-concierges");
    expect(page).toContain("mailto:hello@rinvita.co.uk?subject=RinVita%20Partner%20Demo");
  });

  it("makes no network or AI calls", () => {
    for (const s of ["supabase", "fetch(", "functions.invoke", "trackEvent"]) expect(page).not.toContain(s);
  });

  it("keeps claims factual and avoids em dashes", () => {
    const lower = page.toLowerCase();
    for (const phrase of ["end-to-end encrypt", "clinical-grade", "fully gdpr", "guaranteed", "testimonial"]) {
      expect(lower, `claims "${phrase}"`).not.toContain(phrase);
    }
    expect(page).toContain("does not diagnose");
    expect(page).toContain("hypotheses, not proven");
    expect(page).not.toContain("\u2014");
  });
});

describe("email brand assets", () => {
  const logo = readFileSync("public/rinvita-email-logo.svg", "utf8");
  const mark = readFileSync("public/rinvita-email-mark.svg", "utf8");

  it("contain no scripts or external resources", () => {
    for (const svg of [logo, mark]) {
      expect(svg).not.toMatch(/<script|xlink:href|https?:\/\/(?!www\.w3\.org)/i);
    }
  });

  it("reuse the existing logo mark geometry and brand gold", () => {
    const shared = readFileSync("src/components/marketing/shared.tsx", "utf8");
    expect(shared).toContain("14,2 26,9 26,19 14,26 2,19 2,9");
    for (const svg of [logo, mark]) {
      expect(svg).toContain("14,2 26,9 26,19 14,26 2,19 2,9");
      expect(svg).toContain("#B8952A");
    }
    expect(logo).toContain("RinVita");
    expect(logo).toContain("Cormorant Garamond");
  });
});
