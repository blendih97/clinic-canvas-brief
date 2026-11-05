-- First-login "About you" setup, patient-confirmed "no known allergies", private insurance details,
-- persistent "records received" notices, and allergy updates (needed to merge duplicates).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS setup_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS no_known_allergies boolean NOT NULL DEFAULT false;

-- Existing accounts are not asked to run the new setup.
UPDATE public.profiles SET setup_completed_at = now() WHERE setup_completed_at IS NULL;

-- The share snapshot records whether the patient confirmed they have no known allergies.
ALTER TABLE public.shared_briefs
  ADD COLUMN IF NOT EXISTS no_known_allergies boolean NOT NULL DEFAULT false;

-- "New records received" notices are dismissed per request, on every device.
ALTER TABLE public.record_requests
  ADD COLUMN IF NOT EXISTS seen_at timestamptz;
-- Notices already received before this change have been seen (they were dismissed in the browser).
UPDATE public.record_requests SET seen_at = now() WHERE status = 'received' AND seen_at IS NULL;

-- Insurance details: private to the patient. Never part of a share brief, export or partner view.
CREATE TABLE IF NOT EXISTS public.patient_insurance (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  insurer text CHECK (insurer IS NULL OR length(insurer) <= 120),
  policy_number text CHECK (policy_number IS NULL OR length(policy_number) <= 80),
  member_id text CHECK (member_id IS NULL OR length(member_id) <= 80),
  plan_name text CHECK (plan_name IS NULL OR length(plan_name) <= 120),
  insurer_phone text CHECK (insurer_phone IS NULL OR length(insurer_phone) <= 40),
  valid_until date,
  notes text CHECK (notes IS NULL OR length(notes) <= 500),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_insurance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner reads own insurance" ON public.patient_insurance;
CREATE POLICY "Owner reads own insurance" ON public.patient_insurance FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Owner adds own insurance" ON public.patient_insurance;
CREATE POLICY "Owner adds own insurance" ON public.patient_insurance FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Owner updates own insurance" ON public.patient_insurance;
CREATE POLICY "Owner updates own insurance" ON public.patient_insurance FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Owner deletes own insurance" ON public.patient_insurance;
CREATE POLICY "Owner deletes own insurance" ON public.patient_insurance FOR DELETE USING (auth.uid() = user_id);

-- Allergies can be updated by their owner (to fill in a reaction or severity when merging).
DROP POLICY IF EXISTS "Users can update own allergies" ON public.allergies;
CREATE POLICY "Users can update own allergies" ON public.allergies FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
