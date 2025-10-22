-- Phase 6: User Management & Authentication
-- Migration 01: Update Profiles Table
-- Date: 2025-10-22
-- Purpose: Add phone field and prepare for enhanced user management

-- Add phone column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add username column for login (will be generated from name)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Add status column for user activation/deactivation
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'));

-- Add last_login timestamp
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Add must_change_password flag for temporary passwords
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- Add created_by to track who created the user (for admin audit)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(user_id);

-- Update role constraint to include all 4 roles
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('developer', 'admin', 'assessor', 'assistant'));

-- Create index on username for faster login lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Create index on status for filtering active users
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- Create index on role for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Comments for documentation
COMMENT ON COLUMN profiles.phone IS 'User phone number for contact';
COMMENT ON COLUMN profiles.username IS 'Unique username for login, generated from name';
COMMENT ON COLUMN profiles.status IS 'User account status: active, inactive, suspended';
COMMENT ON COLUMN profiles.last_login IS 'Timestamp of last successful login';
COMMENT ON COLUMN profiles.must_change_password IS 'Flag to force password change on next login';
COMMENT ON COLUMN profiles.created_by IS 'User ID of admin who created this account';

-- Verify changes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 01 completed successfully';
  RAISE NOTICE 'Added columns: phone, username, status, last_login, must_change_password, created_by';
  RAISE NOTICE 'Updated role constraint to include: developer, admin, assessor, assistant';
  RAISE NOTICE 'Created indexes for performance optimization';
END $$;
