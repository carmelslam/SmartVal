# Task Management System - Design & Planning Document
**Project:** SmartVal Task Management Module
**Date:** October 23, 2025
**Status:** 🎨 PLANNING PHASE - NO IMPLEMENTATION YET
**Author:** Claude (Design Consultation)

---

## EXECUTIVE SUMMARY

This document outlines the complete architecture, design, and implementation strategy for adding an interactive task management system to the SmartVal admin interface. The system will enable admins to assign tasks to users, track completion with percentage-based metrics, facilitate threaded communications, and send targeted push notifications via OneSignal.

### Key Features:
- ✅ Role-based task assignment (Admin → Anyone, Assistant → Self/Assessors, Assessor → Self)
- ✅ Threaded task conversations with status updates and queries
- ✅ Multi-level progress tracking (per thread, per user, overall)
- ✅ Targeted OneSignal push notifications
- ✅ Modern, interactive UI with real-time updates
- ✅ Fully integrated with existing SmartVal architecture

---

## 📋 TODO LIST

### Phase 1: Planning & Design ✅ COMPLETE
- [x] Analyze current system architecture and user roles
- [x] Design task management database schema
- [x] Create UI/UX layout mockups and flow diagrams
- [x] Design notification strategy and integration points
- [x] Document implementation requirements and recommendations
- [x] Write comprehensive plan to todo.md

### Phase 2: Database Setup ⏳ PENDING APPROVAL
- [ ] Create 5 new tables in Supabase
- [ ] Add indexes for performance
- [ ] Create triggers for auto-updates
- [ ] Seed with test data
- [ ] Test progress calculations

### Phase 3: Backend & Webhooks ⏳ PENDING
- [ ] Create Supabase RPC functions
- [ ] Set up Make.com webhooks (4 new)
- [ ] Integrate OneSignal targeting
- [ ] Test notification delivery

### Phase 4: Admin UI ⏳ PENDING
- [ ] Create admin-tasks.html
- [ ] Build task creation modal
- [ ] Implement filters and search
- [ ] Add statistics dashboard
- [ ] Thread management UI

### Phase 5: User UI ⏳ PENDING
- [ ] Create user-tasks.html (inbox)
- [ ] Personal dashboard
- [ ] Mobile-responsive layout
- [ ] Quick action buttons

### Phase 6: Task Detail & Messaging ⏳ PENDING
- [ ] Create task-detail.html
- [ ] Conversation thread UI
- [ ] File attachments
- [ ] Status/progress controls
- [ ] Read receipts

### Phase 7: Notifications & Real-Time ⏳ PENDING
- [ ] Configure OneSignal targeting
- [ ] Set up Supabase Realtime
- [ ] Live UI updates
- [ ] Badge counters

### Phase 8: Testing & Launch ⏳ PENDING
- [ ] Role-based testing
- [ ] Notification delivery tests
- [ ] Progress calculation verification
- [ ] Mobile/RTL testing
- [ ] Performance optimization

**Total Estimate:** 16-23 days

---

## 1. SYSTEM ARCHITECTURE OVERVIEW

### 1.1 Integration with Current System

**Leveraging Existing Infrastructure:**
- ✅ **Authentication:** Supabase Auth with profiles table (5 roles already defined)
- ✅ **Database:** PostgreSQL via Supabase
- ✅ **Notifications:** OneSignal v16 (App ID: 3b924b99-c302-4919-a97e-baf909394696)
- ✅ **UI Framework:** Hebrew RTL, Dark admin theme, Noto Sans Hebrew font
- ✅ **Automation:** Make.com webhooks
- ✅ **Session:** 15-minute timeout with activity tracking

**New Components:**
1. ✨ Task Management Database (5 tables)
2. ✨ Admin Task Dashboard
3. ✨ User Task Inbox
4. ✨ Task Thread/Conversation View
5. ✨ Notification Integration Layer
6. ✨ Progress Calculation Engine
7. ✨ Make.com Webhooks (2-3 new endpoints)

### 1.2 User Role Permissions

