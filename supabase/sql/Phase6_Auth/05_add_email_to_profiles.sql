-- Phase 6: User Management & Authentication
-- Migration 05: Add Email Column to Profiles
-- Date: 2025-10-22
-- Purpose: Add email column to profiles table for easy access

-- Add email column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Update existing developer profile with email
UPDATE profiles 
SET email = 'carmel.cayouf@gmail.com' 
WHERE user_id = '5f7de877-688d-4584-912d-299b2c0b7fe9';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 05 Completed - Email column added to profiles';
END $$;
