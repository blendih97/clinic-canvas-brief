import { supabase } from "@/integrations/supabase/client";
import { paidPlan } from "@/lib/onboarding";

export const FUNNEL_EVENTS = ["signup_page_viewed", "signup_submitted", "signup_error", "signup_succeeded", "first_login", "upload_started", "upload_saved", "checkout_started"] as const;
export type FunnelEvent = typeof FUNNEL_EVENTS[number];
const ERROR_CODES = ["weak_password", "rate_limit", "email_exists", "too_short", "missing_fields", "other"] as const;
export function funnelFields(event: FunnelEvent, plan?: unknown, error?: unknown) {
  return { _event: event, _plan: paidPlan(plan) || "free", _error_code: ERROR_CODES.includes(error as typeof ERROR_CODES[number]) ? String(error) : "none" };
}
export function recordFunnel(event: FunnelEvent, plan?: unknown, error?: unknown) {
  void Promise.resolve(supabase.rpc("record_onboarding_funnel" as never, funnelFields(event, plan, error) as never)).catch(() => {});
}