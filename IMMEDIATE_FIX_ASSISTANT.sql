-- ============================================================================
-- IMMEDIATE FIX - Run this now to unblock assistant
-- ============================================================================

-- STEP 1: Fix profiles table RLS (assistants need to read user info)
-- Check if RLS is enabled on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing profiles policies if any
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;

-- Allow all authenticated users to view profiles (needed for dropdowns and name display)
CREATE POLICY "profiles_select_all"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- STEP 2: Fix tasks table policies for assistant
-- Drop and recreate assistant SELECT policy
DROP POLICY IF EXISTS "tasks_assistant_select" ON public.tasks;

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

-- Drop and recreate assistant UPDATE policy
DROP POLICY IF EXISTS "tasks_assistant_update" ON public.tasks;

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

-- STEP 3: Verify everything
SELECT 'Profiles RLS Status:' as check_type, tablename, rowsecurity as enabled
FROM pg_tables
WHERE tablename = 'profiles';

SELECT 'Profiles Policies:' as check_type, policyname, cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

SELECT 'Tasks Assistant Policies:' as check_type, policyname, cmd
FROM pg_policies
WHERE tablename = 'tasks'
  AND policyname LIKE '%assistant%'
ORDER BY policyname;

-- ============================================================================
-- After running this, have the assistant:
-- 1. Hard refresh browser (Ctrl+Shift+R)
-- 2. Try loading assistant-tasks.html again
-- ============================================================================

