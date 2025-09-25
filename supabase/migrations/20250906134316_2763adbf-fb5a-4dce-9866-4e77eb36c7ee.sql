-- Create admin promotion function that can be used manually
CREATE OR REPLACE FUNCTION public.manual_promote_to_admin(target_email TEXT)
RETURNS TEXT AS $$
DECLARE
  target_user_id UUID;
  result_message TEXT;
BEGIN
  -- Find user by email from auth.users
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = target_email;
  
  IF target_user_id IS NULL THEN
    RETURN 'User with email ' || target_email || ' not found. Please ensure the user has signed up first.';
  END IF;
  
  -- Add admin role to user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO UPDATE SET granted_at = now();
  
  -- Update profile to reflect admin status
  UPDATE public.profiles 
  SET is_admin = true, role = 'admin', is_verified = true
  WHERE id = target_user_id;
  
  RETURN 'Successfully promoted ' || target_email || ' to admin status.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update the handle_new_user function to automatically set admin for the specific email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, is_verified, is_admin, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    -- Set is_verified to true for admin email
    CASE WHEN NEW.email = 'rushilsalian13@gmail.com' THEN true ELSE false END,
    -- Set is_admin to true for admin email  
    CASE WHEN NEW.email = 'rushilsalian13@gmail.com' THEN true ELSE false END,
    -- Set role to admin for admin email
    CASE WHEN NEW.email = 'rushilsalian13@gmail.com' THEN 'admin'::app_role ELSE 'user'::app_role END
  );
  
  -- Also add admin role to user_roles table for the admin email
  IF NEW.email = 'rushilsalian13@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;