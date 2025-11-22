# EVALIX - NEW ASSESSOR ONBOARDING MANUAL
## Quick Reference Guide for Adding New Users

**Version:** 1.0  
**Purpose:** Step-by-step checklist for developer when adding new assessor  
**Time Required:** ~30 minutes per assessor

---

# PRE-REQUISITES

✓ Admin access to Supabase  
✓ Admin access to Make.com  
✓ Admin access to OneDrive for Business  
✓ New assessor's email address  
✓ OneSignal configured

---

# STEP-BY-STEP PROCESS

## 1. CREATE SUPABASE USER (5 min)

### Via Supabase Dashboard:
1. Navigate to: **Authentication → Users → Add User**
2. Fill in:
   - **Email:** `new.assessor@evalix.com`
   - **Password:** [Generate strong password - share securely with assessor]
   - **User Metadata:**
     ```json
     {
       "role": "assessor",
       "name": "שם המעריך",
       "damage_center": "Center A"
     }
     ```
3. Click **Create User**

### Get User UUID:
```sql
-- Run in Supabase SQL Editor
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'new.assessor@evalix.com';

-- COPY THE id FIELD - YOU NEED THIS UUID!
```

**Save to notepad:**
```
User: new.assessor@evalix.com
UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Password: [generated password]
```

---

## 2. CONFIGURE USER DATA (3 min)

### Insert OneDrive Config:
```sql
-- Run in Supabase SQL Editor
INSERT INTO user_onedrive_config (
  user_id,
  whatsapp_folder_path,
  email_address,
  active
) VALUES (
  'USER_UUID_HERE',  -- Replace with UUID from Step 1
  '/EVALIX-System/WhatsApp-AssessorName/',  -- Replace AssessorName
  'new.assessor@evalix.com',
  true
);
```

### Assign Cases (if needed):
```sql
-- If you're migrating existing cases to new assessor
UPDATE cases
SET assessor_id = 'USER_UUID_HERE'
WHERE damage_center = 'Center A';  -- Or whatever filter applies
```

---

## 3. CREATE ONEDRIVE FOLDER (2 min)

1. Open **OneDrive for Business**
2. Navigate to `/EVALIX-System/`
3. Click **New → Folder**
4. Name: `WhatsApp-AssessorName`
5. Right-click folder → **Share**
6. Add assessor's email with **Edit** permission
7. Add your admin email with **Edit** permission
8. Save

**Final path:** `/EVALIX-System/WhatsApp-AssessorName/`

---

## 4. CLONE MAKE.COM WHATSAPP SCENARIO (5 min)

1. Go to Make.com
2. Find scenario: **"Admin - WhatsApp Image Capture"**
3. Click **⋮ → Clone**
4. Rename to: **"AssessorName - WhatsApp Image Capture"**
5. Open cloned scenario

### Edit Modules:

**MODULE 1 - OneDrive Watch:**
- Folder path: `/EVALIX-System/WhatsApp-AssessorName/`

**MODULE 6 - Insert pending_images:**
- Change `assigned_to_user` value to: `USER_UUID_HERE`

**MODULE 7 - OneSignal:**
- Change Player IDs to assessor's ID (get after first login)
- For now, can skip - add after they log in first time

**MODULE 8 - Move File:**
- Keep as is (shared /Processed folder)

6. Click **Save**
7. Click **Activate** (toggle switch ON)
8. Copy **Scenario ID** from URL: `https://make.com/scenario/SCENARIO_ID`

### Save Scenario ID to Database:
```sql
UPDATE user_onedrive_config
SET make_scenario_whatsapp_id = 'SCENARIO_ID_HERE'
WHERE user_id = 'USER_UUID_HERE';
```

---

## 5. CLONE MAKE.COM EMAIL SCENARIO (5 min)

1. Find scenario: **"Admin - Email Image Capture"**
2. Clone it
3. Rename to: **"AssessorName - Email Image Capture"**
4. Open cloned scenario

### Edit Modules:

**MODULE 1 - Email Watch:**
- **If assessor has their own email:** Change connection to `new.assessor@evalix.com`
- **If using shared mailbox:** Add filter for recipient = `new.assessor@evalix.com`

**MODULE 9 - Insert pending_images:**
- Change `assigned_to_user` to: `USER_UUID_HERE`

**MODULE 10 - OneSignal:**
- Change Player IDs (add after first login)

5. Save and Activate
6. Copy Scenario ID

### Save to Database:
```sql
UPDATE user_onedrive_config
SET make_scenario_email_id = 'SCENARIO_ID_HERE'
WHERE user_id = 'USER_UUID_HERE';
```

---

## 6. CONFIGURE ASSESSOR'S PHONE (Send Instructions)

### Email Template to Send Assessor:

