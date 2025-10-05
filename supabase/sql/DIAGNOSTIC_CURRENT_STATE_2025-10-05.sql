-- ============================================================================
-- COMPREHENSIVE DIAGNOSTIC - Current Deployed State
-- Date: 2025-10-05
-- Purpose: Check what functions/triggers are currently deployed in Supabase
-- ============================================================================

SELECT '=== DIAGNOSTIC START: 2025-10-05 ===' as section;

-- ============================================================================
-- SECTION 1: CHECK SMART_PARTS_SEARCH FUNCTION
-- ============================================================================

SELECT '=== SECTION 1: SMART_PARTS_SEARCH FUNCTION ===' as section;

-- Check if function exists and get signature
SELECT 
    'smart_parts_search signature:' as info,
    pg_get_function_arguments(oid) as function_signature,
    pronargs as parameter_count
FROM pg_proc 
WHERE proname = 'smart_parts_search';

-- Get the first 2000 characters of the function source to see the order
SELECT 
    'Function source (first 2000 chars):' as info,
    substring(prosrc, 1, 2000) || '...' as source_preview
FROM pg_proc 
WHERE proname = 'smart_parts_search';

-- ============================================================================
-- SECTION 2: CHECK TRIGGERS ON catalog_items
-- ============================================================================

SELECT '=== SECTION 2: TRIGGERS ON catalog_items ===' as section;

-- List all triggers on catalog_items table
SELECT 
    tgname as trigger_name,
    CASE tgenabled 
        WHEN 'O' THEN '✅ ENABLED'
        WHEN 'D' THEN '❌ DISABLED'
        ELSE 'UNKNOWN'
    END as status,
    CASE 
        WHEN tgname LIKE '%00%' OR tgname LIKE '%_00_%' THEN '0 - FIRST'
        WHEN tgname LIKE '%01%' OR tgname LIKE '%_01_%' THEN '1 - SECOND'
        ELSE 'UNKNOWN ORDER'
    END as execution_order,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgrelid = 'catalog_items'::regclass
ORDER BY tgname;

-- ============================================================================
-- SECTION 3: CHECK EXTRACTION FUNCTIONS
-- ============================================================================

SELECT '=== SECTION 3: EXTRACTION FUNCTIONS ===' as section;

-- Check if auto-extraction functions exist
SELECT 
    function_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = function_name) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (VALUES 
    ('auto_fix_hebrew_reversal'),
    ('reverse_hebrew'),
    ('fix_hebrew_text'),
    ('process_catalog_item_complete'),
    ('auto_fix_and_extract')
) AS funcs(function_name);

-- ============================================================================
-- SECTION 4: DATA EXTRACTION SUCCESS RATES
-- ============================================================================

SELECT '=== SECTION 4: DATA EXTRACTION SUCCESS RATES ===' as section;

