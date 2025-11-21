# fileUploadService.js Updates - Phase 1A

**Date:** 2025-11-21
**Status:** ✅ Complete
**File:** `/lib/fileUploadService.js`

---

## Summary of Changes

### 1. Updated Storage Bucket Limits

**Before:**
```javascript
originals: { maxSize: 10 * 1024 * 1024 } // 10MB
processed: { maxSize: 10 * 1024 * 1024 } // 10MB
```

**After:**
```javascript
originals: { maxSize: 50 * 1024 * 1024, allowedTypes: [..., 'image/heic', 'image/heif'] } // 50MB + HEIC support
processed: { maxSize: 20 * 1024 * 1024 } // 20MB
```

**Rationale:** Modern cameras produce 20-30MB images. Added HEIC/HEIF support for iPhone images.

---

## 2. New Image-Specific Functions Added

### Function Overview

| Function | Purpose | Returns |
|----------|---------|---------|
| `uploadImage()` | All-in-one: upload file + create image record | Full result object |
| `createImageRecord()` | Create database record after upload | Image object |
| `getNextDisplayOrder()` | Get next order value for reordering | Integer |
| `getImagesByCaseId()` | Get all images for a case with filters | Array of images |
| `updateImageOrder()` | Batch reorder images | Success status |
| `softDeleteImage()` | Mark image as deleted | Success status |
| `restoreImage()` | Restore deleted image | Success status |
| `updateOptimizationStatus()` | Update after Make.com processing | Success status |
| `getPendingOptimizations()` | Get unprocessed images | Array of images |
| `getCaseImageCount()` | Count images in a case | Number |
| `getCaseImageCountByCategory()` | Count by category | Object {category: count} |
| `getImageDimensions()` | Extract width/height from file | {width, height} |

---

## 3. Detailed Function Specifications

### `uploadImage(file, uploadOptions)`

**All-in-one upload function** - Recommended for most use cases

**Parameters:**
```javascript
{
  caseId: UUID,           // Required
  category: 'damage',     // Optional, default: 'damage'
  damageCenterId: UUID,   // Optional
  onProgress: function,   // Optional callback
  metadata: {}            // Optional additional metadata
}
```

**Returns:**
```javascript
{
  success: true,
  document: {...},        // Document record
  image: {...},           // Image record
  storagePath: string,
  bucket: string,
  publicUrl: string
}
```

**What it does:**
1. Extracts image dimensions (width, height)
2. Uploads file to Supabase Storage
3. Creates document record
4. Creates image record with metadata
5. Returns complete result

**Usage Example:**
```javascript
const result = await fileUploadService.uploadImage(file, {
  caseId: currentCaseId,
  category: 'damage',
  damageCenterId: selectedDamageCenterId,
  onProgress: (percentage) => {
    updateProgressBar(percentage);
  }
});

console.log('Image uploaded:', result.image.id);
console.log('Display order:', result.image.display_order);
```

---

### `createImageRecord(imageData)`

**Create image record** - For manual control

**Parameters:**
```javascript
{
  caseId: UUID,           // Required
  documentId: UUID,       // Required (from upload)
  damageCenterId: UUID,   // Optional
  originalUrl: string,    // Required (public URL)
  filename: string,       // Required
  category: string,       // Optional, default: 'damage'
  width: number,          // Optional
  height: number,         // Optional
  exifData: object,       // Optional
  source: string          // Optional, default: 'direct_upload'
}
```

**Returns:**
```javascript
{
  success: true,
  image: {
    id: UUID,
    case_id: UUID,
    display_order: 100,    // Auto-calculated
    optimization_status: 'pending',
    ...
  }
}
```

---

### `getImagesByCaseId(caseId, options)`

**Get images for a case** - With filters and ordering

