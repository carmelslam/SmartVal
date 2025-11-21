# Quick Start - Execute SQL Files

**Problem Fixed:** The foreign key dependency issue has been resolved by splitting the constraint creation into a separate file.

---

## Step-by-Step Execution

### Option 1: Run Files Individually (Recommended)

Copy and paste each file's content into **Supabase SQL Editor** in this exact order:

1. ✅ **01_create_images_table.sql**
   - Creates images table (without FK to damage_centers yet)

2. ✅ **02_images_rls_policies.sql**
   - Creates RLS policies for images table

3. ✅ **03_images_helper_functions.sql**
   - Creates 8 helper functions

4. ✅ **04_create_damage_centers_table.sql**
   - Creates damage_centers table (check if it exists first!)
   - To check:
     ```sql
     SELECT EXISTS (
       SELECT FROM information_schema.tables
       WHERE table_schema = 'public'
       AND table_name = 'damage_centers'
     );
     ```
   - If returns `TRUE`, skip this file

5. ✅ **04b_add_damage_center_fk.sql** ⬅️ **NEW FILE**
   - Adds foreign key constraint from images to damage_centers
   - Safe to run even if constraint exists

6. ✅ **05_link_images_damage_centers.sql**
   - Creates trigger to auto-update image counts

7. ✅ **06_update_storage_limits.sql**
   - Increases bucket limits to 50MB

---

### Option 2: Use Master Script

If using psql command line:

```bash
psql -f 00_EXECUTE_ALL.sql
```

---

## Verification After Execution

Run this in Supabase SQL Editor:

```sql
-- 1. Check images table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'images'
);
-- Expected: TRUE

-- 2. Check foreign key constraint exists
SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE constraint_name = 'images_damage_center_id_fkey';
-- Expected: 1 row returned

-- 3. Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'images';
-- Expected: rowsecurity = true

-- 4. Count helper functions
SELECT COUNT(*)
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'get_next_display_order',
  'reorder_images',
  'soft_delete_image',
  'restore_image',
  'get_case_image_count',
  'get_case_image_count_by_category',
  'get_pending_optimizations',
  'update_optimization_status'
);
-- Expected: 8

-- 5. Check storage limits
SELECT id, ROUND(file_size_limit / 1024.0 / 1024.0, 2) as limit_mb
FROM storage.buckets
WHERE id IN ('originals', 'processed');
-- Expected:
-- originals: 50.00 MB
-- processed: 20.00 MB
```

---

## What Changed to Fix the Error

**Original Problem:**
- File `01_create_images_table.sql` had: `REFERENCES damage_centers(id)`
- But `damage_centers` table didn't exist yet
- Result: ERROR: relation "damage_centers" does not exist

**Solution:**
- Removed FK constraint from initial table creation
- Created new file `04b_add_damage_center_fk.sql`
- FK constraint is added AFTER both tables exist
- No more dependency errors!

---

## If You Already Ran 01 and Got the Error

No problem! The table wasn't created. Just run the files in the new order starting from file 01.

---

## Need Help?

- Full documentation: See `README.md`
- Rollback instructions: See `README.md` → Rollback section
- Discovery docs: See `/SUPABASE MIGRATION/PIctures module/`
