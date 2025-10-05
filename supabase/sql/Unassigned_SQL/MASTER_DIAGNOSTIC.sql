-- MASTER DIAGNOSTIC - COMPLETE CURRENT STATE ANALYSIS
-- Run this in Supabase SQL Editor to understand exactly what's happening
-- DO NOT MAKE ANY CHANGES - ONLY GATHER INFORMATION

-- ============================================================================
-- SECTION 1: DATABASE TABLE AND SCHEMA VERIFICATION
-- ============================================================================

SELECT '=== 1. TABLE EXISTENCE CHECK ===' as section;

-- Check if catalog_items table exists and get column info
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'catalog_items' 
ORDER BY ordinal_position;

-- ============================================================================
-- SECTION 2: DATA VOLUME AND BASIC STATE
-- ============================================================================

SELECT '=== 2. DATA VOLUME ANALYSIS ===' as section;

-- Total record count
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT supplier_name) as unique_suppliers,
    COUNT(DISTINCT make) as unique_makes,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM catalog_items;

-- Records by supplier
SELECT 
    'Records by Supplier:' as check_type,
    supplier_name,
    COUNT(*) as record_count,
    MIN(created_at) as first_added,
    MAX(created_at) as last_added
FROM catalog_items
GROUP BY supplier_name
ORDER BY record_count DESC;

-- ============================================================================
-- SECTION 3: FIELD POPULATION STATUS
-- ============================================================================

SELECT '=== 3. FIELD EXTRACTION STATUS ===' as section;

-- Check how many records have each extracted field populated
SELECT 
    COUNT(*) as total_records,
    COUNT(cat_num_desc) as has_cat_num_desc,
    COUNT(part_name) as has_part_name,
    COUNT(make) as has_make,
    COUNT(model) as has_model,
    COUNT(model_code) as has_model_code,
    COUNT(trim) as has_trim,
    COUNT(oem) as has_oem,
    COUNT(year_from) as has_year_from,
    COUNT(year_to) as has_year_to,
    COUNT(year_range) as has_year_range,
    COUNT(side_position) as has_side_position,
    COUNT(front_rear) as has_front_rear,
    COUNT(part_family) as has_part_family,
    COUNT(source) as has_source,
    COUNT(price) as has_price,
    
    -- Calculate percentages
    ROUND(COUNT(part_name) * 100.0 / COUNT(*), 1) as part_name_percent,
    ROUND(COUNT(oem) * 100.0 / COUNT(*), 1) as oem_percent,
    ROUND(COUNT(year_from) * 100.0 / COUNT(*), 1) as year_extraction_percent,
    ROUND(COUNT(side_position) * 100.0 / COUNT(*), 1) as side_extraction_percent,
    ROUND(COUNT(part_family) * 100.0 / COUNT(*), 1) as family_extraction_percent
FROM catalog_items;

-- ============================================================================
-- SECTION 4: HEBREW TEXT ENCODING ANALYSIS
-- ============================================================================

SELECT '=== 4. HEBREW TEXT ANALYSIS ===' as section;

-- Sample cat_num_desc entries to check Hebrew encoding
SELECT 
    'Cat_num_desc Samples:' as sample_type,
    id,
    cat_num_desc,
    length(cat_num_desc) as desc_length,
    make,
    model,
    part_family,
    side_position,
    source
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL 
ORDER BY created_at DESC
LIMIT 10;

-- Check for Hebrew character patterns
SELECT 
    'Hebrew Pattern Analysis:' as analysis_type,
    COUNT(*) as total_with_cat_desc,
    COUNT(CASE WHEN cat_num_desc ~ '[א-ת]' THEN 1 END) as contains_hebrew,
    COUNT(CASE WHEN cat_num_desc ILIKE '%ימין%' THEN 1 END) as contains_yamin,
    COUNT(CASE WHEN cat_num_desc ILIKE '%שמאל%' THEN 1 END) as contains_smol,
    COUNT(CASE WHEN cat_num_desc ILIKE '%קדמי%' THEN 1 END) as contains_kadmi,
    COUNT(CASE WHEN cat_num_desc ILIKE '%אחורי%' THEN 1 END) as contains_achori,
    COUNT(CASE WHEN cat_num_desc ILIKE '%פנס%' THEN 1 END) as contains_panas,
    COUNT(CASE WHEN cat_num_desc ILIKE '%דלת%' THEN 1 END) as contains_delet
FROM catalog_items
WHERE cat_num_desc IS NOT NULL;

-- Check make field for Hebrew/reversal issues
SELECT 
    'Make Field Analysis:' as analysis_type,
    make,
    COUNT(*) as count,
    MIN(cat_num_desc) as sample_desc
FROM catalog_items
WHERE make IS NOT NULL
GROUP BY make
ORDER BY count DESC
LIMIT 15;

-- ============================================================================
-- SECTION 5: FUNCTION EXISTENCE CHECK
-- ============================================================================

SELECT '=== 5. FUNCTION DEPLOYMENT STATUS ===' as section;

-- Check which functions exist
SELECT 
    'Function Existence Check:' as check_type,
    proname as function_name,
    pronargs as arg_count,
    prosrc IS NOT NULL as has_source_code
FROM pg_proc 
WHERE proname IN (
    'smart_parts_search',
    'reverse_hebrew',
    'extract_core_part_term',
    'normalize_make',
    'extract_part_name_from_desc',
    'extract_side_from_desc',
    'process_catalog_item',
    'check_catalog_processing_status'
)
ORDER BY proname;

