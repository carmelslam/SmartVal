# Notification Center Implementation Plan

## Overview
Build an in-app notification center that stores and displays all task notifications with read/unread status.

## Components

### 1. Database Table (SQL)
**File**: `supabase/sql/sql task managemnt/21_create_notifications_table.sql`

```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,

  -- Notification content
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  url TEXT,

  -- Task reference (optional)
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,

  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
```

### 2. Notification Center UI Component
**File**: `components/notification-center.js`

Features:
- Bell icon with unread badge count
- Dropdown panel showing recent notifications
- Mark as read/unread buttons
- Clear all button
- Click notification → navigate to task

### 3. Integration Points
- **admin-tasks.html**: Add notification center to navbar
- **assistant-tasks.html**: Add notification center to navbar
- **user-tasks.html**: Add notification center to navbar
- **task-detail.html**: Add notification center to navbar

### 4. Auto-save notifications
Update `task-notifications.js` to save to database when sending notifications.

## Implementation Steps
1. ✅ Create database migration SQL
2. ✅ Build notification-center.js component
3. ✅ Integrate into all task HTML pages
4. ✅ Update task-notifications.js to save to DB
5. ✅ Test and commit

## Time Estimate: 3-4 hours
