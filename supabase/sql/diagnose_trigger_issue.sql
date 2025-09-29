-- DIAGNOSE TRIGGER ISSUE
-- Check why automatic extraction didn't work on re-upload

-- ============================================================================
-- 1. CHECK CATALOG STATUS
-- ============================================================================

-- Current catalog status
SELECT 
    'CATALOG STATUS' as check_type,
    COUNT(*) as total_items,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END) as has_descriptions,
    COUNT(CASE WHEN model_code IS NOT NULL AND model_code != '' THEN 1 END) as has_model_code,
    COUNT(CASE WHEN part_family IS NOT NULL AND part_family != '' THEN 1 END) as has_part_family,
    COUNT(CASE WHEN side_position IS NOT NULL AND side_position != '' THEN 1 END) as has_side_position,
    COUNT(CASE WHEN oem IS NOT NULL AND oem != '' THEN 1 END) as has_oem
FROM catalog_items;

-- Sample data to see what was uploaded
SELECT 
    'SAMPLE UPLOADED DATA' as sample_type,
    cat_num_desc,
    model_code,
    part_family,
    side_position,
    oem,
    created_at
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL
LIMIT 5;

-- ============================================================================
-- 2. CHECK IF TRIGGERS EXIST
-- ============================================================================

-- Check if triggers are installed
SELECT 
    'TRIGGER CHECK' as check_type,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'catalog_items'
ORDER BY trigger_name;

-- ============================================================================
-- 3. CHECK IF EXTRACTION FUNCTIONS EXIST
-- ============================================================================

-- Check if extraction functions are available
SELECT 
    'FUNCTION CHECK' as check_type,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name LIKE '%extract%from%desc%'
ORDER BY routine_name;

-- ============================================================================
-- 4. TEST EXTRACTION FUNCTIONS MANUALLY
-- ============================================================================

-- Test with actual data from your catalog
SELECT 
    'MANUAL FUNCTION TEST' as test_type,
    cat_num_desc,
    extract_model_code_from_desc(cat_num_desc) as test_model_code,
    extract_part_family_from_desc(cat_num_desc) as test_part_family,
    extract_side_from_desc(cat_num_desc) as test_side,
    extract_oem_from_desc(cat_num_desc) as test_oem
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL
LIMIT 3;

-- ============================================================================
-- 5. CHECK TABLE STRUCTURE
-- ============================================================================

-- Check if all required columns exist
SELECT 
    'COLUMN CHECK' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'catalog_items'
AND column_name IN ('model_code', 'part_family', 'side_position', 'front_rear', 'year_range', 'actual_trim', 'oem')
ORDER BY column_name;

-- ============================================================================
-- 6. TRIGGER TROUBLESHOOTING
-- ============================================================================

-- If triggers don't exist, recreate them
DO $$
BEGIN
    -- Check if auto_extract_catalog_data function exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'auto_extract_catalog_data'
    ) THEN
        RAISE NOTICE 'ISSUE: auto_extract_catalog_data function is missing!';
        RAISE NOTICE 'SOLUTION: Re-run automatic_extraction_trigger.sql';
    END IF;
    
    -- Check if triggers exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_auto_extract_on_insert'
    ) THEN
        RAISE NOTICE 'ISSUE: Insert trigger is missing!';
        RAISE NOTICE 'SOLUTION: Re-run automatic_extraction_trigger.sql';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== DIAGNOSTIC SUMMARY ===';
    RAISE NOTICE 'Check the results above to identify the issue:';
    RAISE NOTICE '1. Are extraction functions available?';
    RAISE NOTICE '2. Are triggers installed?';
    RAISE NOTICE '3. Do manual function tests work?';
    RAISE NOTICE '4. Are all columns present?';
    RAISE NOTICE '';
END $$;