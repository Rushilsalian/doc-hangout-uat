-- Fix comments RLS policies to allow commenting on others' posts

-- Drop existing comment policies
DROP POLICY IF EXISTS "Anyone can view comments on published posts" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

-- Create proper RLS policies for comments
CREATE POLICY "Anyone can view comments on published posts" 
ON public.comments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.posts 
  WHERE posts.id = comments.post_id 
  AND posts.status = 'published'
));

CREATE POLICY "Authenticated users can create comments" 
ON public.comments 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments" 
ON public.comments 
FOR UPDATE 
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments" 
ON public.comments 
FOR DELETE 
TO authenticated
USING (auth.uid() = author_id);

-- Ensure comments table has proper structure
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

-- Grant permissions
GRANT ALL ON public.comments TO authenticated;
GRANT USAGE ON SEQUENCE comments_id_seq TO authenticated;