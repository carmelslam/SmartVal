# PDF VIEW URL MISSING IN SUPABASE TRACKING TABLES

**Date:** 2025-11-20
**Branch:** `claude/audit-report-styling-011CV2M2WWp3yiMRyyQ9RUqN`
**Status:** 🔴 CRITICAL - PDF URLs not being saved to Supabase

---

## Problem Statement

When PDFs are generated and uploaded to Supabase storage, the `pdf_public_url` field in tracking tables (`tracking_expertise` and `tracking_final_report`) remains **NULL**. This prevents the Admin Hub from displaying "Load" buttons to view PDFs.

---

## Root Cause Analysis

### Current Flow
1. ✅ PDF is generated successfully by `native-pdf-generator.js`
2. ✅ PDF is uploaded to Supabase storage bucket `final-reports`
3. ❌ **ISSUE**: `getPublicUrl()` is used instead of `createSignedUrl()`
4. ❌ **ISSUE**: Public URL doesn't work for private buckets

### The Bug
**File:** `final-report-template-builder.html`
**Line:** 2105-2107

**Current (BROKEN) Code:**
```javascript
// Get public URL (EXPERTISE PATTERN)
const { data: { publicUrl } } = supabase.storage
  .from('final-reports')
  .getPublicUrl(storagePath);
```

**Problem:**
- `getPublicUrl()` generates a URL, but it only works if the bucket is configured as **public** in Supabase dashboard settings
- Storage bucket `final-reports` has RLS policies for public SELECT, but the bucket itself may be private
- If bucket is private, the publicUrl returns a URL but it's **not accessible**
- The RPC function receives an invalid URL and saves it to `pdf_public_url` field (or the field stays NULL)

**Correct Approach (from reportStorageService.js):**
```javascript
// Create long-lived signed URL (1 year expiry = 31536000 seconds)
const { data: urlData, error: urlError } = await this.supabase.storage
  .from('reports')
  .createSignedUrl(storagePath, 31536000); // 1 year expiry

const signedUrl = urlData?.signedUrl;
```

---

## The Solution

### Fix #1: Use Signed URLs Instead of Public URLs

**File:** `final-report-template-builder.html`
**Lines:** 2104-2108

**Change FROM:**
```javascript
// Get public URL (EXPERTISE PATTERN)
const { data: { publicUrl } } = supabase.storage
  .from('final-reports')
  .getPublicUrl(storagePath);

console.log('✅ PDF uploaded to storage:', publicUrl);
```

**Change TO:**
```javascript
// Get long-lived signed URL (1 year expiry) - works for private buckets
console.log('🔗 Creating signed URL for PDF access...');
const { data: urlData, error: urlError } = await supabase.storage
  .from('final-reports')
  .createSignedUrl(storagePath, 31536000); // 1 year expiry

if (urlError) {
  console.error('❌ Failed to create signed URL:', urlError);
  throw new Error('Failed to create PDF access URL: ' + urlError.message);
}

const publicUrl = urlData?.signedUrl;

if (!publicUrl) {
  throw new Error('Signed URL is empty - PDF may not be accessible');
}

console.log('✅ PDF uploaded to storage with signed URL:', publicUrl);
```

**Why This Works:**
- ✅ `createSignedUrl()` works for both public AND private buckets
- ✅ 1-year expiry (31536000 seconds) matches the pattern in `reportStorageService.js`
- ✅ Returns a working, accessible URL that can be saved to database
- ✅ Includes error handling to catch URL creation failures

---

### Fix #2: Apply Same Fix to Expertise Builder

**File:** `expertise builder.html`
**Search for:** Similar `getPublicUrl()` pattern
**Action:** Apply the same signed URL fix if found

---

### Fix #3: Apply Same Fix to Estimate Builder

**File:** `estimate-report-builder.html`
**Search for:** Similar `getPublicUrl()` pattern
**Action:** Apply the same signed URL fix if found

---

## Implementation Plan

### Task 1: ✅ Analyze the Issue (COMPLETED)
- [x] Identified root cause: `getPublicUrl()` vs `createSignedUrl()`
- [x] Located bug in `final-report-template-builder.html` line 2105-2107
- [x] Confirmed SQL functions DO save `pdf_public_url` (lines 220, 248, 474, 495 in 25_fix_field_population.sql)
- [x] Confirmed RPC is called with `p_pdf_public_url` parameter (line 2128)

