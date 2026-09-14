// Single enquiry pipeline shared by /for-clinics, /for-concierges, /clinics and /partners.
// Persistence first, notification second: a failed notification must never
// lose the lead, but it must be auditable so admins can follow up.

export interface EnquiryInput {
  name: string;
  email: string;
  organisation?: string | null;
  website?: string | null;
  country?: string | null;
  organisation_type?: string | null;
  role?: string | null;
  patients_per_month?: string | null;
  languages_handled?: string | null;
  current_problem?: string | null;
  preferred_next_step?: string | null;
  message?: string | null;
  consent_at?: string | null;
  source_page?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  origin?: string;
}

export interface EnquiryResult {
  saved: boolean;
  notified: boolean;
  error?: string;
}

const ADMIN_RECIPIENT = "hello@rinvita.com";

/** Minimal structural type — keeps this module importable outside Deno. */
export interface EnquiryClient {
  from: (table: string) => { insert: (row: unknown) => Promise<{ error: { message: string } | null }> };
  functions: { invoke: (name: string, args: unknown) => Promise<{ error: unknown }> };
}

export async function saveEnquiryAndNotify(
  admin: EnquiryClient,
  input: EnquiryInput,
): Promise<EnquiryResult> {
  const { error } = await admin.from("clinic_enquiries").insert({
    name: input.name,
    email: input.email,
    organisation: input.organisation ?? null,
    website: input.website ?? null,
    country: input.country ?? null,
    organisation_type: input.organisation_type ?? null,
    role: input.role ?? null,
    patients_per_month: input.patients_per_month ?? null,
    languages_handled: input.languages_handled ?? null,
    current_problem: input.current_problem ?? null,
    preferred_next_step: input.preferred_next_step ?? null,
    message: input.message ?? null,
    consent_at: input.consent_at ?? null,
    source_page: input.source_page ?? input.origin ?? null,
    utm_source: input.utm_source ?? null,
    utm_medium: input.utm_medium ?? null,
    utm_campaign: input.utm_campaign ?? null,
  });

  if (error) return { saved: false, notified: false, error: error.message };

  let notified = false;
  try {
    const { error: emailError } = await admin.functions.invoke("send-transactional-email", {
      body: {
        templateName: "clinic-enquiry-admin",
        recipientEmail: ADMIN_RECIPIENT,
        templateData: {
          name: input.name,
          email: input.email,
          organisation: input.organisation ?? null,
          website: input.website ?? null,
          country: input.country ?? null,
          organisationType: input.organisation_type ?? null,
          role: input.role ?? null,
          patientsPerMonth: input.patients_per_month ?? null,
          languagesHandled: input.languages_handled ?? null,
          currentProblem: input.current_problem ?? null,
          preferredNextStep: input.preferred_next_step ?? null,
          sourcePage: input.source_page ?? input.origin ?? null,
          message: input.message ?? null,
          submittedAt: new Date().toISOString(),
        },
      },
    });
    if (emailError) throw emailError;
    notified = true;
  } catch (emailErr) {
    console.error("enquiry notification failed", emailErr);
    try {
      await admin.from("platform_events").insert({
        event_type: "enquiry_notification_failed",
        details_json: {
          email: input.email,
          origin: input.origin ?? input.source_page ?? "unknown",
          error: String(emailErr),
        },
      });
    } catch (_e) { /* auditing must never fail the enquiry */ }
  }

  return { saved: true, notified };
}
