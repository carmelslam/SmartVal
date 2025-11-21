# Make.com PROCESS_IMAGE Webhook - Setup Guide

**Date:** 2025-11-21
**Status:** 📋 Ready for Implementation
**Purpose:** Async image processing for Cloudinary optimization and OneDrive backup

---

## Overview

The `PROCESS_IMAGE` webhook is a new Make.com scenario that processes images **after** they've been uploaded to Supabase. This webhook runs asynchronously and doesn't block the user's upload experience.

### New Flow (Supabase-First)

```
User uploads image
    ↓
[IMMEDIATE] Upload to Supabase Storage ✅
    ↓
[IMMEDIATE] Create database records ✅
    ↓
[IMMEDIATE] Show success to user ✅
    ↓
[ASYNC, NON-BLOCKING] Trigger PROCESS_IMAGE webhook
    ↓
Make.com processes in background:
  1. Download from Supabase
  2. Upload to Cloudinary (watermark + optimize)
  3. Upload to OneDrive (backup)
  4. Update database with URLs
```

---

## Webhook Configuration

### 1. Create New Webhook in Make.com

**Scenario Name:** `PROCESS_IMAGE - Supabase Image Processing`

**Webhook URL:** `https://hook.eu2.make.com/[YOUR-WEBHOOK-ID]`

**Trigger:** Custom Webhook

---

## 2. Webhook Input Parameters

The webhook receives the following FormData fields:

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `image_id` | UUID | ✅ Yes | Image record ID from database | `"123e4567-e89b-12d3-a456-426614174000"` |
| `supabase_url` | URL | ✅ Yes | Signed URL (24hr expiry) | `"https://xxx.supabase.co/storage/v1/object/sign/originals/..."` |
| `case_id` | UUID | ✅ Yes | Case ID for folder structure | `"abc123-..."` |
| `category` | String | ✅ Yes | Image category | `"damage"`, `"general"`, `"parts"` |
| `optimize_images` | Boolean | ⚠️ Optional | Enable Cloudinary optimization | `true` |
| `add_watermark` | Boolean | ⚠️ Optional | Add watermark overlay | `true` |

---

## 3. Make.com Scenario Steps

### Step 1: Webhook Trigger
**Module:** Custom Webhook
**Configuration:**
- Data structure: Create from sample (see below)
- Method: POST
- Headers: Default

**Sample Data Structure:**
```json
{
  "image_id": "123e4567-e89b-12d3-a456-426614174000",
  "supabase_url": "https://xxx.supabase.co/storage/v1/object/sign/originals/cases/ABC123/image.jpg?token=xxx",
  "case_id": "abc123-def456",
  "category": "damage",
  "optimize_images": "true",
  "add_watermark": "true"
}
```

---

### Step 2: Download Image from Supabase
**Module:** HTTP - Get a File
**Configuration:**
- URL: `{{1.supabase_url}}` (from webhook)
- Method: GET
- Parse response: No (download as binary)

**Output:** Image file binary data

---

### Step 3: Upload to Cloudinary
**Module:** Cloudinary - Upload an Asset
**Configuration:**
- File: `{{2.data}}` (from HTTP Get)
- Public ID: `EVALIX/Cases/{{1.case_id}}/{{1.category}}/{{1.image_id}}`
- Folder: `EVALIX/Cases/{{1.case_id}}`
- Resource Type: `image`
- Overwrite: `true`

**Transformations (if optimize_images = true):**
```javascript
{
  "transformation": [
    {
      "quality": "auto:good",
      "fetch_format": "auto"
    }
  ]
}
```

**Watermark (if add_watermark = true):**
```javascript
{
  "transformation": [
    {
      "overlay": "evalix_watermark",
      "gravity": "south_east",
      "opacity": 60,
      "width": 150
    }
  ]
}
```

**Output:**
- `secure_url`: Cloudinary URL for the image
- `public_id`: Cloudinary public ID

---

### Step 4: Upload to OneDrive (Backup)
**Module:** OneDrive - Upload a File
**Configuration:**
- File: `{{2.data}}` (from HTTP Get)
- Folder Path: `/EVALIX/Cases/{{1.case_id}}/Images`
- File Name: `{{1.image_id}}_{{1.category}}.jpg`
- Overwrite: `true`

**Output:**
- `webUrl`: OneDrive file path

---

### Step 5: Update Supabase Database
**Module:** HTTP - Make a Request
**Configuration:**
- URL: `https://[YOUR-PROJECT].supabase.co/rest/v1/rpc/update_optimization_status`
- Method: POST
- Headers:
  - `apikey`: `[YOUR-SUPABASE-ANON-KEY]`
  - `Authorization`: `Bearer [YOUR-SUPABASE-ANON-KEY]`
  - `Content-Type`: `application/json`
  - `Prefer`: `return=minimal`

**Body (JSON):**
```json
{
  "p_image_id": "{{1.image_id}}",
  "p_status": "optimized",
  "p_cloudinary_url": "{{3.secure_url}}",
  "p_onedrive_path": "{{4.webUrl}}"
}
```

**Expected Response:**
- Status: 200 or 204 (success)

---

### Step 6: Error Handling (Optional)
**Module:** Tools - Set Variable
**Configuration:**
- Variable Name: `processing_status`
- Value: `optimized` (if all steps succeed) or `failed` (if error occurs)

**Error Handler:**
If any step fails, update the database with status = 'failed':
```json
{
  "p_image_id": "{{1.image_id}}",
  "p_status": "failed",
  "p_cloudinary_url": null,
  "p_onedrive_path": null
}
```

---

