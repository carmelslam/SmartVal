-- ============================================================================
-- Fix get_current_user_role() Returning NULL
-- ============================================================================
-- Problem: The function returns NULL because it can't find your profile
-- This script will diagnose and fix the issue
-- ============================================================================

-- STEP 1: Diagnostic - Check what auth.uid() returns
SELECT
  auth.uid() as auth_user_id,
  auth.uid()::text as auth_user_id_text;

-- STEP 2: Check if this user exists in profiles table
SELECT
  user_id,
  user_id::text as user_id_text,
  name,
  role,
  email
FROM public.profiles
WHERE user_id = auth.uid();

-- If the above returns NO ROWS, that's the problem!
-- Let's check what's actually in the profiles table:

-- STEP 3: Show all profiles (to see the data)
SELECT
  user_id::text as user_id,
  name,
  role,
  email,
  created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- SOLUTION 1: If the profile doesn't exist, create it
-- ============================================================================
-- Uncomment and run this if your profile is missing:
/*
INSERT INTO public.profiles (user_id, name, role, email)
VALUES (
  auth.uid(),
  'Your Name Here',  -- CHANGE THIS
  'developer',       -- Your role
  auth.email()       -- Gets email from auth
)
ON CONFLICT (user_id) DO UPDATE
SET role = 'developer';
*/

-- ============================================================================
-- SOLUTION 2: Alternative function that handles NULL better
-- ============================================================================
-- This version is more robust and provides better error handling

CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get the role from profiles table
  SELECT role INTO user_role
  FROM public.profiles
  WHERE user_id = auth.uid();

  -- Return the role, or 'viewer' if not found (instead of NULL)
  RETURN COALESCE(user_role, 'viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_role() TO anon;

-- ============================================================================
-- STEP 4: Test the fixed function
-- ============================================================================
SELECT
  auth.uid() as your_user_id,
  get_current_user_role() as your_role,
  CASE
    WHEN get_current_user_role() = 'viewer' THEN '⚠️ DEFAULTING TO VIEWER - Profile may not exist'
    WHEN get_current_user_role() IN ('admin', 'developer') THEN '✅ CAN CREATE TASKS'
    ELSE '⚠️ LIMITED PERMISSIONS'
  END as status;

-- ============================================================================
-- STEP 5: Verify you can now create tasks
-- ============================================================================
-- This should return TRUE if you're admin/developer:
SELECT
  (get_current_user_role() IN ('admin', 'developer')) as can_create_tasks;
