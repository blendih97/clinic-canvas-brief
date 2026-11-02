CREATE TABLE public.onboarding_funnel_daily (
 day date NOT NULL DEFAULT (timezone('UTC', now()))::date,
 event text NOT NULL CHECK (event IN ('signup_page_viewed','signup_submitted','signup_error','signup_succeeded','first_login','upload_started','upload_saved','checkout_started')),
 plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','standard','family')),
 error_code text NOT NULL DEFAULT 'none' CHECK (error_code IN ('none','weak_password','rate_limit','email_exists','too_short','missing_fields','other')),
 count bigint NOT NULL DEFAULT 0,
 PRIMARY KEY (day,event,plan,error_code)
);
GRANT SELECT ON public.onboarding_funnel_daily TO authenticated;
GRANT ALL ON public.onboarding_funnel_daily TO service_role;
ALTER TABLE public.onboarding_funnel_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read daily funnel" ON public.onboarding_funnel_daily FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE FUNCTION public.record_onboarding_funnel(_event text, _plan text DEFAULT 'free', _error_code text DEFAULT 'none') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF _event IS NULL OR _event NOT IN ('signup_page_viewed','signup_submitted','signup_error','signup_succeeded','first_login','upload_started','upload_saved','checkout_started') OR _plan IS NULL OR _plan NOT IN ('free','standard','family') OR _error_code IS NULL OR _error_code NOT IN ('none','weak_password','rate_limit','email_exists','too_short','missing_fields','other') THEN RAISE EXCEPTION 'Invalid funnel fields'; END IF;
 INSERT INTO public.onboarding_funnel_daily(day,event,plan,error_code,count) VALUES ((timezone('UTC',now()))::date,_event,_plan,_error_code,1)
 ON CONFLICT(day,event,plan,error_code) DO UPDATE SET count = onboarding_funnel_daily.count + 1;
END; $$;
REVOKE ALL ON FUNCTION public.record_onboarding_funnel(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_onboarding_funnel(text,text,text) TO anon,authenticated;
COMMENT ON TABLE public.onboarding_funnel_daily IS 'Aggregate UTC daily counters only. No user, session, email, IP, name or clinical fields. Public event counts are indicative and can be inflated.';