## 4. Add Webhook to webhook.js

Update `/webhook.js` to include the new webhook URL:

```javascript
const WEBHOOKS = {
  // ... existing webhooks
  PROCESS_IMAGE: 'https://hook.eu2.make.com/[YOUR-WEBHOOK-ID]'
};
```

---

## 5. Testing the Webhook

### Test Payload (Postman/cURL)

```bash
curl -X POST https://hook.eu2.make.com/[YOUR-WEBHOOK-ID] \
  -F "image_id=123e4567-e89b-12d3-a456-426614174000" \
  -F "supabase_url=https://xxx.supabase.co/storage/v1/object/sign/originals/test.jpg?token=xxx" \
  -F "case_id=test-case-123" \
  -F "category=damage" \
  -F "optimize_images=true" \
  -F "add_watermark=true"
```

### Expected Results

1. ✅ Make.com scenario executes successfully
2. ✅ Image appears in Cloudinary under `EVALIX/Cases/test-case-123/`
3. ✅ Image appears in OneDrive under `/EVALIX/Cases/test-case-123/Images/`
4. ✅ Database record updated with cloudinary_url and onedrive_path
5. ✅ optimization_status = 'optimized'

### Verify in Database

```sql
SELECT
  id,
  filename,
  original_url,
  cloudinary_url,
  onedrive_path,
  optimization_status,
  updated_at
FROM images
WHERE id = '123e4567-e89b-12d3-a456-426614174000';
```

Expected Result:
- `cloudinary_url`: `https://res.cloudinary.com/evalix/image/upload/...`
- `onedrive_path`: `https://onedrive.live.com/...`
- `optimization_status`: `optimized`

---

## 6. Monitoring & Debugging

### Check Pending Optimizations

Use the `get_pending_optimizations` function to find images waiting for processing:

```sql
SELECT * FROM get_pending_optimizations(50);
```

Returns images with:
- `optimization_status = 'pending'`
- Age in minutes
- Oldest first

### Manual Retry Failed Optimizations

```javascript
// Get failed optimizations
const { data: failedImages } = await supabase
  .from('images')
  .select('id, case_id, category, documents(*)')
  .eq('optimization_status', 'failed')
  .limit(10);

// Re-trigger processing
for (const img of failedImages) {
  await window.imageUploadManager.sendImageToMakeCom(img.id);
}
```

### Make.com Scenario Logs

Check Make.com execution history for:
- Failed executions
- Error messages
- Execution duration (should be <30 seconds)

---

## 7. Performance Expectations

| Metric | Expected Value |
|--------|----------------|
| Webhook Response Time | < 500ms (fire-and-forget) |
| Total Processing Time | 10-30 seconds |
| Cloudinary Upload | 3-10 seconds |
| OneDrive Upload | 5-15 seconds |
| Database Update | < 1 second |
| Success Rate | > 95% |

---

## 8. Error Scenarios & Handling

### Scenario 1: Signed URL Expired
**Problem:** Supabase signed URL expired before Make.com processed
**Solution:** Increase signed URL expiry to 24 hours (86400 seconds)
**Status in DB:** `failed`

### Scenario 2: Cloudinary Upload Failed
**Problem:** Cloudinary quota exceeded or network error
**Solution:** Retry with exponential backoff (Make.com retry settings)
**Status in DB:** `processing` or `failed`

### Scenario 3: OneDrive Upload Failed
**Problem:** OneDrive folder doesn't exist or permission denied
**Solution:** Create folder structure in Make.com scenario
**Status in DB:** `optimized` (Cloudinary succeeded, OneDrive optional)

### Scenario 4: Database Update Failed
**Problem:** RLS policy blocked update or network error
**Solution:** Use service role key instead of anon key
**Status in DB:** Remains `pending` (manual intervention needed)

---

## 9. Migration from Old Webhook

### Old Webhook: `UPLOAD_PICTURES`
- **Keep for backward compatibility** (other systems may still use it)
- Handles FormData with actual files
- Blocks user until complete

### New Webhook: `PROCESS_IMAGE`
- Receives metadata only (image_id + signed URL)
- Non-blocking (async)
- Faster user experience

### Coexistence Strategy
Both webhooks can run in parallel during migration:
- New uploads use `PROCESS_IMAGE` (Supabase-first)
- Legacy systems use `UPLOAD_PICTURES` (Make.com-first)
- Gradual migration over 2-3 months

---

## 10. Rollback Plan

If issues occur with new webhook:

1. **Disable async processing** in upload-images.html:
   ```javascript
   // Comment out this line in uploadImages()
   // this.triggerCloudinaryProcessing(uploadedImages);
   ```

2. **Old webhook still works** - no changes needed

3. **Images already in Supabase** - can be processed manually:
   ```sql
   SELECT * FROM get_pending_optimizations(100);
   -- Manually trigger PROCESS_IMAGE webhook for each
   ```

---

## 11. Success Criteria

- ✅ Webhook responds in < 500ms
- ✅ Images processed within 30 seconds
- ✅ 95%+ success rate
- ✅ Database updated correctly
- ✅ User doesn't notice async processing
- ✅ Failed images can be retried

---

## 12. Next Steps

1. Create webhook in Make.com
2. Add webhook URL to webhook.js
3. Test with single image
4. Test with 5 images (concurrent)
5. Test error scenarios (expired URL, quota exceeded)
6. Monitor for 24 hours
7. Gradually increase traffic

---

**Status:** 📋 Ready for Implementation
**Created:** 2025-11-21
**Phase:** 1A - JavaScript Implementation
**Next:** End-to-end testing

