-- Read-only demo links: let a prospective partner explore a fictional patient's account
-- (e.g. Eleanor Morgan) without logging in. Only accounts listed in demo_accounts can ever be
-- exposed, each link can expire or be revoked, and opens are counted per link.
-- Both tables are server-only: no access for anon or signed-in users.

CREATE TABLE IF NOT EXISTS public.demo_accounts (
  user_id uuid PRIMARY KEY,
  label text NOT NULL CHECK (length(label) <= 120),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.demo_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE CHECK (length(token) >= 20),
  demo_user_id uuid NOT NULL REFERENCES public.demo_accounts(user_id) ON DELETE CASCADE,
  label text NOT NULL CHECK (length(label) <= 120),
  expires_at timestamptz,
  revoked_at timestamptz,
  view_count integer NOT NULL DEFAULT 0,
  last_viewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demo_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.demo_accounts FROM anon, authenticated;
REVOKE ALL ON public.demo_links FROM anon, authenticated;
GRANT ALL ON public.demo_accounts TO service_role;
GRANT ALL ON public.demo_links TO service_role;

-- Counts an open without a read-modify-write race.
CREATE OR REPLACE FUNCTION public.demo_link_opened(_token text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.demo_links SET view_count = view_count + 1, last_viewed_at = now() WHERE token = _token;
$$;
REVOKE ALL ON FUNCTION public.demo_link_opened(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.demo_link_opened(text) TO service_role;
