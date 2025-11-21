# Make.com Webhook Update Guide - Pictures Module

**Date:** 2025-11-21
**Architecture:** Simplified Final - Single Upload, Integrated Flow

---

## Overview

**Old Architecture:**
- User clicks upload → Make.com processes → 50+ seconds wait
- Complex OneDrive folder structure
- Cloudinary storage uploads

**New Architecture:**
- User clicks upload → Supabase (3 sec) → User done! ✅
- Background: OneDrive backup (15 sec) → AI recognition (25 sec)
- Simple OneDrive folders: מקוריות, מעובדות, PDF

---

## Webhook 1: UPLOAD_PICTURES (OneDrive Original Backup)

### Purpose
Back up original images to OneDrive מקוריות folder with original filenames.

### Current Flow
```
1. Receive files
2. Upload to OneDrive (complex folder structure)
3. Upload to Cloudinary storage ❌ REMOVE THIS
4. Update Supabase
```

### New Flow
```
1. Receive webhook trigger from frontend
2. Download image from Supabase (24-hour signed URL)
3. Upload to OneDrive: /{plate}_תמונות/מקוריות/{original_filename}
4. Update Supabase via RPC
```

---

### Module-by-Module Changes

#### Module 1: Webhook Trigger (NO CHANGE)
- Trigger: HTTP Webhook
- Input fields:
  - `image_id` (UUID)
  - `supabase_url` (signed URL, 24 hours)
  - `case_id` (UUID)
  - `plate` (string)
  - `action` = "backup_to_onedrive"

#### Module 2: HTTP - Download from Supabase (NEW)
**Add this module:**
- **Tool:** HTTP - Get a File
- **URL:** `{{1.supabase_url}}`
- **Method:** GET
- **Output:** Image data

#### Module 3: OneDrive Upload (MODIFIED)
**Change settings:**
- **Folder Path:** `/{plate}_תמונות/מקוריות/`
  - Example: `/12-345-67_תמונות/מקוריות/`
- **Filename:** `{{original_filename}}` (from webhook input)
  - Example: `IMG_1234.jpg`
  - ⚠️ NO RENAME - keep original filename
- **File Data:** `{{2.data}}` (from HTTP module)

**Old vs New:**
```diff
- Folder: /{plate}_תמונות_מקוריות_שלא_עובדו/
+ Folder: /{plate}_תמונות/מקוריות/

- Filename: original_{{image_id}}.jpg
+ Filename: {{original_filename}}
```

#### Module 4: Cloudinary Upload (REMOVE)
**Action:** ❌ Delete this entire module
**Reason:** We use Cloudinary fetch URLs (no storage uploads)

#### Module 5: Supabase RPC (MODIFIED)
**Update settings:**
- **Function Name:** `update_backup_status`
- **Method:** POST
- **URL:** `https://[YOUR_PROJECT].supabase.co/rest/v1/rpc/update_backup_status`
- **Headers:**
  - `apikey`: Your Supabase anon key
  - `Authorization`: Bearer [Your Supabase anon key]
  - `Content-Type`: application/json
- **Body:**
  ```json
  {
    "p_image_id": "{{1.image_id}}",
    "p_onedrive_path": "{{3.webUrl}}",
    "p_backup_status": "backed_up"
  }
  ```

**Old vs New:**
```diff
{
  "p_image_id": "{{1.image_id}}",
  "p_onedrive_path": "{{3.webUrl}}",
  "p_backup_status": "backed_up"
+ // No AI params here - they come from TRANSFORM webhook
}
```

---

### Expected Result

**Input:**
```json
{
  "image_id": "uuid-abc-123",
  "supabase_url": "https://xxx.supabase.co/.../IMG_1234.jpg?token=...",
  "case_id": "uuid-case-456",
  "plate": "12-345-67",
  "action": "backup_to_onedrive"
}
```

**OneDrive Output:**
```
File: /12-345-67_תמונות/מקוריות/IMG_1234.jpg
```

**Database Update:**
```sql
UPDATE images SET
  onedrive_path = 'https://onedrive.live.com/...',
  backup_status = 'backed_up'
WHERE id = 'uuid-abc-123';
```

---

## Webhook 2: TRANSFORM_PICTURES (AI Recognition + Smart Naming)

### Purpose
Analyze image with ChatGPT, upload to OneDrive מעובדות folder with AI-generated filename.

### Current Flow
```
1. Manual trigger
2. Download from OneDrive
3. Transform with Cloudinary
4. Save back to OneDrive
```

