# Partner pilot remediation

Production website publishing is prohibited until the validation gates pass. Public marketing and the fictional partner demo remain unchanged.

## Intended semantics

- A real medical brief is claimable by one recipient session. Only a cryptographically random recipient secret can revalidate that session. The server stores its hash, never returns another session's clinical data, and checks expiry and revocation every time.
- The recipient screen clears records at expiry, on failed revalidation, and when hidden. Foreground revocation checks run every five seconds. Read, copied, photographed or downloaded information cannot be retracted.
- A supplied revoked or consumed partner invite never falls back to the public organisation link.
- Partner grants derive from joined links to active, unexpired organisations. Revoked links release seats. Suspension and expiry disable access but retain joined seats for reactivation. Public claims require an unexpired sponsorship date.
- Independently paid subscriptions and independently admin-granted complimentary access remain additive and are never deleted by partner changes.
- Legacy profile complimentary grants require explicit source attribution. Ambiguous historical grants must not be silently reclassified or erased.
- Account deletion removes only the requesting user's links, memberships, invitation identity and inviter identifiers. Audit retained after deletion contains aggregate counts, not personal identifiers or tokens.

## Validation gates

Database-backed tests of changed functions must run against an isolated database before any shared-backend migration. No live email sending, payment, TMCG organisation, or real patient data is permitted. Email confirmation, fresh extraction with failure alerts and provider invitation remain blocked unless a genuine isolated mail capture environment is available.

## Observed results, 29 October 2026

No shared-backend migration, existing edge-function replacement or website publish was performed. SQL and edge replacements are held in `supabase/pilot-staging` to prevent automatic production deployment. Changes in `src` affect the local preview only until publishing. The new recipient UI rejects the old endpoint's missing protocol version, so it must not be published before the SQL and endpoint replacements.

1. PASS, local SQL and browser: one-use medical brief. Twenty competing database claims produced exactly one winner. Two concurrent anonymous Chromium sessions produced one visible brief and one denied screen. The same recipient secret revalidated; another secret returned null. This is bearer-link access, not verification of clinician identity.
2. PASS, local browser: open-view revocation removed fictional clinical data within the five-second polling bound. Four-second natural expiry cleared the screen. Focus plus visibility-event bursts restored only a revalidated view. No browser runtime errors. Browser clocks/background scheduling and offline suspension still limit instantaneous enforcement. Read or downloaded information cannot be retracted.
3. PASS, local SQL: revoked token returned `invite_revoked` despite a valid public slug. Duplicate claim returned `already_joined`; another patient hit `seats_full`.
4. PASS, local SQL: active Family sponsorship granted Family tier; suspension, expired date and link revocation removed partner-derived access. Independent active subscription and independent admin comp each retained access. Revoked seat was reusable. Joined seats remain reserved during suspension/expiry. No subscription record was modified by partner operations. Null sponsorship dates fail closed. Read-only live aggregate preflight found zero linked profiles with legacy comp, but must be rerun at release time.
5. PARTIAL: scoped partner cleanup SQL removed the target patient's links/membership identity while retaining the other fictional patient's link. Full delete-account HTTP/storage/auth flow and failure retries were not rerun. Candidate checks resolved query errors, removes files before losing row inventory and preserves anonymised audit. Platform-admin deletion is explicitly blocked pending audit-retention review. Recursive orphan-storage verification and durable deletion workflow remain release gates.
6. PASS, local real renderer: six-page 25,751-byte clinical PDF contained fictional patient, Penicillin and `rash`. A unit test asserts the exact allergy text. Hosted PDF replacement remains unreleased.
7. PASS, local SQL: partner staff could not invoke staff-management RPC. Partner admin could save an invitation without sending mail; `partner_staff_invited` recorded the acting admin. Staff removal produced audit. Row mutation and audit insert are transactionally coupled. Live email delivery was not tested.
8. PASS, intercepted browser: synthetic signed-in `/auth?plan=standard` remained on the intended page and emitted exactly one `standard_annual` checkout request. Request was intercepted with a synthetic error; no checkout session or charge was created. This does not verify payment completion or hosted authentication.
9. SOURCE CHANGE, not full end-to-end: sponsored patients see Family record switching as unavailable in the partner pilot; DICOM rendering is explicitly unsupported while original downloads remain. No clinical RLS policy was weakened.
10. BLOCKED: hosted platform-admin create/update UI, actual new signup and cross-device confirmation, fresh AI extraction, provider invitation and PDF upload/notification, full hosted deletion. There is no isolated mail transport and no isolated hosted backend. Local schema was copied without records; no temporary production users or organisations were created this turn.

### Commands and artifacts

- `bunx vitest run`: 100 passed, 2 failed, 102 total. Both failures are pre-existing translator copy assertions in `src/test/growthSeo.test.ts`; marketing was not changed.
- Focused Vitest run covering pilot safety, sponsorship, partner phase 1, auth params and launch hardening: 43 passed.
- Focused ESLint on ShareView and new safety helpers/tests: passed.
- Local PostgreSQL 55432: applied candidate transaction; `supabase/tests/partner_pilot_safety_test.sql` returned `LOCAL_PARTNER_SAFETY_PASS`; existing cross-org test returned its expected rollback exception `PARTNER_RLS_PASS`.
- Python Chromium scripts in `/tmp/browser/pilot-fixes`: sharing concurrency/revoke/expiry/mobile/focus, intercepted checkout, full clinical PDF parsing. Screenshots and the fictional PDF are temporary test artifacts, not real patient records.
- Preview harness compilation signal: `build OK` at 16:50:48 UTC. No independent manual typecheck or full production/prerender build was run; those remain unverified beyond harness compilation.
- Local cleanup verified zero auth users, partner organisations and shared briefs. No production fixture cleanup was needed because no production fixtures were created.

### Decision

NO-GO for the real TMCG pilot. The isolated safety evidence is materially better, but production still runs the previous server code. Require reviewed coordinated release, safe captured-email onboarding/extraction/provider tests, complete deletion and retry tests, and hosted post-release synthetic verification before changing the decision. Never create a TMCG organisation, contact Daniel, send live invitations or initiate real charges for QA.