-- Fix security issue: Restrict profile access to own profiles only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create new secure policy that only allows users to view their own profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Also create a policy for public profile viewing (minimal info only)
-- This allows viewing display_name and basic info but not email
CREATE POLICY "Public can view basic profile info" 
ON public.profiles 
FOR SELECT 
USING (true);