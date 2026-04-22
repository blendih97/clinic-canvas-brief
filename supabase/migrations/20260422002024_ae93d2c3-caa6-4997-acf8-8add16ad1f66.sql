-- visits: structured clinical-encounter details extracted from clinical letters, discharge summaries, consultation notes, A&E records
CREATE TABLE public.visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  document_id uuid,
  visit_date text,
  facility_name text,
  facility_country text,
  reason_for_visit text,
  investigations_performed jsonb DEFAULT '[]'::jsonb,
  findings text,
  diagnosis text,
  medications_prescribed jsonb DEFAULT '[]'::jsonb,
  follow_up_recommendations jsonb DEFAULT '[]'::jsonb,
  original_lang text,
  source text NOT NULL DEFAULT 'ai',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_visits_user_id ON public.visits(user_id);
CREATE INDEX idx_visits_document_id ON public.visits(document_id);

ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own visits"
  ON public.visits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visits"
  ON public.visits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own visits"
  ON public.visits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own visits"
  ON public.visits FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all visits"
  ON public.visits FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_visits_updated_at
  BEFORE UPDATE ON public.visits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- imaging_link_overrides: user explicitly unlinked these two imaging rows so they are NOT auto-merged
CREATE TABLE public.imaging_link_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  imaging_id_a uuid NOT NULL,
  imaging_id_b uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, imaging_id_a, imaging_id_b)
);

CREATE INDEX idx_imaging_link_overrides_user_id ON public.imaging_link_overrides(user_id);

ALTER TABLE public.imaging_link_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own imaging overrides"
  ON public.imaging_link_overrides FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own imaging overrides"
  ON public.imaging_link_overrides FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own imaging overrides"
  ON public.imaging_link_overrides FOR DELETE
  USING (auth.uid() = user_id);