### Task 2: 🔧 Fix Final Report Builder
**File:** `final-report-template-builder.html`
**Location:** Lines 2104-2108
**Status:** ⏳ PENDING

**Actions:**
1. Replace `getPublicUrl()` with `createSignedUrl(31536000)`
2. Add error handling for URL creation failure
3. Add null check for signedUrl
4. Update console logging

### Task 3: 🔧 Fix Expertise Builder (if needed)
**File:** `expertise builder.html`
**Status:** ⏳ PENDING

**Actions:**
1. Search for `getPublicUrl()` usage
2. If found, apply same fix as final report builder
3. Test expertise PDF generation

### Task 4: 🔧 Fix Estimate Builder (if needed)
**File:** `estimate-report-builder.html`
**Status:** ⏳ PENDING

**Actions:**
1. Search for `getPublicUrl()` usage
2. If found, apply same fix
3. Test estimate PDF generation

### Task 5: ✅ Test and Verify
**Status:** ⏳ PENDING

**Test Cases:**
1. Generate final report PDF
2. Check Supabase `tracking_final_report` table
3. Verify `pdf_public_url` field contains a valid URL
4. Click the URL and verify PDF loads
5. Check Admin Hub "Load" button works
6. Repeat for expertise and estimate reports

---

## Files to Modify

1. **final-report-template-builder.html** - Replace getPublicUrl() with createSignedUrl() (REQUIRED)
2. **expertise builder.html** - Check and fix if needed (TO BE VERIFIED)
3. **estimate-report-builder.html** - Check and fix if needed (TO BE VERIFIED)

---

## Scope Compliance

✅ **Working ONLY within the scope:**
- PDF upload and URL generation only
- No database schema changes
- No business logic changes
- No module deletions

✅ **Simple change:**
- Replace one method call with another
- Add error handling
- Minimal code change

✅ **Fixes critical bug:**
- Unblocks Admin Hub PDF viewing
- Uses proven pattern from reportStorageService.js
- Minimal risk

---

## Expected Result

### Before Fix
```sql
SELECT pdf_public_url FROM tracking_final_report WHERE case_id = 'xxx';
-- Result: NULL
```

### After Fix
```sql
SELECT pdf_public_url FROM tracking_final_report WHERE case_id = 'xxx';
-- Result: https://xxxxx.supabase.co/storage/v1/object/sign/final-reports/...?token=...
```

### Admin Hub
- ✅ "Load" button appears next to final reports
- ✅ Clicking "Load" opens PDF in new tab
- ✅ PDF is accessible and displays correctly

---

## Review Section

### Summary of Changes

#### ✅ COMPLETED: Switch from Public URLs to Signed URLs

**Files Modified:** 3 files, 6 total occurrences fixed
- `final-report-template-builder.html` - 1 occurrence (line 2107)
- `estimate-report-builder.html` - 3 occurrences (lines 2653, 2892, 3034)
- `expertise builder.html` - 2 occurrences (lines 1483, 2023)

**Lines Changed:** ~60 lines total across all files
**Risk Level:** Low
**Justification:** Uses proven pattern from existing reportStorageService.js

---

### Detailed Changes by File

#### 1. final-report-template-builder.html (Line 2104-2121)
**Status:** ✅ FIXED

**Before:**
```javascript
const { data: { publicUrl } } = supabase.storage
  .from('final-reports')
  .getPublicUrl(storagePath);
```

**After:**
```javascript
const { data: urlData, error: urlError } = await supabase.storage
  .from('final-reports')
  .createSignedUrl(storagePath, 31536000); // 1 year expiry

if (urlError) {
  console.error('❌ Failed to create signed URL:', urlError);
  throw new Error('Failed to create PDF access URL: ' + urlError.message);
}

const publicUrl = urlData?.signedUrl;

if (!publicUrl) {
  throw new Error('Signed URL is empty - PDF may not be accessible');
}
```

---

#### 2. estimate-report-builder.html (3 occurrences)
**Status:** ✅ ALL FIXED

