# Make.com Batch Upload - Array Iteration Guide

**Date:** 2025-11-21
**Architecture:** Single-stage batch upload with array iteration

---

## What Changed

### ❌ Old Approach (One at a Time):
```javascript
// Frontend sent 3 separate webhook calls for 3 images
for (image of images) {
  sendToMakeCom(image); // 3 webhook calls
}
```

### ✅ New Approach (All at Once):
```javascript
// Frontend sends 1 webhook call with array of 3 images
sendToMakeCom({
  images: [image1, image2, image3], // 1 webhook call
  batch_upload: true,
  total_count: 3
});
```

---

## JSON Structure Received by Make.com

**Example payload for 3 uploaded images:**

```json
{
  "batch_upload": true,
  "total_count": 3,
  "images": [
    {
      "image_id": "uuid-abc-123",
      "filename": "IMG_1234.jpg",
      "original_url": "https://nvqrptokmwdhvpiufrad.supabase.co/storage/v1/object/sign/originals/case-xxx/damage/IMG_1234.jpg?token=...",
      "transformed_url": "https://res.cloudinary.com/dwl9x9acl/image/fetch/c_pad,w_850.../https%3A%2F%2Fnvqrptokmwdhvpiufrad.supabase.co%2F...",
      "category": "damage",
      "case_id": "uuid-case-456",
      "plate": "22-184-00"
    },
    {
      "image_id": "uuid-def-456",
      "filename": "IMG_1235.jpg",
      "original_url": "https://...",
      "transformed_url": "https://res.cloudinary.com/...",
      "category": "damage",
      "case_id": "uuid-case-456",
      "plate": "22-184-00"
    },
    {
      "image_id": "uuid-ghi-789",
      "filename": "IMG_1236.jpg",
      "original_url": "https://...",
      "transformed_url": "https://res.cloudinary.com/...",
      "category": "damage",
      "case_id": "uuid-case-456",
      "plate": "22-184-00"
    }
  ]
}
```

---

## Make.com Webhook Setup

### Module 1: Webhook Trigger (JSON)

**Type:** Webhooks → Custom webhook
**Data Structure:** JSON

**Example received data:**
- `batch_upload` = true
- `total_count` = 3
- `images` = [array of 3 objects]

---

### Module 2: Iterator

**CRITICAL:** Add an Iterator module to process each image in the array

**Tool:** Flow Control → Iterator
**Array:** `{{1.images}}` (the array from webhook)

**What this does:**
- Receives array of 3 images
- Runs the following modules 3 times (once per image)
- Each iteration gets one image object

**Variables available in each iteration:**
- `{{2.image_id}}` = "uuid-abc-123"
- `{{2.filename}}` = "IMG_1234.jpg"
- `{{2.original_url}}` = "https://..."
- `{{2.transformed_url}}` = "https://..."
- `{{2.category}}` = "damage"
- `{{2.plate}}` = "22-184-00"

---

### Module 3: HTTP - Download Original Image

**Tool:** HTTP → Get a file
**URL:** `{{2.original_url}}`
**Method:** GET

**Output:** `{{3.data}}` (binary image data)

---

### Module 4: OneDrive - Upload Original

**Tool:** OneDrive → Upload a file
**Folder Path:** `/{plate}_תמונות/מקוריות/`
  - Use: `/{{2.plate}}_תמונות/מקוריות/`
  - Example: `/22-184-00_תמונות/מקוריות/`

**Filename:** `{{2.filename}}`
  - Example: `IMG_1234.jpg`

**File Data:** `{{3.data}}`

**Output:** `{{4.webUrl}}` (OneDrive URL)

---

### Module 5: HTTP - Download Transformed Image

**Tool:** HTTP → Get a file
**URL:** `{{2.transformed_url}}`
**Method:** GET

**Output:** `{{5.data}}` (binary image data with watermarks)

---

### Module 6: OneDrive - Upload Transformed

**Tool:** OneDrive → Upload a file
**Folder Path:** `/{plate}_תמונות/מעובדות/`
  - Use: `/{{2.plate}}_תמונות/מעובדות/`
  - Example: `/22-184-00_תמונות/מעובדות/`

**Filename:** `{{2.filename}}`
  - Example: `IMG_1234.jpg`

**File Data:** `{{5.data}}`

**Output:** `{{6.webUrl}}` (OneDrive URL)

---

### Module 7: Supabase RPC (Update Database)

**Tool:** HTTP → Make a request
**URL:** `https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/rpc/update_backup_status`
**Method:** POST

