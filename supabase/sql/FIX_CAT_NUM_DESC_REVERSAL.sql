-- ============================================================================
-- FIX CAT_NUM_DESC HEBREW REVERSAL
-- Date: 2025-10-02
-- Purpose: Reverse the Hebrew text in cat_num_desc field
-- This is CRITICAL for model/year extraction to work
-- ============================================================================

-- IMPORTANT: This will update ALL 48,272 records
-- We'll do it in batches to avoid timeout

SELECT '=== STARTING CAT_NUM_DESC REVERSAL FIX ===' as step;

-- ============================================================================
-- Check if reverse_hebrew function exists (from FINAL_CLEAN_DEPLOYMENT.sql)
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'reverse_hebrew') THEN
        RAISE EXCEPTION 'reverse_hebrew function not found! Deploy FINAL_CLEAN_DEPLOYMENT.sql first';
    END IF;
    RAISE NOTICE 'reverse_hebrew function found - proceeding with fix';
END $$;

-- ============================================================================
-- BATCH 1: Fix first 10,000 records
-- ============================================================================

SELECT '1. Fixing first 10,000 records...' as step;

UPDATE catalog_items
SET cat_num_desc = reverse_hebrew(cat_num_desc)
WHERE id IN (
    SELECT id 
    FROM catalog_items 
    ORDER BY id 
    LIMIT 10000
)
AND cat_num_desc IS NOT NULL;

-- ============================================================================
-- BATCH 2: Fix next 10,000 records
-- ============================================================================

SELECT '2. Fixing records 10,001-20,000...' as step;

UPDATE catalog_items
SET cat_num_desc = reverse_hebrew(cat_num_desc)
WHERE id IN (
    SELECT id 
    FROM catalog_items 
    ORDER BY id 
    OFFSET 10000
    LIMIT 10000
)
AND cat_num_desc IS NOT NULL;

-- ============================================================================
-- BATCH 3: Fix next 10,000 records
-- ============================================================================

SELECT '3. Fixing records 20,001-30,000...' as step;

UPDATE catalog_items
SET cat_num_desc = reverse_hebrew(cat_num_desc)
WHERE id IN (
    SELECT id 
    FROM catalog_items 
    ORDER BY id 
    OFFSET 20000
    LIMIT 10000
)
AND cat_num_desc IS NOT NULL;

-- ============================================================================
-- BATCH 4: Fix next 10,000 records
-- ============================================================================

SELECT '4. Fixing records 30,001-40,000...' as step;

UPDATE catalog_items
SET cat_num_desc = reverse_hebrew(cat_num_desc)
WHERE id IN (
    SELECT id 
    FROM catalog_items 
    ORDER BY id 
    OFFSET 30000
    LIMIT 10000
)
AND cat_num_desc IS NOT NULL;

-- ============================================================================
-- BATCH 5: Fix remaining records
-- ============================================================================

SELECT '5. Fixing remaining records (40,001+)...' as step;

UPDATE catalog_items
SET cat_num_desc = reverse_hebrew(cat_num_desc)
WHERE id IN (
    SELECT id 
    FROM catalog_items 
    ORDER BY id 
    OFFSET 40000
)
AND cat_num_desc IS NOT NULL;

-- ============================================================================
-- VERIFICATION: Check sample Toyota records
-- ============================================================================

SELECT '6. Verification - Sample Toyota records after fix:' as step;

SELECT 
    cat_num_desc,
    make,
    model,
    part_name
FROM catalog_items
WHERE make = 'טויוטה'
ORDER BY RANDOM()
LIMIT 5;

-- Check if we can now see model names correctly
SELECT '7. Checking for model names in cat_num_desc:' as step;

SELECT 
    cat_num_desc,
    CASE 
        WHEN cat_num_desc LIKE '%קורולה%' THEN '✅ קורולה found'
        WHEN cat_num_desc LIKE '%קאמרי%' THEN '✅ קאמרי found'
        WHEN cat_num_desc LIKE '%פריוס%' THEN '✅ פריוס found'
        WHEN cat_num_desc LIKE '%היילקס%' THEN '✅ היילקס found'
        ELSE 'Other model'
    END as model_check
FROM catalog_items
WHERE make = 'טויוטה'
    AND (
        cat_num_desc LIKE '%קורולה%' OR
        cat_num_desc LIKE '%קאמרי%' OR
        cat_num_desc LIKE '%פריוס%' OR
        cat_num_desc LIKE '%היילקס%'
    )
LIMIT 10;

SELECT '=== CAT_NUM_DESC REVERSAL FIX COMPLETE ===' as step;

-- ============================================================================
-- NEXT STEP: After this completes successfully, run improved extraction
-- ============================================================================
