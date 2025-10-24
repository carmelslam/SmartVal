-- ============================================================================
-- PRODUCTION RLS POLICIES - CRITICAL SECURITY FIX
-- ============================================================================
-- Run this IMMEDIATELY to secure the task management system
-- Current status: RLS is DISABLED - anyone can see/edit all tasks!
-- ============================================================================

-- ============================================================================
-- STEP 1: Clean up - Drop ALL temporary policies
-- ============================================================================

-- tasks table
DROP POLICY IF EXISTS "tasks_insert_temp_allow_all" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select_temp_allow_all" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_temp_allow_all" ON public.tasks;

-- task_messages table
DROP POLICY IF EXISTS "task_messages_insert_temp" ON public.task_messages;
DROP POLICY IF EXISTS "task_messages_select_temp" ON public.task_messages;

-- task_progress_history table
DROP POLICY IF EXISTS "task_progress_history_insert_temp" ON public.task_progress_history;
DROP POLICY IF EXISTS "task_progress_history_select_temp" ON public.task_progress_history;

-- task_attachments table
DROP POLICY IF EXISTS "task_attachments_insert_temp" ON public.task_attachments;
DROP POLICY IF EXISTS "task_attachments_select_temp" ON public.task_attachments;

-- task_threads table
DROP POLICY IF EXISTS "task_threads_insert_temp" ON public.task_threads;
DROP POLICY IF EXISTS "task_threads_select_temp" ON public.task_threads;
DROP POLICY IF EXISTS "task_threads_update_temp" ON public.task_threads;

-- ============================================================================
-- STEP 2: Create PRODUCTION policies for tasks table
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

-- Assistant: Can see tasks assigned to them OR created by them
CREATE POLICY "tasks_assistant_select"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'assistant'
    AND (assigned_to = auth.uid() OR assigned_by = auth.uid())
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

-- Assistant: Can update their own assigned tasks
CREATE POLICY "tasks_assistant_update"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'assistant'
    AND assigned_to = auth.uid()
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'assistant'
    AND assigned_to = auth.uid()
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
-- STEP 3: Policies for task_messages (for conversations)
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
-- STEP 4: Policies for task_progress_history (audit trail)
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
-- STEP 5: Policies for task_attachments
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
-- STEP 6: Policies for task_threads
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
-- STEP 7: RE-ENABLE RLS on all tables
-- ============================================================================

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_progress_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_threads ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 8: Verify policies were created
-- ============================================================================

SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE
    WHEN policyname LIKE '%admin%' THEN '✅ Admin/Developer policy'
    WHEN policyname LIKE '%assistant%' THEN '✅ Assistant policy'
    WHEN policyname LIKE '%assessor%' THEN '✅ Assessor policy'
    ELSE '✅ General policy'
  END as policy_type
FROM pg_policies
WHERE tablename IN ('tasks', 'task_messages', 'task_progress_history', 'task_attachments', 'task_threads')
ORDER BY tablename, cmd, policyname;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check RLS is enabled
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('tasks', 'task_messages', 'task_progress_history', 'task_attachments', 'task_threads')
ORDER BY tablename;

-- Count policies per table
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('tasks', 'task_messages', 'task_progress_history', 'task_attachments', 'task_threads')
GROUP BY tablename
ORDER BY tablename;
