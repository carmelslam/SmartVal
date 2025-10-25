-- =====================================================
-- Phase 9: Admin Hub Enhancement
-- Script 05: Reminders Table
-- Date: 2025-10-24
-- Session: 75
-- =====================================================
--
-- Purpose: Create reminders table for payment and follow-up reminders
-- Dependencies:
--   - Requires: profiles table (from Phase 6)
--   - Requires: cases table (from Phase 4)
-- Auth Integration: User tracking and role-based permissions
-- =====================================================

-- Drop table if exists (for development only - comment out for production)
-- DROP TABLE IF EXISTS reminders CASCADE;

-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,

  -- Related plate (for quick lookups)
  plate TEXT,

  -- Reminder title (תיאור קצר)
  title TEXT NOT NULL,

  -- Reminder description (הערות מפורטות)
  description TEXT,

  -- Category (קטגוריה)
  category TEXT DEFAULT 'תזכורת כללית' CHECK (
    category IN (
      'תזכורת תשלום',      -- payment reminder
      'תזכורת מעקב',       -- follow-up reminder
      'תזכורת מסמכים',     -- documents reminder
      'תזכורת בדיקה',      -- inspection reminder
      'תזכורת כללית'       -- general reminder
    )
  ),

  -- Due date (תאריך יעד)
  due_date DATE NOT NULL,

  -- Status (סטטוס)
  status TEXT DEFAULT 'ממתין' CHECK (
    status IN (
      'ממתין',        -- pending
      'הושלם',        -- completed
      'באיחור',       -- overdue
      'בוטל'          -- cancelled
    )
  ),

  -- Priority (עדיפות)
  priority TEXT DEFAULT 'רגיל' CHECK (
    priority IN (
      'נמוך',         -- low
      'רגיל',         -- normal
      'גבוה',         -- high
      'דחוף'          -- urgent
    )
  ),

  -- Recurring reminder settings
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT, -- 'daily', 'weekly', 'monthly'
  recurrence_end_date DATE,

  -- Notification settings
  send_notification BOOLEAN DEFAULT true,
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,

  -- Completion tracking
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,

  -- User tracking (Phase 6 auth integration)
  created_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Indexes for performance
-- =====================================================

-- Index on case_id for joins
CREATE INDEX IF NOT EXISTS idx_reminders_case_id
ON reminders(case_id);

-- Index on plate for quick lookups
CREATE INDEX IF NOT EXISTS idx_reminders_plate
ON reminders(plate);

-- Index on due_date for overdue detection
CREATE INDEX IF NOT EXISTS idx_reminders_due_date
ON reminders(due_date);

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_reminders_status
ON reminders(status);

-- Index on category for filtering
CREATE INDEX IF NOT EXISTS idx_reminders_category
ON reminders(category);

-- Index on created_by for user's reminders
CREATE INDEX IF NOT EXISTS idx_reminders_created_by
ON reminders(created_by);

-- Composite index for overdue reminders
CREATE INDEX IF NOT EXISTS idx_reminders_overdue
ON reminders(due_date, status)
WHERE status = 'ממתין';

-- Composite index for pending notifications
CREATE INDEX IF NOT EXISTS idx_reminders_pending_notification
ON reminders(due_date, notification_sent)
WHERE notification_sent = false AND send_notification = true;

-- =====================================================
-- Trigger: Auto-update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_reminders_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reminders_updated_at
  BEFORE UPDATE ON reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_reminders_timestamp();

-- =====================================================
-- Trigger: Auto-set completed_at when status changes to completed
-- =====================================================

CREATE OR REPLACE FUNCTION set_reminder_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'הושלם' AND OLD.status != 'הושלם' THEN
    NEW.completed_at = now();
    NEW.completed_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_reminder_completed
  BEFORE UPDATE ON reminders
  FOR EACH ROW
  WHEN (NEW.status = 'הושלם' AND OLD.status IS DISTINCT FROM 'הושלם')
  EXECUTE FUNCTION set_reminder_completed();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own organization's reminders
-- (For now, all authenticated users can view all reminders)
CREATE POLICY "reminders_select_policy"
ON reminders
FOR SELECT
TO authenticated
USING (true);

-- Policy: Authenticated users can insert reminders
CREATE POLICY "reminders_insert_policy"
ON reminders
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Policy: Users can update reminders (can be restricted later)
CREATE POLICY "reminders_update_policy"
ON reminders
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Users can delete their own reminders, admins can delete any
CREATE POLICY "reminders_delete_policy"
ON reminders
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'developer')
  )
);

-- =====================================================
-- Helper function: Get overdue reminders
-- =====================================================

