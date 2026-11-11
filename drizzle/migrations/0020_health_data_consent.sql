-- Records a signed-in patient's explicit consent to processing their health information.
-- The time comes from the database so it can't be set from the browser.
CREATE OR REPLACE FUNCTION public.record_health_data_consent()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_signed_in' USING ERRCODE = '42501'; END IF;
  UPDATE public.profiles
     SET health_data_consent = true, health_data_consent_at = now(), health_data_consent_timestamp = now()
   WHERE id = auth.uid() AND health_data_consent IS DISTINCT FROM true;
END; $$;
REVOKE ALL ON FUNCTION public.record_health_data_consent() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_health_data_consent() TO authenticated;