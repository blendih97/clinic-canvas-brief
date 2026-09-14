// Verified checkout outcome for the return page. Returns only non-health
// billing values (amount, currency, plan lookup key) so the client can report
// an accurate purchase value to analytics.
import { type StripeEnv, createStripeClient, corsHeaders } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { sessionId, environment } = await req.json() as {
      sessionId?: string; environment?: StripeEnv;
    };
    if (!sessionId || !/^[a-zA-Z0-9_]+$/.test(sessionId)) throw new Error("Invalid sessionId");
    if (environment !== "sandbox" && environment !== "live") throw new Error("Invalid environment");

    const stripe = createStripeClient(environment);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price"],
    } as any);

    const price = (session as any).line_items?.data?.[0]?.price;

    return new Response(JSON.stringify({
      paid: session.payment_status !== "unpaid",
      value: typeof session.amount_total === "number" ? session.amount_total / 100 : null,
      currency: (session.currency || "gbp").toUpperCase(),
      plan: price?.lookup_key ?? null,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: unknown) {
    console.error("get-checkout-result error:", error);
    return new Response(JSON.stringify({ error: "lookup_failed" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