**Parameters:**
```javascript
{
  category: 'damage',          // Optional filter
  damageCenterId: UUID,        // Optional filter
  includeDeleted: false,       // Optional, default: false
  orderBy: 'display_order',    // Optional, default: 'display_order'
  limit: 100,                  // Optional, default: 100
  offset: 0                    // Optional, default: 0
}
```

**Returns:**
```javascript
{
  success: true,
  images: [
    {
      id: UUID,
      case_id: UUID,
      display_order: 0,
      category: 'damage',
      signed_url: 'https://...', // 1-hour signed URL
      documents: {               // Joined data
        filename: string,
        size_bytes: number,
        bucket_name: string,
        storage_path: string
      },
      damage_centers: {          // Joined data
        id: UUID,
        name: string,
        type: string
      }
    },
    ...
  ],
  count: 25
}
```

**Usage Example:**
```javascript
// Get all damage images for a case
const { images } = await fileUploadService.getImagesByCaseId(caseId, {
  category: 'damage',
  orderBy: 'display_order'
});

// Display in UI
images.forEach(img => {
  displayImage(img.signed_url, img.filename);
});
```

---

### `updateImageOrder(imageOrders)`

**Reorder images** - Batch update after drag-drop

**Parameters:**
```javascript
[
  { id: 'uuid-1', order: 0 },
  { id: 'uuid-2', order: 100 },
  { id: 'uuid-3', order: 200 }
]
```

**Returns:**
```javascript
{
  success: true,
  updated_count: 3
}
```

**Usage Example:**
```javascript
// After drag-drop reordering
const newOrder = draggedImages.map((img, index) => ({
  id: img.id,
  order: index * 100
}));

await fileUploadService.updateImageOrder(newOrder);
```

---

### `softDeleteImage(imageId)`

**Soft delete** - Mark as deleted without removing

**Parameters:** `imageId` (UUID)

**Returns:**
```javascript
{
  success: true,
  message: 'Image deleted successfully'
}
```

**Usage Example:**
```javascript
await fileUploadService.softDeleteImage(imageId);
// Image still in database but deleted_at is set
```

---

### `restoreImage(imageId)`

**Restore deleted image**

**Parameters:** `imageId` (UUID)

**Returns:**
```javascript
{
  success: true,
  message: 'Image restored successfully'
}
```

---

### `updateOptimizationStatus(imageId, status, cloudinaryUrl, onedrivePath)`

**Update after Make.com processing**

**Parameters:**
- `imageId` (UUID) - Required
- `status` ('pending'|'processing'|'optimized'|'failed') - Required
- `cloudinaryUrl` (string) - Optional
- `onedrivePath` (string) - Optional

**Returns:**
```javascript
{
  success: true,
  message: 'Status updated successfully'
}
```

**Usage Example (Make.com webhook):**
```javascript
// After Cloudinary processing
await fileUploadService.updateOptimizationStatus(
  imageId,
  'optimized',
  'https://res.cloudinary.com/.../image.jpg',
  '/EVALIX/Cases/ABC123/Images/image.jpg'
);
```

---

### `getPendingOptimizations(limit)`

**Get images waiting for Cloudinary processing**

**Parameters:** `limit` (number, default: 50)

**Returns:**
```javascript
{
  success: true,
  images: [
    {
      image_id: UUID,
      case_id: UUID,
      original_url: string,
      filename: string,
      created_at: timestamp,
      age_minutes: 15
    },
    ...
  ],
  count: 10
}
```

**Usage Example (Background job):**
```javascript
// Check for pending optimizations every 5 minutes
const { images } = await fileUploadService.getPendingOptimizations(10);

for (const img of images) {
  await sendToMakeComForProcessing(img);
}
```

---

### `getCaseImageCount(caseId)`

**Get total image count**

**Parameters:** `caseId` (UUID)

**Returns:** Number

**Usage Example:**
```javascript
const count = await fileUploadService.getCaseImageCount(caseId);
console.log(`${count} images in case`);
```

---

### `getCaseImageCountByCategory(caseId)`