```
נושא: הוראות הגדרת מערכת EVALIX

שלום [שם],

כדי להתחיל לעבוד עם מערכת EVALIX, יש להגדיר את הטלפון שלך כך שתמונות מ-WhatsApp יעלו אוטומטית למערכת.

### עבור iPhone:

1. התקן אפליקציית OneDrive מה-App Store
2. התחבר עם הדוא"ל: new.assessor@evalix.com
   סיסמה: [PASSWORD]
3. פתח OneDrive → הגדרות → Camera Upload
4. הפעל "Camera Upload"
5. בחר תיקייה: EVALIX-System/WhatsApp-[שמך]/
6. בחר "Upload via WiFi and Cellular"
7. כבה "Include Videos" (רק תמונות)

### עבור Android:

1. התקן OneDrive מ-Google Play
2. התחבר עם הדוא"ל: new.assessor@evalix.com
   סיסמה: [PASSWORD]
3. הגדרות → Camera backup
4. בחר תיקייה: EVALIX-System/WhatsApp-[שמך]/
5. הפעל "Upload using: WiFi and Mobile data"
6. בחר "Photos only"

### הגדרות WhatsApp:

1. פתח WhatsApp → הגדרות → צ'אטים
2. הפעל "שמור למצלמה" / "Media Visibility"

זה יגרום לכל תמונה שתקבל ב-WhatsApp להישמר בגלריה,
ומשם OneDrive יעלה אוטומטית למערכת.

### כניסה למערכת:

כתובת: https://yaron-cayouf-portal.netlify.app
דוא"ל: new.assessor@evalix.com
סיסמה: [PASSWORD]

אנא שנה את הסיסמה בכניסה הראשונה.

בהצלחה!
```

---

## 7. GET ONESIGNAL PLAYER ID (After First Login)

### After assessor logs in for first time:

1. Ask them to log into the web app
2. Run this in browser console on their machine:
   ```javascript
   OneSignal.getUserId().then(playerId => {
     console.log('Player ID:', playerId);
     alert('Player ID: ' + playerId);
   });
   ```
3. Save their Player ID

### Update Make.com Scenarios:

**WhatsApp Scenario - Module 7:**
- Change Player IDs to: `[their-player-id-here]`

**Email Scenario - Module 10:**
- Change Player IDs to: `[their-player-id-here]`

### Save to database:
```sql
-- Create a users_onesignal table if you don't have one
-- Or add to user metadata
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"onesignal_player_id": "PLAYER_ID_HERE"}'::jsonb
WHERE id = 'USER_UUID_HERE';
```

---

## 8. TEST END-TO-END (10 min)

### Test WhatsApp Flow:

1. Upload a test image to `/EVALIX-System/WhatsApp-AssessorName/` manually
2. Wait 5 minutes (or manually run Make scenario)
3. Check Supabase:
   ```sql
   SELECT * FROM pending_images 
   WHERE assigned_to_user = 'USER_UUID_HERE'
   ORDER BY received_at DESC
   LIMIT 5;
   ```
4. **Expected:** New record with status='pending'

### Test Email Flow:

1. Send email to `new.assessor@evalix.com` with:
   - Subject: `Test - Plate 12-345-67`
   - Attachment: `test-image.jpg`
2. Wait 10 minutes
3. Check Supabase (same query as above)
4. **Expected:** New record with suggested_plate_number='12-345-67'

### Test Frontend:

1. Log in as new assessor
2. Navigate to `pending-images.html`
3. Should see test images
4. Select a test case
5. Click "Accept"
6. **Expected:** 
   - Image moves to processed
   - Appears in case gallery
   - OneDrive backup created

### Test Processing Webhook:

1. After accepting, check:
   ```sql
   SELECT * FROM images WHERE case_id = 'test-case-id' ORDER BY uploaded_at DESC LIMIT 1;
   ```
2. **Expected:** New image record
3. Check OneDrive: `/EVALIX-System/Backups/[damage_center]/[case_id]/`
4. **Expected:** Image backup file exists

---

## 9. VERIFY & DOCUMENT

### Final Verification Checklist:

```
□ User can log in
□ User sees only their pending images (RLS working)
□ WhatsApp images auto-appear in pending queue
□ Email images auto-appear with plate extraction
□ Accept flow completes successfully
□ Images appear in case gallery
□ OneDrive backup created
□ OneSignal notifications received
```

### Document Completion:

```sql
-- Mark as active and tested
UPDATE user_onedrive_config
SET 
  active = true,
  updated_at = NOW()
WHERE user_id = 'USER_UUID_HERE';

-- Log completion
INSERT INTO image_processing_log (stage, status, details)
VALUES (
  'user_onboarding',
  'success',
  jsonb_build_object(
    'user_email', 'new.assessor@evalix.com',
    'user_id', 'USER_UUID_HERE',
    'onboarded_by', 'admin',
    'onboarded_at', NOW(),
    'scenarios_created', true,
    'phone_configured', true,
    'tested', true
  )
);
```

