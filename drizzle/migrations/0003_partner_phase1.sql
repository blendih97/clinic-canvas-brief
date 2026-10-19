CREATE TABLE public.partner_orgs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]([a-z0-9-]{0,58}[a-z0-9])?$'),
  type text NOT NULL DEFAULT 'clinic' CHECK (type IN ('clinic','concierge','other')),
  logo_url text,
  sponsored_plan text NOT NULL DEFAULT 'standard' CHECK (sponsored_plan IN ('standard','family')),
  seat_limit integer NOT NULL DEFAULT 50 CHECK (seat_limit >= 0),
  sponsor_until date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.partner_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.partner_orgs(id) ON DELETE CASCADE,
  user_id uuid,
  role text NOT NULL DEFAULT 'partner_staff' CHECK (role IN ('partner_admin','partner_staff')),
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','active','removed')),
  invited_email text NOT NULL,
  invited_by uuid,
  invited_at timestamptz NOT NULL DEFAULT now(),
  joined_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);
CREATE UNIQUE INDEX partner_members_org_email_idx ON public.partner_members (org_id, lower(invited_email));

CREATE TABLE public.partner_patient_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.partner_orgs(id) ON DELETE CASCADE,
  patient_user_id uuid,
  invited_email text,
  invite_token text NOT NULL UNIQUE DEFAULT (replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','')),
  invited_by uuid,
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','joined','revoked')),
  source text NOT NULL DEFAULT 'link' CHECK (source IN ('link','email_invite')),
  last_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  joined_at timestamptz
);
CREATE UNIQUE INDEX partner_links_org_patient_idx ON public.partner_patient_links (org_id, patient_user_id) WHERE patient_user_id IS NOT NULL;
CREATE INDEX partner_links_org_email_idx ON public.partner_patient_links (org_id, lower(invited_email));
CREATE INDEX partner_links_patient_idx ON public.partner_patient_links (patient_user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_orgs TO authenticated;
GRANT SELECT ON public.partner_members TO authenticated;
GRANT SELECT ON public.partner_patient_links TO authenticated;
GRANT ALL ON public.partner_orgs TO service_role;
GRANT ALL ON public.partner_members TO service_role;
GRANT ALL ON public.partner_patient_links TO service_role;

ALTER TABLE public.partner_orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_patient_links ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_partner_member(_user_id uuid, _org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.partner_members
    WHERE user_id = _user_id AND org_id = _org_id AND status = 'active');
$$;

CREATE OR REPLACE FUNCTION public.is_partner_admin(_user_id uuid, _org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.partner_members
    WHERE user_id = _user_id AND org_id = _org_id AND status = 'active' AND role = 'partner_admin');
$$;

CREATE POLICY "Members and admins read partner org" ON public.partner_orgs FOR SELECT TO authenticated
  USING (public.is_partner_member(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert partner orgs" ON public.partner_orgs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update partner orgs" ON public.partner_orgs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete partner orgs" ON public.partner_orgs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Org members and admins read members" ON public.partner_members FOR SELECT TO authenticated
  USING (public.is_partner_member(auth.uid(), org_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Org members and admins read patient links" ON public.partner_patient_links FOR SELECT TO authenticated
  USING (public.is_partner_member(auth.uid(), org_id) OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER partner_orgs_updated_at BEFORE UPDATE ON public.partner_orgs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public branded page lookup (active orgs only, minimal fields).
CREATE OR REPLACE FUNCTION public.get_public_partner(_slug text)
RETURNS TABLE(name text, slug text, logo_url text, type text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.name, o.slug, o.logo_url, o.type FROM public.partner_orgs o
  WHERE o.slug = lower(trim(_slug)) AND o.status = 'active' LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_public_partner(text) TO anon, authenticated;

-- Partner portal patient list: non-clinical fields only.
CREATE OR REPLACE FUNCTION public.get_partner_patients(_org_id uuid)
RETURNS TABLE(link_id uuid, full_name text, email text, status text, source text,
  invited_at timestamptz, joined_at timestamptz, last_sent_at timestamptz, last_active_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT (public.is_partner_member(auth.uid(), _org_id) OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
  SELECT l.id, NULLIF(p.full_name, ''), COALESCE(u.email::text, l.invited_email), l.status, l.source,
    l.created_at, l.joined_at, l.last_sent_at,
    NULLIF(GREATEST(
      COALESCE(p.last_active_at, '-infinity'::timestamptz),
      COALESCE(u.last_sign_in_at, '-infinity'::timestamptz),
      COALESCE((SELECT max(d.created_at) FROM public.documents d WHERE d.user_id = l.patient_user_id), '-infinity'::timestamptz)
    ), '-infinity'::timestamptz)
  FROM public.partner_patient_links l
  LEFT JOIN public.profiles p ON p.id = l.patient_user_id
  LEFT JOIN auth.users u ON u.id = l.patient_user_id
  WHERE l.org_id = _org_id
  ORDER BY l.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_partner_patients(uuid) TO authenticated;

-- Patient's own sponsorship (badge + billing copy).
CREATE OR REPLACE FUNCTION public.get_my_partner_sponsorship()
RETURNS TABLE(org_name text, logo_url text, comped_plan text, comped_until timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.name, o.logo_url, p.comped_plan, p.comped_until
  FROM public.partner_patient_links l
  JOIN public.partner_orgs o ON o.id = l.org_id AND o.status = 'active'
  JOIN public.profiles p ON p.id = l.patient_user_id
  WHERE l.patient_user_id = auth.uid() AND l.status = 'joined'
  ORDER BY l.joined_at DESC NULLS LAST LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_partner_sponsorship() TO authenticated;

-- Atomic claim, called only by the partner-claim edge function (service role).
CREATE OR REPLACE FUNCTION public.partner_claim(_user_id uuid, _email text, _email_verified boolean, _slug text, _token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  org public.partner_orgs%ROWTYPE;
  link public.partner_patient_links%ROWTYPE;
  staff_joined integer := 0;
  seats_used integer;
  new_until timestamptz;
BEGIN
  IF _email_verified AND _email IS NOT NULL THEN
    UPDATE public.partner_members m SET user_id = _user_id, status = 'active', joined_at = now(), updated_at = now()
    WHERE lower(m.invited_email) = lower(_email) AND m.status = 'invited' AND m.user_id IS NULL
      AND NOT EXISTS (SELECT 1 FROM public.partner_members x WHERE x.org_id = m.org_id AND x.user_id = _user_id);
    GET DIAGNOSTICS staff_joined = ROW_COUNT;
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

  -- Already linked to this org? Idempotent.
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

  new_until := COALESCE((org.sponsor_until + 1)::timestamptz, now() + interval '12 months');
  UPDATE public.profiles SET comped_plan = org.sponsored_plan, comped_until = new_until, updated_at = now()
  WHERE id = _user_id AND (comped_until IS NULL OR comped_until < new_until);

  INSERT INTO public.platform_events (event_type, user_id, actor_user_id, details_json)
  VALUES ('partner_patient_joined', _user_id, _user_id, jsonb_build_object('org_id', org.id));

  RETURN jsonb_build_object('status','joined','partner',org.name,'staff_joined',staff_joined);
END;
$$;
REVOKE ALL ON FUNCTION public.partner_claim(uuid, text, boolean, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.partner_claim(uuid, text, boolean, text, text) TO service_role;