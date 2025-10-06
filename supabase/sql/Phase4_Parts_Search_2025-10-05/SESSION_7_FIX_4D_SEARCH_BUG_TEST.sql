-- ============================================================================
-- SESSION 7 - FIX 4D: Test Part Param Filtering Bug
-- Date: 2025-10-05
-- Purpose: Verify part_param actually filters results
-- ============================================================================

-- Test: Search with SAME make/model but DIFFERENT parts - should return DIFFERENT results

-- Test 1: Search for Toyota + פנס (light)
SELECT 'Test 1: Toyota + פנס' as test;
SELECT pcode, cat_num_desc, make, part_family, price
FROM smart_parts_search(
    make_param := 'טויוטה',
    part_param := 'פנס'
)
LIMIT 5;

-- Test 2: Search for Toyota + כנף (fender)
SELECT 'Test 2: Toyota + כנף' as test;
SELECT pcode, cat_num_desc, make, part_family, price
FROM smart_parts_search(
    make_param := 'טויוטה',
    part_param := 'כנף'
)
LIMIT 5;

-- Test 3: Search for Toyota + מגן (bumper)
SELECT 'Test 3: Toyota + מגן' as test;
SELECT pcode, cat_num_desc, make, part_family, price
FROM smart_parts_search(
    make_param := 'טויוטה',
    part_param := 'מגן'
)
LIMIT 5;

-- Test 4: Compare results - are they different?
SELECT 'Test 4: Verify different results' as test;
WITH 
    panas AS (SELECT pcode FROM smart_parts_search(make_param := 'טויוטה', part_param := 'פנס') LIMIT 5),
    knaf AS (SELECT pcode FROM smart_parts_search(make_param := 'טויוטה', part_param := 'כנף') LIMIT 5)
SELECT 
    (SELECT COUNT(DISTINCT pcode) FROM panas) as panas_count,
    (SELECT COUNT(DISTINCT pcode) FROM knaf) as knaf_count,
    (SELECT COUNT(*) FROM panas p JOIN knaf k ON p.pcode = k.pcode) as overlap,
    CASE 
        WHEN (SELECT COUNT(*) FROM panas p JOIN knaf k ON p.pcode = k.pcode) = 5 
        THEN '❌ BUG: Same results for different parts'
        WHEN (SELECT COUNT(*) FROM panas p JOIN knaf k ON p.pcode = k.pcode) = 0
        THEN '✅ CORRECT: Different results'
        ELSE '⚠️ PARTIAL: Some overlap'
    END as status;
