# EVALIX PENDING IMAGES SYSTEM - COMPLETE IMPLEMENTATION GUIDE

## VERSION: 1.0 | DATE: November 2025
## FOR: Vanilla HTML/JavaScript Application (Hebrew Interface)

---

# TABLE OF CONTENTS

1. [Quick Start Checklist](#quick-start-checklist)
2. [Database Setup](#database-setup)
3. [Make.com Scenarios](#makecom-scenarios)
4. [Frontend Implementation](#frontend-implementation)
5. [OneDrive Configuration](#onedrive-configuration)
6. [Operations Manual](#operations-manual)

---

# QUICK START CHECKLIST

## Before You Begin - Prerequisites

```
□ Supabase project created
□ Supabase Storage bucket "pending-images" created
□ Supabase Storage bucket "damage-images" exists (for final storage)
□ Make.com account with available operations
□ OneDrive for Business account (or personal with sufficient storage)
□ OneSignal account configured
□ Cloudinary account (optional - can use Supabase Storage only)
□ Admin user created in Supabase Auth
```

## Implementation Sequence

```
WEEK 1: Database Foundation
□ Day 1: Run database SQL (Part 2)
□ Day 2: Test database with manual inserts
□ Day 3: Configure Supabase Storage buckets

WEEK 2: Make.com Automation
□ Day 1: Create WhatsApp scenario for Admin
□ Day 2: Create Email scenario for Admin
□ Day 3: Create Processing Webhook scenario
□ Day 4-5: Test all scenarios end-to-end

WEEK 3: Frontend Development
□ Day 1: Create pending-images.html page
□ Day 2: Add selection page alert
□ Day 3: Implement toast notifications
□ Day 4: Add real-time subscriptions
□ Day 5: Full UI testing

WEEK 4: Production & Documentation
□ Day 1: Deploy to Netlify
□ Day 2: Configure user phones/OneDrive
□ Day 3: End-to-end testing with real images
□ Day 4: Create user training materials
□ Day 5: Monitor and fix edge cases
```

---

# PART 1: DATABASE SETUP

## Copy this SQL into Supabase SQL Editor

**(This SQL is already provided in previous response - use that exact SQL)**

Key points:
- Creates `pending_images` table
- Creates `user_onedrive_config` table
- Creates `image_processing_log` table
- Sets up RLS policies
- Creates indexes for performance

## Verification Query

After running SQL, verify with:

```sql
-- Should return all three tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('pending_images', 'user_onedrive_config', 'image_processing_log');

-- Should return 5+ policies
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'pending_images';
```

## Get Admin User UUID

```sql
-- Run this to get your admin user ID
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'your-admin-email@example.com';

-- Save this UUID - you'll need it for Make.com scenarios
```

---

# PART 2: SUPABASE STORAGE SETUP

## Create Buckets

```sql
-- In Supabase Dashboard → Storage → New Bucket

1. Bucket: pending-images
   - Public: YES
   - File size limit: 10MB
   - Allowed MIME types: image/jpeg, image/png, image/heic, image/webp

2. Bucket: damage-images (if not exists)
   - Public: YES
   - File size limit: 10MB
   - Allowed MIME types: image/jpeg, image/png, image/heic, image/webp
```

## Storage Policies (RLS for Storage)

```sql
-- Policy: Allow service role to upload to pending-images
CREATE POLICY "Service role can upload pending images"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'pending-images');

-- Policy: Users can view their pending images
CREATE POLICY "Users view own pending images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'pending-images'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM pending_images 
    WHERE assigned_to_user = auth.uid()
  )
);

-- Policy: Service role can upload to damage-images
CREATE POLICY "Service role can upload damage images"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'damage-images');
```

---

# PART 3: MAKE.COM SCENARIO - WHATSAPP IMAGE CAPTURE

## Scenario Name Template
```
[UserName] - WhatsApp Image Capture
Example: "Admin - WhatsApp Image Capture"
```

## Required Make.com Modules

### Prerequisites
- OneDrive connection established
- Supabase HTTP requests configured
- OneSignal API configured

## Module-by-Module Configuration

### MODULE 1: OneDrive - Watch Files in a Folder

```
Module: OneDrive → Watch Files in a Folder
Connection: [Your OneDrive connection]

Settings:
├─ Drive: My Drive (or Shared Drive if org)
├─ Folder: Browse → /EVALIX-System/WhatsApp-Admin/
├─ Limit: 10
└─ Watch: New files only

Schedule: Every 5 minutes

Output Variables to Use:
- {{1.id}} = File ID
- {{1.name}} = Filename
- {{1.size}} = File size in bytes
- {{1.createdDateTime}} = When file was created
- {{1.@microsoft.graph.downloadUrl}} = Direct download URL
```

---

### MODULE 2: Filter - Images Only

```
Module: Tools → Filter

Label: "Only Image Files"

Condition:
IF {{1.name}} matches pattern \.(?:jpg|jpeg|png|heic|webp)$ (case insensitive)
AND {{1.size}} greater than 10000

Continue processing: YES
Otherwise: STOP
```

**Why this filter:**
- Skips non-image files
- Skips corrupted/tiny files (less than 10KB)

---

### MODULE 3: OneDrive - Download a File

```
Module: OneDrive → Download a File

Settings:
├─ Drive: Same as Module 1
├─ File ID: {{1.id}}
└─ Convert: NO (keep as binary)

Output Variables:
- {{3.data}} = Binary file content (this is what we upload)
```

---

### MODULE 4: HTTP Request - Upload to Supabase Storage

```
Module: HTTP → Make a Request

URL: 
https://YOUR-PROJECT.supabase.co/storage/v1/object/pending-images/whatsapp_{{formatDate(now; "YYYYMMDDHHmmss")}}_{{1.name}}

Method: POST

Headers:
├─ Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY
├─ Content-Type: {{1.contentType}}
└─ x-upsert: false

Body Type: Raw
Body: {{3.data}}

Parse response: YES

Expected response: 
{
  "Key": "whatsapp_20251122140532_IMG001.jpg"
}
```

**CRITICAL:**
- Replace `YOUR-PROJECT` with your Supabase project reference
- Replace `YOUR_SUPABASE_SERVICE_ROLE_KEY` with your service role key (from Supabase → Settings → API)
- The service role key is SECRET - never expose in frontend

**How to get your keys:**
1. Go to Supabase Dashboard
2. Project Settings → API
3. Copy "Project URL" and "service_role key" (NOT anon key)

---

### MODULE 5: Set Variables - Build Storage URL

```
Module: Tools → Set Variable

Variable name: storageUrl
Value: 
https://YOUR-PROJECT.supabase.co/storage/v1/object/public/pending-images/{{4.data.Key}}

Variable name: thumbnailUrl
Value: 
https://YOUR-PROJECT.supabase.co/storage/v1/object/public/pending-images/{{4.data.Key}}?width=300&height=300
```

**Note:** Supabase can auto-generate thumbnails with URL parameters. If you want Cloudinary instead, add Cloudinary module here.

---

### MODULE 6: Supabase - Insert Row (pending_images)

```
Module: HTTP → Make a Request

URL: https://YOUR-PROJECT.supabase.co/rest/v1/pending_images

Method: POST

Headers:
├─ Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY
├─ apikey: YOUR_SUPABASE_SERVICE_ROLE_KEY
├─ Content-Type: application/json
└─ Prefer: return=representation

Body Type: Raw (JSON)
Body:
{
  "temp_storage_url": "{{5.storageUrl}}",
  "thumbnail_url": "{{5.thumbnailUrl}}",
  "original_filename": "{{1.name}}",
  "file_size": {{1.size}},
  "source": "whatsapp",
  "source_metadata": {
    "onedrive_file_id": "{{1.id}}",
    "onedrive_created": "{{1.createdDateTime}}",
    "processed_by_make": "{{now}}"
  },
  "assigned_to_user": "YOUR_ADMIN_USER_UUID_HERE",
  "status": "pending",
  "received_at": "{{now}}"
}

Parse response: YES
```

**CRITICAL:**
- Replace `YOUR_ADMIN_USER_UUID_HERE` with the UUID from Step 1 (Get Admin User UUID)
- This UUID determines WHO will see this image in the UI

**Expected response:**
```json
[
  {
    "id": "newly-created-uuid",
    "temp_storage_url": "https://...",
    "status": "pending"
  }
]
```

Save `{{6.data[].id}}` - this is the pending_image_id

---

### MODULE 7: OneSignal - Send Push Notification

```
Module: OneSignal → Send Notification

Connection: [Your OneSignal connection]

Settings:
├─ App ID: [Your OneSignal App ID]
├─ Send to: Specific Users
├─ Player IDs: [Admin's OneSignal Player ID - from your user database]
├─ Notification:
│   ├─ Title (Hebrew): תמונה חדשה התקבלה
│   ├─ Message (Hebrew): קיבלת תמונה חדשה מ-WhatsApp
│   └─ Launch URL: https://yaron-cayouf-portal.netlify.app/pending-images.html
└─ Additional Data (JSON):
    {
      "action": "open_pending_images",
      "pending_image_id": "{{6.data[].id}}",
      "source": "whatsapp"
    }
```

**OneSignal Player ID:**
- This is unique per user per device
- Store it in your users table when they first log in
- Get it via OneSignal JavaScript SDK: `OneSignal.getUserId()`

---

### MODULE 8: OneDrive - Move File (Housekeeping)

```
Module: OneDrive → Move a File

Settings:
├─ File ID: {{1.id}}
├─ New location (folder): /EVALIX-System/Processed/{{formatDate(now; "YYYY-MM-DD")}}/
└─ New name: {{1.name}}

If folder doesn't exist: Create
```

**Why move:**
- Prevents re-processing same file
- Archives for audit trail
- Keeps watch folder clean

---

### MODULE 9: Error Handler (Add to Entire Scenario)

```
Right-click scenario background → Error Handler → Add Error Handler Route

Module: Email (or Slack)

To: your-admin-email@example.com
Subject: EVALIX - WhatsApp Processing Error
Body:
File: {{1.name}}
Error: {{error.message}}
Time: {{now}}
User: Admin
```

**Error Handling Settings (on scenario level):**
- Sequential processing: ON (one file at a time)
- Max consecutive errors: 5
- On error: Continue
- Store incomplete executions: 7 days

---

## Complete WhatsApp Scenario Flow Diagram

```
┌─────────────────────────────────────────────┐
│ TRIGGER: Every 5 minutes                    │
│ Watch OneDrive Folder                       │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ MODULE 1: Watch Files                       │
│ Output: File metadata                       │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ MODULE 2: Filter (images only)              │
│ Stop if not image                           │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ MODULE 3: Download File                     │
│ Output: Binary data                         │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ MODULE 4: Upload to Supabase Storage        │
│ Output: Storage key                         │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ MODULE 5: Build URLs                        │
│ Output: storageUrl, thumbnailUrl            │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ MODULE 6: Insert pending_images record      │
│ Output: pending_image_id                    │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ MODULE 7: Send OneSignal Notification       │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ MODULE 8: Move File to Processed/           │
│ (Housekeeping - prevents reprocessing)      │
└─────────────────────────────────────────────┘
```

---

# PART 4: MAKE.COM SCENARIO - EMAIL IMAGE CAPTURE

## Scenario Name Template
```
[UserName] - Email Image Capture
Example: "Admin - Email Image Capture"
```

## Additional Required Module: Text Parser

### MODULE 1: Microsoft 365 Email - Watch Emails

```
Module: Microsoft 365 Email → Watch Emails

Connection: [Connect to user's email account]

Settings:
├─ Mailbox: Primary mailbox
├─ Folder: Inbox
├─ Filter: Has Attachments = true
├─ Limit: 5
├─ Mark as read: true (optional - recommended)
└─ Get attachments: YES

Schedule: Every 10 minutes
```

**Output Variables:**
- `{{1.id}}` = Email ID
- `{{1.subject}}` = Subject line
- `{{1.bodyPreview}}` = Email body preview
- `{{1.from.emailAddress.address}}` = Sender email
- `{{1.receivedDateTime}}` = When received
- `{{1.attachments[]}}` = Array of attachments

---

### MODULE 2: Iterator - Loop Through Attachments

```
Module: Flow Control → Iterator

Array: {{1.attachments}}
```

**This creates a loop - modules 3+ process each attachment individually**

---

### MODULE 3: Filter - Images Only

```
Module: Tools → Filter

Condition:
IF {{2.contentType}} contains "image"
OR {{2.name}} matches pattern \.(?:jpg|jpeg|png|heic|webp)$
```

---

### MODULE 4: Text Parser - Extract Plate Number

```
Module: Tools → Text Parser

Text to parse: {{1.subject}} {{1.bodyPreview}}

Pattern: 
\b(\d{2,3}[-\s]?\d{2,3}[-\s]?\d{2,3})\b

Pattern Type: Regular Expression
Global match: NO (first match only)
Case sensitive: NO
Multiline: YES

Output variable name: plateNumber
```

**Regex Explanation:**
- `\b` = Word boundary
- `\d{2,3}` = 2 or 3 digits
- `[-\s]?` = Optional hyphen or space
- Pattern matches: "12-345-67", "12 345 67", "123-45-678"

**Output:**
- `{{4.plateNumber}}` = Extracted plate (or empty if not found)

---

### MODULE 5: Supabase - Search Cases (Auto-Match)

```
Module: HTTP → Make a Request

URL: https://YOUR-PROJECT.supabase.co/rest/v1/cases

Method: GET

Headers:
├─ Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY
└─ apikey: YOUR_SUPABASE_SERVICE_ROLE_KEY

Query String:
├─ plate_number=eq.{{4.plateNumber}}
├─ select=case_id,plate_number,case_status,damage_center,created_at
├─ order=case_status.in.(open,in_progress),created_at.desc
└─ limit=1

Parse response: YES
```

**This query:**
1. Finds cases matching extracted plate
2. Prioritizes OPEN cases first
3. If multiple open, takes newest
4. Returns at most 1 case

**Output:**
- `{{5.data[].case_id}}` = Matched case ID (if any)
- `{{5.data[].case_status}}` = Status (open, closed, etc.)

---

### MODULE 6: Router - Determine Confidence

```
Module: Flow Control → Router

3 Routes:

ROUTE 1: High Confidence
Condition: 
  {{5.data[].case_status}} = "open" 
  OR {{5.data[].case_status}} = "in_progress"
Then: Set variable confidence = "high"

ROUTE 2: Medium Confidence  
Condition:
  {{5.data[].case_status}} = "closed"
Then: Set variable confidence = "medium"

ROUTE 3: Low Confidence (Fallback)
Condition: Otherwise
Then: Set variable confidence = "low"
```

**All routes then converge back to Module 7**

---

### MODULE 7: HTTP - Upload Image to Supabase Storage

```
(Same as WhatsApp Scenario Module 4, but with email_ prefix)

URL: 
https://YOUR-PROJECT.supabase.co/storage/v1/object/pending-images/email_{{formatDate(now; "YYYYMMDDHHmmss")}}_{{2.name}}

Body: {{2.contentBytes}} (email attachments use contentBytes not data)
```

---

### MODULE 8: Set Variables

```
(Same as WhatsApp Module 5)
```

---

### MODULE 9: Supabase - Insert pending_images

```
Module: HTTP → Make a Request

URL: https://YOUR-PROJECT.supabase.co/rest/v1/pending_images

Headers: (same as before)

Body:
{
  "temp_storage_url": "{{8.storageUrl}}",
  "thumbnail_url": "{{8.thumbnailUrl}}",
  "original_filename": "{{2.name}}",
  "file_size": {{2.size}},
  "source": "email",
  "source_metadata": {
    "email_id": "{{1.id}}",
    "sender": "{{1.from.emailAddress.address}}",
    "subject": "{{1.subject}}",
    "received_datetime": "{{1.receivedDateTime}}",
    "body_preview": "{{substring(1.bodyPreview; 0; 200)}}"
  },
  "assigned_to_user": "YOUR_ADMIN_USER_UUID_HERE",
  "suggested_plate_number": "{{4.plateNumber}}",
  "suggested_case_id": "{{5.data[].case_id}}",
  "auto_match_confidence": "{{6.confidence}}",
  "status": "pending",
  "received_at": "{{now}}"
}
```

**Key Differences from WhatsApp:**
- `source: "email"`
- `source_metadata` includes email info
- Has `suggested_plate_number` and `suggested_case_id`
- Has `auto_match_confidence`

---

### MODULE 10: OneSignal Notification

```
Title (Hebrew): 
  {{if(4.plateNumber; "תמונה חדשה - " + 4.plateNumber; "תמונה חדשה מאימייל")}}

Message (Hebrew):
  {{if(6.confidence = "high"; "התאמה אוטומטית לתיק פתוח"; "נדרשת בדיקה ידנית")}}

Additional Data:
{
  "action": "open_pending_images",
  "pending_image_id": "{{9.data[].id}}",
  "source": "email",
  "auto_matched": {{if(6.confidence = "high"; true; false)}}
}
```

---

## Email Scenario Complete Flow

```
TRIGGER: Every 10 minutes → Watch Emails (has attachments)
  ↓
Iterator → Loop each attachment
  ↓
Filter → Images only
  ↓
Text Parser → Extract plate number
  ↓
Supabase Query → Find matching cases
  ↓
Router → Determine confidence (high/medium/low)
  ↓
Upload to Supabase Storage
  ↓
Insert pending_images record (with suggestions)
  ↓
Send OneSignal notification
```

---

# PART 5: MAKE.COM SCENARIO - PROCESS ACCEPTED IMAGE (WEBHOOK)

## Purpose
This scenario runs when user clicks "Accept" in the UI. It moves the image to final storage, processes with Cloudinary, backs up to OneDrive, and creates the final image record.

## Scenario Name
```
EVALIX - Process Accepted Image (Webhook)
```

---

### MODULE 1: Webhooks - Custom Webhook

```
Module: Webhooks → Custom Webhook

Create a new webhook

Webhook URL will be generated - SAVE THIS URL
Example: https://hook.us1.make.com/abc123xyz

Data structure (what your frontend will send):
{
  "pending_image_id": "uuid-string",
  "final_case_id": "uuid-string",
  "final_damage_center": "string",
  "user_id": "uuid-string"
}
```

**SAVE THE WEBHOOK URL** - You'll use this in the frontend code

---

### MODULE 2: Supabase - Get pending_images Record

```
Module: HTTP → Make a Request

URL: https://YOUR-PROJECT.supabase.co/rest/v1/pending_images

Method: GET

Headers: (standard Supabase headers)

Query String:
├─ id=eq.{{1.pending_image_id}}
└─ select=*

Parse response: YES
```

**Output:**
- `{{2.data[].temp_storage_url}}` - Where image currently is
- `{{2.data[].original_filename}}`
- `{{2.data[].source}}`

---

### MODULE 3: HTTP - Download Image from Temp Storage

```
Module: HTTP → Get a File

URL: {{2.data[].temp_storage_url}}

Method: GET

Response: Store as binary
```

**Output:**
- `{{3.data}}` - Binary image data

---

### MODULE 4: HTTP - Upload to Final Supabase Storage

```
Module: HTTP → Make a Request

URL: 
https://YOUR-PROJECT.supabase.co/storage/v1/object/damage-images/{{1.final_case_id}}/{{formatDate(now; "YYYYMMDD_HHmmss")}}_{{2.data[].original_filename}}

Method: POST

Headers:
├─ Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY
└─ Content-Type: image/jpeg (or detect from filename)

Body: {{3.data}}

Parse response: YES
```

**Output:**
- `{{4.data.Key}}` - Final storage path

**Final URL will be:**
```
https://YOUR-PROJECT.supabase.co/storage/v1/object/public/damage-images/{{4.data.Key}}
```

---

### MODULE 5: Cloudinary - Upload (Optional)

```
Module: Cloudinary → Upload an Asset

Settings:
├─ File: {{3.data}}
├─ Folder: evalix/{{1.final_case_id}}
├─ Public ID: {{formatDate(now; "YYYYMMDD_HHmmss")}}_{{2.data[].original_filename}}
├─ Transformation: 
│   └─ [Your standard transformation - e.g., w_1920,q_auto,f_auto]
└─ Resource type: image

Output:
- {{5.secure_url}} - Cloudinary URL
```

**If you're NOT using Cloudinary:**
Skip this module and use Supabase URL directly in Module 7

---

### MODULE 6: OneDrive - Upload File (Backup)

```
Module: OneDrive → Upload a File

Settings:
├─ Folder path: /EVALIX-System/Backups/{{1.final_damage_center}}/{{1.final_case_id}}/
├─ File name: {{formatDate(now; "YYYYMMDD_HHmmss")}}_{{2.data[].original_filename}}
├─ File content: {{3.data}}
└─ If folder doesn't exist: Create

Output:
- {{6.id}} - OneDrive file ID
- {{6.webUrl}} - OneDrive web URL
```

---

### MODULE 7: Supabase - Insert into images Table

```
Module: HTTP → Make a Request

URL: https://YOUR-PROJECT.supabase.co/rest/v1/images

Method: POST

Headers: (standard)

Body:
{
  "case_id": "{{1.final_case_id}}",
  "image_url": "https://YOUR-PROJECT.supabase.co/storage/v1/object/public/damage-images/{{4.data.Key}}",
  "cloudinary_url": "{{5.secure_url}}",
  "onedrive_backup_url": "{{6.webUrl}}",
  "source": "{{2.data[].source}}",
  "original_filename": "{{2.data[].original_filename}}",
  "uploaded_at": "{{now}}",
  "uploaded_by": "{{1.user_id}}"
}

Parse response: YES
```

**This creates the final image record in your cases system**

---

### MODULE 8: Supabase - Update pending_images Status

```
Module: HTTP → Make a Request

URL: https://YOUR-PROJECT.supabase.co/rest/v1/pending_images

Method: PATCH

Headers: (standard)

Query String:
└─ id=eq.{{1.pending_image_id}}

Body:
{
  "status": "processed",
  "processed_at": "{{now}}"
}
```

**This marks the pending image as complete**

---

### MODULE 9: Supabase - Delete Temp Storage (Cleanup)

```
Module: HTTP → Make a Request

URL: 
https://YOUR-PROJECT.supabase.co/storage/v1/object/pending-images/{{extractStoragePath(2.data[].temp_storage_url)}}

Method: DELETE

Headers:
├─ Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY
└─ apikey: YOUR_SUPABASE_SERVICE_ROLE_KEY
```

**Note:** You may need a helper function to extract just the path from the full URL

---

### MODULE 10: Webhook Response

```
Module: Webhooks → Webhook Response

Status: 200
Body:
{
  "success": true,
  "message": "Image processed successfully",
  "image_id": "{{7.data[].id}}",
  "final_url": "https://YOUR-PROJECT.supabase.co/storage/v1/object/public/damage-images/{{4.data.Key}}"
}
```

**This responds back to your frontend with success**

---

## Processing Webhook Complete Flow

```
Frontend calls webhook when user clicks "Accept"
  ↓
Webhook receives: pending_image_id, final_case_id, user_id
  ↓
Get pending_images record
  ↓
Download temp image
  ↓
Upload to final Supabase Storage (damage-images/case_id/)
  ↓
Upload to Cloudinary (transformed)
  ↓
Backup to OneDrive (organized by damage center)
  ↓
Insert record in images table
  ↓
Update pending_images status = "processed"
  ↓
Delete temp storage file
  ↓
Return success to frontend
```

---

# TESTING YOUR MAKE.COM SCENARIOS

## Test WhatsApp Scenario

1. **Manual test:**
   - Upload a test image to your OneDrive folder manually
   - Wait 5 minutes (or run scenario manually)
   - Check Supabase: `SELECT * FROM pending_images`
   - Should see new record with status='pending'

2. **Phone test:**
   - Send yourself a WhatsApp image
   - Wait for phone to auto-sync to OneDrive
   - Check Make.com execution history
   - Verify record in Supabase

## Test Email Scenario

1. **Send test email:**
   ```
   To: your-admin-email@evalix.com
   Subject: Test Damage - Plate 12-345-67
   Attachment: test-image.jpg
   ```

2. **Check execution:**
   - Wait 10 minutes
   - Check Make.com history
   - Verify pending_images record
   - Check if plate number was extracted
   - Check if case was auto-matched

## Test Processing Webhook

1. **Use Postman or curl:**
   ```bash
   curl -X POST https://hook.us1.make.com/YOUR-WEBHOOK-ID \
   -H "Content-Type: application/json" \
   -d '{
     "pending_image_id": "uuid-from-test-above",
     "final_case_id": "existing-case-uuid",
     "final_damage_center": "Center A",
     "user_id": "your-admin-uuid"
   }'
   ```

2. **Expected results:**
   - Image moved to damage-images bucket
   - Record in images table
   - pending_images status = "processed"
   - Temp storage deleted

---

# PART 6: FRONTEND IMPLEMENTATION

## File Structure

```
your-netlify-app/
├── index.html (your existing home page)
├── upload-images.html (your existing upload page)
├── pending-images.html (NEW - create this)
├── js/
│   ├── supabase-client.js (NEW - Supabase initialization)
│   ├── pending-images.js (NEW - pending images logic)
│   ├── toast-notifications.js (NEW - notification system)
│   └── realtime-subscription.js (NEW - real-time updates)
└── css/
    ├── pending-images.css (NEW - styling)
    └── toast.css (NEW - notification styling)
```

---

## CRITICAL: I need your existing code to provide exact implementations

**Please create a ZIP or share these files:**

1. Your existing `upload-images.html` (full source code)
2. How you initialize Supabase (JavaScript code)
3. Your main CSS file
4. How you handle user authentication
5. Your home/selection page HTML

**Once you share, I'll provide:**
- Exact HTML matching your style
- JavaScript using your patterns
- CSS matching your design
- Integration with your auth system

---

## Generic Template (Adapt to Your Code)

### File: `js/supabase-client.js`

```javascript
// Supabase Initialization
// Replace with YOUR credentials

const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Get current user
async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return user;
}

// Export for use in other files
window.supabaseClient = supabase;
window.getCurrentUser = getCurrentUser;
```

Include in HTML:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase-client.js"></script>
```

---

### File: `pending-images.html`

```html
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>בדיקת תמונות ממתינות - EVALIX</title>
  
  <!-- Supabase -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  
  <!-- Your existing CSS -->
  <link rel="stylesheet" href="css/main.css">
  <link rel="stylesheet" href="css/pending-images.css">
  <link rel="stylesheet" href="css/toast.css">
</head>
<body>
  
  <div class="container">
    
    <!-- Header -->
    <header>
      <h1>בדיקת תמונות ממתינות</h1>
      <button onclick="window.location.href='index.html'" class="btn-back">
        חזרה לדף הבית
      </button>
    </header>

    <!-- Loading State -->
    <div id="loading-state" class="loading">
      <p>טוען תמונות ממתינות...</p>
    </div>

    <!-- Empty State -->
    <div id="empty-state" class="empty-state" style="display: none;">
      <h2>✓ כל התמונות נבדקו!</h2>
      <p>אין תמונות ממתינות לבדיקה כרגע</p>
      <button onclick="window.location.href='index.html'" class="btn-primary">
        חזרה לדף הבית
      </button>
    </div>

    <!-- Image Review Interface -->
    <div id="review-interface" style="display: none;">
      
      <!-- Progress -->
      <div class="progress-bar">
        <span id="progress-text">תמונה 1 מתוך 5</span>
        <div class="progress-fill" id="progress-fill"></div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <button class="filter-btn active" data-filter="all">הכל</button>
        <button class="filter-btn" data-filter="whatsapp">WhatsApp</button>
        <button class="filter-btn" data-filter="email">אימייל</button>
      </div>

      <!-- Current Image Display -->
      <div class="image-display">
        
        <!-- Source Badge -->
        <div class="source-badge" id="source-badge"></div>
        
        <!-- Image Container -->
        <div class="image-container">
          <img id="current-image" src="" alt="תמונה ממתינה" />
          <button class="btn-expand" onclick="expandImage()">
            🔍 הגדל תמונה
          </button>
        </div>

        <!-- Image Metadata -->
        <div class="image-info">
          <p><strong>שם קובץ:</strong> <span id="filename"></span></p>
          <p><strong>התקבל:</strong> <span id="received-time"></span></p>
          <p id="email-info" style="display: none;">
            <strong>שולח:</strong> <span id="sender"></span>
          </p>
          <p id="plate-info" style="display: none;">
            <strong>מספר רכב מזוהה:</strong> <span id="detected-plate"></span>
          </p>
        </div>
      </div>

      <!-- Case Assignment -->
      <div class="case-assignment">
        <h3>שיוך לתיק</h3>
        
        <!-- Auto-match notification -->
        <div id="auto-match-notice" class="notice-box" style="display: none;">
          ✓ זוהתה התאמה אוטומטית לתיק פתוח
        </div>

        <!-- Search Input -->
        <div class="search-box">
          <input 
            type="text" 
            id="case-search" 
            placeholder="חפש לפי מספר רכב או שם..."
            autocomplete="off"
          />
        </div>

        <!-- Dropdown Results -->
        <div id="case-results" class="case-dropdown" style="display: none;">
          <!-- Populated dynamically -->
        </div>

        <!-- Selected Case Display -->
        <div id="selected-case" class="selected-case" style="display: none;">
          <strong>תיק נבחר:</strong> <span id="selected-case-name"></span>
          <button onclick="clearSelection()" class="btn-clear">נקה</button>
        </div>

      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button onclick="deleteImage()" class="btn-delete">
          ❌ מחק
        </button>
        <button onclick="denyImage()" class="btn-deny">
          ⊘ דחה
        </button>
        <button onclick="previousImage()" class="btn-nav" id="btn-prev" disabled>
          ← הקודם
        </button>
        <button onclick="acceptImage()" class="btn-accept" id="btn-accept" disabled>
          ✓ אשר ←
        </button>
      </div>

      <!-- Batch Actions -->
      <div class="batch-actions">
        <p>אותו תיק לכל התמונות?</p>
        <button onclick="batchAcceptAll()" class="btn-batch" disabled id="btn-batch">
          אשר הכל לתיק הנבחר
        </button>
      </div>

    </div>

  </div>

  <!-- Image Lightbox -->
  <div id="image-lightbox" class="lightbox" style="display: none;" onclick="closeLightbox()">
    <img id="lightbox-image" src="" alt="" />
  </div>

  <!-- Toast Notifications Container -->
  <div id="toast-container"></div>

  <!-- Scripts -->
  <script src="js/supabase-client.js"></script>
  <script src="js/toast-notifications.js"></script>
  <script src="js/pending-images.js"></script>

</body>
</html>
```

---

### File: `js/pending-images.js`

```javascript
// Pending Images Management
// Handles loading, displaying, and processing pending images

let pendingImages = [];
let currentIndex = 0;
let selectedCaseId = null;
let selectedCaseName = null;
let selectedDamageCenter = null;
let currentUser = null;
let allUserCases = [];

// Make.com webhook URL (from Scenario C)
const WEBHOOK_PROCESS_IMAGE = 'https://hook.us1.make.com/YOUR-WEBHOOK-ID';

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  await init();
});

async function init() {
  // Get current user
  currentUser = await getCurrentUser();
  
  if (!currentUser) {
    alert('משתמש לא מחובר');
    window.location.href = 'login.html';
    return;
  }

  // Load user's cases (for dropdown)
  await loadUserCases();

  // Load pending images
  await loadPendingImages();

  // Setup real-time subscription
  setupRealtimeSubscription();

  // Setup case search
  setupCaseSearch();
}

// Load all user's cases for dropdown
async function loadUserCases() {
  try {
    const { data, error } = await supabaseClient
      .from('cases')
      .select('case_id, plate_number, case_status, damage_center, created_at')
      .eq('assessor_id', currentUser.id) // Adjust based on your schema
      .order('case_status', { ascending: true }) // Open cases first
      .order('created_at', { ascending: false });

    if (error) throw error;

    allUserCases = data || [];
    console.log(`Loaded ${allUserCases.length} cases for user`);
  } catch (error) {
    console.error('Error loading cases:', error);
    showToast('שגיאה בטעינת תיקים', 'error');
  }
}

// Load pending images for current user
async function loadPendingImages() {
  document.getElementById('loading-state').style.display = 'block';
  
  try {
    const { data, error } = await supabaseClient
      .from('pending_images')
      .select('*')
      .eq('assigned_to_user', currentUser.id)
      .eq('status', 'pending')
      .order('received_at', { ascending: false });

    if (error) throw error;

    pendingImages = data || [];
    console.log(`Loaded ${pendingImages.length} pending images`);

    document.getElementById('loading-state').style.display = 'none';

    if (pendingImages.length === 0) {
      showEmptyState();
    } else {
      showReviewInterface();
      displayCurrentImage();
    }

  } catch (error) {
    console.error('Error loading pending images:', error);
    showToast('שגיאה בטעינת תמונות', 'error');
    document.getElementById('loading-state').style.display = 'none';
  }
}

// Show empty state (no pending images)
function showEmptyState() {
  document.getElementById('empty-state').style.display = 'block';
  document.getElementById('review-interface').style.display = 'none';
}

// Show review interface
function showReviewInterface() {
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('review-interface').style.display = 'block';
}

// Display current image
function displayCurrentImage() {
  if (currentIndex >= pendingImages.length) {
    // All done
    showEmptyState();
    return;
  }

  const image = pendingImages[currentIndex];

  // Update progress
  document.getElementById('progress-text').textContent = 
    `תמונה ${currentIndex + 1} מתוך ${pendingImages.length}`;
  document.getElementById('progress-fill').style.width = 
    `${((currentIndex + 1) / pendingImages.length) * 100}%`;

  // Display image
  document.getElementById('current-image').src = image.thumbnail_url || image.temp_storage_url;
  
  // Source badge
  const sourceBadge = document.getElementById('source-badge');
  if (image.source === 'whatsapp') {
    sourceBadge.textContent = '📱 WhatsApp';
    sourceBadge.className = 'source-badge source-whatsapp';
  } else {
    sourceBadge.textContent = '📧 אימייל';
    sourceBadge.className = 'source-badge source-email';
  }

  // Metadata
  document.getElementById('filename').textContent = image.original_filename;
  document.getElementById('received-time').textContent = 
    formatRelativeTime(image.received_at);

  // Email-specific info
  if (image.source === 'email') {
    document.getElementById('email-info').style.display = 'block';
    document.getElementById('sender').textContent = 
      image.source_metadata?.sender || 'לא ידוע';

    // Plate info
    if (image.suggested_plate_number) {
      document.getElementById('plate-info').style.display = 'block';
      document.getElementById('detected-plate').textContent = 
        image.suggested_plate_number;
    } else {
      document.getElementById('plate-info').style.display = 'none';
    }

    // Auto-match
    if (image.suggested_case_id && image.auto_match_confidence === 'high') {
      document.getElementById('auto-match-notice').style.display = 'block';
      // Pre-select the suggested case
      preselectCase(image.suggested_case_id);
    } else {
      document.getElementById('auto-match-notice').style.display = 'none';
    }
  } else {
    document.getElementById('email-info').style.display = 'none';
    document.getElementById('plate-info').style.display = 'none';
    document.getElementById('auto-match-notice').style.display = 'none';
  }

  // Button states
  document.getElementById('btn-prev').disabled = (currentIndex === 0);
  updateAcceptButton();
}

// Preselect a case (for auto-match)
function preselectCase(caseId) {
  const matchedCase = allUserCases.find(c => c.case_id === caseId);
  if (matchedCase) {
    selectCase(matchedCase.case_id, matchedCase.plate_number, matchedCase.damage_center);
  }
}

// Format relative time (Hebrew)
function formatRelativeTime(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'עכשיו';
  if (diffMins < 60) return `לפני ${diffMins} דקות`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `לפני ${diffHours} שעות`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `לפני ${diffDays} ימים`;
}

// Setup case search
function setupCaseSearch() {
  const searchInput = document.getElementById('case-search');
  const resultsDiv = document.getElementById('case-results');

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();

    if (query.length === 0) {
      resultsDiv.style.display = 'none';
      return;
    }

    // Filter cases
    const filtered = allUserCases.filter(c => 
      c.plate_number.includes(query) ||
      c.case_id.includes(query)
    ).slice(0, 10); // Limit to 10 results

    if (filtered.length === 0) {
      resultsDiv.innerHTML = '<div class="case-item">לא נמצאו תיקים</div>';
      resultsDiv.style.display = 'block';
      return;
    }

    // Display results
    resultsDiv.innerHTML = filtered.map(c => `
      <div class="case-item ${c.case_status === 'open' ? 'case-open' : 'case-closed'}" 
           onclick="selectCase('${c.case_id}', '${c.plate_number}', '${c.damage_center}')">
        <strong>${c.plate_number}</strong>
        <span class="case-status">${c.case_status === 'open' ? 'פתוח' : 'סגור'}</span>
        <span class="case-center">${c.damage_center}</span>
      </div>
    `).join('');

    resultsDiv.style.display = 'block';
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box') && !e.target.closest('.case-dropdown')) {
      resultsDiv.style.display = 'none';
    }
  });
}

// Select a case
function selectCase(caseId, plateName, damageCenter) {
  selectedCaseId = caseId;
  selectedCaseName = plateName;
  selectedDamageCenter = damageCenter;

  // Show selected
  document.getElementById('selected-case').style.display = 'block';
  document.getElementById('selected-case-name').textContent = 
    `${plateName} - ${damageCenter}`;
  
  // Hide dropdown
  document.getElementById('case-results').style.display = 'none';
  document.getElementById('case-search').value = '';

  // Enable accept button
  updateAcceptButton();
}

// Clear selection
function clearSelection() {
  selectedCaseId = null;
  selectedCaseName = null;
  selectedDamageCenter = null;
  document.getElementById('selected-case').style.display = 'none';
  updateAcceptButton();
}

// Update accept button state
function updateAcceptButton() {
  const acceptBtn = document.getElementById('btn-accept');
  const batchBtn = document.getElementById('btn-batch');
  
  if (selectedCaseId) {
    acceptBtn.disabled = false;
    batchBtn.disabled = false;
  } else {
    acceptBtn.disabled = true;
    batchBtn.disabled = true;
  }
}

// Navigate to previous image
function previousImage() {
  if (currentIndex > 0) {
    currentIndex--;
    clearSelection();
    displayCurrentImage();
  }
}

// Accept current image
async function acceptImage() {
  if (!selectedCaseId) {
    showToast('נא לבחור תיק', 'warning');
    return;
  }

  const image = pendingImages[currentIndex];

  try {
    // Update database
    const { error: updateError } = await supabaseClient
      .from('pending_images')
      .update({
        status: 'accepted',
        final_case_id: selectedCaseId,
        final_damage_center: selectedDamageCenter,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', image.id);

    if (updateError) throw updateError;

    // Call Make.com webhook to process
    const webhookResponse = await fetch(WEBHOOK_PROCESS_IMAGE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pending_image_id: image.id,
        final_case_id: selectedCaseId,
        final_damage_center: selectedDamageCenter,
        user_id: currentUser.id
      })
    });

    if (!webhookResponse.ok) {
      throw new Error('Webhook failed');
    }

    showToast('תמונה אושרה בהצלחה', 'success');

    // Remove from array and move to next
    pendingImages.splice(currentIndex, 1);
    clearSelection();

    if (pendingImages.length === 0) {
      showEmptyState();
    } else {
      // Stay at same index (which now shows next image)
      displayCurrentImage();
    }

  } catch (error) {
    console.error('Error accepting image:', error);
    showToast('שגיאה באישור תמונה', 'error');
  }
}

