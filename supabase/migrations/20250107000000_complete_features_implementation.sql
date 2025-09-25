-- Complete features implementation migration
-- This migration ensures all required features are properly set up

-- Ensure comments table has proper RLS policies
DO $$
BEGIN
  -- Create policy for viewing comments
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Anyone can view comments on published posts') THEN
    CREATE POLICY "Anyone can view comments on published posts" 
    ON public.comments 
    FOR SELECT 
    USING (EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = comments.post_id 
      AND posts.status = 'published'
    ));
  END IF;

  -- Create policy for inserting comments
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Authenticated users can create comments') THEN
    CREATE POLICY "Authenticated users can create comments" 
    ON public.comments 
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = author_id);
  END IF;

  -- Create policy for updating own comments
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Users can update their own comments') THEN
    CREATE POLICY "Users can update their own comments" 
    ON public.comments 
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = author_id);
  END IF;

  -- Create policy for deleting own comments
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Users can delete their own comments') THEN
    CREATE POLICY "Users can delete their own comments" 
    ON public.comments 
    FOR DELETE 
    TO authenticated
    USING (auth.uid() = author_id);
  END IF;
END $$;

-- Ensure friendships table has proper RLS policies
DO $$
BEGIN
  -- Create policy for viewing friendships
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friendships' AND policyname = 'Users can view their own friendships') THEN
    CREATE POLICY "Users can view their own friendships" 
    ON public.friendships 
    FOR SELECT 
    TO authenticated
    USING (auth.uid() IN (requester_id, addressee_id));
  END IF;

  -- Create policy for creating friendships
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friendships' AND policyname = 'Users can create friendship requests') THEN
    CREATE POLICY "Users can create friendship requests" 
    ON public.friendships 
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = requester_id);
  END IF;

  -- Create policy for updating friendships
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friendships' AND policyname = 'Users can update friendship status') THEN
    CREATE POLICY "Users can update friendship status" 
    ON public.friendships 
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() IN (requester_id, addressee_id));
  END IF;
END $$;

-- Create function to update comment counts on posts
CREATE OR REPLACE FUNCTION public.update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  -- This function can be used to maintain comment counts if needed
  -- For now, we'll use real-time queries instead
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comments_post_id_created_at ON public.comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON public.comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_post_attachments_post_id ON public.post_attachments(post_id);
CREATE INDEX IF NOT EXISTS idx_friendships_requester_addressee ON public.friendships(requester_id, addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- Ensure all tables have proper updated_at triggers
DO $$
BEGIN
  -- Comments updated_at trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_comments_updated_at') THEN
    CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Create function to get comment count for posts
CREATE OR REPLACE FUNCTION public.get_post_comment_count(post_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM public.comments 
    WHERE comments.post_id = get_post_comment_count.post_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;