-- Fix the duplicate policy issue first
DROP POLICY IF EXISTS "Users can view community memberships" ON public.community_memberships;
DROP POLICY IF EXISTS "Users can view memberships in their communities" ON public.community_memberships;

-- Create the security definer function for safe membership checking
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

-- Create new safe policy for community memberships
CREATE POLICY "Users can view community memberships"
ON public.community_memberships
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  public.is_community_member(community_memberships.community_id, auth.uid())
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
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'post_type'
    ) THEN
        ALTER TABLE public.posts 
        ADD COLUMN post_type TEXT NOT NULL DEFAULT 'text' 
        CHECK (post_type IN ('text', 'image', 'video', 'poll', 'blog', 'link'));
    END IF;
END $$;