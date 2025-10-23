# Task Management System

**Date:** October 23, 2025
**Status:** ✅ Ready for deployment
**Author:** Claude Code
**Dependencies:** User profiles table must exist (public.profiles)

---

## Overview

This project implements a complete task management system for SmartVal, enabling admins to assign tasks to users, track progress with threaded conversations, and send targeted push notifications.

### Key Features
- ✅ **Role-based task assignment** (Admin → Anyone, Assistant → Self/Assessors, Assessor → Self)
- ✅ **Threaded conversations** with questions, answers, and status updates
- ✅ **Multi-level progress tracking** (per task, per thread, overall)
- ✅ **Automatic audit trail** for all changes
- ✅ **File attachments** support
- ✅ **OneSignal push notifications** integration ready
- ✅ **Real-time updates** via Supabase Realtime
- ✅ **Row Level Security** for data privacy

---

## Database Schema

### Tables Created (5)

| Table | Purpose | Records Type |
|-------|---------|--------------|
| `tasks` | Core task entities | Main data |
| `task_messages` | Conversation threads | Main data |
| `task_progress_history` | Audit trail | Immutable log |
| `task_attachments` | File storage metadata | Main data |
| `task_threads` | Thread groupings | Main data |

### Indexes Created (20)

All tables have appropriate indexes for:
- Foreign key relationships
- Common query patterns
- Date/time filtering
- Status-based filtering

### Triggers Created (5)

| Trigger | Purpose |
|---------|---------|
| `task_update_timestamp` | Auto-update `updated_at` on task changes |
| `task_update_thread_completion` | Auto-calculate thread progress percentages |
| `task_log_history` | Auto-log all task changes to audit trail |
| `thread_update_timestamp` | Auto-update `updated_at` on thread changes |
| `task_create_status_message` | Auto-create system message when status changes |

---

## Migration Files

Run these files in order:

### 01_create_task_tables.sql
- Creates 5 core tables
- Adds 20 indexes
- Includes comments and constraints
- **Idempotent:** Safe to run multiple times (uses `IF NOT EXISTS`)

**Estimated time:** 2-5 seconds

### 02_create_triggers.sql
- Creates 5 trigger functions
- Sets up automatic calculations
- Enables audit trail logging
- **Idempotent:** Uses `CREATE OR REPLACE`

**Estimated time:** 1-3 seconds

### 03_create_rls_policies.sql
- Enables RLS on all 5 tables
- Creates 25+ policies
- Implements role-based access control
- **Idempotent:** Policies are replaced if they exist

**Estimated time:** 2-4 seconds

**Total migration time:** ~10 seconds

---

## Deployment Instructions

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project → **SQL Editor**
2. Create a new query
3. Copy and paste the contents of `01_create_task_tables.sql`
4. Click **Run**
5. Repeat for `02_create_triggers.sql`
6. Repeat for `03_create_rls_policies.sql`
7. Verify success messages

### Option 2: Supabase CLI

```bash
# Navigate to project root
cd /path/to/SmartVal

# Run migrations in order
supabase db execute -f "supabase/sql/Task_Management_System_2025-10-23/01_create_task_tables.sql"
supabase db execute -f "supabase/sql/Task_Management_System_2025-10-23/02_create_triggers.sql"
supabase db execute -f "supabase/sql/Task_Management_System_2025-10-23/03_create_rls_policies.sql"
```

### Option 3: Single Command (All files)

```bash
cat supabase/sql/Task_Management_System_2025-10-23/*.sql | \
  supabase db execute --stdin
```

---

## Verification

After running the migrations, verify the installation:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'task%'
ORDER BY table_name;

-- Expected output:
-- task_attachments
-- task_messages
-- task_progress_history
-- task_threads
-- tasks

-- Check triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table LIKE 'task%'
ORDER BY event_object_table, trigger_name;

-- Expected: 5 triggers

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'task%';

