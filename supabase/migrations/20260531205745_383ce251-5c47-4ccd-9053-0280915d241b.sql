-- Leads captured from the free public translate tool
CREATE TABLE public.translate_tool_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  source TEXT,
  consent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_translate_tool_leads_created_at ON public.translate_tool_leads (created_at DESC);

GRANT ALL ON public.translate_tool_leads TO service_role;

ALTER TABLE public.translate_tool_leads ENABLE ROW LEVEL SECURITY;

-- Admin-only read access
CREATE POLICY "Admins can view translate tool leads"
  ON public.translate_tool_leads
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- B2B enquiries from the For Clinics page
CREATE TABLE public.b2b_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  practice_name TEXT,
  practice_type TEXT,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_b2b_enquiries_created_at ON public.b2b_enquiries (created_at DESC);

GRANT ALL ON public.b2b_enquiries TO service_role;

ALTER TABLE public.b2b_enquiries ENABLE ROW LEVEL SECURITY;

-- Admin-only read access
CREATE POLICY "Admins can view b2b enquiries"
  ON public.b2b_enquiries
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));