import { CheckCircle, Crown } from "lucide-react";

const plans = [
  {
    id: "foundation",
    name: "Foundation",
    price: "£29",
    period: "/month",
    features: ["5 document uploads/month", "AI extraction & translation", "Blood results dashboard", "Basic share links"],
    current: false,
  },
  {
    id: "professional",
    name: "Professional",
    price: "£79",
    period: "/month",
    features: ["Unlimited document uploads", "Full AI intelligence suite", "Imaging analysis & viewer", "Priority share links with audit log", "Multi-country health timeline"],
    current: true,
  },
  {
    id: "family",
    name: "Family",
    price: "£149",
    period: "/month",
    features: ["Everything in Professional", "Up to 5 family members", "Shared vault with permissions", "Family health overview", "Dedicated support"],
    current: false,
  },
];

const BillingSection = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-3xl font-light text-foreground">Subscription</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your Vault membership</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-card border rounded-lg p-6 relative ${
              plan.current ? "border-primary/40" : "border-border"
            }`}
          >
            {plan.current && (
              <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] rounded-full font-medium flex items-center gap-1">
                <Crown className="w-3 h-3" /> Current Plan
              </div>
            )}
            <h3 className="font-heading text-xl text-foreground mb-1">{plan.name}</h3>
            <div className="mb-4">
              <span className="font-heading text-4xl text-foreground">{plan.price}</span>
              <span className="text-sm text-muted-foreground">{plan.period}</span>
            </div>
            <div className="space-y-2 mb-6">
              {plan.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-foreground/70">
                  <CheckCircle className="w-3.5 h-3.5 text-primary" />
                  {f}
                </div>
              ))}
            </div>
            <button
              className={`w-full py-2 rounded-md text-sm font-medium transition-colors ${
                plan.current
                  ? "bg-muted text-muted-foreground cursor-default"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
              disabled={plan.current}
            >
              {plan.current ? "Active" : "Upgrade"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BillingSection;