### New Flow
```
1. Auto-trigger after UPLOAD_PICTURES (or manual)
2. Download image from Supabase
3. ChatGPT Vision: Analyze damage + part
4. Parse AI response
5. Upload to OneDrive: /{plate}_תמונות/מעובדות/{plate}_{damage}_{part}.jpg
6. Update Supabase with AI data
```

---

### Module-by-Module Setup

#### Module 1: Webhook Trigger (SAME AS UPLOAD_PICTURES)
- Trigger: HTTP Webhook
- Input fields:
  - `image_id` (UUID)
  - `supabase_url` (signed URL, 24 hours)
  - `case_id` (UUID)
  - `plate` (string)

#### Module 2: HTTP - Download from Supabase (NEW)
**Add this module:**
- **Tool:** HTTP - Get a File
- **URL:** `{{1.supabase_url}}`
- **Method:** GET
- **Output:** Image data

#### Module 3: OpenAI - ChatGPT Vision (NEW)
**Add this module:**
- **Tool:** OpenAI - Create a Completion (Vision)
- **Model:** `gpt-4o` (or `gpt-4-vision-preview`)
- **Image Input:** `{{2.data}}` (from HTTP module)
- **Prompt:**
  ```
  Analyze this car damage image and provide:
  1. Damage type: scratch, dent, broken, crack, missing, rust
  2. Car part: front_bumper, rear_bumper, hood, door, fender, mirror, windshield

  Return ONLY in this exact format:
  damage: {damage_type}
  part: {part_name}

  Use lowercase and underscores. Examples:
  damage: deep_scratch
  part: front_bumper

  damage: large_dent
  part: driver_door
  ```
- **Max Tokens:** 50
- **Temperature:** 0.3 (lower = more consistent)

**Expected Output:**
```
damage: deep_scratch
part: front_bumper
```

#### Module 4: Text Parser (NEW)
**Add this module:**
- **Tool:** Text Parser - Match Pattern
- **Pattern:** `damage:\s*(\w+)\s*\n\s*part:\s*(\w+)`
- **Text:** `{{3.choices[0].message.content}}`
- **Flags:** Multiline

**Set Variables:**
```javascript
damage = {{4.matches[0][1]}} || "unknown"
part = {{4.matches[0][2]}} || "unidentified"
```

**Output:**
- `damage` = "deep_scratch"
- `part` = "front_bumper"

#### Module 5: OneDrive Upload (NEW)
**Add this module:**
- **Tool:** OneDrive - Upload a File
- **Folder Path:** `/{plate}_תמונות/מעובדות/`
  - Example: `/12-345-67_תמונות/מעובדות/`
- **Filename:** `{{1.plate}}_{{damage}}_{{part}}.jpg`
  - Example: `12-345-67_deep_scratch_front_bumper.jpg`
- **File Data:** `{{2.data}}` (from HTTP module)

**Smart Filename Format:**
```
{plate}_{damage}_{part}.jpg

Examples:
- 12-345-67_deep_scratch_front_bumper.jpg
- 12-345-67_large_dent_driver_door.jpg
- 12-345-67_broken_side_mirror.jpg
```

#### Module 6: Supabase RPC (NEW)
**Add this module:**
- **Function Name:** `update_backup_status` (same function, different params)
- **Method:** POST
- **URL:** `https://[YOUR_PROJECT].supabase.co/rest/v1/rpc/update_backup_status`
- **Headers:**
  - `apikey`: Your Supabase anon key
  - `Authorization`: Bearer [Your Supabase anon key]
  - `Content-Type`: application/json
- **Body:**
  ```json
  {
    "p_image_id": "{{1.image_id}}",
    "p_onedrive_path": "{{5.webUrl}}",
    "p_backup_status": "backed_up",
    "p_recognized_damage": "{{damage}}",
    "p_recognized_part": "{{part}}",
    "p_recognition_confidence": 0.9
  }
  ```

**Note:** The same RPC function handles both original backup AND AI data (uses COALESCE in SQL).

---

### Expected Result

**Input:**
```json
{
  "image_id": "uuid-abc-123",
  "supabase_url": "https://xxx.supabase.co/.../IMG_1234.jpg?token=...",
  "case_id": "uuid-case-456",
  "plate": "12-345-67"
}
```

**ChatGPT Output:**
```
damage: deep_scratch
part: front_bumper
```

**OneDrive Output:**
```
File: /12-345-67_תמונות/מעובדות/12-345-67_deep_scratch_front_bumper.jpg
```

**Database Update:**
```sql
UPDATE images SET
  onedrive_transformed_path = 'https://onedrive.live.com/...',
  recognized_damage = 'deep_scratch',
  recognized_part = 'front_bumper',
  recognition_confidence = 0.9,
  recognition_status = 'recognized'
WHERE id = 'uuid-abc-123';
```

