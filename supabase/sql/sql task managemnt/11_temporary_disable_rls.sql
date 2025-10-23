-- ============================================================================
-- TEMPORARY RLS BYPASS - For testing only
-- ============================================================================
-- This will let you create tasks to test, then we'll fix RLS properly
-- WARNING: This makes the table accessible to everyone temporarily!
-- ============================================================================

-- Option 1: Disable RLS entirely (TEMPORARY - for testing)
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;

-- After you test creating a task, run this to re-enable:
-- ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Or Option 2: Create a permissive policy that allows authenticated users
-- (Better than disabling RLS completely)
-- ============================================================================

-- First enable RLS if it's disabled
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "tasks_insert_admin_dev" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_assistant" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_assessor" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_temp_allow_all" ON public.tasks;

-- Create temporary permissive policy for ALL authenticated users
CREATE POLICY "tasks_insert_temp_allow_all"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- Allows all authenticated users

-- Verify the policy was created
SELECT
  policyname,
  cmd,
  permissive,
  with_check
FROM pg_policies
WHERE tablename = 'tasks'
  AND policyname = 'tasks_insert_temp_allow_all';
