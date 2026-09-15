# Partner layer for clinics and concierges

A separate partner area where a clinic or concierge can invite patients, send documents into a patient's hub, and — only with that patient's explicit, scoped, time-limited permission — view their records. The patient stays in control: every permission is opt-in, revocable instantly, and every partner view is logged for the patient to see.

## Assumptions

- Partner organisations are created only by RinVita platform admins in /admin; there is no partner self-signup.
- Partner staff sign in with the same login system as patients; their partner role is separate from the existing admin/user roles.
- Partners get read-only viewing. No download, export or PDF for partners in this version.
- A patient can be linked to several partners; each link carries its own permissions.

## Step 1 — Share-link revocation gap (smallest, do first)

Complexity: XS.

The revoke function `revoke_shared_brief` and a working revoke button already exist in the Share Brief section, and `revoked_at` columns exist on both share tables. The real remaining gap is that a patient has no list of their previously created links, so older links cannot be revoked once the page is closed.

- Add a "Active share links" list in the Share Brief section: created date, expiry, status, revoke button (uses the existing function).
- Same for media shares via the existing media revoke function.

## Step 2 — Partner data model

Complexity: M. One migration, additive only.

- `partner_orgs` — name, type (clinic / concierge / other), logo_url, status (active / suspended), timestamps.
- `partner_members` — org, user id, role (`partner_admin` / `partner_staff`), status, invited/joined timestamps. Unique per (org, user). New enum `partner_role`; the existing `app_role` enum is untouched.
- `partner_patient_links` — org, patient user id, invited email, invited_by, status (invited / joined / revoked), `attribution_source`, timestamps. This is the billing-attribution record.
- `partner_permissions` — one row per link: `can_send_records` (default true), `can_view_records` (default false), `view_scope` (array: blood_results, medications_allergies, imaging, documents, or "full"), `view_expires_at` (null = until revoked), granted_at, revoked_at.
- `partner_access_log` — append-only: link id, partner user id, patient id, section viewed, record id, timestamp. Insert-only policies, no update/delete.
- `partner_consent_events` — append-only record of every permission change (who, what, before/after, timestamp).

Every table: GRANTs for `authenticated` and `service_role`, RLS enabled, no anon access.

Security-definer helpers (mirroring the existing `has_role` pattern):

- `is_partner_member(_user, _org, _role)` — org membership check.
- `partner_can_view(_partner_user, _patient, _section)` — true only when a link exists, `can_view_records` is true, `revoked_at` is null, `view_expires_at` is null or in the future, and the section is in scope. This one function is the single gate used by every partner read policy, so revocation and expiry take effect at database level immediately.
- `partner_can_send(_partner_user, _patient)` — same for Permission A.

RLS additions on existing clinical tables (`documents`, `blood_results`, `medications`, `allergies`, `imaging_results`, `visits`, `profiles`): one extra SELECT policy per table using `partner_can_view(...)` with the matching section. Existing patient-owner policies are unchanged. Cross-org isolation is automatic: the helper only matches links belonging to the caller's own org.

## Step 3 — Platform admin creates partner orgs

Complexity: S.

- New `/admin/partners` screen: list orgs, create org (name, type, logo), suspend, and invite the first `partner_admin` by email.
- Server side: `admin-partner-manage` edge function (validates caller is a platform admin in-code), writing org + pending member row and sending an invite email.
- Admins see org metadata and counts only — no clinical data is exposed on any admin partner screen.

## Step 4 — Partner portal at /partner

Complexity: M.

- `PartnerRoute` guard + `PartnerLayout`, mirroring the existing `AdminRoute` / `AdminLayout` pattern.
- Screens: Patients list (name, email, invite status, permission status, records sent count, last activity — no clinical content), Patient detail (send a document; read-only record view when Permission B is granted), and Team (partner_admin only: invite/remove staff).
- Read-only record view renders only in-scope sections; every open writes an access-log row through a security-definer `log_partner_access` function.

## Step 5 — Inviting patients

Complexity: S.

- `partner-invite-patient` edge function: validates the caller is partner staff, rate-limits invites (per org per hour, same in-memory pattern used by the enquiry functions plus a DB count check), creates the link row, and sends a branded "[Partner] has invited you to RinVita" email reusing the existing family-invite template shape and registry.
- On signup, the invite token is carried through the auth flow and the link flips to "joined" with Permission A on. Existing signed-in users see a pending invite banner in /app and accept from there.

## Step 6 — Patient consent UI: "Connected providers"

Complexity: M.

New section in /app settings listing each connected partner with:

- Permission A toggle "Send records to my hub" (on by default after accepting).
- Permission B "Let [Partner] view my records" — off by default, granting opens a dialog for scope (full history, or specific sections) and duration (30 days / 6 months / 12 months / until I revoke), with plain-English wording of exactly what the partner will see.
- Instant revoke for either permission.
- Access log: which staff member viewed which section and when.

All changes go through a `set_partner_permission` security-definer function so the consent event is always audited alongside the change.

## Step 7 — Partner sends a document

Complexity: S — reuses the existing pipeline.

- `partner-upload-document` edge function modelled directly on `upload-record-request`: same storage path convention, same `analyse-document` call, same structured extraction inserts. Differences: it authorises via `partner_can_send` instead of a token, tags the document `Sent by [Partner]`, and records the sending org.
- Patient notification reuses the existing `alerts` table plus the `document-processed` transactional email.

## Step 8 — Tests

Complexity: M.

RLS tests (against the database, in the existing vitest suite) proving:

a. No partner read without Permission B.
b. Scope limits — an imaging-only grant returns no blood results.
c. Expiry — a grant past `view_expires_at` returns nothing.
d. Instant revocation — reads stop immediately after revoke.
e. Cross-org isolation — org B sees nothing of org A's patients.
f. Every partner view writes an audit row; audit rows cannot be updated or deleted.

Plus UI tests for the consent dialog wording and the share-link revoke list.

## Migration order

1. Share-link list (no schema change).
2. Partner tables + enums + GRANTs + RLS + helper functions.
3. Partner SELECT policies on clinical tables (separate migration so it can be reverted alone).
4. Consent/audit functions.
5. Edge functions and UI.

## Risks and blockers in the current code

- `analyse-document` is invoked server-to-server by `upload-record-request` and has no partner concept; it needs no change, but partner uploads must never bypass the free-plan document quota trigger — decide whether partner-sent documents count toward the patient's 3-document free limit. Recommendation: they do count, matching today's trigger behaviour.
- Auth flow: the invite token must survive the signup redirect. The existing auth page has no token-carrying parameter; this needs a small addition.
- `app_role` has only `admin` and `user`; partner roles must live in the new `partner_members` table rather than extending that enum, to avoid touching existing admin checks.
- Adding partner SELECT policies to clinical tables is the highest-risk change in the batch — a mistake widens access. Mitigation: one shared helper function, one policy per table, and the RLS test suite gating the migration.
- The database linter already reports pre-existing warnings; new functions will follow the existing `SET search_path = public` convention.

## For your solicitors (no legal text written here)

- RinVita becomes a processor for partner-initiated processing while remaining controller for the patient's own hub — the dual role needs describing.
- A data processing agreement per partner organisation covering purpose limitation, staff access, retention of the access log, and breach notification.
- Privacy policy wording for: partner-invited signups, attribution data kept for billing, partner viewing under patient consent, audit-log retention period, and what happens to partner-sent documents after the patient revokes.
- Lawful basis for the patient's consent to partner viewing, and how withdrawal is evidenced.
- Cross-border transfers where partner staff are outside the patient's jurisdiction.
