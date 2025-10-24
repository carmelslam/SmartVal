-- ============================================================================
-- Check if policies were created and test authentication
-- ============================================================================

-- 1. List ALL policies on tasks table
SELECT
  policyname,
  cmd,
  permissive,
  roles,
  with_check
FROM pg_policies
WHERE tablename = 'tasks'
ORDER BY cmd, policyname;

-- 2. Check if RLS is enabled
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'tasks';

-- 3. Check if you're authenticated (run this from SQL Editor)
SELECT
  auth.uid() as your_user_id,
  auth.role() as your_auth_role,
  CASE
    WHEN auth.uid() IS NULL THEN '❌ NOT AUTHENTICATED'
    ELSE '✅ AUTHENTICATED'
  END as auth_status;
