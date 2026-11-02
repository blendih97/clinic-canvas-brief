-- RinVita Imaging: DICOM vault, viewer and Share Brief imaging.
-- STAGED. Do not apply to the shared backend until explicitly approved.
-- Depends on supabase/pilot-staging/001_partner_pilot_safety.sql
-- (consume_shared_brief, recipient_hash) being applied first.
BEGIN;
SET LOCAL lock_timeout = '5s';

DO $$ BEGIN
  IF to_regprocedure('public.consume_shared_brief(text,text)') IS NULL THEN
    RAISE EXCEPTION 'imaging_requires_pilot_staging_001';
  END IF;
END $$;

-- ---------------------------------------------------------------- storage
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('imaging-originals', 'imaging-originals', false, 524288000)  -- 500 MB per object
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit;

-- Patients may upload only into their own folder: <user_id>/<batch>/<random>.
-- Reads for viewing go through the imaging-stream function, never public URLs.
DROP POLICY IF EXISTS "imaging owner insert" ON storage.objects;
CREATE POLICY "imaging owner insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'imaging-originals' AND (storage.foldername(name))[1] = auth.uid()::text);
-- Resumable (TUS) uploads need to read/update their own in-progress object.
DROP POLICY IF EXISTS "imaging owner select" ON storage.objects;
CREATE POLICY "imaging owner select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'imaging-originals' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "imaging owner update" ON storage.objects;
CREATE POLICY "imaging owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'imaging-originals' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------- tables
CREATE TABLE IF NOT EXISTS public.imaging_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'dicom' CHECK (kind IN ('dicom', 'image')),
  study_uid text,                        -- DICOM StudyInstanceUID (dicom only)
  label text NOT NULL,                   -- patient-friendly, e.g. "MRI Brain"
  label_auto boolean NOT NULL DEFAULT true, -- false once the patient renames it
  modalities text[] NOT NULL DEFAULT '{}',
  body_part text,
  description text,
  study_date date,
  institution text,
  series_count int NOT NULL DEFAULT 0,
  instance_count int NOT NULL DEFAULT 0,
  total_bytes bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'ready', 'partial', 'failed')),
  report_document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS imaging_studies_user_uid ON public.imaging_studies(user_id, study_uid) WHERE study_uid IS NOT NULL;
CREATE INDEX IF NOT EXISTS imaging_studies_user ON public.imaging_studies(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.imaging_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id uuid NOT NULL REFERENCES public.imaging_studies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  series_uid text NOT NULL,
  modality text,
  description text,
  series_number int,
  instance_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (study_id, series_uid)
);

CREATE TABLE IF NOT EXISTS public.imaging_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES public.imaging_series(id) ON DELETE CASCADE,
  study_id uuid NOT NULL REFERENCES public.imaging_studies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sop_uid text NOT NULL,
  instance_number int,
  number_of_frames int NOT NULL DEFAULT 1,
  transfer_syntax text,
  mime text NOT NULL DEFAULT 'application/dicom',
  storage_path text NOT NULL UNIQUE,
  size_bytes bigint NOT NULL,
  sha256 text NOT NULL,
  original_name text,                    -- sanitised, display only
  viewable boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (series_id, sop_uid)
);
CREATE INDEX IF NOT EXISTS imaging_instances_study ON public.imaging_instances(study_id);

-- Viewing sessions created when a Share Brief recipient opens imaging.
-- Only the SHA-256 of the session secret is stored.
CREATE TABLE IF NOT EXISTS public.imaging_view_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_brief_id uuid NOT NULL REFERENCES public.shared_briefs(id) ON DELETE CASCADE,
  session_hash text NOT NULL UNIQUE CHECK (session_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz
);

ALTER TABLE public.shared_briefs ADD COLUMN IF NOT EXISTS imaging_study_ids uuid[] NOT NULL DEFAULT '{}';
ALTER TABLE public.shared_briefs ADD COLUMN IF NOT EXISTS allow_imaging_download boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------- RLS
ALTER TABLE public.imaging_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imaging_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imaging_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imaging_view_sessions ENABLE ROW LEVEL SECURITY;

-- Owners read their own rows. All writes go through server functions.
DROP POLICY IF EXISTS "own studies read" ON public.imaging_studies;
CREATE POLICY "own studies read" ON public.imaging_studies FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "own studies label" ON public.imaging_studies;
CREATE POLICY "own studies label" ON public.imaging_studies FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "own series read" ON public.imaging_series;
CREATE POLICY "own series read" ON public.imaging_series FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "own instances read" ON public.imaging_instances;
CREATE POLICY "own instances read" ON public.imaging_instances FOR SELECT TO authenticated USING (user_id = auth.uid());
-- imaging_view_sessions: no client policies at all (service role only).

