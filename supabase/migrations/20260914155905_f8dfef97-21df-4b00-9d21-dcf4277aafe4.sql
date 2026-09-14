ALTER TABLE public.clinic_enquiries
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS organisation_type text,
  ADD COLUMN IF NOT EXISTS languages_handled text,
  ADD COLUMN IF NOT EXISTS current_problem text,
  ADD COLUMN IF NOT EXISTS preferred_next_step text,
  ADD COLUMN IF NOT EXISTS source_page text,
  ADD COLUMN IF NOT EXISTS consent_at timestamptz;