// Deny current image
async function denyImage() {
  const reason = prompt('סיבת דחייה (אופציונלי):');
  
  const image = pendingImages[currentIndex];

  try {
    const { error } = await supabaseClient
      .from('pending_images')
      .update({
        status: 'denied',
        denial_reason: reason || 'לא צוין',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', image.id);

    if (error) throw error;

    showToast('תמונה נדחתה', 'info');

    // Remove and move to next
    pendingImages.splice(currentIndex, 1);
    clearSelection();

    if (pendingImages.length === 0) {
      showEmptyState();
    } else {
      displayCurrentImage();
    }

  } catch (error) {
    console.error('Error denying image:', error);
    showToast('שגיאה בדחיית תמונה', 'error');
  }
}

// Delete current image
async function deleteImage() {
  if (!confirm('למחוק תמונה זו לצמיתות?')) return;

  const image = pendingImages[currentIndex];

  try {
    const { error } = await supabaseClient
      .from('pending_images')
      .update({
        status: 'deleted',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', image.id);

    if (error) throw error;

    showToast('תמונה נמחקה', 'info');

    // Remove and move to next
    pendingImages.splice(currentIndex, 1);
    clearSelection();

    if (pendingImages.length === 0) {
      showEmptyState();
    } else {
      displayCurrentImage();
    }

  } catch (error) {
    console.error('Error deleting image:', error);
    showToast('שגיאה במחיקת תמונה', 'error');
  }
}

// Batch accept all to same case
async function batchAcceptAll() {
  if (!selectedCaseId) {
    showToast('נא לבחור תיק', 'warning');
    return;
  }

  if (!confirm(`לאשר את כל ${pendingImages.length} התמונות לתיק ${selectedCaseName}?`)) {
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const image of pendingImages) {
    try {
      // Update status
      const { error: updateError } = await supabaseClient
        .from('pending_images')
        .update({
          status: 'accepted',
          final_case_id: selectedCaseId,
          final_damage_center: selectedDamageCenter,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', image.id);

      if (updateError) throw updateError;

      // Trigger webhook
      await fetch(WEBHOOK_PROCESS_IMAGE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pending_image_id: image.id,
          final_case_id: selectedCaseId,
          final_damage_center: selectedDamageCenter,
          user_id: currentUser.id
        })
      });

      successCount++;
    } catch (error) {
      console.error(`Failed to process image ${image.id}:`, error);
      failCount++;
    }
  }

  showToast(`אושרו ${successCount} תמונות בהצלחה${failCount > 0 ? `, ${failCount} נכשלו` : ''}`, 'success');

  // Reload
  pendingImages = [];
  currentIndex = 0;
  clearSelection();
  await loadPendingImages();
}

// Expand image to lightbox
function expandImage() {
  const image = pendingImages[currentIndex];
  document.getElementById('lightbox-image').src = image.temp_storage_url;
  document.getElementById('image-lightbox').style.display = 'flex';
}

// Close lightbox
function closeLightbox() {
  document.getElementById('image-lightbox').style.display = 'none';
}

// Real-time subscription for new images
function setupRealtimeSubscription() {
  supabaseClient
    .channel('pending-images-realtime')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'pending_images',
      filter: `assigned_to_user=eq.${currentUser.id}`
    }, (payload) => {
      console.log('New pending image received:', payload);
      
      // Add to array
      pendingImages.push(payload.new);
      
      // Show toast
      showToast(`תמונה חדשה התקבלה מ-${payload.new.source === 'email' ? 'אימייל' : 'WhatsApp'}`, 'info');
      
      // If was empty, refresh display
      if (pendingImages.length === 1) {
        showReviewInterface();
        displayCurrentImage();
      }
    })
    .subscribe();
}
```

---

### File: `js/toast-notifications.js`

```javascript
// Toast Notification System
// Shows temporary notifications at bottom-right

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Icon based on type
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  };
  
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Animate in
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
```

---

### File: `css/pending-images.css`

```css
/* Pending Images Page Styling */

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Rubik', Arial, sans-serif;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

