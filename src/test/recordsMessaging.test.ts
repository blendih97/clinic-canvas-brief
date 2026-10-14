import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const home = readFileSync("src/pages/MarketingLandingPage.tsx", "utf8");
const clinics = readFileSync("src/pages/ForCliniciansPage.tsx", "utf8");
const partner = readFileSync("src/components/marketing/PartnerPage.tsx", "utf8");

describe("store, review and share messaging", () => {
  it("leads the homepage with patient records and sharing", () => {
    expect(home).toContain("Your medical records. One place.");
    expect(home).toContain("Ready to share with any doctor.</em>");
    expect(home).toContain("RinVita — Store, review and share your medical records with any doctor");
    for (const copy of [
      "Store — every record, every provider, every country",
      "Review — results tracked over time, medications and allergies in one list",
      "Share — one-time secure link or PDF, no app or login for the doctor",
      "Add your records",
      "We organise them into your medical record",
      "Share with any doctor in one tap",
      "Everything a doctor needs, organised, and always in your hands.",
    ]) expect(home).toContain(copy);
  });

  it("keeps the record sections and brings original documents forward", () => {
    expect(home).toContain("Inside every RinVita passport");
    expect(home).toContain("Built for the doctor on the other side");
    expect(home.indexOf('{ title: "Original documents"')).toBeLessThan(home.indexOf('{ title: "Lab results, tracked over time"'));
  });

  it("uses the clinic offer consistently without changing other partner defaults", () => {
    expect(clinics).toContain("Give your patients their records —");
    expect(clinics).toContain("in one place they control.");
    expect(clinics).toContain("Free 60-day pilot for 5 of your patients.");
    expect(clinics.match(/title: "/g)).toHaveLength(8);
    expect(partner).toContain("config.pilotPoints ?? PILOT_POINTS");
    expect(partner).toContain("config.pilotFaqAnswer ?? item.a");
    expect(partner).toContain("Apply for a founding pilot");
    expect(partner).toContain("Not an EHR. Not a");
    expect(partner).toContain("diagnostic tool.");
  });
});