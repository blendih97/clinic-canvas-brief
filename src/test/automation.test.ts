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
