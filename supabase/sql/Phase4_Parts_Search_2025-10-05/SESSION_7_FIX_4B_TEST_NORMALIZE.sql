-- ============================================================================
-- SESSION 7 - FIX 4B: Test Normalization Against Database
-- Date: 2025-10-05
-- Purpose: Verify normalized patterns actually match database records
-- ============================================================================

-- Test 1: Direct database search WITHOUT normalization (should fail)
SELECT 'Test 1: Search for "כנף אחורית שמאל" WITHOUT normalization' as test;
SELECT pcode, cat_num_desc, part_family
FROM catalog_items
WHERE cat_num_desc ILIKE '%כנף אחורית שמאל%'
LIMIT 5;

-- Test 2: Search WITH normalization using regex (should find results)
SELECT 'Test 2: Search for "כנף אחורית שמאל" WITH normalization' as test;
SELECT pcode, cat_num_desc, part_family
FROM catalog_items
WHERE cat_num_desc ~* normalize_search_term('כנף אחורית שמאל')
LIMIT 5;

-- Test 3: Another example - "פנס קדמי ימין"
SELECT 'Test 3A: WITHOUT normalization' as test;
SELECT pcode, cat_num_desc, part_family
FROM catalog_items
WHERE cat_num_desc ILIKE '%פנס קדמי ימין%'
LIMIT 5;

SELECT 'Test 3B: WITH normalization' as test;
SELECT pcode, cat_num_desc, part_family
FROM catalog_items
WHERE cat_num_desc ~* normalize_search_term('פנס קדמי ימין')
LIMIT 5;

-- Test 4: Show what the normalized pattern looks like
SELECT 
    'Pattern Comparison' as test,
    'כנף אחורית שמאל' as original,
    normalize_search_term('כנף אחורית שמאל') as normalized_pattern;
