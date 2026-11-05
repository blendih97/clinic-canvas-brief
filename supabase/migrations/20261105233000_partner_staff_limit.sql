-- Each partner can add a limited number of team members (besides its admin). Default 5, changeable per partner.
ALTER TABLE public.partner_orgs
  ADD COLUMN IF NOT EXISTS staff_limit integer NOT NULL DEFAULT 5 CHECK (staff_limit >= 0);