| Role | Create Tasks For | View Tasks | Reply | Mark Complete | Notifications |
|------|------------------|------------|-------|---------------|---------------|
| **Admin** | Anyone | All | ✅ | ✅ | When user replies |
| **Developer** | Anyone | All | ✅ | ✅ | When user replies |
| **Assistant** | Self, Assessors | Own + Created | ✅ | Own only | When assigned/replied |
| **Assessor** | Self only | Own only | ✅ | Own only | When assigned/replied |
| **Viewer** | None | None | ❌ | ❌ | None |

---

## 2. DATABASE ARCHITECTURE

### 2.1 New Tables Schema

#### Table 1: `tasks` (Core entity)
```sql
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Task info
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT CHECK (task_type IN (
    'case_action', 'document_request', 'review_request',
    'data_correction', 'follow_up', 'custom'
  )) DEFAULT 'custom',

  -- Assignment
  assigned_to UUID NOT NULL REFERENCES public.profiles(user_id),
  assigned_by UUID NOT NULL REFERENCES public.profiles(user_id),

  -- Case linkage (optional)
  case_id UUID REFERENCES public.cases(id),
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
  parent_task_id UUID REFERENCES public.tasks(id),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_assigned_by ON public.tasks(assigned_by);
CREATE INDEX idx_tasks_case_id ON public.tasks(case_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_thread_id ON public.tasks(thread_id);
```

#### Table 2: `task_messages` (Conversations)
```sql
CREATE TABLE public.task_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,

  -- Message
  message_text TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN (
    'comment', 'question', 'answer', 'status_update', 'system'
  )) DEFAULT 'comment',

  -- Author
  sender_id UUID NOT NULL REFERENCES public.profiles(user_id),
  sender_role TEXT NOT NULL,

  -- Attachments
  attachments JSONB DEFAULT '[]'::jsonb,

  -- Notifications
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_task_messages_task_id ON public.task_messages(task_id);
CREATE INDEX idx_task_messages_sender_id ON public.task_messages(sender_id);
```

#### Table 3: `task_progress_history` (Audit trail)
```sql
CREATE TABLE public.task_progress_history (
  id BIGSERIAL PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,

  -- Change tracking
  changed_by UUID NOT NULL REFERENCES public.profiles(user_id),
  change_type TEXT NOT NULL CHECK (change_type IN (
    'created', 'assigned', 'reassigned', 'status_changed',
    'progress_updated', 'priority_changed', 'completed',
    'verified', 'cancelled', 'reopened'
  )),

  -- Before/After
  old_value JSONB,
  new_value JSONB,
  change_description TEXT,

  -- Timestamp
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_task_progress_history_task_id
  ON public.task_progress_history(task_id);
```

#### Table 4: `task_attachments` (Files)
```sql
CREATE TABLE public.task_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.task_messages(id) ON DELETE CASCADE,

  -- File info
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  file_url TEXT NOT NULL,

  -- Upload info
  uploaded_by UUID NOT NULL REFERENCES public.profiles(user_id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT
);

CREATE INDEX idx_task_attachments_task_id ON public.task_attachments(task_id);
```

#### Table 5: `task_threads` (Thread metadata)
```sql
CREATE TABLE public.task_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Thread info
  thread_name TEXT NOT NULL,
  thread_description TEXT,

  -- Case linkage
  case_id UUID REFERENCES public.cases(id),
  plate TEXT,

  -- Progress tracking
  total_tasks INT DEFAULT 0,
  completed_tasks INT DEFAULT 0,
  thread_completion_percentage INT DEFAULT 0
    CHECK (thread_completion_percentage BETWEEN 0 AND 100),

  -- Status
  thread_status TEXT CHECK (thread_status IN (
    'active', 'completed', 'on_hold', 'cancelled'
  )) DEFAULT 'active',

  -- Ownership
  created_by UUID NOT NULL REFERENCES public.profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_task_threads_case_id ON public.task_threads(case_id);
CREATE INDEX idx_task_threads_created_by ON public.task_threads(created_by);
```

### 2.2 Auto-Update Triggers

