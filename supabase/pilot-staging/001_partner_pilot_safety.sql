BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

-- Refuse automatic classification of ambiguous historical complimentary grants.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles p WHERE p.comped_plan IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.partner_patient_links l WHERE l.patient_user_id=p.id)) THEN
    RAISE EXCEPTION 'legacy_partner_comp_review_required';
  END IF;
END $$;

ALTER TABLE public.shared_briefs ADD COLUMN IF NOT EXISTS consumed_at timestamptz;
ALTER TABLE public.shared_briefs ADD COLUMN IF NOT EXISTS recipient_hash text;

CREATE OR REPLACE FUNCTION public.consume_shared_brief(_token text, _recipient_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE b public.shared_briefs%ROWTYPE;
BEGIN
  IF _token IS NULL OR length(_token) NOT BETWEEN 16 AND 256
     OR _recipient_hash IS NULL OR _recipient_hash !~ '^[a-f0-9]{64}$' THEN
    RETURN NULL;
  END IF;
  -- Row lock serialises first claims against each other and revocations.
  SELECT * INTO b FROM public.shared_briefs WHERE token=_token FOR UPDATE;
  IF b.id IS NULL OR b.revoked_at IS NOT NULL OR b.expires_at IS NULL
     OR b.expires_at <= clock_timestamp() THEN RETURN NULL; END IF;
  IF b.recipient_hash IS NULL THEN
    UPDATE public.shared_briefs SET recipient_hash=_recipient_hash, consumed_at=clock_timestamp()
      WHERE id=b.id;
    INSERT INTO public.platform_events(event_type,user_id,details_json)
      VALUES('share_brief_consumed',b.user_id,jsonb_build_object('shared_brief_id',b.id));
  ELSIF b.recipient_hash <> _recipient_hash THEN RETURN NULL;
  END IF;
  RETURN jsonb_build_object('scope',b.scope,'expires_at',b.expires_at,'created_at',b.created_at,
    'blood_results',b.blood_results,'medications',b.medications,
    'allergies',b.allergies,'imaging_results',b.imaging_results);
END $$;
REVOKE ALL ON FUNCTION public.consume_shared_brief(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_shared_brief(text,text) TO service_role;

-- Partner grants have their own source: links + current organisation state.
-- Existing independent profile comp and paid subscriptions are untouched.
CREATE OR REPLACE FUNCTION public.partner_plan_tier(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT COALESCE((SELECT o.sponsored_plan FROM public.partner_patient_links l
    JOIN public.partner_orgs o ON o.id=l.org_id
    WHERE l.patient_user_id=_user_id AND l.status='joined' AND o.status='active'
      AND public.partner_sponsorship_expiry(o.sponsor_until)>now()
    ORDER BY (o.sponsored_plan='family') DESC LIMIT 1),'free');
$$;
REVOKE ALL ON FUNCTION public.partner_plan_tier(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.partner_plan_tier(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.is_partner_member(_user_id uuid,_org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.partner_members m JOIN public.partner_orgs o ON o.id=m.org_id
    WHERE m.user_id=_user_id AND m.org_id=_org_id AND m.status='active' AND o.status='active');
$$;
CREATE OR REPLACE FUNCTION public.is_partner_admin(_user_id uuid,_org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.partner_members m JOIN public.partner_orgs o ON o.id=m.org_id
    WHERE m.user_id=_user_id AND m.org_id=_org_id AND m.status='active'
      AND m.role='partner_admin' AND o.status='active');
$$;
CREATE OR REPLACE FUNCTION public.get_public_partner(_slug text)
RETURNS TABLE(name text,slug text,logo_url text,type text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT o.name,o.slug,o.logo_url,o.type FROM public.partner_orgs o
    WHERE o.slug=lower(trim(_slug)) AND o.status='active'
      AND public.partner_sponsorship_expiry(o.sponsor_until)>now() LIMIT 1;
$$;
CREATE OR REPLACE FUNCTION public.get_public_partner_by_invite(_token text)
RETURNS TABLE(name text,slug text,logo_url text,type text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT o.name,o.slug,o.logo_url,o.type FROM public.partner_orgs o
    JOIN public.partner_patient_links l ON l.org_id=o.id
    WHERE l.invite_token=_token AND _token ~ '^[a-f0-9]{64}$' AND l.status='invited'
      AND o.status='active' AND public.partner_sponsorship_expiry(o.sponsor_until)>now() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_partner_sponsorship()
RETURNS TABLE(org_name text,logo_url text,comped_plan text,comped_until timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT o.name,o.logo_url,o.sponsored_plan,public.partner_sponsorship_expiry(o.sponsor_until)
  FROM public.partner_patient_links l JOIN public.partner_orgs o ON o.id=l.org_id
  WHERE l.patient_user_id=auth.uid() AND l.status='joined' AND o.status='active'
    AND public.partner_sponsorship_expiry(o.sponsor_until)>now()
  ORDER BY (o.sponsored_plan='family') DESC, o.sponsor_until DESC LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_my_partner_sponsorship() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_my_partner_sponsorship() TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.partner_claim(_user_id uuid,_email text,_email_verified boolean,_slug text,_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE org public.partner_orgs%ROWTYPE; link public.partner_patient_links%ROWTYPE;
  existing public.partner_patient_links%ROWTYPE; staff_joined integer:=0; seats_used integer;
BEGIN
  IF _user_id IS NULL OR NOT COALESCE(_email_verified,false) THEN
    RETURN jsonb_build_object('status','email_verification_required');
  END IF;
  -- Token path is never allowed to fall back to a public slug claim.
  IF NULLIF(_token,'') IS NOT NULL THEN
    SELECT * INTO link FROM public.partner_patient_links WHERE invite_token=_token;
    IF link.id IS NULL THEN RETURN jsonb_build_object('status','invalid_invite'); END IF;
    SELECT * INTO org FROM public.partner_orgs WHERE id=link.org_id FOR UPDATE;
    SELECT * INTO link FROM public.partner_patient_links WHERE id=link.id FOR UPDATE;
    IF link.status='revoked' THEN RETURN jsonb_build_object('status','invite_revoked'); END IF;
    IF link.patient_user_id IS NOT NULL AND link.patient_user_id<>_user_id THEN
      RETURN jsonb_build_object('status','invite_used');
    END IF;
    IF link.status NOT IN ('invited','joined') THEN RETURN jsonb_build_object('status','invalid_invite'); END IF;
  ELSIF NULLIF(_slug,'') IS NOT NULL THEN
    SELECT * INTO org FROM public.partner_orgs WHERE slug=lower(trim(_slug)) FOR UPDATE;
  END IF;

  IF org.id IS NOT NULL AND (org.status<>'active' OR org.sponsor_until IS NULL
    OR public.partner_sponsorship_expiry(org.sponsor_until)<=clock_timestamp()) THEN
    RETURN jsonb_build_object('status','partner_unavailable');
  END IF;
  IF org.id IS NULL AND (NULLIF(_slug,'') IS NOT NULL OR NULLIF(_token,'') IS NOT NULL) THEN
    RETURN jsonb_build_object('status','partner_unavailable');
  END IF;

  WITH joined AS (
    UPDATE public.partner_members m SET user_id=_user_id,status='active',joined_at=now(),updated_at=now()
    WHERE lower(m.invited_email)=lower(_email) AND m.status='invited' AND m.user_id IS NULL
      AND EXISTS(SELECT 1 FROM public.partner_orgs o WHERE o.id=m.org_id AND o.status='active')
      AND NOT EXISTS(SELECT 1 FROM public.partner_members x WHERE x.org_id=m.org_id AND x.user_id=_user_id)
    RETURNING m.id,m.org_id
  ) INSERT INTO public.platform_events(event_type,user_id,actor_user_id,details_json)
    SELECT 'partner_staff_joined',_user_id,_user_id,jsonb_build_object('org_id',org_id,'member_id',id) FROM joined;
  GET DIAGNOSTICS staff_joined=ROW_COUNT;
  IF org.id IS NULL THEN RETURN jsonb_build_object('status','none','staff_joined',staff_joined); END IF;

  SELECT * INTO existing FROM public.partner_patient_links WHERE org_id=org.id AND patient_user_id=_user_id;
  IF existing.status='joined' THEN RETURN jsonb_build_object('status','already_joined','staff_joined',staff_joined); END IF;
  IF existing.status='revoked' THEN RETURN jsonb_build_object('status','sponsorship_revoked','staff_joined',staff_joined); END IF;
  SELECT count(*) INTO seats_used FROM public.partner_patient_links
    WHERE org_id=org.id AND patient_user_id IS NOT NULL AND status='joined';
  IF seats_used>=org.seat_limit THEN RETURN jsonb_build_object('status','seats_full','partner',org.name,'staff_joined',staff_joined); END IF;
  IF link.id IS NULL THEN
    SELECT * INTO link FROM public.partner_patient_links WHERE org_id=org.id
      AND patient_user_id IS NULL AND status='invited' AND lower(invited_email)=lower(_email)
      ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  END IF;
  IF link.id IS NULL THEN
    INSERT INTO public.partner_patient_links(org_id,patient_user_id,invited_email,status,source,joined_at)
      VALUES(org.id,_user_id,lower(_email),'joined','link',now());
  ELSE
    UPDATE public.partner_patient_links SET patient_user_id=_user_id,status='joined',joined_at=now() WHERE id=link.id;
  END IF;
  INSERT INTO public.platform_events(event_type,user_id,actor_user_id,details_json)
    VALUES('partner_patient_joined',_user_id,_user_id,jsonb_build_object('org_id',org.id));
  RETURN jsonb_build_object('status','joined','partner',org.name,'staff_joined',staff_joined);
END $$;
REVOKE ALL ON FUNCTION public.partner_claim(uuid,text,boolean,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.partner_claim(uuid,text,boolean,text,text) TO service_role;

-- Reuse the existing subscription rules verbatim, adding independent partner access.
DO $$ DECLARE body text; BEGIN
  SELECT pg_get_functiondef(oid) INTO body FROM pg_proc
    WHERE pronamespace='public'::regnamespace AND proname='user_has_paid_access_env';
  IF position('public.partner_plan_tier' IN body)=0 THEN
    body:=replace(body,'SELECT public.assert_self_scope(_user_id) AND (',
      'SELECT public.assert_self_scope(_user_id) AND (public.partner_plan_tier(_user_id) <> ''free'' OR ');
    IF position('public.partner_plan_tier' IN body)=0 THEN RAISE EXCEPTION 'unexpected_access_function'; END IF;
    EXECUTE body;
  END IF;
  SELECT pg_get_functiondef(oid) INTO body FROM pg_proc
    WHERE pronamespace='public'::regnamespace AND proname='user_plan_tier';
  IF position('public.partner_plan_tier' IN body)=0 THEN
    body:=replace(body,'WHEN public.user_plan_tier_owner(_user_id)',
      'WHEN public.partner_plan_tier(_user_id) = ''family'' THEN ''family'' WHEN public.user_plan_tier_owner(_user_id)');
    IF position('public.partner_plan_tier' IN body)=0 THEN RAISE EXCEPTION 'unexpected_tier_function'; END IF;
    EXECUTE body;
  END IF;
END $$;

-- Audit mutation and row change share the same transaction, so audit failure rolls back the mutation.
CREATE OR REPLACE FUNCTION public.audit_partner_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r jsonb; event text; actor uuid:=auth.uid();
BEGIN
  r:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
  event:=CASE WHEN TG_TABLE_NAME='partner_members' THEN
    CASE WHEN TG_OP='DELETE' OR r->>'status'='removed' THEN 'partner_staff_removed'
      WHEN r->>'status'='invited' THEN 'partner_staff_invited' ELSE 'partner_staff_updated' END
    WHEN TG_TABLE_NAME='partner_orgs' THEN 'partner_org_'||lower(TG_OP)
    ELSE 'partner_patient_link_'||lower(TG_OP) END;
  INSERT INTO public.platform_events(event_type,actor_user_id,details_json)
    VALUES(event,actor,jsonb_build_object('org_id',COALESCE(r->>'org_id',r->>'id'),'row_id',r->>'id','operation',TG_OP,'status',r->>'status'));
  RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
DROP TRIGGER IF EXISTS pilot_partner_members_audit ON public.partner_members;
CREATE TRIGGER pilot_partner_members_audit AFTER INSERT OR UPDATE OR DELETE ON public.partner_members
  FOR EACH ROW EXECUTE FUNCTION public.audit_partner_change();
DROP TRIGGER IF EXISTS pilot_partner_orgs_audit ON public.partner_orgs;
CREATE TRIGGER pilot_partner_orgs_audit AFTER INSERT OR UPDATE OR DELETE ON public.partner_orgs
  FOR EACH ROW EXECUTE FUNCTION public.audit_partner_change();
DROP TRIGGER IF EXISTS pilot_partner_links_audit ON public.partner_patient_links;
CREATE TRIGGER pilot_partner_links_audit AFTER INSERT OR UPDATE OR DELETE ON public.partner_patient_links
  FOR EACH ROW EXECUTE FUNCTION public.audit_partner_change();

CREATE OR REPLACE FUNCTION public.partner_staff_mutation(_org_id uuid,_action text,_email text DEFAULT NULL,_role text DEFAULT NULL,_member_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE actor uuid:=auth.uid(); target public.partner_members%ROWTYPE; assigned_role text;
BEGIN
  IF actor IS NULL OR NOT (public.has_role(actor,'admin') OR public.is_partner_admin(actor,_org_id)) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  PERFORM 1 FROM public.partner_orgs WHERE id=_org_id AND status='active' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'partner_unavailable'; END IF;
  IF _action='remove_staff' THEN
    SELECT * INTO target FROM public.partner_members WHERE id=_member_id AND org_id=_org_id FOR UPDATE;
    IF target.id IS NULL THEN RAISE EXCEPTION 'not_found'; END IF;
    IF target.user_id=actor AND NOT public.has_role(actor,'admin') THEN RAISE EXCEPTION 'cannot_remove_self'; END IF;
    DELETE FROM public.partner_members WHERE id=target.id;
    RETURN jsonb_build_object('ok',true);
  ELSIF _action='invite_staff' THEN
    IF _email IS NULL OR length(_email)>254 OR _email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
       OR COALESCE(_role,'partner_staff') NOT IN ('partner_admin','partner_staff') THEN RAISE EXCEPTION 'invalid_request'; END IF;
    assigned_role:=CASE WHEN NOT EXISTS(SELECT 1 FROM public.partner_members WHERE org_id=_org_id)
      THEN 'partner_admin' ELSE COALESCE(_role,'partner_staff') END;
    SELECT * INTO target FROM public.partner_members WHERE org_id=_org_id AND lower(invited_email)=lower(_email) FOR UPDATE;
    IF target.status='active' THEN RAISE EXCEPTION 'already_member'; END IF;
    IF target.id IS NULL THEN
      INSERT INTO public.partner_members(org_id,invited_email,role,invited_by)
        VALUES(_org_id,lower(trim(_email)),assigned_role,actor);
    ELSE
      UPDATE public.partner_members SET status='invited',user_id=NULL,role=assigned_role,invited_by=actor,invited_at=now() WHERE id=target.id;
    END IF;
    RETURN jsonb_build_object('ok',true,'role',assigned_role);
  END IF;
  RAISE EXCEPTION 'invalid_action';
END $$;
REVOKE ALL ON FUNCTION public.partner_staff_mutation(uuid,text,text,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.partner_staff_mutation(uuid,text,text,text,uuid) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.cleanup_partner_personal_data(_user_id uuid,_email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE n_links integer; n_members integer; removed_rows text[];
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'user_required'; END IF;
  SELECT array_agg(id::text) INTO removed_rows FROM (
    SELECT id FROM public.partner_patient_links WHERE patient_user_id=_user_id OR (patient_user_id IS NULL AND lower(invited_email)=lower(_email))
    UNION ALL SELECT id FROM public.partner_members WHERE user_id=_user_id OR (user_id IS NULL AND lower(invited_email)=lower(_email))
  ) rows;
  UPDATE public.platform_events SET details_json='{}'::jsonb
    WHERE details_json->>'row_id' IN (
      SELECT id::text FROM public.partner_patient_links WHERE patient_user_id=_user_id OR (patient_user_id IS NULL AND lower(invited_email)=lower(_email))
      UNION ALL SELECT id::text FROM public.partner_members WHERE user_id=_user_id OR (user_id IS NULL AND lower(invited_email)=lower(_email)));
  DELETE FROM public.partner_patient_links WHERE patient_user_id=_user_id
    OR (patient_user_id IS NULL AND lower(invited_email)=lower(_email));
  GET DIAGNOSTICS n_links=ROW_COUNT;
  DELETE FROM public.partner_members WHERE user_id=_user_id
    OR (user_id IS NULL AND lower(invited_email)=lower(_email));
  GET DIAGNOSTICS n_members=ROW_COUNT;
  UPDATE public.partner_patient_links SET invited_by=NULL WHERE invited_by=_user_id;
  UPDATE public.partner_members SET invited_by=NULL WHERE invited_by=_user_id;
  -- Remove personal identifiers from retained events referencing this user/member/link.
  UPDATE public.platform_events SET user_id=NULL,actor_user_id=NULL,details_json='{}'::jsonb
    WHERE user_id=_user_id OR actor_user_id=_user_id OR details_json->>'row_id'=ANY(removed_rows);
  INSERT INTO public.platform_events(event_type,details_json)
    VALUES('partner_account_cleanup',jsonb_build_object('links_removed',n_links,'members_removed',n_members));
END $$;
REVOKE ALL ON FUNCTION public.cleanup_partner_personal_data(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_partner_personal_data(uuid,text) TO service_role;
COMMIT;