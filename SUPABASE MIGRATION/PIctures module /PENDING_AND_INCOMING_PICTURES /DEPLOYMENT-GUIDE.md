# EVALIX PENDING IMAGES - DEPLOYMENT GUIDE
## Your Exact Setup Instructions

**Your Supabase Project:** `nvqrptokmwdhvpiufrad.supabase.co`  
**Current User Table:** `profiles` (with columns: user_id, name, role, org_id)

---

# PHASE 1: DATABASE SETUP (30 minutes)

## Step 1: Create Pending Images Table

```sql
-- Run this in Supabase SQL Editor
-- Location: https://supabase.com/dashboard/project/nvqrptokmwdhvpiufrad/sql

CREATE TABLE IF NOT EXISTS pending_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Image storage
  temp_storage_url TEXT NOT NULL,
  thumbnail_url TEXT,
  original_filename TEXT NOT NULL,
  file_size INTEGER,
  
  -- Source tracking
  source VARCHAR(20) NOT NULL CHECK (source IN ('email', 'whatsapp')),
  source_metadata JSONB DEFAULT '{}'::jsonb,
  
  -- User assignment
  assigned_to_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Auto-parsing (email)
  suggested_plate_number VARCHAR(20),
  suggested_case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  auto_match_confidence VARCHAR(20) CHECK (auto_match_confidence IN ('high', 'medium', 'low', NULL)),
  
  -- User decision
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'denied', 'deleted')),
  reviewed_at TIMESTAMPTZ,
  denial_reason TEXT,
  
  -- Final assignment
  final_case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  final_damage_center TEXT,
  
  -- Timestamps
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pending_user_status ON pending_images(assigned_to_user, status) 
WHERE status = 'pending';

CREATE INDEX idx_pending_received ON pending_images(received_at DESC) 
WHERE status = 'pending';

CREATE INDEX idx_pending_source ON pending_images(source, assigned_to_user);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pending_images_updated_at
  BEFORE UPDATE ON pending_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Step 2: Enable Row Level Security

```sql
-- Enable RLS
ALTER TABLE pending_images ENABLE ROW LEVEL SECURITY;

-- Policy: Users see only their images
CREATE POLICY "users_see_own_pending_images"
ON pending_images FOR SELECT
TO authenticated
USING (assigned_to_user = auth.uid());

-- Policy: Users can update their images
CREATE POLICY "users_update_own_pending_images"
ON pending_images FOR UPDATE
TO authenticated
USING (assigned_to_user = auth.uid())
WITH CHECK (assigned_to_user = auth.uid());

-- Policy: Users can delete their images
CREATE POLICY "users_delete_own_pending_images"
ON pending_images FOR DELETE
TO authenticated
USING (assigned_to_user = auth.uid());

-- Policy: Admin sees everything
CREATE POLICY "admin_full_access_pending_images"
ON pending_images FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
);
```

## Step 3: Create Support Tables

```sql
-- User OneDrive configuration
CREATE TABLE IF NOT EXISTS user_onedrive_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  whatsapp_folder_path TEXT NOT NULL,
  email_address TEXT NOT NULL,
  make_scenario_whatsapp_id TEXT,
  make_scenario_email_id TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS for config
ALTER TABLE user_onedrive_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_see_own_config"
ON user_onedrive_config FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "admin_manage_all_config"
ON user_onedrive_config FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Processing log
CREATE TABLE IF NOT EXISTS image_processing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pending_image_id UUID REFERENCES pending_images(id) ON DELETE CASCADE,
  stage VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error', 'in_progress')),
  details JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_processing_log_image ON image_processing_log(pending_image_id, timestamp DESC);
```

## Step 4: Create Supabase Storage Buckets

**In Supabase Dashboard:**

1. Go to **Storage**
2. Click **New Bucket**
3. Create bucket: `pending-images`
   - Public: ✓ Yes
   - File size limit: 10MB
   - Allowed MIME types: `image/jpeg, image/png, image/heic, image/webp`

**Storage Policies:**

```sql
-- Allow service role to upload
CREATE POLICY "Service role can upload pending images"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'pending-images');

-- Users can view their pending images
CREATE POLICY "Users view own pending images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'pending-images');
```

## Verification

```sql
-- Check all tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('pending_images', 'user_onedrive_config', 'image_processing_log');

-- Should return 3 rows

-- Check RLS policies
SELECT tablename, policyname FROM pg_policies 
WHERE tablename = 'pending_images';

