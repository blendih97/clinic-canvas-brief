# Isolated partner-pilot release candidates

These files are intentionally outside `supabase/functions` and `supabase/migrations` to prevent automatic deployment to the shared live backend. No current production edge handler has been replaced.

Apply `001_partner_pilot_safety.sql` only through the managed migration tool when approved to affect the shared backend. It has passed on an isolated local schema copy, but no production deployment is authorised while remaining gates are open. It refuses ambiguous historical partner/profile complimentary grants.

Function replacement mapping:
- `get-shared-brief.ts` replaces `supabase/functions/get-shared-brief/index.ts`.
- `delete-account.ts` replaces `supabase/functions/delete-account/index.ts`.
- `partner-manage.ts` replaces `supabase/functions/partner-manage/index.ts`.
- `render-export-pdf.ts` replaces `supabase/functions/render-export-pdf/index.ts`.

The shared `_shared/clinicalPdfText.ts` dependency must deploy with the PDF function. The recipient frontend requires protocol 2 and fails closed against the existing reusable endpoint. Deploy SQL and changed edge functions before publishing the corresponding frontend. Existing open legacy recipient pages cannot be retroactively updated; revalidation on those old pages remains a known release gate.

No email capture switch has been added to production. Confirmation, invitations, record requests and analysis-failure alerts require a genuine isolated mail transport before end-to-end testing.
## End of pilot (002_end_of_pilot.sql, close-account.ts)

Tested on a local staging copy of the backend with synthetic patients only (`tests/end_of_pilot.staging.ts`, 48 checks).
Switched off by default: `admin_settings.end_of_pilot_enabled = false`. Patients see nothing until it is turned on.

Release order, each step only with approval:
1. Apply `002_end_of_pilot.sql` through the managed migration tool. Nothing changes for patients (switch is off).
2. Deploy `close-account.ts` as `supabase/functions/close-account/index.ts` (verify_jwt = false; it checks the session itself).
3. Schedule the retry worker every 15 minutes (pg_cron + pg_net POST `{"action":"process"}` with the service role key held in Vault, never in SQL text).
4. Point Settings > "Delete my account" at the same close-account flow (CloseAccountDialog) and retire `delete-account`.
5. Publish the frontend, then turn the switch on.

Known limits:
- Cancelling an active Stripe subscription during closure could not be tested here (no Stripe test keys in local staging). Pilot patients have no subscription, so this path only matters for paying patients.
- Access tokens already issued stay technically valid until they expire (up to an hour), but every row and file they could read is gone within the same request, and refresh and sign-in are blocked.
- Other interface languages fall back to English for the new text until src/locales are translated.
