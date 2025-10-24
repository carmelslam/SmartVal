-- ============================================================================
-- CREATE NOTIFICATIONS TABLE
-- ============================================================================
-- This migration adds a notification center/history system
-- Stores all notifications sent to users for persistent access
-- ============================================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  url TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  data JSONB
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Create composite index for fetching unread notifications efficiently
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, created_at DESC)
  WHERE read = false;

-- Create composite index for fetching all user notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_all
  ON public.notifications(user_id, created_at DESC);

-- Add comments to columns
COMMENT ON TABLE public.notifications IS 'User notification center - stores all notifications sent to users';
COMMENT ON COLUMN public.notifications.id IS 'Unique identifier for the notification';
COMMENT ON COLUMN public.notifications.user_id IS 'User who should receive this notification';
COMMENT ON COLUMN public.notifications.type IS 'Notification type (task_assigned, task_message, task_status_changed, etc.)';
COMMENT ON COLUMN public.notifications.title IS 'Notification title/heading';
COMMENT ON COLUMN public.notifications.message IS 'Notification message body';
COMMENT ON COLUMN public.notifications.url IS 'URL to navigate to when notification is clicked';
COMMENT ON COLUMN public.notifications.read IS 'Whether the user has read this notification';
COMMENT ON COLUMN public.notifications.created_at IS 'When the notification was created';
COMMENT ON COLUMN public.notifications.read_at IS 'When the user marked this notification as read';
COMMENT ON COLUMN public.notifications.data IS 'Additional structured data (task_id, etc.)';

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy 2: System can insert notifications for any user
-- (In practice, this will be called from backend/webhook)
CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Policy 3: Users can update their own notifications (for marking as read)
CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy 4: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get unread notification count for a user
CREATE OR REPLACE FUNCTION get_unread_notification_count(target_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.notifications
    WHERE user_id = target_user_id
    AND read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET read = true, read_at = NOW()
  WHERE user_id = target_user_id
  AND read = false;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete old read notifications (cleanup)
CREATE OR REPLACE FUNCTION cleanup_old_notifications(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.notifications
  WHERE read = true
  AND created_at < NOW() - (days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
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
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- Insert a notification
-- INSERT INTO public.notifications (user_id, type, title, message, url)
-- VALUES ('<user-id>', 'task_assigned', 'משימה חדשה', 'קיבלת משימה חדשה', '/task-detail.html?id=<task-id>');

-- Get all notifications for a user (most recent first)
-- SELECT * FROM public.notifications
-- WHERE user_id = auth.uid()
-- ORDER BY created_at DESC
-- LIMIT 20;

-- Get only unread notifications
-- SELECT * FROM public.notifications
-- WHERE user_id = auth.uid()
-- AND read = false
-- ORDER BY created_at DESC;

-- Mark a notification as read
-- UPDATE public.notifications
-- SET read = true, read_at = NOW()
-- WHERE id = '<notification-id>' AND user_id = auth.uid();

-- Mark all notifications as read for current user
-- SELECT mark_all_notifications_read(auth.uid());

-- Get unread count
-- SELECT get_unread_notification_count(auth.uid());

-- Delete old read notifications (older than 30 days)
-- SELECT cleanup_old_notifications(30);

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- Notifications table created successfully.
-- Users can now view their notification history.
-- Notifications persist across sessions.
-- ============================================================================
