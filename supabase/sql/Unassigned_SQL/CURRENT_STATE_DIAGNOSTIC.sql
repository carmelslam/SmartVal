-- ============================================================================
-- COMPREHENSIVE DIAGNOSTIC - Current State Assessment
-- Date: 2025-10-02
-- Purpose: Understand exact current state before making any changes
-- ============================================================================

SELECT '=== DIAGNOSTIC STARTING ===' as step;

-- ============================================================================
-- TEST 1: Check which functions are currently deployed
-- ============================================================================
SELECT '1. DEPLOYED FUNCTIONS' as test_section;

SELECT 
    routine_name as function_name,
    string_agg(parameter_name || ' ' || p.data_type, ', ') as parameters
FROM information_schema.routines r
LEFT JOIN information_schema.parameters p 
    ON r.specific_name = p.specific_name
WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
    AND routine_name IN (
        'smart_parts_search',
        'cascading_parts_search',
        'simple_parts_search',
        'advanced_parts_search',
        'fix_hebrew_text',
        'reverse_hebrew',
        'normalize_make',
        'process_catalog_item_complete'
    )
GROUP BY routine_name, r.specific_name
ORDER BY routine_name;

-- ============================================================================
-- TEST 2: Database volume and basic stats
-- ============================================================================
SELECT '2. DATABASE VOLUME' as test_section;

SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT make) as unique_makes,
    COUNT(DISTINCT supplier_name) as unique_suppliers,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM catalog_items;

-- ============================================================================
-- TEST 3: Hebrew text reversal check - Sample makes
-- ============================================================================
SELECT '3. HEBREW REVERSAL CHECK - MAKES' as test_section;

SELECT 
    make,
    COUNT(*) as record_count,
    CASE 
        WHEN make LIKE '%וו.מ.ב%' THEN '❌ REVERSED (should be BMW / מיני)'
        WHEN make LIKE '%ןגווסקלופ%' THEN '❌ REVERSED (should be פולקסווגן)'
        WHEN make LIKE '%סדצרמ%' THEN '❌ REVERSED (should be מרצדס)'
        WHEN make LIKE '%דרופ%' THEN '❌ REVERSED (should be פורד)'
        WHEN make LIKE '%ידוא%' THEN '❌ REVERSED (should be אודי)'
        WHEN make = 'טויוטה' THEN '✅ CORRECT'
        WHEN make = 'קיה' THEN '✅ CORRECT'
        WHEN make = 'יונדאי' THEN '✅ CORRECT'
        ELSE '⚠️ UNKNOWN'
    END as status
FROM catalog_items
WHERE make IS NOT NULL
GROUP BY make
ORDER BY record_count DESC
LIMIT 15;

-- ============================================================================
-- TEST 4: Field extraction quality
-- ============================================================================
SELECT '4. FIELD EXTRACTION QUALITY' as test_section;

