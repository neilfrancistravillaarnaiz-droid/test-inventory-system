-- Add phone column to profiles table
-- This migration enables phone OTP functionality in the admin login

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT NULL;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS totp_secret TEXT DEFAULT NULL;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name IN ('phone', 'totp_secret', 'totp_enabled');
