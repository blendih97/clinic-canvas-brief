CREATE OR REPLACE FUNCTION public.user_has_paid_access_env(_user_id uuid, _environment text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
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
    );
$$;

CREATE OR REPLACE FUNCTION public.user_has_paid_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.user_has_paid_access_env(_user_id, 'live');
$$;

CREATE OR REPLACE FUNCTION public.user_plan_tier_owner(_owner_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = _owner_id AND s.environment = 'live'
      AND COALESCE(s.price_id, '') LIKE 'family%'
      AND (
        s.status IN ('active','trialing','past_due')
        OR (s.status = 'canceled' AND s.current_period_end IS NOT NULL
            AND s.current_period_end > now())
      )
  ) THEN 'family' ELSE 'free' END;
$$;

CREATE OR REPLACE FUNCTION public.user_plan_tier(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
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

CREATE OR REPLACE FUNCTION public.user_can_upload_document(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.user_has_paid_access(_user_id)
    OR (SELECT count(*) FROM public.documents d WHERE d.user_id = _user_id) < 3;
$$;

CREATE OR REPLACE FUNCTION public.enforce_document_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.user_can_upload_document(NEW.user_id) THEN
    RAISE EXCEPTION 'free_document_limit_reached'
      USING HINT = 'Upgrade to a paid plan for unlimited documents.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS documents_enforce_free_limit ON public.documents;
CREATE TRIGGER documents_enforce_free_limit
BEFORE INSERT ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.enforce_document_quota();

DROP POLICY IF EXISTS "Users can insert own shared briefs" ON public.shared_briefs;
CREATE POLICY "Paid users can insert own shared briefs"
ON public.shared_briefs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.user_has_paid_access(auth.uid()));

DROP POLICY IF EXISTS "Owners can invite family members" ON public.family_members;
DROP POLICY IF EXISTS "Users can insert own family members" ON public.family_members;
DROP POLICY IF EXISTS "Users can create family invites" ON public.family_members;
CREATE POLICY "Family plan owners can invite members"
ON public.family_members FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id AND public.user_plan_tier(auth.uid()) = 'family');

ALTER TABLE public.shared_briefs ADD COLUMN IF NOT EXISTS revoked_at timestamptz;
ALTER TABLE public.media_shares ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

CREATE OR REPLACE FUNCTION public.revoke_shared_brief(_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  acting uuid := auth.uid();
  affected int;
BEGIN
  IF acting IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  UPDATE public.shared_briefs
  SET revoked_at = now()
  WHERE token = _token AND user_id = acting AND revoked_at IS NULL;
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected > 0 THEN
    INSERT INTO public.platform_events (event_type, user_id, actor_user_id, details_json)
    VALUES ('share_brief_revoked', acting, acting, jsonb_build_object('token', _token));
  END IF;

  RETURN affected > 0;
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
  affected int;
BEGIN
  IF acting IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  UPDATE public.media_shares
  SET revoked_at = now()
  WHERE token = _token AND user_id = acting AND revoked_at IS NULL;
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected > 0 THEN
    INSERT INTO public.platform_events (event_type, user_id, actor_user_id, details_json)
    VALUES ('media_share_revoked', acting, acting, jsonb_build_object('token', _token));
  END IF;

  RETURN affected > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_shared_brief(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_media_share(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_upload_document(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_plan_tier(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_has_paid_access_env(uuid, text) TO authenticated, service_role;