-- ============================================================================
-- COMPREHENSIVE DIAGNOSTIC - October 6, 2025
-- Purpose: Verify all deployed functions, triggers, and data quality
-- Phase: 5 - Parts Search Module
-- ============================================================================

-- ============================================================================
-- SECTION 1: DEPLOYED FUNCTIONS CHECK
-- ============================================================================
SELECT '=== SECTION 1: DEPLOYED FUNCTIONS ===' as section;

SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as parameters,
    pg_get_functiondef(p.oid) as definition_preview
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'smart_parts_search',
    'normalize_search_term',
    'reverse_hebrew',
    'auto_fix_and_extract'
  )
ORDER BY p.proname;

-- ============================================================================
-- SECTION 2: TRIGGERS ON CATALOG_ITEMS
-- ============================================================================
SELECT '=== SECTION 2: ACTIVE TRIGGERS ===' as section;

SELECT 
    t.tgname as trigger_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'catalog_items'
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- ============================================================================
-- SECTION 3: DATA QUALITY METRICS
-- ============================================================================
SELECT '=== SECTION 3: DATA QUALITY ===' as section;

SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT supplier_name) as unique_suppliers,
    COUNT(DISTINCT make) as unique_makes,
    
    -- Field population rates
    ROUND(100.0 * COUNT(model) FILTER (WHERE model IS NOT NULL) / COUNT(*), 1) as model_pct,
    ROUND(100.0 * COUNT(year_from) FILTER (WHERE year_from IS NOT NULL) / COUNT(*), 1) as year_from_pct,
    ROUND(100.0 * COUNT(year_to) FILTER (WHERE year_to IS NOT NULL) / COUNT(*), 1) as year_to_pct,
    ROUND(100.0 * COUNT(part_family) FILTER (WHERE part_family IS NOT NULL) / COUNT(*), 1) as part_family_pct,
    ROUND(100.0 * COUNT(side_position) FILTER (WHERE side_position IS NOT NULL) / COUNT(*), 1) as side_position_pct,
    ROUND(100.0 * COUNT(front_rear) FILTER (WHERE front_rear IS NOT NULL) / COUNT(*), 1) as front_rear_pct,
    
    -- Hebrew reversal check
    COUNT(*) FILTER (WHERE make ~ '^[א-ת]' AND make ~ '[א-ת]$') as hebrew_makes_count,
    COUNT(*) FILTER (WHERE source ~ '^[א-ת]' AND source ~ '[א-ת]$') as hebrew_source_count
FROM catalog_items;

-- ============================================================================
-- SECTION 4: PART FAMILY DISTRIBUTION
-- ============================================================================
SELECT '=== SECTION 4: PART FAMILIES ===' as section;

SELECT 
    part_family,
    COUNT(*) as count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as percentage
FROM catalog_items
WHERE part_family IS NOT NULL
GROUP BY part_family
ORDER BY count DESC
LIMIT 20;

-- ============================================================================
-- SECTION 5: HEBREW TEXT VALIDATION
-- ============================================================================
SELECT '=== SECTION 5: HEBREW TEXT SAMPLES ===' as section;

SELECT 
    make,
    source,
    part_family,
    LEFT(cat_num_desc, 50) as cat_num_desc_sample,
    side_position,
    front_rear
FROM catalog_items
WHERE make IS NOT NULL
LIMIT 10;

-- ============================================================================
-- SECTION 6: SEARCH FUNCTION TEST - SIMPLE
-- ============================================================================
SELECT '=== SECTION 6: SIMPLE SEARCH TEST ===' as section;

-- Test 1: Search by part name only
SELECT 
    'Test 1: Part search (כנף)' as test_name,
    COUNT(*) as result_count
FROM smart_parts_search(
    part_param := 'כנף'
);

-- Test 2: Search by make only
SELECT 
    'Test 2: Make search (טויוטה)' as test_name,
    COUNT(*) as result_count
FROM smart_parts_search(
    make_param := 'טויוטה',
    part_param := 'פנס'
);

-- Test 3: Search with family
SELECT 
    'Test 3: Family search (חלקי מרכב)' as test_name,
    COUNT(*) as result_count
FROM smart_parts_search(
    family_param := 'חלקי מרכב',
    part_param := 'כנף'
);

-- ============================================================================
-- SECTION 7: SEARCH FUNCTION TEST - DETAILED RESULTS
-- ============================================================================
SELECT '=== SECTION 7: DETAILED SEARCH RESULTS ===' as section;

-- Get actual search results with all fields
SELECT 
    supplier_name,
    make,
    model,
    LEFT(cat_num_desc, 60) as description,
    part_family,
    side_position,
    year_from,
    year_to,
    extracted_year,
    model_display,
    availability,
    price,
    pcode,
    oem,
    match_score,
    search_message
FROM smart_parts_search(
    make_param := 'טויוטה',
    part_param := 'פנס',
    limit_results := 5
);

-- ============================================================================
-- SECTION 8: NORMALIZATION FUNCTION TEST
-- ============================================================================
SELECT '=== SECTION 8: NORMALIZATION TESTS ===' as section;

SELECT 
    'Original: אח''' as input,
    normalize_search_term('אח''') as normalized
UNION ALL
SELECT 
    'Original: שמ''',
    normalize_search_term('שמ''')
UNION ALL
SELECT 
    'Original: ימ''',
    normalize_search_term('ימ''')
UNION ALL
SELECT 
    'Original: קד''',
    normalize_search_term('קד''');

-- ============================================================================
-- SECTION 9: YEAR EXTRACTION VALIDATION
-- ============================================================================
SELECT '=== SECTION 9: YEAR EXTRACTION SAMPLES ===' as section;

SELECT 
    cat_num_desc,
    year_from,
    year_to,
    extracted_year,
    model
FROM catalog_items
WHERE year_from IS NOT NULL
  OR year_to IS NOT NULL
LIMIT 10;

-- ============================================================================
-- SECTION 10: ABBREVIATION PATTERNS IN DATABASE
-- ============================================================================
SELECT '=== SECTION 10: ABBREVIATION USAGE ===' as section;

SELECT 
    'אח'' (abbreviated rear)' as pattern,
    COUNT(*) as count
FROM catalog_items
WHERE cat_num_desc LIKE '%אח''%'
UNION ALL
SELECT 
    'אחורי (full rear)',
    COUNT(*)
FROM catalog_items
WHERE cat_num_desc LIKE '%אחורי%'
UNION ALL
SELECT 
    'שמ'' (abbreviated left)',
    COUNT(*)
FROM catalog_items
WHERE cat_num_desc LIKE '%שמ''%'
UNION ALL
SELECT 
    'שמאל (full left)',
    COUNT(*)
FROM catalog_items
WHERE cat_num_desc LIKE '%שמאל%';

-- ============================================================================
-- END OF DIAGNOSTIC
-- ============================================================================
SELECT '=== DIAGNOSTIC COMPLETE ===' as section;
