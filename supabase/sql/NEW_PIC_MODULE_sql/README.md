# Pictures Module - Database Migration Files

**Phase:** 1A - Foundation
**Created:** 2025-11-21
**Purpose:** Create database schema for Pictures Upload Module rebuild

---

## Overview

This folder contains SQL migration files to create the database infrastructure for the Pictures Upload Module migration from Make.com/Cloudinary-centric to Supabase-centric architecture.

---

## Execution Order

**IMPORTANT:** Run these files in the exact order listed below.

### Before Running

1. **Verify damage_centers table:**
   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables
     WHERE table_schema = 'public'
     AND table_name = 'damage_centers'
   );
   ```
   - If `TRUE`: Skip file `04_create_damage_centers_table.sql`
   - If `FALSE`: Run all files in order

2. **Backup your database** (recommended):
   ```bash
   # Via Supabase CLI
   supabase db dump -f backup_before_images_table.sql
   ```

### Execution Order

Run in Supabase SQL Editor or via CLI:

```bash
# 1. Create images table (without damage_center FK yet)
psql -f 01_create_images_table.sql

# 2. Create RLS policies for images
psql -f 02_images_rls_policies.sql

# 3. Create helper functions
psql -f 03_images_helper_functions.sql

# 4. Create damage_centers table (ONLY if it doesn't exist)
psql -f 04_create_damage_centers_table.sql

# 4b. Add foreign key constraint from images to damage_centers
psql -f 04b_add_damage_center_fk.sql

# 5. Link images and damage_centers (trigger)
psql -f 05_link_images_damage_centers.sql

# 6. Increase storage bucket limits
psql -f 06_update_storage_limits.sql
```

---

## File Descriptions

### 01_create_images_table.sql
**Purpose:** Creates the core `images` table for storing image metadata.

**Creates:**
- `images` table with all fields
- Indexes for performance
- Auto-update timestamp trigger
- Table comments (documentation)

**Dependencies:**
- `cases` table must exist
- `documents` table must exist
- `profiles` table must exist
- `damage_centers` table must exist (or run file 04 first)

**Key Fields:**
- `case_id` - Which case owns this image
- `document_id` - Reference to file storage record
- `damage_center_id` - Which garage/shop
- `display_order` - For reordering (spaced by 100)
- `category` - damage, general, parts, documents, other
- `optimization_status` - pending, processing, optimized, failed
- `deleted_at` - Soft delete timestamp

---

### 02_images_rls_policies.sql
**Purpose:** Enforces case ownership security - users can only access images from their cases.

**Creates:**
- `SELECT` policy - View images from your cases
- `INSERT` policy - Add images to your cases
- `UPDATE` policy - Edit your images (including soft delete)
- `DELETE` policy - Hard delete (admin only)

**Security Model:**
- Case owners can access their images
- Collaborators can access shared case images
- Admins/developers have full access
- Regular users cannot permanently delete (soft delete only)

---

### 03_images_helper_functions.sql
**Purpose:** Utility functions for common image operations.

**Creates:**
- `get_next_display_order(case_id)` - Get next order value for reordering
- `reorder_images(jsonb)` - Batch update display orders
- `soft_delete_image(image_id)` - Mark as deleted
- `restore_image(image_id)` - Restore soft-deleted image
- `get_case_image_count(case_id)` - Count images per case
- `get_case_image_count_by_category(case_id)` - Count by category
- `get_pending_optimizations(limit)` - Get images waiting for Cloudinary
- `update_optimization_status(...)` - Update after Make.com processing

**Usage Examples:**
```sql
-- Get next order for new image
SELECT get_next_display_order('case-uuid-here');

-- Reorder images after drag-drop
SELECT reorder_images('[
  {"id": "img1", "order": 0},
  {"id": "img2", "order": 100}
]'::jsonb);

-- Soft delete an image
SELECT soft_delete_image('img-uuid-here');

-- Count images
SELECT get_case_image_count('case-uuid-here');
```

---

### 04_create_damage_centers_table.sql
**Purpose:** Creates the `damage_centers` table (if it doesn't already exist).

**Creates:**
- `damage_centers` table
- Indexes
- RLS policies
- Auto-update timestamp trigger
- Helper function to update image count

**⚠️ IMPORTANT:**
Check if this table already exists before running:
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'damage_centers'
);
```

**Key Fields:**
- `case_id` - Which case owns this center
- `name` - Name in Hebrew (e.g., "מוסך אלון - חיפה")
- `type` - garage, shop, dealer, inspector, other
- `contact_name`, `contact_phone`, `contact_email`
- `images_count` - Denormalized count (updated by trigger)

---

### 04b_add_damage_center_fk.sql
**Purpose:** Adds the foreign key constraint from images.damage_center_id to damage_centers.id

**Creates:**
- Foreign key constraint (images_damage_center_id_fkey)
- Ensures referential integrity

**Why Separate File:**
- Avoids circular dependency (images → damage_centers)
- Can only be added after both tables exist

**Note:** This file is safe to run even if constraint already exists (checks first)

---

### 05_link_images_damage_centers.sql
**Purpose:** Creates the trigger that automatically updates `images_count` in damage_centers.

**Creates:**
- Trigger on `images` table
- Automatically updates count when images added/removed/deleted
- Handles soft deletes correctly

**When It Runs:**
- After INSERT on images → increment count
- After UPDATE on images (soft delete) → decrement count
- After DELETE on images → decrement count

