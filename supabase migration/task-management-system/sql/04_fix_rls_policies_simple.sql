-- ============================================================================
-- Simple Fix for RLS Task Creation Issue
-- ============================================================================
-- Description: Adds missing permissions without dropping anything
-- Date: 2025-10-23
-- Run this if you get: "new row violates row-level security policy"
-- ============================================================================

-- Update the function to add STABLE and ensure it's properly configured
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users (this might be missing)
GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_role() TO anon;

-- Verify the current user can execute the function
-- Run this to test:
-- SELECT get_current_user_role();

-- Check what the function returns for your user
SELECT
  auth.uid() as your_user_id,
  get_current_user_role() as your_role,
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) as role_direct_check;

-- If the above returns NULL for your_role, the issue is with the function
-- If it returns your role (should be 'developer'), then the policies should work

-- List all INSERT policies to verify they exist
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'tasks'
  AND cmd = 'INSERT'
ORDER BY policyname;