```sql
-- Update task timestamp on changes
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

-- Auto-calculate thread completion percentage
CREATE OR REPLACE FUNCTION update_thread_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_thread_id UUID;
  v_total INT;
  v_completed INT;
  v_percentage INT;
BEGIN
  v_thread_id := COALESCE(NEW.thread_id, OLD.thread_id);

  IF v_thread_id IS NOT NULL THEN
    SELECT COUNT(*),
           COUNT(*) FILTER (WHERE status IN ('completed', 'verified'))
    INTO v_total, v_completed
    FROM public.tasks
    WHERE thread_id = v_thread_id AND status != 'cancelled';

    IF v_total > 0 THEN
      v_percentage := ROUND((v_completed::DECIMAL / v_total::DECIMAL) * 100);
    ELSE
      v_percentage := 0;
    END IF;

    UPDATE public.task_threads
    SET total_tasks = v_total,
        completed_tasks = v_completed,
        thread_completion_percentage = v_percentage,
        updated_at = NOW()
    WHERE id = v_thread_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_update_thread_completion
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_completion();
```

---

## 3. UI/UX DESIGN & MOCKUPS

### 3.1 Admin Task Dashboard (`admin-tasks.html`)

**Key Features:**
- 📊 Real-time statistics (active, completed, overdue tasks)
- 🧵 Thread view with visual progress bars
- ➕ Quick task creation modal
- 🔍 Search and filters (by user, status, priority, date)
- 📈 Performance graphs
- 👥 User completion rates

**Visual Layout (Hebrew RTL):**
```
┌─────────────────────────────────────────────────────────────┐
│  ירון כיוף שמאות - ניהול משימות          [🔔] [👤] [⚙️]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 סטטיסטיקה כללית                                         │
│  ┌─────────┬─────────┬─────────┬─────────┐                 │
│  │ פעילות  │ ממתינות │ הושלמו  │  איחור  │                 │
│  │   24    │    8    │   12    │    3    │                 │
│  └─────────┴─────────┴─────────┴─────────┘                 │
│                                                              │
│  [➕ משימה חדשה]  [🧵 שרשור חדש]  🔍 [_________]          │
│                                                              │
│  📋 שרשורי משימות                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🧵 תיק רכב 5785269 - תיקון נזקים                    │  │
│  │    📊 ████████░░ 80% (4/5)                          │  │
│  │    👤 אביב, שרה  📅 25/10/2025        [🔽 הצג]      │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ 🧵 דוחות חודש ספטמבר                               │  │
│  │    📊 ██████████ 100% (8/8) ✅                      │  │
│  │    👤 מיכל, רונית  📅 20/10/2025      [👁️ צפה]    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  📝 משימות בודדות                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ⚠️ HIGH │ בדיקת חשבונית תיק 9876543              │  │
│  │   👤 אביב כהן → 📅 24/10/2025                       │  │
│  │   💬 3 | 📎 2 | 🕐 2 שעות            [▶️ פתח]      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Task Creation Modal

**Fields:**
- 📋 כותרת משימה (required)
- 📝 תיאור מפורט
- 👤 הקצאה למשתמש (dropdown - filtered by role)
- 🏷️ סוג משימה (case_action, document_request, etc.)
- 🚨 עדיפות (low, medium, high, urgent)
- 🚗 קישור לתיק (optional - search by plate)
- 📅 תאריך יעד (date picker)
- 🧵 שרשור (new or existing)
- 📎 קבצים (file upload)
- ☑️ שלח הודעת דחיפה (OneSignal toggle)

**Validation:**
- Title required
- Assignee required
- Permission check (can assign to this user?)
- Due date must be future

### 3.3 User Task Inbox (`user-tasks.html`)

**Key Features:**
- 📊 Personal statistics
- 🔥 Urgent tasks section
- 📋 Tab navigation (All, Urgent, Completed, Created by me, Assigned to me)
- ▶️ Quick actions (Start, Continue, Complete, Reply)
- 📊 Progress indicators
- 🧵 Thread context

**Visual Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  המשימות שלי - אביב כהן                  [🔔 5] [👤] [⚙️]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 סיכום אישי                                              │
│  ┌─────────┬─────────┬─────────┬─────────┐                 │
│  │  שלי    │ בביצוע  │ השבוע   │ ממתינות │                 │
│  │   15    │    3    │    8    │   12    │                 │
│  └─────────┴─────────┴─────────┴─────────┘                 │
│                                                              │
│  [🔥 דחופות] [📋 הכל] [✅ הושלמו] [📤 שלי] [📥 לי]      │
│                                                              │
│  🔥 משימות דחופות (2)                                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ⚠️ בדיקת חשבונית תיק 9876543          [חדש!]       │  │
│  │    👤 מנהל → אביב  📅 היום 18:00                    │  │
│  │    📊 0% | 💬 3 | 📎 2                                │  │
│  │    [▶️ התחל]  [💬 הגב]  [📎 צרף]                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 Task Detail & Conversation View

**Key Features:**
- 📋 Complete task context (type, priority, due date, case link)
- ⚪⚪⚪ Status selector
- 📊 Progress slider (0-100%)
- 💬 Chronological message thread
- ❓ Question/Answer markers
- ✅ Read receipts
- 📎 Inline file attachments
- ✅🔄❌ Quick actions (Complete, Pause, Cancel)

**Message Types:**
- 💬 Comment - Regular message
- ❓ Question - User asking
- ✅ Answer - Admin responding
- 🤖 System - Auto-generated updates

---

## 4. NOTIFICATION STRATEGY

### 4.1 OneSignal Integration

**Current Setup:**
- App ID: `3b924b99-c302-4919-a97e-baf909394696`
- Already integrated via `onesignal-integration.js`
- Player IDs stored in sessionStorage
- Test webhook: `https://hook.eu2.make.com/e41e2zm9f26ju5m815yfgn1ou41wwwhd`