-- Count extraction success rates
SELECT 
    COUNT(*) as total_records,
    COUNT(part_name) as has_part_name,
    COUNT(model) as has_model,
    COUNT(year_from) as has_year_from,
    COUNT(extracted_year) as has_extracted_year,
    COUNT(part_family) as has_part_family,
    COUNT(CASE WHEN part_family != 'לא מוגדר' THEN 1 END) as categorized_family,
    ROUND(COUNT(part_name)::NUMERIC / COUNT(*) * 100, 1) as part_name_pct,
    ROUND(COUNT(model)::NUMERIC / COUNT(*) * 100, 1) as model_pct,
    ROUND(COUNT(year_from)::NUMERIC / COUNT(*) * 100, 1) as year_pct,
    ROUND(COUNT(CASE WHEN part_family != 'לא מוגדר' THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as family_pct
FROM catalog_items;

-- ============================================================================
-- SECTION 5: HEBREW REVERSAL CHECK
-- ============================================================================

SELECT '=== SECTION 5: HEBREW REVERSAL CHECK ===' as section;

-- Sample 10 records to check Hebrew display
SELECT 
    pcode,
    make,
    cat_num_desc,
    part_family,
    CASE 
        WHEN cat_num_desc LIKE '%ןגמ%' OR cat_num_desc LIKE '%תלד%' OR cat_num_desc LIKE '%סנפ%' THEN '❌ REVERSED'
        WHEN cat_num_desc LIKE '%מגן%' OR cat_num_desc LIKE '%דלת%' OR cat_num_desc LIKE '%פנס%' THEN '✅ CORRECT'
        ELSE 'UNKNOWN'
    END as hebrew_status
FROM catalog_items
WHERE cat_num_desc IS NOT NULL
LIMIT 10;

-- Count reversed vs correct
SELECT 
    'Hebrew Text Status:' as check_type,
    COUNT(CASE WHEN cat_num_desc LIKE '%ןגמ%' OR cat_num_desc LIKE '%תלד%' OR cat_num_desc LIKE '%סנפ%' THEN 1 END) as reversed_count,
    COUNT(CASE WHEN cat_num_desc LIKE '%מגן%' OR cat_num_desc LIKE '%דלת%' OR cat_num_desc LIKE '%פנס%' THEN 1 END) as correct_count,
    COUNT(*) as total_checked
FROM catalog_items
WHERE cat_num_desc IS NOT NULL
LIMIT 1000;

-- ============================================================================
-- SECTION 6: TEST CURRENT SEARCH FUNCTION
-- ============================================================================

SELECT '=== SECTION 6: TEST CURRENT SEARCH BEHAVIOR ===' as section;

-- Test 1: Simple make search (Toyota)
SELECT 
    'Test 1: Simple Toyota search' as test_name,
    COUNT(*) as result_count
FROM smart_parts_search(
    make_param := 'טויוטה',
    free_query_param := 'מגן'
);

-- Test 2: Multi-word make search (Toyota Japan)
SELECT 
    'Test 2: Multi-word Toyota Japan search' as test_name,
    COUNT(*) as result_count
FROM smart_parts_search(
    make_param := 'טויוטה יפן',
    free_query_param := 'מגן'
);

-- Test 3: Model search (Corolla)
SELECT 
    'Test 3: Corolla model search' as test_name,
    COUNT(*) as result_count
FROM smart_parts_search(
    make_param := 'טויוטה',
    model_param := 'קורולה',
    free_query_param := 'מגן'
);

-- Test 4: CRITICAL CASCADE TEST - Corolla Cross should fall back to Corolla
SELECT 
    'Test 4: Corolla Cross cascade test (CRITICAL)' as test_name,
    COUNT(*) as result_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ CASCADE WORKING'
        ELSE '❌ CASCADE BROKEN'
    END as cascade_status
FROM smart_parts_search(
    make_param := 'טויוטה',
    model_param := 'קורולה קרוס',
    free_query_param := 'חלקי מרכב'
);

-- Get sample results from cascade test to see what's returned
SELECT 
    'Sample results from Corolla Cross cascade test:' as info,
    cat_num_desc,
    model,
    make
FROM smart_parts_search(
    make_param := 'טויוטה',
    model_param := 'קורולה קרוס',
    free_query_param := 'חלקי מרכב'
)
LIMIT 5;

-- ============================================================================
-- SECTION 7: YEAR EXTRACTION PATTERNS
-- ============================================================================

SELECT '=== SECTION 7: YEAR EXTRACTION ANALYSIS ===' as section;

-- Check year extraction patterns
SELECT 
    'Year extraction patterns:' as info,
    COUNT(*) as total_records,
    COUNT(year_from) as has_year_from,
    COUNT(year_to) as has_year_to,
    COUNT(extracted_year) as has_extracted_year,
    COUNT(year_range) as has_year_range
FROM catalog_items;

-- Sample records with year data
SELECT 
    cat_num_desc,
    year_from,
    year_to,
    extracted_year,
    year_range
FROM catalog_items
WHERE year_from IS NOT NULL OR extracted_year IS NOT NULL
LIMIT 10;

-- ============================================================================
-- SECTION 8: FUNCTION PARAMETER ORDER CHECK
-- ============================================================================

SELECT '=== SECTION 8: FUNCTION PARAMETER ORDER ===' as section;

-- Extract the parameter order from function source
SELECT 
    'Checking parameter order in function body...' as info,
    CASE 
        WHEN prosrc LIKE '%STEP 4: MODEL_CODE%' AND prosrc LIKE '%STEP 6: MODEL%' THEN '❌ WRONG ORDER: MODEL_CODE before MODEL'
        WHEN prosrc LIKE '%STEP 4: MODEL%' AND prosrc LIKE '%STEP 7: MODEL_CODE%' THEN '✅ CORRECT ORDER: MODEL before MODEL_CODE'
        ELSE 'UNKNOWN - Cannot determine from source'
    END as parameter_order_status
FROM pg_proc 
WHERE proname = 'smart_parts_search';

-- ============================================================================
-- DIAGNOSTIC SUMMARY
-- ============================================================================

SELECT '=== DIAGNOSTIC SUMMARY ===' as section;

DO $$
DECLARE
    search_exists BOOLEAN;
    trigger_count INTEGER;
    hebrew_correct_pct NUMERIC;
    cascade_working BOOLEAN;
BEGIN
    -- Check if search function exists
    SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'smart_parts_search') INTO search_exists;
    
    -- Count triggers
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger 
    WHERE tgrelid = 'catalog_items'::regclass;
    
    -- Check cascade
    SELECT COUNT(*) > 0 INTO cascade_working
    FROM smart_parts_search(
        make_param := 'טויוטה',
        model_param := 'קורולה קרוס',
        free_query_param := 'חלקי מרכב'
    );
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'DIAGNOSTIC SUMMARY - 2025-10-05';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Search function exists: %', CASE WHEN search_exists THEN 'YES' ELSE 'NO' END;
    RAISE NOTICE 'Trigger count on catalog_items: %', trigger_count;
    RAISE NOTICE 'Cascade filtering working: %', CASE WHEN cascade_working THEN 'YES ✅' ELSE 'NO ❌' END;
    RAISE NOTICE '==========================================';
    
    IF NOT cascade_working THEN
        RAISE NOTICE 'ACTION REQUIRED: Deploy FIX_MODEL_CASCADE_ORDER.sql';
    END IF;
END $$;

SELECT '=== DIAGNOSTIC COMPLETE ===' as section;
