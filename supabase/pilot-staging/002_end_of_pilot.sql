-- End of a partner-sponsored pilot: the patient chooses paid, free or closing their account.
-- STAGING CANDIDATE. Not applied to the shared backend until approved (see README.md).
-- Switched off by default: admin_settings.end_of_pilot_enabled = false.
BEGIN;
SET LOCAL lock_timeout = '5s';

-- 1. Off switch. Nothing changes for patients until this is turned on.
ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS end_of_pilot_enabled boolean NOT NULL DEFAULT false;

-- 2. The patient's choice. No choice is not a deletion request: a missing row simply means "no answer yet".
CREATE TABLE IF NOT EXISTS public.pilot_choices (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  choice text NOT NULL CHECK (choice IN ('paid', 'free')),
  chosen_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pilot_choices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner reads own pilot choice" ON public.pilot_choices;
CREATE POLICY "Owner reads own pilot choice" ON public.pilot_choices FOR SELECT USING (auth.uid() = user_id);
-- No insert/update/delete policies: writes go through record_pilot_choice().

-- 3. Account deletion jobs, so a failed step can be retried until everything is gone.
-- After completion the row keeps no personal data (user_id is cleared), only that a deletion finished and when.
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'failed', 'completed')),
  steps_done text[] NOT NULL DEFAULT '{}',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  source text NOT NULL DEFAULT 'settings' CHECK (source IN ('settings', 'end_of_pilot')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CHECK (status <> 'completed' OR user_id IS NULL)
);
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read deletion requests" ON public.account_deletion_requests;
CREATE POLICY "Admins read deletion requests" ON public.account_deletion_requests FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
-- Writes are service role only (close-account function).

