import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { readPromoCode } from "@/lib/promo";

interface Props {
  priceId: string;
  quantity?: number;
  customerEmail?: string;
  userId?: string;
  returnUrl?: string;
}

export function StripeEmbeddedCheckout({ priceId, quantity, customerEmail, userId, returnUrl }: Props) {
  const fetchClientSecret = async (): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: {
        priceId, quantity, customerEmail, userId, promoCode: readPromoCode() ?? undefined,
        returnUrl: returnUrl || `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
      },
    });
    if (error || !data?.clientSecret) throw new Error(error?.message || "Failed to create checkout session");
    return data.clientSecret;
  };

  return (
    <div id="checkout" className="bg-card rounded-lg overflow-hidden">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
