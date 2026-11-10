-- Demo links can carry the prospective partner's branding (name, logo, tagline),
-- so they see the demo patient as their own patients would.
ALTER TABLE public.demo_links
  ADD COLUMN IF NOT EXISTS brand_name text CHECK (brand_name IS NULL OR length(brand_name) <= 120),
  ADD COLUMN IF NOT EXISTS brand_logo_url text CHECK (brand_logo_url IS NULL OR brand_logo_url ~ '^https://'),
  ADD COLUMN IF NOT EXISTS brand_tagline text CHECK (brand_tagline IS NULL OR length(brand_tagline) <= 120);