-- ============================================================================
-- FIX ASSISTANT RLS POLICY - Allow viewing assessor tasks
-- ============================================================================
-- Issue: Assistants cannot see assessor tasks for monitoring
-- Solution: Update the SELECT policy to include tasks assigned to assessors
-- ============================================================================

-- Drop the existing assistant policies
DROP POLICY IF EXISTS "tasks_assistant_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_assistant_update" ON public.tasks;

-- Create updated SELECT policy that allows assistants to see:
-- 1. Tasks assigned TO them
-- 2. Tasks assigned BY them (tasks they created)
-- 3. ALL tasks assigned to assessors (for monitoring)
CREATE POLICY "tasks_assistant_select"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'assistant'
    AND (
      assigned_to = auth.uid()
      OR assigned_by = auth.uid()
      OR (SELECT role FROM public.profiles WHERE user_id = assigned_to) = 'assessor'
    )
  );

-- Create updated UPDATE policy that allows assistants to update:
-- 1. Tasks assigned TO them
-- 2. Tasks assigned BY them (tasks they created for assessors)
CREATE POLICY "tasks_assistant_update"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'assistant'
    AND (assigned_to = auth.uid() OR assigned_by = auth.uid())
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'assistant'
    AND (assigned_to = auth.uid() OR assigned_by = auth.uid())
  );

-- Verify the policy was created
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'tasks' AND policyname = 'tasks_assistant_select';

-- ============================================================================
-- VERIFICATION QUERY (Run as assistant user)
-- ============================================================================
-- This should now return:
-- 1. Tasks where you are assigned_to
-- 2. Tasks where you are assigned_by
-- 3. Tasks where assigned_to is an assessor

SELECT
  id,
  title,
  assigned_to,
  (SELECT name FROM profiles WHERE user_id = tasks.assigned_to) as assigned_to_name,
  (SELECT role FROM profiles WHERE user_id = tasks.assigned_to) as assigned_to_role,
  status
FROM tasks
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- Assistants can now:
-- ✅ See their own assigned tasks
-- ✅ See tasks they created
-- ✅ See ALL assessor tasks (for monitoring)
-- ============================================================================
