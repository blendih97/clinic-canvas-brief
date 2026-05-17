import { type StripeEnv, createStripeClient, corsHeaders } from "../_shared/stripe.ts";

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { priceId, quantity, customerEmail, userId, returnUrl, environment } = body as {
      priceId: string; quantity?: number; customerEmail?: string; userId?: string;
      returnUrl: string; environment: StripeEnv;
    };

    if (!priceId || !/^[a-zA-Z0-9_-]+$/.test(priceId)) throw new Error("Invalid priceId");
    if (!returnUrl) throw new Error("Missing returnUrl");
    if (environment !== "sandbox" && environment !== "live") throw new Error("Invalid environment");

    const stripe = createStripeClient(environment);

    const prices = await stripe.prices.list({ lookup_keys: [priceId] });
    if (!prices.data.length) throw new Error(`Price not found: ${priceId}`);
    const stripePrice = prices.data[0];
    const isRecurring = stripePrice.type === "recurring";

    const customerId = (customerEmail || userId)
      ? await resolveOrCreateCustomer(stripe, { email: customerEmail, userId })
      : undefined;

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: quantity || 1 }],
      mode: isRecurring ? "subscription" : "payment",
      ui_mode: "embedded_page",
      return_url: returnUrl,
      ...(customerId && { customer: customerId }),
      managed_payments: { enabled: true },
      ...(userId && {
        metadata: { userId, managed_payments: "true" },
        ...(isRecurring && { subscription_data: { metadata: { userId } } }),
      }),
    } as any);

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("create-checkout error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
