-- COMPREHENSIVE FUNCTION TEST
-- Test all functions to see what's actually working and why UI shows 0 results

SELECT '=== COMPREHENSIVE FUNCTION TEST ===' as section;

-- ============================================================================
-- TEST 1: CHECK IF FUNCTIONS EXIST
-- ============================================================================

SELECT '=== FUNCTION EXISTENCE CHECK ===' as test_section;

SELECT 
    'Function Deployment Status:' as check_type,
    proname as function_name,
    pg_get_function_identity_arguments(oid) as parameters,
    CASE 
        WHEN proname = 'smart_parts_search' THEN '🔍 Main search function'
        WHEN proname = 'fix_hebrew_text' THEN '🔤 Hebrew fix function'  
        WHEN proname = 'process_catalog_item_complete' THEN '⚙️ Trigger function'
        ELSE '📋 Other function'
    END as function_type
FROM pg_proc 
WHERE proname IN ('smart_parts_search', 'fix_hebrew_text', 'process_catalog_item_complete')
ORDER BY proname;

-- ============================================================================
-- TEST 2: CHECK BASIC DATA AVAILABILITY
-- ============================================================================

SELECT '=== DATA AVAILABILITY CHECK ===' as test_section;

-- Basic record count
SELECT 
    'Total Records:' as check_type,
    COUNT(*) as count,
    'Should be > 40000' as expected
FROM catalog_items;

-- Records with basic fields
SELECT 
    'Records with make:' as check_type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM catalog_items), 1) as percentage
FROM catalog_items 
WHERE make IS NOT NULL AND make != '';

SELECT 
    'Records with cat_num_desc:' as check_type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM catalog_items), 1) as percentage
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL AND cat_num_desc != '';

-- Sample makes to see what we have
SELECT 
    'Sample Makes:' as check_type,
    make,
    COUNT(*) as count
FROM catalog_items 
WHERE make IS NOT NULL 
GROUP BY make 
ORDER BY count DESC 
LIMIT 10;

-- ============================================================================
-- TEST 3: TEST HEBREW FIX FUNCTION
-- ============================================================================

SELECT '=== HEBREW FIX FUNCTION TEST ===' as test_section;

-- Test Hebrew fix function directly
SELECT 
    'Hebrew Fix Function Test:' as test_type,
    'הלהת' as input,
    fix_hebrew_text('הלהת') as output,
    CASE 
        WHEN fix_hebrew_text('הלהת') = 'תלדה' THEN '✅ Working correctly'
        ELSE '❌ Not working correctly'
    END as status;

-- ============================================================================
-- TEST 4: TEST SEARCH FUNCTION WITH SIMPLE QUERIES
-- ============================================================================

SELECT '=== SIMPLE SEARCH FUNCTION TESTS ===' as test_section;

-- Test 1: No parameters (should return all records)
SELECT 
    'Test 1 - No parameters:' as test_name,
    COUNT(*) as result_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Returns results'
        ELSE '❌ Returns 0 results'
    END as status
FROM smart_parts_search(limit_results := 10);

-- Test 2: Search by common make
SELECT 
    'Test 2 - Common make search:' as test_name,
    COUNT(*) as result_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Returns results'
        ELSE '❌ Returns 0 results' 
    END as status
FROM smart_parts_search(make_param := 'טויוטה', limit_results := 10);

-- Test 3: Search by English make
SELECT 
    'Test 3 - English make search:' as test_name,
    COUNT(*) as result_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Returns results'
        ELSE '❌ Returns 0 results'
    END as status
FROM smart_parts_search(make_param := 'TOYOTA', limit_results := 10);

-- Test 4: Free query search
SELECT 
    'Test 4 - Free query search:' as test_name,
    COUNT(*) as result_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Returns results'
        ELSE '❌ Returns 0 results'
    END as status
FROM smart_parts_search(free_query_param := 'פנס', limit_results := 10);

-- ============================================================================
-- TEST 5: CHECK WHAT DATA ACTUALLY EXISTS
-- ============================================================================

SELECT '=== DATA CONTENT ANALYSIS ===' as test_section;

-- Check what makes actually exist
SELECT 
    'Available Makes Analysis:' as analysis_type,
    make,
    COUNT(*) as count,
    CASE 
        WHEN make LIKE '%טויוטה%' THEN '🚗 Toyota variant'
        WHEN make LIKE '%TOYOTA%' THEN '🚗 Toyota English'
        WHEN make IS NOT NULL THEN '🚗 Other make'
        ELSE '❓ No make'
    END as make_type
FROM catalog_items 
WHERE make IS NOT NULL
GROUP BY make 
ORDER BY count DESC 
LIMIT 15;

-- Check what cat_num_desc looks like
SELECT 
    'Sample cat_num_desc:' as analysis_type,
    cat_num_desc,
    make,
    part_name,
    part_family
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL 
LIMIT 10;

