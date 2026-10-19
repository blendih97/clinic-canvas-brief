export function hasComplimentaryAccess(profile: { comped_plan?: string | null; comped_until?: string | null } | null, now = Date.now()) {
  return !!profile?.comped_plan && !!profile.comped_until && new Date(profile.comped_until).getTime() > now;
}

/** Date-only values and expiry instants always use the London calendar. */
export function formatSponsorshipDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { timeZone: "Europe/London", day: "numeric", month: "long", year: "numeric" });
}

export async function refreshClaimAccess(status: string, refreshProfile: () => Promise<void>, invalidate: () => Promise<unknown>) {
  if (status !== "joined" && status !== "already_joined") return;
  await refreshProfile();
  await invalidate();
}