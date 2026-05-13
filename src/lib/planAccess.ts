// Single source of truth for plan tiers, trial state, and feature gating.
import type { Profile } from "@/hooks/useAuth";

export type Plan = "free" | "standard" | "family";
export type BillingPeriod = "monthly" | "annual";

export const PLAN_PRICES = {
  free: { label: "Free Trial", price: "Free", period: "14-day trial" },
  standard: {
    label: "Standard",
    monthlyPrice: "£39",
    annualPricePerMonth: "£29.25",
    annualBill: "£351",
    monthlyPeriod: "/month",
    annualPeriod: "/month",
    annualPeriodSub: "billed annually",
    monthlySaving: "You save £117 a year",
    annualSaving: "You save £117 a year",
  },
  family: {
    label: "Family",
    monthlyPrice: "£89.99",
    annualPricePerMonth: "£67.49",
    annualBill: "£809.88",
    monthlyPeriod: "/month",
    annualPeriod: "/month",
    annualPeriodSub: "billed annually",
    monthlySaving: "You save £269.88 a year",
    annualSaving: "You save £269.88 a year",
  },
} as const;

export const TRIAL_DAYS = 14;

export interface TrialState {
  isTrial: boolean;
  daysRemaining: number;
  expired: boolean;
}

export function getTrialState(_profile: Profile | null): TrialState {
  // TESTING PHASE: trial banner disabled, everyone gets full access.
  return { isTrial: false, daysRemaining: 0, expired: false };
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

export function hasAccess(_profile: Profile | null, _feature: Feature): boolean {
  // TESTING PHASE: grant all features to all users (Family tier access).
  return true;
}

export function getRequiredPlanLabel(feature: Feature): string {
  const required = FEATURE_REQUIREMENTS[feature][0];
  return PLAN_PRICES[required].label;
}

export function getRequiredPlanPrice(feature: Feature, period: BillingPeriod = "monthly"): string {
  const required = FEATURE_REQUIREMENTS[feature][0];
  const p = PLAN_PRICES[required];
  if (required === "free") return `${(p as typeof PLAN_PRICES.free).price}${(p as typeof PLAN_PRICES.free).period}`;
  if (period === "annual") {
    return `${(p as typeof PLAN_PRICES.standard).annualPricePerMonth}${(p as typeof PLAN_PRICES.standard).annualPeriod}`;
  }
  return `${(p as typeof PLAN_PRICES.standard).monthlyPrice}${(p as typeof PLAN_PRICES.standard).monthlyPeriod}`;
}

// TESTING PHASE: unlimited uploads for everyone.
export function canUploadDocument(_profile: Profile | null, _currentDocCount: number): boolean {
  return true;
}
