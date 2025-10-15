-- Add community deletion functionality
-- This migration adds proper cascade deletion and RLS policies for community deletion

-- Add RLS policy for community deletion
DO $$
BEGIN
  -- Allow community creators and admins to delete communities
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communities' AND policyname = 'Community creators and admins can delete communities') THEN
    CREATE POLICY "Community creators and admins can delete communities" 
    ON public.communities 
    FOR DELETE 
    TO authenticated
    USING (
      auth.uid() = created_by OR
      EXISTS (
        SELECT 1 FROM public.community_memberships 
        WHERE community_id = communities.id 
        AND user_id = auth.uid() 
        AND role = 'admin'
      )
    );
  END IF;
END $$;

-- Ensure proper foreign key constraints with CASCADE deletion
-- This will automatically delete related data when a community is deleted

-- Update posts table to cascade delete when community is deleted
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_community_id_fkey' 
    AND table_name = 'posts'
  ) THEN
    ALTER TABLE public.posts DROP CONSTRAINT posts_community_id_fkey;
  END IF;
  
  -- Add new constraint with CASCADE
  ALTER TABLE public.posts 
  ADD CONSTRAINT posts_community_id_fkey 
  FOREIGN KEY (community_id) 
  REFERENCES public.communities(id) 
  ON DELETE CASCADE;
END $$;

-- Update community_memberships table to cascade delete when community is deleted
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'community_memberships_community_id_fkey' 
    AND table_name = 'community_memberships'
  ) THEN
    ALTER TABLE public.community_memberships DROP CONSTRAINT community_memberships_community_id_fkey;
  END IF;
  
  -- Add new constraint with CASCADE
  ALTER TABLE public.community_memberships 
  ADD CONSTRAINT community_memberships_community_id_fkey 
  FOREIGN KEY (community_id) 
  REFERENCES public.communities(id) 
  ON DELETE CASCADE;
END $$;

-- Create function to handle community deletion cleanup
CREATE OR REPLACE FUNCTION public.cleanup_community_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the deletion for audit purposes
  INSERT INTO public.karma_activities (user_id, activity_type, points, description)
  VALUES (
    OLD.created_by,
    'DELETE_COMMUNITY',
    -10,
    'Community "' || OLD.name || '" was deleted'
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for community deletion cleanup
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'community_deletion_cleanup') THEN
    CREATE TRIGGER community_deletion_cleanup
    BEFORE DELETE ON public.communities
    FOR EACH ROW
    EXECUTE FUNCTION public.cleanup_community_deletion();
  END IF;
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.cleanup_community_deletion() TO authenticated;