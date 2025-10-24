-- ============================================================================
-- FINAL RLS FIX - Run this complete script
-- ============================================================================
-- This will fix all RLS issues and allow task creation
-- ============================================================================

-- Step 1: Make sure your profile has the correct role
UPDATE public.profiles
SET role = 'developer'
WHERE user_id = '5f7de877-688d-4584-912d-299b2c0b7fe9'::uuid;

-- Step 2: Recreate the function with proper settings
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get role from profiles table
  SELECT role INTO user_role
  FROM public.profiles
  WHERE user_id = auth.uid();

  -- Return role or 'viewer' as default
  RETURN COALESCE(user_role, 'viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_role() TO anon;
GRANT EXECUTE ON FUNCTION get_current_user_role() TO service_role;

-- Step 3: Drop and recreate INSERT policies with simpler logic
DROP POLICY IF EXISTS "tasks_insert_admin_dev" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_assistant" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_assessor" ON public.tasks;

-- Create simpler policy for admin/developer
CREATE POLICY "tasks_insert_admin_dev"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'developer')
  );

-- Create policy for assistant
CREATE POLICY "tasks_insert_assistant"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'assistant'
    AND (
      assigned_to = auth.uid()
      OR (SELECT role FROM public.profiles WHERE user_id = assigned_to) = 'assessor'
    )
  );

-- Create policy for assessor
CREATE POLICY "tasks_insert_assessor"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'assessor'
    AND assigned_to = auth.uid()
  );

-- Step 4: Verify the policies were created
SELECT
  policyname,
  cmd,
  permissive,
  CASE
    WHEN policyname LIKE '%admin_dev%' THEN '✅ Admin/Developer policy'
    WHEN policyname LIKE '%assistant%' THEN '✅ Assistant policy'
    WHEN policyname LIKE '%assessor%' THEN '✅ Assessor policy'
    ELSE 'Other'
  END as policy_type
FROM pg_policies
WHERE tablename = 'tasks'
  AND cmd = 'INSERT'
ORDER BY policyname;

-- Step 5: Verify your role
SELECT
  user_id,
  name,
  role,
  CASE
    WHEN role IN ('admin', 'developer') THEN '✅ YOU CAN CREATE TASKS'
    ELSE '❌ Role issue - should be admin or developer'
  END as status
FROM public.profiles
WHERE user_id = '5f7de877-688d-4584-912d-299b2c0b7fe9'::uuid;
