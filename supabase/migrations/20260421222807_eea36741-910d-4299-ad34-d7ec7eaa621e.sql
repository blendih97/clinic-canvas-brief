-- Cache table for translated export payloads (24h TTL)
CREATE TABLE IF NOT EXISTS public.export_translation_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  data_hash text NOT NULL,
  target_language text NOT NULL,
  translated_payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE UNIQUE INDEX IF NOT EXISTS export_translation_cache_lookup
  ON public.export_translation_cache (user_id, target_language, data_hash);

CREATE INDEX IF NOT EXISTS export_translation_cache_expires
  ON public.export_translation_cache (expires_at);

ALTER TABLE public.export_translation_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own export cache"
  ON public.export_translation_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own export cache"
  ON public.export_translation_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own export cache"
  ON public.export_translation_cache FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages export cache"
  ON public.export_translation_cache FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');