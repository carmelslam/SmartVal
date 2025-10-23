-- ============================================================================
-- RE-ENABLE RLS AFTER AUTH TOKEN FIX
-- ============================================================================
-- CRITICAL: Run this AFTER deploying the supabaseClient.js auth token fix
-- The fix ensures requests use user's access_token instead of anon key
-- This allows auth.uid() to return the correct user ID in RLS policies
-- ============================================================================

-- ============================================================================
-- STEP 1: Verify auth.uid() is working (should return your user ID)
-- ============================================================================
SELECT
  auth.uid()::text as my_user_id,
  (SELECT name FROM public.profiles WHERE user_id = auth.uid()) as my_name,
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) as my_role;

-- If the above returns NULL for my_user_id, STOP - the auth fix isn't deployed yet
-- You need to hard refresh your browser (Ctrl+Shift+R) to load the fixed JavaScript

-- ============================================================================
-- STEP 2: Drop ALL existing policies to start fresh
-- ============================================================================

-- Drop ALL policies on tasks table
DROP POLICY IF EXISTS "tasks_insert_temp_allow_all" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select_temp_allow_all" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_temp_allow_all" ON public.tasks;
DROP POLICY IF EXISTS "tasks_admin_all_access" ON public.tasks;
DROP POLICY IF EXISTS "tasks_assistant_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_assistant_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_assistant_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_assessor_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_assessor_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_assessor_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select_admin_dev" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select_assistant" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select_assessor" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_admin_dev" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_assistant" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_assessor" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_admin_dev" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_assistant" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_assessor" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_admin_dev" ON public.tasks;

-- Drop ALL policies on task_messages table
DROP POLICY IF EXISTS "task_messages_insert_temp" ON public.task_messages;
DROP POLICY IF EXISTS "task_messages_select_temp" ON public.task_messages;
DROP POLICY IF EXISTS "task_messages_select" ON public.task_messages;
DROP POLICY IF EXISTS "task_messages_insert" ON public.task_messages;
DROP POLICY IF EXISTS "task_messages_update" ON public.task_messages;
DROP POLICY IF EXISTS "task_messages_delete" ON public.task_messages;

-- Drop ALL policies on task_progress_history table
DROP POLICY IF EXISTS "task_progress_history_insert_temp" ON public.task_progress_history;
DROP POLICY IF EXISTS "task_progress_history_select_temp" ON public.task_progress_history;
DROP POLICY IF EXISTS "task_progress_select" ON public.task_progress_history;
DROP POLICY IF EXISTS "task_progress_insert" ON public.task_progress_history;
DROP POLICY IF EXISTS "task_progress_history_select" ON public.task_progress_history;
DROP POLICY IF EXISTS "task_progress_history_insert" ON public.task_progress_history;

-- Drop ALL policies on task_attachments table
DROP POLICY IF EXISTS "task_attachments_insert_temp" ON public.task_attachments;
DROP POLICY IF EXISTS "task_attachments_select_temp" ON public.task_attachments;
DROP POLICY IF EXISTS "task_attachments_select" ON public.task_attachments;
DROP POLICY IF EXISTS "task_attachments_insert" ON public.task_attachments;
DROP POLICY IF EXISTS "task_attachments_delete" ON public.task_attachments;

-- Drop ALL policies on task_threads table
DROP POLICY IF EXISTS "task_threads_insert_temp" ON public.task_threads;
DROP POLICY IF EXISTS "task_threads_select_temp" ON public.task_threads;
DROP POLICY IF EXISTS "task_threads_update_temp" ON public.task_threads;
DROP POLICY IF EXISTS "task_threads_select" ON public.task_threads;
DROP POLICY IF EXISTS "task_threads_insert" ON public.task_threads;
DROP POLICY IF EXISTS "task_threads_update" ON public.task_threads;
DROP POLICY IF EXISTS "task_threads_delete" ON public.task_threads;
DROP POLICY IF EXISTS "task_threads_select_admin_dev" ON public.task_threads;
DROP POLICY IF EXISTS "task_threads_insert_admin_dev" ON public.task_threads;
DROP POLICY IF EXISTS "task_threads_update_admin_dev" ON public.task_threads;
DROP POLICY IF EXISTS "task_threads_delete_admin_dev" ON public.task_threads;

-- ============================================================================
-- STEP 3: Create PRODUCTION policies for tasks table
-- ============================================================================

