-- ============================================================================
-- RECURRING TASKS - AUTO-CREATE TASKS ON SCHEDULE
-- ============================================================================
-- Description: Allows tasks to be automatically created on daily, weekly, or monthly schedules
-- Date: 2025-10-24
-- Dependencies: public.tasks, public.profiles tables must exist
-- Author: Claude Code
-- ============================================================================

-- ============================================================================
-- TABLE: recurring_tasks (Schedule configurations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.recurring_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Template info (what task to create)
  template_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT CHECK (task_type IN (
    'case_action', 'document_request', 'review_request',
    'data_correction', 'follow_up', 'custom'
  )) DEFAULT 'custom',
  priority TEXT NOT NULL CHECK (priority IN (
    'low', 'medium', 'high', 'urgent'
  )) DEFAULT 'medium',

  -- Assignment (can be multiple users stored as JSON array)
  assigned_to_users JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of user_ids
  assigned_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,

  -- Recurrence pattern
  recurrence_type TEXT NOT NULL CHECK (recurrence_type IN (
    'daily', 'weekly', 'monthly', 'yearly'
  )),
  recurrence_interval INT NOT NULL DEFAULT 1, -- Every X days/weeks/months

  -- For weekly: which days (0=Sunday, 1=Monday, ..., 6=Saturday)
  days_of_week JSONB DEFAULT '[]'::jsonb, -- e.g., [1,3,5] for Mon, Wed, Fri

  -- For monthly: which day of month (1-31)
  day_of_month INT CHECK (day_of_month BETWEEN 1 AND 31),

  -- Schedule timing
  start_date DATE NOT NULL,
  end_date DATE, -- NULL = never ends
  next_run_date DATE NOT NULL,
  time_of_day TIME DEFAULT '09:00:00', -- When to create task each day

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  paused BOOLEAN DEFAULT FALSE,

  -- Statistics
  total_tasks_created INT DEFAULT 0,
  last_run_date TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL
);

-- ============================================================================
-- INDEXES for performance
-- ============================================================================
-- Find active recurring tasks that are due
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_next_run
  ON public.recurring_tasks(next_run_date, is_active)
  WHERE is_active = TRUE AND paused = FALSE;

-- Find recurring tasks by creator
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_created_by
  ON public.recurring_tasks(created_by);

-- ============================================================================
-- COMMENTS for documentation
-- ============================================================================
COMMENT ON TABLE public.recurring_tasks IS 'Schedules for automatically creating recurring tasks';
COMMENT ON COLUMN public.recurring_tasks.recurrence_interval IS 'How often to recur (e.g., 1 = every day, 2 = every 2 weeks)';
COMMENT ON COLUMN public.recurring_tasks.days_of_week IS 'For weekly: array of day numbers [0-6] where 0=Sunday';
COMMENT ON COLUMN public.recurring_tasks.assigned_to_users IS 'Array of user_ids to assign task to';

-- ============================================================================
-- FUNCTION: Calculate next run date for recurring task
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_next_run_date(
  p_recurrence_type TEXT,
  p_interval INT,
  p_current_date DATE,
  p_days_of_week JSONB,
  p_day_of_month INT
)
RETURNS DATE AS $$
DECLARE
  v_next_date DATE;
  v_current_dow INT; -- Day of week (0-6)
  v_days_array INT[];
  v_target_day INT;
  v_days_ahead INT;
BEGIN
  CASE p_recurrence_type
    -- Daily recurrence
    WHEN 'daily' THEN
      v_next_date := p_current_date + (p_interval || ' days')::INTERVAL;

    -- Weekly recurrence
    WHEN 'weekly' THEN
      -- Get current day of week (0=Sunday)
      v_current_dow := EXTRACT(DOW FROM p_current_date)::INT;

      -- Convert JSONB to array of integers
      SELECT ARRAY(SELECT jsonb_array_elements_text(p_days_of_week)::INT)
      INTO v_days_array;

      -- Find next occurrence
      -- First, try to find a day later this week
      v_days_ahead := NULL;
      FOREACH v_target_day IN ARRAY v_days_array LOOP
        IF v_target_day > v_current_dow THEN
          IF v_days_ahead IS NULL OR (v_target_day - v_current_dow) < v_days_ahead THEN
            v_days_ahead := v_target_day - v_current_dow;
          END IF;
        END IF;
      END LOOP;

      -- If no day found this week, get first day next week
      IF v_days_ahead IS NULL THEN
        v_target_day := v_days_array[1]; -- First day in array
        v_days_ahead := (7 - v_current_dow + v_target_day) + (7 * (p_interval - 1));
      END IF;

      v_next_date := p_current_date + (v_days_ahead || ' days')::INTERVAL;

    -- Monthly recurrence
    WHEN 'monthly' THEN
      v_next_date := (DATE_TRUNC('month', p_current_date) +
                      (p_interval || ' months')::INTERVAL +
                      ((p_day_of_month - 1) || ' days')::INTERVAL)::DATE;

      -- If target day doesn't exist in month (e.g., Feb 30), use last day of month
      IF EXTRACT(DAY FROM v_next_date) != p_day_of_month THEN
        v_next_date := (DATE_TRUNC('month', v_next_date) +
                        INTERVAL '1 month' - INTERVAL '1 day')::DATE;
      END IF;

    -- Yearly recurrence
    WHEN 'yearly' THEN
      v_next_date := p_current_date + (p_interval || ' years')::INTERVAL;

    ELSE
      v_next_date := p_current_date + INTERVAL '1 day';
  END CASE;

  RETURN v_next_date;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_next_run_date IS 'Calculates the next run date for a recurring task';

-- ============================================================================
-- Success message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Successfully created recurring_tasks table';
  RAISE NOTICE 'ℹ️  Use this to automatically create tasks on a schedule';
  RAISE NOTICE 'ℹ️  Supports daily, weekly, monthly, and yearly recurrence';
END $$;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================
-- Create daily recurring task:
-- INSERT INTO public.recurring_tasks (
--   template_name, title, description, task_type, priority,
--   assigned_to_users, assigned_by,
--   recurrence_type, recurrence_interval,
--   start_date, next_run_date
-- ) VALUES (
--   'Daily Inventory Check',
--   'בדוק מלאי',
--   'בדיקת מלאי יומית',
--   'follow_up',
--   'medium',
--   '["user-uuid-1", "user-uuid-2"]'::jsonb,
--   'admin-uuid',
--   'daily',
--   1,
--   CURRENT_DATE,
--   CURRENT_DATE
-- );

-- Create weekly recurring task (Mon, Wed, Fri):
-- INSERT INTO public.recurring_tasks (
--   template_name, title, recurrence_type,
--   days_of_week, start_date, next_run_date, assigned_to_users, assigned_by
-- ) VALUES (
--   'Weekly Report',
--   'דוח שבועי',
--   'weekly',
--   '[1,3,5]'::jsonb,  -- Monday, Wednesday, Friday
--   CURRENT_DATE,
--   CURRENT_DATE,
--   '["user-uuid"]'::jsonb,
--   'admin-uuid'
-- );

-- Create monthly recurring task (1st of each month):
-- INSERT INTO public.recurring_tasks (
--   template_name, title, recurrence_type,
--   day_of_month, start_date, next_run_date, assigned_to_users, assigned_by
-- ) VALUES (
--   'Monthly Review',
--   'סקירה חודשית',
--   'monthly',
--   1,
--   CURRENT_DATE,
--   CURRENT_DATE,
--   '["user-uuid"]'::jsonb,
--   'admin-uuid'
-- );

-- ============================================================================