-- Get the actual smart_parts_search function definition if it exists
SELECT 
    'smart_parts_search Function Signature:' as info_type,
    pg_get_function_arguments(oid) as arguments,
    pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'smart_parts_search'
LIMIT 1;

-- ============================================================================
-- SECTION 6: TRIGGER STATUS
-- ============================================================================

SELECT '=== 6. TRIGGER STATUS CHECK ===' as section;

-- Check what triggers exist on catalog_items
SELECT 
    'Catalog_items Triggers:' as trigger_info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'catalog_items';

-- ============================================================================
-- SECTION 7: SAMPLE DATA FOR PATTERN ANALYSIS
-- ============================================================================

SELECT '=== 7. DATA PATTERN SAMPLES ===' as section;

-- Get samples of different part types for pattern analysis
SELECT 
    'Light Parts Sample:' as part_type,
    id,
    cat_num_desc,
    make,
    part_family,
    side_position,
    front_rear,
    oem,
    price
FROM catalog_items
WHERE cat_num_desc ILIKE '%פנס%' OR cat_num_desc ILIKE '%סנפ%'
LIMIT 5;

SELECT 
    'Door Parts Sample:' as part_type,
    id,
    cat_num_desc,
    make,
    part_family,
    side_position,
    front_rear,
    oem,
    price
FROM catalog_items
WHERE cat_num_desc ILIKE '%דלת%' OR cat_num_desc ILIKE '%תלד%'
LIMIT 5;

-- Check Toyota parts specifically (common test case)
SELECT 
    'Toyota Parts Sample:' as part_type,
    id,
    cat_num_desc,
    make,
    model,
    part_family,
    price,
    oem
FROM catalog_items
WHERE make ILIKE '%טויוטה%' OR make ILIKE '%toyota%'
LIMIT 8;

-- ============================================================================
-- SECTION 8: PRICE ANALYSIS (CHECK FOR ASTRONOMICAL PRICES)
-- ============================================================================

SELECT '=== 8. PRICE ANALYSIS ===' as section;

-- Price statistics
SELECT 
    'Price Statistics:' as analysis_type,
    COUNT(price) as records_with_price,
    MIN(price) as min_price,
    MAX(price) as max_price,
    AVG(price)::NUMERIC(10,2) as avg_price,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) as median_price,
    COUNT(CASE WHEN price > 10000 THEN 1 END) as prices_over_10k,
    COUNT(CASE WHEN price > 100000 THEN 1 END) as prices_over_100k
FROM catalog_items
WHERE price IS NOT NULL;

-- Sample high-priced items to check if they're realistic
SELECT 
    'High Price Samples:' as sample_type,
    id,
    cat_num_desc,
    make,
    part_family,
    price,
    supplier_name
FROM catalog_items
WHERE price > 5000
ORDER BY price DESC
LIMIT 10;

-- ============================================================================
-- SECTION 9: SOURCE FIELD ANALYSIS
-- ============================================================================

SELECT '=== 9. SOURCE FIELD ANALYSIS ===' as section;

-- Check source field values
SELECT 
    'Source Field Values:' as analysis_type,
    source,
    COUNT(*) as count,
    MIN(cat_num_desc) as sample_desc
FROM catalog_items
WHERE source IS NOT NULL
GROUP BY source
ORDER BY count DESC;

-- ============================================================================
-- SECTION 10: SEARCH TEST SIMULATION
-- ============================================================================

SELECT '=== 10. BASIC SEARCH SIMULATION ===' as section;

-- Test direct SQL search for common terms
SELECT 
    'Direct Search Test - פנס:' as test_type,
    COUNT(*) as matching_records
FROM catalog_items
WHERE cat_num_desc ILIKE '%פנס%';

SELECT 
    'Direct Search Test - טויוטה:' as test_type,
    COUNT(*) as matching_records
FROM catalog_items
WHERE make ILIKE '%טויוטה%';

-- Test if smart_parts_search function works at all
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'smart_parts_search') THEN
        -- Try to call the function with simple parameters
        RAISE NOTICE 'smart_parts_search function exists - testing...';
    ELSE
        RAISE NOTICE 'smart_parts_search function DOES NOT EXIST';
    END IF;
END $$;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

SELECT '=== DIAGNOSTIC SUMMARY ===' as section;

DO $$
DECLARE
    total_count INTEGER;
    extracted_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Get basic counts
    SELECT COUNT(*) INTO total_count FROM catalog_items;
    SELECT COUNT(*) INTO extracted_count FROM catalog_items WHERE part_name IS NOT NULL;
    SELECT COUNT(*) INTO function_count FROM pg_proc WHERE proname = 'smart_parts_search';
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'DIAGNOSTIC COMPLETE - KEY FINDINGS:';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Total catalog records: %', total_count;
    RAISE NOTICE 'Records with extracted part_name: %', extracted_count;
    RAISE NOTICE 'Extraction percentage: %%%', ROUND(extracted_count * 100.0 / NULLIF(total_count, 0), 1);
    RAISE NOTICE 'smart_parts_search function exists: %', CASE WHEN function_count > 0 THEN 'YES' ELSE 'NO' END;
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Next step: Review all sections above for detailed analysis';
    RAISE NOTICE 'Pay special attention to Hebrew encoding and function status';
    RAISE NOTICE '==========================================';
END $$;