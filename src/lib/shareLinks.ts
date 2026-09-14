// Privacy-safe sharing hooks.
//
// The share payload is a fixed marketing sentence plus a public RinVita URL.
// It NEVER contains health data, document names, extracted content, account
// identifiers or anything derived from a user's records.

export const SITE_URL = "https://rinvita.co.uk";

export const SHARE_MESSAGE = "Keep your medical history ready when care crosses borders.";

export type ShareChannel = "whatsapp" | "email" | "copy";

export interface ShareTarget {
  /** Public URL to share. Must be a public marketing route. */
  url?: string;
  /** Fixed, non-personal message. */
  message?: string;
}

export function buildShareText({ url = SITE_URL, message = SHARE_MESSAGE }: ShareTarget = {}): string {
  return `${message} ${url}`;
}

export function buildWhatsAppLink(target: ShareTarget = {}): string {
  return `https://wa.me/?text=${encodeURIComponent(buildShareText(target))}`;
}

export function buildEmailLink(target: ShareTarget = {}): string {
  const subject = "RinVita — your medical history, wherever you are treated";
  const body = `${target.message ?? SHARE_MESSAGE}\n\n${target.url ?? SITE_URL}`;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Guard used by tests: the share payload must never carry record content. */
export function shareLinkIsSafe(link: string): boolean {
  const forbidden = ["document", "patient", "diagnos", "medication", "token", "record_id", "user_id"];
  const lower = link.toLowerCase();
  return !forbidden.some((word) => lower.includes(word));
}
