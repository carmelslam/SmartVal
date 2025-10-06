-- ============================================================================
-- SESSION 7 - FIX 2: Populate year_range for Existing Records
-- Date: 2025-10-05
-- Purpose: Fix 38,034 NULL year_range records (78.8% of database)
-- ============================================================================

-- Current problem:
-- - 38,034 records have year_from/year_to BUT year_range is NULL
-- - UI displays year_range column, shows "לא מוגדר" when NULL
-- - Trigger only sets year_range on INSERT/UPDATE, not for existing data

-- Step 1: Populate year_range from existing year_from/year_to
UPDATE catalog_items
SET year_range = CASE
    -- Both years exist and valid
    WHEN year_from IS NOT NULL AND year_to IS NOT NULL 
         AND year_from >= 1990 AND year_to >= 1990
         AND year_from <= year_to THEN
        -- Format: 2016 → 016, 2023 → 023 (3-digit with leading zeros)
        LPAD((year_from % 100)::TEXT, 3, '0') || '-' || LPAD((year_to % 100)::TEXT, 3, '0')
    
    -- Only year_from exists
    WHEN year_from IS NOT NULL AND year_from >= 1990 THEN
        LPAD((year_from % 100)::TEXT, 3, '0')
    
    -- Otherwise keep NULL
    ELSE NULL
END
WHERE year_range IS NULL 
  AND (year_from IS NOT NULL OR year_to IS NOT NULL);

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
    year_from,
    year_to,
    year_range,
    CASE 
        WHEN year_range IS NULL THEN '❌ NULL'
        WHEN year_range ~ '^\d{3}-\d{3}$' THEN '✅ CORRECT FORMAT'
        WHEN year_range ~ '^\d{3}$' THEN '✅ CORRECT FORMAT (single year)'
        ELSE '❌ WRONG FORMAT'
    END as format_status
FROM catalog_items
WHERE year_from IS NOT NULL OR year_to IS NOT NULL
LIMIT 20;

-- Step 4: Count records with wrong/missing year_range
SELECT 
    'Year Range Quality Check' as test,
    COUNT(*) FILTER (WHERE year_range IS NULL AND year_from IS NOT NULL) as should_have_year_range,
    COUNT(*) FILTER (WHERE year_range IS NOT NULL) as has_year_range,
    CASE 
        WHEN COUNT(*) FILTER (WHERE year_range IS NULL AND year_from IS NOT NULL) = 0 
        THEN '✅ All records with year_from have year_range'
        ELSE '❌ Some records still missing year_range'
    END as status
FROM catalog_items;
