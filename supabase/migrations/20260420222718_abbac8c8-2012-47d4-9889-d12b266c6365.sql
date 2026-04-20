ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferred_ui_language text NOT NULL DEFAULT 'en',
ADD COLUMN IF NOT EXISTS preferred_translation_language text NOT NULL DEFAULT 'en',
ADD COLUMN IF NOT EXISTS nationality_code text,
ADD COLUMN IF NOT EXISTS residence_country_code text,
ADD COLUMN IF NOT EXISTS marketing_consent boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS health_data_consent boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS health_data_consent_timestamp timestamptz;

CREATE TABLE IF NOT EXISTS public.countries (
  code text PRIMARY KEY,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  flag_emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'countries' AND policyname = 'Authenticated users can view countries'
  ) THEN
    CREATE POLICY "Authenticated users can view countries"
    ON public.countries
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.admin_2fa_recovery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  encrypted_code text NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_2fa_recovery_user_id ON public.admin_2fa_recovery(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_countries_code ON public.countries(code);
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_ui_language ON public.profiles(preferred_ui_language);
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_translation_language ON public.profiles(preferred_translation_language);
CREATE INDEX IF NOT EXISTS idx_profiles_nationality_code ON public.profiles(nationality_code);
CREATE INDEX IF NOT EXISTS idx_profiles_residence_country_code ON public.profiles(residence_country_code);

ALTER TABLE public.admin_2fa_recovery ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_2fa_recovery' AND policyname = 'Admins can view own 2fa recovery codes'
  ) THEN
    CREATE POLICY "Admins can view own 2fa recovery codes"
    ON public.admin_2fa_recovery
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin') AND auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_2fa_recovery' AND policyname = 'Admins can insert own 2fa recovery codes'
  ) THEN
    CREATE POLICY "Admins can insert own 2fa recovery codes"
    ON public.admin_2fa_recovery
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_2fa_recovery' AND policyname = 'Admins can update own 2fa recovery codes'
  ) THEN
    CREATE POLICY "Admins can update own 2fa recovery codes"
    ON public.admin_2fa_recovery
    FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin') AND auth.uid() = user_id)
    WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_2fa_recovery' AND policyname = 'Admins can delete own 2fa recovery codes'
  ) THEN
    CREATE POLICY "Admins can delete own 2fa recovery codes"
    ON public.admin_2fa_recovery
    FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin') AND auth.uid() = user_id);
  END IF;
END $$;