-- ============================================================================
-- Test RLS Function in Real Context
-- ============================================================================
-- This tests what the function actually returns when YOU are logged in
-- ============================================================================

-- Test 1: What does the function return?
SELECT get_current_user_role() as my_role;

-- Test 2: Check if you can see the policies
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'tasks'
  AND cmd = 'INSERT'
ORDER BY policyname;

-- Test 3: Check what the WITH CHECK condition expects
SELECT
  policyname,
  with_check
FROM pg_policies
WHERE tablename = 'tasks'
  AND cmd = 'INSERT';
