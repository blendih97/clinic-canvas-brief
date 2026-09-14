import { describe, expect, it, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import {
  buildEmailLink,
  buildShareText,
  buildWhatsAppLink,
  shareLinkIsSafe,
  SHARE_MESSAGE,
} from "@/lib/shareLinks";
import { trackEvent } from "@/lib/analytics";

const read = (p: string) => readFileSync(p, "utf8");

const CONSUMER_ROUTES = [
  "/medical-passport",
  "/medical-records-for-expats",
  "/organise-medical-records-for-family",
  "/medical-records-for-overseas-treatment",
];

describe("consumer routes", () => {
  const app = read("src/App.tsx");

  it("registers every new consumer route", () => {
    for (const route of CONSUMER_ROUTES) {
      expect(app).toContain(`path="${route}"`);
    }
  });

  it("lists every new route in the sitemap", () => {
    const sitemap = read("public/sitemap.xml");
    for (const route of CONSUMER_ROUTES) {
      expect(sitemap).toContain(`https://rinvita.co.uk${route}`);
    }
  });

  it("links the new pages internally from the footer", () => {
    const shared = read("src/components/marketing/shared.tsx");
    for (const route of CONSUMER_ROUTES) {
      expect(shared).toContain(route);
    }
  });
});

describe("consumer page content", () => {
  const files = [
    "src/pages/MedicalPassportPage.tsx",
    "src/pages/ExpatMedicalRecordsPage.tsx",
    "src/pages/FamilyMedicalRecordsPage.tsx",
    "src/pages/OverseasTreatmentRecordsPage.tsx",
    "src/components/marketing/ConsumerPage.tsx",
    "src/pages/MarketingLandingPage.tsx",
  ];

  it("never claims end-to-end encryption or other unverified proof", () => {
    const forbidden = [
      "end-to-end encrypt",
      "clinical-grade",
      "fully gdpr compliant",
      "hipaa certified",
      "guaranteed",
    ];
    for (const file of files) {
      const lines = read(file).toLowerCase().split("\n");
      for (const phrase of forbidden) {
        for (const line of lines) {
          if (!line.includes(phrase)) continue;
          // The phrase may only appear inside an explicit disclaimer.
          expect(line, `${file} claims "${phrase}"`).toMatch(/\b(not|never|do not|does not)\b/);
        }
      }
    }
  });

  it("states the real signup requirement", () => {
    const consumer = read("src/components/marketing/ConsumerPage.tsx");
    expect(consumer).toContain("3 documents · no card required");
    expect(consumer).toContain("/auth?mode=signup");
  });

  it("each consumer page declares FAQ entries for structured data", () => {
    for (const file of files.slice(0, 4)) {
      const content = read(file);
      expect(content).toContain("faq:");
      expect(content).toContain("limitations:");
    }
    expect(read("src/components/marketing/ConsumerPage.tsx")).toContain('"@type": "FAQPage"');
  });
});

describe("homepage consumer CTA", () => {
  const home = read("src/pages/MarketingLandingPage.tsx");

  it("uses the consumer CTA above the fold pointing at signup", () => {
    expect(home).toContain("Create your medical passport");
    expect(home).toContain('to="/auth?mode=signup"');
  });

  it("keeps a 'See an example' secondary CTA and a partner route", () => {
    expect(home).toContain("See an example");
    expect(home).toContain('to="/demo"');
    expect(home).toContain('to="/for-clinics"');
  });

  it("shows the honest free-plan support line", () => {
    expect(home).toContain("3 documents · no card required");
  });
});

describe("share links", () => {
  it("uses the approved privacy-safe message", () => {
    expect(buildShareText()).toContain(SHARE_MESSAGE);
    expect(buildShareText()).toContain("https://rinvita.co.uk");
  });

  it("never carries record or account information", () => {
    const links = [
      buildWhatsAppLink(),
      buildEmailLink(),
      buildWhatsAppLink({ url: "https://rinvita.co.uk/medical-passport" }),
    ];
    for (const link of links) {
      expect(shareLinkIsSafe(link)).toBe(true);
    }
  });

  it("builds whatsapp and mailto targets", () => {
    expect(buildWhatsAppLink()).toMatch(/^https:\/\/wa\.me\/\?text=/);
    expect(buildEmailLink()).toMatch(/^mailto:\?subject=/);
  });
});

describe("share analytics", () => {
  beforeEach(() => {
    (window as unknown as { fbq?: unknown }).fbq = vi.fn();
  });

  it("tracks share CTA clicks with channel and placement only", () => {
    const fbq = (window as unknown as { fbq: ReturnType<typeof vi.fn> }).fbq;
    trackEvent("share_cta_clicked", { channel: "whatsapp", placement: "home" });
    expect(fbq).toHaveBeenCalledWith("trackCustom", "share_cta_clicked", {
      channel: "whatsapp",
      placement: "home",
    });
    const payload = JSON.stringify(fbq.mock.calls[0][2]);
    expect(payload).not.toMatch(/document|diagnos|medication|token/i);
  });
});