-- Should return 4+ policies
```

---

# PHASE 2: DEPLOY FRONTEND FILES (15 minutes)

## Files to Upload to Netlify

**1. Create folder structure:**
```
your-netlify-site/
├── lib/
│   └── supabaseClient.js       (NEW - from outputs)
├── pending-images.html         (NEW - from outputs)
├── pending-images.js           (NEW - from outputs)
└── selection.html              (MODIFY - your existing file)
```

## Step 1: Update/Create `lib/supabaseClient.js`

**If this file already exists**, verify it has:
```javascript
const SUPABASE_URL = 'https://nvqrptokmwdhvpiufrad.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJI...'; // Your anon key
```

**If it doesn't exist**, create it using the file from outputs.

## Step 2: Upload New Files

1. Upload `pending-images.html` to your site root
2. Upload `pending-images.js` to your site root
3. Ensure `lib/supabaseClient.js` exists

## Step 3: Modify `selection.html`

**Add this code INSIDE the `<body>` tag, after your existing content:**

```html
<!-- Paste the entire content from selection-html-integration.html -->
```

**Location suggestion:** Right after the "Load Existing Case" section, before action buttons.

## Step 4: Deploy to Netlify

```bash
# If using Git
git add .
git commit -m "Add pending images feature"
git push origin main

# Or drag-and-drop deploy via Netlify dashboard
```

## Test Frontend

1. Go to: `https://yaron-cayouf-portal.netlify.app/pending-images.html`
2. Should see "טוען תמונות ממתינות..."
3. Then "כל התמונות נבדקו!" (because no pending images yet)

---

# PHASE 3: MAKE.COM SETUP (45 minutes per user)

## Get Your Credentials

**Supabase Service Key:**
1. Go to: https://supabase.com/dashboard/project/nvqrptokmwdhvpiufrad/settings/api
2. Copy **service_role key** (NOT anon key)
3. Save securely - you'll use this in Make.com

**Your Admin User ID:**
```sql
-- Run in Supabase SQL Editor
SELECT id, email FROM auth.users WHERE email = 'YOUR-ADMIN-EMAIL@example.com';
```
Copy the UUID - you'll use this as `assigned_to_user` in Make scenarios.

## Scenario A: WhatsApp Image Capture (for Admin)

**Follow the detailed guide in `EVALIX-IMPLEMENTATION-GUIDE.md` Part 3**

**Critical replacements:**
- Folder path: `/EVALIX-System/WhatsApp-Admin/` (create in OneDrive first)
- `assigned_to_user`: Your admin UUID from above
- Supabase URL: `https://nvqrptokmwdhvpiufrad.supabase.co`
- Service key: Your service_role key

**Modules needed:**
1. OneDrive - Watch Files
2. Filter (images only)
3. OneDrive - Download File
4. HTTP - Upload to Supabase Storage
5. HTTP - Insert into pending_images
6. OneSignal - Send Notification (optional for now)
7. OneDrive - Move File

## Scenario B: Email Image Capture (for Admin)

**Same as Scenario A but using email trigger**

**Critical replacements:**
- Email: Your admin email
- `assigned_to_user`: Your admin UUID
- Add plate number extraction with regex

## Scenario C: Process Accepted Image (Webhook)

**This runs when user clicks "Accept"**

1. Create webhook scenario in Make.com
2. Get webhook URL (looks like: `https://hook.us1.make.com/abc123...`)
3. Update `pending-images.js` line 15:
   ```javascript
   const WEBHOOK_PROCESS_IMAGE = 'https://hook.us1.make.com/YOUR-ACTUAL-WEBHOOK-ID';
   ```
4. Re-deploy to Netlify

---

# PHASE 4: ONEDRIVE SETUP (10 minutes)

## Create Folder Structure

In OneDrive for Business:

```
/EVALIX-System/
├── WhatsApp-Admin/           ← Create this (empty)
├── Processed/                ← Create this (for archived)
└── Backups/                  ← Already exists?
```

## Phone Configuration

**For iPhone:**
1. Install OneDrive app
2. Login with your work account
3. Settings → Camera Upload
4. Select folder: `/EVALIX-System/WhatsApp-Admin/`
5. Enable "WiFi and Cellular"
6. Disable "Include Videos"

**For Android:**
Similar process via OneDrive Camera Backup

**WhatsApp Settings:**
- WhatsApp → Settings → Chats → Save to Camera Roll: ON

---

# PHASE 5: END-TO-END TESTING (20 minutes)

## Test 1: Database Query

```sql
-- Manually insert test pending image
INSERT INTO pending_images (
  temp_storage_url,
  original_filename,
  source,
  assigned_to_user,
  status
) VALUES (
  'https://nvqrptokmwdhvpiufrad.supabase.co/storage/v1/object/public/pending-images/test.jpg',
  'test.jpg',
  'whatsapp',
  'YOUR-ADMIN-UUID-HERE',
  'pending'
);

-- Check it appears
SELECT * FROM pending_images WHERE status = 'pending';
```

## Test 2: Frontend Displays It

1. Go to: `https://yaron-cayouf-portal.netlify.app/pending-images.html`
2. Should see "תמונה 1 מתוך 1"
3. Should see test.jpg

## Test 3: Accept Flow

