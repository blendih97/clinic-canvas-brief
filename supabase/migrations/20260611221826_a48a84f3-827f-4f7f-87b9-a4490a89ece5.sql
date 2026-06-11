CREATE TABLE public.clinic_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  organisation text,
  role text,
  patients_per_month text,
  message text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.clinic_enquiries TO service_role;

ALTER TABLE public.clinic_enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view clinic enquiries"
  ON public.clinic_enquiries
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update clinic enquiries"
  ON public.clinic_enquiries
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, UPDATE ON public.clinic_enquiries TO authenticated;