-- Remove the problematic view
DROP VIEW IF EXISTS public.public_profiles;

-- Instead, just keep the secure policy we created
-- The "Users can view their own profile" policy is correct and secure
-- Email addresses are now protected and only accessible to the profile owner