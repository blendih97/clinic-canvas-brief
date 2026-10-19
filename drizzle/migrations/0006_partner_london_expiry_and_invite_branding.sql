CREATE OR REPLACE FUNCTION public.partner_sponsorship_expiry(_date date)
RETURNS timestamptz LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT (((_date + 1)::timestamp AT TIME ZONE 'Europe/London') - interval '1 microsecond');
$$;
REVOKE ALL ON FUNCTION public.partner_sponsorship_expiry(date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.partner_sponsorship_expiry(date) TO service_role;

DO $migration$
DECLARE definition text;
BEGIN
  SELECT pg_get_functiondef('public.partner_claim(uuid,text,boolean,text,text)'::regprocedure) INTO definition;
  IF position('(org.sponsor_until + 1)::timestamptz' IN definition) = 0 THEN
    RAISE EXCEPTION 'Expected partner expiry expression not found';
  END IF;
  definition := replace(definition, '(org.sponsor_until + 1)::timestamptz', 'public.partner_sponsorship_expiry(org.sponsor_until)');
  EXECUTE definition;
END;
$migration$;

CREATE OR REPLACE FUNCTION public.get_public_partner_by_invite(_token text)
RETURNS TABLE(name text, slug text, logo_url text, type text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.name, o.slug, o.logo_url, o.type
  FROM public.partner_orgs o
  JOIN public.partner_patient_links l ON l.org_id = o.id
  WHERE l.invite_token = _token AND _token ~ '^[a-f0-9]{64}$'
    AND l.status = 'invited' AND o.status = 'active'
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_public_partner_by_invite(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_partner_by_invite(text) TO anon, authenticated, service_role;