header h1 {
  font-size: 28px;
  color: #1e293b;
}

.btn-back {
  padding: 10px 20px;
  background: #64748b;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.btn-back:hover {
  background: #475569;
}

/* Loading State */
.loading {
  text-align: center;
  padding: 60px 20px;
  font-size: 18px;
  color: #64748b;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-state h2 {
  font-size: 32px;
  color: #10b981;
  margin-bottom: 10px;
}

.empty-state p {
  font-size: 18px;
  color: #64748b;
  margin-bottom: 30px;
}

/* Progress Bar */
.progress-bar {
  background: #e2e8f0;
  height: 40px;
  border-radius: 8px;
  position: relative;
  margin-bottom: 20px;
  overflow: hidden;
}

.progress-fill {
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  height: 100%;
  transition: width 0.3s ease;
}

#progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: bold;
  color: #1e293b;
  z-index: 1;
}

/* Filters */
.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.filter-btn {
  padding: 8px 16px;
  background: #f1f5f9;
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.filter-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #2563eb;
}

/* Image Display */
.image-display {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  margin-bottom: 20px;
  position: relative;
}

.source-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  z-index: 1;
}

.source-whatsapp {
  background: #25d366;
  color: white;
}

.source-email {
  background: #3b82f6;
  color: white;
}

