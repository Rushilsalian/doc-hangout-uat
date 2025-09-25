-- Fix infinite recursion in RLS policy for group_members by using a SECURITY DEFINER helper
-- 1) Helper function that checks membership without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO anon, authenticated;

-- 2) Replace the recursive SELECT policy on group_members
DROP POLICY IF EXISTS "Members can view group members" ON public.group_members;

CREATE POLICY "Members can view group members"
ON public.group_members
FOR SELECT
USING (
  public.is_group_member(group_members.group_id, auth.uid())
);
