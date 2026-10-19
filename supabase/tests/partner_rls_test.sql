-- Cross-org isolation test for partner tables. Runs entirely inside one DO block
-- and always ends with RAISE EXCEPTION, so every row it creates is rolled back.
-- Result: the exception message starts with 'PARTNER_RLS_PASS' or 'PARTNER_RLS_FAIL'.
DO $$
DECLARE
  org_a uuid := gen_random_uuid();
  org_b uuid := gen_random_uuid();
  staff_a uuid := gen_random_uuid();
  staff_b uuid := gen_random_uuid();
  patient uuid := gen_random_uuid();
  n int;
  failures text := '';
BEGIN
  INSERT INTO public.partner_orgs (id, name, slug, seat_limit, sponsor_until) VALUES
    (org_a, 'Test Org A', 'rls-test-a-' || substr(org_a::text,1,8), 10, current_date + 30),
    (org_b, 'Test Org B', 'rls-test-b-' || substr(org_b::text,1,8), 10, current_date + 30);
  INSERT INTO public.partner_members (org_id, user_id, role, status, invited_email) VALUES
    (org_a, staff_a, 'partner_admin', 'active', 'a@test.invalid'),
    (org_b, staff_b, 'partner_admin', 'active', 'b@test.invalid');
  INSERT INTO public.partner_patient_links (org_id, patient_user_id, invited_email, status, source) VALUES
    (org_a, patient, 'p@test.invalid', 'joined', 'link'),
    (org_b, NULL, 'q@test.invalid', 'invited', 'email_invite');

  -- Act as staff of org A.
  PERFORM set_config('request.jwt.claims', json_build_object('sub', staff_a, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  SELECT count(*) INTO n FROM public.partner_orgs WHERE id IN (org_a, org_b);
  IF n <> 1 THEN failures := failures || format('orgs visible=%s; ', n); END IF;
  SELECT count(*) INTO n FROM public.partner_orgs WHERE id = org_b;
  IF n <> 0 THEN failures := failures || 'org B visible; '; END IF;
  SELECT count(*) INTO n FROM public.partner_members WHERE org_id = org_b;
  IF n <> 0 THEN failures := failures || 'org B members visible; '; END IF;
  SELECT count(*) INTO n FROM public.partner_patient_links WHERE org_id = org_b;
  IF n <> 0 THEN failures := failures || 'org B links visible; '; END IF;
  SELECT count(*) INTO n FROM public.partner_patient_links WHERE org_id = org_a;
  IF n <> 1 THEN failures := failures || 'own org link missing; '; END IF;

  BEGIN
    PERFORM * FROM public.get_partner_patients(org_b);
    failures := failures || 'get_partner_patients(org B) allowed; ';
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    UPDATE public.partner_orgs SET seat_limit = 999 WHERE id = org_a;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN failures := failures || 'partner staff could edit org; '; END IF;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    INSERT INTO public.partner_patient_links (org_id, invited_email) VALUES (org_a, 'x@test.invalid');
    failures := failures || 'direct link insert allowed; ';
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    PERFORM public.partner_claim(staff_a, 'a@test.invalid', true, 'x', NULL);
    failures := failures || 'partner_claim callable by authenticated; ';
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Act as staff of org B.
  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claims', json_build_object('sub', staff_b, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO n FROM public.partner_patient_links WHERE org_id = org_a;
  IF n <> 0 THEN failures := failures || 'org B staff sees org A links; '; END IF;

  -- Anonymous visitor: no table rows, public RPC returns only active orgs.
  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
  EXECUTE 'SET LOCAL ROLE anon';
  BEGIN
    SELECT count(*) INTO n FROM public.partner_orgs;
    IF n <> 0 THEN failures := failures || 'anon sees partner_orgs rows; '; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  EXECUTE 'RESET ROLE';
  UPDATE public.partner_orgs SET status = 'suspended' WHERE id = org_b;
  EXECUTE 'SET LOCAL ROLE anon';
  SELECT count(*) INTO n FROM public.get_public_partner('rls-test-b-' || substr(org_b::text,1,8));
  IF n <> 0 THEN failures := failures || 'suspended org public; '; END IF;
  SELECT count(*) INTO n FROM public.get_public_partner('rls-test-a-' || substr(org_a::text,1,8));
  IF n <> 1 THEN failures := failures || 'active org not public; '; END IF;
  EXECUTE 'RESET ROLE';

  IF failures = '' THEN
    RAISE EXCEPTION 'PARTNER_RLS_PASS';
  ELSE
    RAISE EXCEPTION 'PARTNER_RLS_FAIL: %', failures;
  END IF;
END $$;
