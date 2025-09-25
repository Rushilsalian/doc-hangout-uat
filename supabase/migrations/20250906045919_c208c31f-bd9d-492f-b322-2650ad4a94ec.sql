-- Fix database schema issues and add missing functionality (Fixed)

-- Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rank TEXT DEFAULT 'Rookie';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add category column to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general' CHECK (category IN ('exam', 'second_opinion', 'non_medical', 'general'));

-- Create group conversations table
CREATE TABLE IF NOT EXISTS public.group_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create group members table  
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.group_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  role TEXT NOT NULL DEFAULT 'member',
  UNIQUE(group_id, user_id)
);

-- Add group_conversation_id to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS group_conversation_id UUID REFERENCES public.group_conversations(id) ON DELETE CASCADE;

-- Create trending posts view (without problematic index expression)
CREATE OR REPLACE VIEW public.trending_posts AS
SELECT 
  p.id,
  p.title,
  p.content,
  p.upvotes,
  p.category,
  p.created_at,
  pr.display_name as author_name,
  pr.rank as author_rank,
  c.name as community_name,
  (SELECT COUNT(*) FROM public.comments WHERE post_id = p.id) as comment_count,
  -- Simplified trending score calculation
  (p.upvotes * 2 + (SELECT COUNT(*) FROM public.comments WHERE post_id = p.id) * 1.5) as trending_score
FROM public.posts p
LEFT JOIN public.profiles pr ON p.author_id = pr.id
LEFT JOIN public.communities c ON p.community_id = c.id
WHERE p.status = 'published'
ORDER BY trending_score DESC;

-- Create leaderboard view
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  p.id,
  p.display_name,
  p.institution,
  p.rank,
  p.avatar_url,
  COALESCE(SUM(ka.points), 0) as total_karma
FROM public.profiles p
LEFT JOIN public.karma_activities ka ON p.id = ka.user_id
GROUP BY p.id, p.display_name, p.institution, p.rank, p.avatar_url
ORDER BY total_karma DESC;

-- Enable RLS for new tables
ALTER TABLE public.group_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for group conversations
CREATE POLICY "Members can view group conversations" 
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

CREATE POLICY "Group creators can update their groups" 
ON public.group_conversations FOR UPDATE 
TO authenticated
USING (auth.uid() = created_by);

-- RLS policies for group members
CREATE POLICY "Members can view group members" 
ON public.group_members FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm2 
    WHERE gm2.group_id = group_id AND gm2.user_id = auth.uid()
  )
);

CREATE POLICY "Users can join groups" 
ON public.group_members FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups" 
ON public.group_members FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Update messages policies to handle group messages
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" 
ON public.messages FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND 
  (
    (conversation_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE id = conversation_id 
      AND auth.uid() IN (participant_1, participant_2)
    )) OR
    (group_conversation_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = group_conversation_id 
      AND user_id = auth.uid()
    ))
  )
);

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations" 
ON public.messages FOR SELECT 
TO authenticated
USING (
  (conversation_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = conversation_id 
    AND auth.uid() IN (participant_1, participant_2)
  )) OR
  (group_conversation_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = group_conversation_id 
    AND user_id = auth.uid()
  ))
);

-- Add triggers for new tables
CREATE TRIGGER update_group_conversations_updated_at
  BEFORE UPDATE ON public.group_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create functions for karma calculation
CREATE OR REPLACE FUNCTION public.calculate_user_rank(user_karma INTEGER)
RETURNS TEXT AS $$
BEGIN
  CASE 
    WHEN user_karma >= 10000 THEN RETURN 'General';
    WHEN user_karma >= 5000 THEN RETURN 'Colonel';
    WHEN user_karma >= 2500 THEN RETURN 'Major';
    WHEN user_karma >= 1000 THEN RETURN 'Captain';
    WHEN user_karma >= 500 THEN RETURN 'Lieutenant';
    WHEN user_karma >= 100 THEN RETURN 'Sergeant';
    WHEN user_karma >= 50 THEN RETURN 'Corporal';
    WHEN user_karma >= 10 THEN RETURN 'Private';
    ELSE RETURN 'Rookie';
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to auto-update user rank
CREATE OR REPLACE FUNCTION public.update_user_rank()
RETURNS TRIGGER AS $$
DECLARE
  user_karma INTEGER;
  new_rank TEXT;
BEGIN
  -- Calculate total karma for user
  SELECT COALESCE(SUM(points), 0) INTO user_karma
  FROM public.karma_activities 
  WHERE user_id = NEW.user_id;
  
  -- Calculate new rank
  new_rank := public.calculate_user_rank(user_karma);
  
  -- Update user rank
  UPDATE public.profiles 
  SET rank = new_rank 
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-update ranks
CREATE TRIGGER update_user_rank_trigger
  AFTER INSERT OR UPDATE ON public.karma_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_user_rank();

-- Add some performance indexes
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_group_conversation_id ON public.messages(group_conversation_id);

-- Ensure default communities exist with proper data
INSERT INTO public.communities (name, description, icon_name, color) VALUES
  ('Cardiology', 'Heart conditions and cardiovascular medicine discussions', 'Heart', 'text-red-500'),
  ('Neurology', 'Brain and nervous system disorders', 'Brain', 'text-purple-500'),
  ('Radiology', 'Medical imaging and diagnostics', 'Eye', 'text-blue-500'),
  ('Orthopedics', 'Musculoskeletal system and bone health', 'Bone', 'text-orange-500'),
  ('Emergency Medicine', 'Critical care and emergency protocols', 'Zap', 'text-red-600'),
  ('Pediatrics', 'Child health and development', 'Baby', 'text-pink-500')
ON CONFLICT (name) DO NOTHING;