-- ============================================================================
-- MASTER EXECUTION SCRIPT - Pictures Module Database Migration
-- ============================================================================
-- Purpose: Execute all migration files in correct order
-- Created: 2025-11-21
-- Phase: 1A - Foundation
-- ============================================================================

-- ============================================================================
-- IMPORTANT: READ BEFORE EXECUTING
-- ============================================================================
-- This script runs all migration files in the correct order.
--
-- PREREQUISITES:
-- 1. Backup your database first!
-- 2. Verify these tables exist:
--    - cases
--    - documents
--    - profiles
-- 3. Check if damage_centers table exists:
--    SELECT EXISTS (
--      SELECT FROM information_schema.tables
--      WHERE table_schema = 'public'
--      AND table_name = 'damage_centers'
--    );
--    If TRUE, you can skip step 4 below.
--
-- EXECUTION:
-- You can either:
-- A) Copy and paste sections into Supabase SQL Editor
-- B) Run individual files in order (recommended)
-- C) Use psql: psql -f 00_EXECUTE_ALL.sql
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE IMAGES TABLE
-- ============================================================================

\echo ''
\echo '========================================='
\echo 'STEP 1: Creating images table...'
\echo '========================================='

\i 01_create_images_table.sql

\echo 'STEP 1: Complete ✓'

-- ============================================================================
-- STEP 2: CREATE RLS POLICIES FOR IMAGES
-- ============================================================================

\echo ''
\echo '========================================='
\echo 'STEP 2: Creating RLS policies...'
\echo '========================================='

\i 02_images_rls_policies.sql

\echo 'STEP 2: Complete ✓'

-- ============================================================================
-- STEP 3: CREATE HELPER FUNCTIONS
-- ============================================================================

\echo ''
\echo '========================================='
\echo 'STEP 3: Creating helper functions...'
\echo '========================================='

\i 03_images_helper_functions.sql

\echo 'STEP 3: Complete ✓'

-- ============================================================================
-- STEP 4: CREATE DAMAGE CENTERS TABLE (If Needed)
-- ============================================================================

\echo ''
\echo '========================================='
\echo 'STEP 4: Creating damage_centers table...'
\echo '========================================='
\echo 'NOTE: Skip this step if damage_centers table already exists'
\echo ''

-- Check if table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'damage_centers'
  ) THEN
    RAISE NOTICE 'damage_centers table does not exist. Creating...';
    -- Run the file
    \i 04_create_damage_centers_table.sql
  ELSE
    RAISE NOTICE 'damage_centers table already exists. Skipping creation.';
  END IF;
END $$;

\echo 'STEP 4: Complete ✓'

-- ============================================================================
-- STEP 4B: ADD FOREIGN KEY CONSTRAINT
-- ============================================================================

\echo ''
\echo '========================================='
\echo 'STEP 4B: Adding FK constraint...'
\echo '========================================='

\i 04b_add_damage_center_fk.sql

\echo 'STEP 4B: Complete ✓'

-- ============================================================================
-- STEP 5: LINK IMAGES AND DAMAGE CENTERS
-- ============================================================================

\echo ''
\echo '========================================='
\echo 'STEP 5: Creating image count trigger...'
\echo '========================================='

\i 05_link_images_damage_centers.sql

\echo 'STEP 5: Complete ✓'

-- ============================================================================
-- STEP 6: UPDATE STORAGE BUCKET LIMITS
-- ============================================================================

\echo ''
\echo '========================================='
\echo 'STEP 6: Updating storage bucket limits...'
\echo '========================================='

\i 06_update_storage_limits.sql

\echo 'STEP 6: Complete ✓'

-- ============================================================================
-- VERIFICATION
-- ============================================================================

\echo ''
\echo '========================================='
\echo 'VERIFICATION: Checking installation...'
\echo '========================================='

-- Check images table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'images'
  ) THEN
    RAISE NOTICE '✓ images table exists';
  ELSE
    RAISE EXCEPTION '✗ images table NOT found!';
  END IF;
END $$;

-- Check RLS is enabled
DO $$
DECLARE
  v_rls_enabled BOOLEAN;
BEGIN
  SELECT rowsecurity INTO v_rls_enabled
  FROM pg_tables
  WHERE tablename = 'images';

  IF v_rls_enabled THEN
    RAISE NOTICE '✓ RLS enabled on images table';
  ELSE
    RAISE WARNING '✗ RLS NOT enabled on images table!';
  END IF;
END $$;

-- Check policies exist
DO $$
DECLARE
  v_policy_count INT;
BEGIN
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE tablename = 'images';

  IF v_policy_count >= 4 THEN
    RAISE NOTICE '✓ RLS policies created (% policies)', v_policy_count;
  ELSE
    RAISE WARNING '✗ Expected 4+ policies, found %', v_policy_count;
  END IF;
END $$;

-- Check helper functions exist
DO $$
DECLARE
  v_function_count INT;
BEGIN
  SELECT COUNT(*) INTO v_function_count
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

  IF v_function_count >= 8 THEN
    RAISE NOTICE '✓ Helper functions created (% functions)', v_function_count;
  ELSE
    RAISE WARNING '✗ Expected 8+ functions, found %', v_function_count;
  END IF;
END $$;

-- Check indexes exist
DO $$
DECLARE
  v_index_count INT;
BEGIN
  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE tablename = 'images';

  IF v_index_count >= 7 THEN
    RAISE NOTICE '✓ Indexes created (% indexes)', v_index_count;
  ELSE
    RAISE WARNING '✗ Expected 7+ indexes, found %', v_index_count;
  END IF;
END $$;

-- Check storage limits
DO $$
DECLARE
  v_originals_limit BIGINT;
  v_processed_limit BIGINT;
BEGIN
  SELECT file_size_limit INTO v_originals_limit
  FROM storage.buckets WHERE id = 'originals';

  SELECT file_size_limit INTO v_processed_limit
  FROM storage.buckets WHERE id = 'processed';

  IF v_originals_limit = 52428800 THEN
    RAISE NOTICE '✓ originals bucket limit: 50MB';
  ELSE
    RAISE WARNING '✗ originals bucket limit: % (expected 52428800)', v_originals_limit;
  END IF;

  IF v_processed_limit = 20971520 THEN
    RAISE NOTICE '✓ processed bucket limit: 20MB';
  ELSE
    RAISE WARNING '✗ processed bucket limit: % (expected 20971520)', v_processed_limit;
  END IF;
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================

\echo ''
\echo '========================================='
\echo 'MIGRATION COMPLETE!'
\echo '========================================='
\echo ''
\echo 'What was created:'
\echo '  • images table with soft delete support'
\echo '  • 4 RLS policies (case ownership enforcement)'
\echo '  • 8+ helper functions for image operations'
\echo '  • 7+ indexes for performance'
\echo '  • damage_centers table (if it did not exist)'
\echo '  • Foreign key constraint (images → damage_centers)'
\echo '  • Trigger to update damage center image counts'
\echo '  • Increased storage limits (50MB originals, 20MB processed)'
\echo ''
\echo 'Next steps:'
\echo '  1. Update fileUploadService.js (add image functions)'
\echo '  2. Update upload-images.html (Supabase upload)'
\echo '  3. Adapt Make.com webhook (PROCESS_IMAGE)'
\echo '  4. Test end-to-end upload flow'
\echo ''
\echo 'For rollback instructions, see README.md'
\echo ''
\echo '========================================='

-- ============================================================================
-- END OF FILE
-- ============================================================================
