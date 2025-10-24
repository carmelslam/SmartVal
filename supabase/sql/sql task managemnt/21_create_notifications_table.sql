-- ============================================================================
-- CREATE NOTIFICATIONS TABLE FOR IN-APP NOTIFICATION CENTER
-- ============================================================================
-- Description: Creates a table to store in-app notifications with read/unread status
-- Date: 2025-10-24
-- Dependencies: public.profiles, public.tasks tables must exist
-- Author: Claude Code
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: notifications (In-app notification history)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User who receives this notification
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,

  -- Notification content
  type TEXT NOT NULL CHECK (type IN (
    'task_assigned', 'task_updated', 'task_completed',
    'task_status_changed', 'task_message', 'task_due_soon',
    'tasks_batch_assigned', 'mention', 'system'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  url TEXT,  -- Where to navigate when clicked

  -- Optional task reference
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,

  -- Read status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ  -- Optional: auto-delete old notifications
);

-- ============================================================================
-- INDEXES for performance
-- ============================================================================
-- Main query: Get all notifications for a user, unread first
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON public.notifications(user_id, read, created_at DESC);

-- Count unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON public.notifications(user_id)
  WHERE read = FALSE;

-- Clean up old notifications
CREATE INDEX IF NOT EXISTS idx_notifications_expires
  ON public.notifications(expires_at)
  WHERE expires_at IS NOT NULL;

-- Task reference lookup
CREATE INDEX IF NOT EXISTS idx_notifications_task_id
  ON public.notifications(task_id)
  WHERE task_id IS NOT NULL;

-- ============================================================================
-- COMMENTS for documentation
-- ============================================================================
COMMENT ON TABLE public.notifications IS 'In-app notification history with read/unread status';
COMMENT ON COLUMN public.notifications.type IS 'Type of notification for filtering and icons';
COMMENT ON COLUMN public.notifications.url IS 'URL to navigate when notification is clicked';
COMMENT ON COLUMN public.notifications.expires_at IS 'Optional expiration date for auto-cleanup';

-- ============================================================================
-- FUNCTION: Auto-delete expired notifications (optional cleanup)
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_notifications() IS 'Deletes notifications past their expiration date';

-- ============================================================================
-- Success message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Successfully created notifications table with 4 indexes';
  RAISE NOTICE 'ℹ️  Run cleanup_expired_notifications() periodically to remove old notifications';
END $$;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================
-- Create a notification:
-- INSERT INTO public.notifications (user_id, type, title, message, url, task_id)
-- VALUES (
--   'user-uuid',
--   'task_assigned',
--   'משימה חדשה',
--   'קיבלת משימה חדשה: לבדוק מלאי',
--   '/task-detail.html?id=task-uuid',
--   'task-uuid'
-- );

-- Get unread notifications for user:
-- SELECT * FROM public.notifications
-- WHERE user_id = 'user-uuid' AND read = FALSE
-- ORDER BY created_at DESC;

-- Mark notification as read:
-- UPDATE public.notifications
-- SET read = TRUE, read_at = NOW()
-- WHERE id = 'notification-uuid';

-- Get unread count:
-- SELECT COUNT(*) FROM public.notifications
-- WHERE user_id = 'user-uuid' AND read = FALSE;

-- ============================================================================
