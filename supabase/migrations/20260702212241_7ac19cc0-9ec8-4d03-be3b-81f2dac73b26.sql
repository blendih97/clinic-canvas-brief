
-- Scope avatar storage policies to authenticated users
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Public lead-capture forms: allow anon+authenticated inserts.
-- Server-side edge functions still validate/rate-limit; RLS SELECT remains admin-only.
GRANT INSERT ON public.b2b_enquiries TO anon, authenticated;
CREATE POLICY "Anyone can submit a b2b enquiry" ON public.b2b_enquiries
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

GRANT INSERT ON public.clinic_enquiries TO anon, authenticated;
CREATE POLICY "Anyone can submit a clinic enquiry" ON public.clinic_enquiries
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

GRANT INSERT ON public.translate_tool_leads TO anon, authenticated;
CREATE POLICY "Anyone can submit a translate tool lead" ON public.translate_tool_leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
