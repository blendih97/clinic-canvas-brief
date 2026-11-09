-- DICOM imaging: whole scan studies (CT, MRI, X-ray, ultrasound...) stored in the patient's own
-- storage folder, viewed in RinVita's viewer, shared with doctors and downloadable for a clinic's PACS.
-- Files: medical-documents/<user_id>/dicom/<study_id>/<sop_uid>.dcm
-- Index: medical-documents/<user_id>/dicom/<study_id>/manifest.json (series and instances, in viewing order)

CREATE TABLE IF NOT EXISTS public.imaging_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,  -- the patient (auth user id); removed by delete-account
  study_uid text NOT NULL CHECK (length(study_uid) <= 128),
  title text CHECK (title IS NULL OR length(title) <= 200),
  description text CHECK (description IS NULL OR length(description) <= 200),
  modalities text[] NOT NULL DEFAULT '{}',
  body_part text CHECK (body_part IS NULL OR length(body_part) <= 80),
  study_date date,
  institution text CHECK (institution IS NULL OR length(institution) <= 200),
  accession text CHECK (accession IS NULL OR length(accession) <= 64),
  patient_name text CHECK (patient_name IS NULL OR length(patient_name) <= 200),
  series_count integer NOT NULL DEFAULT 0,
  instance_count integer NOT NULL DEFAULT 0,
  size_bytes bigint NOT NULL DEFAULT 0,
  volumetric boolean NOT NULL DEFAULT false,
  manifest_path text,
  key_image_path text,
  -- The radiology report this study goes with (optional, set by the patient).
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'patient' CHECK (source IN ('patient', 'request')),
  record_request_id uuid REFERENCES public.record_requests(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'ready', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, study_uid)
);

CREATE INDEX IF NOT EXISTS imaging_studies_user_idx ON public.imaging_studies (user_id, study_date DESC);

ALTER TABLE public.imaging_studies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner reads own studies" ON public.imaging_studies;
CREATE POLICY "Owner reads own studies" ON public.imaging_studies FOR SELECT USING (auth.uid() = user_id);

-- Patients add studies themselves only on a paid, sponsored or family plan.
-- (Studies sent by a hospital through a records request are added by the server.)
DROP POLICY IF EXISTS "Paid owner adds own studies" ON public.imaging_studies;
CREATE POLICY "Paid owner adds own studies" ON public.imaging_studies FOR INSERT
  WITH CHECK (auth.uid() = user_id AND source = 'patient' AND record_request_id IS NULL AND public.user_has_paid_access(user_id));

DROP POLICY IF EXISTS "Owner updates own studies" ON public.imaging_studies;
CREATE POLICY "Owner updates own studies" ON public.imaging_studies FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owner deletes own studies" ON public.imaging_studies;
CREATE POLICY "Owner deletes own studies" ON public.imaging_studies FOR DELETE USING (auth.uid() = user_id);

-- Storage paths must stay inside the owner's own study folder.
CREATE OR REPLACE FUNCTION public.imaging_study_paths_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE prefix text := NEW.user_id::text || '/dicom/' || NEW.id::text || '/';
BEGIN
  IF NEW.manifest_path IS NOT NULL AND left(NEW.manifest_path, length(prefix)) <> prefix THEN
    RAISE EXCEPTION 'manifest_path must be inside the study folder';
  END IF;
  IF NEW.key_image_path IS NOT NULL AND left(NEW.key_image_path, length(prefix)) <> prefix THEN
    RAISE EXCEPTION 'key_image_path must be inside the study folder';
  END IF;
  IF TG_OP = 'UPDATE' AND (NEW.user_id <> OLD.user_id OR NEW.source <> OLD.source OR NEW.record_request_id IS DISTINCT FROM OLD.record_request_id) THEN
    RAISE EXCEPTION 'owner and source cannot change';
  END IF;
  IF NEW.document_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.documents d WHERE d.id = NEW.document_id AND d.user_id = NEW.user_id) THEN
    RAISE EXCEPTION 'report must belong to the same patient';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS imaging_study_paths_guard ON public.imaging_studies;
CREATE TRIGGER imaging_study_paths_guard BEFORE INSERT OR UPDATE ON public.imaging_studies
  FOR EACH ROW EXECUTE FUNCTION public.imaging_study_paths_guard();

-- Access: signed-in users through RLS above; the server (service role) for hospital uploads and sharing.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.imaging_studies TO authenticated;
GRANT ALL ON public.imaging_studies TO service_role;
REVOKE ALL ON public.imaging_studies FROM anon;

-- Share links: which studies the patient chose to include (ids and a short summary only).
ALTER TABLE public.shared_briefs
  ADD COLUMN IF NOT EXISTS imaging_studies jsonb NOT NULL DEFAULT '[]'::jsonb;
