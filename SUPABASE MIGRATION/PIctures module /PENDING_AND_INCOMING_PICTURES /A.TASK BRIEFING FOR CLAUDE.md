# TASK BRIEFING FOR CLAUDE IN CURSOR

## PROJECT: EVALIX Automated Pending Images System

---

## 🎯 SYSTEM PURPOSE

I need you to build an automated incoming image management system for EVALIX, an automotive damage assessment platform used by insurance companies in Israel.

**The Problem:**
Currently, assessors receive damage photos via WhatsApp and Email and must manually download and upload them to cases. This is time-consuming and error-prone.

**The Solution:**
Build a system that automatically captures images from WhatsApp and Email, routes them to the correct assessor, provides a unified review interface, and processes accepted images through our existing pipeline.

---

## 📊 HOW THE SYSTEM WORKS (Architecture)

### Data Flow:

```
INCOMING IMAGES (2 sources)
│
├─ WhatsApp (assessor's personal phone)
│  └─ Auto-saves to phone gallery
│     └─ OneDrive app auto-syncs to specific folder per user
│        └─ Make.com watches folder
│           └─ Creates pending_images record with assigned_to_user
│
└─ Email (assessor's work email)
   └─ Make.com watches inbox
      └─ Extracts plate number from subject/body
         └─ Auto-matches to open case in database
            └─ Creates pending_images record with suggestions

↓

SUPABASE DATABASE (pending_images table)
- Stores temp image URLs
- Tags with assigned_to_user (RLS filtered)
- Stores auto-match suggestions (email only)
- Status: pending/accepted/denied/deleted

↓

FRONTEND (pending-images.html)
- User sees only THEIR pending images (RLS)
- One-by-one review interface
- Search/select case from dropdown
- Accept/Deny/Delete buttons
- Batch operations

↓

USER ACCEPTS IMAGE
- Frontend updates status to 'accepted'
- Calls Make.com webhook with case_id
- Make.com processes:
  ├─ Upload to final Supabase Storage location
  ├─ Transform via Cloudinary
  ├─ Backup to OneDrive
  └─ Insert into images table (case gallery)

↓

IMAGE APPEARS IN CASE GALLERY
```

---

## 🧠 CORE LOGIC & DESIGN DECISIONS

### 1. **User Isolation (Security)**
**Why:** Each assessor should only see images meant for them
**How:** Row Level Security (RLS) on pending_images table
**Logic:** 
- Make.com sets `assigned_to_user` when creating record
- RLS policy: `WHERE assigned_to_user = auth.uid()`
- Admin can see all (policy checks profiles.role = 'admin')

### 2. **Auto-Matching (Email Only)**
**Why:** Email subjects often contain plate numbers
**How:** Regex extraction + Supabase query
**Logic:**
```
Email arrives with subject: "Damage - Plate 12-345-67"
→ Make.com extracts: "12-345-67"
→ Queries cases table: WHERE plate_number = '12-345-67' AND case_status = 'OPEN'
→ If single match: High confidence (pre-select in UI)
→ If multiple: Medium confidence (highlight newest)
→ If none: Low confidence (user searches manually)
```

### 3. **Two-Step Processing**
**Why:** Separation of concerns - capture vs process
**How:** Two Make.com flows
**Logic:**
```
Step 1 (Capture): OneDrive/Email → Create pending_images record → Done
Step 2 (Process): User accepts → Webhook triggers → Move to final storage → Done
```
This allows Make.com to handle capture quickly, while processing happens only for accepted images.

### 4. **Unified Interface**
**Why:** Same UX whether image came from WhatsApp or Email
**How:** Single pending-images.html page
**Logic:**
- Source badge shows origin (WhatsApp/Email)
- Email shows sender, extracted plate, auto-match
- WhatsApp shows just basic metadata
- Same Accept/Deny/Delete flow for both

### 5. **Real-Time Updates**
**Why:** When new image arrives, user sees it immediately
**How:** Supabase Realtime subscriptions
**Logic:**
```javascript
supabase
  .channel('pending-images')
  .on('INSERT', filter: `assigned_to_user=eq.${userId}`, payload => {
    pendingImages.push(payload.new)
    showToast('New image received')
  })
```

