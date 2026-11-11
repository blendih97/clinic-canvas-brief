import { PLAN_PRICES } from "@/lib/planAccess";

export type PaidPlan = "standard" | "family";
export function paidPlan(value: unknown): PaidPlan | null {
  return value === "standard" || value === "family" ? value : null;
}
export function strongPassword(value: string): boolean {
  return value.length >= 10 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value) && /[^a-zA-Z0-9]/.test(value);
}
export function signupError(error: { code?: string; status?: number; message?: string }) {
  const code = error.code || "unknown";
  if (code === "weak_password" || error.status === 422 && /password|breach|weak/i.test(error.message || "")) {
    return { code: "weak_password", message: "This password has appeared in data breaches, so it isn't safe. Please choose a different one." };
  }
  if (error.status === 429 || /rate.limit|too many/i.test(code + " " + error.message)) {
    return { code: "rate_limit", message: "Too many attempts, wait a minute." };
  }
  if (/already.*registered|user_already_exists|email_exists/i.test(code + " " + error.message)) {
    return { code: "email_exists", message: "Check your email to continue, or sign in if you already have an account." };
  }
  // The database refuses throwaway and test inboxes; Supabase reports that as a generic database error.
  if (/database error saving new user|disposable_email/i.test(code + " " + error.message)) {
    return { code: "blocked_email", message: "Please use your own personal or work email address." };
  }
  return { code: "other", message: error.message || "We couldn't create your account. Please try again." };
}
export function signupPlanCopy(plan: PaidPlan) {
  const offer = PLAN_PRICES[plan];
  return `${offer.label} plan · ${offer.price}/year — create your account, then complete payment`;
}
export function pendingPlan(value: unknown, active: boolean): PaidPlan | null {
  return active ? null : paidPlan(value);
}
export function emptyDashboard(documentCount: number, viewingMember: boolean) {
  return documentCount === 0 && !viewingMember;
}