### 4.2 Notification Events

| Event | Trigger | Recipient | Message |
|-------|---------|-----------|---------|
| Task Created | Admin creates | Assigned user | "משימה חדשה: [title]" |
| Task Assigned | Reassigned | New assignee | "הוקצתה לך: [title]" |
| New Message | Message posted | Other party | "[sender] כתב/ה ב-[task]" |
| Question Asked | Marked as ? | Task creator | "❓ שאלה ב-[task]" |
| Answer Given | Answer posted | Asker | "✅ קיבלת תשובה ל-[task]" |
| Status Changed | Status updated | Creator + Assignee | "סטטוס: [task] → [new]" |
| Task Completed | Marked complete | Creator | "✅ הושלמה: [task]" |
| Task Verified | Admin verifies | Assignee | "✅ אושרה: [task]" |
| Due Soon | 24h before | Assignee | "⏰ תזכורת: [task] מחר" |
| Overdue | Past due | Both | "⚠️ איחור: [task]" |
| Thread Done | All complete | All participants | "🎉 שרשור הושלם" |

### 4.3 Notification Filtering

**Rules:**
- ❌ Never notify sender of own action
- ✅ Only notify assigned user and creator
- ✅ Respect user role permissions
- ✅ Check OneSignal subscription status
- ✅ Rate limit: max 20 per user per day

### 4.4 Make.com Webhook

**New Endpoint:** (To be created)
`https://hook.eu2.make.com/[TASK_NOTIFICATION_WEBHOOK]`

**Payload:**
```json
{
  "event_type": "task_created",
  "task_id": "uuid",
  "task_title": "בדיקת חשבונית",
  "priority": "high",
  "due_date": "2025-10-24T18:00:00Z",
  "assigned_to_user_id": "uuid",
  "assigned_to_player_ids": ["onesignal_id"],
  "assigned_by_name": "מנהל",
  "case_plate": "9876543",
  "notification_message": "משימה דחופה: בדיקת חשבונית",
  "deep_link": "/tasks/view?id=uuid"
}
```

**Make.com Flow:**
1. Receive webhook
2. Get OneSignal Player ID from profiles
3. Format notification
4. Send via OneSignal API
5. Log to task_messages
6. Return success

---

## 5. PROGRESS TRACKING (3 LEVELS)

### Level 1: Task Progress
- User manually updates (0-100% slider)
- Auto-set to 100% when completed
- Stored in `tasks.completion_percentage`

