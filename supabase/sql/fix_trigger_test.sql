-- FIX TRIGGER TEST
-- Fix the test insert to include required fields

-- ============================================================================
-- 1. CHECK REQUIRED FIELDS IN CATALOG_ITEMS
-- ============================================================================

-- Check which fields are NOT NULL
SELECT 
    'REQUIRED FIELDS' as info,
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'catalog_items'
AND is_nullable = 'NO'
ORDER BY ordinal_position;

-- ============================================================================
-- 2. FIXED TEST WITH REQUIRED FIELDS
-- ============================================================================

-- Test insert with all required fields
INSERT INTO catalog_items (cat_num_desc, make, supplier_name, version_date) 
VALUES ('BMW X5 E70 פנס ימין 2008-2012 63117304906', 'BMW', 'Test Supplier', CURRENT_DATE);

-- Check if extraction worked automatically
SELECT 
    'AUTO EXTRACTION TEST RESULT' as test_type,
    cat_num_desc,
    oem,
    model_code,
    part_family,
    side_position,
    year_range,
    version_date
FROM catalog_items 
WHERE cat_num_desc = 'BMW X5 E70 פנס ימין 2008-2012 63117304906';

-- Clean up test data
DELETE FROM catalog_items 
WHERE cat_num_desc = 'BMW X5 E70 פנס ימין 2008-2012 63117304906';

-- ============================================================================
-- 3. PROCESS EXISTING CATALOG IN BATCHES
-- ============================================================================

-- Process first batch of existing unprocessed items
SELECT * FROM process_existing_catalog_batch(5000);

-- ============================================================================
-- 4. CHECK PROGRESS AFTER BATCH
-- ============================================================================

-- Check current extraction status
SELECT 
    'BATCH PROCESSING PROGRESS' as status,
    COUNT(*) as total_items,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END) as has_descriptions,
    COUNT(CASE WHEN model_code IS NOT NULL AND model_code != '' THEN 1 END) as has_model_code,
    COUNT(CASE WHEN part_family IS NOT NULL AND part_family != '' THEN 1 END) as has_part_family,
    COUNT(CASE WHEN side_position IS NOT NULL AND side_position != '' THEN 1 END) as has_side_position,
    ROUND(100.0 * COUNT(CASE WHEN model_code IS NOT NULL AND model_code != '' THEN 1 END) / 
          NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1) as extraction_percentage
FROM catalog_items;

-- ============================================================================
-- 5. INSTRUCTIONS FOR COMPLETING EXTRACTION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== AUTOMATIC EXTRACTION STATUS ===';
    RAISE NOTICE '';
    RAISE NOTICE 'TRIGGERS INSTALLED: Future uploads will auto-extract';
    RAISE NOTICE '';
    RAISE NOTICE 'TO COMPLETE EXISTING CATALOG:';
    RAISE NOTICE 'Run this repeatedly until remaining_count = 0:';
    RAISE NOTICE 'SELECT * FROM process_existing_catalog_batch(5000);';
    RAISE NOTICE '';
    RAISE NOTICE 'ESTIMATED BATCHES NEEDED: ~10 (for 47K remaining items)';
    RAISE NOTICE '';
END $$;