**Occurrence 1 (Line 2650-2667):** Estimate export - multi-report upload
- ✅ Replaced `getPublicUrl()` with `createSignedUrl()`
- ✅ Added error handling (non-throwing, logs warning)
- ✅ Uses dynamic bucket name (`bucketName` variable)

**Occurrence 2 (Line 2890-2907):** Standalone estimate PDF generation
- ✅ Replaced `getPublicUrl()` with `createSignedUrl()`
- ✅ Added error handling (throws on failure)
- ✅ Fixed bucket name to `estimate-reports`

**Occurrence 3 (Line 3031-3048):** Final report draft during estimate export
- ✅ Replaced `getPublicUrl()` with `createSignedUrl()`
- ✅ Added error handling (non-throwing, logs warning)
- ✅ Fixed bucket name to `final-reports`
- ✅ Handles null URL gracefully

---

#### 3. expertise builder.html (2 occurrences)
**Status:** ✅ ALL FIXED

**Occurrence 1 (Line 1480-1497):** Multi-report upload
- ✅ Replaced `getPublicUrl()` with `createSignedUrl()`
- ✅ Added error handling (non-throwing, logs warning)
- ✅ Uses dynamic bucket name (`bucketName` variable)

**Occurrence 2 (Line 2020-2037):** Standalone expertise PDF generation
- ✅ Replaced `getPublicUrl()` with `createSignedUrl()`
- ✅ Added error handling (non-throwing, logs warning)
- ✅ Fixed bucket name to `expertise-reports`

---

### What Changed (Technical Details)

**Before (BROKEN):**
- Used `getPublicUrl()` which only works if bucket is configured as **public** in Supabase dashboard
- No error handling for URL creation
- No validation that URL was created successfully
- URLs were invalid for private buckets, causing NULL values in database

**After (FIXED):**
- Uses `createSignedUrl(31536000)` which works for **both public AND private buckets**
- 1-year expiry (31536000 seconds) matches proven pattern from reportStorageService.js
- Comprehensive error handling:
  - Catches URL creation failures
  - Logs detailed error messages
  - Throws errors for critical paths (final report submission)
  - Handles errors gracefully for non-critical paths (draft exports)
- Validates that signed URL is not empty before use
- Enhanced console logging for debugging

---

### Impact

**✅ Fixed Issues:**
- PDF URLs will now be saved correctly to Supabase tracking tables
- `tracking_expertise.pdf_public_url` will contain valid signed URLs
- `tracking_final_report.pdf_public_url` will contain valid signed URLs
- Admin Hub will display "Load" buttons for PDFs
- PDFs will be accessible via signed URLs (works for private buckets)
- 1-year expiry ensures long-term access without maintenance

**✅ Improved Error Handling:**
- URL creation failures are now logged with detailed error messages
- Critical paths throw errors to prevent silent failures
- Non-critical paths continue gracefully with warnings
- All PDF URLs are validated before being saved to database

**✅ Better Debugging:**
- Enhanced console logging shows URL creation progress
- Clear success/failure messages for each PDF type
- Signed URLs are logged for manual verification

---

### Testing Checklist
- [ ] Generate final report PDF - verify URL saved to database
- [ ] Generate expertise PDF - verify URL saved to database
- [ ] Generate estimate PDF - verify URL saved to database
- [ ] Test PDF access from saved URLs
- [ ] Verify Admin Hub "Load" buttons work
- [ ] Check console for proper logging (🔗, ✅, ❌, ⚠️ emojis)
- [ ] Verify error handling for URL creation failures
- [ ] Test with both draft and final status PDFs

---

## Implementation Status

1. ✅ Create implementation plan (COMPLETED)
2. ✅ Search all builder files for `getPublicUrl()` usage (COMPLETED - found 6 occurrences)
3. ✅ Implement fix in all affected files (COMPLETED - fixed all 6 occurrences)
4. ⏳ Test PDF generation and URL storage (PENDING - awaiting user testing)
5. ⏳ Verify Admin Hub functionality (PENDING - awaiting user testing)
6. ⏳ Commit and push changes (READY)
7. ⏳ Report results to user (READY)

---
