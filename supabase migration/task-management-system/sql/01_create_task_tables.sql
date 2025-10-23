-- ============================================================================
-- Task Management System - Table Creation
-- ============================================================================
-- Description: Creates 5 core tables for the task management system
-- Date: 2025-10-23
-- Dependencies: public.profiles table must exist
-- Author: Claude Code
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE 1: tasks (Core task entity)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Task info
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT CHECK (task_type IN (
    'case_action', 'document_request', 'review_request',
    'data_correction', 'follow_up', 'custom'
  )) DEFAULT 'custom',

  -- Assignment
  assigned_to UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE SET NULL,

  -- Case linkage (optional)
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  plate TEXT,

  -- Status & priority
  status TEXT NOT NULL CHECK (status IN (
    'pending', 'in_progress', 'awaiting_response',
    'completed', 'verified', 'cancelled'
  )) DEFAULT 'pending',
  priority TEXT NOT NULL CHECK (priority IN (
    'low', 'medium', 'high', 'urgent'
  )) DEFAULT 'medium',

  -- Progress
  completion_percentage INT DEFAULT 0
    CHECK (completion_percentage BETWEEN 0 AND 100),

  -- Timing
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,

  -- Thread tracking
  thread_id UUID,
  parent_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for tasks table
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON public.tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_case_id ON public.tasks(case_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_thread_id ON public.tasks(thread_id);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

COMMENT ON TABLE public.tasks IS 'Core task management table for assigning and tracking work items';

-- ============================================================================
-- TABLE 2: task_messages (Conversation threads)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.task_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,

  -- Message content
  message_text TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN (
    'comment', 'question', 'answer', 'status_update', 'system'
  )) DEFAULT 'comment',

  -- Author
  sender_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL,

  -- Attachments (stored as JSONB array)
  attachments JSONB DEFAULT '[]'::jsonb,

  -- Notifications
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMPTZ,

  -- Read receipts
  read_by JSONB DEFAULT '[]'::jsonb,  -- Array of {user_id, read_at}

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Indexes for task_messages table
CREATE INDEX IF NOT EXISTS idx_task_messages_task_id ON public.task_messages(task_id);
CREATE INDEX IF NOT EXISTS idx_task_messages_sender_id ON public.task_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_task_messages_created_at ON public.task_messages(created_at);

COMMENT ON TABLE public.task_messages IS 'Conversation messages and updates for tasks';

-- ============================================================================
-- TABLE 3: task_progress_history (Audit trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.task_progress_history (
  id BIGSERIAL PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,

  -- Change tracking
  changed_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  change_type TEXT NOT NULL CHECK (change_type IN (
    'created', 'assigned', 'reassigned', 'status_changed',
    'progress_updated', 'priority_changed', 'completed',
    'verified', 'cancelled', 'reopened'
  )),

  -- Before/After values (stored as JSONB)
  old_value JSONB,
  new_value JSONB,
  change_description TEXT,

  -- Timestamp
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for task_progress_history table
CREATE INDEX IF NOT EXISTS idx_task_progress_history_task_id
  ON public.task_progress_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_history_changed_at
  ON public.task_progress_history(changed_at);

COMMENT ON TABLE public.task_progress_history IS 'Immutable audit trail of all task changes';

-- ============================================================================
-- TABLE 4: task_attachments (File storage)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.task_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.task_messages(id) ON DELETE CASCADE,

  -- File info
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  file_url TEXT NOT NULL,
  storage_path TEXT,  -- Path in Supabase Storage

  -- Upload info
  uploaded_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,

  -- Metadata
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Indexes for task_attachments table
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON public.task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_message_id ON public.task_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_uploaded_by ON public.task_attachments(uploaded_by);

COMMENT ON TABLE public.task_attachments IS 'File attachments for tasks and messages';

-- ============================================================================
-- TABLE 5: task_threads (Thread metadata and progress)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.task_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Thread info
  thread_name TEXT NOT NULL,
  thread_description TEXT,

  -- Case linkage (optional)
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  plate TEXT,

  -- Progress tracking (auto-calculated by triggers)
  total_tasks INT DEFAULT 0,
  completed_tasks INT DEFAULT 0,
  thread_completion_percentage INT DEFAULT 0
    CHECK (thread_completion_percentage BETWEEN 0 AND 100),

  -- Status
  thread_status TEXT CHECK (thread_status IN (
    'active', 'completed', 'on_hold', 'cancelled'
  )) DEFAULT 'active',

  -- Ownership
  created_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for task_threads table
CREATE INDEX IF NOT EXISTS idx_task_threads_case_id ON public.task_threads(case_id);
CREATE INDEX IF NOT EXISTS idx_task_threads_created_by ON public.task_threads(created_by);
CREATE INDEX IF NOT EXISTS idx_task_threads_status ON public.task_threads(thread_status);

COMMENT ON TABLE public.task_threads IS 'Thread groupings for related tasks with auto-calculated progress';

-- ============================================================================
-- Success message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Successfully created 5 task management tables with indexes';
END $$;
