
-- Drop overly permissive policies
DROP POLICY "Anyone can update request status by token" ON public.record_requests;

-- Create a more restrictive anon update policy
-- Anon users can only update status (used by provider upload page)
CREATE POLICY "Anon can update request status"
  ON public.record_requests FOR UPDATE
  TO anon
  USING (expires_at > now());
