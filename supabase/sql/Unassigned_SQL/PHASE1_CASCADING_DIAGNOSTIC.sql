-- PHASE 1: CASCADING DIAGNOSTIC ANALYSIS 
-- Test exact user scenario with proper fallback logic
-- Real example: plate='221-84-003', make='טויוטה יפן', model='COROLLA CROSS', etc.

SELECT '=== PHASE 1: CASCADING FALLBACK DIAGNOSTIC ===' as section;

-- CASCADING FALLBACK LOGIC SPECIFICATION:
-- plate = '221-84-003' - always accept
-- make = 'טויוטה יפן' → fallback to 'טויוטה' if exact not found
-- model = 'COROLLA CROSS' → fallback to 'טויוטה' if not found  
-- model_code = 'ZVG12L-KHXGBW' → fallback to 'COROLLA CROSS' OR 'טויוטה'
-- actual_trim = 'ADVENTURE' → fallback to model_code OR model OR make
-- year_from = 2022 → fallback to make if not found
-- Part name: 'כנף' → show variants if exact not found

-- ============================================================================
-- STEP 1: TEST EXACT MATCHES (WHAT EXISTS IN DATABASE)
-- ============================================================================

SELECT '--- TESTING WHAT EXISTS IN DATABASE ---' as test_section;

-- Test 1: Check if exact make exists
SELECT 
    'Make Exact Match (טויוטה יפן):' as test_name,
    COUNT(*) as count,
    'If 0, should fallback to טויוטה' as fallback_rule
FROM catalog_items 
WHERE make = 'טויוטה יפן';

-- Test 1b: Check fallback make
SELECT 
    'Make Fallback (טויוטה):' as test_name,
    COUNT(*) as count,
    'This should have results' as expected
FROM catalog_items 
WHERE make = 'טויוטה';

-- Test 2: Check if exact model exists
SELECT 
    'Model Exact Match (COROLLA CROSS):' as test_name,
    COUNT(*) as count,
    'If 0, should fallback to make' as fallback_rule
FROM catalog_items 
WHERE make = 'טויוטה' AND model = 'COROLLA CROSS';

-- Test 2b: Check partial model matches
SELECT 
    'Model Partial Matches (COROLLA variations):' as test_name,
    model,
    COUNT(*) as count
FROM catalog_items 
WHERE make = 'טויוטה' 
  AND model ILIKE '%COROLLA%'
GROUP BY model
ORDER BY count DESC;

-- Test 3: Check model_code
SELECT 
    'Model Code Exact (ZVG12L-KHXGBW):' as test_name,
    COUNT(*) as count,
    'If 0, should fallback to model or make' as fallback_rule
FROM catalog_items 
WHERE make = 'טויוטה' AND model_code = 'ZVG12L-KHXGBW';

-- Test 4: Check trim
SELECT 
    'Trim Exact (ADVENTURE):' as test_name,
    COUNT(*) as count,
    'If 0, should fallback through chain' as fallback_rule
FROM catalog_items 
WHERE make = 'טויוטה' AND actual_trim = 'ADVENTURE';

-- Test 5: Check year variations
SELECT 
    'Year 2022 Exact:' as test_name,
    COUNT(*) as count
FROM catalog_items 
WHERE make = 'טויוטה' AND year_from = 2022;

SELECT 
    'Year Patterns (22, 022, 2022):' as test_name,
    extracted_year,
    COUNT(*) as count
FROM catalog_items 
WHERE make = 'טויוטה' 
  AND (extracted_year LIKE '%22%' OR extracted_year = '2022')
GROUP BY extracted_year
ORDER BY count DESC;

-- ============================================================================
-- STEP 2: TEST PART NAME VARIANTS (CRITICAL FOR SEARCH)
-- ============================================================================

SELECT '--- TESTING PART NAME VARIANTS ---' as test_section;

-- Test 6: Exact part name
SELECT 
    'Part Name Exact (כנף):' as test_name,
    COUNT(*) as count
FROM catalog_items 
WHERE make = 'טויוטה' AND part_name = 'כנף';

-- Test 6b: Part name variants in cat_num_desc
SELECT 
    'Part Name in Description (כנף):' as test_name,
    COUNT(*) as count
FROM catalog_items 
WHERE make = 'טויוטה' AND cat_num_desc ILIKE '%כנף%';

-- Test 6c: Show actual part name variations
SELECT 
    'Part Name Variations:' as test_name,
    part_name,
    part_family,
    COUNT(*) as count
