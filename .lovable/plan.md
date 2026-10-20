# RinVita email sending — findings (investigation only)

## How emails are sent
- Provider: Lovable Emails (Lovable Cloud's built-in sending). No SMTP, Resend, SendGrid or Microsoft 365 is used by the app's code.
- Sign-in emails (confirm signup, password reset, magic link, invite, email change, verification code): sent by the app's sign-in hook, queued, then delivered by Lovable.
- Notification emails (new-signup admin alert, clinic enquiries, record requests, family invites, partner invites, document processed): same queue and provider.
- No separate "welcome" email exists; the signup confirmation email is the welcome ("Welcome to RinVita.").
- Status: sender domain verified, queue healthy, 17 emails sent in the last 7 days.

## Addresses and domains
- Visible From: `RinVita <noreply@rinvita.co.uk>` (root domain), set in both the sign-in hook and the notification sender.
- Actual sending domain (envelope/return-path and DKIM signing): `notify.rinvita.co.uk`.
- `notify.rinvita.co.uk` is delegated by NS records to `ns5.lovable.cloud` and `ns6.lovable.cloud`; Lovable manages its SPF, DKIM and MX. Nothing on the root domain is needed for Lovable to send.
- Admin alerts go to `info@rinvita.co.uk`, so your own mailbox receives mail claiming to be from `@rinvita.co.uk` but sent from outside Microsoft 365/GoDaddy.

## Likely cause of the quarantines
- These emails never pass through GoDaddy/Microsoft 365, so Proofpoint "outbound" filtering does not handle them. What Proofpoint sees is inbound mail to `info@rinvita.co.uk` (or other Outlook/GoDaddy recipients) whose From is your own domain, sent by a third party. That pattern is a common "spoofing of own domain" trigger.
- DMARC on `rinvita.co.uk` passes only through relaxed alignment (DKIM/SPF are on `notify.`). If the root DMARC uses strict alignment (`adkim=s` or `aspf=s`), every message fails DMARC.

## DNS and settings recommendations
1. Keep the two NS records for `notify.rinvita.co.uk` exactly as they are. Do not add SPF/DKIM for `notify` at GoDaddy.
2. Root DMARC (`_dmarc.rinvita.co.uk`): make sure alignment is relaxed (omit `adkim`/`aspf`, or set them to `r`). Start with `p=none` plus a `rua` report address, then move to `quarantine`.
3. Root SPF: no Lovable include is needed. Keep only your Microsoft 365/GoDaddy entries and one `v=spf1` record.
4. In Proofpoint/GoDaddy email security, add an allow rule for mail where the return-path/DKIM domain is `notify.rinvita.co.uk` (rather than allowing all of `rinvita.co.uk`, which would invite spoofing).
5. Optional, needs a code change later: change the From address to `noreply@notify.rinvita.co.uk` for full strict alignment and no own-domain lookalike. Not done now.
6. Side note: the Privacy Policy lists "Resend" as the email processor, but the app doesn't use Resend. That needs a content fix only if you want it (Privacy page left untouched).

## Not checked
- The live DNS records on the root domain (SPF/DMARC values) and Proofpoint quarantine headers. If you paste one quarantined message header (with addresses removed), I can confirm which check fails.