**Headers:**
- `apikey`: Your Supabase anon key
- `Authorization`: Bearer [Your Supabase anon key]
- `Content-Type`: application/json

**Body:**
```json
{
  "p_image_id": "{{2.image_id}}",
  "p_onedrive_path": "{{4.webUrl}}",
  "p_backup_status": "backed_up"
}
```

**Note:** This runs for EACH image in the array (3 times for 3 images)

---

## Visual Flow

```
┌─────────────────────┐
│   Webhook Trigger   │ ← Receives JSON with images array
│  (receives 3 images)│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│      Iterator       │ ← Loops through images array
│   (3 iterations)    │
└──────────┬──────────┘
           │
    ┌──────┴────────┐
    │ Iteration 1   │ (IMG_1234.jpg)
    │ Iteration 2   │ (IMG_1235.jpg)
    │ Iteration 3   │ (IMG_1236.jpg)
    └───────────────┘
           │
           ▼
    For each iteration:

    1. HTTP Download Original ({{2.original_url}})
    2. OneDrive Upload Original (מקוריות folder)
    3. HTTP Download Transformed ({{2.transformed_url}})
    4. OneDrive Upload Transformed (מעובדות folder)
    5. Supabase RPC Update (mark as backed_up)
```

---

## Testing

### Test 1: Upload 1 Image

**Frontend sends:**
```json
{
  "batch_upload": true,
  "total_count": 1,
  "images": [
    { "image_id": "...", "filename": "IMG_1234.jpg", ... }
  ]
}
```

**Make.com should:**
- Iterator runs 1 time
- Downloads 1 original image
- Uploads to מקוריות folder
- Downloads 1 transformed image
- Uploads to מעובדות folder
- Updates 1 database record

---

### Test 2: Upload 3 Images

**Frontend sends:**
```json
{
  "batch_upload": true,
  "total_count": 3,
  "images": [
    { "image_id": "...", "filename": "IMG_1234.jpg", ... },
    { "image_id": "...", "filename": "IMG_1235.jpg", ... },
    { "image_id": "...", "filename": "IMG_1236.jpg", ... }
  ]
}
```

**Make.com should:**
- Iterator runs 3 times
- Processes all 3 images in sequence
- 3 files in מקוריות folder
- 3 files in מעובדות folder
- 3 database records updated

---

## Common Issues

### Issue 1: "Iterator receives empty array"

**Symptom:** Iterator doesn't run, no images processed

**Solution:** Check webhook data structure
```javascript
// Make sure images array is at top level
{
  "images": [...], // ✅ Correct
  "batch_upload": true
}

// NOT nested
{
  "data": {
    "images": [...] // ❌ Wrong
  }
}
```

### Issue 2: "Iterator runs only once despite 3 images"

**Symptom:** Only first image is processed

**Solution:** Check iterator array path
- ✅ Correct: `{{1.images}}`
- ❌ Wrong: `{{1.images[0]}}`
- ❌ Wrong: `{{1.images.0}}`

### Issue 3: "Variables not available in modules after iterator"

**Symptom:** Can't access `{{2.filename}}`, `{{2.original_url}}`, etc.

**Solution:** Make sure iterator is module 2, and all subsequent modules use `{{2.xxx}}`

---

## Benefits of This Approach

### ✅ Advantages:

1. **Single webhook call** - Less overhead, faster
2. **Atomic batch** - All images processed together
3. **Better error handling** - Know if entire batch failed
4. **Easier debugging** - See all images in one Make.com execution
5. **Less Make.com operations** - 1 webhook trigger instead of N triggers

### Comparison:

| Aspect | Old (One at a Time) | New (Batch) |
|--------|---------------------|-------------|
| Webhook calls | 3 calls | 1 call |
| Make.com triggers | 3 executions | 1 execution (with iterator) |
| Network requests | 3 separate | 1 batch |
| Error visibility | Scattered | Centralized |
| Debugging | Check 3 logs | Check 1 log |

---

## Next Steps

1. ✅ Update Make.com webhook to expect JSON (not FormData)
2. ✅ Add Iterator module after webhook trigger
3. ✅ Update all subsequent modules to use `{{2.xxx}}` variables
4. ✅ Test with 1 image first
5. ✅ Test with 3 images
6. ✅ Verify OneDrive folders have all files
7. ✅ Verify database records updated

---

**Status:** ✅ Frontend code updated
**Pending:** Make.com webhook configuration
**Estimated Time:** 30 minutes
