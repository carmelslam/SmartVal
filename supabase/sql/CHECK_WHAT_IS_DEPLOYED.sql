-- Check what's currently deployed in Supabase

-- 1. Check current trigger
SELECT 
    'Current trigger:' as info,
    tgname as trigger_name,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgname = 'hebrew_reversal_trigger';

-- 2. Check current search function signature
SELECT 
    'Current search function:' as info,
    proname as function_name,
    pg_get_functiondef(oid) as has_definition
FROM pg_proc 
WHERE proname = 'smart_parts_search';

-- 3. Test current data state - check a door row
SELECT 
    'Current door data:' as test,
    pcode,
    cat_num_desc,
    part_family,
    year_range,
    extracted_year
FROM catalog_items
WHERE pcode = 'VBP42072661';

-- 4. Test search function output
SELECT 
    'Search function output:' as test,
    cat_num_desc,
    part_family,
    extracted_year
FROM smart_parts_search(
    make_param := 'טויוטה',
    free_query_param := 'דלת'
)
LIMIT 1;
