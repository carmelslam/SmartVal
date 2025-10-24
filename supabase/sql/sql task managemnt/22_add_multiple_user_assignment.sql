-- ============================================================================
-- ADD MULTIPLE USER ASSIGNMENT SUPPORT
-- ============================================================================
-- Description: Allows tasks to be assigned to multiple users (team tasks)
-- Date: 2025-10-24
-- Dependencies: public.tasks and public.profiles tables must exist
-- Author: Claude Code
-- ============================================================================

-- ============================================================================
-- TABLE: task_assignments (Junction table for multiple assignees)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.task_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,

  -- Assignment metadata
  is_primary BOOLEAN DEFAULT FALSE,  -- One user is primary assignee
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,

  -- Individual progress tracking (optional)
  individual_status TEXT CHECK (individual_status IN (
    'pending', 'in_progress', 'completed', 'verified'
  )) DEFAULT 'pending',
  individual_notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure each user is only assigned once per task
  UNIQUE(task_id, user_id)
);

-- ============================================================================
-- INDEXES for performance
-- ============================================================================
-- Get all tasks for a user
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_id
  ON public.task_assignments(user_id);

-- Get all assignees for a task
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id
  ON public.task_assignments(task_id);

-- Find primary assignee quickly
CREATE INDEX IF NOT EXISTS idx_task_assignments_primary
  ON public.task_assignments(task_id, is_primary)
  WHERE is_primary = TRUE;

-- ============================================================================
-- COMMENTS for documentation
-- ============================================================================
COMMENT ON TABLE public.task_assignments IS 'Junction table for assigning tasks to multiple users';
COMMENT ON COLUMN public.task_assignments.is_primary IS 'Indicates the primary assignee (main responsible person)';
COMMENT ON COLUMN public.task_assignments.individual_status IS 'Optional per-user completion status';

-- ============================================================================
-- FUNCTION: Sync primary assignee with tasks.assigned_to
-- ============================================================================
-- This keeps the existing assigned_to column in sync with the primary assignee
-- for backwards compatibility
CREATE OR REPLACE FUNCTION sync_primary_assignee()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new primary assignee is set, update tasks.assigned_to
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.is_primary = TRUE THEN
    UPDATE public.tasks
    SET assigned_to = NEW.user_id
    WHERE id = NEW.task_id;

    -- Ensure only one primary assignee per task
    UPDATE public.task_assignments
    SET is_primary = FALSE
    WHERE task_id = NEW.task_id
      AND id != NEW.id
      AND is_primary = TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_assignments_sync_primary
  AFTER INSERT OR UPDATE ON public.task_assignments
  FOR EACH ROW
  WHEN (NEW.is_primary = TRUE)
  EXECUTE FUNCTION sync_primary_assignee();

COMMENT ON FUNCTION sync_primary_assignee() IS 'Keeps tasks.assigned_to in sync with primary assignee';

-- ============================================================================
-- MIGRATION: Populate task_assignments from existing tasks
-- ============================================================================
-- This migrates all existing single assignments to the new junction table
INSERT INTO public.task_assignments (task_id, user_id, is_primary, assigned_by, assigned_at)
SELECT
  id as task_id,
  assigned_to as user_id,
  TRUE as is_primary,
  assigned_by,
  created_at as assigned_at
FROM public.tasks
WHERE NOT EXISTS (
  SELECT 1 FROM public.task_assignments ta
  WHERE ta.task_id = tasks.id AND ta.user_id = tasks.assigned_to
);

-- ============================================================================
-- Success message
-- ============================================================================
DO $$
DECLARE
  assignment_count INT;
BEGIN
  SELECT COUNT(*) INTO assignment_count FROM public.task_assignments;
  RAISE NOTICE '✅ Successfully created task_assignments table';
  RAISE NOTICE 'ℹ️  Migrated % existing task assignments', assignment_count;
  RAISE NOTICE 'ℹ️  You can now assign tasks to multiple users!';
END $$;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================
-- Assign task to multiple users:
-- INSERT INTO public.task_assignments (task_id, user_id, is_primary, assigned_by)
-- VALUES
--   ('task-uuid', 'user1-uuid', TRUE, 'admin-uuid'),   -- Primary assignee
--   ('task-uuid', 'user2-uuid', FALSE, 'admin-uuid'),  -- Additional
--   ('task-uuid', 'user3-uuid', FALSE, 'admin-uuid');  -- Additional

-- Get all assignees for a task:
-- SELECT ta.*, p.name, p.role
-- FROM public.task_assignments ta
-- JOIN public.profiles p ON p.user_id = ta.user_id
-- WHERE ta.task_id = 'task-uuid'
-- ORDER BY ta.is_primary DESC, ta.created_at;

-- Get all tasks for a user (including team tasks):
-- SELECT t.*, ta.is_primary
-- FROM public.tasks t
-- JOIN public.task_assignments ta ON ta.task_id = t.id
-- WHERE ta.user_id = 'user-uuid'
-- ORDER BY t.created_at DESC;

-- ============================================================================
