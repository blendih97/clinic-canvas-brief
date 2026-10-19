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
  it("uses the required eyebrow and headline", () => {
    expect(page).toContain("60-second partner demo");
    expect(page).toContain("See the record before the appointment.");
  });

  it("offers both CTAs, with the pilot CTA as a prefilled mailto", () => {
    expect(page).toContain("View the sample passport");
    expect(page).toContain("Start a 14-day trial");
    expect(page).toContain("mailto:info@rinvita.co.uk");
    expect(page).toContain("RinVita 14-day trial");
  });

  it("launches the existing interactive sample demo", () => {
    expect(page).toContain("InstantDemo");
    expect(page).toContain("sample-passport-demo");
  });

  it("shows the three transformation stages and pilot terms", () => {
    for (const stage of ["Scattered records", "Organised & translated", "Shared with the right clinician"]) {
      expect(page).toContain(stage);
    }
    for (const term of [
      "Free 14-day trial",
      "Invite as many patients as you like",
      "Guided setup with our team",
      "Co-branded invitation materials",
      "No EHR integration required",
      "Pricing agreed before the trial starts",
    ]) {
      expect(page).toContain(term);
    }
    expect(page).toContain("Free 14-day trial — invite as many patients as you like.");
  });

  it("keeps claims factual", () => {
    const lower = page.toLowerCase();
    for (const phrase of ["end-to-end encrypt", "clinical-grade", "fully gdpr", "guaranteed", "testimonial"]) {
      expect(lower, `claims "${phrase}"`).not.toContain(phrase);
    }
    expect(page).toContain("does not diagnose");
    expect(page).toContain("encrypted at rest and in transit");
  });
});

describe("partner demo analytics", () => {
  beforeEach(() => {
    (window as unknown as { fbq?: unknown }).fbq = vi.fn();
  });

  it("declares the three campaign events", () => {
    const analytics = readFileSync("src/lib/analytics.ts", "utf8");
    for (const evt of ["partner_demo_view", "sample_passport_click", "pilot_email_click"]) {
      expect(analytics).toContain(`"${evt}"`);
      expect(page).toContain(evt);
    }
  });

  it("sends campaign attribution only", () => {
    const fbq = (window as unknown as { fbq: ReturnType<typeof vi.fn> }).fbq;
    trackEvent("partner_demo_view", {
      utm_source: "outbound",
      utm_medium: "email",
      utm_campaign: "clinics-q3",
      utm_content: "variant-a",
    });
    const payload = fbq.mock.calls[0][2] as Record<string, unknown>;
    expect(Object.keys(payload).sort()).toEqual([
      "utm_campaign",
      "utm_content",
      "utm_medium",
      "utm_source",
    ]);
    expect(payload.utm_campaign).toBe("clinics-q3");
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
