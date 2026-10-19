import { z } from "zod";

export const segments = ["clinic", "concierge", "family-office", "international"] as const;
export const prospectStatuses = ["draft", "ready", "contacted", "responded", "application", "approved", "declined", "archived"] as const;
export const agreementStatuses = ["not_started", "discussing", "sent", "signed", "declined"] as const;
export const safeSource = z.string().url().max(1000).refine(value => new URL(value).protocol === "https:", "Use an https source URL");
const short = z.string().trim().min(1).max(200);
const email = z.string().trim().email().max(255);
export const applicationSchema = z.object({ company: short, work_email: email, name: short, role: short, express_agreement: z.literal(true, { errorMap: () => ({ message: "Please agree to the trial application conditions." }) }) });
export const prospectSchema = z.object({
  organisation: short, slug: z.string().max(100).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/), segment: z.enum(segments),
  factual_context: z.string().trim().max(2000), source_urls: z.array(safeSource).max(20), contact_name: z.string().trim().max(200),
  email: z.union([email, z.literal("")]), claim_verification_state: z.enum(["unverified", "vetted"]), status: z.enum(prospectStatuses),
  partner_type: z.enum(["clinic", "concierge", "other"]), published: z.boolean(), suppressed: z.boolean(),
  suppression_reason: z.string().max(1000), notes: z.string().max(5000),
}).superRefine((p, ctx) => {
  if (p.published && (p.claim_verification_state !== "vetted" || !p.factual_context.trim() || !p.source_urls.length || p.suppressed || p.status === "archived")) ctx.addIssue({ code: "custom", message: "A preview needs vetted context and sources, and must not be suppressed or archived." });
});
export const distributionSchema = z.object({ organisation: short, contact_name: z.string().trim().max(200), email: z.union([email, z.literal("")]), network_size_evidence: z.string().max(2000), source_urls: z.array(safeSource).max(20), opportunity: z.string().max(2000), follow_up: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]), agreement_status: z.enum(agreementStatuses), suppressed: z.boolean(), notes: z.string().max(5000) });
export type ProspectInput = Required<z.infer<typeof prospectSchema>>;
export type Prospect = ProspectInput & { id: string; created_at: string; updated_at: string };
export type Preview = Pick<Prospect, "id" | "organisation" | "slug" | "segment" | "factual_context" | "source_urls" | "partner_type">;
export type Distribution = Required<z.infer<typeof distributionSchema>> & { id: string; created_at: string };
export type Application = Required<z.infer<typeof applicationSchema>> & { id: string; prospect_id: string; status: string; identity_verified: boolean; identity_evidence: string; signed_terms_confirmed: boolean; terms_reference: string; decision_note: string; created_at: string };

export const segmentCopy = {
  clinic: { audience: "patients", heading: "A patient-owned record beyond the consultation.", supporting: "A proposed way to sponsor patient access after an assessment or consultation, keeping records with the patient between providers.", link: "/for-clinics" },
  concierge: { audience: "clients", heading: "Continuity of care, wherever your clients go.", supporting: "A proposed way to sponsor a private medical-record workspace for clients who see different doctors, at home or abroad.", link: "/for-concierges" },
  "family-office": { audience: "families", heading: "Private records for each family member.", supporting: "A proposed sponsorship programme for families, with each person retaining control of their own medical records.", link: "/for-concierges" },
  international: { audience: "clients", heading: "One personal record across borders.", supporting: "A proposed sponsorship programme for clients receiving care internationally, with translation supporting their own record sharing.", link: "/for-concierges" },
} as const;

export function canApproveApplication(identityVerified: boolean, identityEvidence: string, signedTerms: boolean, termsReference: string) {
  return identityVerified && identityEvidence.trim().length > 0 && signedTerms && termsReference.trim().length > 0;
}
export function canPublishProspect(p: ProspectInput) { return prospectSchema.safeParse({ ...p, published: true }).success; }
export function outreachDraft(p: ProspectInput, origin = "https://rinvita.co.uk") {
  if (p.suppressed || p.claim_verification_state !== "vetted" || !p.published || !canPublishProspect(p)) return "";
  const firstName = p.contact_name.trim().split(/\s+/)[0];
  return `Subject: A proposed patient-record partnership for ${p.organisation}\n\n${firstName ? `Hi ${firstName},` : "Hello,"}\n\nYour public website describes the following: ${p.factual_context}\n\nI’m Arla, Co-Founder of RinVita. We’ve prepared a proposed demonstration for ${p.organisation} using only fictional patient records. This is not an endorsed partnership.\n\n${origin}/preview/${p.slug}\n\nPartners can sponsor access and invite ${segmentCopy[p.segment].audience}. Patients store, review and share their own records with any doctor by one-time link or PDF, and can request records from any provider via a secure upload link. Partners never see medical records. There is no direct EHR integration or automatic record ingestion.\n\nFree 14-day trial — invite as many patients as you like. Pricing is agreed before the trial starts; identity verification and signed commercial terms are required. If you continue, your plan begins on day 15; if not, patients keep their accounts on the free plan.\n\nWould this be relevant to your team?\n\nArla\nCo-Founder RinVita\ninfo@rinvita.co.uk`;
}
export function csvCell(value: unknown) {
  const text = String(value ?? "");
  const safe = /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}
export function makeCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [headers.map(csvCell).join(","), ...rows.map(row => headers.map(key => csvCell(Array.isArray(row[key]) ? (row[key] as unknown[]).join("; ") : row[key])).join(","))].join("\r\n");
}
export function downloadText(filename: string, text: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}
export const splitSources = (value: string) => value.split(/\n/).map(s => s.trim()).filter(Boolean);