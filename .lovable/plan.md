## Goal

Recover the ~5 signup-intent sessions/day that hit `/auth?mode=signup` and bounce. Today's funnel: 108 visitors → 5 signup-intent → 0 completions. Almost all traffic is mobile (93%) from paid FB ads.

## Hypothesis on why people drop

1. The signup is a 5-step form (`Account → Personal → Countries → Health → Consent`). On mobile, after a paid ad click, that looks like a wall of work before they understand the value.
2. There's no one-tap option — every visitor must type an email and invent a password on a phone keyboard.
3. The auth page is bare — no reminder of *what* they're signing up for, no social proof, no trust cues. Coming straight from a Facebook ad, people lose context.
4. No visible "X of 5 steps, takes ~60 seconds" expectation-setting.

## Changes

### 1. Add Google sign-in (highest expected impact)
- Enable Google OAuth via Lovable Cloud managed social login.
- Add a "Continue with Google" button at the top of both signin and signup modes, with an "or" divider above the email form.
- For Google signups, skip step 1 (account) entirely — go straight to step 2 (personal details), since email is already verified.

### 2. Shorten the perceived signup
- Add a clear progress header on step 1: "Step 1 of 5 · ~60 seconds" so the length is expected, not a surprise mid-flow.
- Make steps 3 (Countries), 4 (Health), and 5 (Consent except required terms) explicitly skippable with a "Skip for now" link — user lands in the app faster and can complete profile later from Settings.
- Keep terms consent mandatory; health/marketing consent and country/health fields become optional with sensible defaults.

### 3. Add trust + value cues on the auth page
- Above the form on mobile, add a compact value block: product name, one-line promise ("Your medical records, organised across countries"), and 3 micro-bullets (Bank-level encryption · Cancel anytime · No card required).
- Add Sarah K. testimonial (already on landing) as a single quote line below the form on mobile, to mirror the landing-page proof.

### 4. Smarter form mechanics on mobile
- `inputMode="email"`, `autoComplete="email"` on email; `autoComplete="new-password"` on password; `autoCapitalize="none"`; large 16px+ inputs to prevent iOS zoom.
- Show password visibility toggle (eye icon) so people don't abandon on a typo.
- Inline live validation hints instead of toast-on-submit ("6+ characters" turns green when met).

### 5. Track the funnel so we can measure
- Fire Meta Pixel `Lead` event when a user successfully completes step 1 (email + password accepted), and `CompleteRegistration` on full signup. Today we can't tell which step kills the flow.
- Add a `signup_step_viewed` page_views entry (or a simple analytics insert) per step so the admin Visitors page can show the drop-off by step.

## Out of scope (not changing now)
- Pricing/plan logic, landing page hero, ad creative.
- Email auth flow itself (passwordless, magic link) — bigger change, revisit if Google + shorter form doesn't move the needle.

## Files likely to change

- `src/pages/AuthPage.tsx` — Google button, divider, progress header, skip links, input attributes, password toggle, inline validation, pixel events.
- `src/hooks/useAuth.tsx` — add `signInWithGoogle` helper.
- `src/lib/metaPixel.ts` — add `trackCompleteRegistration` helper.
- `supabase--configure_social_auth` — enable Google provider.
- Optional new migration only if we add a `signup_funnel_events` table; otherwise reuse `page_views`.

## Expected outcome

If even 1 of the 5 daily signup-intent sessions converts, that's a step-change from 0%. Google one-tap alone typically lifts mobile signup conversion 20–40%.
