import { supabase } from "@/integrations/supabase/client";

export const SITE_URL = "https://rinvita.co.uk";
export const MAX_INVITES_PER_SUBMIT = 50;
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];

const SLUG_RE = /^[a-z0-9]([a-z0-9-]{0,58}[a-z0-9])?$/;
const TOKEN_RE = /^[a-f0-9]{64}$/;
const EMAIL_RE = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]{2,}$/;

/** Lowercase, ASCII-only, hyphen-separated, max 60 chars. */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

export const isValidSlug = (s: string) => SLUG_RE.test(s);
export const isValidToken = (s: string) => TOKEN_RE.test(s);

/** Split a pasted list on commas/semicolons/whitespace, lowercase, dedupe, validate. */
export function parseEmailList(raw: string): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const part of raw.split(/[\s,;]+/)) {
    const e = part.trim().toLowerCase();
    if (!e) continue;
    if (EMAIL_RE.test(e) && e.length <= 254) {
      if (!valid.includes(e)) valid.push(e);
    } else if (!invalid.includes(e)) invalid.push(e);
  }
  return { valid, invalid };
}

// ---- Pending attribution (survives email confirmation and OAuth redirects) ----
const KEY = "rinvita_partner_pending";
export interface PendingPartner { slug?: string; token?: string; staff?: boolean }

export function readPendingPartner(): PendingPartner | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null");
    return v && typeof v === "object" ? v : null;
  } catch { return null; }
}

export function savePendingPartner(p: PendingPartner) {
  const cur = readPendingPartner() || {};
  const next: PendingPartner = { ...cur };
  if (p.slug && isValidSlug(p.slug)) next.slug = p.slug;
  if (p.token && isValidToken(p.token)) next.token = p.token;
  if (p.staff) next.staff = true;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
}

export function clearPendingPartner() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

/** Read partner/invite/staff params from a URL query string into pending storage. */
export function capturePartnerParams(search: string) {
  const q = new URLSearchParams(search);
  const slug = (q.get("partner") || "").trim().toLowerCase();
  const token = (q.get("invite") || "").trim().toLowerCase();
  const staff = q.get("staff") === "1";
  if (slug || token || staff) savePendingPartner({ slug, token, staff });
}

export interface ClaimResult {
  status: "joined" | "already_joined" | "seats_full" | "partner_unavailable" | "invalid_invite" | "none";
  partner?: string;
  staff_joined?: number;
}

export async function claimPartner(p: PendingPartner): Promise<ClaimResult | null> {
  const { data, error } = await supabase.functions.invoke("partner-claim", {
    body: { slug: p.slug, token: p.token },
  });
  if (error) return null;
  return data as ClaimResult;
}

export const partnerLink = (slug: string) => `${SITE_URL}/p/${slug}`;
