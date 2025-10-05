-- FUNCTION AUDIT - Check existing functions vs requirements
-- This script analyzes what functions exist vs what should exist
-- Based on the documentation requirements

-- ============================================================================
-- SECTION 1: REQUIRED FUNCTIONS LIST (from documentation)
-- ============================================================================

SELECT '=== REQUIRED FUNCTIONS CHECKLIST ===' as section;

-- List of functions that SHOULD exist based on documentation
WITH required_functions AS (
  SELECT unnest(ARRAY[
    'smart_parts_search',
    'reverse_hebrew', 
    'normalize_make',
    'extract_core_part_term',
    'extract_part_name_from_desc',
    'extract_side_from_desc',
    'extract_oem_from_desc',
    'extract_year_range_from_desc',
    'extract_model_from_desc',
    'extract_model_code_from_desc',
    'process_catalog_item',
    'auto_extract_catalog_data',
    'check_catalog_processing_status',
    '_set_supplier_name',
    '_propagate_supplier_name_change'
  ]) as required_function
)
SELECT 
  rf.required_function,
  CASE 
    WHEN p.proname IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status,
  CASE 
    WHEN p.proname IS NOT NULL THEN p.pronargs::text
    ELSE 'N/A'
  END as arg_count,
  CASE 
    WHEN p.proname IS NOT NULL THEN pg_get_function_arguments(p.oid)
    ELSE 'Function not found'
  END as arguments
FROM required_functions rf
LEFT JOIN pg_proc p ON p.proname = rf.required_function
ORDER BY 
  CASE WHEN p.proname IS NOT NULL THEN 1 ELSE 2 END,
  rf.required_function;

-- ============================================================================
-- SECTION 2: EXISTING FUNCTIONS ANALYSIS
-- ============================================================================

SELECT '=== ALL EXISTING CUSTOM FUNCTIONS ===' as section;

-- Find all custom functions (exclude system functions)
SELECT 
  proname as function_name,
  pronargs as arg_count,
  pg_get_function_arguments(oid) as arguments,
  pg_get_function_result(oid) as return_type,
  prokind as function_type,
  provolatile as volatility,
  prosrc IS NOT NULL as has_source
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND (
    proname LIKE '%parts%' OR 
    proname LIKE '%search%' OR 
    proname LIKE '%extract%' OR 
    proname LIKE '%normalize%' OR 
    proname LIKE '%reverse%' OR 
    proname LIKE '%hebrew%' OR
    proname LIKE '%catalog%' OR
    proname LIKE '%supplier%'
  )
ORDER BY proname;

-- ============================================================================
-- SECTION 3: SMART_PARTS_SEARCH DETAILED ANALYSIS
-- ============================================================================

SELECT '=== SMART_PARTS_SEARCH FUNCTION ANALYSIS ===' as section;

-- Get the current smart_parts_search function details
SELECT 
  'Function Signature:' as info_type,
  pg_get_function_arguments(oid) as details
FROM pg_proc 
WHERE proname = 'smart_parts_search'
UNION ALL
SELECT 
  'Return Type:' as info_type,
  pg_get_function_result(oid) as details
FROM pg_proc 
WHERE proname = 'smart_parts_search'
UNION ALL
SELECT 
  'Function Definition Length:' as info_type,
  length(prosrc)::text || ' characters' as details
FROM pg_proc 
WHERE proname = 'smart_parts_search';

-- Show first 1000 characters of the function source
SELECT 
  'Function Source (first 1000 chars):' as info_type,
  substring(prosrc, 1, 1000) || '...' as source_preview
FROM pg_proc 
WHERE proname = 'smart_parts_search';

-- ============================================================================
-- SECTION 4: TRIGGER ANALYSIS
-- ============================================================================

SELECT '=== TRIGGER ANALYSIS ===' as section;

-- Check triggers on catalog_items table
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement,
  CASE 
    WHEN trigger_name LIKE '%process%' OR trigger_name LIKE '%extract%' THEN '✅ EXTRACTION TRIGGER'
    WHEN trigger_name LIKE '%supplier%' THEN '✅ SUPPLIER TRIGGER'
    ELSE '⚠️ OTHER TRIGGER'
  END as trigger_purpose
