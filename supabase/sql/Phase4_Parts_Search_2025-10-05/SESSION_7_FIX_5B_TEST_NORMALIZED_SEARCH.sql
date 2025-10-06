-- ============================================================================
-- SESSION 7 - FIX 5B: Test Normalization in Real Searches
-- Date: 2025-10-05
-- Purpose: Verify abbreviation normalization works in actual search
-- ============================================================================

-- Test 1: Search with FULL words (UI sends) - should find abbreviated data
SELECT 'Test 1: כנף אחורית צד שמאל (full words from UI)' as test;
SELECT pcode, cat_num_desc, make, part_family, price
FROM smart_parts_search(part_param := 'כנף אחורית צד שמאל')
LIMIT 5;

-- Test 2: Search with abbreviated words - should also work
SELECT 'Test 2: כנף אח'' שמ'' (abbreviated - how it exists in DB)' as test;
SELECT pcode, cat_num_desc, make, part_family, price
FROM smart_parts_search(part_param := 'כנף אח'' שמ''')
LIMIT 5;

-- Test 3: Mixed - full word + abbreviation
SELECT 'Test 3: פנס קדמי ימין (full words)' as test;
SELECT pcode, cat_num_desc, make, part_family, price
FROM smart_parts_search(part_param := 'פנס קדמי ימין')
LIMIT 5;

-- Test 4: With make + normalized part search
SELECT 'Test 4: Toyota + כנף אחורית שמאל' as test;
SELECT pcode, cat_num_desc, make, model, part_family, price
FROM smart_parts_search(
    make_param := 'טויוטה',
    part_param := 'כנף אחורית שמאל'
)
LIMIT 5;

-- Test 5: Advanced search with family + normalized part
SELECT 'Test 5: Family פנסים + קדמי ימין' as test;
SELECT pcode, cat_num_desc, make, part_family, price
FROM smart_parts_search(
    family_param := 'פנסים',
    part_param := 'קדמי ימין'
)
LIMIT 5;