.image-container {
  position: relative;
  text-align: center;
  margin-bottom: 15px;
}

#current-image {
  max-width: 100%;
  max-height: 500px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn-expand {
  position: absolute;
  bottom: 10px;
  left: 10px;
  padding: 8px 12px;
  background: rgba(0,0,0,0.7);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.btn-expand:hover {
  background: rgba(0,0,0,0.9);
}

.image-info {
  text-align: right;
  font-size: 14px;
  color: #64748b;
}

.image-info p {
  margin: 5px 0;
}

/* Case Assignment */
.case-assignment {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.case-assignment h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #1e293b;
}

.notice-box {
  background: #d1fae5;
  border: 2px solid #10b981;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 15px;
  font-size: 14px;
  color: #065f46;
  text-align: center;
}

.search-box {
  position: relative;
  margin-bottom: 10px;
}

#case-search {
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  font-family: inherit;
}

#case-search:focus {
  outline: none;
  border-color: #3b82f6;
}

.case-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.case-item {
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.case-item:hover {
  background: #f8fafc;
}

.case-open {
  background: #ecfdf5;
  border-right: 4px solid #10b981;
}

.case-closed {
  background: #fef3c7;
}

.case-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  background: #e2e8f0;
}

.case-center {
  font-size: 12px;
  color: #64748b;
}