### Level 2: Thread Progress
- **Auto-calculated** from tasks in thread
- Formula: `(completed / total) * 100`
- Updated via trigger on task status change
- Stored in `task_threads.thread_completion_percentage`

### Level 3: User Overall Progress
- **Real-time query** (not stored)
- Formula: `(user_completed / user_total) * 100`
- Displayed in dashboard

### Level 4: System-Wide Progress
- Admin dashboard metric
- All tasks across all users
- Filtered by date range

**Example SQL:**
```sql
-- User's completion rate
SELECT
  assigned_to,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status IN ('completed', 'verified')) as done,
  ROUND((COUNT(*) FILTER (WHERE status IN ('completed', 'verified'))::DECIMAL /
         NULLIF(COUNT(*), 0)::DECIMAL) * 100) as percentage
FROM tasks
WHERE assigned_to = 'user_uuid' AND status != 'cancelled'
GROUP BY assigned_to;
```

---

## 6. FLOW DIAGRAMS

### 6.1 Task Creation Flow
```
Admin clicks "Create Task"
    ↓
Fill form (title, assignee, priority, due date)
    ↓
Validate (required fields, permissions)
    ├─ Invalid → Show error → Back to form
    ↓
  Valid
    ↓
POST to Make.com webhook
    ↓
Make.com:
  1. Insert to database
  2. Get assignee's OneSignal ID
  3. Send push notification
  4. Log to task_progress_history
    ↓
Return success
    ↓
Update UI (show success, refresh list, close modal)
```

### 6.2 User Receives & Completes Task
```
OneSignal push: "משימה חדשה"
    ↓
User clicks notification
    ↓
Open task detail page
    ↓
User reads task
    ↓
Update status: pending → in_progress
    ↓
Webhook: status changed → Notify admin
    ↓
User posts question ❓
    ↓
Webhook: message type=question → OneSignal to admin
    ↓
Admin answers ✅
    ↓
Webhook: message → OneSignal to user
    ↓
User completes task (100%)
    ↓
Status → completed
    ↓
Webhook: OneSignal to admin "הושלמה"
    ↓
Admin verifies → status = verified
    ↓
Webhook: OneSignal to user "אושרה"
    ↓
Thread % auto-recalculated via trigger
```

### 6.3 Thread Completion
```
Thread: 5 tasks
- Task 1: 100% ✅
- Task 2: 100% ✅
- Task 3: 70%  🔵
- Task 4: 100% ✅
- Task 5: 0%   ⚪

Thread: (3/5) = 60%
    ↓
Task 3 completed
    ↓
Trigger: update_thread_completion()
    ↓
Thread: (4/5) = 80%
    ↓
Task 5 completed
    ↓
Thread: (5/5) = 100% ✅
    ↓
thread_status → completed
    ↓
OneSignal to all: "🎉 שרשור הושלם"
```

---

## 7. IMPLEMENTATION PHASES

### Phase 1: Database ✅ DESIGNED
**Tasks:**
- Create 5 tables
- Add indexes
- Create triggers
- Seed test data
- Test calculations

**Time:** 1-2 days

### Phase 2: Backend & Webhooks
**Tasks:**
- Supabase RPC functions
- Make.com webhooks (4 new)
- OneSignal integration
- Test notifications

**Time:** 2-3 days

### Phase 3: Admin Dashboard
**Tasks:**
- admin-tasks.html
- Task creation modal
- Filters and search
- Statistics widgets
- Thread management

**Time:** 3-4 days

### Phase 4: User Inbox
**Tasks:**
- user-tasks.html
- Personal dashboard
- Mobile layout
- Quick actions

**Time:** 3-4 days

### Phase 5: Task Detail
**Tasks:**
- task-detail.html
- Conversation thread
- File attachments
- Status controls
- Read receipts

**Time:** 3-4 days

### Phase 6: Notifications
**Tasks:**
- OneSignal targeting
- Supabase Realtime
- Live UI updates
- Badge counters

**Time:** 2-3 days

### Phase 7: Testing
**Tasks:**
- Role-based tests
- Notification tests
- Progress verification
- Mobile/RTL testing
- Performance tuning

**Time:** 2-3 days

**TOTAL: 16-23 days**

