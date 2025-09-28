-- DIAGNOSTIC QUERIES TO CHECK EXTRACTION STATUS
-- Run these to see what data you have and what needs to be extracted

-- ============================================================================
-- 1. CHECK CURRENT CATALOG DATA STATE
-- ============================================================================

-- Check how many catalog items you have and their current field status
SELECT 
    COUNT(*) as total_items,
    COUNT(cat_num_desc) as has_description,
    COUNT(oem) as has_oem,
    COUNT(model) as has_model,
    COUNT(model_code) as has_model_code,
    COUNT(part_family) as has_part_family,
    COUNT(year_from) as has_year_from,
    COUNT(year_to) as has_year_to
FROM catalog_items;

-- ============================================================================
-- 2. SAMPLE YOUR CATALOG DESCRIPTIONS
-- ============================================================================

-- Show 10 sample catalog descriptions to understand the patterns
SELECT 
    id,
    make,
    cat_num_desc,
    oem,
    model,
    model_code,
    part_family
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL 
LIMIT 10;

-- ============================================================================
-- 3. CHECK IF EXTRACTION FUNCTIONS EXIST
-- ============================================================================

-- Verify the extraction functions were created
SELECT 
    proname as function_name,
    prosrc as function_exists
FROM pg_proc 
WHERE proname IN (
    'extract_oem_from_desc',
    'extract_year_range_from_desc', 
    'extract_model_from_desc',
    'parse_and_extract_catnumdesc'
);

-- ============================================================================
-- 4. CHECK DICTIONARY TABLES
-- ============================================================================

-- Check if dictionaries were populated
SELECT 'dict_makes' as table_name, COUNT(*) as row_count FROM dict_makes
UNION ALL
SELECT 'dict_models' as table_name, COUNT(*) as row_count FROM dict_models
UNION ALL
SELECT 'dict_parts' as table_name, COUNT(*) as row_count FROM dict_parts
UNION ALL
SELECT 'dict_year_patterns' as table_name, COUNT(*) as row_count FROM dict_year_patterns;

-- ============================================================================
-- 5. TEST EXTRACTION ON SAMPLE DATA
-- ============================================================================

-- Test the extraction functions on a sample description
-- Replace 'YOUR_SAMPLE_DESCRIPTION' with an actual cat_num_desc from your data

-- First, get a sample description:
-- SELECT cat_num_desc FROM catalog_items WHERE cat_num_desc IS NOT NULL LIMIT 1;

-- Then test extraction (uncomment and replace with actual description):
/*
SELECT 
    'Sample extraction test' as test_name,
    extract_oem_from_desc('YOUR_SAMPLE_DESCRIPTION') as extracted_oem,
    extract_model_from_desc('YOUR_SAMPLE_DESCRIPTION') as extracted_model,
    extract_year_range_from_desc('YOUR_SAMPLE_DESCRIPTION') as extracted_years,
    extract_side_from_desc('YOUR_SAMPLE_DESCRIPTION') as extracted_side,
    extract_position_from_desc('YOUR_SAMPLE_DESCRIPTION') as extracted_position,
    extract_part_family_from_desc('YOUR_SAMPLE_DESCRIPTION') as extracted_family;
*/

-- ============================================================================
-- 6. CHECK FOR POTENTIAL HEBREW ENCODING ISSUES
-- ============================================================================

-- Check if Hebrew text is properly encoded
SELECT 
    cat_num_desc,
    length(cat_num_desc) as desc_length,
    cat_num_desc ~ '[\u0590-\u05FF]' as contains_hebrew
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL 
AND (cat_num_desc LIKE '%שמאל%' OR cat_num_desc LIKE '%ימין%' OR cat_num_desc LIKE '%קדמי%' OR cat_num_desc LIKE '%אחורי%')
LIMIT 5;

-- ============================================================================
-- 7. INSTRUCTIONS FOR NEXT STEPS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== EXTRACTION STATUS CHECK COMPLETE ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Review the results above, then:';
    RAISE NOTICE '';
    RAISE NOTICE '1. If functions exist but no data extracted yet:';
    RAISE NOTICE '   CALL extract_all_catnumdesc_data();';
    RAISE NOTICE '   CALL update_year_ranges();';
    RAISE NOTICE '';
    RAISE NOTICE '2. If you see errors, check:';
    RAISE NOTICE '   - Hebrew text encoding';
    RAISE NOTICE '   - Description patterns';
    RAISE NOTICE '   - Function permissions';
    RAISE NOTICE '';
    RAISE NOTICE '3. After extraction, rerun this diagnostic to see changes';
    RAISE NOTICE '';
    RAISE NOTICE '4. Sample descriptions will help tune extraction patterns';
END $$;