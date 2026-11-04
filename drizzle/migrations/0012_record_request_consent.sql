-- Records requests carry the patient's email and their signed consent to release.
ALTER TABLE public.record_requests
  ADD COLUMN IF NOT EXISTS patient_email text,
  ADD COLUMN IF NOT EXISTS patient_dob date,
  ADD COLUMN IF NOT EXISTS consent_statement text,
  ADD COLUMN IF NOT EXISTS consent_signed_name text,
  ADD COLUMN IF NOT EXISTS consent_signed_at timestamptz;

-- The email comes from the signed-in account and the signing time from the server,
-- so neither can be supplied by the browser.
CREATE OR REPLACE FUNCTION public.record_request_stamp_consent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.patient_email := COALESCE(auth.jwt() ->> 'email', NEW.patient_email);
  IF NEW.consent_signed_name IS NOT NULL AND btrim(NEW.consent_signed_name) <> '' THEN
    NEW.consent_signed_at := now();
  ELSE
    NEW.consent_signed_name := NULL;
    NEW.consent_signed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS record_request_stamp_consent ON public.record_requests;
CREATE TRIGGER record_request_stamp_consent
  BEFORE INSERT ON public.record_requests
  FOR EACH ROW EXECUTE FUNCTION public.record_request_stamp_consent();

-- Consent fields are fixed once signed.
CREATE OR REPLACE FUNCTION public.record_request_lock_consent()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.patient_email := OLD.patient_email;
  NEW.patient_dob := OLD.patient_dob;
  NEW.consent_statement := OLD.consent_statement;
  NEW.consent_signed_name := OLD.consent_signed_name;
  NEW.consent_signed_at := OLD.consent_signed_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS record_request_lock_consent ON public.record_requests;
CREATE TRIGGER record_request_lock_consent
  BEFORE UPDATE ON public.record_requests
  FOR EACH ROW EXECUTE FUNCTION public.record_request_lock_consent();
