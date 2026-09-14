// Ownership proof for a Stripe Checkout Session.
// A session id is guessable enough that billing details must never be returned
// on the strength of the id alone — the caller has to be the user the session
// was created for.
export interface OwnableSession {
  client_reference_id?: string | null;
  metadata?: Record<string, string> | null;
  subscription?: { metadata?: Record<string, string> | null } | string | null;
  customer?: { metadata?: Record<string, string> | null } | string | null;
}

function metaUserId(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const meta = (value as { metadata?: Record<string, string> | null }).metadata;
  return meta?.userId ?? meta?.user_id ?? null;
}

/** Every place Stripe may carry our user id, in order of reliability. */
export function sessionOwnerIds(session: OwnableSession): string[] {
  return [
    session.client_reference_id ?? null,
    session.metadata?.userId ?? session.metadata?.user_id ?? null,
    metaUserId(session.subscription),
    metaUserId(session.customer),
  ].filter((id): id is string => typeof id === "string" && id.length > 0);
}

export function sessionBelongsToUser(session: OwnableSession, userId: string): boolean {
  if (!userId) return false;
  return sessionOwnerIds(session).includes(userId);
}
