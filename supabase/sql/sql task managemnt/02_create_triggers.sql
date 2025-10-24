-- ============================================================================
-- Task Management System - Triggers and Functions
-- ============================================================================
-- Description: Creates automatic triggers for timestamp updates, thread
--              completion calculations, and audit trail logging
-- Date: 2025-10-23
-- Dependencies: 01_create_task_tables.sql must be run first
-- Author: Claude Code
-- ============================================================================

-- ============================================================================
-- FUNCTION 1: Auto-update task timestamp on changes
-- ============================================================================
CREATE OR REPLACE FUNCTION update_task_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_update_timestamp
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_timestamp();

COMMENT ON FUNCTION update_task_timestamp() IS 'Automatically updates the updated_at timestamp when a task is modified';

-- ============================================================================
-- FUNCTION 2: Auto-calculate thread completion percentage
-- ============================================================================
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
      AND (archived IS NULL OR archived = false);  -- Exclude archived tasks

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

CREATE TRIGGER task_update_thread_completion
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_completion();

COMMENT ON FUNCTION update_thread_completion() IS 'Automatically recalculates thread completion percentage when tasks change';

-- ============================================================================
-- FUNCTION 3: Auto-log task history changes
-- ============================================================================
CREATE OR REPLACE FUNCTION log_task_history()
RETURNS TRIGGER AS $$
DECLARE
  v_change_type TEXT;
  v_old_value JSONB;
  v_new_value JSONB;
  v_description TEXT;
  v_changed_by UUID;
BEGIN
  -- Determine change type and values
  IF (TG_OP = 'INSERT') THEN
    v_change_type := 'created';
    v_new_value := to_jsonb(NEW);
    v_old_value := NULL;
    v_changed_by := NEW.assigned_by;
    v_description := format('Task created: %s', NEW.title);

  ELSIF (TG_OP = 'UPDATE') THEN
    -- Status changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_change_type := 'status_changed';
      v_old_value := jsonb_build_object('status', OLD.status);
      v_new_value := jsonb_build_object('status', NEW.status);
      v_description := format('Status changed from %s to %s', OLD.status, NEW.status);

      -- More specific change types for certain status changes
      IF NEW.status = 'completed' THEN
        v_change_type := 'completed';
      ELSIF NEW.status = 'verified' THEN
        v_change_type := 'verified';
      ELSIF NEW.status = 'cancelled' THEN
        v_change_type := 'cancelled';
      ELSIF OLD.status IN ('completed', 'verified') AND NEW.status IN ('in_progress', 'pending') THEN
        v_change_type := 'reopened';
      END IF;

    -- Assignment changed
    ELSIF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      v_change_type := 'reassigned';
      v_old_value := jsonb_build_object('assigned_to', OLD.assigned_to);
      v_new_value := jsonb_build_object('assigned_to', NEW.assigned_to);
      v_description := 'Task reassigned to different user';

    -- Progress updated
    ELSIF OLD.completion_percentage IS DISTINCT FROM NEW.completion_percentage THEN
      v_change_type := 'progress_updated';
      v_old_value := jsonb_build_object('completion_percentage', OLD.completion_percentage);
      v_new_value := jsonb_build_object('completion_percentage', NEW.completion_percentage);
      v_description := format('Progress updated from %s%% to %s%%',
        OLD.completion_percentage, NEW.completion_percentage);

    -- Priority changed
    ELSIF OLD.priority IS DISTINCT FROM NEW.priority THEN
      v_change_type := 'priority_changed';
      v_old_value := jsonb_build_object('priority', OLD.priority);
      v_new_value := jsonb_build_object('priority', NEW.priority);
      v_description := format('Priority changed from %s to %s', OLD.priority, NEW.priority);

    ELSE
      -- Generic update
      v_change_type := 'status_changed';
      v_old_value := to_jsonb(OLD);
      v_new_value := to_jsonb(NEW);
      v_description := 'Task updated';
    END IF;

    -- Get the user who made the change (from current session or assigned_by)
    v_changed_by := COALESCE(
      current_setting('app.current_user_id', true)::UUID,
      NEW.assigned_by
    );

  ELSE
    RETURN OLD;  -- DELETE not logged
  END IF;

  -- Insert into history table
  INSERT INTO public.task_progress_history (
    task_id,
    changed_by,
    change_type,
    old_value,
    new_value,
    change_description,
    changed_at
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    v_changed_by,
    v_change_type,
    v_old_value,
    v_new_value,
    v_description,
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_log_history
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_history();

COMMENT ON FUNCTION log_task_history() IS 'Automatically logs all task changes to the audit trail';

-- ============================================================================
-- FUNCTION 4: Auto-update thread timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_thread_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER thread_update_timestamp
  BEFORE UPDATE ON public.task_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_timestamp();

COMMENT ON FUNCTION update_thread_timestamp() IS 'Automatically updates the updated_at timestamp when a thread is modified';

-- ============================================================================
-- FUNCTION 5: Auto-create system message when task status changes
-- ============================================================================
CREATE OR REPLACE FUNCTION create_status_change_message()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_id UUID;
  v_sender_role TEXT;
  v_message TEXT;
BEGIN
  -- Only create message on status change
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN

    -- Get sender info
    v_sender_id := COALESCE(
      current_setting('app.current_user_id', true)::UUID,
      NEW.assigned_by
    );

    SELECT role INTO v_sender_role
    FROM public.profiles
    WHERE user_id = v_sender_id;

    -- Create appropriate message
    v_message := format('📊 Status updated: %s → %s',
      CASE OLD.status
        WHEN 'pending' THEN 'Pending'
        WHEN 'in_progress' THEN 'In Progress'
        WHEN 'awaiting_response' THEN 'Awaiting Response'
        WHEN 'completed' THEN 'Completed'
        WHEN 'verified' THEN 'Verified'
        WHEN 'cancelled' THEN 'Cancelled'
      END,
      CASE NEW.status
        WHEN 'pending' THEN 'Pending'
        WHEN 'in_progress' THEN 'In Progress'
        WHEN 'awaiting_response' THEN 'Awaiting Response'
        WHEN 'completed' THEN 'Completed'
        WHEN 'verified' THEN 'Verified'
        WHEN 'cancelled' THEN 'Cancelled'
      END
    );

    -- Insert system message
    INSERT INTO public.task_messages (
      task_id,
      message_text,
      message_type,
      sender_id,
      sender_role,
      created_at
    ) VALUES (
      NEW.id,
      v_message,
      'system',
      v_sender_id,
      COALESCE(v_sender_role, 'system'),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_create_status_message
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION create_status_change_message();

COMMENT ON FUNCTION create_status_change_message() IS 'Automatically creates a system message when task status changes';

-- ============================================================================
-- Success message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Successfully created 5 triggers and 5 functions for task management automation';
END $$;
