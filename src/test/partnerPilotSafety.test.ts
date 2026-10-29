import { describe, expect, it } from "vitest";
import { allergySummaryText } from "../../supabase/functions/_shared/clinicalPdfText";
import { hasAuthIntent } from "@/lib/authIntent";
import { shareExpiryDelay, SHARE_REVALIDATE_MS } from "@/lib/shareRecipient";

describe("partner pilot safety rules", () => {
  it("preserves a documented allergy reaction in full clinical PDF text", () => {
    expect(allergySummaryText({ substance: "Penicillin", severity: "moderate", reaction: "rash" })).toBe("Penicillin · (moderate) · rash");
  });
  it("does not invent a reaction when none is recorded", () => {
    expect(allergySummaryText({ substance: "Penicillin" })).toBe("Penicillin");
  });
  it("keeps signed-in Standard checkout intent on the authentication page", () => {
    expect(hasAuthIntent("?plan=standard")).toBe(true);
    expect(hasAuthIntent("?plan=family")).toBe(true);
    expect(hasAuthIntent("?plan=invalid")).toBe(false);
  });
  it("keeps staff acceptance intent without permitting an external redirect", () => {
    expect(hasAuthIntent("?staff=1&next=/partner")).toBe(true);
    expect(hasAuthIntent("?next=//attacker.invalid")).toBe(false);
  });
  it("aligns expiry with its instant, not a minute polling interval", () => {
    expect(shareExpiryDelay("2026-10-29T17:00:12Z", Date.parse("2026-10-29T17:00:00Z"))).toBe(12_000);
    expect(shareExpiryDelay("2026-10-29T17:00:00Z", Date.parse("2026-10-29T17:00:12Z"))).toBe(0);
    expect(shareExpiryDelay("invalid", 0)).toBe(0);
    expect(SHARE_REVALIDATE_MS).toBe(5_000);
  });
});