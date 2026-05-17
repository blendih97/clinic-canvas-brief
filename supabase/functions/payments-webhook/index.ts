import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient, getWebhookSecret } from "../_shared/stripe.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function upsertSubscriptionFromStripe(
  stripe: ReturnType<typeof createStripeClient>,
  environment: StripeEnv,
  subscription: any,
) {
  const userId = subscription.metadata?.userId
    ?? (await stripe.customers.retrieve(subscription.customer as string)
          .then((c: any) => c.metadata?.userId).catch(() => null));

  if (!userId) {
    console.warn("Subscription has no userId metadata, skipping:", subscription.id);
    return;
  }

  const item = subscription.items?.data?.[0];
  const stripePrice = item?.price;
  // Human-readable price ID (lookup_key) is stable across sandbox/live.
  const priceLookupKey = stripePrice?.lookup_key ?? null;
  const productId = stripePrice?.product ?? null;
  const periodEndUnix = item?.current_period_end ?? subscription.current_period_end;

  const row = {
    user_id: userId,
    environment,
    stripe_customer_id: subscription.customer as string,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    price_id: priceLookupKey,
    product_id: typeof productId === "string" ? productId : productId?.id ?? null,
    current_period_end: periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null,
    cancel_at_period_end: !!subscription.cancel_at_period_end,
  };

  const { error } = await supabase
    .from("subscriptions")
    .upsert(row, { onConflict: "stripe_subscription_id,environment" });

  if (error) console.error("Failed to upsert subscription:", error);
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const envParam = url.searchParams.get("env");
  const environment: StripeEnv = envParam === "live" ? "live" : "sandbox";

  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: any;
  try {
    const stripe = createStripeClient(environment);
    if (signature) {
      event = await stripe.webhooks.constructEventAsync(
        rawBody, signature, getWebhookSecret(environment),
      );
    } else {
      event = JSON.parse(rawBody);
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    const stripe = createStripeClient(environment);
    const type: string = event.type;
    const data = event.data?.object ?? event.object ?? {};

    if (
      type === "customer.subscription.created" ||
      type === "customer.subscription.updated" ||
      type === "customer.subscription.deleted" ||
      type === "subscription.created" ||
      type === "subscription.updated" ||
      type === "subscription.canceled"
    ) {
      await upsertSubscriptionFromStripe(stripe, environment, data);
    } else if (type === "checkout.session.completed") {
      const session = data;
      if (session.mode === "subscription" && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        await upsertSubscriptionFromStripe(stripe, environment, sub);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
});
