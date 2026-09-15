import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(p), "utf8");

const app = read("src/App.tsx");
const sitemap = read("public/sitemap.xml");
const llms = read("public/llms.txt");
const prerender = read("scripts/prerender.mjs");
const languages = read("src/data/translateLanguages.ts");
const tool = read("src/components/marketing/TranslatorTool.tsx");
const langPage = read("src/pages/TranslateLanguagePage.tsx");
const translateIndex = read("src/pages/TranslateToolPage.tsx");
const shareView = read("src/pages/ShareView.tsx");
const translateFn = read("supabase/functions/public-translate-document/index.ts");

const SLUGS = [
  "polish", "romanian", "spanish", "portuguese", "italian", "french",
  "german", "dutch", "greek", "turkish", "russian", "arabic", "chinese",
];

describe("translator language landing pages", () => {
  it("declares all thirteen languages", () => {
    for (const slug of SLUGS) expect(languages).toContain(`slug: "${slug}"`);
  });

  it("registers the language route", () => {
    expect(app).toContain('path="/translate/:slug"');
    expect(app).toContain("TranslateLanguagePage");
  });

  it("lists every language URL in the sitemap", () => {
    for (const slug of SLUGS) {
      expect(sitemap).toContain(`https://rinvita.co.uk/translate/${slug}-medical-records-to-english`);
    }
  });

  it("lists every language page in llms.txt", () => {
    for (const slug of SLUGS) {
      expect(llms).toContain(`/translate/${slug}-medical-records-to-english`);
    }
    for (const page of [
      "/medical-passport",
      "/medical-records-for-expats",
      "/organise-medical-records-for-family",
      "/medical-records-for-overseas-treatment",
    ]) {
      expect(llms).toContain(page);
    }
  });

  it("uses the exact supplied glossary terms", () => {
    expect(languages).toContain("karta informacyjna leczenia szpitalnego / wypis");
    expect(languages).toContain("bilet de externare");
    expect(languages).toContain("laudo (Brazil) / relatório (Portugal)");
    expect(languages).toContain("Entlassungsbrief / Arztbrief");
    expect(languages).toContain("γλυκοζυλιωμένη αιμοσφαιρίνη");
    expect(languages).toContain("выписной эпикриз / выписка");
    expect(languages).toContain("بطاقة التطعيم");
    expect(languages).toContain("预防接种证");
  });

  it("gives every language exactly twelve glossary rows", () => {
    const blocks = languages.split("glossary: [").slice(1);
    expect(blocks).toHaveLength(13);
    for (const block of blocks) {
      const rows = block.split("},").filter((r) => r.includes("term:"));
      expect(rows).toHaveLength(12);
    }
  });

  it("renders the orientation disclaimer and certified-translation limit", () => {
    expect(langPage).toContain("For orientation only — always confirm with a clinician.");
    expect(langPage).toContain("not a certified translation");
    expect(langPage).toContain("FAQPage");
  });

  it("links language pages from /translate and to each other", () => {
    expect(translateIndex).toContain("TRANSLATE_LANGUAGES.map");
    expect(langPage).toContain("Other language pages");
  });

  it("defaults the embedded tool to English and reuses one component", () => {
    expect(langPage).toContain('defaultTargetLanguage="en"');
    expect(translateIndex).toContain("TranslatorTool");
    expect(tool).toContain("public-translate-document");
  });

  it("positions translation as part of the wider RinVita medical hub", () => {
    const hubCopy = read("src/components/marketing/TranslatorHubCopy.tsx");
    expect(hubCopy).toContain("Part of RinVita — the private hub for your whole medical history");
    expect(hubCopy).toContain("Don't let this record get lost again");
    expect(hubCopy).toContain("Start your medical hub — free");
    expect(hubCopy).toContain("What your RinVita hub does");
    expect(hubCopy).toContain("Time-limited sharing with any clinician");
    expect(translateIndex).toContain("TranslatorHubPositioning");
    expect(translateIndex).toContain("TranslatorHubCta");
    expect(translateIndex).toContain("TranslatorHubStrip");
    expect(langPage).toContain("TranslatorHubPositioning");
    expect(langPage).toContain("TranslatorHubCta");
    expect(langPage).toContain("TranslatorHubStrip");
    expect(tool).toContain("Your translation is ready. Now keep it.");
  });

  it("describes RinVita as a medical records hub before translation", () => {
    expect(llms).toContain("RinVita is a private medical records hub for internationally mobile people and families");
    expect(llms).toContain("AI translation as one feature");
  });
});

describe("translator acquisition + measurement", () => {
  it("shows the save-to-passport card with the signup source", () => {
    expect(tool).toContain("Save this translation to your free medical passport");
    expect(tool).toContain("/auth?mode=signup&from=translate");
    expect(tool).toContain("Free plan · 3 documents · no card required.");
  });

  it("sends landing path and campaign tags but no personal content", () => {
    expect(tool).toContain("landingPath");
    expect(tool).toContain("utmSource");
    expect(translateFn).toContain("translate_tool_events");
    expect(translateFn).not.toMatch(/translate_tool_events[\s\S]{0,400}base64/);
    expect(translateFn).not.toMatch(/translate_tool_events[\s\S]{0,400}email/);
  });
});

describe("share brief recruitment footer", () => {
  it("adds the discreet RinVita footer link", () => {
    expect(shareView).toContain("This brief was created with RinVita");
    expect(shareView).toContain("utm_source=share_brief&utm_medium=product&utm_campaign=viral");
  });
});

describe("prerendering", () => {
  it("covers every public route", () => {
    for (const route of [
      '"/"',
      '"/medical-passport"',
      '"/translate"',
      '"/medical-records-for-expats"',
      '"/organise-medical-records-for-family"',
      '"/medical-records-for-overseas-treatment"',
      '"/for-clinics"',
      '"/for-concierges"',
      '"/demo"',
      '"/security"',
      '"/privacy"',
      '"/terms"',
    ]) {
      expect(prerender).toContain(route);
    }
    for (const slug of SLUGS) expect(prerender).toContain(`"${slug}"`);
  });

  it("is wired into the production build", () => {
    const pkg = JSON.parse(read("package.json"));
    expect(pkg.scripts.build).toContain("scripts/prerender.mjs");
    expect(pkg.scripts.build).toContain("--ssr src/entry-server.tsx");
  });
});

describe("language count claim", () => {
  it("says 45+ languages, never 50+", () => {
    for (const file of [
      "index.html",
      "src/pages/MarketingLandingPage.tsx",
      "src/pages/TranslateToolPage.tsx",
      "src/pages/ClinicsPartnersPage.tsx",
    ]) {
      expect(read(file)).not.toContain("50+");
    }
  });
});
