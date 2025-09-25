-- Create invite_links table for group invitations
CREATE TABLE public.invite_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.group_conversations(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  uses_count INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER
);

-- Enable RLS
ALTER TABLE public.invite_links ENABLE ROW LEVEL SECURITY;

-- Create policies for invite_links
CREATE POLICY "Group members can create invite links" 
ON public.invite_links 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = invite_links.group_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Group members can view invite links" 
ON public.invite_links 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = invite_links.group_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view active invite links by token" 
ON public.invite_links 
FOR SELECT 
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Create function to generate unique invite tokens
CREATE OR REPLACE FUNCTION public.generate_invite_token()
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    SUBSTRING(
      ENCODE(GEN_RANDOM_BYTES(12), 'base64'), 
      1, 16
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Add index for better performance
CREATE INDEX idx_invite_links_token ON public.invite_links(token);
CREATE INDEX idx_invite_links_group_id ON public.invite_links(group_id);

-- Enable realtime for invite_links
ALTER PUBLICATION supabase_realtime ADD TABLE public.invite_links;