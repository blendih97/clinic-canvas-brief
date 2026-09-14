-- 1. Self-scope guard for access RPCs -------------------------------------
CREATE OR REPLACE FUNCTION public.assert_self_scope(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- auth.uid() IS NULL => service role / internal database execution.
  IF auth.uid() IS NULL OR auth.uid() = _user_id THEN
    RETURN true;
  END IF;
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN true;
  END IF;
  RAISE EXCEPTION 'forbidden_cross_user_access';
END;
$$;

REVOKE ALL ON FUNCTION public.assert_self_scope(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.user_has_paid_access_env(_user_id uuid, _environment text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.assert_self_scope(_user_id) AND (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.user_id = _user_id
        AND s.environment = _environment
        AND (
          s.status IN ('active','trialing','past_due')
          OR (s.status = 'canceled' AND s.current_period_end IS NOT NULL
              AND s.current_period_end > now())
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = _user_id
        AND p.comped_plan IS NOT NULL
        AND p.comped_until IS NOT NULL
        AND p.comped_until > now()
    )
    OR EXISTS (
      SELECT 1
      FROM public.family_members fm
      JOIN public.subscriptions s ON s.user_id = fm.owner_id
      WHERE fm.member_id = _user_id
        AND fm.status = 'accepted'
        AND s.environment = _environment
        AND (
          s.status IN ('active','trialing','past_due')
          OR (s.status = 'canceled' AND s.current_period_end IS NOT NULL
              AND s.current_period_end > now())
        )
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.user_plan_tier(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN NOT public.assert_self_scope(_user_id) THEN NULL
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
    ) THEN 'family'
    WHEN EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = _user_id AND p.comped_plan = 'family'
        AND p.comped_until IS NOT NULL AND p.comped_until > now()
    ) THEN 'family'
    WHEN public.user_plan_tier_owner(_user_id) = 'family' THEN 'family'
    WHEN EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.member_id = _user_id AND fm.status = 'accepted'
        AND public.user_plan_tier_owner(fm.owner_id) = 'family'
    ) THEN 'family'
    WHEN public.user_has_paid_access(_user_id) THEN 'standard'
    ELSE 'free'
  END;
$$;

-- Quota-eligible documents exclude failed audit rows.
CREATE OR REPLACE FUNCTION public.user_can_upload_document(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.assert_self_scope(_user_id) AND (
    public.user_has_paid_access(_user_id)
    OR (
      SELECT count(*) FROM public.documents d
      WHERE d.user_id = _user_id
        AND COALESCE(d.processing_status, 'completed') <> 'failed'
    ) < 3
  );
$$;

-- Internal family resolution only: not callable by end users.
REVOKE ALL ON FUNCTION public.user_plan_tier_owner(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_plan_tier_owner(uuid) TO service_role;

-- 2. Concurrency-safe quota trigger ---------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_document_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quota_used int;
BEGIN
  -- Failed audit rows must always be insertable, and never consume quota.
  IF COALESCE(NEW.processing_status, '') = 'failed' THEN
    RETURN NEW;
  END IF;

  -- Serialize concurrent uploads for this user until the transaction ends,
  -- so two simultaneous inserts cannot both see "2 of 3 used".
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::text, 42));

  IF public.user_has_paid_access(NEW.user_id) THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO quota_used
  FROM public.documents d
  WHERE d.user_id = NEW.user_id
    AND COALESCE(d.processing_status, 'completed') <> 'failed';

  IF quota_used >= 3 THEN
    RAISE EXCEPTION 'free_document_limit_reached'
      USING HINT = 'Upgrade to a paid plan for unlimited documents.';
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Revocation audit without raw tokens ----------------------------------
CREATE OR REPLACE FUNCTION public.revoke_shared_brief(_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  acting uuid := auth.uid();
  revoked_id uuid;
  revoked_time timestamptz;
BEGIN
  IF acting IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  UPDATE public.shared_briefs
  SET revoked_at = now()
  WHERE token = _token AND user_id = acting AND revoked_at IS NULL
  RETURNING id, revoked_at INTO revoked_id, revoked_time;

  IF revoked_id IS NOT NULL THEN
    -- Never log the token: it is the URL secret.
    INSERT INTO public.platform_events (event_type, user_id, actor_user_id, details_json)
    VALUES ('share_brief_revoked', acting, acting,
      jsonb_build_object('shared_brief_id', revoked_id, 'revoked_at', revoked_time));
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_media_share(_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  acting uuid := auth.uid();
  revoked_id uuid;
  revoked_time timestamptz;
BEGIN
  IF acting IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  UPDATE public.media_shares
  SET revoked_at = now()
  WHERE token = _token AND user_id = acting AND revoked_at IS NULL
  RETURNING id, revoked_at INTO revoked_id, revoked_time;

  IF revoked_id IS NOT NULL THEN
    INSERT INTO public.platform_events (event_type, user_id, actor_user_id, details_json)
    VALUES ('media_share_revoked', acting, acting,
      jsonb_build_object('media_share_id', revoked_id, 'revoked_at', revoked_time));
    RETURN true;
  END IF;

  RETURN false;
END;
$$;