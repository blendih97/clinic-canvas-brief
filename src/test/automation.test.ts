import { describe, it, expect } from "vitest";
import { isBlockedEmail } from "@/lib/automation";
import { signupError } from "@/lib/onboarding";
import { funnelFields } from "@/lib/funnel";

describe("sign-up protection", () => {
  it("blocks throwaway and test inboxes only", () => {
    expect(isBlockedEmail("s902j@pnqsmtnz.mailosaur.net")).toBe(true);
    expect(isBlockedEmail("rebuildtest1@example.com")).toBe(true);
    expect(isBlockedEmail("x@YOPMAIL.com ")).toBe(true);
    expect(isBlockedEmail("harriet@health4travel.com")).toBe(false);
    expect(isBlockedEmail("someone@gmail.com")).toBe(false);
  });
  it("explains a database refusal clearly", () => {
    expect(signupError({ status: 500, message: "Database error saving new user" }).code).toBe("blocked_email");
  });
  it("counts blocked sign-ups", () => {
    expect(funnelFields("signup_error", null, "blocked_bot")._error_code).toBe("blocked_bot");
  });
});

import { isPrivatePath } from "@/lib/metaPixel";
describe("Meta Pixel stays off private pages", () => {
  it("blocks patient, doctor, partner and admin pages", () => {
    for (const p of ["/app", "/app/settings", "/share/abc", "/upload-request/x", "/media-share/x", "/partner", "/admin/visitors", "/demo/kixa"]) expect(isPrivatePath(p)).toBe(true);
  });
  it("allows public marketing pages", () => {
    for (const p of ["/", "/pricing", "/auth", "/demo", "/for-clinics", "/translate/spanish", "/p/kixa", "/partners", "/privacy"]) expect(isPrivatePath(p)).toBe(false);
  });
});

import { needsHealthConsent } from "@/components/HealthConsentGate";
import { resultStatusLabel, imagingStatusLabel } from "@/lib/resultLabels";
describe("health data consent", () => {
  it("asks patients without recorded consent, except in Settings", () => {
    expect(needsHealthConsent({ health_data_consent: false }, "/app")).toBe(true);
    expect(needsHealthConsent({ health_data_consent: null }, "/app/profile")).toBe(true);
    expect(needsHealthConsent({ health_data_consent: false }, "/app/settings")).toBe(false);
    expect(needsHealthConsent({ health_data_consent: true }, "/app")).toBe(false);
    expect(needsHealthConsent(null, "/app")).toBe(false);
  });
});
describe("result wording describes the report", () => {
  it("uses range wording, not clinical judgement", () => {
    expect(resultStatusLabel("critical")).toBe("Well outside range");
    expect(resultStatusLabel("flagged")).toBe("Outside range");
    expect(resultStatusLabel("normal")).toBe("In range");
    expect(imagingStatusLabel("flagged")).toBe("Abnormal on report");
  });
});

import { capturePromoCode, readPromoCode } from "@/lib/promo";
describe("referral codes", () => {
  it("remembers a valid code from a link and ignores junk", () => {
    localStorage.clear();
    capturePromoCode("?code=snyder30");
    expect(readPromoCode()).toBe("SNYDER30");
    capturePromoCode("?code=<script>");
    expect(readPromoCode()).toBe("SNYDER30");
  });
});