-- Expected: All tables have rowsecurity = true
```

---

## Role-Based Permissions

| Role | View Tasks | Create Tasks For | Update Tasks | Delete Tasks |
|------|------------|------------------|--------------|--------------|
| **Admin** | All tasks | Anyone | All tasks | All tasks |
| **Developer** | All tasks | Anyone | All tasks | All tasks |
| **Assistant** | Own + Created | Self + Assessors | Own + Created | None |
| **Assessor** | Own only | Self only | Own only | None |
| **Viewer** | None | None | None | None |

---

## Task Statuses

| Status | Description | Can transition to |
|--------|-------------|-------------------|
| `pending` | Task created, not started | `in_progress`, `cancelled` |
| `in_progress` | User is working on it | `awaiting_response`, `completed`, `cancelled` |
| `awaiting_response` | Waiting for answer | `in_progress`, `completed`, `cancelled` |
| `completed` | Task finished by user | `verified`, `in_progress` (reopen) |
| `verified` | Admin verified completion | `in_progress` (reopen) |
| `cancelled` | Task cancelled | Any (reopen) |

---

## Priority Levels

| Priority | Color | Use Case |
|----------|-------|----------|
| `low` | Green | Nice to have, no deadline |
| `medium` | Blue | Standard priority |
| `high` | Orange | Important, has deadline |
| `urgent` | Red | Critical, immediate action needed |

---

## Task Types

| Type | Description |
|------|-------------|
| `case_action` | Action required on a case |
| `document_request` | Request for document upload |
| `review_request` | Request to review something |
| `data_correction` | Fix data errors |
| `follow_up` | Follow up on previous task |
| `custom` | Custom task type |

---

## Progress Calculation

### Level 1: Individual Task Progress
- Manually set by assigned user (0-100%)
- Slider control in UI

### Level 2: Thread Progress (Auto-calculated)
- Formula: `(completed_tasks / total_tasks) * 100`
- Updated by trigger on task status change
- Excludes cancelled tasks

### Level 3: User/System Progress (Query-based)
- Real-time calculation in UI
- No storage in database
- Filters by user, date range, etc.

---

## Integration Points

### Frontend Pages (To be created)
- `admin-tasks.html` - Admin dashboard
- `user-tasks.html` - User inbox
- `task-detail.html` - Task conversation view

### Notifications
- OneSignal App ID: `3b924b99-c302-4919-a97e-baf909394696`
- Targeted notifications (no broadcast)
- Notification events: task_assigned, task_replied, task_completed

### Realtime
- Subscribe to `public:tasks`
- Subscribe to `public:task_messages`
- Live UI updates on changes

---

## Sample Data (Optional)

To test the system with sample data:

```sql
-- Create a test thread
INSERT INTO public.task_threads (thread_name, thread_description, created_by)
VALUES (
  'Test Thread - Vehicle 1234567',
  'All tasks related to vehicle 1234567',
  (SELECT user_id FROM public.profiles WHERE role = 'admin' LIMIT 1)
)
RETURNING id;

-- Create a test task (replace thread_id and user_ids)
INSERT INTO public.tasks (
  title,
  description,
  task_type,
  assigned_to,
  assigned_by,
  status,
  priority,
  thread_id,
  due_date
) VALUES (
  'Test Task - Review vehicle photos',
  'Please review the uploaded vehicle photos and confirm damage assessment',
  'review_request',
  (SELECT user_id FROM public.profiles WHERE role = 'assessor' LIMIT 1),
  (SELECT user_id FROM public.profiles WHERE role = 'admin' LIMIT 1),
  'pending',
  'high',
  '<thread_id_from_above>',
  NOW() + INTERVAL '2 days'
);
```

---

## Rollback Instructions

If you need to rollback this migration:

```sql
-- WARNING: This will delete all task data!

DROP TRIGGER IF EXISTS task_create_status_message ON public.tasks;
DROP TRIGGER IF EXISTS task_log_history ON public.tasks;
DROP TRIGGER IF EXISTS task_update_thread_completion ON public.tasks;
DROP TRIGGER IF EXISTS task_update_timestamp ON public.tasks;
DROP TRIGGER IF EXISTS thread_update_timestamp ON public.task_threads;

DROP FUNCTION IF EXISTS create_status_change_message();
DROP FUNCTION IF EXISTS log_task_history();
DROP FUNCTION IF EXISTS update_thread_completion();
DROP FUNCTION IF EXISTS update_task_timestamp();
DROP FUNCTION IF EXISTS update_thread_timestamp();
DROP FUNCTION IF EXISTS get_current_user_role();

DROP TABLE IF EXISTS public.task_attachments CASCADE;
DROP TABLE IF EXISTS public.task_messages CASCADE;
DROP TABLE IF EXISTS public.task_progress_history CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.task_threads CASCADE;
```

---

## Next Steps

After deploying these migrations:

1. ✅ **Test database access** - Verify RLS policies work correctly
2. ⏳ **Create frontend pages** - Build admin-tasks.html, user-tasks.html, task-detail.html
3. ⏳ **Integrate OneSignal** - Set up notification webhooks
4. ⏳ **Add to navigation** - Update admin menu to include task management
5. ⏳ **User testing** - Test with real users in each role
6. ⏳ **Performance tuning** - Monitor and optimize if needed

---

## Support & Documentation

- **Full design document:** `/supabase migration/task-management-system/planning/todo.md`
- **Mockups:** `/supabase migration/task-management-system/mockups/`
- **System analysis:** `/supabase migration/task-management-system/analysis/`

---

## Change Log

### Version 1.0 (October 23, 2025)
- Initial creation of task management system
- 5 tables, 20 indexes, 5 triggers, 25+ RLS policies
- Full role-based access control
- Auto-calculation of thread progress
- Audit trail for all changes
