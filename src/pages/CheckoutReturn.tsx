import { useSearchParams, Link } from "react-router-dom";
import { useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { trackPurchase } from "@/lib/metaPixel";
import { trackEvent } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { useAuth } from "@/hooks/useAuth";

export default function CheckoutReturn() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { user } = useAuth();

  useEffect(() => {
    // The lookup is owner-scoped and needs a signed-in session.
    if (!sessionId || !user) return;
    let cancelled = false;
    // Resolve the real amount from the verified Stripe session server-side.
    // Billing values only — no health information is ever sent to analytics.
    (async () => {
      try {
        const { data } = await supabase.functions.invoke("get-checkout-result", {
          body: { sessionId, environment: getStripeEnvironment() },
        });
        if (cancelled || !data || data.error) return;
        const value = typeof data.value === "number" ? data.value : 0;
        const currency = data.currency || "GBP";
        trackPurchase({ value, currency });
        trackEvent("purchase_completed", { value, currency, plan: data.plan ?? null });
      } catch {
        // analytics must never block the confirmation screen
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId, user]);


  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6 bg-card border border-border rounded-xl p-10">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-heading text-3xl text-foreground">
          {sessionId ? "Payment complete" : "Checkout closed"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {sessionId
            ? "Thank you for subscribing to RinVita. Your account has been upgraded."
            : "No payment was processed."}
        </p>
        <Link
          to="/app"
          className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Return to your vault
        </Link>
      </div>
    </div>
  );
}
