-- Create group_conversations table
CREATE TABLE public.group_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group_members table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.group_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Modify messages table to optionally reference group conversations
ALTER TABLE public.messages 
ADD COLUMN group_conversation_id UUID REFERENCES public.group_conversations(id) ON DELETE CASCADE;

-- Add constraint to ensure message belongs to either conversation or group
ALTER TABLE public.messages 
ADD CONSTRAINT messages_conversation_check 
CHECK (
  (conversation_id IS NOT NULL AND group_conversation_id IS NULL) OR
  (conversation_id IS NULL AND group_conversation_id IS NOT NULL)
);

-- Enable RLS
ALTER TABLE public.group_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Group conversations policies
CREATE POLICY "Group members can view group conversations" 
ON public.group_conversations FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = id AND user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can create group conversations" 
ON public.group_conversations FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Group members policies
CREATE POLICY "Group members can view group membership" 
ON public.group_members FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Group creators can add members" 
ON public.group_members FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_conversations 
    WHERE id = group_id AND created_by = auth.uid()
  )
);

CREATE POLICY "Users can leave groups" 
ON public.group_members FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Update messages policies for group conversations
CREATE POLICY "Group members can view group messages" 
ON public.messages FOR SELECT 
TO authenticated
USING (
  (conversation_id IS NOT NULL AND 
   EXISTS (
     SELECT 1 FROM public.conversations 
     WHERE id = conversation_id 
     AND auth.uid() IN (participant_1, participant_2)
   )) OR
  (group_conversation_id IS NOT NULL AND
   EXISTS (
     SELECT 1 FROM public.group_members 
     WHERE group_id = group_conversation_id AND user_id = auth.uid()
   ))
);

CREATE POLICY "Group members can send group messages" 
ON public.messages FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  ((conversation_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE id = conversation_id 
      AND auth.uid() IN (participant_1, participant_2)
    )) OR
   (group_conversation_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = group_conversation_id AND user_id = auth.uid()
    )))
);

-- Drop old messages policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

-- Add indexes for performance
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX idx_messages_group_conversation_id ON public.messages(group_conversation_id);