**Get count by category**

**Parameters:** `caseId` (UUID)

**Returns:**
```javascript
{
  "damage": 15,
  "general": 5,
  "parts": 3
}
```

**Usage Example:**
```javascript
const counts = await fileUploadService.getCaseImageCountByCategory(caseId);
console.log(`Damage: ${counts.damage}, General: ${counts.general}`);
```

---

### `getImageDimensions(file)`

**Extract dimensions from file**

**Parameters:** `file` (File object)

**Returns:**
```javascript
{
  width: 1920,
  height: 1080
}
```

**Usage Example:**
```javascript
const dimensions = await fileUploadService.getImageDimensions(file);
console.log(`Image is ${dimensions.width}x${dimensions.height}`);
```

---

## 4. Integration Examples

### Example 1: Simple Upload

```javascript
import { fileUploadService } from './lib/fileUploadService.js';

async function handleUpload(file) {
  try {
    const result = await fileUploadService.uploadImage(file, {
      caseId: currentCaseId,
      category: 'damage',
      damageCenterId: selectedDamageCenterId,
      onProgress: (pct) => console.log(`${pct}%`)
    });

    console.log('✅ Upload complete:', result.image.id);

    // Trigger Make.com processing
    await triggerMakeComProcessing(result.image.id);

  } catch (error) {
    console.error('❌ Upload failed:', error);
  }
}
```

### Example 2: Display Images Gallery

```javascript
async function loadImagesGallery(caseId) {
  const { images } = await fileUploadService.getImagesByCaseId(caseId, {
    orderBy: 'display_order'
  });

  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';

  images.forEach(img => {
    const imgEl = document.createElement('img');
    imgEl.src = img.signed_url;
    imgEl.alt = img.filename;
    imgEl.dataset.imageId = img.id;
    gallery.appendChild(imgEl);
  });
}
```

### Example 3: Reorder After Drag-Drop

```javascript
async function handleReorder(newOrder) {
  const imageOrders = newOrder.map((img, index) => ({
    id: img.id,
    order: index * 100
  }));

  const result = await fileUploadService.updateImageOrder(imageOrders);
  console.log(`✅ Reordered ${result.updated_count} images`);
}
```

### Example 4: Make.com Webhook Handler

```javascript
// Make.com webhook receives this after processing
async function handleMakeComCallback(data) {
  const {
    image_id,
    cloudinary_url,
    onedrive_path,
    status
  } = data;

  await fileUploadService.updateOptimizationStatus(
    image_id,
    status,
    cloudinary_url,
    onedrive_path
  );

  console.log(`✅ Image ${image_id} status: ${status}`);
}
```

---

## 5. Error Handling

All functions throw errors that should be caught:

```javascript
try {
  const result = await fileUploadService.uploadImage(file, options);
  // Success
} catch (error) {
  if (error.message.includes('validation failed')) {
    // File validation error (size, type)
    showAlert('Invalid file: ' + error.message, 'error');
  } else if (error.message.includes('Duplicate file')) {
    // File already uploaded
    showAlert('This file was already uploaded', 'warning');
  } else {
    // Other errors
    showAlert('Upload failed: ' + error.message, 'error');
  }
}
```

---

## 6. Backward Compatibility

All existing functions remain unchanged:
- `uploadToSupabase()` - Still works for generic file uploads
- `getSignedUrl()` - Still works for document URLs
- `getCaseFiles()` - Still works for all file types
- `deleteFile()` - Still works for document deletion

New functions are additions, not replacements.

---

## 7. Next Steps

Now that fileUploadService.js is updated:

1. ✅ Update `upload-images.html` to use new functions
2. ✅ Implement helper.js sync for backward compatibility
3. ✅ Adapt Make.com webhook for new flow
4. ✅ Test end-to-end upload → database → Make.com → Cloudinary

---

**Status:** ✅ fileUploadService.js is ready for use
**Next File:** upload-images.html
