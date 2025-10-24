-- ============================================================================
-- CREATE TASK COMMENTS TABLE
-- ============================================================================
-- This migration adds a commenting/messaging system for tasks
-- Enables users to have threaded conversations on tasks
-- ============================================================================

-- Create task_comments table
CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  parent_comment_id UUID REFERENCES public.task_comments(id) ON DELETE CASCADE,
  attachments JSONB,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON public.task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON public.task_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_comments_parent ON public.task_comments(parent_comment_id);

-- Create composite index for fetching task comments efficiently
CREATE INDEX IF NOT EXISTS idx_task_comments_task_created
  ON public.task_comments(task_id, created_at DESC)
  WHERE is_deleted = false;

-- Add comments to columns
COMMENT ON TABLE public.task_comments IS 'Comments and messages on tasks';
COMMENT ON COLUMN public.task_comments.id IS 'Unique identifier for the comment';
COMMENT ON COLUMN public.task_comments.task_id IS 'The task this comment belongs to';
COMMENT ON COLUMN public.task_comments.user_id IS 'User who wrote the comment';
COMMENT ON COLUMN public.task_comments.comment_text IS 'The actual comment text';
COMMENT ON COLUMN public.task_comments.created_at IS 'When the comment was created';
COMMENT ON COLUMN public.task_comments.updated_at IS 'When the comment was last updated';
COMMENT ON COLUMN public.task_comments.parent_comment_id IS 'Parent comment for threaded discussions (NULL for top-level comments)';
COMMENT ON COLUMN public.task_comments.attachments IS 'JSON array of attached files/images';
COMMENT ON COLUMN public.task_comments.is_edited IS 'Whether this comment has been edited';
COMMENT ON COLUMN public.task_comments.is_deleted IS 'Soft delete flag (deleted comments show as [deleted])';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_task_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_comments_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view comments on tasks they have access to
CREATE POLICY "Users can view comments on accessible tasks"
  ON public.task_comments
  FOR SELECT
  USING (
    -- User can see comments if they can see the task
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_comments.task_id
      AND (
        -- Admin can see all
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
        OR
        -- Assigned user can see
        t.assigned_to = auth.uid()
        OR
        -- Task creator can see
        t.created_by = auth.uid()
        OR
        -- Assistants can see tasks assigned to users under them
        (
          (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'assistant'
          AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id = t.assigned_to
            AND p.supervisor_id = auth.uid()
          )
        )
      )
    )
  );

-- Policy 2: Users can add comments to tasks they have access to
CREATE POLICY "Users can add comments to accessible tasks"
  ON public.task_comments
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_comments.task_id
      AND (
        -- Admin can comment anywhere
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
        OR
        -- Assigned user can comment
        t.assigned_to = auth.uid()
        OR
        -- Task creator can comment
        t.created_by = auth.uid()
        OR
        -- Assistants can comment on tasks assigned to users under them
        (
          (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'assistant'
          AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id = t.assigned_to
            AND p.supervisor_id = auth.uid()
          )
        )
      )
    )
  );

-- Policy 3: Users can update their own comments (for editing)
CREATE POLICY "Users can update their own comments"
  ON public.task_comments
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy 4: Users can delete their own comments OR admins can delete any
CREATE POLICY "Users can delete own comments, admins can delete any"
  ON public.task_comments
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- HELPER FUNCTION: Get comment count for a task
-- ============================================================================

CREATE OR REPLACE FUNCTION get_task_comment_count(task_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.task_comments
    WHERE task_id = task_uuid
    AND is_deleted = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTION: Get latest comment for a task
-- ============================================================================

CREATE OR REPLACE FUNCTION get_latest_task_comment(task_uuid UUID)
RETURNS TABLE (
  comment_text TEXT,
  created_at TIMESTAMPTZ,
  user_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.comment_text,
    tc.created_at,
    p.name
  FROM public.task_comments tc
  JOIN public.profiles p ON p.user_id = tc.user_id
  WHERE tc.task_id = task_uuid
  AND tc.is_deleted = false
  ORDER BY tc.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFY TABLE CREATION
-- ============================================================================

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'task_comments'
ORDER BY ordinal_position;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- Add a comment to a task
-- INSERT INTO public.task_comments (task_id, user_id, comment_text)
-- VALUES ('<task-id>', auth.uid(), 'This is my comment');

-- Get all comments for a task (ordered by creation time)
-- SELECT
--   tc.*,
--   p.name as user_name,
--   p.email as user_email
-- FROM public.task_comments tc
-- JOIN public.profiles p ON p.user_id = tc.user_id
-- WHERE tc.task_id = '<task-id>'
-- AND tc.is_deleted = false
-- ORDER BY tc.created_at ASC;

-- Get threaded comments (with parent-child relationship)
-- SELECT
--   tc.*,
--   p.name as user_name,
--   parent_tc.comment_text as parent_comment
-- FROM public.task_comments tc
-- JOIN public.profiles p ON p.user_id = tc.user_id
-- LEFT JOIN public.task_comments parent_tc ON parent_tc.id = tc.parent_comment_id
-- WHERE tc.task_id = '<task-id>'
-- AND tc.is_deleted = false
-- ORDER BY
--   COALESCE(tc.parent_comment_id, tc.id),
--   tc.created_at ASC;

-- Edit a comment (sets is_edited flag)
-- UPDATE public.task_comments
-- SET comment_text = 'Updated text', is_edited = true
-- WHERE id = '<comment-id>' AND user_id = auth.uid();

-- Soft delete a comment
-- UPDATE public.task_comments
-- SET is_deleted = true, comment_text = '[deleted]'
-- WHERE id = '<comment-id>' AND user_id = auth.uid();

-- Get comment count for a task
-- SELECT get_task_comment_count('<task-id>');

-- Get latest comment for a task
-- SELECT * FROM get_latest_task_comment('<task-id>');

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- Task comments table created successfully.
-- Users can now comment on tasks with threaded discussions.
-- RLS policies ensure proper access control.
-- ============================================================================