FROM information_schema.triggers 
WHERE event_object_table = 'catalog_items'
ORDER BY trigger_name;

-- Check if automatic processing trigger exists
SELECT 
  'Automatic Processing Status:' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Automatic triggers exist'
    ELSE '❌ NO automatic triggers found'
  END as status
FROM information_schema.triggers 
WHERE event_object_table = 'catalog_items'
  AND (trigger_name LIKE '%process%' OR trigger_name LIKE '%extract%');

-- ============================================================================
-- SECTION 5: FUNCTION DEPENDENCY CHECK
-- ============================================================================

SELECT '=== FUNCTION DEPENDENCY CHECK ===' as section;

-- Check if functions that depend on each other exist
WITH function_dependencies AS (
  SELECT 
    'smart_parts_search' as main_function,
    unnest(ARRAY['reverse_hebrew', 'normalize_make', 'extract_core_part_term']) as depends_on
  UNION ALL
  SELECT 
    'process_catalog_item' as main_function,
    unnest(ARRAY['extract_part_name_from_desc', 'extract_side_from_desc', 'normalize_make']) as depends_on
)
SELECT 
  fd.main_function,
  fd.depends_on,
  CASE 
    WHEN p1.proname IS NOT NULL AND p2.proname IS NOT NULL THEN '✅ Both exist'
    WHEN p1.proname IS NOT NULL AND p2.proname IS NULL THEN '⚠️ Main exists, dependency missing'
    WHEN p1.proname IS NULL AND p2.proname IS NOT NULL THEN '⚠️ Dependency exists, main missing'
    ELSE '❌ Both missing'
  END as dependency_status
FROM function_dependencies fd
LEFT JOIN pg_proc p1 ON p1.proname = fd.main_function
LEFT JOIN pg_proc p2 ON p2.proname = fd.depends_on
ORDER BY fd.main_function, fd.depends_on;

-- ============================================================================
-- SECTION 6: EXTRACTION FUNCTIONS DETAILED CHECK
-- ============================================================================

SELECT '=== EXTRACTION FUNCTIONS DETAILED CHECK ===' as section;

-- Check each extraction function individually
WITH extraction_functions AS (
  SELECT unnest(ARRAY[
    'extract_oem_from_desc',
    'extract_year_range_from_desc', 
    'extract_model_from_desc',
    'extract_side_from_desc',
    'extract_part_name_from_desc',
    'extract_model_code_from_desc'
  ]) as func_name
)
SELECT 
  ef.func_name,
  CASE 
    WHEN p.proname IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status,
  CASE 
    WHEN p.proname IS NOT NULL THEN 'Args: ' || p.pronargs::text
    ELSE 'Not available'
  END as signature_info,
  CASE 
    WHEN p.proname IS NOT NULL THEN 
      CASE 
        WHEN length(p.prosrc) > 100 THEN '✅ Has implementation'
        ELSE '⚠️ Very short implementation'
      END
    ELSE 'No implementation'
  END as implementation_status
FROM extraction_functions ef
LEFT JOIN pg_proc p ON p.proname = ef.func_name
ORDER BY ef.func_name;

-- ============================================================================
-- SECTION 7: FUNCTION TESTING CAPABILITY
-- ============================================================================

SELECT '=== FUNCTION TESTING READINESS ===' as section;

-- Test if key functions can be called with sample data
DO $$
DECLARE
    test_desc TEXT := 'פנס קדמי ימין טויוטה קורולה 2010-2015 8E0941003';
    result_text TEXT;
BEGIN
    -- Test reverse_hebrew
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'reverse_hebrew') THEN
        EXECUTE 'SELECT reverse_hebrew($1)' INTO result_text USING 'טויוטה';
        RAISE NOTICE 'reverse_hebrew test: % → %', 'טויוטה', result_text;
    ELSE
        RAISE NOTICE 'reverse_hebrew function MISSING';
    END IF;
    
    -- Test normalize_make
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'normalize_make') THEN
        EXECUTE 'SELECT normalize_make($1)' INTO result_text USING 'טויוטה יפן';
        RAISE NOTICE 'normalize_make test: % → %', 'טויוטה יפן', result_text;
    ELSE
        RAISE NOTICE 'normalize_make function MISSING';
    END IF;
    
    -- Test extract_core_part_term
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'extract_core_part_term') THEN
        EXECUTE 'SELECT extract_core_part_term($1)' INTO result_text USING 'פנס ימין';
        RAISE NOTICE 'extract_core_part_term test: % → %', 'פנס ימין', result_text;
    ELSE
        RAISE NOTICE 'extract_core_part_term function MISSING';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Function testing failed: %', SQLERRM;