---

## Testing Both Webhooks

### Test 1: Upload Image via Frontend

1. Open `upload-images.html`
2. Upload 1 image (damaged bumper)
3. Check console for:
   ```
   ✅ Uploaded and transformed 1/1: IMG_1234.jpg
   🔄 Triggered OneDrive backup for 1 images
   ```

### Test 2: Check Database After 3 Seconds

```sql
SELECT
  filename,
  original_url,
  transformed_url,
  optimization_status,
  recognition_status,
  backup_status
FROM images
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:**
- `filename` = "IMG_1234.jpg"
- `original_url` = Supabase URL
- `transformed_url` = Cloudinary fetch URL
- `optimization_status` = 'optimized'
- `recognition_status` = 'pending' ⏳
- `backup_status` = 'pending' ⏳

### Test 3: Check Database After 15 Seconds (UPLOAD_PICTURES Done)

```sql
SELECT
  filename,
  onedrive_path,
  backup_status
FROM images
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:**
- `onedrive_path` = OneDrive URL (מקוריות folder)
- `backup_status` = 'backed_up' ✅

### Test 4: Check OneDrive מקוריות Folder

**Path:** `/12-345-67_תמונות/מקוריות/`
**File:** `IMG_1234.jpg` (original filename)

### Test 5: Check Database After 30 Seconds (TRANSFORM_PICTURES Done)

```sql
SELECT
  filename,
  recognized_damage,
  recognized_part,
  recognition_status,
  recognition_confidence,
  onedrive_transformed_path
FROM images
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:**
- `recognized_damage` = 'deep_scratch'
- `recognized_part` = 'front_bumper'
- `recognition_status` = 'recognized' ✅
- `recognition_confidence` = 0.9
- `onedrive_transformed_path` = OneDrive URL (מעובדות folder)

### Test 6: Check OneDrive מעובדות Folder

**Path:** `/12-345-67_תמונות/מעובדות/`
**File:** `12-345-67_deep_scratch_front_bumper.jpg` (AI smart name)

---

## Triggering TRANSFORM_PICTURES

**Option 1: Auto-Trigger (Recommended)**
- Add a webhook call from UPLOAD_PICTURES Module 5 (after Supabase RPC)
- Call TRANSFORM_PICTURES webhook with same data
- Benefits: Fully automatic, no user action needed

**Option 2: Manual Trigger**
- Keep as separate webhook
- User clicks "עוד אפשרויות" → "עיבוד תמונות" in UI
- Benefits: User control, lower API costs

**Recommendation:** Start with Option 2 (manual), then add Option 1 (auto) later.

---

## Common Issues & Solutions

### Issue 1: ChatGPT Returns Wrong Format

**Symptom:** Text parser fails, `damage` and `part` are empty

**Solution:**
- Check ChatGPT output in Make.com history
- Adjust prompt to be more specific
- Add example images to ChatGPT prompt

### Issue 2: OneDrive Folder Not Found

**Symptom:** OneDrive module fails with "folder not found"

**Solution:**
- Create folder structure manually first:
  ```
  /12-345-67_תמונות/
    ├── מקוריות/
    ├── מעובדות/
    └── PDF/
  ```
- OR: Add "Create folder if not exists" option in OneDrive module

### Issue 3: Supabase RPC Fails

**Symptom:** Database not updated, webhook shows 404 or 401

**Solution:**
- Verify SQL migrations 07 and 08 were executed
- Check Supabase URL in webhook settings
- Verify apikey in headers
- Test RPC function in Supabase SQL Editor:
  ```sql
  SELECT update_backup_status(
    'test-uuid',
    'test-path',
    'backed_up',
    'deep_scratch',
    'front_bumper',
    0.9
  );
  ```

---

## Summary of Changes

| Webhook | Old | New | Change Type |
|---------|-----|-----|-------------|
| UPLOAD_PICTURES | Upload to OneDrive + Cloudinary | Upload to OneDrive מקוריות only | Remove Cloudinary |
| UPLOAD_PICTURES | Complex folder structure | Simple: `/{plate}_תמונות/מקוריות/` | Simplify path |
| UPLOAD_PICTURES | Renamed files | Original filename | Keep original |
| TRANSFORM_PICTURES | Manual only | Auto or manual | Add auto-trigger |
| TRANSFORM_PICTURES | No AI recognition | ChatGPT Vision analysis | Add AI module |
| TRANSFORM_PICTURES | Generic filenames | `{plate}_{damage}_{part}.jpg` | Smart naming |

---

**Total Implementation Time:** ~45 minutes
**Testing Time:** ~10 minutes
**Total:** ~1 hour

**Ready to implement!** 🚀
