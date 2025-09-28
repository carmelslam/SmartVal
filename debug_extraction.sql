-- DEBUG EXTRACTION ISSUE
-- Let's see what happened and why the table didn't change

-- ============================================================================
-- 1. CHECK IF FUNCTIONS EXIST
-- ============================================================================

SELECT 
    'FUNCTIONS' as check_type,
    routine_name as function_name
FROM information_schema.routines 
WHERE routine_name LIKE 'extract_%_from_desc'
ORDER BY routine_name;

-- ============================================================================
-- 2. CHECK TABLE STRUCTURE
-- ============================================================================

SELECT 
    'COLUMNS' as check_type,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'catalog_items' 
AND column_name IN ('model_code', 'part_family', 'oem', 'model', 'cat_num_desc')
ORDER BY column_name;

-- ============================================================================
-- 3. CHECK CURRENT DATA
-- ============================================================================

SELECT 
    'CURRENT STATUS' as status,
    COUNT(*) as total_items,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END) as has_descriptions,
    COUNT(CASE WHEN oem IS NOT NULL THEN 1 END) as has_oem,
    COUNT(CASE WHEN model_code IS NOT NULL THEN 1 END) as has_model_code
FROM catalog_items;

-- ============================================================================
-- 4. MANUAL TEST OF FUNCTIONS
-- ============================================================================

-- Test extraction functions manually
SELECT 
    'MANUAL TEST' as test_type,
    extract_model_code_from_desc('BMW 3 Series E90 test') as bmw_test,
    extract_model_code_from_desc('Audi A6 C6 test') as audi_test,
    extract_model_code_from_desc('VW Golf MK6 test') as vw_test;

-- ============================================================================
-- 5. SAMPLE CATALOG DATA
-- ============================================================================

SELECT 
    'SAMPLE DATA' as info,
    cat_num_desc,
    oem,
    model_code
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL 
LIMIT 3;

-- ============================================================================
-- 6. TEST UPDATE ON SINGLE ROW
-- ============================================================================

-- Try updating just one row to see if it works
UPDATE catalog_items 
SET model_code = extract_model_code_from_desc(cat_num_desc)
WHERE id = (
    SELECT id FROM catalog_items 
    WHERE cat_num_desc IS NOT NULL 
    LIMIT 1
);

-- Check if that single update worked
SELECT 
    'SINGLE UPDATE TEST' as test_result,
    cat_num_desc,
    model_code,
    extract_model_code_from_desc(cat_num_desc) as should_be
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL 
LIMIT 1;