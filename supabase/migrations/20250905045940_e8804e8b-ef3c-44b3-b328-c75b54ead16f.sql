-- Create comprehensive database schema for dynamic medical collaboration platform

-- Communities/Specialty Hangout Rooms
CREATE TABLE public.communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL, -- Store the lucide icon name
  color TEXT NOT NULL DEFAULT 'text-blue-500',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Community memberships
CREATE TABLE public.community_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  role TEXT NOT NULL DEFAULT 'member', -- member, moderator, admin
  UNIQUE(community_id, user_id)
);

-- Posts in communities
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_ai_summary BOOLEAN NOT NULL DEFAULT false,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' -- draft, published, archived
);

-- Post tags
CREATE TABLE public.post_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  UNIQUE(post_id, tag)
);

-- Post votes
CREATE TABLE public.post_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Comments on posts
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Messages/conversations
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(participant_1, participant_2),
  CHECK (participant_1 != participant_2)
);

CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  is_moderated BOOLEAN NOT NULL DEFAULT false
);

-- Karma/reputation system
CREATE TABLE public.karma_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- GIVE_UPVOTE, CREATE_POST, RECEIVE_UPVOTE, etc.
  points INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI features tracking
CREATE TABLE public.ai_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  summary_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  model_used TEXT
);

-- Enable Row Level Security
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.karma_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_summaries ENABLE ROW LEVEL SECURITY;

-- Communities policies
CREATE POLICY "Anyone can view active communities" 
ON public.communities FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authenticated users can create communities" 
ON public.communities FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Community memberships policies
CREATE POLICY "Members can view community memberships" 
ON public.community_memberships FOR SELECT 
USING (true);

CREATE POLICY "Users can join communities" 
ON public.community_memberships FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities they joined" 
ON public.community_memberships FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Posts policies
CREATE POLICY "Anyone can view published posts" 
ON public.posts FOR SELECT 
USING (status = 'published');

CREATE POLICY "Authenticated users can create posts" 
ON public.posts FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own posts" 
ON public.posts FOR UPDATE 
TO authenticated
USING (auth.uid() = author_id);

-- Post tags policies
CREATE POLICY "Anyone can view post tags" 
ON public.post_tags FOR SELECT 
USING (true);

CREATE POLICY "Post authors can manage tags" 
ON public.post_tags FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.posts 
    WHERE id = post_id AND author_id = auth.uid()
  )
);

-- Post votes policies
CREATE POLICY "Anyone can view post votes" 
ON public.post_votes FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can vote on posts" 
ON public.post_votes FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" 
ON public.post_votes FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" 
ON public.post_votes FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Anyone can view comments" 
ON public.comments FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create comments" 
ON public.comments FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own comments" 
ON public.comments FOR UPDATE 
TO authenticated
USING (auth.uid() = author_id);

-- Conversations policies
CREATE POLICY "Users can view their own conversations" 
ON public.conversations FOR SELECT 
TO authenticated
USING (auth.uid() IN (participant_1, participant_2));

CREATE POLICY "Users can create conversations" 
ON public.conversations FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IN (participant_1, participant_2));

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" 
ON public.messages FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = conversation_id 
    AND auth.uid() IN (participant_1, participant_2)
  )
);

CREATE POLICY "Users can send messages" 
ON public.messages FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = conversation_id 
    AND auth.uid() IN (participant_1, participant_2)
  )
);

-- Karma activities policies
CREATE POLICY "Users can view their own karma activities" 
ON public.karma_activities FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can insert karma activities" 
ON public.karma_activities FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- AI summaries policies
CREATE POLICY "Anyone can view AI summaries" 
ON public.ai_summaries FOR SELECT 
USING (true);

-- Create functions and triggers
CREATE OR REPLACE FUNCTION public.update_post_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts 
    SET 
      upvotes = (SELECT COUNT(*) FROM public.post_votes WHERE post_id = NEW.post_id AND vote_type = 'upvote'),
      downvotes = (SELECT COUNT(*) FROM public.post_votes WHERE post_id = NEW.post_id AND vote_type = 'downvote')
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.posts 
    SET 
      upvotes = (SELECT COUNT(*) FROM public.post_votes WHERE post_id = NEW.post_id AND vote_type = 'upvote'),
      downvotes = (SELECT COUNT(*) FROM public.post_votes WHERE post_id = NEW.post_id AND vote_type = 'downvote')
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts 
    SET 
      upvotes = (SELECT COUNT(*) FROM public.post_votes WHERE post_id = OLD.post_id AND vote_type = 'upvote'),
      downvotes = (SELECT COUNT(*) FROM public.post_votes WHERE post_id = OLD.post_id AND vote_type = 'downvote')
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
CREATE TRIGGER update_post_vote_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.post_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_vote_counts();

CREATE TRIGGER update_communities_updated_at
  BEFORE UPDATE ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.communities (name, description, icon_name, color) VALUES
  ('Cardiology', 'Heart conditions and cardiovascular medicine', 'Heart', 'text-red-500'),
  ('Neurology', 'Brain and nervous system disorders', 'Brain', 'text-purple-500'),
  ('Radiology', 'Medical imaging and diagnostics', 'Eye', 'text-blue-500'),
  ('Orthopedics', 'Musculoskeletal system', 'Bone', 'text-orange-500');

-- Add indexes for performance
CREATE INDEX idx_posts_community_id ON public.posts(community_id);
CREATE INDEX idx_posts_author_id ON public.posts(author_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_community_memberships_user_id ON public.community_memberships(user_id);
CREATE INDEX idx_community_memberships_community_id ON public.community_memberships(community_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_post_votes_post_id ON public.post_votes(post_id);
CREATE INDEX idx_karma_activities_user_id ON public.karma_activities(user_id);