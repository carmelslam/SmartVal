# Task Management System - Revised Implementation Plan

**Date:** 2025-10-23
**Status:** 🚧 In Progress
**Current Phase:** Frontend Implementation

---

## ✅ Completed So Far

### Phase 1: Database & Backend (DONE)
- ✅ Created 5 tables (tasks, task_messages, task_progress_history, task_attachments, task_threads)
- ✅ Created 20 indexes for performance
- ✅ Created 5 triggers for auto-calculations and audit trail
- ✅ Implemented Row Level Security (RLS) with role-based policies
- ✅ Fixed critical auth bug (supabaseClient now uses user access_token)
- ✅ Fixed user name display (JavaScript joins instead of nested queries)

### Phase 2: Basic UI (DONE)
- ✅ Created admin-tasks.html (admin dashboard for all tasks)
- ✅ Created user-tasks.html (user inbox for assigned tasks)
- ✅ Created task-detail.html (basic task view)
- ✅ Implemented task creation with case/plate dropdowns
- ✅ Added date picker for due dates
- ✅ Implemented basic task list rendering with filters

---

## 🚧 Current Phase: Complete Frontend & Workflows

### User Role Requirements (Clarified)

#### Admin / Developer
- **Access:** admin-tasks.html
- **Can See:** ALL tasks in the system
- **Can Create:** Tasks for anyone
- **Can Update:** Any task
- **Can Delete:** Any task
- **Navigation:** "Task Management" button → admin-tasks.html

#### Assistant
- **Access:** assistant-tasks.html (NEW PAGE NEEDED)
- **Can See:**
  - Their own assigned tasks
  - Tasks they created
  - All assessor tasks (to monitor their work)
- **Can Create:**
  - Tasks for themselves
  - Tasks for assessors (this is their main job!)
- **Can Update:** Their own tasks + tasks they created
- **Navigation:** "My Tasks" button → assistant-tasks.html

#### Assessor
- **Access:** user-tasks.html
- **Can See:** ONLY tasks assigned to them
- **Can Create:** Tasks only for themselves (notes/reminders)
- **Can Update:** Only their own assigned tasks
- **Navigation:** "My Tasks" button → user-tasks.html

---

## 📋 Remaining Tasks - Prioritized

### Priority 1: Navigation & Access (CRITICAL)
1. ✅ Add task management button to selection.html
   - Shows for ALL users (admin, dev, assistant, assessor)
   - Button text: "📋 ניהול משימות" or "📋 המשימות שלי"
   - Routes based on role:
     - admin/dev → admin-tasks.html
     - assistant → assistant-tasks.html (needs creation)
     - assessor → user-tasks.html

### Priority 2: Assistant Page (HIGH)
2. Create assistant-tasks.html
   - Copy structure from admin-tasks.html
   - Modify query to show:
     - Tasks WHERE assigned_to = current_user OR assigned_by = current_user
     - Tasks WHERE assigned_to IN (SELECT user_id FROM profiles WHERE role='assessor')
   - Add "Create Task for Assessor" prominent button
   - Show two sections:
     - "My Tasks" (assigned to me)
     - "Assessor Tasks I'm Monitoring" (tasks for assessors I created or all assessor tasks)

