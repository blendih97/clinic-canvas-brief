\set ON_ERROR_STOP on
-- Never execute fixture setup on the managed/shared database.
DO $$ BEGIN
  IF inet_server_port() IS DISTINCT FROM 55432 THEN RAISE EXCEPTION 'isolated_local_database_required'; END IF;
END $$;
BEGIN;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO authenticated,service_role;
GRANT USAGE ON SCHEMA public TO authenticated,service_role;
INSERT INTO auth.users(id,email) VALUES ('10000000-0000-0000-0000-000000000001','a@example.invalid'),('10000000-0000-0000-0000-000000000002','b@example.invalid');
INSERT INTO public.profiles(id) SELECT id FROM auth.users;
INSERT INTO public.partner_orgs(id,name,slug,seat_limit,sponsor_until,sponsored_plan) VALUES('20000000-0000-0000-0000-000000000001','FAKE TEST DATA','qa-local',1,current_date+14,'family');
DO $$ DECLARE r jsonb; BEGIN
 r:=public.partner_claim('10000000-0000-0000-0000-000000000001','a@example.invalid',true,'qa-local',NULL);
 IF r->>'status'<>'joined' THEN RAISE EXCEPTION 'claim failed %',r; END IF;
 r:=public.partner_claim('10000000-0000-0000-0000-000000000001','a@example.invalid',true,'qa-local',NULL);
 IF r->>'status'<>'already_joined' THEN RAISE EXCEPTION 'duplicate failed'; END IF;
 r:=public.partner_claim('10000000-0000-0000-0000-000000000002','b@example.invalid',true,'qa-local',NULL);
 IF r->>'status'<>'seats_full' THEN RAISE EXCEPTION 'seat cap failed'; END IF;
 IF NOT public.user_has_paid_access('10000000-0000-0000-0000-000000000001') THEN RAISE EXCEPTION 'access missing'; END IF;
 IF public.user_plan_tier('10000000-0000-0000-0000-000000000001')<>'family' THEN RAISE EXCEPTION 'tier wrong'; END IF;
END $$;
UPDATE public.partner_orgs SET status='suspended';
DO $$ BEGIN
 IF public.user_has_paid_access('10000000-0000-0000-0000-000000000001') THEN RAISE EXCEPTION 'suspended access persists'; END IF;
END $$;
INSERT INTO public.subscriptions(user_id,environment,stripe_customer_id,stripe_subscription_id,status,price_id) VALUES ('10000000-0000-0000-0000-000000000001','live','fake','fake','active','standard_annual');
DO $$ BEGIN
 IF NOT public.user_has_paid_access('10000000-0000-0000-0000-000000000001') THEN RAISE EXCEPTION 'paid access erased'; END IF;
END $$;
DELETE FROM public.subscriptions;
UPDATE public.profiles SET comped_plan='standard',comped_until=now()+interval '1 day' WHERE id='10000000-0000-0000-0000-000000000001';
DO $$ BEGIN
 IF NOT public.user_has_paid_access('10000000-0000-0000-0000-000000000001') THEN RAISE EXCEPTION 'independent comp erased'; END IF;
END $$;
UPDATE public.profiles SET comped_plan=NULL,comped_until=NULL;
UPDATE public.partner_orgs SET status='active',sponsor_until=current_date-1;
DO $$ BEGIN
 IF public.user_has_paid_access('10000000-0000-0000-0000-000000000001') THEN RAISE EXCEPTION 'expired access persists'; END IF;
END $$;
UPDATE public.partner_orgs SET sponsor_until=current_date+14;
UPDATE public.partner_patient_links SET status='revoked';
DO $$ DECLARE r jsonb; t text; BEGIN
 SELECT invite_token INTO t FROM public.partner_patient_links LIMIT 1;
 r:=public.partner_claim('10000000-0000-0000-0000-000000000002','b@example.invalid',true,'qa-local',t);
 IF r->>'status'<>'invite_revoked' THEN RAISE EXCEPTION 'revoked token accepted %',r; END IF;
 IF public.user_has_paid_access('10000000-0000-0000-0000-000000000001') THEN RAISE EXCEPTION 'revoked access persists'; END IF;
 r:=public.partner_claim('10000000-0000-0000-0000-000000000002','b@example.invalid',true,'qa-local',NULL);
 IF r->>'status'<>'joined' THEN RAISE EXCEPTION 'revoked seat not released'; END IF;
END $$;
INSERT INTO public.partner_members(org_id,user_id,invited_email,status) VALUES ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','a@example.invalid','active');
DELETE FROM public.partner_members;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.platform_events WHERE event_type='partner_staff_removed') THEN RAISE EXCEPTION 'missing staff audit'; END IF;
END $$;
INSERT INTO public.partner_members(org_id,user_id,invited_email,status,role) VALUES
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','a@example.invalid','active','partner_admin'),
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','b@example.invalid','active','partner_staff');
SELECT set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  BEGIN
    PERFORM public.partner_staff_mutation('20000000-0000-0000-0000-000000000001','invite_staff','fake@example.invalid','partner_admin',NULL);
    RAISE EXCEPTION 'staff_escalation_allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
SELECT public.partner_staff_mutation('20000000-0000-0000-0000-000000000001','invite_staff','fake@example.invalid','partner_staff',NULL);
RESET ROLE;
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.platform_events WHERE event_type='partner_staff_invited'
    AND actor_user_id='10000000-0000-0000-0000-000000000001') THEN RAISE EXCEPTION 'staff_audit_actor_missing'; END IF;
END $$;
SELECT set_config('request.jwt.claims','{}',true);
INSERT INTO public.shared_briefs(token,user_id,expires_at,blood_results) VALUES ('local-fake-test-token','10000000-0000-0000-0000-000000000001',now()+interval '1 hour','[{"marker":"FAKE","value":7.4}]');
DO $$ BEGIN
 IF public.consume_shared_brief('local-fake-test-token',repeat('a',64)) IS NULL THEN RAISE EXCEPTION 'first consume failed'; END IF;
 IF public.consume_shared_brief('local-fake-test-token',repeat('b',64)) IS NOT NULL THEN RAISE EXCEPTION 'second recipient leak'; END IF;
 IF public.consume_shared_brief('local-fake-test-token',repeat('a',64)) IS NULL THEN RAISE EXCEPTION 'session revalidation failed'; END IF;
END $$;
UPDATE public.shared_briefs SET revoked_at=now();
DO $$ BEGIN
 IF public.consume_shared_brief('local-fake-test-token',repeat('a',64)) IS NOT NULL THEN RAISE EXCEPTION 'revoked leak'; END IF;
END $$;
UPDATE public.shared_briefs SET revoked_at=NULL,expires_at=now()-interval '1 second';
DO $$ BEGIN
 IF public.consume_shared_brief('local-fake-test-token',repeat('a',64)) IS NOT NULL THEN RAISE EXCEPTION 'expired leak'; END IF;
END $$;
SELECT public.cleanup_partner_personal_data('10000000-0000-0000-0000-000000000001','a@example.invalid');
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.partner_patient_links WHERE patient_user_id='10000000-0000-0000-0000-000000000001') THEN RAISE EXCEPTION 'cleanup residual'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.partner_patient_links WHERE patient_user_id='10000000-0000-0000-0000-000000000002') THEN RAISE EXCEPTION 'cleanup crossed user boundary'; END IF;
END $$;
SELECT 'LOCAL_PARTNER_SAFETY_PASS';
ROLLBACK;