.selected-case {
  background: #eff6ff;
  border: 2px solid #3b82f6;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-clear {
  padding: 4px 12px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.action-buttons button {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete {
  background: #fee2e2;
  color: #991b1b;
}

.btn-delete:hover {
  background: #fecaca;
}

.btn-deny {
  background: #fef3c7;
  color: #92400e;
}

.btn-deny:hover {
  background: #fde68a;
}

.btn-nav {
  background: #f1f5f9;
  color: #475569;
}

.btn-nav:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-nav:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-accept {
  background: #10b981;
  color: white;
}

.btn-accept:hover:not(:disabled) {
  background: #059669;
}

.btn-accept:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

/* Batch Actions */
.batch-actions {
  text-align: center;
  padding: 15px;
  background: #f8fafc;
  border-radius: 8px;
}

.batch-actions p {
  margin: 0 0 10px;
  color: #64748b;
}

.btn-batch {
  padding: 12px 24px;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
}

.btn-batch:hover:not(:disabled) {
  background: #7c3aed;
}

.btn-batch:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

/* Lightbox */
.lightbox {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.9);
  z-index: 1000;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

#lightbox-image {
  max-width: 95%;
  max-height: 95%;
  border-radius: 8px;
}

/* Responsive */
@media (max-width: 768px) {
  .action-buttons {
    flex-wrap: wrap;
  }
  
  .action-buttons button {
    flex-basis: calc(50% - 5px);
  }
}
```

---

### File: `css/toast.css`

```css
/* Toast Notifications */

#toast-container {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  font-size: 14px;
  font-weight: 500;
  opacity: 0;
  transform: translateX(-100%);
  transition: all 0.3s ease;
  min-width: 250px;
  max-width: 400px;
}

