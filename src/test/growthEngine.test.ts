import { describe, expect, it } from "vitest";
import { applicationSchema, canApproveApplication, canPublishProspect, csvCell, outreachDraft, prospectSchema, safeSource, type ProspectInput } from "@/lib/growth";
const prospect: ProspectInput = { organisation: "Fictional Practice", slug: "fictional-practice", segment: "clinic", factual_context: "A sourced private practice description.", source_urls: ["https://rinvita.co.uk/for-clinics"], contact_name: "Alex Taylor", email: "", claim_verification_state: "vetted", status: "ready", partner_type: "clinic", published: true, suppressed: false, suppression_reason: "", notes: "" };
describe("Growth Engine safeguards", () => {
  it("requires express agreement before accepting an application", () => {
    const application = { company: "Fictional Practice", work_email: "qa@rinvita.co.uk", name: "QA Applicant", role: "Owner", express_agreement: true };
    expect(applicationSchema.safeParse(application).success).toBe(true);
    expect(applicationSchema.safeParse({ ...application, express_agreement: false }).success).toBe(false);
  });
  it("requires identity verification with evidence before approval", () => {
    expect(canApproveApplication(false, "Checked identity", true, "Signed agreement")).toBe(false);
    expect(canApproveApplication(true, "", true, "Signed agreement")).toBe(false);
    expect(canApproveApplication(true, "Checked identity", true, "Signed agreement")).toBe(true);
  });
  it("requires signed commercial terms with reference before approval", () => {
    expect(canApproveApplication(true, "Checked identity", false, "Agreement")).toBe(false);
    expect(canApproveApplication(true, "Checked identity", true, " ")).toBe(false);
    expect(canApproveApplication(true, "Checked identity", true, "Signed agreement")).toBe(true);
  });
  it("publishes only vetted facts with sources", () => {
    expect(canPublishProspect(prospect)).toBe(true);
    expect(canPublishProspect({ ...prospect, claim_verification_state: "unverified" })).toBe(false);
    expect(canPublishProspect({ ...prospect, source_urls: [] })).toBe(false);
  });
  it("suppression disables preview generation and outreach", () => {
    expect(canPublishProspect({ ...prospect, suppressed: true })).toBe(false);
    expect(outreachDraft({ ...prospect, suppressed: true })).toBe("");
    expect(outreachDraft(prospect).length).toBeGreaterThan(0);
  });
  it("rejects unsafe source links and invalid slugs", () => {
    expect(safeSource.safeParse("javascript:alert(1)").success).toBe(false);
    expect(prospectSchema.safeParse({ ...prospect, slug: "../admin" }).success).toBe(false);
  });
  it("rejects malformed and overlong application fields", () => {
    const application = { company: "Practice", work_email: "not-an-email", name: "QA", role: "Owner", express_agreement: true };
    expect(applicationSchema.safeParse(application).success).toBe(false);
    expect(applicationSchema.safeParse({ ...application, work_email: "qa@rinvita.co.uk", company: "x".repeat(201) }).success).toBe(false);
  });
  it("neutralises spreadsheet formula injection in exports", () => {
    expect(csvCell("=SUM(1,2)")).toBe('"\'=SUM(1,2)"');
    expect(csvCell('A "quoted" name')).toBe('"A ""quoted"" name"');
  });
});