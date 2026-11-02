REVOKE ALL ON TABLE public.onboarding_funnel_daily FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.onboarding_funnel_daily FROM authenticated;
GRANT SELECT ON TABLE public.onboarding_funnel_daily TO authenticated;
GRANT ALL ON TABLE public.onboarding_funnel_daily TO service_role;
REVOKE ALL ON FUNCTION public.record_onboarding_funnel(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_onboarding_funnel(text,text,text) TO anon, authenticated;