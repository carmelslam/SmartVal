-- ============================================================================
-- Task Management System - Row Level Security (RLS) Policies
-- ============================================================================
-- Description: Creates RLS policies for role-based access control
-- Date: 2025-10-23
-- Dependencies: 01_create_task_tables.sql must be run first
-- Author: Claude Code
--
-- Role Permissions Matrix:
-- - Admin/Developer: Full access to all tasks
-- - Assistant: Can see own tasks + created tasks, assign to self/assessors
-- - Assessor: Can only see own tasks, assign to self only
-- - Viewer: No access
-- ============================================================================

-- ============================================================================
-- Enable RLS on all task management tables
-- ============================================================================
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_progress_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_threads ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Helper function: Get current user's role
-- ============================================================================
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

COMMENT ON FUNCTION get_current_user_role() IS 'Returns the role of the currently authenticated user';

-- ============================================================================
-- RLS POLICIES FOR: tasks
-- ============================================================================

-- Policy: Admin and Developer can see all tasks
CREATE POLICY "tasks_select_admin_dev"
  ON public.tasks
  FOR SELECT
  USING (
    get_current_user_role() IN ('admin', 'developer')
  );

-- Policy: Assistant can see own tasks + tasks they created
CREATE POLICY "tasks_select_assistant"
  ON public.tasks
  FOR SELECT
  USING (
    get_current_user_role() = 'assistant'
    AND (assigned_to = auth.uid() OR assigned_by = auth.uid())
  );

-- Policy: Assessor can only see own tasks
CREATE POLICY "tasks_select_assessor"
  ON public.tasks
  FOR SELECT
  USING (
    get_current_user_role() = 'assessor'
    AND assigned_to = auth.uid()
  );

-- Policy: Admin and Developer can create tasks for anyone
CREATE POLICY "tasks_insert_admin_dev"
  ON public.tasks
  FOR INSERT
  WITH CHECK (
    get_current_user_role() IN ('admin', 'developer')
  );

-- Policy: Assistant can create tasks for self and assessors
CREATE POLICY "tasks_insert_assistant"
  ON public.tasks
  FOR INSERT
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
  WITH CHECK (
    get_current_user_role() = 'assessor'
    AND assigned_to = auth.uid()
  );

-- Policy: Admin and Developer can update all tasks
CREATE POLICY "tasks_update_admin_dev"
  ON public.tasks
  FOR UPDATE
  USING (
    get_current_user_role() IN ('admin', 'developer')
  );

-- Policy: Assistant can update own tasks + created tasks
CREATE POLICY "tasks_update_assistant"
  ON public.tasks
  FOR UPDATE
  USING (
    get_current_user_role() = 'assistant'
    AND (assigned_to = auth.uid() OR assigned_by = auth.uid())
  );

-- Policy: Assessor can update own tasks only
CREATE POLICY "tasks_update_assessor"
  ON public.tasks
  FOR UPDATE
  USING (
    get_current_user_role() = 'assessor'
    AND assigned_to = auth.uid()
  );

-- Policy: Only Admin/Developer can delete tasks
CREATE POLICY "tasks_delete_admin_dev"
  ON public.tasks
  FOR DELETE
  USING (
    get_current_user_role() IN ('admin', 'developer')
  );

-- ============================================================================
-- RLS POLICIES FOR: task_messages
-- ============================================================================

-- Policy: Users can see messages for tasks they have access to
CREATE POLICY "task_messages_select"
  ON public.task_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE id = task_id
        AND (
          get_current_user_role() IN ('admin', 'developer')
          OR assigned_to = auth.uid()
          OR assigned_by = auth.uid()
        )
    )
  );

-- Policy: Users can insert messages on tasks they have access to
CREATE POLICY "task_messages_insert"
  ON public.task_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE id = task_id
        AND (
          get_current_user_role() IN ('admin', 'developer')
          OR assigned_to = auth.uid()
          OR assigned_by = auth.uid()
        )
    )
    AND sender_id = auth.uid()  -- Can only send as yourself
  );

