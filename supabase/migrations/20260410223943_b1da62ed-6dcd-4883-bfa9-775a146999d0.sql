
CREATE TABLE public.shared_briefs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  scope TEXT,
  expires_at TIMESTAMPTZ,
  blood_results JSONB,
  medications JSONB,
  allergies JSONB,
  imaging_results JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert shared briefs"
ON public.shared_briefs
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can select shared briefs by token"
ON public.shared_briefs
FOR SELECT
TO anon, authenticated
USING (true);
