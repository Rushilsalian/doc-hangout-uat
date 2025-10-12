-- Fix missing DELETE policy for posts table
-- This allows users to delete their own posts

-- Add DELETE policy for posts
CREATE POLICY "Authors can delete their own posts" 
ON public.posts FOR DELETE 
TO authenticated
USING (auth.uid() = author_id);