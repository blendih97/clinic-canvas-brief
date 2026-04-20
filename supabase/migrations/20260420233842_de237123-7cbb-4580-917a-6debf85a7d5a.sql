CREATE OR REPLACE FUNCTION public.get_admin_users(
  _search text DEFAULT NULL,
  _plan text DEFAULT NULL,
  _status text DEFAULT NULL,
  _limit integer DEFAULT 50
)
RETURNS TABLE(
  id uuid,
  full_name text,
  email text,
  plan text,
  created_at timestamptz,
  last_active_at timestamptz,
  trial_ends_at timestamptz,
  suspended_at timestamptz,
  suspended_reason text,
  comped_plan text,
  comped_until timestamptz,
  nationality text,
  document_count bigint,
  role public.app_role
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    NULLIF(p.full_name, '') AS full_name,
    u.email::text AS email,
    p.plan,
    p.created_at,
    p.last_active_at,
    p.trial_ends_at,
    p.suspended_at,
    p.suspended_reason,
    p.comped_plan,
    p.comped_until,
    p.nationality,
    COUNT(d.id)::bigint AS document_count,
    COALESCE(ur.role, 'user'::public.app_role) AS role
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN public.documents d ON d.user_id = p.id
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'admin'
  WHERE (
    _search IS NULL OR _search = '' OR
    COALESCE(p.full_name, '') ILIKE '%' || _search || '%' OR
    COALESCE(u.email::text, '') ILIKE '%' || _search || '%'
  )
    AND (_plan IS NULL OR _plan = '' OR p.plan = _plan)
    AND (
      _status IS NULL OR _status = '' OR
      (_status = 'active' AND p.suspended_at IS NULL) OR
      (_status = 'suspended' AND p.suspended_at IS NOT NULL) OR
      (_status = 'trial' AND p.plan = 'free' AND COALESCE(p.trial_ends_at, p.created_at + interval '14 days') >= now()) OR
      (_status = 'comped' AND p.comped_until IS NOT NULL AND p.comped_until >= now())
    )
  GROUP BY p.id, u.email, ur.role
  ORDER BY p.created_at DESC
  LIMIT GREATEST(COALESCE(_limit, 50), 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_activity(_limit integer DEFAULT 100)
RETURNS TABLE(
  id uuid,
  event_type text,
  created_at timestamptz,
  user_id uuid,
  actor_user_id uuid,
  details_json jsonb,
  user_name text,
  actor_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    e.id,
    e.event_type,
    e.created_at,
    e.user_id,
    e.actor_user_id,
    e.details_json,
    NULLIF(u.full_name, '') AS user_name,
    NULLIF(a.full_name, '') AS actor_name
  FROM public.platform_events e
  LEFT JOIN public.profiles u ON u.id = e.user_id
  LEFT JOIN public.profiles a ON a.id = e.actor_user_id
  ORDER BY e.created_at DESC
  LIMIT GREATEST(COALESCE(_limit, 100), 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_settings()
RETURNS TABLE(
  id integer,
  default_trial_days integer,
  ai_model text,
  announcement_sender_name text,
  announcement_reply_to text,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT s.id, s.default_trial_days, s.ai_model, s.announcement_sender_name, s.announcement_reply_to, s.updated_at
  FROM public.admin_settings s
  ORDER BY s.id ASC
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_user_state(
  _target_user_id uuid,
  _suspended boolean DEFAULT NULL,
  _suspended_reason text DEFAULT NULL,
  _trial_extension_days integer DEFAULT NULL,
  _comped_plan text DEFAULT NULL,
  _comped_until timestamptz DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  acting_admin uuid := auth.uid();
  updated_profile public.profiles%ROWTYPE;
BEGIN
  IF acting_admin IS NULL OR NOT public.has_role(acting_admin, 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF _target_user_id IS NULL THEN
    RAISE EXCEPTION 'target_user_required';
  END IF;

  UPDATE public.profiles
  SET
    suspended_at = CASE
      WHEN _suspended IS TRUE THEN now()
      WHEN _suspended IS FALSE THEN NULL
      ELSE suspended_at
    END,
    suspended_reason = CASE
      WHEN _suspended IS TRUE THEN NULLIF(_suspended_reason, '')
      WHEN _suspended IS FALSE THEN NULL
      ELSE suspended_reason
    END,
    trial_ends_at = CASE
      WHEN _trial_extension_days IS NOT NULL THEN GREATEST(COALESCE(trial_ends_at, now()), now()) + make_interval(days => _trial_extension_days)
      ELSE trial_ends_at
    END,
    comped_plan = CASE
      WHEN _comped_plan IS NOT NULL THEN NULLIF(_comped_plan, '')
      ELSE comped_plan
    END,
    comped_until = CASE
      WHEN _comped_plan IS NOT NULL THEN _comped_until
      ELSE comped_until
    END,
    updated_at = now()
  WHERE id = _target_user_id
  RETURNING * INTO updated_profile;

  IF updated_profile.id IS NULL THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  INSERT INTO public.admin_actions (action_type, admin_user_id, target_user_id, details_json)
  VALUES (
    'user_state_updated',
    acting_admin,
    _target_user_id,
    jsonb_build_object(
      'suspended', _suspended,
      'suspended_reason', _suspended_reason,
      'trial_extension_days', _trial_extension_days,
      'comped_plan', _comped_plan,
      'comped_until', _comped_until
    )
  );

  INSERT INTO public.platform_events (event_type, user_id, actor_user_id, details_json)
  VALUES (
    'admin_user_state_updated',
    _target_user_id,
    acting_admin,
    jsonb_build_object(
      'suspended', _suspended,
      'suspended_reason', _suspended_reason,
      'trial_extension_days', _trial_extension_days,
      'comped_plan', _comped_plan,
      'comped_until', _comped_until
    )
  );

  RETURN updated_profile;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_settings(
  _default_trial_days integer,
  _ai_model text,
  _announcement_sender_name text,
  _announcement_reply_to text
)
RETURNS public.admin_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  acting_admin uuid := auth.uid();
  updated_settings public.admin_settings%ROWTYPE;
BEGIN
  IF acting_admin IS NULL OR NOT public.has_role(acting_admin, 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.admin_settings
  SET
    default_trial_days = COALESCE(_default_trial_days, default_trial_days),
    ai_model = COALESCE(NULLIF(_ai_model, ''), ai_model),
    announcement_sender_name = _announcement_sender_name,
    announcement_reply_to = _announcement_reply_to,
    updated_at = now()
  WHERE id = 1
  RETURNING * INTO updated_settings;

  IF updated_settings.id IS NULL THEN
    INSERT INTO public.admin_settings (id, default_trial_days, ai_model, announcement_sender_name, announcement_reply_to)
    VALUES (1, COALESCE(_default_trial_days, 14), COALESCE(NULLIF(_ai_model, ''), 'google/gemini-2.5-pro'), _announcement_sender_name, _announcement_reply_to)
    RETURNING * INTO updated_settings;
  END IF;

  INSERT INTO public.admin_actions (action_type, admin_user_id, target_user_id, details_json)
  VALUES (
    'admin_settings_updated',
    acting_admin,
    NULL,
    jsonb_build_object(
      'default_trial_days', updated_settings.default_trial_days,
      'ai_model', updated_settings.ai_model,
      'announcement_sender_name', updated_settings.announcement_sender_name,
      'announcement_reply_to', updated_settings.announcement_reply_to
    )
  );

  INSERT INTO public.platform_events (event_type, user_id, actor_user_id, details_json)
  VALUES (
    'admin_settings_updated',
    NULL,
    acting_admin,
    jsonb_build_object(
      'default_trial_days', updated_settings.default_trial_days,
      'ai_model', updated_settings.ai_model,
      'announcement_sender_name', updated_settings.announcement_sender_name,
      'announcement_reply_to', updated_settings.announcement_reply_to
    )
  );

  RETURN updated_settings;
END;
$$;

CREATE OR REPLACE FUNCTION public.store_admin_recovery_codes(_codes text[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  acting_admin uuid := auth.uid();
  code text;
  inserted_count integer := 0;
BEGIN
  IF acting_admin IS NULL OR NOT public.has_role(acting_admin, 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  DELETE FROM public.admin_2fa_recovery WHERE user_id = acting_admin;

  FOREACH code IN ARRAY COALESCE(_codes, ARRAY[]::text[])
  LOOP
    IF NULLIF(trim(code), '') IS NOT NULL THEN
      INSERT INTO public.admin_2fa_recovery (user_id, encrypted_code, used)
      VALUES (acting_admin, trim(code), false);
      inserted_count := inserted_count + 1;
    END IF;
  END LOOP;

  INSERT INTO public.platform_events (event_type, user_id, actor_user_id, details_json)
  VALUES (
    'admin_2fa_recovery_regenerated',
    acting_admin,
    acting_admin,
    jsonb_build_object('count', inserted_count)
  );

  RETURN inserted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_admin_recovery_code(_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  acting_admin uuid := auth.uid();
  used_id uuid;
BEGIN
  IF acting_admin IS NULL OR NOT public.has_role(acting_admin, 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.admin_2fa_recovery
  SET used = true
  WHERE user_id = acting_admin
    AND used = false
    AND encrypted_code = trim(_code)
  RETURNING id INTO used_id;

  IF used_id IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO public.platform_events (event_type, user_id, actor_user_id, details_json)
  VALUES (
    'admin_2fa_recovery_used',
    acting_admin,
    acting_admin,
    jsonb_build_object('recovery_id', used_id)
  );

  RETURN true;
END;
$$;