-- ============================================================================
-- TEST 6: SPECIFIC MULTI-WORD SEARCH TESTS
-- ============================================================================

SELECT '=== MULTI-WORD SEARCH TESTS ===' as test_section;

-- Test the problematic searches
SELECT 
    'Multi-word Test 1 (טויוטה יפן):' as test_name,
    COUNT(*) as result_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Fixed - Returns results'
        ELSE '❌ Still broken'
    END as status
FROM smart_parts_search(make_param := 'טויוטה יפן', limit_results := 10);

SELECT 
    'Multi-word Test 2 (פנס איתות):' as test_name,
    COUNT(*) as result_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Fixed - Returns results'
        ELSE '❌ Still broken'
    END as status
FROM smart_parts_search(free_query_param := 'פנס איתות', limit_results := 10);

-- ============================================================================
-- TEST 7: FIELD EXTRACTION STATUS
-- ============================================================================

SELECT '=== FIELD EXTRACTION STATUS ===' as test_section;

SELECT 
    'Field Extraction Status:' as status_type,
    COUNT(*) as total_records,
    COUNT(part_name) as has_part_name,
    COUNT(extracted_year) as has_extracted_year,
    COUNT(model_display) as has_model_display,
    ROUND(COUNT(part_name) * 100.0 / COUNT(*), 1) as part_name_percentage,
    CASE 
        WHEN COUNT(part_name) * 100.0 / COUNT(*) > 50 THEN '✅ Good extraction'
        WHEN COUNT(part_name) * 100.0 / COUNT(*) > 20 THEN '⚠️ Partial extraction'
        ELSE '❌ Poor extraction'
    END as extraction_status
FROM catalog_items;

-- ============================================================================
-- TEST 8: SAMPLE SEARCH RESULTS WITH HEBREW FIX
-- ============================================================================

SELECT '=== SAMPLE SEARCH RESULTS ===' as test_section;

-- Show actual search results to see if Hebrew is fixed
SELECT 
    'Sample Search Results:' as sample_type,
    id,
    cat_num_desc,
    make,
    part_family,
    extracted_year,
    model_display,
    match_score
FROM smart_parts_search(make_param := 'טויוטה', limit_results := 5);

-- ============================================================================
-- FINAL DIAGNOSIS
-- ============================================================================

SELECT '=== FINAL DIAGNOSIS ===' as test_section;

DO $$
DECLARE
    function_count INTEGER;
    total_records INTEGER;
    search_results INTEGER;
    multi_word_results INTEGER;
    extraction_rate NUMERIC;
    diagnosis TEXT;
BEGIN
    -- Check function deployment
    SELECT COUNT(*) INTO function_count 
    FROM pg_proc 
    WHERE proname = 'smart_parts_search';
    
    -- Check basic data
    SELECT COUNT(*) INTO total_records FROM catalog_items;
    
    -- Check simple search
    SELECT COUNT(*) INTO search_results 
    FROM smart_parts_search(make_param := 'טויוטה', limit_results := 5);
    
    -- Check multi-word search
    SELECT COUNT(*) INTO multi_word_results 
    FROM smart_parts_search(make_param := 'טויוטה יפן', limit_results := 5);
    
    -- Check extraction rate
    SELECT COUNT(part_name) * 100.0 / COUNT(*) INTO extraction_rate 
    FROM catalog_items;
    
    -- Determine diagnosis
    IF function_count = 0 THEN
        diagnosis := '❌ CRITICAL: smart_parts_search function not deployed';
    ELSIF total_records = 0 THEN
        diagnosis := '❌ CRITICAL: No data in catalog_items table';
    ELSIF search_results = 0 THEN
        diagnosis := '❌ MAJOR: Search function deployed but returns no results';
    ELSIF multi_word_results = 0 THEN
        diagnosis := '⚠️ PARTIAL: Simple search works but multi-word search broken';
    ELSIF extraction_rate < 20 THEN
        diagnosis := '⚠️ PARTIAL: Search works but field extraction poor';
    ELSE
        diagnosis := '✅ SUCCESS: All systems working correctly';
    END IF;
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'COMPREHENSIVE DIAGNOSIS RESULTS';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Functions deployed: %', function_count;
    RAISE NOTICE 'Total records: %', total_records;
    RAISE NOTICE 'Simple search results: %', search_results;
    RAISE NOTICE 'Multi-word search results: %', multi_word_results;
    RAISE NOTICE 'Field extraction rate: % percent', ROUND(extraction_rate, 1);
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'DIAGNOSIS: %', diagnosis;
    RAISE NOTICE '==========================================';
END $$;

SELECT '=== COMPREHENSIVE TEST COMPLETE ===' as section;