END $$;

-- ============================================================================
-- SECTION 8: MISSING FUNCTIONS IMPACT ANALYSIS
-- ============================================================================

SELECT '=== MISSING FUNCTIONS IMPACT ANALYSIS ===' as section;

-- Analyze impact of missing functions
WITH missing_analysis AS (
  SELECT 
    'reverse_hebrew' as function_name,
    'Hebrew text display will be incorrect' as impact,
    'HIGH' as severity
  UNION ALL
  SELECT 
    'normalize_make',
    'Make filtering will not work properly (Toyota Japan vs Toyota)',
    'HIGH'
  UNION ALL
  SELECT 
    'extract_core_part_term',
    'Flexible part search will not work',
    'HIGH'
  UNION ALL
  SELECT 
    'process_catalog_item',
    'Automatic data extraction will not happen',
    'CRITICAL'
  UNION ALL
  SELECT 
    'smart_parts_search',
    'Main search functionality will not work',
    'CRITICAL'
)
SELECT 
  ma.function_name,
  ma.impact,
  ma.severity,
  CASE 
    WHEN p.proname IS NOT NULL THEN '✅ Not applicable - function exists'
    ELSE '❌ IMPACT ACTIVE'
  END as current_status
FROM missing_analysis ma
LEFT JOIN pg_proc p ON p.proname = ma.function_name
ORDER BY 
  CASE ma.severity 
    WHEN 'CRITICAL' THEN 1 
    WHEN 'HIGH' THEN 2 
    ELSE 3 
  END,
  ma.function_name;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

SELECT '=== FUNCTION AUDIT SUMMARY ===' as section;

DO $$
DECLARE
    total_required INTEGER := 15; -- Based on required_functions list
    existing_count INTEGER;
    missing_count INTEGER;
    critical_missing INTEGER;
BEGIN
    -- Count existing functions
    SELECT COUNT(*) INTO existing_count
    FROM pg_proc 
    WHERE proname IN (
        'smart_parts_search', 'reverse_hebrew', 'normalize_make', 'extract_core_part_term',
        'extract_part_name_from_desc', 'extract_side_from_desc', 'extract_oem_from_desc',
        'extract_year_range_from_desc', 'extract_model_from_desc', 'process_catalog_item',
        'auto_extract_catalog_data', 'check_catalog_processing_status', '_set_supplier_name'
    );
    
    missing_count := total_required - existing_count;
    
    -- Count critical missing functions
    SELECT COUNT(*) INTO critical_missing
    FROM (VALUES 
        ('smart_parts_search'),
        ('process_catalog_item')
    ) AS critical(func_name)
    WHERE NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = critical.func_name
    );
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'FUNCTION AUDIT SUMMARY';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Total required functions: %', total_required;
    RAISE NOTICE 'Functions found: %', existing_count;
    RAISE NOTICE 'Functions missing: %', missing_count;
    RAISE NOTICE 'Critical functions missing: %', critical_missing;
    RAISE NOTICE 'Completeness: %%%', ROUND((existing_count::float / total_required * 100), 1);
    RAISE NOTICE '==========================================';
    
    IF critical_missing > 0 THEN
        RAISE NOTICE 'STATUS: CRITICAL - Core search functionality likely broken';
    ELSIF missing_count > 5 THEN
        RAISE NOTICE 'STATUS: DEGRADED - Some features will not work properly';
    ELSIF missing_count > 0 THEN
        RAISE NOTICE 'STATUS: MINOR ISSUES - Most functionality should work';
    ELSE
        RAISE NOTICE 'STATUS: COMPLETE - All required functions present';
    END IF;
    
    RAISE NOTICE '==========================================';
END $$;