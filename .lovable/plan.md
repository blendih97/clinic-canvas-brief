
## Strategy
Reposition Rinvita as **"All your medical records, organised in one place"** — for anyone who wants their health history structured, searchable, and shareable. Translation is positioned as a powerful built-in feature (especially valuable for international patients travelling to the UK/US for care), not the whole pitch.

Kill the "free until June 1" deadline (it's expired anyway and got no traction). Open a clear B2B path for clinics alongside the self-serve consumer signup. Add a free **no-signup "Translate a Medical Document"** tool as a top-of-funnel magnet that feeds Meta/Insta ads and converts visitors into vault signups.

## What changes

### 1. Marketing landing page (`src/pages/MarketingLandingPage.tsx`)
- **New hero**: "All your medical records. Organised, searchable, in one place." Sub-headline: "Upload reports, scans, and prescriptions — Rinvita extracts the key information, tracks trends, and translates anything into your language. Yours forever, free up to 3 documents."
- **Primary CTA**: "Start your free vault"
- **Secondary CTA**: "Try the free translator" → /translate
- Remove all "Early access free until 1 June" / deadline copy.
- Pricing reframe: "Free forever — 3 documents included. Upgrade for unlimited."
- New section: **"Travelling abroad for care?"** — soft mention of UK/US healthcare travel + multi-language translation, without making the whole page about it.
- New section: **"For clinics & private practices"** with "Talk to us" CTA → /for-clinics.

### 2. Free translate tool (`src/pages/TranslateToolPage.tsx`, route `/translate`)
- Single-page tool: upload one PDF/image → optional email → get translation + plain-English summary on screen (and emailed if address given).
- No signup required. New public edge function `public-translate-document` reuses Lovable AI Gateway (Gemini 2.5 Pro) — returns translation + summary only, no DB write to vaults.
- Rate-limited per IP (5/day) via in-memory Map in the edge function.
- Soft CTA at the bottom: "Save this and more to your private vault — free up to 3 documents" → /auth.
- Emails (with explicit consent checkbox) captured into a new `translate_tool_leads` table for follow-up.

### 3. B2B page (`src/pages/ForCliniciansPage.tsx`, route `/for-clinics`)
- Positioning: a patient records vault clinics can offer to their patients — keeps records organised between visits, reduces admin, improves patient retention.
- Sections: the problem, how it works, security/compliance bullets, "Book a 15-min call" form.
- Form posts to `send-transactional-email` with a new `b2b-enquiry` template → emails info@rinvita. Stored in new `b2b_enquiries` table.

### 4. Navigation & routing (`src/App.tsx`, marketing nav/footer)
- Public routes added: `/translate`, `/for-clinics`.
- Marketing nav: Translator (free) • For clinics • Pricing • Sign in.

### 5. SEO
- New `<SEO>` configs:
  - `/translate` → "translate medical document online", "translate medical report free", "translate blood test results"
  - `/for-clinics` → "patient records system for private clinics UK", "patient vault for GP practices"
  - `/` updated title/description to broader "organise medical records" framing.
- Update `public/sitemap.xml` with new routes.

### 6. Deadline cleanup
- Sweep all marketing copy and email templates for "early access", "free until June 1", "limited time" — remove or rephrase.

## What I will NOT change
- The app at `/app`, admin, auth, subscriptions, vault logic.
- `planAccess.ts` — Free up to 3 docs is already the model; only marketing copy needs updating.
- Existing transactional email infra (just adding one new template).

## Technical notes
- New table `translate_tool_leads` (id, email, consent_at, source, created_at) — RLS denies all client access; service role insert only.
- New table `b2b_enquiries` (id, name, email, practice_name, message, created_at) — same RLS.
- Both new edge functions deployed automatically.

## Out of scope
- Ad creative (you handle Meta/Insta; landing pages will be UTM-friendly).
- Stripe changes.
- B2B outreach list.

Ship it?
