import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { DEMO_CASES, caseStats, needsAction, dueLabel, DEMO_BRANDS } from "@/lib/partnerAdminDemo";

const page = readFileSync("src/pages/PartnerAdminDemoPage.tsx", "utf8");

describe("/demo/partner-admin", () => {
  it("is routed, rendered standalone and kept out of search", () => {
    expect(readFileSync("src/App.tsx", "utf8")).toContain('path="/demo/partner-admin"');
    expect(readFileSync("src/main.tsx", "utf8")).toContain('"/demo/partner-admin"');
    expect(readFileSync("public/robots.txt", "utf8")).toContain("Disallow: /demo/");
    expect(page).toContain("noindex");
  });

  it("never reaches live services", () => {
    for (const src of [page, readFileSync("src/lib/partnerAdminDemo.ts", "utf8")]) {
      expect(src).not.toMatch(/supabase|analytics|fetch\(|functions\.invoke/);
    }
  });

  it("only uses logos hosted with the site", () => {
    for (const b of Object.values(DEMO_BRANDS)) expect(b.logo).toMatch(/^\/partners\/[a-z0-9]+\.png$/);
  });
});

describe("partner admin demo data", () => {
  it("counts patients by sign-up and stage", () => {
    expect(caseStats(DEMO_CASES)).toEqual({ invited: 7, joined: 5, active: 4, booked: 3 });
  });

  it("lists due next steps, most overdue first", () => {
    const due = needsAction(DEMO_CASES);
    expect(due.map((c) => c.id)).toEqual(["c2", "c1"]);
    expect(dueLabel(-1)).toBe("Overdue by 1 day");
    expect(dueLabel(0)).toBe("Due today");
  });
});
