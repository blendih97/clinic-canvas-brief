
-- Add source column to medications
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'ai';

-- Add source column to allergies
ALTER TABLE public.allergies ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'ai';

-- Add file_path column to documents
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_path text;

-- Add health profile fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS height_cm numeric;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weight_kg numeric;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_diagnoses text;
