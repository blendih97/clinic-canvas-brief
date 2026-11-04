import { describe, it, expect } from "vitest";
import { SHARE_GATE_LANGUAGES, findShareGateLanguage } from "@/components/share/shareGateText";

describe("share gate notice", () => {
  const keys = Object.keys(SHARE_GATE_LANGUAGES[0].text);
  it("every language has every line, filled in", () => {
    for (const l of SHARE_GATE_LANGUAGES) {
      expect(Object.keys(l.text).sort()).toEqual([...keys].sort());
      for (const k of keys) expect((l.text as any)[k].trim().length, `${l.code}.${k}`).toBeGreaterThan(0);
    }
  });
  it("names no single country's law, so it reads correctly anywhere", () => {
    for (const l of SHARE_GATE_LANGUAGES) expect(JSON.stringify(l.text)).not.toMatch(/GDPR|HIPAA|PDPA/i);
  });
  it("matches browser language tags to a language", () => {
    expect(findShareGateLanguage("th-TH")?.code).toBe("th");
    expect(findShareGateLanguage("pt_BR")?.code).toBe("pt");
    expect(findShareGateLanguage("xx")).toBeUndefined();
  });
  it("arabic is right to left", () => {
    expect(findShareGateLanguage("ar")?.dir).toBe("rtl");
  });
});