1. Search for a case (need existing case in your cases table)
2. Select case
3. Click "אשר"
4. Should see success toast
5. Check database:
   ```sql
   SELECT status FROM pending_images WHERE id = 'test-image-id';
   -- Should show 'accepted'
   ```

## Test 4: WhatsApp Integration

1. Upload an image manually to `/EVALIX-System/WhatsApp-Admin/` in OneDrive
2. Wait 5 minutes (or manually run Make scenario)
3. Check Supabase:
   ```sql
   SELECT * FROM pending_images ORDER BY received_at DESC LIMIT 1;
   ```
4. Should see new record
5. Check frontend - should appear

## Test 5: Selection Page Alert

1. Ensure you have pending images
2. Go to: `https://yaron-cayouf-portal.netlify.app/selection.html`
3. Should see orange alert with count
4. Click "בדוק תמונות ממתינות כעת"
5. Should navigate to pending-images.html

---

# PHASE 6: ADD MORE USERS (30 min per user)

## Checklist for Each New Assessor

```
□ Get assessor's auth.users UUID
□ Create OneDrive folder: /EVALIX-System/WhatsApp-[Name]/
□ Clone Make WhatsApp scenario, update folder + UUID
□ Clone Make Email scenario, update email + UUID
□ Insert into user_onedrive_config table
□ Configure assessor's phone
□ Test end-to-end
```

**See `NEW-ASSESSOR-ONBOARDING-MANUAL.md` for detailed steps**

---

# TROUBLESHOOTING

## Issue: "משתמש לא מחובר"

**Cause:** User not authenticated  
**Fix:** 
- Check if user is logged in
- Verify auth session exists
- Check browser console for auth errors

## Issue: Pending images not appearing

**Cause:** RLS blocking query  
**Fix:**
```sql
-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'pending_images';

-- Test as specific user
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid-here';
SELECT * FROM pending_images;
RESET ROLE;
```

## Issue: Images not syncing from WhatsApp

**Cause:** OneDrive not auto-uploading  
**Fix:**
- Check OneDrive app is logged in
- Verify camera upload enabled
- Check folder permissions
- Try manual upload to test

## Issue: Webhook not processing

**Cause:** Wrong webhook URL  
**Fix:**
- Verify webhook URL in `pending-images.js` line 15
- Check Make.com webhook scenario is active
- Test webhook with curl:
  ```bash
  curl -X POST YOUR-WEBHOOK-URL \
  -H "Content-Type: application/json" \
  -d '{"pending_image_id":"test","final_case_id":"test","user_id":"test"}'
  ```

## Issue: Case dropdown empty

**Cause:** No cases in database or RLS blocking  
**Fix:**
```sql
-- Check cases exist
SELECT id, plate_number FROM cases LIMIT 10;

-- If assessor, check their cases
SELECT * FROM cases WHERE assessor_id = 'user-uuid';
```

---

# MAINTENANCE

## Weekly Tasks

```sql
-- Check pending images count
SELECT status, COUNT(*) FROM pending_images GROUP BY status;

-- Check processing failures
SELECT * FROM image_processing_log 
WHERE status = 'error' 
ORDER BY timestamp DESC LIMIT 20;

-- Clean up old processed images (older than 30 days)
DELETE FROM pending_images 
WHERE status IN ('processed', 'deleted') 
  AND processed_at < NOW() - INTERVAL '30 days';
```

## Monthly Tasks

- Review Make.com operation usage
- Check OneDrive storage usage
- Review denied/deleted images for patterns
- Update documentation if workflows changed

---

# SUPPORT CONTACTS

**Database Issues:**
- Supabase Dashboard: https://supabase.com/dashboard
- Your project: nvqrptokmwdhvpiufrad

**Automation Issues:**
- Make.com Dashboard: https://make.com
- Check execution history for errors

**File Questions:**
- Review `EVALIX-IMPLEMENTATION-GUIDE.md` for technical details
- Review `NEW-ASSESSOR-ONBOARDING-MANUAL.md` for adding users

---

# SUCCESS CHECKLIST

```
□ Database tables created
□ RLS policies working
□ Storage bucket exists
□ Frontend files deployed
□ selection.html shows alert
□ pending-images.html loads
□ Can select cases in dropdown
□ Make.com WhatsApp scenario active
□ Make.com Email scenario active
□ Make.com Webhook scenario active
□ Webhook URL updated in code
□ OneDrive folders created
□ Phone auto-sync configured
□ End-to-end test passed
□ First assessor onboarded
```

---

# NEXT STEPS AFTER DEPLOYMENT

1. **Monitor for 1 week** - Check if images flow correctly
2. **Gather feedback** - Does the UI make sense to assessors?
3. **Add more users** - Follow onboarding manual
4. **Consider enhancements:**
   - Email notifications digest
   - Analytics dashboard
   - Batch operations improvements
   - Mobile app version

---

END OF DEPLOYMENT GUIDE