---

## 8. VISUAL DESIGN STANDARDS

### 8.1 Match Existing SmartVal Branding

**From CLAUDE.md:**
> "Preserve styling standards: logos, signatures, colors, layouts, business name"

**Apply:**
- **Logo:** https://carmelcayouf.com/wp-content/uploads/2025/06/g.webp
- **Business:** ירון כיוף - שמאות והערכת נזקי רכב ורכוש
- **Primary:** #003366 (Dark Blue)
- **Accent:** #ff6b35 (Orange)
- **Font:** Noto Sans Hebrew, Arial
- **Direction:** RTL
- **Admin Theme:** #1a1a1a background, dark mode

### 8.2 Task-Specific Colors

**Priority:**
- 🔴 Urgent: #DC2626 (red-600)
- 🟡 High: #F59E0B (amber-500)
- 🔵 Medium: #3B82F6 (blue-500)
- 🟢 Low: #10B981 (green-500)

**Status:**
- ⚪ Pending: #9CA3AF (gray-400)
- 🔵 In Progress: #3B82F6 (blue-500)
- 🟡 Awaiting: #F59E0B (amber-500)
- 🟢 Completed: #10B981 (green-500)
- ✅ Verified: #059669 (green-600)

**Progress Bars:**
- 0-25%: 🔴 Red gradient
- 26-50%: 🟡 Yellow gradient
- 51-75%: 🔵 Blue gradient
- 76-100%: 🟢 Green gradient

---

## 9. TECHNOLOGY RECOMMENDATIONS

### Frontend
- **Pure JavaScript** (maintain consistency) OR
- **Vue.js 3** (better state management, RTL-friendly)
- **TailwindCSS** (utility-first, easy RTL)
- **Chart.js** (progress graphs)

### Backend
- **Supabase Functions** (business logic)
- **PostgreSQL Triggers** (auto-calculations)
- **Make.com** (notifications)

### Real-Time
- **Supabase Realtime** (already available)
- Subscribe to tasks table
- Live UI updates

### Files
- **Cloudinary** (already integrated)
- Task attachments
- Thumbnail generation

---

## 10. SECURITY & PERMISSIONS

### Authorization Checks

```javascript
function canAssignTask(currentUser, targetUser) {
  const role = currentUser.role;
  const targetRole = targetUser.role;

  // Admin/Developer can assign to anyone
  if (role === 'admin' || role === 'developer') {
    return true;
  }

  // Assistant can assign to self and assessors
  if (role === 'assistant') {
    return (targetUser.user_id === currentUser.user_id ||
            targetRole === 'assessor');
  }

  // Assessor can only assign to self
  if (role === 'assessor') {
    return targetUser.user_id === currentUser.user_id;
  }

  return false;  // Viewer can't assign
}
```

### Input Validation
- SQL injection: Use parameterized queries (Supabase handles)
- XSS: Escape HTML in messages (use DOMPurify)
- CSRF: Validate tokens on all POST
- Rate limiting: Max 50 tasks/user/day

---

## 11. TESTING STRATEGY

### Test Scenarios

**Role-Based:**
| Test Case | Admin | Assistant | Assessor | Expected |
|-----------|-------|-----------|----------|----------|
| Create for admin | ✅ | ✅ | ❌ | Success/Fail |
| Create for assessor | ✅ | ✅ | ❌ | Success/Fail |
| View all tasks | ✅ | ❌ | ❌ | Success/Fail |
| Complete own | ✅ | ✅ | ✅ | Success |
| Complete other's | ✅ | ❌ | ❌ | Success/Fail |

**Notifications:**
- Task assigned → user notified ✅
- Admin posts → user notified ✅
- User posts question → admin notified ✅
- User completes → admin notified ✅
- No self-notification ✅

**Performance:**
- Load 1000 tasks: < 2s
- Thread calculation: < 500ms
- Real-time latency: < 1s
- Search 10k tasks: < 3s

---

## 12. RECOMMENDATIONS SUMMARY

### ✅ WHAT MAKES THIS DESIGN EFFECTIVE

