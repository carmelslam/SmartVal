-- ============================================================================
-- TEST NORMALIZED SEARCH - October 6, 2025
-- Purpose: Verify normalize_search_term() works correctly in actual search
-- ============================================================================

-- Test 1: Search with abbreviated term (should find results)
SELECT 'Test 1: Search with abbreviation אח''' as test;
SELECT 
    LEFT(cat_num_desc, 60) as description,
    part_family,
    side_position,
    price
FROM smart_parts_search(
    part_param := 'אח''',
    limit_results := 3
);

-- Test 2: Search with full word (should find same/similar results)
SELECT 'Test 2: Search with full word אחורי' as test;
SELECT 
    LEFT(cat_num_desc, 60) as description,
    part_family,
    side_position,
    price
FROM smart_parts_search(
    part_param := 'אחורי',
    limit_results := 3
);

-- Test 3: Search with full phrase (UI typical input)
SELECT 'Test 3: Search with full phrase - כנף אחורית שמאל' as test;
SELECT 
    LEFT(cat_num_desc, 60) as description,
    part_family,
    side_position,
    price
FROM smart_parts_search(
    part_param := 'כנף אחורית שמאל',
    limit_results := 5
);

-- Test 4: Search with make + part (full words)
SELECT 'Test 4: Make + Part - טויוטה + פנס קדמי' as test;
SELECT 
    LEFT(cat_num_desc, 60) as description,
    make,
    part_family,
    side_position,
    price
FROM smart_parts_search(
    make_param := 'טויוטה',
    part_param := 'פנס קדמי',
    limit_results := 5
);

-- Test 5: Verify abbreviations in database are found
SELECT 'Test 5: Check what is actually in database' as test;
SELECT 
    LEFT(cat_num_desc, 60) as description,
    part_family
FROM catalog_items
WHERE cat_num_desc LIKE '%אח''%'
  AND cat_num_desc LIKE '%כנף%'
LIMIT 3;

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- Test 1 & 2: Should both return results (normalization makes them equivalent)
-- Test 3: Should return כנף parts with אח' and שמ' in description
-- Test 4: Should return טויוטה parts with קד' and פנס
-- Test 5: Shows actual database content to verify abbreviations exist
-- ============================================================================
