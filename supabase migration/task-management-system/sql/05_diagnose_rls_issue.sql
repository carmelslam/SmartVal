-- ============================================================================
-- Diagnose RLS Issue - Run this first to identify the problem
-- ============================================================================
-- This will help us understand why task creation is failing
-- ============================================================================

-- 1. Check if you're authenticated
SELECT
  auth.uid() as current_user_id,
  CASE
    WHEN auth.uid() IS NULL THEN '❌ NOT AUTHENTICATED'
    ELSE '✅ AUTHENTICATED'
  END as auth_status;

-- 2. Check your profile and role
SELECT
  user_id,
  name,
  role,
  CASE
    WHEN role IN ('admin', 'developer') THEN '✅ CAN CREATE TASKS (admin/developer)'
    WHEN role = 'assistant' THEN '⚠️ LIMITED - can create for self/assessors'
    WHEN role = 'assessor' THEN '⚠️ LIMITED - can create for self only'
    ELSE '❌ NO PERMISSION'
  END as permission_level
FROM public.profiles
WHERE user_id = auth.uid();

-- 3. Test if the helper function works
SELECT
  get_current_user_role() as function_result,
  CASE
    WHEN get_current_user_role() IS NULL THEN '❌ FUNCTION RETURNS NULL - THIS IS THE PROBLEM'
    ELSE '✅ FUNCTION WORKS'
  END as function_status;

-- 4. Check if INSERT policies exist
SELECT
  policyname,
  permissive,
  roles,
  with_check
FROM pg_policies
WHERE tablename = 'tasks'
  AND cmd = 'INSERT'
ORDER BY policyname;

-- 5. Check function permissions
SELECT
  routine_name,
  routine_type,
  security_type,
  definer
FROM information_schema.routines
WHERE routine_name = 'get_current_user_role';

-- ============================================================================
-- INTERPRETATION:
-- ============================================================================
-- If "function_result" is NULL: The function isn't finding your profile
-- If "function_result" shows your role: The function works, but policies might be wrong
-- If no INSERT policies are shown: The policies weren't created properly
-- ============================================================================
