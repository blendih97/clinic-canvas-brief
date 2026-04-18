// Single source of truth for plan tiers, trial state, and feature gating.
import type { Profile } from "@/hooks/useAuth";

export type Plan = "free" | "standard" | "family";

export const PLAN_PRICES = {
  free: { label: "Free Trial", price: "Free", period: "14-day trial" },
  standard: { label: "Standard", price: "£39", period: "/month" },
  family: { label: "Family", price: "£89.99", period: "/month" },
} as const;

export const TRIAL_DAYS = 14;

export interface TrialState {
  isTrial: boolean;
  daysRemaining: number;
  expired: boolean;
}

export function getTrialState(profile: Profile | null): TrialState {
  if (!profile || profile.plan !== "free") {
    return { isTrial: false, daysRemaining: 0, expired: false };
  }
  const created = new Date(profile.created_at);
  const elapsedMs = Date.now() - created.getTime();
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, TRIAL_DAYS - elapsedDays);
  return {
    isTrial: true,
    daysRemaining,
    expired: daysRemaining <= 0,
  };
}

export type Feature =
  | "share_brief"
  | "export"
  | "request_records"
  | "request_imaging"
  | "family_invite"
  | "unlimited_uploads";

const FEATURE_REQUIREMENTS: Record<Feature, Plan[]> = {
  share_brief: ["standard", "family"],
  export: ["standard", "family"],
  request_records: ["standard", "family"],
  request_imaging: ["standard", "family"],
  family_invite: ["family"],
  unlimited_uploads: ["standard", "family"],
};

export function hasAccess(profile: Profile | null, feature: Feature): boolean {
  const plan = (profile?.plan || "free") as Plan;
  return FEATURE_REQUIREMENTS[feature].includes(plan);
}

export function getRequiredPlanLabel(feature: Feature): string {
  const required = FEATURE_REQUIREMENTS[feature][0];
  return PLAN_PRICES[required].label;
}

export function getRequiredPlanPrice(feature: Feature): string {
  const required = FEATURE_REQUIREMENTS[feature][0];
  const p = PLAN_PRICES[required];
  return `${p.price}${p.period}`;
}

// Free trial allows exactly 1 document upload.
export function canUploadDocument(profile: Profile | null, currentDocCount: number): boolean {
  const plan = (profile?.plan || "free") as Plan;
  if (plan === "standard" || plan === "family") return true;
  return currentDocCount < 1;
}
