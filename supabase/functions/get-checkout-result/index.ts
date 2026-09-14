// Verified checkout outcome for the return page. Requires an authenticated
// RinVita user AND proof that the session belongs to them; returns only
// non-health billing values (amount, currency, paid state, plan lookup key).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { type StripeEnv, createStripeClient, corsHeaders } from "../_shared/stripe.ts";
import { sessionBelongsToUser } from "../_shared/checkoutOwnership.ts";

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Auth is validated in code (the project deploys functions with
  // verify_jwt = false because of the signing-keys setup).
  const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
  if (!jwt) return json({ error: "Not authenticated", code: "unauthenticated" }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: userData } = await admin.auth.getUser(jwt);
  const userId = userData?.user?.id;
  if (!userId) return json({ error: "Not authenticated", code: "unauthenticated" }, 401);

  try {
    const { sessionId, environment } = await req.json() as {
      sessionId?: string; environment?: StripeEnv;
    };
    if (!sessionId || !/^[a-zA-Z0-9_]+$/.test(sessionId)) throw new Error("Invalid sessionId");
    if (environment !== "sandbox" && environment !== "live") throw new Error("Invalid environment");

    const stripe = createStripeClient(environment);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price", "subscription", "customer"],
    } as any);

    if (!sessionBelongsToUser(session as any, userId)) {
      console.error("get-checkout-result: ownership not proven for session");
      return json({ error: "Forbidden", code: "not_session_owner" }, 403);
    }

    const price = (session as any).line_items?.data?.[0]?.price;

    return json({
      paid: session.payment_status !== "unpaid",
      value: typeof session.amount_total === "number" ? session.amount_total / 100 : null,
      currency: (session.currency || "gbp").toUpperCase(),
      plan: price?.lookup_key ?? null,
    }, 200);
  } catch (error: unknown) {
    console.error("get-checkout-result error:", error);
    return json({ error: "lookup_failed" }, 400);
  }
});
