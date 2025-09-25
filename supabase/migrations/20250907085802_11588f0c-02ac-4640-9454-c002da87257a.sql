-- Fix infinite recursion in group_members RLS policies
-- Drop the problematic policies first
DROP POLICY IF EXISTS "Members can view group members" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;

-- Create corrected RLS policies for group_members
CREATE POLICY "Members can view group members" 
ON group_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM group_members gm2 
    WHERE gm2.group_id = group_members.group_id 
    AND gm2.user_id = auth.uid()
  )
);

CREATE POLICY "Users can join groups" 
ON group_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups" 
ON group_members 
FOR DELETE 
USING (auth.uid() = user_id);

-- Also fix the group_conversations policy that references group_members
DROP POLICY IF EXISTS "Members can view group conversations" ON group_conversations;

CREATE POLICY "Members can view group conversations" 
ON group_conversations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = group_conversations.id 
    AND group_members.user_id = auth.uid()
  )
);