# upload-images.html Update Plan - Phase 1A

**Date:** 2025-11-21
**Status:** 📋 Planning Complete
**File:** `/upload-images.html`

---

## Current Implementation Analysis

### Current Flow (Make.com-First)

```
User selects images
    ↓
FormData creation (all files + metadata)
    ↓
sendToWebhook('UPLOAD_PICTURES', formData)
    ↓
Make.com processes:
  - Uploads to Cloudinary
  - Returns URLs
    ↓
updateHelperWithImages(result)
    ↓
Clear files, show success
```

**Problems:**
- ❌ No Supabase database records
- ❌ 10MB file limit (Make.com constraint)
- ❌ No progress tracking during Make.com processing
- ❌ All metadata volatile (sessionStorage only)
- ❌ Can't manage images after upload

---

## New Implementation Plan (Supabase-First)

### New Flow

```
User selects images
    ↓
For each file:
  1. fileUploadService.uploadImage(file, options)
     ├─> Upload to Supabase Storage
     ├─> Create document record
     ├─> Create image record
     └─> Return result
  2. Update progress bar (real-time)
    ↓
After all uploads complete:
  1. Sync to helper.js (backward compatibility)
  2. Trigger Make.com (optional, async)
     └─> PROCESS_IMAGE webhook (metadata only)
    ↓
Show success, clear files
```

**Benefits:**
- ✅ Database persistence
- ✅ 50MB file limit
- ✅ Real-time progress tracking
- ✅ Images manageable immediately
- ✅ Make.com async (no blocking)

---

## Required Changes

### 1. Add Imports

**Location:** Top of `<script type="module">` section

**Add:**
```javascript
import { fileUploadService } from './lib/fileUploadService.js';
import { supabase } from './lib/supabaseClient.js';
```

**Note:** Change `<script>` to `<script type="module">` if not already

---

### 2. Replace `uploadImages()` Function

**Current Function:** Lines 1128-1189

**New Function:**
```javascript
async uploadImages() {
  if (this.uploadInProgress || this.files.length === 0) return;

  this.uploadInProgress = true;
  this.showUploadProgress(true);

  try {
    // Get case ID from sessionStorage or helper
    const caseId = sessionStorage.getItem('case_id');
    if (!caseId) {
      throw new Error('No case ID found');
    }

    // Get category and damage center
    const category = document.getElementById('image-category').value;
    const damageCenterSelect = document.getElementById('damage-center').value;

    // Determine damage center ID
    let damageCenterId = null;
    if (damageCenterSelect && damageCenterSelect.startsWith('existing_')) {
      // Extract ID from helper
      const index = parseInt(damageCenterSelect.replace('existing_', ''));
      const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
      if (helper.damage_centers && helper.damage_centers[index]) {
        damageCenterId = helper.damage_centers[index].id;
      }
    } else if (damageCenterSelect === 'custom') {
      // Create new damage center first
      const customName = document.getElementById('custom-damage-name').value.trim();
      damageCenterId = await this.createDamageCenter(caseId, customName);
    }

    const uploadedImages = [];
    const totalFiles = this.files.length;

    // Upload each file
    for (let i = 0; i < this.files.length; i++) {
      const file = this.files[i];

      try {
        // Update progress
        const baseProgress = (i / totalFiles) * 100;

        // Upload image (combines file upload + database record)
        const result = await fileUploadService.uploadImage(file, {
          caseId: caseId,
          category: category,
          damageCenterId: damageCenterId,
          onProgress: (percentage, progress) => {
            // Calculate overall progress
            const fileProgress = (percentage / totalFiles);
            const totalProgress = baseProgress + fileProgress;
            this.updateProgressBar(Math.round(totalProgress));
          }
        });

        uploadedImages.push({
          id: result.image.id,
          document_id: result.document.id,
          filename: file.name,
          url: result.publicUrl,
          category: category,
          display_order: result.image.display_order,
          size: file.size
        });

        console.log(`✅ Uploaded ${i + 1}/${totalFiles}: ${file.name}`);

      } catch (error) {
        console.error(`❌ Failed to upload ${file.name}:`, error);
        this.showAlert(`שגיאה בהעלאת ${file.name}: ${error.message}`, 'error');
        // Continue with other files
      }
    }

    // Update progress to 100%
    this.updateProgressBar(100);

    if (uploadedImages.length > 0) {
      // Update helper for backward compatibility
      await this.updateHelperWithSupabaseImages(uploadedImages);

      // Trigger Make.com for Cloudinary processing (async, non-blocking)
      this.triggerCloudinaryProcessing(uploadedImages);

      this.showAlert(`✅ ${uploadedImages.length} תמונות הועלו בהצלחה`, 'success');

      // Clear files
      this.files = [];
      this.updateUI();
      this.renderPreviews();
    } else {
      this.showAlert('❌ לא הצלחנו להעלות תמונות', 'error');
    }

  } catch (error) {
    console.error('Upload error:', error);
    this.showAlert(`❌ שגיאה בהעלאת התמונות: ${error.message}`, 'error');
  } finally {
    this.uploadInProgress = false;
    this.showUploadProgress(false);
  }
}
```

