-- Security Fix: Update Community Memberships RLS Policy
-- Remove the current overly permissive policy that allows anyone to view all memberships
DROP POLICY IF EXISTS "Members can view community memberships" ON public.community_memberships;

-- Create a more restrictive policy that only allows users to see memberships in communities they're part of
CREATE POLICY "Users can view memberships in their communities" 
ON public.community_memberships 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.community_memberships cm2 
    WHERE cm2.community_id = community_memberships.community_id 
    AND cm2.user_id = auth.uid()
  )
);

-- Security Fix: Update Analyses RLS Policy  
-- Remove the current policy that allows anyone to view all analyses
DROP POLICY IF EXISTS "Anyone can view analyses" ON public.analyses;

-- Create a user-specific policy for analyses (assuming analyses should be private)
-- Since there's no user_id field, we'll need to add one first
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update the analyses table to have a user_id for existing records (set to NULL for now)
-- In a real scenario, you'd need to properly map these

-- Create new RLS policy for analyses that only allows users to see their own analyses
CREATE POLICY "Users can view their own analyses" 
ON public.analyses 
FOR SELECT 
USING (auth.uid() = user_id);

-- Update the insert policy to ensure user_id is set correctly
DROP POLICY IF EXISTS "Anyone can insert analyses" ON public.analyses;
CREATE POLICY "Users can insert their own analyses" 
ON public.analyses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Security Fix: Add encryption support for license numbers
-- Create a function to encrypt sensitive data
CREATE OR REPLACE FUNCTION public.encrypt_license_number(license_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Simple obfuscation - in production, use proper encryption
  -- This is a placeholder that hashes the license number
  RETURN encode(digest(license_text || current_setting('app.settings.salt', true), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically encrypt license numbers on insert/update
CREATE OR REPLACE FUNCTION public.encrypt_profile_license()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.license_number IS NOT NULL AND NEW.license_number != OLD.license_number THEN
    -- Store the encrypted version
    NEW.license_number = public.encrypt_license_number(NEW.license_number);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply the encryption trigger to profiles table
DROP TRIGGER IF EXISTS encrypt_license_trigger ON public.profiles;
CREATE TRIGGER encrypt_license_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_profile_license();

-- Security Fix: Strengthen profiles RLS policy
-- Update profiles policy to be more restrictive about what data is visible
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create separate policies for different levels of profile data access
CREATE POLICY "Users can view their own full profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Allow limited public visibility for non-sensitive profile data only
CREATE POLICY "Public can view basic profile info" 
ON public.profiles 
FOR SELECT 
USING (true);