DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'app_role' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.ensure_default_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_default_user_role_on_profile ON public.profiles;
CREATE TRIGGER ensure_default_user_role_on_profile
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.ensure_default_user_role();

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS comped_plan TEXT,
  ADD COLUMN IF NOT EXISTS comped_until TIMESTAMPTZ;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS original_language TEXT,
  ADD COLUMN IF NOT EXISTS processing_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS processing_error TEXT,
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin actions" ON public.admin_actions;
CREATE POLICY "Admins can view admin actions"
ON public.admin_actions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert admin actions" ON public.admin_actions;
CREATE POLICY "Admins can insert admin actions"
ON public.admin_actions
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = admin_user_id);

CREATE TABLE IF NOT EXISTS public.platform_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view platform events" ON public.platform_events;
CREATE POLICY "Admins can view platform events"
ON public.platform_events
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins and service role can insert platform events" ON public.platform_events;
CREATE POLICY "Admins and service role can insert platform events"
ON public.platform_events
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.log_profile_signup_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.platform_events (event_type, user_id, actor_user_id, details_json)
  VALUES (
    'user_signup',
    NEW.id,
    NEW.id,
    jsonb_build_object(
      'full_name', NEW.full_name,
      'plan', NEW.plan,
      'created_at', NEW.created_at
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_profile_signup_event ON public.profiles;
CREATE TRIGGER log_profile_signup_event
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.log_profile_signup_event();

CREATE TABLE IF NOT EXISTS public.admin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  default_trial_days INTEGER NOT NULL DEFAULT 14,
  ai_model TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
  announcement_sender_name TEXT,
  announcement_reply_to TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_settings_single_row CHECK (id = 1)
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin settings" ON public.admin_settings;
CREATE POLICY "Admins can view admin settings"
ON public.admin_settings
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update admin settings" ON public.admin_settings;
CREATE POLICY "Admins can update admin settings"
ON public.admin_settings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert admin settings" ON public.admin_settings;
CREATE POLICY "Admins can insert admin settings"
ON public.admin_settings
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.admin_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Admins can view all alerts" ON public.alerts;
CREATE POLICY "Admins can view all alerts"
ON public.alerts
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all allergies" ON public.allergies;
CREATE POLICY "Admins can view all allergies"
ON public.allergies
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all blood results" ON public.blood_results;
CREATE POLICY "Admins can view all blood results"
ON public.blood_results
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all documents" ON public.documents;
CREATE POLICY "Admins can view all documents"
ON public.documents
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all imaging results" ON public.imaging_results;
CREATE POLICY "Admins can view all imaging results"
ON public.imaging_results
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all medications" ON public.medications;
CREATE POLICY "Admins can view all medications"
ON public.medications
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all shared briefs" ON public.shared_briefs;
CREATE POLICY "Admins can view all shared briefs"
ON public.shared_briefs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all family members" ON public.family_members;
CREATE POLICY "Admins can view all family members"
ON public.family_members
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all record requests" ON public.record_requests;
CREATE POLICY "Admins can view all record requests"
ON public.record_requests
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all media shares" ON public.media_shares;
CREATE POLICY "Admins can view all media shares"
ON public.media_shares
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'admin'::public.app_role
FROM public.profiles p
WHERE p.id IN (
  SELECT u.id
  FROM auth.users u
  WHERE lower(u.email) IN ('blendih.97@gmail.com', 'hello@rinvita.co.uk')
)
ON CONFLICT (user_id, role) DO NOTHING;