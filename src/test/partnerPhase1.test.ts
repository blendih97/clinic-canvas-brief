import { describe, it, expect } from "vitest";
import { slugify, isValidSlug, parseEmailList, MAX_INVITES_PER_SUBMIT, LOGO_MAX_BYTES, LOGO_TYPES } from "@/lib/partners";

describe("partner slugs", () => {
  it("sanitises names into safe link names", () => {
    expect(slugify("Clinique Élysée & Co.")).toBe("clinique-elysee-co");
    expect(slugify("  --Dubai Health!!  ")).toBe("dubai-health");
    expect(isValidSlug(slugify("<script>alert(1)</script>"))).toBe(true);
    expect(slugify("<script>")).toBe("script");
  });
  it("rejects unsafe slugs", () => {
    expect(isValidSlug("../admin")).toBe(false);
    expect(isValidSlug("-bad")).toBe(false);
    expect(isValidSlug("Upper")).toBe(false);
    expect(isValidSlug("a".repeat(61))).toBe(false);
  });
});

describe("patient invite lists", () => {
  it("splits on commas and new lines, lowercases and dedupes", () => {
    const r = parseEmailList("A@x.com, b@y.co\na@x.com;  c@z.org");
    expect(r.valid).toEqual(["a@x.com", "b@y.co", "c@z.org"]);
    expect(r.invalid).toEqual([]);
  });
  it("flags invalid addresses", () => {
    expect(parseEmailList("nope, ok@x.com").invalid).toEqual(["nope"]);
  });
  it("caps a submit at 50 addresses", () => {
    expect(MAX_INVITES_PER_SUBMIT).toBe(50);
  });
});

describe("partner logo limits", () => {
  it("allows only PNG/JPG/WebP up to 2 MB", () => {
    expect(LOGO_MAX_BYTES).toBe(2 * 1024 * 1024);
    expect(LOGO_TYPES).not.toContain("image/svg+xml");
  });
});
