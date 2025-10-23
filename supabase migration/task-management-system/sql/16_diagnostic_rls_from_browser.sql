-- ============================================================================
-- RLS DIAGNOSTIC - Find why policies are failing
-- ============================================================================
-- This diagnostic helps identify the exact problem with RLS policies
-- ============================================================================

-- ============================================================================
-- PART 1: Run this in SUPABASE SQL EDITOR (as admin)
-- ============================================================================

-- Check 1: Are the policies created?
SELECT
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'tasks'
ORDER BY cmd, policyname;

-- Check 2: What does auth.uid() return in SQL Editor?
-- NOTE: This will likely return NULL because SQL Editor runs as postgres user
SELECT
  auth.uid() as auth_uid_in_sql_editor,
  CASE
    WHEN auth.uid() IS NULL THEN '⚠️ NULL - SQL Editor runs as postgres, not as authenticated user'
    ELSE '✅ Has value'
  END as auth_status;

-- Check 3: List all users in profiles
SELECT
  user_id::text,
  name,
  role,
  email
FROM public.profiles
ORDER BY name;

-- Check 4: Check admin user specifically
SELECT
  user_id::text,
  name,
  role,
  email
FROM public.profiles
WHERE role = 'admin';

-- ============================================================================
-- PART 2: The REAL TEST - Must be done from BROWSER
-- ============================================================================
-- The issue is that auth.uid() works differently from browser vs SQL Editor
-- We need to test the policy from an actual browser request

-- Create a test function that we can call from the browser
CREATE OR REPLACE FUNCTION test_rls_from_browser()
RETURNS TABLE(
  my_auth_uid text,
  my_role text,
  can_insert_tasks boolean,
  error_message text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    auth.uid()::text as my_auth_uid,
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) as my_role,
    ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'developer')) as can_insert_tasks,
    CASE
      WHEN auth.uid() IS NULL THEN '❌ auth.uid() is NULL - not authenticated'
      WHEN (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IS NULL THEN '❌ No profile found for user'
      WHEN (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'developer') THEN '✅ Should be able to create tasks'
      ELSE '⚠️ User has role but not admin/developer'
    END as error_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION test_rls_from_browser() TO authenticated;

-- ============================================================================
-- PART 3: Instructions for testing from browser
-- ============================================================================
/*
After running this SQL, go to your browser console and run:

const { data, error } = await supabase.rpc('test_rls_from_browser');
console.log('Test result:', data);

This will show you:
- my_auth_uid: Your user ID as seen by auth.uid()
- my_role: Your role from profiles table
- can_insert_tasks: Whether the policy condition evaluates to true
- error_message: What's wrong

PASTE THE RESULTS HERE AND I'LL FIX THE POLICIES!
*/