-- 4. Partner personal data cleanup (same as 001_partner_pilot_safety.sql; repeated so this file stands alone).
CREATE OR REPLACE FUNCTION public.cleanup_partner_personal_data(_user_id uuid, _email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n_links integer; n_members integer; removed_rows text[];
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'user_required'; END IF;
  SELECT array_agg(id::text) INTO removed_rows FROM (
    SELECT id FROM public.partner_patient_links WHERE patient_user_id = _user_id OR (patient_user_id IS NULL AND lower(invited_email) = lower(_email))
    UNION ALL SELECT id FROM public.partner_members WHERE user_id = _user_id OR (user_id IS NULL AND lower(invited_email) = lower(_email))
  ) r;
  DELETE FROM public.partner_patient_links WHERE patient_user_id = _user_id OR (patient_user_id IS NULL AND lower(invited_email) = lower(_email));
  GET DIAGNOSTICS n_links = ROW_COUNT;
  DELETE FROM public.partner_members WHERE user_id = _user_id OR (user_id IS NULL AND lower(invited_email) = lower(_email));
  GET DIAGNOSTICS n_members = ROW_COUNT;
  UPDATE public.partner_patient_links SET invited_by = NULL WHERE invited_by = _user_id;
  UPDATE public.partner_members SET invited_by = NULL WHERE invited_by = _user_id;
  UPDATE public.platform_events SET user_id = NULL, actor_user_id = NULL, details_json = '{}'::jsonb
    WHERE user_id = _user_id OR actor_user_id = _user_id OR details_json->>'row_id' = ANY(removed_rows);
  INSERT INTO public.platform_events (event_type, details_json)
    VALUES ('partner_account_cleanup', jsonb_build_object('links_removed', n_links, 'members_removed', n_members));
END $$;
REVOKE ALL ON FUNCTION public.cleanup_partner_personal_data(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_partner_personal_data(uuid, text) TO service_role;

-- 4b. Every database row that belongs to the patient, removed in one transaction (all or nothing),
-- so a failure part-way leaves nothing half-deleted and the step can simply be run again.
-- Billing rows in public.subscriptions are kept (see Section 9 draft): they hold no health data.
CREATE OR REPLACE FUNCTION public.delete_user_rows(_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer; total integer := 0;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'user_required'; END IF;
  IF EXISTS (SELECT 1 FROM public.admin_actions WHERE admin_user_id = _user_id) THEN
    RAISE EXCEPTION 'admin_account_needs_manual_review';
  END IF;
  DELETE FROM public.share_brief_acceptances WHERE token IN (SELECT token FROM public.shared_briefs WHERE user_id = _user_id);
  GET DIAGNOSTICS n = ROW_COUNT; total := total + n;
  DELETE FROM public.imaging_studies WHERE user_id = _user_id;          GET DIAGNOSTICS n = ROW_COUNT; total := total + n;
  DELETE FROM public.imaging_link_overrides WHERE user_id = _user_id;   GET DIAGNOSTICS n = ROW_COUNT; total := total + n;
  DELETE FROM public.imaging_results WHERE user_id = _user_id;          GET DIAGNOSTICS n = ROW_COUNT; total := total + n;
  DELETE FROM public.blood_results WHERE user_id = _user_id;            GET DIAGNOSTICS n = ROW_COUNT; total := total + n;
  DELETE FROM public.medications WHERE user_id = _user_id;              GET DIAGNOSTICS n = ROW_COUNT; total := total + n;
  DELETE FROM public.allergies WHERE user_id = _user_id;                GET DIAGNOSTICS n = ROW_COUNT; total := total + n;
  DELETE FROM public.alerts WHERE user_id = _user_id;                   GET DIAGNOSTICS n = ROW_COUNT; total := total + n;
  DELETE FROM public.visits WHERE user_id = _user_id;                   GET DIAGNOSTICS n = ROW_COUNT; total := total + n;
  DELETE FROM public.export_translation_cache WHERE user_id = _user_id; GET DIAGNOSTICS n = ROW_COUNT; total := total + n;
  DELETE FROM public.media_shares WHERE user_id = _user_id;             GET DIAGNOSTICS n = ROW_COUNT; total := total + n;
  DELETE FROM public.shared_briefs WHERE user_id = _user_id;            GET DIAGNOSTICS n = ROW_COUNT; total := total + n;
  DELETE FROM public.record_requests WHERE user_id = _user_id;          GET DIAGNOSTICS n = ROW_COUNT; total := total + n;
  DELETE FROM public.family_members WHERE owner_id = _user_id OR member_id = _user_id; GET DIAGNOSTICS n = ROW_COUNT; total := total + n;
  DELETE FROM public.patient_insurance WHERE user_id = _user_id;        GET DIAGNOSTICS n = ROW_COUNT; total := total + n;
  DELETE FROM public.pilot_choices WHERE user_id = _user_id;            GET DIAGNOSTICS n = ROW_COUNT; total := total + n;
  DELETE FROM public.page_views WHERE user_id = _user_id;               GET DIAGNOSTICS n = ROW_COUNT; total := total + n;
  DELETE FROM public.platform_events WHERE user_id = _user_id OR actor_user_id = _user_id; GET DIAGNOSTICS n = ROW_COUNT; total := total + n;
  UPDATE public.admin_actions SET target_user_id = NULL, details_json = '{}'::jsonb WHERE target_user_id = _user_id;
  DELETE FROM public.admin_2fa_recovery WHERE user_id = _user_id;       GET DIAGNOSTICS n = ROW_COUNT; total := total + n;
  DELETE FROM public.user_roles WHERE user_id = _user_id;               GET DIAGNOSTICS n = ROW_COUNT; total := total + n;
  DELETE FROM public.documents WHERE user_id = _user_id;                GET DIAGNOSTICS n = ROW_COUNT; total := total + n;
  DELETE FROM public.profiles WHERE id = _user_id;                      GET DIAGNOSTICS n = ROW_COUNT; total := total + n;
  RETURN jsonb_build_object('rows_deleted', total);
END $$;
REVOKE ALL ON FUNCTION public.delete_user_rows(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_rows(uuid) TO service_role;

-- 5. What the signed-in patient sees about their pilot.
CREATE OR REPLACE FUNCTION public.get_my_pilot_status()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  enabled boolean;
  org record;
  prof record;
  paid boolean;
  docs integer;
  ch record;
  del record;
BEGIN
  IF uid IS NULL THEN RETURN NULL; END IF;
  SELECT COALESCE((SELECT end_of_pilot_enabled FROM public.admin_settings WHERE id = 1), false) INTO enabled;

  SELECT o.name, o.logo_url, o.sponsor_until INTO org
  FROM public.partner_patient_links l JOIN public.partner_orgs o ON o.id = l.org_id
  WHERE l.patient_user_id = uid AND l.status = 'joined'
  ORDER BY l.joined_at DESC NULLS LAST LIMIT 1;
  IF org.name IS NULL THEN
    RETURN jsonb_build_object('enabled', enabled, 'pilot_patient', false);
  END IF;

  SELECT comped_plan, comped_until INTO prof FROM public.profiles WHERE id = uid;
  -- Paid means the patient's own subscription (or a family owner's), not the sponsorship.
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.environment = 'live' AND (s.user_id = uid OR s.user_id IN (
      SELECT fm.owner_id FROM public.family_members fm WHERE fm.member_id = uid AND fm.status = 'accepted'))
      AND (s.status IN ('active', 'trialing', 'past_due')
           OR (s.status = 'canceled' AND s.current_period_end > now()))
  ) INTO paid;
  SELECT count(*) INTO docs FROM public.documents d
    WHERE d.user_id = uid AND coalesce(d.processing_status, 'completed') NOT IN ('failed', 'stored');
  SELECT choice, chosen_at INTO ch FROM public.pilot_choices WHERE user_id = uid;
  SELECT status, requested_at INTO del FROM public.account_deletion_requests WHERE user_id = uid;

  RETURN jsonb_build_object(
    'enabled', enabled,
    'pilot_patient', true,
    'partner', org.name,
    'partner_logo', org.logo_url,
    'ends_at', prof.comped_until,
    'ended', prof.comped_until IS NULL OR prof.comped_until <= now(),
    'ending_soon', prof.comped_until > now() AND prof.comped_until <= now() + interval '14 days',
    'paid', paid,
    'choice', ch.choice,
    'chosen_at', ch.chosen_at,
    'documents', docs,
    'free_limit', 3,
    'over_free_limit', docs > 3,
    'deletion_status', del.status
  );
END $$;
REVOKE ALL ON FUNCTION public.get_my_pilot_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_pilot_status() TO authenticated;

-- 6. Record "paid" (checkout started; access unlocks only when checkout succeeds) or "free".
CREATE OR REPLACE FUNCTION public.record_pilot_choice(_choice text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF _choice NOT IN ('paid', 'free') THEN RAISE EXCEPTION 'invalid_choice'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.partner_patient_links WHERE patient_user_id = uid AND status = 'joined') THEN
    RAISE EXCEPTION 'not_a_pilot_patient';
  END IF;
  INSERT INTO public.pilot_choices (user_id, choice, chosen_at) VALUES (uid, _choice, now())
  ON CONFLICT (user_id) DO UPDATE SET choice = EXCLUDED.choice, chosen_at = EXCLUDED.chosen_at;
  INSERT INTO public.platform_events (event_type, user_id, actor_user_id, details_json)
  VALUES ('pilot_choice_recorded', uid, uid, jsonb_build_object('choice', _choice));
  RETURN public.get_my_pilot_status();
END $$;
REVOKE ALL ON FUNCTION public.record_pilot_choice(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_pilot_choice(text) TO authenticated;

COMMIT;