SELECT 
    COUNT(*) as total_records,
    
    -- Part extraction
    COUNT(CASE WHEN part_name IS NOT NULL AND part_name != '' THEN 1 END) as has_part_name,
    ROUND(COUNT(CASE WHEN part_name IS NOT NULL AND part_name != '' THEN 1 END) * 100.0 / COUNT(*), 1) as part_name_pct,
    
    COUNT(CASE WHEN part_family IS NOT NULL AND part_family != '' AND part_family != 'לא מוגדר' THEN 1 END) as has_part_family,
    ROUND(COUNT(CASE WHEN part_family IS NOT NULL AND part_family != '' AND part_family != 'לא מוגדר' THEN 1 END) * 100.0 / COUNT(*), 1) as part_family_pct,
    
    -- Car extraction
    COUNT(CASE WHEN model IS NOT NULL AND model != '' THEN 1 END) as has_model,
    ROUND(COUNT(CASE WHEN model IS NOT NULL AND model != '' THEN 1 END) * 100.0 / COUNT(*), 1) as model_pct,
    
    COUNT(CASE WHEN year_from IS NOT NULL THEN 1 END) as has_year,
    ROUND(COUNT(CASE WHEN year_from IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 1) as year_pct,
    
    COUNT(CASE WHEN oem IS NOT NULL AND oem != '' THEN 1 END) as has_oem,
    ROUND(COUNT(CASE WHEN oem IS NOT NULL AND oem != '' THEN 1 END) * 100.0 / COUNT(*), 1) as oem_pct,
    
    COUNT(CASE WHEN side_position IS NOT NULL AND side_position != '' THEN 1 END) as has_side,
    ROUND(COUNT(CASE WHEN side_position IS NOT NULL AND side_position != '' THEN 1 END) * 100.0 / COUNT(*), 1) as side_pct,
    
    -- Source field
    COUNT(CASE WHEN source IS NOT NULL AND source != '' THEN 1 END) as has_source,
    ROUND(COUNT(CASE WHEN source IS NOT NULL AND source != '' THEN 1 END) * 100.0 / COUNT(*), 1) as source_pct,
    
    COUNT(CASE WHEN availability IS NOT NULL AND availability != '' THEN 1 END) as has_availability,
    ROUND(COUNT(CASE WHEN availability IS NOT NULL AND availability != '' THEN 1 END) * 100.0 / COUNT(*), 1) as availability_pct
FROM catalog_items;

-- ============================================================================
-- TEST 5: Source field values analysis
-- ============================================================================
SELECT '5. SOURCE FIELD VALUES' as test_section;

SELECT 
    source,
    COUNT(*) as record_count,
    CASE 
        WHEN source LIKE '%יפילח%' THEN '❌ REVERSED (should be חליפי)'
        WHEN source LIKE '%ירוקמ%' THEN '❌ REVERSED (should be מקורי)'
        WHEN source = 'חליפי' THEN '✅ CORRECT (aftermarket)'
        WHEN source = 'תואם מקורי' THEN '✅ CORRECT (original compatible)'
        WHEN source = 'מקורי' THEN '✅ CORRECT (original)'
        WHEN source IS NULL THEN '❌ NULL'
        ELSE '⚠️ UNKNOWN'
    END as status
FROM catalog_items
GROUP BY source
ORDER BY record_count DESC
LIMIT 10;

-- ============================================================================
-- TEST 6: Sample data inspection - Toyota parts
-- ============================================================================
SELECT '6. SAMPLE TOYOTA DATA' as test_section;

SELECT 
    make,
    model,
    year_from,
    year_to,
    part_name,
    part_family,
    source,
    availability,
    price,
    LEFT(cat_num_desc, 60) as cat_num_desc_sample
FROM catalog_items
WHERE make ILIKE '%טויוטה%'
ORDER BY RANDOM()
LIMIT 5;

-- ============================================================================
-- TEST 7: Test current search function behavior
-- ============================================================================
SELECT '7. CURRENT SEARCH FUNCTION TEST' as test_section;

-- Try calling the current search function - if it fails, that's OK, we'll note it
DO $$
BEGIN
    RAISE NOTICE '7. Testing smart_parts_search function...';
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'smart_parts_search') THEN
        RAISE NOTICE '   Function exists, attempting test query...';
    ELSE
        RAISE NOTICE '   ❌ smart_parts_search function NOT FOUND';
    END IF;
END $$;

-- Simple test query - adjust columns based on what function actually returns
SELECT 
    make,
    model,
    part_name,
    price
FROM smart_parts_search(
    make_param := 'טויוטה',
    free_query_param := 'כנף',
    limit_results := 5
)
LIMIT 3;

-- ============================================================================
-- TEST 8: Check for cascading function existence
-- ============================================================================
SELECT '8. CASCADING FUNCTION CHECK' as test_section;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'cascading_parts_search'
        ) 
        THEN '✅ cascading_parts_search EXISTS'
        ELSE '❌ cascading_parts_search NOT FOUND'
    END as cascading_status;

-- ============================================================================
-- TEST 9: Sample part_family values (check for reversal)
-- ============================================================================
SELECT '9. PART FAMILY VALUES CHECK' as test_section;

SELECT 
    part_family,
    COUNT(*) as count,
    CASE 
        WHEN part_family LIKE '%םייפנכו תותלד%' THEN '❌ REVERSED'
        WHEN part_family = 'דלתות וכנפיים' THEN '✅ CORRECT'
        WHEN part_family = 'לא מוגדר' THEN '⚠️ NOT EXTRACTED'
        ELSE '⚠️ UNKNOWN'
    END as status
FROM catalog_items
WHERE part_family IS NOT NULL
GROUP BY part_family
ORDER BY count DESC
LIMIT 15;

-- ============================================================================
-- TEST 10: Year extraction quality check
-- ============================================================================
SELECT '10. YEAR EXTRACTION QUALITY' as test_section;

SELECT 
    year_from,
    year_to,
    COUNT(*) as count,
    CASE 
        WHEN year_from > 2030 THEN '❌ INVALID (future year)'
        WHEN year_from < 1980 THEN '❌ INVALID (too old)'
        WHEN year_from IS NOT NULL AND year_to IS NOT NULL THEN '✅ VALID RANGE'
        ELSE '⚠️ PARTIAL/MISSING'
    END as status
FROM catalog_items
WHERE year_from IS NOT NULL
GROUP BY year_from, year_to
ORDER BY count DESC
LIMIT 10;

-- ============================================================================
SELECT '=== DIAGNOSTIC COMPLETE ===' as step;
-- ============================================================================
