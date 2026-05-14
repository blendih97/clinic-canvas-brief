CREATE TABLE IF NOT EXISTS public.share_brief_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_share_brief_acceptances_token ON public.share_brief_acceptances(token);

ALTER TABLE public.share_brief_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view share acceptances"
ON public.share_brief_acceptances
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Service role can insert share acceptances"
ON public.share_brief_acceptances
FOR INSERT
WITH CHECK (auth.role() = 'service_role');