import { useState } from "react";
import { CheckCircle, Crown, ArrowRight, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getTrialState, getPriceId, PLAN_PRICES, type BillingPeriod } from "@/lib/planAccess";

interface PlanCard {
  id: "free" | "standard" | "family";
  name: string;
  features: string[];
}

const planCards: PlanCard[] = [
  {
    id: "free",
    name: "Free Trial",
    features: [
      "3 document uploads",
      "AI extraction & translation",
      "Blood results dashboard",
      "Imaging viewer",
      "No sharing, export, or record requests",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    features: [
      "Unlimited document uploads",
      "Full AI intelligence suite",
      "Unlimited share links",
      "PDF export",
      "Request records from providers",
    ],
  },
  {
    id: "family",
    name: "Family",
    features: [
      "Everything in Standard",
      "Up to 6 family members",
      "Owner-managed sub-vaults",
      "Family overview tab",
      "Switch between member records",
    ],
  },
];

const BillingSection = () => {
  const { profile, user } = useAuth();
  const { subscription, isActive } = useSubscription();
  const { openCheckout, checkoutElement } = useStripeCheckout();
  const userPlan = profile?.plan || "free";
  const trial = getTrialState(profile);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("annual");
  const [portalLoading, setPortalLoading] = useState(false);

  // Determine active plan from Stripe subscription (price_id like "standard_monthly")
  const activePlanId: "free" | "standard" | "family" =
    isActive && subscription?.price_id?.startsWith("family") ? "family"
    : isActive && subscription?.price_id?.startsWith("standard") ? "standard"
    : (userPlan as "free" | "standard" | "family");

  const handleUpgrade = (planId: "standard" | "family") => {
    if (!user) return;
    openCheckout({
      priceId: getPriceId(planId, billingPeriod),
      customerEmail: user.email,
      userId: user.id,
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
  };

  const handleManage = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: { environment: getStripeEnvironment(), returnUrl: `${window.location.origin}/app/settings` },
      });
      if (error || !data?.url) throw new Error(error?.message || "Failed to open billing portal");
      window.open(data.url, "_blank");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  const getPrice = (planId: "free" | "standard" | "family") => {
    if (planId === "free") return { price: "Free", period: "14-day trial", sub: null };
    const p = PLAN_PRICES[planId];
    if (billingPeriod === "annual") {
      return {
        price: p.annualPricePerMonth,
        period: p.annualPeriod,
        sub: p.annualPeriodSub,
        bill: p.annualBill,
        saving: p.annualSaving,
      };
    }
    return {
      price: p.monthlyPrice,
      period: p.monthlyPeriod,
      sub: null,
      saving: p.monthlySaving,
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-3xl font-light text-foreground">Subscription</h2>
        <p className="text-sm text-muted-foreground mt-2">Manage your RinVita membership</p>
      </div>

      {trial.isTrial && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <p className="text-sm text-foreground">
            <span className="font-medium">Free Trial</span> — {trial.daysRemaining} day{trial.daysRemaining === 1 ? "" : "s"} remaining. Upgrade to Standard to unlock all features.
          </p>
        </div>
      )}

      {/* Monthly / Annual Toggle */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setBillingPeriod("monthly")}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            billingPeriod === "monthly"
              ? "bg-foreground text-background shadow-md"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingPeriod("annual")}
          className={`relative px-5 py-2 rounded-full text-sm font-medium transition-all ${
            billingPeriod === "annual"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Annual
          <span className="absolute -top-2.5 -right-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            SAVE 25%
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {planCards.map((plan) => {
          const isCurrent = activePlanId === plan.id;
          const priceInfo = getPrice(plan.id);
          const isPaid = plan.id !== "free";
          const isAnnual = billingPeriod === "annual";

          return (
            <div
              key={plan.id}
              className={`bg-card border rounded-lg p-6 relative transition-all ${
                isCurrent ? "border-primary/40" : "border-border"
              } ${isPaid && isAnnual ? "ring-1 ring-primary/20" : ""}`}
            >
              {isCurrent && (
                <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] rounded-full font-medium flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Current Plan
                </div>
              )}

              {isPaid && isAnnual && (
                <div className="absolute -top-2.5 right-4 px-2 py-0.5 bg-amber-500 text-white text-[10px] rounded-full font-bold">
                  SAVE 25%
                </div>
              )}

              <h3 className="font-heading text-xl text-foreground mb-1">{plan.name}</h3>

              <div className="mb-1">
                <span className="font-heading text-4xl text-foreground">{priceInfo.price}</span>
                <span className="text-sm text-muted-foreground ml-1">{priceInfo.period}</span>
              </div>

              {isPaid && priceInfo.sub && (
                <p className="text-xs text-muted-foreground mb-2">
                  {priceInfo.sub} ({priceInfo.bill}/year)
                </p>
              )}

              {isPaid && priceInfo.saving && (
                <div className="flex items-center gap-1.5 mb-4 py-1.5 px-2.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
                  <ArrowRight className="w-3 h-3 text-amber-600" />
                  <span className="text-xs font-medium text-amber-600">{priceInfo.saving}</span>
                </div>
              )}

              <div className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-xs text-foreground/70">
                    <CheckCircle className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              {isCurrent && plan.id !== "free" ? (
                <button
                  onClick={handleManage}
                  disabled={portalLoading}
                  className="w-full py-2 rounded-md text-sm font-medium bg-foreground/5 text-foreground hover:bg-foreground/10 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {portalLoading ? "Opening…" : "Manage subscription"}
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              ) : isCurrent ? (
                <button className="w-full py-2 rounded-md text-sm font-medium bg-muted text-muted-foreground cursor-default" disabled>
                  Current Plan
                </button>
              ) : plan.id === "free" ? (
                <button className="w-full py-2 rounded-md text-sm font-medium bg-muted/50 text-muted-foreground cursor-default" disabled>
                  Trial only
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id as "standard" | "family")}
                  className="w-full py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {activePlanId === "free" ? "Upgrade" : (plan.id === "family" ? "Upgrade to Family" : "Switch to Standard")}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {checkoutElement}
    </div>
  );
};

export default BillingSection;
