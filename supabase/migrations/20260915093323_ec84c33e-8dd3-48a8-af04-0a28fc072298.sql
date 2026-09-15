CREATE TABLE public.translate_tool_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  source_language text,
  target_language text,
  document_type text,
  landing_path text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  succeeded boolean NOT NULL DEFAULT false
);

GRANT ALL ON public.translate_tool_events TO service_role;

ALTER TABLE public.translate_tool_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view translator usage"
ON public.translate_tool_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX translate_tool_events_created_at_idx ON public.translate_tool_events (created_at DESC);