-- Add avatar_url to profiles table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for avatars
DO $$
BEGIN
  -- Create policy for public avatar access
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Avatar images are publicly accessible') THEN
    CREATE POLICY "Avatar images are publicly accessible" 
    ON storage.objects 
    FOR SELECT 
    USING (bucket_id = 'avatars');
  END IF;

  -- Create policy for avatar uploads
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can upload their own avatar') THEN
    CREATE POLICY "Users can upload their own avatar" 
    ON storage.objects 
    FOR INSERT 
    WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- Create policy for avatar updates
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can update their own avatar') THEN
    CREATE POLICY "Users can update their own avatar" 
    ON storage.objects 
    FOR UPDATE 
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- Create policy for avatar deletions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can delete their own avatar') THEN
    CREATE POLICY "Users can delete their own avatar" 
    ON storage.objects 
    FOR DELETE 
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- Create post_attachments table
CREATE TABLE IF NOT EXISTS public.post_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on post_attachments
ALTER TABLE public.post_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for post_attachments
CREATE POLICY "Anyone can view post attachments" 
ON public.post_attachments 
FOR SELECT 
USING (true);

CREATE POLICY "Post authors can manage attachments" 
ON public.post_attachments 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.posts 
  WHERE posts.id = post_attachments.post_id 
  AND posts.author_id = auth.uid()
));

-- Create storage bucket for post attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('post-attachments', 'post-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for post attachments
DO $$
BEGIN
  -- Create policy for public attachment access
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Post attachments are publicly accessible') THEN
    CREATE POLICY "Post attachments are publicly accessible" 
    ON storage.objects 
    FOR SELECT 
    USING (bucket_id = 'post-attachments');
  END IF;

  -- Create policy for attachment uploads
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated users can upload post attachments') THEN
    CREATE POLICY "Authenticated users can upload post attachments" 
    ON storage.objects 
    FOR INSERT 
    WITH CHECK (bucket_id = 'post-attachments' AND auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Ensure friendships table exists with proper structure
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

-- Enable RLS on friendships (should already be enabled)
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Ensure comments table has proper structure
DO $$
BEGIN
  -- Add parent_comment_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'parent_comment_id') THEN
    ALTER TABLE public.comments ADD COLUMN parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create trigger for automatic timestamp updates on friendships
CREATE OR REPLACE FUNCTION public.update_friendship_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_friendships_updated_at') THEN
    CREATE TRIGGER update_friendships_updated_at
    BEFORE UPDATE ON public.friendships
    FOR EACH ROW
    EXECUTE FUNCTION public.update_friendship_updated_at();
  END IF;
END $$;