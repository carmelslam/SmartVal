-- ============================================================================
-- SESSION 35: Check Extraction Status
-- Date: 2025-10-15
-- Problem: Search results showing NULL for extracted_year, model_display, source
-- 
-- DIAGNOSIS QUERIES - Run these to find what's broken
-- ============================================================================

-- 1. Check if extraction trigger exists
SELECT 
    'TRIGGER CHECK' as test,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'catalog_items'
ORDER BY trigger_name;

-- 2. Check if extraction functions exist
SELECT 
    'FUNCTION CHECK' as test,
    proname as function_name,
    prosrc as function_code
FROM pg_proc
WHERE proname LIKE '%extract%'
   OR proname LIKE '%auto%catalog%'
ORDER BY proname;

-- 3. Check sample data - what columns are NULL?
SELECT 
    'DATA SAMPLE' as test,
    id,
    cat_num_desc,
    make,
    model,
    extracted_year,
    year_from,
    year_to,
    model_display,
    part_family,
    side_position,
    CASE 
        WHEN cat_num_desc LIKE '%מקורי%' OR cat_num_desc LIKE '%ORIGINAL%' THEN 'Should be מקורי'
        ELSE 'Should be חלופי'
    END as expected_source
FROM catalog_items
WHERE make = 'טויוטה יפן'
LIMIT 10;

-- 4. Check how many records have NULL extracted values
SELECT 
    'NULL COUNT' as test,
    COUNT(*) as total_records,
    COUNT(extracted_year) as has_year,
    COUNT(*) - COUNT(extracted_year) as null_year,
    COUNT(model_display) as has_model_display,
    COUNT(*) - COUNT(model_display) as null_model_display,
    COUNT(part_family) as has_family,
    COUNT(*) - COUNT(part_family) as null_family,
    COUNT(side_position) as has_side,
    COUNT(*) - COUNT(side_position) as null_side
FROM catalog_items;

-- 5. Check if source column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'catalog_items' 
  AND column_name IN ('source', 'extracted_year', 'model_display', 'part_family', 'side_position', 'year_from', 'year_to')
ORDER BY column_name;

-- ============================================================================
-- INSTRUCTIONS:
-- 1. Run this entire file in Supabase SQL Editor
-- 2. Copy ALL results and send to me
-- 3. I'll tell you which extraction function/trigger to redeploy
-- ============================================================================
