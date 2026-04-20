CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics()
RETURNS TABLE (
  total_users BIGINT,
  active_users BIGINT,
  trial_users BIGINT,
  paying_users BIGINT,
  mrr_gbp NUMERIC,
  churned_this_month BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  WITH profile_stats AS (
    SELECT
      COUNT(*)::BIGINT AS total_users,
      COUNT(*) FILTER (
        WHERE COALESCE(last_active_at, created_at) >= now() - interval '30 days'
          AND suspended_at IS NULL
      )::BIGINT AS active_users,
      COUNT(*) FILTER (
        WHERE plan = 'free'
          AND COALESCE(trial_ends_at, created_at + interval '14 days') >= now()
          AND suspended_at IS NULL
      )::BIGINT AS trial_users,
      COUNT(*) FILTER (
        WHERE plan IN ('standard', 'family')
          AND suspended_at IS NULL
          AND (comped_until IS NULL OR comped_until < now())
      )::BIGINT AS paying_users,
      COALESCE(SUM(
        CASE
          WHEN suspended_at IS NOT NULL THEN 0
          WHEN comped_until IS NOT NULL AND comped_until >= now() THEN 0
          WHEN plan = 'standard' THEN 39
          WHEN plan = 'family' THEN 89.99
          ELSE 0
        END
      ), 0)::NUMERIC AS mrr_gbp,
      COUNT(*) FILTER (
        WHERE suspended_at >= date_trunc('month', now())
      )::BIGINT AS churned_this_month
    FROM public.profiles
  )
  SELECT * FROM profile_stats;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_recent_signups(_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  country TEXT,
  plan TEXT,
  signup_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    p.id AS user_id,
    NULLIF(p.full_name, '') AS full_name,
    u.email::TEXT AS email,
    p.nationality AS country,
    p.plan,
    p.created_at AS signup_date
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC
  LIMIT GREATEST(COALESCE(_limit, 10), 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_recent_documents(_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  document_id UUID,
  user_id UUID,
  user_name TEXT,
  document_name TEXT,
  document_type TEXT,
  original_language TEXT,
  upload_date TIMESTAMPTZ,
  processing_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    d.id AS document_id,
    d.user_id,
    COALESCE(NULLIF(p.full_name, ''), 'Unknown user') AS user_name,
    d.name AS document_name,
    d.type AS document_type,
    COALESCE(d.original_language, d.country) AS original_language,
    d.created_at AS upload_date,
    d.processing_status
  FROM public.documents d
  LEFT JOIN public.profiles p ON p.id = d.user_id
  ORDER BY d.created_at DESC
  LIMIT GREATEST(COALESCE(_limit, 10), 1);
END;
$$;