FROM catalog_items 
WHERE make = 'טויוטה' 
  AND (part_name ILIKE '%כנף%' OR cat_num_desc ILIKE '%כנף%')
GROUP BY part_name, part_family
ORDER BY count DESC
LIMIT 10;

-- ============================================================================
-- STEP 3: TEST ADVANCED SEARCH FAMILY LOGIC
-- ============================================================================

SELECT '--- TESTING ADVANCED SEARCH FAMILY LOGIC ---' as test_section;

-- Test 7: Family exact match
SELECT 
    'Family Exact (דלת):' as test_name,
    COUNT(*) as count,
    'If 0, should show part name instead' as fallback_rule
FROM catalog_items 
WHERE make = 'טויוטה' AND part_family = 'דלת';

-- Test 7b: Family variations
SELECT 
    'Family Variations (דלת):' as test_name,
    part_family,
    COUNT(*) as count
FROM catalog_items 
WHERE make = 'טויוטה' 
  AND part_family ILIKE '%דלת%'
GROUP BY part_family
ORDER BY count DESC;

-- Test 7c: Part name when family doesn't exist
SELECT 
    'Part Name (דלת) when family fails:' as test_name,
    COUNT(*) as count
FROM catalog_items 
WHERE make = 'טויוטה' AND part_name = 'דלת';

-- ============================================================================
-- STEP 4: TEST CURRENT SEARCH FUNCTION WITH CASCADING
-- ============================================================================

SELECT '--- TESTING CURRENT SEARCH FUNCTION CASCADING ---' as test_section;

-- Test 8: Full complex search (should probably fail)
SELECT 
    'Current Search - Full Complex:' as test_name,
    COUNT(*) as result_count,
    'Expected: Probably 0 (current system broken)' as expected
FROM smart_parts_search(
    make_param := 'טויוטה יפן',
    model_param := 'COROLLA CROSS', 
    year_param := '2022',
    free_query_param := 'כנף',
    limit_results := 10
);

-- Test 8b: Simplified search
SELECT 
    'Current Search - Simplified:' as test_name,
    COUNT(*) as result_count,
    'Expected: Should work' as expected
FROM smart_parts_search(
    make_param := 'טויוטה',
    free_query_param := 'כנף',
    limit_results := 10
);

-- ============================================================================
-- STEP 5: IDENTIFY FALLBACK CHAIN REQUIREMENTS
-- ============================================================================

SELECT '--- FALLBACK CHAIN ANALYSIS ---' as analysis_section;

-- Show what exists at each level for Toyota
SELECT 
    'Toyota Data Levels:' as analysis_type,
    'Make Level' as level,
    COUNT(*) as total_records
FROM catalog_items 
WHERE make = 'טויוטה'

UNION ALL

SELECT 
    'Toyota Data Levels:' as analysis_type,
    'Model Level' as level,
    COUNT(*) as total_records
FROM catalog_items 
WHERE make = 'טויוטה' AND model IS NOT NULL

UNION ALL

SELECT 
    'Toyota Data Levels:' as analysis_type,
    'Model Code Level' as level,
    COUNT(*) as total_records
FROM catalog_items 
WHERE make = 'טויוטה' AND model_code IS NOT NULL

UNION ALL

SELECT 
    'Toyota Data Levels:' as analysis_type,
    'Trim Level' as level,
    COUNT(*) as total_records
FROM catalog_items 
WHERE make = 'טויוטה' AND actual_trim IS NOT NULL

UNION ALL

SELECT 
    'Toyota Data Levels:' as analysis_type,
    'Year Level' as level,
    COUNT(*) as total_records
FROM catalog_items 
WHERE make = 'טויוטה' AND extracted_year IS NOT NULL;

SELECT '=== PHASE 1: CASCADING DIAGNOSTIC COMPLETE ===' as section;

DO $$
BEGIN
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'PHASE 1: CASCADING DIAGNOSTIC COMPLETE';
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'Analysis shows:';
    RAISE NOTICE '1. Which exact matches exist in database';
    RAISE NOTICE '2. What fallback options are available';
    RAISE NOTICE '3. Part name and family variant patterns';
    RAISE NOTICE '4. Current search function limitations';
    RAISE NOTICE '';
    RAISE NOTICE 'Next: Build proper cascading search function';
    RAISE NOTICE 'with intelligent fallback logic';
    RAISE NOTICE '===============================================';
END $$;