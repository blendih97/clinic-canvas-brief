import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { saveEnquiryAndNotify, type EnquiryClient } from "../../supabase/functions/_shared/enquiries";

function makeClient(opts: { insertError?: string; emailThrows?: boolean } = {}) {
  const inserts: Record<string, any[]> = {};
  const client: EnquiryClient = {
    from: (table: string) => ({
      insert: async (row: unknown) => {
        (inserts[table] ||= []).push(row);
        if (table === "clinic_enquiries" && opts.insertError) {
          return { error: { message: opts.insertError } };
        }
        return { error: null };
      },
    }),
    functions: {
      invoke: async () => {
        if (opts.emailThrows) return { error: { message: "smtp down" } };
        return { error: null };
      },
    },
  };
  return { client, inserts };
}

const input = {
  name: "Dr Aisha Patel",
  email: "aisha@exampleclinic.com",
  organisation: "Mayfair Private Clinic",
  website: "https://example.com",
  country: "United Arab Emirates",
  organisation_type: "Medical concierge",
  patients_per_month: "11-30",
  languages_handled: "Arabic, French",
  current_problem: "Records arrive late and untranslated.",
  preferred_next_step: "Apply for a founding pilot",
  consent_at: "2026-09-14T10:00:00.000Z",
  source_page: "for-concierges",
  origin: "for-concierges",
};

describe("partner enquiry pipeline", () => {
  it("supports the concierge pilot demand-test fields and origin", async () => {
    const page = readFileSync(resolve("src/pages/ForConciergesPage.tsx"), "utf8");
    const form = readFileSync(resolve("src/components/marketing/ConciergePilotForm.tsx"), "utf8");
    const handler = readFileSync(resolve("supabase/functions/submit-clinic-enquiry/index.ts"), "utf8");

    expect(page).toContain("Every result you arrange, in your client's hands — organised.");
    expect(page).toContain("FAQPage");
    expect(form).toContain('source_page: "for-concierges-pilot"');
    expect(form).toContain("Main countries your clients receive care in");
    expect(form).toContain("concierge_pilot_form_submitted");
    expect(form).toContain("within two working days");
    expect(handler).toContain('"for-concierges-pilot"');
  });

  it("persists every partner field on the enquiry row", async () => {
    const { client, inserts } = makeClient();
    const result = await saveEnquiryAndNotify(client, input);

    expect(result).toEqual({ saved: true, notified: true });
    const row = inserts["clinic_enquiries"][0];
    expect(row).toMatchObject({
      organisation_type: "Medical concierge",
      country: "United Arab Emirates",
      website: "https://example.com",
      languages_handled: "Arabic, French",
      preferred_next_step: "Apply for a founding pilot",
      source_page: "for-concierges",
      consent_at: "2026-09-14T10:00:00.000Z",
    });
  });

  it("still reports success when the admin notification fails, and audits it", async () => {
    const { client, inserts } = makeClient({ emailThrows: true });
    const result = await saveEnquiryAndNotify(client, input);

    expect(result.saved).toBe(true);
    expect(result.notified).toBe(false);
    expect(inserts["platform_events"][0]).toMatchObject({ event_type: "enquiry_notification_failed" });
  });

  it("never audits the free-text problem statement", async () => {
    const { client, inserts } = makeClient({ emailThrows: true });
    await saveEnquiryAndNotify(client, input);
    const audited = JSON.stringify(inserts["platform_events"][0]);
    expect(audited).not.toContain("Records arrive late");
  });

  it("reports failure when the row cannot be saved", async () => {
    const { client } = makeClient({ insertError: "permission denied" });
    const result = await saveEnquiryAndNotify(client, input);
    expect(result).toEqual({ saved: false, notified: false, error: "permission denied" });
  });
});
