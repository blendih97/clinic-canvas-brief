# Project rules

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