---

### 06_update_storage_limits.sql
**Purpose:** Increases file size limits on storage buckets.

**Updates:**
- `originals` bucket: 10MB → **50MB**
- `processed` bucket: 10MB → **20MB**

**Rationale:**
- Modern cameras produce 20-30MB images
- Current 10MB limit is too restrictive
- Cloudinary can handle larger files

---

## Verification

After running all files, verify the installation:

```sql
-- 1. Check images table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'images'
);
-- Expected: TRUE

-- 2. Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'images';
-- Expected: rowsecurity = true

-- 3. Check policies exist
SELECT policyname
FROM pg_policies
WHERE tablename = 'images';
-- Expected: 4 policies (select, insert, update, delete)

-- 4. Check functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%image%';
-- Expected: 9+ functions

-- 5. Check indexes exist
SELECT indexname
FROM pg_indexes
WHERE tablename = 'images';
-- Expected: 7+ indexes

-- 6. Test inserting a dummy image
INSERT INTO images (
  case_id,
  document_id,
  original_url,
  filename,
  category,
  display_order
) VALUES (
  (SELECT id FROM cases LIMIT 1),  -- Use existing case
  (SELECT id FROM documents LIMIT 1),  -- Use existing document
  'https://example.com/test.jpg',
  'test.jpg',
  'damage',
  0
)
RETURNING id;
-- Expected: Returns UUID of new image

-- 7. Test helper function
SELECT get_next_display_order((SELECT id FROM cases LIMIT 1));
-- Expected: Returns integer (100 if one image, 200 if two, etc.)
```

---

## Rollback (If Needed)

If you need to undo the migration:

```sql
-- WARNING: This will delete all image records!
-- Make sure you have a backup before running.

-- Drop triggers
DROP TRIGGER IF EXISTS images_updated_at_trigger ON images;
DROP TRIGGER IF EXISTS update_damage_center_count_trigger ON images;
DROP TRIGGER IF EXISTS damage_centers_updated_at_trigger ON damage_centers;

-- Drop functions
DROP FUNCTION IF EXISTS update_images_updated_at();
DROP FUNCTION IF EXISTS get_next_display_order(UUID);
DROP FUNCTION IF EXISTS reorder_images(JSONB);
DROP FUNCTION IF EXISTS soft_delete_image(UUID);
DROP FUNCTION IF EXISTS restore_image(UUID);
DROP FUNCTION IF EXISTS get_case_image_count(UUID);
DROP FUNCTION IF EXISTS get_case_image_count_by_category(UUID);
DROP FUNCTION IF EXISTS get_pending_optimizations(INT);
DROP FUNCTION IF EXISTS update_optimization_status(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS update_damage_center_image_count();
DROP FUNCTION IF EXISTS update_damage_centers_updated_at();

-- Drop tables (CASCADE removes foreign key constraints)
DROP TABLE IF EXISTS images CASCADE;
DROP TABLE IF EXISTS damage_centers CASCADE;  -- Only if you created it

-- Revert storage limits (if needed)
UPDATE storage.buckets SET file_size_limit = 10485760 WHERE id = 'originals';
UPDATE storage.buckets SET file_size_limit = 10485760 WHERE id = 'processed';
```

---

## Testing

After installation, test with the application:

1. **Upload Test:**
   - Go to upload-images.html
   - Select a case
   - Upload a test image
   - Verify it appears in database:
     ```sql
     SELECT * FROM images ORDER BY created_at DESC LIMIT 1;
     ```

2. **Reordering Test:**
   - Upload 3+ images
   - Use reorder function:
     ```sql
     SELECT reorder_images('[
       {"id": "img-uuid-1", "order": 200},
       {"id": "img-uuid-2", "order": 100},
       {"id": "img-uuid-3", "order": 0}
     ]'::jsonb);
     ```
   - Verify order changed:
     ```sql
     SELECT filename, display_order
     FROM images
     WHERE case_id = 'case-uuid'
     ORDER BY display_order;
     ```

3. **Soft Delete Test:**
   - Delete an image:
     ```sql
     SELECT soft_delete_image('img-uuid');
     ```
   - Verify deleted_at is set:
     ```sql
     SELECT deleted_at FROM images WHERE id = 'img-uuid';
     ```
   - Restore it:
     ```sql
     SELECT restore_image('img-uuid');
     ```

4. **RLS Test:**
   - Login as User A
   - Upload image to their case
   - Login as User B
   - Try to view User A's image
   - Should be blocked by RLS

---

## Support

For issues or questions:
- Check discovery documentation in `/SUPABASE MIGRATION/PIctures module/`
- Review Task_1C_Supabase_Infrastructure_Audit.md
- Review Discovery_Summary_And_Recommendations.md

---

## Next Steps After Migration

After successfully running these migrations:

1. **Update fileUploadService.js** - Add image table functions
2. **Update upload-images.html** - Use Supabase upload instead of Make.com
3. **Adapt Make.com webhook** - Change to PROCESS_IMAGE (metadata only)
4. **Test end-to-end** - Upload → Database → Make.com → Cloudinary
5. **Phase 1B** - Build Image Workshop UI

---

**Migration Status:** ⏳ Ready to Execute
**Estimated Time:** 5-10 minutes
**Risk Level:** Low (new tables, no data migration)
**Rollback:** Available (see Rollback section)
