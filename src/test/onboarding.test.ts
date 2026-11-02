import { describe, expect, it, vi } from "vitest";
import { emptyDashboard, paidPlan, pendingPlan, signupError, signupPlanCopy, strongPassword } from "@/lib/onboarding";
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: vi.fn(async () => ({ error: null })) } }));
import { funnelFields } from "@/lib/funnel";

describe("signup password rules", () => {
  it("never labels abc123 or a nine-character mixed password strong", () => {
    expect(strongPassword("abc123")).toBe(false);
    expect(strongPassword("Abc123!xy")).toBe(false);
    expect(strongPassword("Abc123!xyz")).toBe(true);
  });
  it("requires mixed letter types, numbers and symbols", () => {
    for (const password of ["abcdefghij1!", "ABCDEFGHIJ1!", "Abcdefghij!", "Abcdefghij1"]) expect(strongPassword(password)).toBe(false);
  });
  it("maps weak_password and password 422 responses to breached-password feedback", () => {
    expect(signupError({ code: "weak_password" }).message).toBe("This password has appeared in data breaches, so it isn't safe. Please choose a different one.");
    expect(signupError({ status: 422, message: "Password is weak" }).code).toBe("weak_password");
  });
  it("maps rate limits and registered email without exposing account details", () => {
    expect(signupError({ status: 429 }).message).toBe("Too many attempts, wait a minute.");
    expect(signupError({ code: "user_already_exists" }).code).toBe("email_exists");
  });
});
describe("paid onboarding intent", () => {
  it("uses the chosen annual Standard and Family prices", () => {
    expect(signupPlanCopy("standard")).toBe("Standard plan · £149/year — create your account, then complete payment");
    expect(signupPlanCopy("family")).toBe("Family plan · £249/year — create your account, then complete payment");
  });
  it("only prompts unpaid users with valid intent", () => {
    expect(pendingPlan("family", false)).toBe("family");
    expect(pendingPlan("standard", false)).toBe("standard");
    expect(pendingPlan("family", true)).toBe(null);
    expect(paidPlan("admin")).toBe(null);
  });
  it("uses the first-record state only with zero own documents", () => {
    expect(emptyDashboard(0, false)).toBe(true);
    expect(emptyDashboard(1, false)).toBe(false);
    expect(emptyDashboard(0, true)).toBe(false);
  });
  it("strips arbitrary personal data from aggregate funnel dimensions", () => {
    expect(funnelFields("signup_error", "someone@example.com", "198.51.100.1")).toEqual({ _event: "signup_error", _plan: "free", _error_code: "none" });
    expect(funnelFields("signup_error", "family", "weak_password")).toEqual({ _event: "signup_error", _plan: "family", _error_code: "weak_password" });
  });
});