1. **Modern Task Management**
   - Threaded conversations (Slack-like)
   - Kanban progress tracking
   - Real-time updates
   - Mobile-first

2. **Perfect Integration**
   - Uses existing auth/database/notifications
   - Matches UI/branding
   - Hebrew RTL
   - Role permissions align

3. **Scalable Architecture**
   - Indexed database
   - Auto-calculations
   - Flexible threads
   - JSONB extensibility

4. **User-Centric**
   - 3-level progress tracking
   - Visual priorities
   - Overdue warnings
   - Search/filters

### 🎯 IMPLEMENTATION OPTIONS

**Option A: Full Implementation** ⭐ RECOMMENDED
- All 5 tables
- Admin + User interfaces
- Full notifications
- Best for long-term

**Option B: MVP**
- 2 tables only (tasks, messages)
- Admin dashboard only
- Basic notifications
- Best for validation

**Option C: Phased Rollout**
- Week 1: Admin create, user view
- Week 2: Messaging + notifications
- Week 3: Threads + progress
- Best for continuous delivery

### 🚨 CRITICAL SUCCESS FACTORS

**Must Have:**
- ✅ Role-based permissions
- ✅ OneSignal integration
- ✅ Mobile responsive
- ✅ Hebrew RTL
- ✅ Case linkage

**Nice to Have (Later):**
- Drag-and-drop
- Kanban board
- Task templates
- Bulk actions
- Email digests

---

## 13. NEXT STEPS

### ⏳ AWAITING YOUR APPROVAL

**You Need To:**
1. ✅ Review this plan - confirm vision match
2. ✅ Choose approach - Full / MVP / Phased
3. ✅ Approve database schema
4. ✅ Confirm notification strategy
5. ✅ Provide feedback on UI mockups

### ⏳ DEVELOPER WILL:
1. Wait for approval
2. Set up dev environment
3. Create feature branch: `feature/task-management`
4. Begin Phase 1: Database
5. Daily commits & progress updates

### ⏳ TESTING WILL:
1. Create test accounts (Admin, Assistant, 2 Assessors)
2. Prepare test cases from SmartVal
3. Test on mobile (iOS/Android)
4. Verify Hebrew RTL

---

## 14. GLOSSARY (HEBREW-ENGLISH)

| Hebrew | English | Context |
|--------|---------|---------|
| משימה | Task | Core entity |
| שרשור | Thread | Group of tasks |
| הקצאה | Assignment | Assign to user |
| התקדמות | Progress | % complete |
| עדיפות | Priority | Urgency |
| סטטוס | Status | State |
| ממתינה | Pending | Not started |
| בביצוע | In Progress | Working |
| הושלמה | Completed | Done |
| אושרה | Verified | Approved |
| תאריך יעד | Due Date | Deadline |
| איחור | Overdue | Late |
| הודעה | Message | Communication |
| שאלה | Question | Query |
| תשובה | Answer | Response |
| קובץ | File | Attachment |
| הודעת דחיפה | Push | Notification |

---

## 15. CONCLUSION

This task management system provides a **comprehensive, modern, scalable solution** perfectly tailored to SmartVal.

**Key Strengths:**
- ✅ Fully integrated with existing stack
- ✅ Role permissions match current system
- ✅ Modern UI/UX with real-time
- ✅ Smart OneSignal notifications
- ✅ 3-level progress tracking
- ✅ Mobile-first, Hebrew RTL
- ✅ Scalable database design

**Ready for Implementation:**
- ✅ All schemas defined
- ✅ UI mockups provided
- ✅ Flows documented
- ✅ Notification strategy mapped
- ✅ Test scenarios outlined
- ✅ Security addressed

---

## 👉 AWAITING YOUR APPROVAL TO PROCEED 👈

**Status:** 🎨 Planning Complete - Ready for Implementation
**Next:** Your approval to begin Phase 1 (Database)
**Contact:** Reply with feedback or "approved to proceed"

═══════════════════════════════════════════════════════════════

**Document Version:** 1.0
**Date:** October 23, 2025
**Total Implementation Time:** 16-23 days
**Complexity:** Medium
**Risk:** Low (modular, non-breaking)

═══════════════════════════════════════════════════════════════
