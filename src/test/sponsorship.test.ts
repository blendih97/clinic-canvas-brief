import { describe, expect, it, vi } from "vitest";
import { formatSponsorshipDate, hasComplimentaryAccess, refreshClaimAccess } from "@/lib/sponsorship";

describe("sponsorship access", () => {
  it("refreshes profile then caches after a first claim", async () => {
    const calls: string[] = [];
    await refreshClaimAccess("joined", async () => { calls.push("profile"); }, async () => { calls.push("cache"); });
    expect(calls).toEqual(["profile", "cache"]);
  });
  it("refreshes on an idempotent repeat claim", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    await refreshClaimAccess("already_joined", refresh, async () => {});
    expect(refresh).toHaveBeenCalledOnce();
  });
  it("does not refresh sponsorship on a full partner", async () => {
    const refresh = vi.fn();
    await refreshClaimAccess("seats_full", refresh, async () => {});
    expect(refresh).not.toHaveBeenCalled();
  });
  it("recognises active complimentary access and rejects expired access", () => {
    const profile = { comped_plan: "standard", comped_until: "2026-12-18T23:59:59.999999Z" };
    expect(hasComplimentaryAccess(profile, Date.parse("2026-12-18T23:59:59Z"))).toBe(true);
    expect(hasComplimentaryAccess(profile, Date.parse("2026-12-19T00:00:00Z"))).toBe(false);
    expect(hasComplimentaryAccess({ ...profile, comped_plan: null }, Date.parse("2026-12-18"))).toBe(false);
  });
  it("displays 18 December 2026 for both the partner date and patient expiry", () => {
    expect(formatSponsorshipDate("2026-12-18")).toBe("18 December 2026");
    expect(formatSponsorshipDate("2026-12-18T23:59:59.999999Z")).toBe("18 December 2026");
  });
  it("uses London time during summer and across DST boundaries", () => {
    expect(formatSponsorshipDate("2026-07-18T22:59:59.999999Z")).toBe("18 July 2026");
    expect(formatSponsorshipDate("2026-03-29T22:59:59.999999Z")).toBe("29 March 2026");
    expect(formatSponsorshipDate("2026-10-25T23:59:59.999999Z")).toBe("25 October 2026");
  });
});