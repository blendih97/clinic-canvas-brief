
-- Create family_members table
CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  member_id UUID,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Owner can view their family members
CREATE POLICY "Owners can view their family members"
  ON public.family_members FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = member_id);

-- Owner can invite members
CREATE POLICY "Owners can invite family members"
  ON public.family_members FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Owner can remove members
CREATE POLICY "Owners can remove family members"
  ON public.family_members FOR DELETE
  USING (auth.uid() = owner_id);

-- Owner can update member status
CREATE POLICY "Owners can update family members"
  ON public.family_members FOR UPDATE
  USING (auth.uid() = owner_id OR auth.uid() = member_id);
