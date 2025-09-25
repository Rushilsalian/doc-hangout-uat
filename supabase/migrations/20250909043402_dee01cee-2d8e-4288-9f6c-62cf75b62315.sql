-- Fix search path for the new function
CREATE OR REPLACE FUNCTION public.generate_invite_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN LOWER(
    SUBSTRING(
      ENCODE(GEN_RANDOM_BYTES(12), 'base64'), 
      1, 16
    )
  );
END;
$$;