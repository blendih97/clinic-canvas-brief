import { useEffect, useState } from "react";
import { X, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { pendingPlan } from "@/lib/onboarding";
import { getPriceId, PLAN_PRICES } from "@/lib/planAccess";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { recordFunnel } from "@/lib/funnel";

export default function PendingPlanBanner() {
  const { user } = useAuth();
  const { isActive, subscription, loading } = useSubscription();
  const { openCheckout, checkoutElement } = useStripeCheckout();
  const [dismissed, setDismissed] = useState(false);
  const plan = pendingPlan(user?.user_metadata?.plan_intent, isActive);
  useEffect(() => {
    if (!user || user.user_metadata?.first_login_recorded) return;
    let cancelled = false;
    void supabase.auth.getUser().then(({ data, error }) => {
      if (cancelled || error || !data.user || data.user.user_metadata?.first_login_recorded) return;
      void supabase.auth.updateUser({ data: { first_login_recorded: true } }).then(({ error }) => {
        if (!error) recordFunnel("first_login", data.user?.user_metadata?.plan_intent);
      });
    });
    return () => { cancelled = true; };
  }, [user?.id, user?.user_metadata?.first_login_recorded]);
  useEffect(() => {
    if (!user?.user_metadata?.plan_intent || loading || !subscription || !["active", "trialing"].includes(subscription.status)) return;
    void supabase.auth.updateUser({ data: { plan_intent: null } });
  }, [user?.user_metadata?.plan_intent, loading, subscription]);
  if (!user || loading || !plan || dismissed) return null;
  return <>
    <section className="mb-4 border border-primary bg-primary/5 rounded-lg p-5 flex flex-col sm:flex-row gap-4 sm:items-center" aria-label="Pending plan payment">
      <div className="flex-1"><h2 className="font-heading text-xl text-foreground">Finish setting up your {PLAN_PRICES[plan].label} plan</h2><p className="text-sm text-muted-foreground mt-1">{PLAN_PRICES[plan].price}/year. Your plan starts after payment.</p></div>
      <Button onClick={() => openCheckout({ priceId: getPriceId(plan), userId: user.id, customerEmail: user.email })}><CreditCard className="w-4 h-4 mr-2" />Complete payment</Button>
      <Button variant="ghost" size="icon" aria-label="Dismiss plan reminder" onClick={() => setDismissed(true)}><X className="w-4 h-4" /></Button>
    </section>{checkoutElement}
  </>;
}