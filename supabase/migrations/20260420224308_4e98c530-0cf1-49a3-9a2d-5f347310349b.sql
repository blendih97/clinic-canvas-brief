CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  metadata jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  allergy_item text;
  medication_item text;
  resolved_full_name text;
  resolved_ui_language text;
  resolved_translation_language text;
  consent_timestamp timestamptz;
BEGIN
  resolved_full_name := NULLIF(trim(concat_ws(' ', metadata->>'first_name', metadata->>'last_name')), '');
  resolved_ui_language := COALESCE(NULLIF(metadata->>'preferred_ui_language', ''), 'en');
  resolved_translation_language := COALESCE(NULLIF(metadata->>'preferred_translation_language', ''), resolved_ui_language, 'en');
  consent_timestamp := COALESCE(NULLIF(metadata->>'health_data_consent_timestamp', '')::timestamptz, now());

  INSERT INTO public.profiles (
    id,
    full_name,
    date_of_birth,
    biological_sex,
    nationality_code,
    residence_country_code,
    emergency_contact_name,
    emergency_contact_phone,
    marketing_consent,
    health_data_consent,
    health_data_consent_at,
    health_data_consent_timestamp,
    terms_consent_at,
    preferred_ui_language,
    preferred_translation_language
  )
  VALUES (
    NEW.id,
    COALESCE(resolved_full_name, NULLIF(metadata->>'full_name', ''), ''),
    NULLIF(metadata->>'date_of_birth', '')::date,
    NULLIF(metadata->>'biological_sex', ''),
    NULLIF(upper(metadata->>'nationality_code'), ''),
    NULLIF(upper(metadata->>'residence_country_code'), ''),
    NULLIF(metadata->>'emergency_contact_name', ''),
    NULLIF(metadata->>'emergency_contact_phone', ''),
    COALESCE((metadata->>'marketing_consent')::boolean, false),
    COALESCE((metadata->>'health_data_consent')::boolean, false),
    consent_timestamp,
    consent_timestamp,
    COALESCE(NULLIF(metadata->>'terms_consent_at', '')::timestamptz, now()),
    resolved_ui_language,
    resolved_translation_language
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    date_of_birth = EXCLUDED.date_of_birth,
    biological_sex = EXCLUDED.biological_sex,
    nationality_code = EXCLUDED.nationality_code,
    residence_country_code = EXCLUDED.residence_country_code,
    emergency_contact_name = EXCLUDED.emergency_contact_name,
    emergency_contact_phone = EXCLUDED.emergency_contact_phone,
    marketing_consent = EXCLUDED.marketing_consent,
    health_data_consent = EXCLUDED.health_data_consent,
    health_data_consent_at = EXCLUDED.health_data_consent_at,
    health_data_consent_timestamp = EXCLUDED.health_data_consent_timestamp,
    terms_consent_at = EXCLUDED.terms_consent_at,
    preferred_ui_language = EXCLUDED.preferred_ui_language,
    preferred_translation_language = EXCLUDED.preferred_translation_language;

  FOR allergy_item IN
    SELECT trim(value)
    FROM regexp_split_to_table(COALESCE(metadata->>'known_allergies', ''), E'[\\n,;]+') AS value
  LOOP
    IF allergy_item <> '' THEN
      INSERT INTO public.allergies (user_id, substance, source)
      VALUES (NEW.id, allergy_item, 'manual');
    END IF;
  END LOOP;

  FOR medication_item IN
    SELECT trim(value)
    FROM regexp_split_to_table(COALESCE(metadata->>'current_medications', ''), E'[\\n,;]+') AS value
  LOOP
    IF medication_item <> '' THEN
      INSERT INTO public.medications (user_id, name, source, active)
      VALUES (NEW.id, medication_item, 'manual', true);
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'countries' AND policyname = 'Authenticated users can view countries'
  ) THEN
    DROP POLICY "Authenticated users can view countries" ON public.countries;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'countries' AND policyname = 'Anyone can view countries'
  ) THEN
    CREATE POLICY "Anyone can view countries"
    ON public.countries
    FOR SELECT
    TO anon, authenticated
    USING (true);
  END IF;
END $$;