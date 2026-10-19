import { describe, it, expect, beforeEach } from "vitest";
import { partnerAuthParams } from "@/lib/partners";

const TOKEN = "a".repeat(64);

describe("partnerAuthParams", () => {
  beforeEach(() => localStorage.clear());

  it("keeps partner, invite, staff and next when switching to sign-in", () => {
    const q = new URLSearchParams(`partner=harbourview-test&invite=${TOKEN}&staff=1&next=/partner&email=x@y.com`);
    const out = new URLSearchParams(partnerAuthParams(q, { mode: "signin" }));
    expect(out.get("partner")).toBe("harbourview-test");
    expect(out.get("invite")).toBe(TOKEN);
    expect(out.get("staff")).toBe("1");
    expect(out.get("next")).toBe("/partner");
    expect(out.get("mode")).toBe("signin");
    expect(out.get("email")).toBeNull();
  });

  it("drops off-site next paths", () => {
    const out = new URLSearchParams(partnerAuthParams("next=//evil.com"));
    expect(out.get("next")).toBeNull();
  });
});
