import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { DEMO_REPORTS, DEMO_LABS, labFlag, createDemoAccess, consumeDemoAccess, accessStatus, passportSections, buildDemoPDF } from "@/lib/partnerPortalDemo";

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


describe("local fictional patient portal rules", () => {
  it("includes only selected information in a PDF", () => {
    const pdf = buildDemoPDF(["Allergies"], DEMO_REPORTS).output();
    expect(pdf).toContain("Penicillin");
    expect(pdf).not.toContain("Metformin");
    expect(pdf).not.toContain("HbA1c");
    expect(pdf).toContain("FAKE TEST DATA");
  });
  it("includes selected lab values and source attribution", () => {
    const pdf = buildDemoPDF(["Labs"], DEMO_REPORTS).output();
    expect(pdf).toContain("HbA1c: 6.8 %");
    expect(pdf).toContain("Example City Laboratory, 18 Oct 2026");
    expect(pdf).not.toContain("Metformin");
  });
  it("opens a simulated code exactly once", () => {
    const access = createDemoAccess(["Allergies"], 15000, DEMO_REPORTS, 1000);
    const consumed = consumeDemoAccess(access, 2000);
    expect(consumed?.used).toBe(true);
    if (!consumed) throw new Error("Expected first opening");
    expect(consumeDemoAccess(consumed, 3000)).toBeNull();
  });
  it("expires at precisely the selected deadline", () => {
    const access = createDemoAccess(["Labs"], 15000, DEMO_REPORTS, 1000);
    expect(access.expiresAt).toBe(16000);
    expect(accessStatus(access, 15999)).toBe("ready");
    expect(consumeDemoAccess(access, 16000)).toBeNull();
    expect(accessStatus(access, 16000)).toBe("expired");
  });
  it("snapshots selected sections for the clinician", () => {
    const selected: ("Labs" | "Allergies")[] = ["Labs"];
    const access = createDemoAccess(selected, 86400000, DEMO_REPORTS, 1000);
    selected.push("Allergies");
    expect(access.sections).toEqual(["Labs"]);
    expect(passportSections(access.sections, access.reports).map(s => s.title)).toEqual(["Labs"]);
  });
  it("flags results against the supplied reference intervals", () => {
    expect(DEMO_LABS.map(l => labFlag(l.value, l.low, l.high))).toEqual(["High", "In range", "Low", "Low", "In range", "In range"]);
    expect(labFlag(120, 120, 160)).toBe("In range");
    expect(labFlag(160, 120, 160)).toBe("In range");
  });
});