### Priority 3: Task Detail & Conversation (HIGH)
3. Enhance task-detail.html with full functionality:
   - **Conversation Thread:**
     - Show all messages (task_messages table)
     - Add new message textarea + send button
     - Display with user names and timestamps
     - Auto-scroll to latest message

   - **Progress Updates:**
     - Slider to update completion_percentage (0-100%)
     - Visual progress bar
     - Save button that updates task + creates audit log

   - **Status Changes:**
     - Dropdown to change status (pending → in_progress → completed, etc.)
     - Validate transitions (e.g., can't go from pending to completed directly)
     - Create system message when status changes (trigger handles this)

   - **File Attachments:**
     - Upload button for attachments
     - Store in Supabase Storage
     - Save metadata to task_attachments table
     - Display list of attachments with download links

### Priority 4: Enhanced Task Cards (MEDIUM)
4. Update all task list pages:
   - Show "Assigned By" prominently (currently shows "Assigned To")
   - Add visual priority indicators (urgent = red, high = orange, etc.)
   - Show completion percentage as progress bar
   - Add status badge with color coding
   - Show due date with "overdue" warning if past due

### Priority 5: Real-Time Updates (MEDIUM)
5. Implement Supabase Realtime:
   - Subscribe to tasks table changes
   - Subscribe to task_messages table changes
   - Auto-refresh task list when changes occur
   - Show notification badge for new messages
   - Live update of progress bars

### Priority 6: Testing & Refinement (HIGH)
6. Comprehensive role-based testing:
   - Test as admin: create, update, delete, view all
   - Test as developer: same as admin
   - Test as assistant: create tasks for assessors, monitor their work
   - Test as assessor: view only assigned tasks, update progress
   - Verify RLS policies block unauthorized access

### Priority 7: Nice-to-Have Features (LOW)
7. Additional enhancements:
   - Search/filter tasks by case_id, plate, status, priority
   - Sort by different columns (due date, priority, status)
   - Bulk actions (assign multiple tasks, update status)
   - Email notifications (in addition to push)
   - Task templates for common task types
   - Calendar view of due dates

---

## 🎯 Implementation Order

### Step 1: Add Navigation Button (TODAY)
- Modify selection.html
- Add role-based routing function
- Test navigation for all roles

### Step 2: Create Assistant Page (TODAY)
- Copy admin-tasks.html → assistant-tasks.html
- Modify queries for assistant role
- Add "Create Task for Assessor" workflow
- Test as assistant user

### Step 3: Build Task Detail Page (NEXT)
- Conversation thread UI
- Message sending functionality
- Progress slider + update
- Status change dropdown
- Basic file attachment UI

### Step 4: Integrate OneSignal Push Notifications (HIGH PRIORITY)
- **Notification Events:**
  - 📬 Task assigned to user
  - 💬 New message/reply in task
  - ✅ Task status changed
  - ⚠️ Task overdue reminder

- **OneSignal Configuration:**
  - App ID: `3b924b99-c302-4919-a97e-baf909394696`
  - REST API Key: (in environment variables)
  - Use player_id from user profiles table

- **Implementation:**
  - Send notification when task created (to assigned_to user)
  - Send notification when message added (to assigned_to if from assigned_by, vice versa)
  - Send notification when status changes (to creator/assigned user)
  - Use targeted notifications (NOT broadcast)

- **Notification Payload:**
  ```javascript
  {
    headings: { en: "משימה חדשה" },
    contents: { en: task.title },
    data: {
      task_id: task.id,
      type: "task_assigned",
      url: "task-detail.html?id=" + task.id
    },
    include_player_ids: [user.onesignal_player_id]
  }
  ```

### Step 5: Polish & Test (FINAL)
- Add visual improvements
- Test all workflows
- Fix any bugs found
- Deploy to production

---

## 🔐 Security Checklist

- ✅ RLS enabled on all 5 tables
- ✅ Role-based policies implemented
- ✅ Auth token bug fixed
- ⏳ Test unauthorized access attempts
- ⏳ Verify data isolation between users
- ⏳ Test edge cases (deleted users, orphaned tasks, etc.)

---

## 📊 Current Database State

**Tables:** 5/5 created ✅
**Indexes:** 20/20 created ✅
**Triggers:** 5/5 created ✅
**RLS Policies:** 25+ created ✅
**RLS Status:** ENABLED ✅

---

## 🎨 UI Design Consistency

All pages should follow SmartVal design standards:
- **Colors:** Same palette as existing pages
- **Fonts:** Noto Sans Hebrew (RTL)
- **Logos:** ירון כיוף branding
- **Layout:** Consistent header, navigation, footer
- **Signature:** "ירון כיוף - שמאות רכב" at bottom

---

## 📱 Responsive Design

All pages must work on:
- Desktop (primary)
- Tablet (iPad)
- Mobile (iPhone/Android)

---

## 🚀 Next Immediate Actions

1. **NOW:** Add task management button to selection.html
2. **NEXT:** Create assistant-tasks.html page
3. **THEN:** Enhance task-detail.html with conversations

**Estimated Time to Complete Module:** 4-6 hours of focused work

---

## Questions to User

1. ❓ Should assistants see ALL assessor tasks, or only assessor tasks that they created?
   - Currently planned: ALL assessor tasks (for monitoring)
   - Alternative: Only assessor tasks they created

2. ❓ What should the button text be in selection.html?
   - Option A: "📋 ניהול משימות" (Task Management) - for admin
   - Option B: "📋 המשימות שלי" (My Tasks) - for users
   - Can show different text based on role

3. ❓ Should we implement push notifications now or later?
   - OneSignal is configured in the system
   - Can send notifications when tasks are assigned/replied
   - Requires webhook setup

---

**Last Updated:** 2025-10-23
**Next Review:** After completing Steps 1-2 above
