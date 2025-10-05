-- ============================================================================
-- COMPREHENSIVE DIAGNOSTIC - Current Working State Check
-- Date: 2025-10-05
-- Purpose: Identify which deployed functions are WORKING vs BROKEN
-- Run this in Supabase SQL Editor and send results back
-- ============================================================================

SELECT '=== DIAGNOSTIC START: 2025-10-05 ===' as section;

-- ============================================================================
-- SECTION 1: CHECK SEARCH FUNCTION EXISTS AND SIGNATURE
-- ============================================================================

SELECT '=== SECTION 1: SEARCH FUNCTION ===' as section;

SELECT 
    'smart_parts_search' as function_name,
    pg_get_function_arguments(oid) as parameters,
    pronargs as param_count
FROM pg_proc 
WHERE proname = 'smart_parts_search';

-- ============================================================================
-- SECTION 2: CHECK TRIGGERS ON catalog_items
-- ============================================================================

SELECT '=== SECTION 2: TRIGGERS ===' as section;

SELECT 
    tgname as trigger_name,
    CASE tgenabled 
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED'
        ELSE 'UNKNOWN'
    END as status
FROM pg_trigger 
WHERE tgrelid = 'catalog_items'::regclass
ORDER BY tgname;

-- ============================================================================
-- SECTION 3: DATA QUALITY CHECK
-- ============================================================================

SELECT '=== SECTION 3: DATA QUALITY ===' as section;

SELECT 
    COUNT(*) as total_records,
    COUNT(part_name) as has_part_name,
    COUNT(model) as has_model,
    COUNT(year_from) as has_year_from,
    COUNT(year_range) as has_year_range,
    COUNT(part_family) as has_part_family,
    ROUND(COUNT(part_name)::NUMERIC / COUNT(*) * 100, 1) || '%' as part_name_pct,
    ROUND(COUNT(year_range)::NUMERIC / COUNT(*) * 100, 1) || '%' as year_range_pct
FROM catalog_items;

-- ============================================================================
-- SECTION 4: CHECK WORD ORDER IN PART DESCRIPTIONS
-- ============================================================================

SELECT '=== SECTION 4: WORD ORDER CHECK ===' as section;

-- Sample 20 records to check if words are in backwards order
SELECT 
    pcode,
    cat_num_desc,
    part_family,
    'Check if words are backwards (not characters reversed)' as note
FROM catalog_items
WHERE cat_num_desc IS NOT NULL
LIMIT 20;

-- ============================================================================
-- SECTION 5: CHECK YEAR REVERSAL (810 instead of 018)
-- ============================================================================

SELECT '=== SECTION 5: YEAR REVERSAL CHECK ===' as section;

-- Find records with 3-digit years that might be reversed
SELECT 
    cat_num_desc,
    year_from,
    year_to,
    year_range,
    CASE 
        WHEN year_from::text LIKE '%10' AND year_from < 100 THEN 'POSSIBLY REVERSED (ends in 10)'
        WHEN year_from > 100 AND year_from < 1000 THEN 'SUSPICIOUS (3-digit year)'
        ELSE 'OK'
    END as year_status
FROM catalog_items
WHERE year_from IS NOT NULL
LIMIT 30;

-- Count suspicious year patterns
SELECT 
    'Year Pattern Analysis' as analysis,
    COUNT(CASE WHEN year_from < 100 THEN 1 END) as two_digit_years,
    COUNT(CASE WHEN year_from >= 100 AND year_from < 1000 THEN 1 END) as three_digit_years,
    COUNT(CASE WHEN year_from >= 2000 THEN 1 END) as full_years,
    COUNT(CASE WHEN year_from::text LIKE '%10' AND year_from < 100 THEN 1 END) as ends_in_10
FROM catalog_items
WHERE year_from IS NOT NULL;

-- ============================================================================
-- SECTION 6: CHECK SOURCE FIELD REVERSAL
-- ============================================================================

SELECT '=== SECTION 6: SOURCE FIELD CHECK ===' as section;

-- Check if source field has reversed Hebrew
SELECT 
    source,
    COUNT(*) as count,
    CASE 
        WHEN source LIKE '%יפילח%' THEN 'REVERSED (should be חלופי)'
        WHEN source LIKE '%ירוקמ%' THEN 'REVERSED (should be מקורי)'
        WHEN source = 'חלופי' THEN 'CORRECT'
        WHEN source = 'מקורי' THEN 'CORRECT'
        ELSE 'UNKNOWN'
    END as status
FROM catalog_items
WHERE source IS NOT NULL
GROUP BY source
ORDER BY count DESC
LIMIT 10;

-- ============================================================================
-- SECTION 7: TEST SEARCH FUNCTIONALITY
-- ============================================================================

SELECT '=== SECTION 7: SEARCH TESTS ===' as section;

-- Test 1: Simple search
SELECT 
    'Test 1: Simple Toyota search' as test,
    COUNT(*) as results
FROM smart_parts_search(
    make_param := 'טויוטה',
    free_query_param := 'מגן'
);

-- Test 2: Advanced search with multiple parameters including year
SELECT 
    'Test 2: Advanced search (Make+Model+Year+Part)' as test,
    COUNT(*) as results
FROM smart_parts_search(
    make_param := 'טויוטה',
    model_param := 'קורולה',
    year_param := '2010',
    free_query_param := 'פנס'
);

-- Test 3: Cascade test - model that doesn't exist should return results
SELECT 
    'Test 3: Cascade test (Corolla Cross)' as test,
    COUNT(*) as results,
    CASE 
        WHEN COUNT(*) > 0 THEN 'CASCADE WORKING'
        ELSE 'CASCADE BROKEN'
    END as status
FROM smart_parts_search(
    make_param := 'טויוטה',
    model_param := 'קורולה קרוס',
    free_query_param := 'חלקי מרכב'
);

-- ============================================================================
-- SECTION 8: SAMPLE ACTUAL RESULTS FOR INSPECTION
-- ============================================================================

SELECT '=== SECTION 8: SAMPLE RESULTS ===' as section;

-- Get actual sample results to inspect in UI
SELECT 
    pcode,
    cat_num_desc,
    part_family,
    year_from,
    year_to,
    year_range,
    source,
    price,
    make,
    model
FROM smart_parts_search(
    make_param := 'טויוטה',
    model_param := 'קורולה',
    free_query_param := 'פנס'
)
LIMIT 10;

-- ============================================================================
-- DIAGNOSTIC COMPLETE
-- ============================================================================

SELECT '=== DIAGNOSTIC COMPLETE ===' as section;
SELECT 'Please send ALL results back to Claude for analysis' as instruction;