---

### 3. Add Helper Method: `createDamageCenter()`

**Purpose:** Create new damage center when user selects "custom"

**Add After `uploadImages()`:**
```javascript
async createDamageCenter(caseId, name) {
  try {
    const { data, error } = await supabase
      .from('damage_centers')
      .insert({
        case_id: caseId,
        name: name,
        type: 'garage'
      })
      .select()
      .single();

    if (error) throw error;

    // Also add to helper
    const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
    if (!helper.damage_centers) {
      helper.damage_centers = [];
    }
    helper.damage_centers.push({
      id: data.id,
      name: name,
      type: 'garage'
    });
    sessionStorage.setItem('helper', JSON.stringify(helper));

    return data.id;

  } catch (error) {
    console.error('Error creating damage center:', error);
    throw new Error('לא הצלחנו ליצור מוסך חדש');
  }
}
```

---

### 4. Update Helper Method: `updateHelperWithSupabaseImages()`

**Purpose:** Sync Supabase images to helper.js for backward compatibility

**Replace Current `updateHelperWithImages()` with:**
```javascript
async updateHelperWithSupabaseImages(images) {
  try {
    const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');

    if (!helper.images) {
      helper.images = [];
    }

    // Convert Supabase images to helper format
    const helperImages = images.map(img => ({
      id: img.id,  // Add ID for future reference
      url: img.url,  // Supabase URL (will be replaced by Cloudinary later)
      filename: img.filename,
      category: img.category,
      display_order: img.display_order,
      upload_date: new Date().toISOString(),
      size: img.size,
      source: 'supabase'  // Mark as from new system
    }));

    // Add to helper
    helper.images.push(...helperImages);

    // Update session storage
    sessionStorage.setItem('helper', JSON.stringify(helper));

    // Update via helper system (if available)
    if (typeof window.updateHelper === 'function') {
      window.updateHelper('images', helper.images, 'upload-images');
    }

    console.log('✅ Helper updated with Supabase images:', helperImages.length);

  } catch (error) {
    console.warn('Could not update helper with images:', error);
    // Don't throw - helper update failure shouldn't break upload
  }
}
```

---

### 5. Add Method: `triggerCloudinaryProcessing()`

**Purpose:** Trigger Make.com for Cloudinary processing (async, optional)

**Add After Helper Methods:**
```javascript
async triggerCloudinaryProcessing(images) {
  try {
    // Send each image ID to Make.com for processing
    for (const img of images) {
      // Don't wait for Make.com - fire and forget
      this.sendImageToMakeCom(img.id).catch(error => {
        console.warn(`Failed to trigger Make.com for image ${img.id}:`, error);
      });
    }

    console.log(`🔄 Triggered Make.com processing for ${images.length} images`);

  } catch (error) {
    console.error('Error triggering Cloudinary processing:', error);
    // Don't throw - Cloudinary processing is optional
  }
}

async sendImageToMakeCom(imageId) {
  try {
    // Get image details from database
    const { data: image, error } = await supabase
      .from('images')
      .select('*, documents(*)')
      .eq('id', imageId)
      .single();

    if (error) throw error;

    // Generate webhook-friendly URL (24hr expiry)
    const { data: urlData } = await supabase.storage
      .from(image.documents.bucket_name)
      .createSignedUrl(image.documents.storage_path, 86400); // 24 hours

    // Send to Make.com PROCESS_IMAGE webhook
    const formData = new FormData();
    formData.append('image_id', imageId);
    formData.append('supabase_url', urlData.signedUrl);
    formData.append('case_id', image.case_id);
    formData.append('category', image.category);
    formData.append('optimize_images', true);
    formData.append('add_watermark', true);

    await sendToWebhook('PROCESS_IMAGE', formData);

    console.log(`✅ Sent image ${imageId} to Make.com for processing`);

  } catch (error) {
    console.error(`Error sending image to Make.com:`, error);
    throw error;
  }
}
```

---

### 6. Update Progress Bar Method

**Replace Current `showUploadProgress()` with:**
```javascript
showUploadProgress(show) {
  const progressElement = document.getElementById('upload-progress');
  if (show) {
    progressElement.style.display = 'block';
    this.updateProgressBar(0);
  } else {
    progressElement.style.display = 'none';
    this.updateProgressBar(0);
  }
}

updateProgressBar(percentage) {
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');

  if (progressFill) {
    progressFill.style.width = `${percentage}%`;
  }

  if (progressText) {
    progressText.textContent = `${percentage}%`;
  }
}
```

