
-- Create record_requests table
CREATE TABLE public.record_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  provider_name text NOT NULL,
  provider_email text NOT NULL,
  request_description text NOT NULL,
  patient_name text NOT NULL DEFAULT '',
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days')
);

ALTER TABLE public.record_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests"
  ON public.record_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own requests"
  ON public.record_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own requests"
  ON public.record_requests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own requests"
  ON public.record_requests FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view request by token"
  ON public.record_requests FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update request status by token"
  ON public.record_requests FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Create media_shares table
CREATE TABLE public.media_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  file_path text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.media_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own media shares"
  ON public.media_shares FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own media shares"
  ON public.media_shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view media share by token"
  ON public.media_shares FOR SELECT
  TO anon, authenticated
  USING (true);
