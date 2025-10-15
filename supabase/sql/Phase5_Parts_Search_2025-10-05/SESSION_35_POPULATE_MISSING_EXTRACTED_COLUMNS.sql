-- ============================================================================
-- SESSION 35: Populate Missing Extracted Columns
-- Date: 2025-10-15
-- 
-- Problem: After fixing RPC timeout, discovered extraction columns are NULL
-- - extracted_year: 0 out of 48,272 records (100% NULL)
-- - model_display: 0 out of 48,272 records (100% NULL)
-- - source: Not being populated (shows NULL instead of מקורי/חלופי)
--
-- Root Cause:
-- The auto_extract_catalog_data() trigger doesn't populate these 3 columns.
-- It only populates: year_from, year_to, part_family, side_position
--
-- Solution:
-- 1. Populate extracted_year from year_from/year_to
-- 2. Populate model_display from model
-- 3. Populate source by checking for מקורי/ORIGINAL/OEM keywords
--
-- This extraction was working before - we need to restore it
-- ============================================================================

-- Step 1: Populate the 3 missing columns for all records
UPDATE catalog_items
SET 
    -- extracted_year: Create from year_from-year_to
    extracted_year = CASE 
        WHEN year_from IS NOT NULL AND year_to IS NOT NULL 
        THEN year_from::TEXT || '-' || year_to::TEXT
        WHEN year_from IS NOT NULL 
        THEN year_from::TEXT
        ELSE NULL
    END,
    
    -- model_display: Use model column value
    model_display = CASE
        WHEN model IS NOT NULL THEN model
        ELSE NULL
    END,
    
    -- source: Determine from cat_num_desc keywords
    source = CASE
        WHEN cat_num_desc ILIKE '%מקורי%' 
             OR cat_num_desc ILIKE '%ORIGINAL%' 
             OR cat_num_desc ILIKE '%OEM%' 
        THEN 'מקורי'
        ELSE 'חלופי'
    END
WHERE extracted_year IS NULL OR model_display IS NULL OR source IS NULL;

-- Step 2: Verify the update
SELECT 
    'After Extraction Fix' as test,
    COUNT(*) as total_records,
    COUNT(extracted_year) as has_extracted_year,
    COUNT(*) - COUNT(extracted_year) as null_extracted_year,
    COUNT(model_display) as has_model_display,
    COUNT(*) - COUNT(model_display) as null_model_display,
    COUNT(source) as has_source,
    COUNT(*) - COUNT(source) as null_source,
    ROUND(COUNT(extracted_year)::NUMERIC / COUNT(*) * 100, 1) as year_pct,
    ROUND(COUNT(model_display)::NUMERIC / COUNT(*) * 100, 1) as model_pct,
    ROUND(COUNT(source)::NUMERIC / COUNT(*) * 100, 1) as source_pct
FROM catalog_items;

-- Step 3: Show sample data to verify
SELECT 
    'Sample After Fix' as test,
    cat_num_desc,
    year_from,
    year_to,
    extracted_year,
    model,
    model_display,
    source,
    CASE 
        WHEN cat_num_desc ILIKE '%מקורי%' THEN '✅ Correct'
        WHEN source = 'חלופי' THEN '✅ Correct'
        ELSE '❌ Wrong'
    END as source_validation
FROM catalog_items
WHERE make = 'טויוטה יפן'
LIMIT 10;

-- ============================================================================
-- IMPORTANT NOTE:
-- This is a ONE-TIME fix to populate existing data.
-- The trigger auto_extract_catalog_data() should be updated to include
-- these 3 columns for future INSERT/UPDATE operations.
-- 
-- TODO for next session: Update trigger to populate these columns automatically
-- ============================================================================
