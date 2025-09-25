-- Make conversation_id nullable since group messages use group_conversation_id
ALTER TABLE public.messages 
ALTER COLUMN conversation_id DROP NOT NULL;

-- Add a check constraint to ensure either conversation_id or group_conversation_id is set, but not both
ALTER TABLE public.messages 
ADD CONSTRAINT messages_conversation_xor_group_check 
CHECK (
  (conversation_id IS NOT NULL AND group_conversation_id IS NULL) OR
  (conversation_id IS NULL AND group_conversation_id IS NOT NULL)
);