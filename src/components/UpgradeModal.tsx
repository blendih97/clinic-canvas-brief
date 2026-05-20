import { useState } from "react";
import { X, Lock, Check, Crown } from "lucide-react";
import { Feature, getPriceId, PLAN_PRICES, type BillingPeriod } from "@/lib/planAccess";
import { useAuth } from "@/hooks/useAuth";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";

interface Props {
  open: boolean;
  onClose: () => void;
  feature: Feature | null;
  customMessage?: string;
}

const featureLabels: Record<Feature, string> = {
  share_brief: "Sharing your Health Brief",
  export: "Downloading your PDF",
  request_records: "Requesting records",
  request_imaging: "Requesting imaging",
  family_invite: "Inviting family members",
  unlimited_uploads: "Unlimited document uploads",
};

// Features that REQUIRE the Family plan; everything else is unlocked by Standard.
const requiresFamily = (f: Feature | null) => f === "family_invite";

const UpgradeModal = ({ open, onClose, feature, customMessage }: Props) => {
  const { user } = useAuth();
  const { openCheckout, checkoutElement } = useStripeCheckout();
  const [period, setPeriod] = useState<BillingPeriod>("annual");

  if (!open || !feature) return null;

  const featureLabel = featureLabels[feature];
  const familyOnly = requiresFamily(feature);

  const handleUpgrade = (plan: "standard" | "family") => {
    if (!user) return;
    // Meta Pixel: InitiateCheckout (behavioural only, no health data)
    import("@/lib/metaPixel").then(m => m.trackInitiateCheckout({
      content_name: `${plan}_${period}`,
      currency: "GBP",
    })).catch(() => {});
    onClose();
    openCheckout({
      priceId: getPriceId(plan, period),
      customerEmail: user.email,
      userId: user.id,
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
  };

  const plans: { id: "standard" | "family"; recommended?: boolean }[] = familyOnly
    ? [{ id: "family", recommended: true }]
    : [
        { id: "standard", recommended: true },
        { id: "family" },
      ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h3 className="font-heading text-xl text-foreground">Upgrade your plan</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/15">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {customMessage || (
                  <>
                    <span className="font-medium">{featureLabel}</span> is a paid feature.
                    Choose a plan below to continue.
                  </>
                )}
              </p>
            </div>

            {/* Monthly / Annual toggle */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPeriod("monthly")}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  period === "monthly" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setPeriod("annual")}
                className={`relative px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  period === "annual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annual
                <span className="absolute -top-2 -right-1 bg-amber-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full">
                  -25%
                </span>
              </button>
            </div>

            <div className={`grid gap-4 ${plans.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
              {plans.map(({ id, recommended }) => {
                const p = PLAN_PRICES[id];
                const price = period === "annual" ? p.annualPricePerMonth : p.monthlyPrice;
                const sub = period === "annual" ? `${p.annualPeriodSub} (${p.annualBill}/year)` : null;
                return (
                  <div
                    key={id}
                    className={`relative bg-card border rounded-lg p-5 ${
                      recommended ? "border-primary/40 ring-1 ring-primary/15" : "border-border"
                    }`}
                  >
                    {recommended && (
                      <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] rounded-full font-medium flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Recommended
                      </div>
                    )}
                    <h4 className="font-heading text-lg text-foreground">{p.label}</h4>
                    <div className="mt-1 mb-1">
                      <span className="font-heading text-3xl text-foreground">{price}</span>
                      <span className="text-xs text-muted-foreground ml-1">{p.monthlyPeriod}</span>
                    </div>
                    {sub && <p className="text-[11px] text-muted-foreground mb-3">{sub}</p>}
                    <ul className="space-y-1.5 mb-4 mt-3">
                      {(id === "standard"
                        ? ["Unlimited uploads", "PDF export & sharing", "Request records", "All AI features"]
                        : ["Everything in Standard", "Up to 6 family members", "Family overview"]
                      ).map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-foreground/70">
                          <Check className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleUpgrade(id)}
                      className="w-full py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Upgrade to {p.label}
                    </button>
                  </div>
                );
              })}
            </div>

            <button onClick={onClose} className="block mx-auto text-xs text-muted-foreground hover:text-foreground">
              Maybe later
            </button>
          </div>
        </div>
      </div>
      {checkoutElement}
    </>
  );
};

export default UpgradeModal;
