
-- Function: returns true if a user has paid access either directly,
-- via being an admin, or via being an accepted family member of a
-- user with an active subscription.
CREATE OR REPLACE FUNCTION public.user_has_paid_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Admins always get full access
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'admin'
    )
    OR
    -- Direct active subscription
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.user_id = _user_id
        AND (
          s.status IN ('active','trialing','past_due')
          OR (s.status = 'canceled' AND s.current_period_end IS NOT NULL
              AND s.current_period_end > now())
        )
    )
    OR
    -- Accepted family member of an owner with an active subscription
    EXISTS (
      SELECT 1
      FROM public.family_members fm
      JOIN public.subscriptions s ON s.user_id = fm.owner_id
      WHERE fm.member_id = _user_id
        AND fm.status = 'accepted'
        AND (
          s.status IN ('active','trialing','past_due')
          OR (s.status = 'canceled' AND s.current_period_end IS NOT NULL
              AND s.current_period_end > now())
        )
    );
$$;

GRANT EXECUTE ON FUNCTION public.user_has_paid_access(uuid) TO authenticated;
