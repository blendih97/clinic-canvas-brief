import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient, corsHeaders } from "../_shared/stripe.ts";

class ValidationError extends Error {}

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

function isAllowedReturnUrl(url: string): boolean {
  if (url.startsWith("https://rinvita.co.uk/") || url.startsWith("https://www.rinvita.co.uk/")) return true;
  if (url.startsWith("http://localhost:")) return true;
  return /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.lovable\.app\//i.test(url);
}

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("Invalid JSON body");
    }
    const { priceId, quantity, customerEmail, returnUrl, environment } = body as {
      priceId: string; quantity?: number; customerEmail?: string;
      returnUrl: string; environment: StripeEnv;
    };

    if (!priceId || !/^[a-zA-Z0-9_-]+$/.test(priceId)) throw new ValidationError("Invalid priceId");
    if (!returnUrl || typeof returnUrl !== "string" || !isAllowedReturnUrl(returnUrl)) {
      throw new ValidationError("Invalid returnUrl");
    }
    if (environment !== "sandbox" && environment !== "live") throw new ValidationError("Invalid environment");

    // Identity comes from the caller's session, never from the request body.
    const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
    let userId: string | undefined;
    let userEmail: string | undefined;
    if (jwt) {
      const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data, error } = await admin.auth.getUser(jwt);
      if (!error && data?.user) {
        userId = data.user.id;
        userEmail = data.user.email ?? undefined;
      }
    }

    const stripe = createStripeClient(environment);

    const prices = await stripe.prices.list({ lookup_keys: [priceId] });
    if (!prices.data.length) throw new ValidationError(`Price not found: ${priceId}`);
    const stripePrice = prices.data[0];
    const isRecurring = stripePrice.type === "recurring";

    if (isRecurring && !userId) return jsonResponse({ error: "Please sign in to subscribe." }, 401);

    const customerId = userId
      ? await resolveOrCreateCustomer(stripe, { email: userEmail, userId })
      : undefined;
    const guestEmail = !userId && typeof customerEmail === "string" && customerEmail ? customerEmail : undefined;

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: quantity || 1 }],
      mode: isRecurring ? "subscription" : "payment",
      ui_mode: "embedded_page",
      return_url: returnUrl,
      ...(customerId && { customer: customerId }),
      ...(guestEmail && { customer_email: guestEmail }),
      managed_payments: { enabled: true },
      ...(userId && {
        client_reference_id: userId,
        metadata: { userId, managed_payments: "true" },
        ...(isRecurring && { subscription_data: { metadata: { userId } } }),
      }),
    } as any);

    return jsonResponse({ clientSecret: session.client_secret }, 200);
  } catch (error: unknown) {
    if (error instanceof ValidationError) return jsonResponse({ error: error.message }, 400);
    console.error("create-checkout error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
