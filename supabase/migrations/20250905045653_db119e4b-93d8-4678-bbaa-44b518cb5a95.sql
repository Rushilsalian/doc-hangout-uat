-- Fix conflicting policies by dropping the problematic one and creating proper granular access
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.profiles;

-- Create view for public profile data (excluding sensitive info like email)
CREATE OR REPLACE VIEW public.public_profiles AS 
SELECT 
  id,
  display_name,
  specialization,
  institution,
  years_experience,
  is_verified,
  created_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated, anon;