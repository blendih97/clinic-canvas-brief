import { CheckCircle, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getTrialState } from "@/lib/planAccess";

const plans = [
  {
    id: "free",
    name: "Free Trial",
    price: "Free",
    period: "14-day trial",
    features: [
      "1 document upload",
      "AI extraction & translation",
      "Blood results dashboard",
      "Imaging viewer",
      "No sharing, export, or record requests",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    price: "£39",
    period: "/month",
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
    price: "£89.99",
    period: "/month",
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
  const { profile } = useAuth();
  const userPlan = profile?.plan || "free";
  const trial = getTrialState(profile);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-3xl font-light text-foreground">Subscription</h2>
        <p className="text-sm text-muted-foreground mt-2">Manage your RinVita membership</p>
      </div>

      {trial.isTrial && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <p className="text-sm text-foreground">
            <span className="font-medium">Free Trial</span> — {trial.daysRemaining} day{trial.daysRemaining === 1 ? "" : "s"} remaining. Upgrade to Standard at £39/month to unlock all features.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isCurrent = userPlan === plan.id;
          return (
            <div key={plan.id}
              className={`bg-card border rounded-lg p-6 relative ${isCurrent ? "border-primary/40" : "border-border"}`}>
              {isCurrent && (
                <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] rounded-full font-medium flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Current Plan
                </div>
              )}
              <h3 className="font-heading text-xl text-foreground mb-1">{plan.name}</h3>
              <div className="mb-4">
                <span className="font-heading text-4xl text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>
              </div>
              <div className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-xs text-foreground/70">
                    <CheckCircle className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              {isCurrent ? (
                <button className="w-full py-2 rounded-md text-sm font-medium bg-muted text-muted-foreground cursor-default" disabled>
                  Current Plan
                </button>
              ) : (
                <button className="w-full py-2 rounded-md text-sm font-medium bg-primary/10 text-primary cursor-default relative" disabled>
                  Upgrade
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded">Coming Soon</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BillingSection;
