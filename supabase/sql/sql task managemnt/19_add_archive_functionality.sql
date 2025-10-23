-- ============================================================================
-- ADD ARCHIVE FUNCTIONALITY TO TASKS
-- ============================================================================
-- This migration adds archive capability to hide completed tasks from the
-- main list while keeping them accessible in an archive view
-- ============================================================================

-- Add archive columns to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- Create index for faster archived queries
CREATE INDEX IF NOT EXISTS idx_tasks_archived ON public.tasks(archived);

-- Create index for combined query (active tasks)
CREATE INDEX IF NOT EXISTS idx_tasks_active ON public.tasks(archived, status) WHERE archived = false;

-- Add comment
COMMENT ON COLUMN public.tasks.archived IS 'Whether this task has been archived (hidden from main list)';
COMMENT ON COLUMN public.tasks.archived_at IS 'Timestamp when task was archived';
COMMENT ON COLUMN public.tasks.archived_by IS 'User who archived this task';

-- Verify columns were added
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'tasks'
    AND column_name IN ('archived', 'archived_at', 'archived_by')
ORDER BY column_name;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- Archive a task (JavaScript will use this)
-- UPDATE public.tasks
-- SET archived = true, archived_at = NOW(), archived_by = auth.uid()
-- WHERE id = '<task-id>';

-- Get active (non-archived) tasks
-- SELECT * FROM public.tasks WHERE archived = false;

-- Get archived tasks
-- SELECT * FROM public.tasks WHERE archived = true ORDER BY archived_at DESC;

-- Restore a task from archive
-- UPDATE public.tasks
-- SET archived = false, archived_at = NULL, archived_by = NULL
-- WHERE id = '<task-id>';

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- Archive columns added successfully.
-- Tasks can now be archived and restored.
-- ============================================================================
