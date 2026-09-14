// Strict environment resolution for Stripe webhooks.
// Never defaults: a live event processed as sandbox would leave a paying
// customer looking unpaid, and a sandbox event processed as live would unlock
// paid features for free.
export type StripeEnvName = "sandbox" | "live";

export function resolveWebhookEnv(envParam: string | null | undefined): StripeEnvName | null {
  return envParam === "live" || envParam === "sandbox" ? envParam : null;
}