-- Admin/Developer: Full access to ALL tasks
CREATE POLICY "tasks_admin_all_access"
  ON public.tasks
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'developer')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'developer')
  );

-- Assistant: Can see tasks assigned to them OR created by them OR assigned to assessors
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

-- Assistant: Can create tasks for self and assessors
CREATE POLICY "tasks_assistant_insert"
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

-- Assistant: Can update their own assigned tasks OR tasks they created
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

-- Assessor: Can only see tasks assigned to them
CREATE POLICY "tasks_assessor_select"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'assessor'
    AND assigned_to = auth.uid()
  );

-- Assessor: Can create tasks only for themselves
CREATE POLICY "tasks_assessor_insert"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'assessor'
    AND assigned_to = auth.uid()
  );

-- Assessor: Can update their own assigned tasks
CREATE POLICY "tasks_assessor_update"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'assessor'
    AND assigned_to = auth.uid()
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'assessor'
    AND assigned_to = auth.uid()
  );

-- ============================================================================
-- STEP 4: Policies for task_messages (for conversations)
-- ============================================================================

-- Users can see messages for tasks they have access to
CREATE POLICY "task_messages_select"
  ON public.task_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_messages.task_id
      AND (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'developer')
        OR t.assigned_to = auth.uid()
        OR t.assigned_by = auth.uid()
      )
    )
  );

-- Users can insert messages for tasks they have access to
CREATE POLICY "task_messages_insert"
  ON public.task_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_messages.task_id
      AND (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'developer')
        OR t.assigned_to = auth.uid()
        OR t.assigned_by = auth.uid()
      )
    )
  );

-- ============================================================================
-- STEP 5: Policies for task_progress_history (audit trail)
-- ============================================================================

-- Users can see progress history for tasks they have access to
CREATE POLICY "task_progress_select"
  ON public.task_progress_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_progress_history.task_id
      AND (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'developer')
        OR t.assigned_to = auth.uid()
        OR t.assigned_by = auth.uid()
      )
    )
  );

-- Allow inserts for progress tracking (triggers use this)
CREATE POLICY "task_progress_insert"
  ON public.task_progress_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_progress_history.task_id
      AND (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'developer')
        OR t.assigned_to = auth.uid()
        OR t.assigned_by = auth.uid()
      )
    )
  );

-- ============================================================================
-- STEP 6: Policies for task_attachments
-- ============================================================================

CREATE POLICY "task_attachments_select"
  ON public.task_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_attachments.task_id
      AND (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'developer')
        OR t.assigned_to = auth.uid()
        OR t.assigned_by = auth.uid()
      )
    )
  );

CREATE POLICY "task_attachments_insert"
  ON public.task_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_attachments.task_id
      AND (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'developer')
        OR t.assigned_to = auth.uid()
        OR t.assigned_by = auth.uid()
      )
    )
  );

CREATE POLICY "task_attachments_delete"
  ON public.task_attachments
  FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'developer')
  );

-- ============================================================================
-- STEP 7: Policies for task_threads
-- ============================================================================

CREATE POLICY "task_threads_select"
  ON public.task_threads
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'developer')
    OR created_by = auth.uid()
  );

CREATE POLICY "task_threads_insert"
  ON public.task_threads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'developer', 'assistant')
  );

CREATE POLICY "task_threads_update"
  ON public.task_threads
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'developer')
    OR created_by = auth.uid()
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'developer')
    OR created_by = auth.uid()
  );

-- ============================================================================
-- STEP 8: RE-ENABLE RLS on all tables
-- ============================================================================

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_progress_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_threads ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 9: Verify everything is working
-- ============================================================================

-- Check that RLS is enabled
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('tasks', 'task_messages', 'task_progress_history', 'task_attachments', 'task_threads')
ORDER BY tablename;

-- Check all policies were created
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('tasks', 'task_messages', 'task_progress_history', 'task_attachments', 'task_threads')
ORDER BY tablename, cmd, policyname;

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- Your task management system is now secured with proper role-based access control:
--
-- ADMIN/DEVELOPER:
--   - Full access to all tasks and data
--   - Can create, view, update, delete any task
--
-- ASSISTANT:
--   - Can view tasks assigned to them OR that they created
--   - Can create tasks for themselves and assessors
--   - Can update their own assigned tasks
--
-- ASSESSOR:
--   - Can only view tasks assigned to them
--   - Can create tasks only for themselves
--   - Can update their own assigned tasks
-- ============================================================================
