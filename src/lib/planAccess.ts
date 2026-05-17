// Single source of truth for plan tiers, trial state, and feature gating.
import type { Profile } from "@/hooks/useAuth";

export type Plan = "free" | "standard" | "family";
export type BillingPeriod = "monthly" | "annual";

export const PLAN_PRICES = {
  free: { label: "Free", price: "Free", period: "3 documents" },
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
    monthlyPriceId: "standard_monthly",
    annualPriceId: "standard_annual",
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
    monthlyPriceId: "family_monthly",
    annualPriceId: "family_annual",
  },
} as const;

export function getPriceId(plan: "standard" | "family", period: BillingPeriod): string {
  return period === "annual" ? PLAN_PRICES[plan].annualPriceId : PLAN_PRICES[plan].monthlyPriceId;
}

// Free plan: users can upload up to this many documents, see full AI extraction
// + translation, and preview PDF exports. Downloading the PDF requires a paid plan.
export const FREE_DOC_LIMIT = 3;

export interface TrialState {
  isTrial: boolean;
  daysRemaining: number;
  expired: boolean;
}

// Kept for backwards-compat with existing imports — no trial concept anymore.
export function getTrialState(_profile: Profile | null): TrialState {
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

// UI-level access (lets free users see and preview features so they understand
// the value). The real paywall lives at the action layer — e.g. PDF download
// checks the live subscription via useSubscription().
export function hasAccess(_profile: Profile | null, _feature: Feature): boolean {
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

// Free users can upload up to FREE_DOC_LIMIT documents. Paid subscribers
// (isActive) have unlimited uploads. Pass the live subscription state in.
export function canUploadDocument(
  _profile: Profile | null,
  currentDocCount: number,
  isActiveSubscriber: boolean = false,
): boolean {
  if (isActiveSubscriber) return true;
  return currentDocCount < FREE_DOC_LIMIT;
}
