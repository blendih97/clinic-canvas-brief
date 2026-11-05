# Project rules

- Partner pilot release candidates stay in `supabase/pilot-staging` until isolated validation and explicit shared-backend release gates pass, because normal edge-function edits deploy automatically.
- Published medical sharing uses the deployed token-only get-shared-brief contract; recipient-claim safety remains staged and must not be assumed by frontend releases.
- Published sponsorship follows deployed profile complimentary fields and existing RPCs; independent partner entitlement semantics remain staged until separately released.
- Onboarding funnel writes validated dimensions into daily aggregate counters via a restricted RPC; admin-only reads keep identities and clinical data out of this reporting.
- Consumer plan intent is auth metadata, never an access grant; payment reminders defer to verified subscription access and reuse existing checkout.
- Upload persistence completes before extraction review, with a stable document ID; closing review cannot discard the record or break visit linkage.

- The partner portal demo uses its own local synthetic data/PDF module and accessible dialog; its standalone app shell excludes auth, attribution and tracking effects so demo interactions never reach live services.

- Growth previews read only a restricted public RPC from vetted, published, unsuppressed prospects; deterministic segment templates and the shared fictional dataset prevent invented facts or clinical access.
- Growth applications use validated RPC submissions and admin-only review with identity and signed-terms evidence; approval never provisions sponsorship or invokes billing.
- Growth preview analytics store daily aggregate counts only, excluding these pages from session tracking and marketing pixels to prevent prospect profiling.

- Keep homepage medical-record previews local to the homepage and grounded in the shared fictional sample dataset; this preserves other pages and avoids inventing clinical information.
- Supply page-specific partner pilot copy through optional PartnerPage configuration overrides; this keeps the offer consistent within a page without changing other partners' copy.- Partner orgs, members and patient links live in their own partner_* tables (never app_role); partners never get policies on clinical tables, and all writes go through the partner-manage / partner-claim functions; this keeps patient records private to patients.
- Partner attribution is captured from ?partner/?invite/?staff into localStorage plus signup metadata and claimed once after sign-in by a global claimer; this survives email confirmation and OAuth redirects.
- Partner-table isolation is verified by supabase/tests/partner_rls_test.sql (run via SQL; it rolls itself back and reports PASS/FAIL).
- Claim success refreshes the auth profile and query caches; subscription hooks refetch on complimentary-field changes so all mounted access checks update together.
- Subscription views share SponsorshipNotice and formatSponsorshipDate; server-side partner_sponsorship_expiry handles calendar-to-instant conversion to avoid inconsistent expiry displays.
- Lab results always show a range: the lab-printed range wins; otherwise a typical UK adult range from the vetted, sourced table in src/lib/referenceRanges.ts (same unit only, mirrored in supabase/functions/_shared). The AI never supplies ranges; status is always the lab's flag.
- Billing and Family are self-pay only: hidden for patients with an active partner sponsorship. The Imaging section stays hidden until the scan viewer is released; imaging reports live in Documents.
- Share Brief documents: shared_briefs.documents holds ids + RinVita's text only (never storage paths). get-shared-brief issues a 120-second file URL per request, only for a valid brief, a document the patient marked fileShared, owned by the brief's owner.
- Stored/pending/failed documents are analysed server-side by retry-document from the saved original (file_path, or a legacy file_url inside the owner's folder); re-analysis of an already-counted document skips the free quota.
- The Full Health Brief (Export) and Documents "Download all" use src/lib/healthBrief.ts: render-export-pdf v2 renders the brief in the share-page design plus one divider page per document (newest first), then pdf-lib (src/lib/briefMerge.ts) inserts each original after its divider and stamps page numbers. Dividers must stay exactly one page. The doctor page "Download all" still uses src/lib/combinedPdf.ts.
- Records requests carry the patient's account email and a typed-name signed consent; a DB trigger sets patient_email from the JWT and consent_signed_at from the server, and locks consent fields on update. The upload page shows it and offers a signed consent PDF (src/lib/recordConsent.ts).
- Emailing a Share Brief goes only through send-share-brief: owner-only, valid briefs only, link built server-side (no caller-supplied URLs), link not attachments, 10 per hour per patient, audited with recipient domain only. The share-brief template is not callable from browsers.
- Partner staff use /partner, not the patient app: members with no records of their own are always redirected from /app; members who are also patients land on /partner after sign-in and open their records via "My records" (?records=1, remembered for the session).
- Partner orgs can carry a tagline and staff_full_access. With staff_full_access, active staff get the org's sponsored plan until sponsor_until (set in partner_claim) and get_my_partner_sponsorship returns a kind='partner_staff' row, so they are dual-role (land on /partner, "My records" opens their own vault). Partner logos are hosted in public/partners/.
