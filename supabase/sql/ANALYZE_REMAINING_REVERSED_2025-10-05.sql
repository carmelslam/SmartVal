-- ============================================================================
-- ANALYZE REMAINING REVERSED - Find patterns we missed
-- Date: 2025-10-05
-- Purpose: Identify what reversed patterns still exist in 2,700 records
-- ============================================================================

SELECT '=== ANALYZING REMAINING REVERSED ===' as section;

-- ============================================================================
-- Find sample of still-reversed records
-- ============================================================================

SELECT 'Sample of still-reversed records:' as info;

SELECT 
    pcode,
    cat_num_desc,
    make,
    model,
    part_family
FROM catalog_items
WHERE is_hebrew_reversed(cat_num_desc) = TRUE
LIMIT 20;

-- ============================================================================
-- Find common reversed patterns we missed
-- ============================================================================

SELECT 'Common reversed patterns in remaining 2,700:' as info;

SELECT 
    substring(cat_num_desc, 1, 20) as pattern_sample,
    COUNT(*) as occurrence_count
FROM catalog_items
WHERE is_hebrew_reversed(cat_num_desc) = TRUE
GROUP BY substring(cat_num_desc, 1, 20)
ORDER BY COUNT(*) DESC
LIMIT 15;

-- ============================================================================
-- Check for specific reversed words we might have missed
-- ============================================================================

SELECT 'Check for missed reversed words:' as info;

SELECT 
    COUNT(CASE WHEN cat_num_desc LIKE '%הנופכ%' THEN 1 END) as has_knafa_reversed,  -- כנפה
    COUNT(CASE WHEN cat_num_desc LIKE '%רפוב%' THEN 1 END) as has_bofer_reversed,   -- בופר
    COUNT(CASE WHEN cat_num_desc LIKE '%חפ%' THEN 1 END) as has_pach_reversed,      -- פח
    COUNT(CASE WHEN cat_num_desc LIKE '%בכרמ%' THEN 1 END) as has_merkav_reversed,  -- מרכב (already in detection)
    COUNT(CASE WHEN cat_num_desc LIKE '%ריואמ%' THEN 1 END) as has_meair_reversed,  -- מאיר
    COUNT(CASE WHEN cat_num_desc LIKE '%ןוליינ%' THEN 1 END) as has_nylon_reversed, -- ניילון
    COUNT(CASE WHEN cat_num_desc LIKE '%הנש%' THEN 1 END) as has_shana_reversed     -- שנה
FROM catalog_items
WHERE is_hebrew_reversed(cat_num_desc) = TRUE;

SELECT '=== ANALYSIS COMPLETE ===' as section;
