-- Add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Update the handle_new_user function to sync email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Backfill existing emails from auth.users to profiles
-- Note: This requires the function to have access to auth.users which it does as a migration
UPDATE public.profiles
SET email = auth.users.email
FROM auth.users
WHERE public.profiles.user_id = auth.users.id
AND public.profiles.email IS NULL;
