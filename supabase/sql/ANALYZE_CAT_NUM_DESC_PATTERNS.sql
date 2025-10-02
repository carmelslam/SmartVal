-- ============================================================================
-- ANALYZE cat_num_desc PATTERNS FOR EXTRACTION
-- Date: 2025-10-02
-- Purpose: Understand what data is in cat_num_desc to improve extraction
-- ============================================================================

-- Sample 1: Toyota records with cat_num_desc
SELECT 
    cat_num_desc,
    make,
    model,
    year_from,
    year_to,
    model_code,
    actual_trim,
    part_name,
    part_family
FROM catalog_items
WHERE make = 'טויוטה'
ORDER BY RANDOM()
LIMIT 20;

-- Sample 2: Records that HAVE model extracted
SELECT '=== RECORDS WITH MODEL EXTRACTED ===' as section;

SELECT 
    cat_num_desc,
    make,
    model,
    year_from,
    year_to
FROM catalog_items
WHERE model IS NOT NULL AND model != ''
ORDER BY RANDOM()
LIMIT 10;

-- Sample 3: Records that DON'T have model extracted
SELECT '=== RECORDS WITHOUT MODEL ===' as section;

SELECT 
    cat_num_desc,
    make,
    model
FROM catalog_items
WHERE (model IS NULL OR model = '')
    AND make = 'טויוטה'
ORDER BY RANDOM()
LIMIT 10;

-- Sample 4: Check what's in model_code field
SELECT '=== MODEL_CODE ANALYSIS ===' as section;

SELECT 
    model_code,
    COUNT(*) as count
FROM catalog_items
WHERE model_code IS NOT NULL AND model_code != ''
GROUP BY model_code
ORDER BY count DESC
LIMIT 10;

-- Sample 5: Check what's in actual_trim field
SELECT '=== ACTUAL_TRIM ANALYSIS ===' as section;

SELECT 
    actual_trim,
    COUNT(*) as count
FROM catalog_items
WHERE actual_trim IS NOT NULL AND actual_trim != ''
GROUP BY actual_trim
ORDER BY count DESC
LIMIT 10;
