# Signup release, 2 November 2026

## Exact compatibility restores

The following ten files were restored byte-for-byte from compatible pre-remediation snapshot `8b09d2ffb4546dfe3a759e96d21ae80cd1d6e8a1`. Git establishes the source snapshot, not a verified published deployment SHA.

1. `src/pages/ShareView.tsx`: token-only request, no protocol/recipient secret requirement, prior acceptance logging and recipient lifecycle.
2. `src/hooks/useSponsorship.ts`: prior sponsorship RPC refresh behavior.
3. `src/hooks/useSubscription.ts`: prior refresh effect and existing realtime updates.
4. `src/components/SponsorshipNotice.tsx`: profile complimentary gating and expiry display.
5. `src/components/sections/BillingSection.tsx`: profile-based complimentary billing visibility.
6. `src/pages/SettingsPage.tsx`: profile-based complimentary settings visibility.
7. `src/components/sections/FamilySection.tsx`: removed remediation-only partner-pilot Family exclusion; original access checks unchanged.
8. `src/pages/partner/PartnerRoute.tsx`: prior organisation lookup and refresh behavior.
9. `src/pages/admin/AdminPartnersPage.tsx`: occupied seats include patient-linked rows as deployed backend does.
10. `src/pages/partner/PartnerPortalPage.tsx`: prior joined-at occupied-seat counting.

Kept additive partner error-status handling, which works with existing responses. Kept explicit DICOM unsupported copy, which adds no backend dependency. Kept signed-in checkout intent, which uses the existing checkout contract. Unused recipient helper and staged tests do not form part of the published sharing flow.

No staged SQL/function file or deployed edge-function source was modified or deployed. No frontend requires staged consume/revalidate or staff-mutation RPCs. Hosted PDF, staff audit and account deletion behavior remains deployed behavior. Public marketing and partner-demo unchanged.

Compatibility restoration does not release the safety remediation or make real sharing single-use. Known reusable-link and open-recipient limitations remain. No pilot GO is implied.

## Onboarding improvements

- Inline signup feedback stays visible until email/password editing. Errors preserve server codes; breached-password/rate-limit errors mapped. Minimum eight characters, Strong only at ten with mixed upper/lowercase, numbers and symbols.
- Standard £149/year and Family £249/year signup copy, no free-plan list for selected paid plans. Auth metadata stores validated `plan_intent` for cross-device confirmation. Dashboard offers explicit existing checkout with dismiss control. Active access suppresses payment reminder; verified active/trialing direct subscription clears intention.
- Successful extraction automatically stores original, document and structured results before review. Stable document IDs link visits correctly. Review closing keeps saved records; removal asks confirmation. Closing during processing is blocked and page departure warns while saving.
- Zero-document overview has one first-record card and one Upload action; profile/upgrade banners and duplicate overview actions hidden.
- Eight allowlisted daily funnel events stored in `onboarding_funnel_daily` with plan and error-code dimensions only. No email, name, user/session identifier, IP or clinical payload. Admin dashboard shows seven UTC days, by plan. Counters are indicative anonymous event counts, not deduplicated people or financial truth.
- Additive onboarding migrations only, unrelated to held pilot migrations; explicit RLS/admin read and validated anonymous increment RPC.

## Validation

- Full suite: 110 PASS, two pre-existing translator wording failures in `growthSeo.test.ts`; public translator content intentionally unchanged.
- Focused rules, auto-save, confirmed removal and subscription refresh: 11 PASS.
- Automatic typecheck and preview build: build OK after edits.
- Intercepted browser checks: Family signup copy/metadata, short and breached passwords, inline persistence/edit clearing, mobile fit, legacy token-only response rendering, signed-in metadata payment banner, empty dashboard, auto-save, close and readback. Synthetic service responses only, no real signup, emails, payment or medical writes. Preview browser reads required local fetch emulation, so hosted persistence/onboarding is not claimed tested.
- Fresh backend security scan: eight warnings and two informational findings, no critical findings in that scan; existing warnings not modified.
- Direct payment completion, cross-device confirmation email delivery, hosted first-login counts and hosted admin funnel UI remain unverified to avoid real emails/charges/customer changes.

Publishing status: request follows final validation; deployment completion is not yet verified.