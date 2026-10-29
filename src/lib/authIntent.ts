export function hasAuthIntent(search: string) {
  const params = new URLSearchParams(search);
  const plan = params.get("plan");
  const next = params.get("next");
  return plan === "standard" || plan === "family" || !!(next && /^\/(?!\/)/.test(next)) ||
    params.has("partner") || params.has("invite") || params.has("staff");
}