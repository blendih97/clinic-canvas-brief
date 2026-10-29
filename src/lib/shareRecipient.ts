/** Secret is session memory only: not in the shared URL, browser storage or analytics. */
export function newRecipientSecret() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, "0")).join("");
}

export const SHARE_REVALIDATE_MS = 5_000;

export function shareExpiryDelay(expiresAt: string, now = Date.now()) {
  const expiry = Date.parse(expiresAt);
  return Number.isFinite(expiry) ? Math.max(0, Math.min(expiry - now, 2_147_483_647)) : 0;
}