.toast.show {
  opacity: 1;
  transform: translateX(0);
}

.toast-icon {
  font-size: 18px;
  font-weight: bold;
}

.toast-success {
  background: #d1fae5;
  color: #065f46;
  border-right: 4px solid #10b981;
}

.toast-error {
  background: #fee2e2;
  color: #991b1b;
  border-right: 4px solid #ef4444;
}

.toast-warning {
  background: #fef3c7;
  color: #92400e;
  border-right: 4px solid #f59e0b;
}

.toast-info {
  background: #dbeafe;
  color: #1e40af;
  border-right: 4px solid #3b82f6;
}
```

---

## INTEGRATION INTO YOUR HOME PAGE

Add this to your existing `index.html` (or wherever your selection page is):

```html
<!-- Add this where you want the pending images alert -->
<div id="pending-images-alert" style="display: none;">
  <div class="alert-box">
    <h3>⚠️ יש לך <span id="pending-count">0</span> תמונות ממתינות לבדיקה</h3>
    <button onclick="window.location.href='pending-images.html'" class="btn-review">
      בדוק תמונות ממתינות
    </button>
    <p class="last-update">עדכון אחרון: <span id="last-update-time">טוען...</span></p>
  </div>
</div>

<!-- Add this script at the bottom -->
<script>
// Check for pending images on page load
async function checkPendingImages() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return;

    const { count, error } = await supabaseClient
      .from('pending_images')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to_user', currentUser.id)
      .eq('status', 'pending');

    if (error) throw error;

    if (count > 0) {
      document.getElementById('pending-images-alert').style.display = 'block';
      document.getElementById('pending-count').textContent = count;
      document.getElementById('last-update-time').textContent = new Date().toLocaleTimeString('he-IL');
    }

    // Real-time updates
    supabaseClient
      .channel('pending-count-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pending_images'
      }, () => {
        checkPendingImages(); // Refresh count
      })
      .subscribe();

  } catch (error) {
    console.error('Error checking pending images:', error);
  }
}