---

## 10. SEND WELCOME EMAIL

### Template:

```
נושא: ברוכים הבאים למערכת EVALIX

שלום [שם],

החשבון שלך במערכת EVALIX הופעל בהצלחה!

פרטי התחברות:
- כתובת: https://yaron-cayouf-portal.netlify.app
- דוא"ל: new.assessor@evalix.com
- סיסמה: [PASSWORD] (אנא שנה בכניסה ראשונה)

המערכת מוכנה:
✓ תמונות מ-WhatsApp יועלו אוטומטית
✓ תמונות מאימייל יועלו אוטומטית
✓ תקבל התראות על תמונות חדשות
✓ גישה לתיקים שהוקצו לך

מדריך שימוש:
1. כניסה למערכת
2. בדף הבית תראה התראה אם יש תמונות ממתינות
3. לחץ "בדוק תמונות ממתינות"
4. בחר תיק לכל תמונה
5. לחץ "אשר" - המערכת תעבד אוטומטית

תמיכה:
לשאלות/בעיות: support@evalix.com

בהצלחה!
```

---

# TROUBLESHOOTING

## Common Issues During Onboarding:

### User can't log in
- Verify email is correct in Supabase
- Reset password via Supabase dashboard
- Check if email confirmation required (disable for manual adds)

### Images not appearing in pending queue
- Verify Make scenarios are ACTIVE (green toggle)
- Check Make execution history for errors
- Verify OneDrive folder path is exact (case-sensitive)
- Check assigned_to_user UUID is correct

### Phone not syncing to OneDrive
- Check OneDrive app is logged in
- Verify folder permissions (edit access)
- Check camera upload is enabled
- Try manual upload to test

### RLS blocking user access
- Verify user UUID in pending_images.assigned_to_user
- Check RLS policies are enabled
- Test query as user:
  ```sql
  SET ROLE authenticated;
  SET request.jwt.claim.sub = 'USER_UUID';
  SELECT * FROM pending_images;
  RESET ROLE;
  ```

### Webhook not processing
- Verify webhook URL in frontend code
- Check Make webhook scenario is active
- Test webhook manually with curl
- Check Supabase service key is correct in Make

---

# OFFBOARDING PROCESS

## When Removing an Assessor:

### 1. Deactivate User:
```sql
UPDATE user_onedrive_config
SET active = false
WHERE user_id = 'USER_UUID';
```

### 2. Pause Make Scenarios:
- Deactivate both WhatsApp and Email scenarios
- DO NOT DELETE (keep for audit)

### 3. Reassign Cases (if needed):
```sql
UPDATE cases
SET assessor_id = 'NEW_ASSESSOR_UUID'
WHERE assessor_id = 'OLD_ASSESSOR_UUID';
```

### 4. Revoke OneDrive Access:
- Remove user from folder sharing

### 5. Disable Supabase Auth:
- Supabase Dashboard → Authentication → Users → [user] → Disable

### 6. Archive Pending Images:
```sql
UPDATE pending_images
SET status = 'archived',
    assigned_to_user = 'ADMIN_UUID'  -- Transfer to admin
WHERE assigned_to_user = 'OLD_USER_UUID'
  AND status = 'pending';
```

---

# PRICING TRACKING

## Per-User Costs:

**Make.com:**
- 2 scenarios per user
- ~1,000 operations/month per user (estimate)
- Cost: ~$5/month per user (varies by plan)

**Supabase:**
- Storage: ~1GB per user/month
- Database rows: Minimal
- Cost: Included in base plan

**OneDrive:**
- Storage: ~2-5GB per user/month
- Cost: Included in Microsoft 365

**Your Pricing:**
- Setup fee: $150 one-time
- Monthly per user: $29

**Your margin:** ~$24/month per user (after Make.com cost)

---

# SUPPORT CONTACTS

**Supabase Issues:**
- Dashboard: https://app.supabase.com
- Docs: https://supabase.com/docs
- Support: support@supabase.io

**Make.com Issues:**
- Dashboard: https://make.com
- Docs: https://make.com/en/help
- Support: support@make.com

**OneDrive Issues:**
- Admin: https://admin.microsoft.com
- Support: Microsoft 365 support

**OneSignal Issues:**
- Dashboard: https://onesignal.com
- Docs: https://documentation.onesignal.com

---

# VERSION HISTORY

**v1.0 - November 2025**
- Initial manual
- Supports vanilla HTML/JS frontend
- Make.com automation
- OneDrive integration

---

END OF QUICK REFERENCE MANUAL
