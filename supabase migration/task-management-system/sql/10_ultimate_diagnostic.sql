-- ============================================================================
-- ULTIMATE RLS DIAGNOSTIC - Run this to see what's happening
-- ============================================================================

-- First, let's check if RLS is even enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'tasks';

-- Check all policies on tasks table
SELECT
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tasks'
ORDER BY cmd, policyname;

-- Check your actual profile
SELECT
  user_id::text,
  name,
  role,
  email
FROM public.profiles
WHERE user_id = '5f7de877-688d-4584-912d-299b2c0b7fe9'::uuid;

-- Test the function
SELECT
  auth.uid()::text as auth_uid,
  get_current_user_role() as function_result,
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) as direct_query_result;

-- Check if there are ANY INSERT policies at all
SELECT COUNT(*) as insert_policy_count
FROM pg_policies
WHERE tablename = 'tasks' AND cmd = 'INSERT';
