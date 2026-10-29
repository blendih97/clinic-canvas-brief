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