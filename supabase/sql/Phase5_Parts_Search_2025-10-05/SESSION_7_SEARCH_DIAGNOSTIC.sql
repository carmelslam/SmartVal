-- ============================================================================
-- SESSION 7 - SEARCH DIAGNOSTIC: Check Current Search Function
-- Date: 2025-10-05
-- Purpose: Understand what smart_parts_search() is deployed and how it works
-- ============================================================================

-- Test 1: Check if smart_parts_search function exists
SELECT 
    'Function Check' as test,
    proname as function_name,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'smart_parts_search';

-- Test 2: Simple search - should work
SELECT 'Test 2: Simple part search (פנס)' as test;
SELECT pcode, cat_num_desc, make, model, part_family, price
FROM smart_parts_search(part_param := 'פנס')
LIMIT 5;

-- Test 3: Multi-word search - UI sends full phrase
SELECT 'Test 3: Multi-word search (כנף אחורית)' as test;
SELECT pcode, cat_num_desc, make, model, part_family, price
FROM smart_parts_search(part_param := 'כנף אחורית')
LIMIT 5;

-- Test 4: Normalized vs abbreviated - UI sends "שמאל" but data has "שמ'"
SELECT 'Test 4: Side normalization (שמאל vs שמ'')' as test;
SELECT pcode, cat_num_desc, side_position, price
FROM catalog_items
WHERE cat_num_desc ILIKE '%שמ''%'
LIMIT 5;

-- Test 5: Your exact example - כנף אחורית צד שמאל vs כנף אחורית שמאלית
SELECT 'Test 5A: Data with שמאלית' as test;
SELECT pcode, cat_num_desc, part_family
FROM catalog_items
WHERE cat_num_desc ILIKE '%כנף%אחורית%שמאלית%'
LIMIT 3;

SELECT 'Test 5B: Search for "כנף אחורית צד שמאל"' as test;
SELECT pcode, cat_num_desc, part_family, price
FROM smart_parts_search(part_param := 'כנף אחורית צד שמאל')
LIMIT 5;

-- Test 6: Check if results exist for partial words
SELECT 'Test 6: Partial word patterns in data' as test;
SELECT 
    COUNT(*) FILTER (WHERE cat_num_desc LIKE '%אח''%') as has_ach_abbreviated,
    COUNT(*) FILTER (WHERE cat_num_desc LIKE '%אחורי%') as has_achori_full,
    COUNT(*) FILTER (WHERE cat_num_desc LIKE '%שמ''%') as has_shem_abbreviated,
    COUNT(*) FILTER (WHERE cat_num_desc LIKE '%שמאל%') as has_shemal_full,
    COUNT(*) FILTER (WHERE cat_num_desc LIKE '%ימ''%') as has_yam_abbreviated,
    COUNT(*) FILTER (WHERE cat_num_desc LIKE '%ימין%') as has_yamin_full
FROM catalog_items;
