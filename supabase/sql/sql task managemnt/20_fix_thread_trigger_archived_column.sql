-- ============================================================================
-- FIX: Update thread completion trigger to use 'archived' instead of 'is_deleted'
-- ============================================================================
-- Description: The trigger was referencing a non-existent 'is_deleted' column
--              in the tasks table, causing task creation to fail with error 42703.
--              This migration updates the trigger to use the correct 'archived' column.
-- Date: 2025-10-24
-- Issue: Column "is_deleted" does not exist error when creating tasks
-- ============================================================================

-- Drop and recreate the function with the correct column reference
CREATE OR REPLACE FUNCTION update_thread_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_thread_id UUID;
  v_total INT;
  v_completed INT;
  v_percentage INT;
BEGIN
  -- Get thread_id from NEW or OLD record
  v_thread_id := COALESCE(NEW.thread_id, OLD.thread_id);

  -- Only proceed if task belongs to a thread
  IF v_thread_id IS NOT NULL THEN
    -- Calculate total and completed tasks in this thread
    SELECT
      COUNT(*),
      COUNT(*) FILTER (WHERE status IN ('completed', 'verified'))
    INTO v_total, v_completed
    FROM public.tasks
    WHERE thread_id = v_thread_id
      AND status != 'cancelled'
      AND (archived IS NULL OR archived = false);  -- FIXED: Use 'archived' instead of 'is_deleted'

    -- Calculate percentage
    IF v_total > 0 THEN
      v_percentage := ROUND((v_completed::DECIMAL / v_total::DECIMAL) * 100);
    ELSE
      v_percentage := 0;
    END IF;

    -- Update the thread with new calculations
    UPDATE public.task_threads
    SET
      total_tasks = v_total,
      completed_tasks = v_completed,
      thread_completion_percentage = v_percentage,
      updated_at = NOW(),
      -- Auto-complete thread if all tasks are done
      thread_status = CASE
        WHEN v_completed = v_total AND v_total > 0 THEN 'completed'
        WHEN thread_status = 'completed' AND v_completed < v_total THEN 'active'
        ELSE thread_status
      END,
      completed_at = CASE
        WHEN v_completed = v_total AND v_total > 0 THEN NOW()
        ELSE completed_at
      END
    WHERE id = v_thread_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Verify the fix
-- ============================================================================
SELECT
    proname as function_name,
    prosrc as function_source
FROM pg_proc
WHERE proname = 'update_thread_completion';

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- Trigger function updated successfully.
-- Task creation should now work without 'is_deleted' column error.
-- ============================================================================
