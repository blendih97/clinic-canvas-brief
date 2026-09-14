# RinVita launch audit — findings and first fix batch

Evidence: repository code, live database, and payment configuration. Nothing was changed.

## Headline

The website and the sign-up flow work. The three things that decide whether RinVita earns money and keeps trust — the free limit, the document pipeline's status, and paid-feature gating — are not actually enforced in the places that matter. Live payments are switched on (`.env.production` uses a live key) and there are currently zero subscription records, so the payment path has never completed once in production.

Database snapshot: 7 accounts, 15 documents, 0 subscriptions, 0 clinic enquiries, 0 B2B enquiries, 3,754 page views.

---

## P0 — blocks revenue or breaks the product today

**1. Every uploaded document is stuck showing "pending" forever.**
14 of 15 documents in the live database are marked pending, including 7 that were fully analysed and translated. `supabase/functions/analyse-document/index.ts` never touches the documents table, and `src/store/vaultStore.ts` (`addDocuments`, ~line 303) never sets the status field, so it keeps its default value. Consequence: the admin dashboard reports the product as broken, and nobody can tell a real failure from a success. Smallest fix: set the status to `completed` (plus processed time) in `addDocuments`, matching the pattern already working in `supabase/functions/upload-record-request/index.ts:147`.

**2. The 3-document free limit is not enforced anywhere but the screen.**
`src/lib/planAccess.ts:97` and `src/pages/Index.tsx:42` are the only checks. Nothing in the database rules or the analysis function counts documents. Consequence: the paid plan is optional — a user can keep uploading past three. Smallest fix: count the user's documents inside `analyse-document` and refuse when over the limit for non-subscribers (`user_has_paid_access` already exists).

**3. Paid features are open to everyone.**
`hasAccess()` in `src/lib/planAccess.ts:76` returns `true` unconditionally, so sharing a brief, requesting records, requesting imaging and family invites are free for all. Only PDF download checks the real subscription. Consequence: there is little reason to pay. Smallest fix: make `hasAccess` take the live subscription result and gate the four features, keeping preview-then-upgrade behaviour.

**4. A failed upload leaves no trace.**
If analysis fails, `src/components/DocumentUpload.tsx:163` shows a message and nothing is saved — no file, no record, no error log. Consequence: a patient loses the upload and support has nothing to investigate. Smallest fix: write the document row with status `failed` and the error text before surfacing the message.

**5. B2B enquiries from /for-clinics notify nobody.**
`supabase/functions/submit-b2b-enquiry/index.ts` saves the row and stops; the sibling clinic function sends an admin email. No screen in the app reads either enquiry table. Consequence: paid-tier leads are silently lost. Smallest fix: send the same admin email from the B2B function, and point the `/for-clinics` form at the clinic enquiry function so there is one pipeline.

---

## P1 — real risk, not yet biting

**6. Test-mode subscriptions grant live access.** The `user_has_paid_access` database function ignores the environment column, while `src/hooks/useSubscription.ts:36` filters by it. A sandbox test purchase would unlock the live app. Fix: add the environment condition to the function.

**7. Live payments can land in the wrong bucket.** `supabase/functions/payments-webhook/index.ts:50` silently defaults to sandbox when the environment parameter is missing. A misconfigured live webhook means real customers are charged and the app shows them as unpaid. Fix: reject the event instead of defaulting.

**8. Paying customers can be dropped entirely.** If a Stripe customer exists without the internal user tag, the webhook logs a warning and skips (`payments-webhook/index.ts:14-21`), the subscription is never recorded, and "Manage subscription" then fails with "No subscription found". Fix: require the user id in `create-checkout` and record unmatched events for manual review.

**9. Settings shows a stale plan.** `src/pages/SettingsPage.tsx:101` reads `profiles.plan`, which nothing updates after checkout, while Billing reads the real subscription. Fix: have Settings read the same subscription source.

**10. "Revocable sharing" is not implemented.** Share links expire but cannot be revoked: there is no delete rule on the share tables and no revoke button in `src/components/sections/ShareBriefSection.tsx`. We state revocability publicly. Fix: add a delete rule scoped to the owner and a revoke action in the sharing screen.

**11. Almost nothing in the money funnel is measured.** `src/lib/analytics.ts` has no events for document uploaded, paywall shown, checkout started or purchase completed, and the purchase value in `src/pages/CheckoutReturn.tsx:15` is hardcoded to 0. Page views are recorded correctly. Fix: add the four events and pass the real amount.

---

## P2 — cleanup

12. No file size or type check on drag-and-drop uploads (`DocumentUpload.tsx:269`); server accepts any payload size.
13. Rate limiting on the public forms is in-memory only, so it resets whenever the function restarts.
14. Upload consent is stored in the browser only, so it is not auditable.
15. The only automated test is the placeholder in `src/test/example.test.ts` — no coverage of the limit, the webhook, or the gating rules.
16. Analysis errors collapse to a generic message, so credit exhaustion and rate limits look like a crash.

---

## Recommended first batch

No pricing changes, no redesign. In order:

1. Set document status correctly on success and on failure (findings 1 and 4).
2. Enforce the 3-document limit server-side (finding 2).
3. Gate the four paid features on the real subscription (finding 3).
4. Send the admin email for B2B enquiries and unify the two forms (finding 5).
5. Environment correctness: fix the paid-access function and the webhook default (findings 6 and 7).
6. Add the four missing funnel events and the real purchase value (finding 11).

Steps 1–3 protect revenue, 4 protects leads, 5 prevents a live payment being invisible, and 6 makes the next round of decisions measurable. Add tests for the limit and the webhook in the same batch.

Suggested follow-up batch: share revocation, Settings plan source, dropped-subscription handling, and upload validation.