---

### 7. Add Case ID Detection

**Purpose:** Get case_id from sessionStorage or create/lookup

**Add to `DOMContentLoaded` Section:**
```javascript
// Ensure case_id exists in sessionStorage
async function ensureCaseId() {
  let caseId = sessionStorage.getItem('case_id');

  if (!caseId) {
    const plate = document.getElementById('plate').value;

    if (plate) {
      // Look up case by plate
      const { data: cases } = await supabase
        .from('cases')
        .select('id')
        .eq('plate', plate)
        .limit(1);

      if (cases && cases.length > 0) {
        caseId = cases[0].id;
        sessionStorage.setItem('case_id', caseId);
      }
    }
  }

  return caseId;
}

// Call before upload
document.getElementById('upload-btn')?.addEventListener('click', async () => {
  await ensureCaseId();
  window.imageUploadManager.uploadImages();
});
```

---

## 8. HTML Updates Needed

### Add Progress Text Element

**Find:**
```html
<div id="upload-progress" style="display: none;">
  <div class="progress-bar">
    <div id="progress-fill" class="progress-fill"></div>
  </div>
</div>
```

**Add Inside Progress Bar:**
```html
<div id="upload-progress" style="display: none;">
  <div class="progress-bar">
    <div id="progress-fill" class="progress-fill"></div>
    <div id="progress-text" class="progress-text">0%</div>
  </div>
</div>
```

**Add CSS:**
```css
.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: bold;
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}
```

---

## 9. Backward Compatibility

### What Stays the Same

✅ **UI/UX:** No visual changes for users
✅ **Helper System:** Still updates helper.images
✅ **Advanced Options:** Transform/PDF still use Make.com
✅ **Session Storage:** Still uses plate/owner from sessionStorage

### What Changes (Internal)

🔄 **Upload Destination:** Supabase Storage (not Make.com FormData)
🔄 **Database:** Creates image records immediately
🔄 **Progress:** Real-time (not simulated)
🔄 **Make.com:** Async processor (not primary controller)

---

## 10. Testing Checklist

After implementation, test:

- [ ] Upload single image (2MB) - should work
- [ ] Upload multiple images (5x5MB) - should work
- [ ] Upload large image (30MB) - should work (new limit)
- [ ] Progress bar updates in real-time
- [ ] Images appear in database (check Supabase)
- [ ] Helper.images updated correctly
- [ ] Make.com receives PROCESS_IMAGE webhook
- [ ] Cloudinary URL updated after processing
- [ ] Can upload without internet (should fail gracefully)
- [ ] Custom damage center creation works
- [ ] Existing damage center selection works
- [ ] Category selection works
- [ ] Case ownership verification works (RLS)

---

## 11. Make.com Webhook Changes

### Current Webhook: `UPLOAD_PICTURES`

**Keep for backward compatibility** (other systems may still use it)

### New Webhook: `PROCESS_IMAGE`

**Create in Make.com:**
- URL: `https://hook.eu2.make.com/[new-hook-id]`
- Receives: `image_id`, `supabase_url`, `case_id`, `category`
- Actions:
  1. Download from `supabase_url`
  2. Upload to Cloudinary (watermark, optimize)
  3. Upload to OneDrive (backup)
  4. Call Supabase RPC: `update_optimization_status(image_id, 'optimized', cloudinary_url, onedrive_path)`
- Returns: Success/failure status

---

## 12. Rollback Plan

If issues occur:

1. **Revert upload-images.html** to previous version
2. **Keep database tables** (no harm in having empty images table)
3. **Old flow still works** (UPLOAD_PICTURES webhook unchanged)

**Files to backup before changes:**
- `upload-images.html` (copy to `upload-images.html.backup`)

---

## 13. Implementation Order

1. ✅ Add imports (fileUploadService, supabase)
2. ✅ Add helper methods (createDamageCenter, updateHelperWithSupabaseImages)
3. ✅ Replace uploadImages() function
4. ✅ Add triggerCloudinaryProcessing() method
5. ✅ Update progress bar methods
6. ✅ Add case ID detection
7. ✅ Update HTML (progress text)
8. ✅ Test thoroughly
9. ✅ Create Make.com PROCESS_IMAGE webhook
10. ✅ Deploy

---

## 14. Expected Results

### Before (Make.com-First)
- Upload 5 images (5MB each): ~30 seconds
- File limit: 10MB
- Database: No records
- Progress: Simulated
- Make.com: Blocking

### After (Supabase-First)
- Upload 5 images (5MB each): ~10 seconds
- File limit: 50MB
- Database: 5 image records created
- Progress: Real-time (0% → 100%)
- Make.com: Async, non-blocking

---

**Status:** 📋 Plan Complete - Ready for Implementation
**Next:** Implement changes in upload-images.html
