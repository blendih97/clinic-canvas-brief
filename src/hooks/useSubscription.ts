import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getStripeEnvironment } from "@/lib/stripe";

export interface SubscriptionRow {
  id: string;
  user_id: string;
  environment: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: string;
  price_id: string | null;
  product_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) { setSubscription(null); setLoading(false); return; }
    const { data } = await supabase
      .from("subscriptions" as any)
      .select("*")
      .eq("user_id", user.id)
      .eq("environment", getStripeEnvironment())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription((data as SubscriptionRow | null) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`subs-${user.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetch]);

  const isActive = !!subscription && (
    ACTIVE_STATUSES.has(subscription.status) ||
    (subscription.status === "canceled" && subscription.current_period_end &&
      new Date(subscription.current_period_end) > new Date())
  );

  return { subscription, loading, isActive, refresh: fetch };
}
