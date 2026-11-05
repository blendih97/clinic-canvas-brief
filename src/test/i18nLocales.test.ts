import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { baseDictionary, loadLocale, translate, locales, isRtlLocale } from "@/lib/i18n";

const flat = (d: Record<string, unknown>, p = ""): Record<string, string> =>
  Object.entries(d).reduce((o, [k, v]) => (typeof v === "string" ? { ...o, [p + k]: v } : { ...o, ...flat(v as Record<string, unknown>, `${p}${k}.`) }), {});

describe("interface languages", () => {
  const en = flat(baseDictionary.en as Record<string, unknown>);
  it("offers every RinVita language, each with an interface file or a built-in dictionary", () => {
    const files = readdirSync("src/locales").map((f) => f.replace(".json", ""));
    for (const code of locales) expect(code === "en" || code === "ar" || files.includes(code)).toBe(true);
  });
  it("every language file keeps placeholders and only known keys", () => {
    for (const f of readdirSync("src/locales")) {
      const d = JSON.parse(readFileSync(`src/locales/${f}`, "utf8")) as Record<string, string>;
      for (const [k, v] of Object.entries(d)) {
        expect(en[k], `${f} ${k}`).toBeDefined();
        expect((v.match(/\{\{\w+\}\}/g) || []).sort()).toEqual((en[k].match(/\{\{\w+\}\}/g) || []).sort());
      }
    }
  });
  it("Arabic covers the sign-up page", () => {
    expect(translate("ar", "signupPage.freePlan")).toBe("الخطة المجانية");
  });
  it("loads a language on demand and falls back to English for anything missing", async () => {
    await loadLocale("fr");
    expect(translate("fr", "auth.modes.signUp")).toBe("S'inscrire");
    expect(translate("fr", "no.such.key")).toBe("no.such.key");
    expect(isRtlLocale("he")).toBe(true);
  });
});
