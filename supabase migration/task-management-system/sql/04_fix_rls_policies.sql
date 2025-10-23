-- ============================================================================
-- Fix RLS Policies for Task Management System
-- ============================================================================
-- Description: Fixes RLS policy issues blocking task creation
-- Date: 2025-10-23
-- Run this if you get: "new row violates row-level security policy"
-- ============================================================================

-- First, let's check if the helper function exists and works
-- If this returns NULL, the function needs to be recreated
-- SELECT get_current_user_role();

-- Recreate the helper function to ensure it works correctly
DROP FUNCTION IF EXISTS get_current_user_role();

CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_current_user_role() IS 'Returns the role of the currently authenticated user';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;

-- Drop existing INSERT policies to recreate them
DROP POLICY IF EXISTS "tasks_insert_admin_dev" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_assistant" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_assessor" ON public.tasks;

-- Recreate INSERT policies with proper permissions

-- Policy: Admin and Developer can create tasks for anyone
CREATE POLICY "tasks_insert_admin_dev"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() IN ('admin', 'developer')
  );

-- Policy: Assistant can create tasks for self and assessors
CREATE POLICY "tasks_insert_assistant"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() = 'assistant'
    AND (
      assigned_to = auth.uid()  -- Assign to self
      OR (
        SELECT role FROM public.profiles WHERE user_id = assigned_to
      ) = 'assessor'  -- Or assign to assessors
    )
  );

-- Policy: Assessor can create tasks for self only
CREATE POLICY "tasks_insert_assessor"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() = 'assessor'
    AND assigned_to = auth.uid()
  );

-- Verify the policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tasks'
  AND policyname LIKE '%insert%'
ORDER BY policyname;

-- Test query to check current user's role
-- SELECT
--   auth.uid() as user_id,
--   get_current_user_role() as role,
--   CASE
--     WHEN get_current_user_role() IN ('admin', 'developer') THEN 'CAN CREATE TASKS'
--     ELSE 'LIMITED ACCESS'
--   END as permission_level;
