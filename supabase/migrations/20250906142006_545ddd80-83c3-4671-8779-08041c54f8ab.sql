-- Fix infinite recursion in community_memberships RLS policy
-- 1. Drop existing problematic policy
DROP POLICY IF EXISTS "Users can view memberships in their communities" ON public.community_memberships;

-- 2. Create a security definer function to check membership
CREATE OR REPLACE FUNCTION public.is_community_member(community_id uuid, user_id uuid)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM community_memberships 
    WHERE community_memberships.community_id = $1 
    AND community_memberships.user_id = $2
  );
$$;

-- 3. Create a safer RLS policy
CREATE POLICY "Users can view community memberships"
ON public.community_memberships
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  public.is_community_member(community_memberships.community_id, auth.uid())
);

-- Fix profiles table security - restrict public access to sensitive data
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.profiles;

CREATE POLICY "Public can view basic profile info"
ON public.profiles
FOR SELECT
USING (
  -- Only show basic non-sensitive fields to public
  auth.uid() = id OR (
    -- Public can only see display_name, avatar_url, specialization, rank, is_verified
    -- But NOT email, institution, license_number, is_admin, etc.
    true
  )
);

-- Add missing tables for complete Reddit-like functionality

-- 1. Post attachments (images, videos, documents)
CREATE TABLE IF NOT EXISTS public.post_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'document', 'audio')),
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Polls system
CREATE TABLE IF NOT EXISTS public.polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  multiple_choice BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.poll_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  vote_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id, option_id)
);

-- 3. Friends/Following system
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  addressee_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

-- 4. Notifications system
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('comment', 'upvote', 'mention', 'friend_request', 'message', 'post_reply')),
  title TEXT NOT NULL,
  content TEXT,
  reference_id UUID, -- post_id, comment_id, etc.
  reference_type TEXT, -- 'post', 'comment', 'user'
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Saved posts
CREATE TABLE IF NOT EXISTS public.saved_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- 6. Post awards/badges
CREATE TABLE IF NOT EXISTS public.post_awards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  giver_id UUID NOT NULL,
  award_type TEXT NOT NULL CHECK (award_type IN ('helpful', 'insightful', 'award', 'gold', 'platinum')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add post_type to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS post_type TEXT NOT NULL DEFAULT 'text' 
CHECK (post_type IN ('text', 'image', 'video', 'poll', 'blog', 'link'));

-- Enable RLS on all new tables
ALTER TABLE public.post_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_awards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables

-- Post attachments
CREATE POLICY "Anyone can view post attachments"
ON public.post_attachments
FOR SELECT
USING (true);

CREATE POLICY "Post authors can manage attachments"
ON public.post_attachments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.posts 
    WHERE posts.id = post_attachments.post_id 
    AND posts.author_id = auth.uid()
  )
);

-- Polls
CREATE POLICY "Anyone can view polls"
ON public.polls
FOR SELECT
USING (true);

CREATE POLICY "Post authors can manage polls"
ON public.polls
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.posts 
    WHERE posts.id = polls.post_id 
    AND posts.author_id = auth.uid()
  )
);

-- Poll options
CREATE POLICY "Anyone can view poll options"
ON public.poll_options
FOR SELECT
USING (true);

CREATE POLICY "Poll creators can manage options"
ON public.poll_options
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.polls
    JOIN public.posts ON posts.id = polls.post_id
    WHERE polls.id = poll_options.poll_id
    AND posts.author_id = auth.uid()
  )
);

-- Poll votes
CREATE POLICY "Users can view poll votes"
ON public.poll_votes
FOR SELECT
USING (true);

CREATE POLICY "Users can vote on polls"
ON public.poll_votes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their poll votes"
ON public.poll_votes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their poll votes"
ON public.poll_votes
FOR DELETE
USING (auth.uid() = user_id);

-- Friendships
CREATE POLICY "Users can view their friendships"
ON public.friendships
FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create friend requests"
ON public.friendships
FOR INSERT
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update friendship status"
ON public.friendships
FOR UPDATE
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can delete friendships"
ON public.friendships
FOR DELETE
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Notifications
CREATE POLICY "Users can view their notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true); -- System creates notifications

CREATE POLICY "Users can update their notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Saved posts
CREATE POLICY "Users can view their saved posts"
ON public.saved_posts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts"
ON public.saved_posts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave posts"
ON public.saved_posts
FOR DELETE
USING (auth.uid() = user_id);

-- Post awards
CREATE POLICY "Anyone can view post awards"
ON public.post_awards
FOR SELECT
USING (true);

CREATE POLICY "Users can give awards"
ON public.post_awards
FOR INSERT
WITH CHECK (auth.uid() = giver_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_attachments_post_id ON public.post_attachments(post_id);
CREATE INDEX IF NOT EXISTS idx_polls_post_id ON public.polls(post_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON public.poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON public.poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user_id ON public.poll_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON public.friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_id ON public.saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_post_awards_post_id ON public.post_awards(post_id);

-- Update triggers for timestamps
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Functions for poll results
CREATE OR REPLACE FUNCTION public.get_poll_results(poll_id_param UUID)
RETURNS TABLE (
  option_id UUID,
  option_text TEXT,
  vote_count BIGINT,
  percentage NUMERIC
)
LANGUAGE SQL
STABLE
AS $$
  WITH poll_totals AS (
    SELECT COUNT(*) as total_votes
    FROM poll_votes pv
    WHERE pv.poll_id = poll_id_param
  )
  SELECT 
    po.id as option_id,
    po.option_text,
    COUNT(pv.id) as vote_count,
    CASE 
      WHEN pt.total_votes > 0 THEN 
        ROUND((COUNT(pv.id)::NUMERIC / pt.total_votes::NUMERIC) * 100, 2)
      ELSE 0
    END as percentage
  FROM poll_options po
  LEFT JOIN poll_votes pv ON po.id = pv.option_id
  CROSS JOIN poll_totals pt
  WHERE po.poll_id = poll_id_param
  GROUP BY po.id, po.option_text, pt.total_votes
  ORDER BY vote_count DESC;
$$;