---

## 📁 FILES YOU HAVE (Reference These)

I have complete implementation guides and code in these files:

### **Documentation (Read These First):**

1. **README.md**
   - Overview of entire delivery package
   - What each file contains
   - High-level architecture

2. **DEPLOYMENT-GUIDE.md**
   - Phase-by-phase deployment instructions
   - Exact SQL for Supabase setup
   - Frontend deployment steps
   - Testing procedures

3. **EVALIX-IMPLEMENTATION-GUIDE.md** (90+ pages)
   - Complete technical specification
   - Database schema with full explanations
   - Make.com scenario details (for context - you don't build these)
   - Troubleshooting guide

4. **QUICK-START.md**
   - Immediate action checklist
   - Priority order of tasks

### **Code Files (Use These):**

5. **lib/supabaseClient.js**
   - Supabase initialization with MY credentials
   - getCurrentUser() helper
   - getUserProfile() helper
   - READY TO USE - just create this file

6. **pending-images.html**
   - Complete review interface (Hebrew, RTL)
   - Styled to match existing EVALIX design
   - READY TO USE - just upload to Netlify

7. **pending-images.js**
   - All logic for pending images page
   - Case search/selection
   - Accept/Deny/Delete functionality
   - Real-time subscriptions
   - Toast notifications
   - READY TO USE - just upload to Netlify

8. **selection-html-integration.html**
   - Code to ADD to existing selection.html
   - Creates orange alert for pending images
   - Real-time count updates
   - READY TO INTEGRATE - append to selection.html

---

## 🎯 YOUR TASK (What to Build)

### **PHASE 1: Database Setup**

**Objective:** Create all database tables, policies, and indexes in Supabase

**Actions:**
1. Read the SQL from `DEPLOYMENT-GUIDE.md` Phase 1
2. Create a file: `migration_pending_images.sql`
3. Include:
   - CREATE TABLE pending_images
   - CREATE TABLE user_onedrive_config  
   - CREATE TABLE image_processing_log
   - All RLS policies
   - All indexes
   - Trigger for auto-updating timestamps

**Verification:**
```sql
-- This query should return 3 tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('pending_images', 'user_onedrive_config', 'image_processing_log');
```

**Reference:** DEPLOYMENT-GUIDE.md Phase 1, Steps 1-3

---

### **PHASE 2: Create Supabase Client**

**Objective:** Initialize Supabase with correct credentials

**Actions:**
1. Create directory: `lib/` if it doesn't exist
2. Create file: `lib/supabaseClient.js`
3. Copy content from the provided `lib/supabaseClient.js` file
4. Verify credentials:
   - URL: `https://nvqrptokmwdhvpiufrad.supabase.co`
   - Anon key: Already in the file

**Integration Note:** 
This file is imported by pending-images.js as:
```javascript
import { supabase, getCurrentUser } from './lib/supabaseClient.js';
```

**Reference:** File #5 (lib/supabaseClient.js)

---

### **PHASE 3: Create Pending Images Page**

**Objective:** Deploy complete review interface

**Actions:**
1. Create file: `pending-images.html` (root of Netlify site)
2. Copy content from provided `pending-images.html` file
3. Create file: `pending-images.js` (root of Netlify site)  
4. Copy content from provided `pending-images.js` file

**Important Configuration:**
In `pending-images.js` line 15, there's a placeholder:
```javascript
const WEBHOOK_PROCESS_IMAGE = 'https://hook.us1.make.com/YOUR-WEBHOOK-ID-HERE';
```

**For now:** Leave as-is (webhook will be created later by user in Make.com)
**Note in code:** Add comment explaining this needs to be updated after Make.com setup

**Verification:**
- Visit: `https://yaron-cayouf-portal.netlify.app/pending-images.html`
- Should load and show "טוען תמונות ממתינות..."
- Then show "כל התמונות נבדקו!" (empty state)

**Reference:** Files #6 and #7 (pending-images.html, pending-images.js)

---

### **PHASE 4: Integrate Alert into Selection Page**

**Objective:** Add pending images notification to existing selection.html

**Context:**
User already has `selection.html` which is the main navigation/dashboard page.

**Actions:**
1. Open existing file: `selection.html`
2. Find a good insertion point (suggest: after case loading section, before action buttons)
3. Insert the code from `selection-html-integration.html`:
   - The `<style>` block (pending images alert styling)
   - The `<div id="pending-images-alert">` block (alert HTML)
   - The `<script type="module">` block (checking logic)

**Logic Explained:**
```javascript
// On page load:
1. Get current user
2. Query count: SELECT COUNT(*) FROM pending_images 
   WHERE assigned_to_user = current_user.id AND status = 'pending'
3. If count > 0: Show alert with count
4. If count = 0: Hide alert
5. Subscribe to real-time updates (when pending_images changes, re-query count)
```

**Visual Result:**
When pending images exist, selection.html shows:
```
⚠️ יש לך 5 תמונות ממתינות לבדיקה
[בדוק תמונות ממתינות כעת] ← Button links to pending-images.html
```

**Reference:** File #8 (selection-html-integration.html)

---

### **PHASE 5: Verify Integration Points**

**Objective:** Ensure all pieces connect correctly

**Check:**

1. **Supabase Client Import:**
   - pending-images.js imports from `./lib/supabaseClient.js` ✓
   - selection.html script imports from `./lib/supabaseClient.js` ✓

2. **Case Query Compatibility:**
   In `pending-images.js`, line ~45:
   ```javascript
   const { data, error } = await supabase
     .from('cases')
     .select('id, plate_number, case_status, damage_center, created_at, owner_name');
   ```
   
   **Verify:** The `cases` table in Supabase has these columns:
   - id
   - plate_number
   - case_status
   - damage_center
   - created_at
   - owner_name
   
   **If different:** Adjust the SELECT query to match actual schema

3. **User Role Check:**
   In `pending-images.js`, line ~38:
   ```javascript
   const { data: profile } = await supabase
     .from('profiles')
     .select('user_id, role')
     .eq('user_id', currentUser.id)
     .single();
   ```
   
   **Verify:** The `profiles` table exists with columns:
   - user_id
   - role (with values: 'admin', 'assessor', etc.)
   
   **If different:** Adjust based on actual auth structure

4. **Auth Flow:**
   The code assumes:
   ```javascript
   const user = await supabase.auth.getUser();
   ```
   Returns authenticated user from existing session.
   
   **Verify:** This matches how selection.html currently handles auth

---

## 🔍 TESTING APPROACH

### Test 1: Database Creation
```sql
-- After running migration, verify:
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_name = 'pending_images'
ORDER BY ordinal_position;

-- Should return all columns
```

### Test 2: Manual Insert
```sql
-- Insert test pending image
INSERT INTO pending_images (
  temp_storage_url,
  original_filename,
  source,
  assigned_to_user,
  status
) VALUES (
  'https://via.placeholder.com/400',
  'test.jpg',
  'whatsapp',
  (SELECT id FROM auth.users WHERE email = 'admin@evalix.com'),
  'pending'
);
```

### Test 3: Frontend Display
1. Log in as admin
2. Visit `pending-images.html`
3. Should see "תמונה 1 מתוך 1"
4. Should display test.jpg

### Test 4: Selection Page Alert
1. With pending image still in database
2. Visit `selection.html`
3. Should see orange alert: "יש לך 1 תמונות ממתינות לבדיקה"

### Test 5: Case Selection
1. Ensure at least one case exists in `cases` table
2. In pending-images.html, click case search
3. Type plate number
4. Should see dropdown with matching cases
5. Select case
6. Accept button should enable

---

## ⚠️ IMPORTANT NOTES

### 1. **Make.com Scenarios (Out of Scope)**
The documentation references Make.com scenarios for:
- Capturing WhatsApp images
- Capturing Email images  
- Processing webhook

**You do NOT need to build these.** The user will create them manually in Make.com UI following the guides.

**What you SHOULD do:**
- Understand what they do (to know the data flow)
- Leave placeholder in code for webhook URL
- Add comments explaining what will populate the data

### 2. **Credentials You Don't Have**
Some values must be filled by user later:
- ❌ Admin user UUID (query database after user exists)
- ❌ Make.com webhook URL (created after scenario exists)
- ❌ OneSignal Player IDs (per user after login)

**What to do:** 
- Use placeholders like: `'YOUR-ADMIN-UUID-HERE'`
- Add clear comments: `// TODO: Replace with actual admin UUID from: SELECT id FROM auth.users`

### 3. **Hebrew Language**
All UI text is in Hebrew (right-to-left).
- Don't change Hebrew text
- Keep `dir="rtl"` and `lang="he"` attributes
- Font rendering is already configured

### 4. **Existing System Integration**
This integrates with existing EVALIX system:
- Uses existing `cases` table
- Uses existing `profiles` table
- Uses existing auth flow
- Matches existing purple/blue color scheme

**Preserve existing functionality** - only add new features.

---

## 📚 REFERENCE STRUCTURE

**For Database Questions:** → DEPLOYMENT-GUIDE.md Phase 1  
**For Frontend Questions:** → pending-images.html and pending-images.js files  
**For Integration Questions:** → selection-html-integration.html  
**For Understanding Logic:** → EVALIX-IMPLEMENTATION-GUIDE.md  
**For Testing:** → DEPLOYMENT-GUIDE.md Phase 5  

---

## ✅ DELIVERABLES CHECKLIST

When you're done, I should have:

**Database:**
- [ ] migration_pending_images.sql file created
- [ ] All 3 tables created in Supabase
- [ ] All RLS policies active
- [ ] All indexes created
- [ ] Test query runs successfully

**Frontend:**
- [ ] lib/supabaseClient.js created with correct credentials
- [ ] pending-images.html uploaded to Netlify root
- [ ] pending-images.js uploaded to Netlify root
- [ ] selection.html modified with alert integration
- [ ] All files deployed to Netlify

**Verification:**
- [ ] pending-images.html loads without errors
- [ ] Empty state shows correctly
- [ ] selection.html shows/hides alert based on pending count
- [ ] Case search dropdown works (if cases exist)
- [ ] Real-time subscription initialized (check console)

**Documentation:**
- [ ] Comments added where placeholders exist
- [ ] TODOs noted for user to complete later
- [ ] Any schema adjustments documented

---

## 🎯 SUCCESS CRITERIA

**You'll know it's working when:**
1. No console errors when loading pages
2. Can manually insert test image in database
3. Test image appears in pending-images.html
4. Selection page alert shows count correctly
5. All imports resolve correctly
6. RLS allows user to see only their images

**The system will be FULLY functional after user:**
1. Sets up Make.com scenarios (populates pending_images table)
2. Updates webhook URL in pending-images.js
3. Configures OneDrive folders
4. Gets their admin UUID and updates RLS test queries

---

## 💬 QUESTIONS TO ASK ME (If Needed)

**If you need clarification:**
1. "What's the exact schema of the `cases` table?" → Show me the table structure
2. "How does auth work in selection.html?" → Share the auth code
3. "Are there existing color variables I should use?" → Share CSS variables
4. "What's the current database structure?" → Run and share schema query

**Don't assume - ask if uncertain about:**
- Table names or column names
- Existing design patterns
- Auth flow specifics
- Integration points with other pages

---

## 🚀 START HERE

1. **Read:** README.md (5 min overview)
2. **Reference:** DEPLOYMENT-GUIDE.md (your main guide)
3. **Build:** Database → Frontend → Integration (in that order)
4. **Test:** After each phase
5. **Document:** Any deviations or assumptions

**Ready to begin?** Start with Phase 1 (Database Setup).

Let me know when you've completed each phase and I'll help verify before moving to the next.

---

END OF TASK BRIEFING