// Run on page load
document.addEventListener('DOMContentLoaded', checkPendingImages);
</script>

<style>
.alert-box {
  background: #fef3c7;
  border: 3px solid #f59e0b;
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  text-align: center;
}

.alert-box h3 {
  color: #92400e;
  margin-top: 0;
}

.btn-review {
  padding: 12px 24px;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
}

.btn-review:hover {
  background: #d97706;
}

.last-update {
  font-size: 12px;
  color: #78350f;
  margin-top: 10px;
}
</style>
```

---

# PART 7: OPERATIONS MANUAL - ADDING NEW ASSESSORS

## Checklist for Onboarding New Assessor

This is the step-by-step process you (as developer/admin) follow each time you add a new assessor to the system.

---

### STEP 1: Create User in Supabase Auth

```sql
-- Option A: Using Supabase Dashboard
-- Go to: Authentication → Users → Add User
-- Fill in:
-- Email: new.assessor@evalix.com
-- Password: [generate strong password]
-- Metadata: {"role": "assessor", "name": "שם המעריך"}

-- Option B: Using SQL (for bulk)
-- Note: Requires admin API call, not direct SQL
```

**Get the new user's UUID:**
```sql
SELECT id, email FROM auth.users WHERE email = 'new.assessor@evalix.com';
-- SAVE THIS UUID - you'll need it multiple times
```

---

### STEP 2: Assign User to Cases (Your Existing System)

```sql
-- Update your cases table to assign assessor
UPDATE cases
SET assessor_id = 'new-user-uuid-here'
WHERE damage_center = 'Center A'; -- or however you assign

-- Or create new damage center assignment
-- (depends on your existing schema)
```

---

### STEP 3: Create OneDrive Folder

**In OneDrive for Business:**

1. Navigate to `/EVALIX-System/`
2. Create new folder: `WhatsApp-[AssessorName]/`
3. Set permissions:
   - Assessor: Can edit
   - Admin (you): Can edit
   - Other assessors: No access

**Folder path to save:** `/EVALIX-System/WhatsApp-Yossi/`

---

### STEP 4: Insert user_onedrive_config Record

```sql
INSERT INTO user_onedrive_config (
  user_id,
  whatsapp_folder_path,
  email_address,
  active
) VALUES (
  'new-user-uuid-here',
  '/EVALIX-System/WhatsApp-Yossi/',
  'yossi@evalix.com',
  true
);
```

---

### STEP 5: Clone Make.com WhatsApp Scenario

**In Make.com:**

1. Go to existing scenario: "Admin - WhatsApp Image Capture"
2. Click "..." → "Clone"
3. Rename: "Yossi - WhatsApp Image Capture"
4. Edit cloned scenario:
   
   **Module 1 (OneDrive Watch):**
   - Change folder to: `/EVALIX-System/WhatsApp-Yossi/`
   
   **Module 6 (Insert pending_images):**
   - Change `assigned_to_user` to new user's UUID
   
   **Module 7 (OneSignal):**
   - Change Player IDs to new user's OneSignal ID
   - (Get from your user database after they log in first time)
   
   **Module 8 (Move File):**
   - Keep same `/Processed/` folder (shared)

5. Save scenario
6. Activate scenario
7. Copy scenario ID from URL
8. Save to database:

```sql
UPDATE user_onedrive_config
SET make_scenario_whatsapp_id = 'scenario-id-here'
WHERE user_id = 'new-user-uuid';
```

---

### STEP 6: Clone Make.com Email Scenario

**In Make.com:**

1. Clone "Admin - Email Image Capture"
2. Rename: "Yossi - Email Image Capture"
3. Edit cloned scenario:
   
   **Module 1 (Email Watch):**
   - Connect to yossi@evalix.com mailbox
   - Or if using shared mailbox, filter by recipient
   
   **Module 9 (Insert pending_images):**
   - Change `assigned_to_user` to new user's UUID
   
   **Module 10 (OneSignal):**
   - Change to new user's Player ID

4. Save and activate
5. Save scenario ID:

```sql
UPDATE user_onedrive_config
SET make_scenario_email_id = 'scenario-id-here'
WHERE user_id = 'new-user-uuid';
```

---

### STEP 7: Configure Assessor's Phone

**Send these instructions to the new assessor:**

**For iPhone:**
```
1. התקן אפליקציית OneDrive מה-App Store
2. התחבר עם חשבון העבודה שלך
3. הגדרות → Camera Upload
4. בחר תיקייה: EVALIX-System/WhatsApp-[שמך]/
5. הפעל "Upload via WiFi and Cellular"
6. סגור "Include Videos"

