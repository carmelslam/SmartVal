-- ============================================================================
-- VERIFY ALL HEBREW TEXT IS NOW CORRECT
-- Date: 2025-10-02
-- Final check that makes, part_family, and cat_num_desc are all fixed
-- ============================================================================

-- 1. Check makes - should all be correct Hebrew
SELECT 'MAKES CHECK' as section;

SELECT make, COUNT(*) as count
FROM catalog_items
GROUP BY make
ORDER BY count DESC
LIMIT 15;

-- 2. Check part_family - should all be correct Hebrew
SELECT 'PART_FAMILY CHECK' as section;

SELECT part_family, COUNT(*) as count
FROM catalog_items
WHERE part_family IS NOT NULL AND part_family != 'לא מוגדר'
GROUP BY part_family
ORDER BY count DESC
LIMIT 10;

-- 3. Check if cat_num_desc contains model names we can extract
SELECT 'CAT_NUM_DESC EXTRACTION READINESS' as section;

SELECT 
    cat_num_desc,
    make,
    CASE 
        WHEN cat_num_desc LIKE '%קורולה%' THEN 'קורולה (Corolla)'
        WHEN cat_num_desc LIKE '%קאמרי%' THEN 'קאמרי (Camry)'
        WHEN cat_num_desc LIKE '%פריוס%' THEN 'פריוס (Prius)'
        WHEN cat_num_desc LIKE '%היילקס%' THEN 'היילקס (Hilux)'
        WHEN cat_num_desc LIKE '%סיינה%' THEN 'סיינה (Sienna)'
        WHEN cat_num_desc LIKE '%היילנדר%' THEN 'היילנדר (Highlander)'
        ELSE 'Other model'
    END as extractable_model
FROM catalog_items
WHERE make = 'טויוטה'
    AND (
        cat_num_desc LIKE '%קורולה%' OR
        cat_num_desc LIKE '%קאמרי%' OR
        cat_num_desc LIKE '%פריוס%' OR
        cat_num_desc LIKE '%היילקס%' OR
        cat_num_desc LIKE '%סיינה%' OR
        cat_num_desc LIKE '%היילנדר%'
    )
LIMIT 10;

-- 4. Check year patterns are extractable
SELECT 'YEAR PATTERNS CHECK' as section;

SELECT 
    cat_num_desc,
    make,
    year_from,
    year_to,
    CASE 
        WHEN cat_num_desc ~ '\d{2,4}-\d{2,4}' THEN 'Year pattern found'
        ELSE 'No year pattern'
    END as year_extractable
FROM catalog_items
WHERE year_from IS NOT NULL
LIMIT 10;

-- 5. Final summary
SELECT 'SUMMARY' as section;

SELECT 
    'Total records' as metric,
    COUNT(*) as value
FROM catalog_items

UNION ALL

SELECT 
    'Records with model names in cat_num_desc' as metric,
    COUNT(*) as value
FROM catalog_items
WHERE cat_num_desc LIKE '%קורולה%' 
   OR cat_num_desc LIKE '%קאמרי%'
   OR cat_num_desc LIKE '%פריוס%'
   OR cat_num_desc LIKE '%פוקוס%'
   OR cat_num_desc LIKE '%גולף%';
