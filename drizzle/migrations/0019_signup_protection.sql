-- Sign-up protection.
-- 1) The database refuses accounts on throwaway and automated-test inboxes, whatever page or
--    tool the sign-up comes from (the sign-up page also checks first, with a clearer message).
-- 2) The sign-up funnel can count blocked sign-ups separately.

CREATE OR REPLACE FUNCTION public.block_disposable_signup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _domain text := lower(split_part(coalesce(NEW.email, ''), '@', 2));
BEGIN
  IF _domain <> '' AND (
    _domain IN ('mailosaur.net','example.com','example.org','example.net','yopmail.com','mailinator.com',
      'guerrillamail.com','sharklasers.com','10minutemail.com','temp-mail.org','tempmail.com','trashmail.com',
      'dispostable.com','getnada.com','maildrop.cc','throwawaymail.com','mailnesia.com')
    OR _domain LIKE '%.mailosaur.net' OR _domain LIKE '%.mailinator.com' OR _domain LIKE '%.yopmail.com'
  ) THEN
    RAISE EXCEPTION 'disposable_email' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.block_disposable_signup() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS block_disposable_signup ON auth.users;
CREATE TRIGGER block_disposable_signup BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.block_disposable_signup();

ALTER TABLE public.onboarding_funnel_daily DROP CONSTRAINT IF EXISTS onboarding_funnel_daily_error_code_check;
ALTER TABLE public.onboarding_funnel_daily ADD CONSTRAINT onboarding_funnel_daily_error_code_check
  CHECK (error_code IN ('none','weak_password','rate_limit','email_exists','too_short','missing_fields','blocked_bot','blocked_email','other'));

CREATE OR REPLACE FUNCTION public.record_onboarding_funnel(_event text, _plan text DEFAULT 'free', _error_code text DEFAULT 'none')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
BEGIN
 IF _event IS NULL OR _event NOT IN ('signup_page_viewed','signup_submitted','signup_error','signup_succeeded','first_login','upload_started','upload_saved','checkout_started')
   OR _plan IS NULL OR _plan NOT IN ('free','standard','family')
   OR _error_code IS NULL OR _error_code NOT IN ('none','weak_password','rate_limit','email_exists','too_short','missing_fields','blocked_bot','blocked_email','other')
 THEN RAISE EXCEPTION 'Invalid funnel fields'; END IF;
 INSERT INTO public.onboarding_funnel_daily(day,event,plan,error_code,count) VALUES ((timezone('UTC',now()))::date,_event,_plan,_error_code,1)
 ON CONFLICT(day,event,plan,error_code) DO UPDATE SET count = onboarding_funnel_daily.count + 1;
END; $function$;