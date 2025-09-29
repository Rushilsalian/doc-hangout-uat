-- Add medical verification column to profiles table
ALTER TABLE profiles 
ADD COLUMN medical_verification_completed BOOLEAN DEFAULT false;

-- Update existing users to have medical verification completed (for backward compatibility)
UPDATE profiles 
SET medical_verification_completed = true 
WHERE created_at < NOW();