REVOKE ALL ON public.imaging_studies, public.imaging_series, public.imaging_instances, public.imaging_view_sessions FROM anon;
GRANT SELECT ON public.imaging_studies, public.imaging_series, public.imaging_instances TO authenticated;
-- Patients may only rename/relabel and attach a report; everything else is server-owned.
REVOKE UPDATE ON public.imaging_studies FROM authenticated;
GRANT UPDATE (label, label_auto, report_document_id) ON public.imaging_studies TO authenticated;
GRANT ALL ON public.imaging_studies, public.imaging_series, public.imaging_instances, public.imaging_view_sessions TO service_role;

-- A patient may only attach their own report document.
CREATE OR REPLACE FUNCTION public.imaging_check_report_owner() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.report_document_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.documents d WHERE d.id = NEW.report_document_id AND d.user_id = NEW.user_id) THEN
    RAISE EXCEPTION 'imaging_report_not_owned';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS imaging_check_report_owner ON public.imaging_studies;
CREATE TRIGGER imaging_check_report_owner BEFORE INSERT OR UPDATE ON public.imaging_studies
  FOR EACH ROW EXECUTE FUNCTION public.imaging_check_report_owner();

-- A Share Brief may only include the creator's own, ready imaging studies.
CREATE OR REPLACE FUNCTION public.imaging_check_brief_studies() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.imaging_study_ids IS DISTINCT FROM OLD.imaging_study_ids
       OR NEW.allow_imaging_download IS DISTINCT FROM OLD.allow_imaging_download THEN
      -- Scope is fixed at creation; an existing link can never be widened.
      RAISE EXCEPTION 'imaging_scope_immutable';
    END IF;
    RETURN NEW;  -- revocation / consumption updates pass straight through
  END IF;
  IF coalesce(array_length(NEW.imaging_study_ids, 1), 0) > 50 THEN
    RAISE EXCEPTION 'imaging_too_many_studies';
  END IF;
  IF EXISTS (
    SELECT 1 FROM unnest(NEW.imaging_study_ids) sid
    WHERE NOT EXISTS (SELECT 1 FROM public.imaging_studies s
                      WHERE s.id = sid AND s.user_id = NEW.user_id AND s.status IN ('ready', 'partial'))) THEN
    RAISE EXCEPTION 'imaging_study_not_owned';
  END IF;
  IF coalesce(array_length(NEW.imaging_study_ids, 1), 0) > 0 THEN
    INSERT INTO public.platform_events(event_type, user_id, actor_user_id, details_json)
    VALUES ('imaging_shared', NEW.user_id, NEW.user_id, jsonb_build_object(
      'shared_brief_id', NEW.id, 'study_count', array_length(NEW.imaging_study_ids, 1),
      'download_allowed', NEW.allow_imaging_download));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS imaging_check_brief_studies ON public.shared_briefs;
CREATE TRIGGER imaging_check_brief_studies BEFORE INSERT OR UPDATE ON public.shared_briefs
  FOR EACH ROW EXECUTE FUNCTION public.imaging_check_brief_studies();

