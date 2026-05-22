-- record_requests: remove permissive anon policies
DROP POLICY IF EXISTS "Anyone can view request by token" ON public.record_requests;
DROP POLICY IF EXISTS "Anon can update request status" ON public.record_requests;

-- shared_briefs: remove permissive anon SELECT and tighten INSERT to authenticated
DROP POLICY IF EXISTS "Anyone can select shared briefs by token" ON public.shared_briefs;
DROP POLICY IF EXISTS "Anyone can insert shared briefs" ON public.shared_briefs;

CREATE POLICY "Authenticated users can insert shared briefs"
ON public.shared_briefs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Storage: explicit owner-scoped UPDATE/DELETE on medical-documents
CREATE POLICY "Users can update own medical documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'medical-documents' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'medical-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own medical documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'medical-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);
