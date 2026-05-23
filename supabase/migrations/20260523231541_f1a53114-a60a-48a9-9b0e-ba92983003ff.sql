
-- 1. shared_briefs: add user_id ownership and enforce on insert
ALTER TABLE public.shared_briefs ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_shared_briefs_user_id ON public.shared_briefs(user_id);

DROP POLICY IF EXISTS "Authenticated users can insert shared briefs" ON public.shared_briefs;

CREATE POLICY "Users can insert own shared briefs"
ON public.shared_briefs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own shared briefs"
ON public.shared_briefs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. avatars bucket: allow users to delete their own avatar files
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
