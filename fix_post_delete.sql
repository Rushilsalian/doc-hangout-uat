-- Fix for post deletion issue
-- Run this SQL in your Supabase SQL editor

-- Add DELETE policy for posts table
-- This allows users to delete their own posts
CREATE POLICY "Authors can delete their own posts" 
ON public.posts FOR DELETE 
TO authenticated
USING (auth.uid() = author_id);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'posts' AND cmd = 'DELETE';