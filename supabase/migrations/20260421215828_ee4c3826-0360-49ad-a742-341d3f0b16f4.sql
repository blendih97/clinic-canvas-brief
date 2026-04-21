ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS content_original text,
  ADD COLUMN IF NOT EXISTS content_translated text,
  ADD COLUMN IF NOT EXISTS original_language_code text,
  ADD COLUMN IF NOT EXISTS translated_language_code text;