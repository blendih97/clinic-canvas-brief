ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS health_data_consent_at timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS terms_consent_at timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS biological_sex text DEFAULT NULL;