-- Policy: Users can update their own messages
CREATE POLICY "task_messages_update"
  ON public.task_messages
  FOR UPDATE
  USING (
    sender_id = auth.uid()
    OR get_current_user_role() IN ('admin', 'developer')
  );

-- Policy: Only sender or admin can delete messages
CREATE POLICY "task_messages_delete"
  ON public.task_messages
  FOR DELETE
  USING (
    sender_id = auth.uid()
    OR get_current_user_role() IN ('admin', 'developer')
  );

-- ============================================================================
-- RLS POLICIES FOR: task_progress_history
-- ============================================================================

-- Policy: Users can see history for tasks they have access to
CREATE POLICY "task_progress_history_select"
  ON public.task_progress_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE id = task_id
        AND (
          get_current_user_role() IN ('admin', 'developer')
          OR assigned_to = auth.uid()
          OR assigned_by = auth.uid()
        )
    )
  );

-- Policy: History is read-only for non-admin users (triggers create entries)
CREATE POLICY "task_progress_history_insert"
  ON public.task_progress_history
  FOR INSERT
  WITH CHECK (
    get_current_user_role() IN ('admin', 'developer')
    OR changed_by = auth.uid()  -- Or system creates it via trigger
  );

-- ============================================================================
-- RLS POLICIES FOR: task_attachments
-- ============================================================================

-- Policy: Users can see attachments for tasks they have access to
CREATE POLICY "task_attachments_select"
  ON public.task_attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE id = task_id
        AND (
          get_current_user_role() IN ('admin', 'developer')
          OR assigned_to = auth.uid()
          OR assigned_by = auth.uid()
        )
    )
  );

-- Policy: Users can upload attachments to tasks they have access to
CREATE POLICY "task_attachments_insert"
  ON public.task_attachments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE id = task_id
        AND (
          get_current_user_role() IN ('admin', 'developer')
          OR assigned_to = auth.uid()
          OR assigned_by = auth.uid()
        )
    )
    AND uploaded_by = auth.uid()  -- Can only upload as yourself
  );

-- Policy: Users can delete their own attachments, admin can delete any
CREATE POLICY "task_attachments_delete"
  ON public.task_attachments
  FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR get_current_user_role() IN ('admin', 'developer')
  );

-- ============================================================================
-- RLS POLICIES FOR: task_threads
-- ============================================================================

-- Policy: Admin/Developer can see all threads
CREATE POLICY "task_threads_select_admin_dev"
  ON public.task_threads
  FOR SELECT
  USING (
    get_current_user_role() IN ('admin', 'developer')
  );

-- Policy: Others can see threads they created or have tasks in
CREATE POLICY "task_threads_select_others"
  ON public.task_threads
  FOR SELECT
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tasks
      WHERE thread_id = task_threads.id
        AND (assigned_to = auth.uid() OR assigned_by = auth.uid())
    )
  );

-- Policy: Admin/Developer/Assistant can create threads
CREATE POLICY "task_threads_insert"
  ON public.task_threads
  FOR INSERT
  WITH CHECK (
    get_current_user_role() IN ('admin', 'developer', 'assistant')
    AND created_by = auth.uid()
  );

-- Policy: Creator or Admin can update threads
CREATE POLICY "task_threads_update"
  ON public.task_threads
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR get_current_user_role() IN ('admin', 'developer')
  );

-- Policy: Only Admin can delete threads
CREATE POLICY "task_threads_delete"
  ON public.task_threads
  FOR DELETE
  USING (
    get_current_user_role() IN ('admin', 'developer')
  );

-- ============================================================================
-- Success message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Successfully created RLS policies for all 5 task management tables';
  RAISE NOTICE '   - Admin/Developer: Full access';
  RAISE NOTICE '   - Assistant: Access to own + created tasks, can assign to assessors';
  RAISE NOTICE '   - Assessor: Access to own tasks only';
  RAISE NOTICE '   - Viewer: No access';
END $$;
