-- Partner branding (tagline) and optional full RinVita access for a partner's own staff.
ALTER TABLE public.partner_orgs
  ADD COLUMN IF NOT EXISTS tagline text CHECK (tagline IS NULL OR length(trim(tagline)) <= 120),
  ADD COLUMN IF NOT EXISTS staff_full_access boolean NOT NULL DEFAULT false;

DROP FUNCTION IF EXISTS public.get_public_partner(text);
CREATE FUNCTION public.get_public_partner(_slug text)
RETURNS TABLE(name text, slug text, logo_url text, type text, tagline text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT o.name, o.slug, o.logo_url, o.type, o.tagline FROM public.partner_orgs o
  WHERE o.slug = lower(trim(_slug)) AND o.status = 'active' LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_public_partner(text) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.get_public_partner_by_invite(text);
CREATE FUNCTION public.get_public_partner_by_invite(_token text)
RETURNS TABLE(name text, slug text, logo_url text, type text, tagline text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT o.name, o.slug, o.logo_url, o.type, o.tagline
  FROM public.partner_orgs o
  JOIN public.partner_patient_links l ON l.org_id = o.id
  WHERE l.invite_token = _token AND _token ~ '^[a-f0-9]{64}$'
    AND l.status = 'invited' AND o.status = 'active'
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_public_partner_by_invite(text) TO anon, authenticated;

-- A patient's sponsorship, or (for staff of a partner with staff_full_access) the staff access.
DROP FUNCTION IF EXISTS public.get_my_partner_sponsorship();
CREATE FUNCTION public.get_my_partner_sponsorship()
RETURNS TABLE(org_name text, logo_url text, comped_plan text, comped_until timestamptz, kind text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  (SELECT o.name, o.logo_url, p.comped_plan, p.comped_until, 'patient'::text
   FROM public.partner_patient_links l
   JOIN public.partner_orgs o ON o.id = l.org_id AND o.status = 'active'
   JOIN public.profiles p ON p.id = l.patient_user_id
   WHERE l.patient_user_id = auth.uid() AND l.status = 'joined'
   ORDER BY l.joined_at DESC NULLS LAST LIMIT 1)
  UNION ALL
  (SELECT o.name, o.logo_url, p.comped_plan, p.comped_until, 'partner_staff'::text
   FROM public.partner_members m
   JOIN public.partner_orgs o ON o.id = m.org_id AND o.status = 'active' AND o.staff_full_access
   JOIN public.profiles p ON p.id = m.user_id
   WHERE m.user_id = auth.uid() AND m.status = 'active'
     AND NOT EXISTS (SELECT 1 FROM public.partner_patient_links x WHERE x.patient_user_id = auth.uid() AND x.status = 'joined')
   ORDER BY m.joined_at DESC NULLS LAST LIMIT 1);
$$;
GRANT EXECUTE ON FUNCTION public.get_my_partner_sponsorship() TO authenticated;

-- Staff of a partner with staff_full_access get the partner's plan until its end date when they join.
CREATE OR REPLACE FUNCTION public.partner_claim(_user_id uuid, _email text, _email_verified boolean, _slug text, _token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  org public.partner_orgs%ROWTYPE;
  link public.partner_patient_links%ROWTYPE;
  staff_joined integer := 0;
  seats_used integer;
  new_until timestamptz;
  staff_until timestamptz;
  staff_plan text;
BEGIN
  IF _email_verified AND _email IS NOT NULL THEN
    UPDATE public.partner_members m SET user_id = _user_id, status = 'active', joined_at = now(), updated_at = now()
    WHERE lower(m.invited_email) = lower(_email) AND m.status = 'invited' AND m.user_id IS NULL
      AND NOT EXISTS (SELECT 1 FROM public.partner_members x WHERE x.org_id = m.org_id AND x.user_id = _user_id);
    GET DIAGNOSTICS staff_joined = ROW_COUNT;
  END IF;

  SELECT o.sponsored_plan, public.partner_sponsorship_expiry(o.sponsor_until) INTO staff_plan, staff_until
  FROM public.partner_members m JOIN public.partner_orgs o ON o.id = m.org_id
  WHERE m.user_id = _user_id AND m.status = 'active' AND o.status = 'active' AND o.staff_full_access AND o.sponsor_until IS NOT NULL
  ORDER BY o.sponsor_until DESC LIMIT 1;
  IF staff_until IS NOT NULL AND staff_until > now() THEN
    UPDATE public.profiles SET comped_plan = staff_plan, comped_until = staff_until, updated_at = now()
    WHERE id = _user_id AND (comped_until IS NULL OR comped_until < staff_until);
  END IF;

  IF NULLIF(_token, '') IS NOT NULL THEN
    SELECT * INTO link FROM public.partner_patient_links WHERE invite_token = _token;
    IF link.id IS NULL THEN RETURN jsonb_build_object('status','invalid_invite','staff_joined',staff_joined); END IF;
    SELECT * INTO org FROM public.partner_orgs WHERE id = link.org_id;
  ELSIF NULLIF(_slug, '') IS NOT NULL THEN
    SELECT * INTO org FROM public.partner_orgs WHERE slug = lower(trim(_slug));
  ELSE
    RETURN jsonb_build_object('status','none','staff_joined',staff_joined);
  END IF;

  IF org.id IS NULL OR org.status <> 'active' THEN
    RETURN jsonb_build_object('status','partner_unavailable','staff_joined',staff_joined);
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(org.id::text, 7));

  IF EXISTS (SELECT 1 FROM public.partner_patient_links WHERE org_id = org.id AND patient_user_id = _user_id) THEN
    RETURN jsonb_build_object('status','already_joined','partner',org.name,'staff_joined',staff_joined);
  END IF;

  IF link.id IS NOT NULL AND (link.status = 'revoked' OR link.patient_user_id IS NOT NULL) THEN
    link := NULL;
  END IF;

  SELECT count(*) INTO seats_used FROM public.partner_patient_links WHERE org_id = org.id AND patient_user_id IS NOT NULL;
  IF seats_used >= org.seat_limit THEN
    RETURN jsonb_build_object('status','seats_full','partner',org.name,'staff_joined',staff_joined);
  END IF;

  IF link.id IS NULL AND _email_verified AND _email IS NOT NULL THEN
    SELECT * INTO link FROM public.partner_patient_links
    WHERE org_id = org.id AND patient_user_id IS NULL AND status = 'invited' AND lower(invited_email) = lower(_email)
    ORDER BY created_at DESC LIMIT 1;
  END IF;

  IF link.id IS NOT NULL THEN
    UPDATE public.partner_patient_links SET patient_user_id = _user_id, status = 'joined', joined_at = now() WHERE id = link.id;
  ELSE
    INSERT INTO public.partner_patient_links (org_id, patient_user_id, invited_email, status, source, joined_at)
    VALUES (org.id, _user_id, lower(_email), 'joined', 'link', now());
  END IF;

  new_until := COALESCE(public.partner_sponsorship_expiry(org.sponsor_until), now() + interval '12 months');
  UPDATE public.profiles SET comped_plan = org.sponsored_plan, comped_until = new_until, updated_at = now()
  WHERE id = _user_id AND (comped_until IS NULL OR comped_until < new_until);

  INSERT INTO public.platform_events (event_type, user_id, actor_user_id, details_json)
  VALUES ('partner_patient_joined', _user_id, _user_id, jsonb_build_object('org_id', org.id));

  RETURN jsonb_build_object('status','joined','partner',org.name,'staff_joined',staff_joined);
END;
$function$;