-- ---------------------------------------------------------------- authorisation
-- Single gate for every image byte served to a Share Brief recipient.
-- Checks the session, the brief (revocation + expiry, every request) and scope.
CREATE OR REPLACE FUNCTION public.imaging_authorize_recipient(_session_hash text, _instance_id uuid, _purpose text)
RETURNS TABLE(storage_path text, mime text, size_bytes bigint, shared_brief_id uuid, owner_id uuid, study_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT i.storage_path, i.mime, i.size_bytes, b.id, b.user_id, i.study_id
  FROM public.imaging_view_sessions s
  JOIN public.shared_briefs b ON b.id = s.shared_brief_id
  JOIN public.imaging_instances i ON i.id = _instance_id AND i.user_id = b.user_id
  WHERE s.session_hash = _session_hash
    AND s.revoked_at IS NULL AND s.expires_at > clock_timestamp()
    AND b.revoked_at IS NULL AND b.expires_at > clock_timestamp()
    AND b.recipient_hash IS NOT NULL
    AND i.study_id = ANY (b.imaging_study_ids)
    AND (_purpose = 'view' OR (_purpose = 'download' AND b.allow_imaging_download))
$$;
REVOKE ALL ON FUNCTION public.imaging_authorize_recipient(text, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.imaging_authorize_recipient(text, uuid, text) TO service_role;

-- Creates a viewing session for the single recipient who claimed the brief.
-- Reuses consume_shared_brief, which is idempotent for the same recipient
-- (it does not "use up" the link again) and refuses any other recipient.
CREATE OR REPLACE FUNCTION public.imaging_start_recipient_session(_token text, _recipient_hash text, _session_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE brief jsonb; b public.shared_briefs%ROWTYPE; manifest jsonb;
BEGIN
  IF _session_hash IS NULL OR _session_hash !~ '^[a-f0-9]{64}$' THEN RETURN NULL; END IF;
  brief := public.consume_shared_brief(_token, _recipient_hash);
  IF brief IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO b FROM public.shared_briefs WHERE token = _token;
  IF coalesce(array_length(b.imaging_study_ids, 1), 0) = 0 THEN
    RETURN jsonb_build_object('studies', '[]'::jsonb, 'allow_download', false, 'expires_at', b.expires_at);
  END IF;
  -- Cap concurrent sessions per brief to limit abuse by the claimed recipient.
  IF (SELECT count(*) FROM public.imaging_view_sessions WHERE shared_brief_id = b.id
        AND revoked_at IS NULL AND expires_at > clock_timestamp()) >= 5 THEN
    UPDATE public.imaging_view_sessions SET revoked_at = clock_timestamp()
      WHERE id = (SELECT id FROM public.imaging_view_sessions WHERE shared_brief_id = b.id
                  AND revoked_at IS NULL ORDER BY created_at LIMIT 1);
  END IF;
  INSERT INTO public.imaging_view_sessions(shared_brief_id, session_hash, expires_at)
  VALUES (b.id, _session_hash, b.expires_at);
  INSERT INTO public.platform_events(event_type, user_id, details_json)
  VALUES ('imaging_view_session_started', b.user_id, jsonb_build_object('shared_brief_id', b.id));

  SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', st.id, 'label', st.label, 'study_date', st.study_date, 'modalities', st.modalities,
      'kind', st.kind, 'series_count', st.series_count, 'instance_count', st.instance_count,
      'total_bytes', st.total_bytes,
      'series', (SELECT coalesce(jsonb_agg(jsonb_build_object(
          'id', se.id, 'description', se.description, 'modality', se.modality, 'series_number', se.series_number,
          'instances', (SELECT coalesce(jsonb_agg(jsonb_build_object(
              'id', ins.id, 'frames', ins.number_of_frames, 'number', ins.instance_number,
              'mime', ins.mime, 'viewable', ins.viewable)
              ORDER BY ins.instance_number NULLS LAST, ins.created_at), '[]'::jsonb)
            FROM public.imaging_instances ins WHERE ins.series_id = se.id))
          ORDER BY se.series_number NULLS LAST, se.created_at), '[]'::jsonb)
        FROM public.imaging_series se WHERE se.study_id = st.id))
      ORDER BY st.study_date DESC NULLS LAST), '[]'::jsonb)
  INTO manifest
  FROM public.imaging_studies st
  WHERE st.id = ANY (b.imaging_study_ids) AND st.user_id = b.user_id;

  RETURN jsonb_build_object('studies', manifest, 'allow_download', b.allow_imaging_download,
                            'expires_at', b.expires_at);
END $$;
REVOKE ALL ON FUNCTION public.imaging_start_recipient_session(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.imaging_start_recipient_session(text, text, text) TO service_role;

-- Recompute study counters after registration or deletion.
CREATE OR REPLACE FUNCTION public.imaging_refresh_study(_study_id uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.imaging_series se SET instance_count =
    (SELECT count(*) FROM public.imaging_instances i WHERE i.series_id = se.id)
  WHERE se.study_id = _study_id;
  UPDATE public.imaging_studies st SET
    series_count = (SELECT count(*) FROM public.imaging_series se WHERE se.study_id = st.id),
    instance_count = (SELECT count(*) FROM public.imaging_instances i WHERE i.study_id = st.id),
    total_bytes = (SELECT coalesce(sum(size_bytes), 0) FROM public.imaging_instances i WHERE i.study_id = st.id),
    modalities = (SELECT coalesce(array_agg(DISTINCT se.modality) FILTER (WHERE se.modality IS NOT NULL), '{}')
                  FROM public.imaging_series se WHERE se.study_id = st.id),
    status = CASE WHEN EXISTS (SELECT 1 FROM public.imaging_instances i WHERE i.study_id = st.id AND NOT i.viewable)
                  THEN 'partial' ELSE 'ready' END,
    updated_at = now()
  WHERE st.id = _study_id;
$$;
REVOKE ALL ON FUNCTION public.imaging_refresh_study(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.imaging_refresh_study(uuid) TO service_role;

COMMIT;
