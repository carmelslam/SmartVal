-- ============================================================================
-- SESSION 7 - FIX 2: Extract year_range from cat_num_desc
-- Date: 2025-10-05
-- Purpose: Fix 38,034 NULL year_range records by re-running extraction
-- ============================================================================

-- Current problem:
-- - 38,034 records have NULL year_range (78.8% of database)
-- - year_range is EXTRACTED from cat_num_desc patterns (09-13, 016-018, etc.)
-- - Trigger only fires on INSERT/UPDATE, not for existing data
-- - Need to trigger extraction for existing records

-- Solution: Force trigger to run by dummy UPDATE
-- The auto_extract_catalog_data() trigger will extract year_range from cat_num_desc

UPDATE catalog_items
SET id = id  -- Dummy update to fire BEFORE UPDATE trigger
WHERE year_range IS NULL 
  AND cat_num_desc IS NOT NULL;

-- Step 2: Verification - Check populated count
SELECT 
    'After Fix - Year Range Status' as test,
    COUNT(*) as total_records,
    COUNT(year_range) as has_year_range,
    COUNT(*) - COUNT(year_range) as null_year_range,
    ROUND(COUNT(year_range)::NUMERIC / COUNT(*) * 100, 1) as populated_pct
FROM catalog_items;

-- Step 3: Sample year_range values - verify format
SELECT 
    'Sample Year Ranges' as test,
    cat_num_desc,
    year_from,
    year_to,
    year_range,
    CASE 
        WHEN year_range IS NULL THEN '❌ NULL'
        WHEN year_range ~ '^\d{3}-\d{3}$' THEN '✅ CORRECT FORMAT (range)'
        WHEN year_range ~ '^\d{3}$' THEN '✅ CORRECT FORMAT (single)'
        ELSE '❌ WRONG FORMAT'
    END as format_status
FROM catalog_items
WHERE cat_num_desc ~ '\d{2,3}\s*[-–]\s*\d{2,3}'
LIMIT 20;

-- Step 4: Check records that should have year but don't
SELECT 
    'Year Pattern But No Extraction' as test,
    COUNT(*) as records_with_year_pattern,
    COUNT(*) FILTER (WHERE year_range IS NULL) as still_null,
    CASE 
        WHEN COUNT(*) FILTER (WHERE year_range IS NULL) = 0 
        THEN '✅ All year patterns extracted'
        ELSE '⚠️ Some year patterns not extracted'
    END as status
FROM catalog_items
WHERE cat_num_desc ~ '\d{2,3}\s*[-–]\s*\d{2,3}';