כעת כל תמונה שתקבל ב-WhatsApp תעלה אוטומטית למערכת!
```

**For Android:**
```
1. התקן OneDrive מ-Play Store
2. התחבר
3. הגדרות → Camera backup
4. בחר תיקייה: EVALIX-System/WhatsApp-[שמך]/
5. הפעל "Upload using: WiFi and Mobile data"
6. בחר "Photos only"

התמונות שלך יעלו אוטומטית!
```

---

### STEP 8: Configure WhatsApp Settings

**Assessor should:**
```
WhatsApp → הגדרות → צ'אטים → שמור למצלמה: הפעל

זה גורם לתמונות מ-WhatsApp להישמר אוטומטית בגלריה,
ומשם OneDrive מעלה אוטומטית.
```

---

### STEP 9: Test End-to-End

**As developer:**

1. **Test WhatsApp flow:**
   - Upload test image to assessor's OneDrive folder manually
   - Wait 5 minutes (or run scenario manually)
   - Check Supabase: `SELECT * FROM pending_images WHERE assigned_to_user = 'user-uuid'`
   - Verify record created

2. **Test Email flow:**
   - Send test email with attachment to assessor's email
   - Wait 10 minutes
   - Check pending_images table
   - Verify plate number extracted (if in subject)

3. **Test Frontend:**
   - Log in as new assessor
   - Navigate to `pending-images.html`
   - Should see test images
   - Test Accept flow

4. **Test Processing:**
   - Accept an image
   - Check that webhook was called
   - Verify image appears in `images` table
   - Verify OneDrive backup created
   - Verify Cloudinary URL exists

---

### STEP 10: Document in System

```sql
-- Add note to user record
UPDATE user_onedrive_config
SET 
  active = true,
  updated_at = NOW()
WHERE user_id = 'user-uuid';

-- Log onboarding
INSERT INTO image_processing_log (
  stage,
  status,
  details
) VALUES (
  'user_onboarding',
  'success',
  jsonb_build_object(
    'user_email', 'yossi@evalix.com',
    'onboarded_by', 'admin',
    'date', NOW()
  )
);
```

---

## TOTAL TIME PER USER: ~30 minutes

**Breakdown:**
- Create Supabase user: 2 min
- OneDrive folder setup: 3 min
- Clone 2 Make scenarios: 10 min
- Configure phone (assessor does): 5 min
- End-to-end testing: 10 min

---

## PRICING CONSIDERATION

Since you mentioned monthly subscription + per-user pricing:

**Cost Structure Suggestion:**
```
Base subscription: $99/month
- Includes 1 admin user
- Unlimited cases
- All features

Additional assessor: $29/month per user
- Includes full automation setup
- Onboarding support
- Dedicated storage

Developer setup fee: $150 one-time
- When you onboard new client
- Covers Make.com scenario creation
- OneDrive configuration
```

**Your time breakdown:**
- Initial client setup: 2 hours
- Per assessor: 30 minutes
- Monthly maintenance: Minimal (automated)

---

# PART 8: TROUBLESHOOTING GUIDE

## Common Issues & Solutions

### Issue: Images not appearing in pending_images

**Check:**
```sql
-- Check if Make.com created any records
SELECT * FROM pending_images ORDER BY received_at DESC LIMIT 10;

-- Check processing log
SELECT * FROM image_processing_log ORDER BY timestamp DESC LIMIT 20;
```

**Solutions:**
- Verify Make.com scenario is active
- Check OneDrive folder path is exact
- Verify Supabase service key in Make.com
- Check Make.com execution history for errors

---

### Issue: Auto-match not working (email)

**Check:**
```sql
-- See what was extracted
SELECT suggested_plate_number, auto_match_confidence
FROM pending_images
WHERE source = 'email'
ORDER BY received_at DESC;
```

**Solutions:**
- Verify regex pattern matches your plate format
- Check if cases table has matching plates
- Verify case_status values are correct

---

### Issue: Webhook not processing accepted images

**Check:**
- Make.com webhook scenario execution history
- Verify webhook URL is correct in frontend
- Check CORS settings if getting errors
- Verify Supabase can reach Make.com (network)

**Test webhook manually:**
```bash
curl -X POST YOUR-WEBHOOK-URL \
-H "Content-Type: application/json" \
-d '{"pending_image_id":"test","final_case_id":"test","user_id":"test"}'
```

---

### Issue: Phone not auto-syncing to OneDrive

**Solutions:**
- Check OneDrive app is logged in
- Verify camera upload is enabled
- Check WiFi/data connection
- Check storage space on OneDrive
- Try manual upload to test folder permissions

---

### Issue: RLS blocking queries

```sql
-- Check current user policies
SELECT * FROM pg_policies WHERE tablename = 'pending_images';

-- Test as specific user
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid-here';
SELECT * FROM pending_images;
RESET ROLE;
```

---

# PART 9: MONITORING & ANALYTICS

## Dashboard Queries (For Admin)

### Pending Images Overview

```sql
-- Count by user and source
SELECT 
  u.email,
  pi.source,
  COUNT(*) as pending_count
FROM pending_images pi
JOIN auth.users u ON u.id = pi.assigned_to_user
WHERE pi.status = 'pending'
GROUP BY u.email, pi.source
ORDER BY pending_count DESC;
```

### Processing Performance

```sql
-- Average time from receipt to processing
SELECT 
  source,
  AVG(EXTRACT(EPOCH FROM (processed_at - received_at))/60) as avg_minutes
FROM pending_images
WHERE status = 'processed'
  AND processed_at IS NOT NULL
GROUP BY source;
```

### Auto-Match Accuracy

```sql
-- Email auto-match performance
SELECT 
  auto_match_confidence,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'accepted' AND final_case_id = suggested_case_id THEN 1 ELSE 0 END) as matched_correctly
FROM pending_images
WHERE source = 'email'
  AND suggested_case_id IS NOT NULL
GROUP BY auto_match_confidence;
```

### Denial Reasons

```sql
-- Most common denial reasons
SELECT 
  denial_reason,
  COUNT(*) as count
FROM pending_images
WHERE status = 'denied'
GROUP BY denial_reason
ORDER BY count DESC;
```

---

# FINAL CHECKLIST - PRODUCTION READINESS

```
DATABASE
□ All tables created
□ RLS policies working
□ Indexes created
□ Test data inserted and queried successfully

STORAGE
□ pending-images bucket created
□ damage-images bucket exists
□ Storage policies set
□ Test upload successful

MAKE.COM
□ WhatsApp scenario tested
□ Email scenario tested
□ Processing webhook tested
□ Error handlers configured
□ Scenarios activated

ONEDRIVE
□ Folder structure created
□ Permissions set
□ Test file sync working

FRONTEND
□ pending-images.html deployed
□ Supabase client configured
□ Real-time subscriptions working
□ Toast notifications working
□ Home page alert integrated

ONESIGNAL
□ App configured
□ Player IDs stored
□ Test notification sent

TESTING
□ End-to-end WhatsApp flow
□ End-to-end Email flow
□ Accept/Deny/Delete actions
□ Batch operations
□ Multi-user isolation (RLS)

DOCUMENTATION
□ Operations manual ready
□ User training materials
□ Troubleshooting guide
```

---

# SUPPORT & NEXT STEPS

Once you provide:
1. Your existing code (upload-images.html, Supabase init)
2. Confirmation of Cloudinary vs Supabase Storage
3. Your user auth structure

I will deliver:
- Exact code matching your framework
- Ready-to-deploy HTML/JS files
- CSS matching your design
- Make.com scenario JSON exports (importable)
- Complete operations manual PDF

**Estimated deployment time:** 1 week for full system with 1 admin user

---

END OF IMPLEMENTATION GUIDE