CREATE OR REPLACE FUNCTION get_overdue_reminders()
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  due_date DATE,
  days_overdue INT,
  plate TEXT,
  priority TEXT,
  created_by UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.title,
    r.description,
    r.category,
    r.due_date,
    (CURRENT_DATE - r.due_date)::INT as days_overdue,
    r.plate,
    r.priority,
    r.created_by
  FROM reminders r
  WHERE r.due_date < CURRENT_DATE
    AND r.status = 'ממתין'
  ORDER BY r.priority DESC, r.due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Helper function: Get reminders by case
-- =====================================================

CREATE OR REPLACE FUNCTION get_case_reminders(p_case_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  due_date DATE,
  status TEXT,
  priority TEXT,
  is_overdue BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.title,
    r.description,
    r.category,
    r.due_date,
    r.status,
    r.priority,
    (r.due_date < CURRENT_DATE AND r.status = 'ממתין') as is_overdue
  FROM reminders r
  WHERE r.case_id = p_case_id
  ORDER BY r.due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Helper function: Get reminders by plate
-- =====================================================

CREATE OR REPLACE FUNCTION get_plate_reminders(p_plate TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  due_date DATE,
  status TEXT,
  priority TEXT,
  is_overdue BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.title,
    r.description,
    r.category,
    r.due_date,
    r.status,
    r.priority,
    (r.due_date < CURRENT_DATE AND r.status = 'ממתין') as is_overdue
  FROM reminders r
  WHERE r.plate = p_plate
  ORDER BY r.due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Helper function: Update overdue reminder statuses
-- =====================================================

CREATE OR REPLACE FUNCTION update_overdue_reminder_status()
RETURNS INT AS $$
DECLARE
  updated_count INT;
BEGIN
  UPDATE reminders
  SET
    status = 'באיחור',
    updated_at = now()
  WHERE due_date < CURRENT_DATE
    AND status = 'ממתין';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Helper function: Create payment reminder from payment tracking
-- =====================================================

CREATE OR REPLACE FUNCTION create_payment_reminder(
  p_case_id UUID,
  p_plate TEXT,
  p_expected_payment_date DATE,
  p_total_fee NUMERIC,
  p_days_before INT DEFAULT 7
)
RETURNS UUID AS $$
DECLARE
  reminder_id UUID;
  reminder_date DATE;
BEGIN
  -- Calculate reminder date (7 days before payment due)
  reminder_date := p_expected_payment_date - (p_days_before || ' days')::INTERVAL;

  -- Insert reminder
  INSERT INTO reminders (
    case_id,
    plate,
    title,
    description,
    category,
    due_date,
    status,
    priority,
    send_notification,
    created_by
  )
  VALUES (
    p_case_id,
    p_plate,
    'תזכורת תשלום - ' || p_plate,
    'תשלום של ' || p_total_fee || ' ₪ צפוי בתאריך ' || p_expected_payment_date,
    'תזכורת תשלום',
    reminder_date,
    'ממתין',
    'גבוה',
    true,
    auth.uid()
  )
  RETURNING id INTO reminder_id;

  RETURN reminder_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE reminders IS 'Reminders system for payments and follow-ups (Phase 9)';
COMMENT ON COLUMN reminders.title IS 'תיאור קצר - Short description';
COMMENT ON COLUMN reminders.description IS 'הערות מפורטות - Detailed notes';
COMMENT ON COLUMN reminders.category IS 'קטגוריה - Category (payment, follow-up, documents, inspection, general)';
COMMENT ON COLUMN reminders.due_date IS 'תאריך יעד - Due date';
COMMENT ON COLUMN reminders.status IS 'סטטוס - Status (pending, completed, overdue, cancelled)';
COMMENT ON COLUMN reminders.priority IS 'עדיפות - Priority (low, normal, high, urgent)';
COMMENT ON COLUMN reminders.is_recurring IS 'Recurring reminder flag';
COMMENT ON COLUMN reminders.recurrence_pattern IS 'Recurrence pattern: daily, weekly, monthly';
COMMENT ON COLUMN reminders.send_notification IS 'Should send notification flag';

-- =====================================================
-- Grant permissions
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON reminders TO authenticated; -- RLS restricts

GRANT EXECUTE ON FUNCTION get_overdue_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION get_case_reminders(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_plate_reminders(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_overdue_reminder_status() TO authenticated;
GRANT EXECUTE ON FUNCTION create_payment_reminder(UUID, TEXT, DATE, NUMERIC, INT) TO authenticated;

-- =====================================================
-- END OF SCRIPT
-- =====================================================
