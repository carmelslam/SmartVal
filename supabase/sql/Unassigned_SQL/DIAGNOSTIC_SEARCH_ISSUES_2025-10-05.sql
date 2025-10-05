-- ============================================================================
-- DIAGNOSTIC: Search Issues - Reversal, Synonyms, Advanced Search
-- Date: 2025-10-05 (Session 4)
-- Purpose: Diagnose all current search-related issues
-- ============================================================================

SELECT '=== DIAGNOSTIC START ===' as section;

-- ============================================================================
-- CHECK 1: Full String Reversal (Display Order Issue)
-- ============================================================================

SELECT '--- CHECK 1: Full String Reversal Status ---' as check_name;

-- Count records with full string reversal
SELECT 
    'Full string reversal count:' as metric,
    COUNT(CASE 
        WHEN cat_num_desc LIKE 'לירג %' OR  -- reversed גריל
             cat_num_desc LIKE 'ךמות %' OR  -- reversed תומך
             cat_num_desc LIKE '%(םלשומ)%' OR -- reversed (מושלם)
             cat_num_desc ~ '\d{2}-\d{2}$'   -- year at end (wrong position)
        THEN 1 
    END) as reversed_count,
    COUNT(*) as total,
    ROUND(COUNT(CASE 
        WHEN cat_num_desc LIKE 'לירג %' OR 
             cat_num_desc LIKE 'ךמות %' OR 
             cat_num_desc LIKE '%(םלשומ)%' OR 
             cat_num_desc ~ '\d{2}-\d{2}$'
        THEN 1 
    END)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2) as percentage
FROM catalog_items
WHERE cat_num_desc IS NOT NULL;

-- Sample of reversed records
SELECT 
    'Sample of full-string reversed records:' as info,
    cat_num_desc as reversed_display,
    reverse(cat_num_desc) as would_be_corrected,
    pcode
FROM catalog_items
WHERE (cat_num_desc LIKE 'לירג %' OR 
       cat_num_desc LIKE 'ךמות %' OR 
       cat_num_desc LIKE '%(םלשומ)%' OR
       cat_num_desc ~ '\d{2}-\d{2}$')
  AND cat_num_desc IS NOT NULL
LIMIT 10;

-- ============================================================================
-- CHECK 2: Year Reversal (810 instead of 018)
-- ============================================================================

SELECT '--- CHECK 2: Year Reversal Status ---' as check_name;

-- Count reversed years in extracted_year
SELECT 
    'Reversed years count:' as metric,
    COUNT(CASE 
        WHEN extracted_year ~ '^\d10$' OR  -- 810, 910, etc.
             extracted_year ~ '^\d{3,}$'    -- 3+ digits (should be 2)
        THEN 1 
    END) as reversed_count,
    COUNT(CASE WHEN extracted_year IS NOT NULL THEN 1 END) as total_with_year,
    ROUND(COUNT(CASE 
        WHEN extracted_year ~ '^\d10$' OR extracted_year ~ '^\d{3,}$'
        THEN 1 
    END)::NUMERIC / NULLIF(COUNT(CASE WHEN extracted_year IS NOT NULL THEN 1 END), 0) * 100, 2) as percentage
FROM catalog_items;

-- Sample of reversed years
SELECT 
    'Sample of reversed years:' as info,
    cat_num_desc,
    extracted_year as current_wrong,
    reverse(extracted_year) as would_be_correct,
    year_from,
    year_to
FROM catalog_items
WHERE (extracted_year ~ '^\d10$' OR extracted_year ~ '^\d{3,}$')
  AND extracted_year IS NOT NULL
LIMIT 10;

-- ============================================================================
-- CHECK 3: Synonym Search Test (כנף אחורית צד שמאל vs שמאלית)
-- ============================================================================

SELECT '--- CHECK 3: Synonym Search Test ---' as check_name;

-- Test 1: Exact match (should fail with current search)
SELECT 
    'Test 1: Exact search "כנף אחורית צד שמאל"' as test,
    COUNT(*) as result_count
FROM catalog_items
WHERE cat_num_desc ILIKE '%כנף אחורית צד שמאל%';

-- Test 2: Database has "שמאלית" variant
SELECT 
    'Test 2: Database has "כנף אחורית שמאלית"' as test,
    COUNT(*) as result_count
FROM catalog_items
WHERE cat_num_desc ILIKE '%כנף אחורית שמאלית%';

-- Test 3: Show actual data variations
SELECT 
    'Sample variations in database:' as info,
    cat_num_desc,
    CASE 
        WHEN cat_num_desc ILIKE '%שמאלית%' THEN 'Uses: שמאלית'
        WHEN cat_num_desc ILIKE '%צד שמאל%' THEN 'Uses: צד שמאל'
        WHEN cat_num_desc ILIKE '%שמ''%' THEN 'Uses: שמ'''
        ELSE 'Other format'
    END as format_used
FROM catalog_items
WHERE cat_num_desc ~ '(שמאל|ימין|קדמ|אחור)' 
  AND cat_num_desc ~ 'כנף'
LIMIT 15;

-- ============================================================================
-- CHECK 4: Common Synonym Variations in Database
-- ============================================================================

SELECT '--- CHECK 4: Synonym Variations Analysis ---' as check_name;

-- Side variations
SELECT 
    'Side variations:' as category,
    COUNT(CASE WHEN cat_num_desc ILIKE '%שמאלית%' THEN 1 END) as "שמאלית_count",
    COUNT(CASE WHEN cat_num_desc ILIKE '%צד שמאל%' THEN 1 END) as "צד_שמאל_count",
    COUNT(CASE WHEN cat_num_desc ILIKE '%שמ''%' THEN 1 END) as "שמא_abbrev_count",
    COUNT(CASE WHEN cat_num_desc ILIKE '%ימנית%' THEN 1 END) as "ימנית_count",
    COUNT(CASE WHEN cat_num_desc ILIKE '%צד ימין%' THEN 1 END) as "צד_ימין_count",
    COUNT(CASE WHEN cat_num_desc ILIKE '%ימ''%' THEN 1 END) as "ימא_abbrev_count"
FROM catalog_items;

-- Position variations
SELECT 
    'Position variations:' as category,
    COUNT(CASE WHEN cat_num_desc ILIKE '%קדמי%' THEN 1 END) as "קדמי_count",
    COUNT(CASE WHEN cat_num_desc ILIKE '%קידמי%' THEN 1 END) as "קידמי_count",
    COUNT(CASE WHEN cat_num_desc ILIKE '%קדמית%' THEN 1 END) as "קדמית_count",
    COUNT(CASE WHEN cat_num_desc ILIKE '%קד''%' THEN 1 END) as "קדא_abbrev_count",
    COUNT(CASE WHEN cat_num_desc ILIKE '%אחורי%' THEN 1 END) as "אחורי_count",
    COUNT(CASE WHEN cat_num_desc ILIKE '%אחורית%' THEN 1 END) as "אחורית_count",
    COUNT(CASE WHEN cat_num_desc ILIKE '%אח''%' THEN 1 END) as "אחא_abbrev_count"
FROM catalog_items;

-- ============================================================================
-- CHECK 5: Current Search Function Test
-- ============================================================================

SELECT '--- CHECK 5: Current Search Function Tests ---' as check_name;

-- Test current search with user's query
SELECT 
    'Test: smart_parts_search with כנף אחורית צד שמאל' as test,
    COUNT(*) as result_count
FROM smart_parts_search(
    free_query_param := 'כנף אחורית צד שמאל'
);

-- Test with database variant
SELECT 
    'Test: smart_parts_search with כנף אחורית שמאלית' as test,
    COUNT(*) as result_count
FROM smart_parts_search(
    free_query_param := 'כנף אחורית שמאלית'
);

-- Test with just "כנף"
SELECT 
    'Test: smart_parts_search with just כנף' as test,
    COUNT(*) as result_count
FROM smart_parts_search(
    free_query_param := 'כנף'
);

-- ============================================================================
-- CHECK 6: Advanced Search Parameters Test
-- ============================================================================

SELECT '--- CHECK 6: Advanced Search Test ---' as check_name;

-- Test with family filter
SELECT 
    'Advanced test: Family + Part' as test,
    COUNT(*) as result_count
FROM smart_parts_search(
    family_param := 'דלתות וכנפיים',
    part_param := 'כנף'
);

-- Test with make filter
SELECT 
    'Advanced test: Make + Part' as test,
    COUNT(*) as result_count
FROM smart_parts_search(
    make_param := 'טויוטה',
    part_param := 'כנף'
);

-- Test with all filters
SELECT 
    'Advanced test: Make + Model + Part' as test,
    COUNT(*) as result_count
FROM smart_parts_search(
    make_param := 'טויוטה',
    model_param := 'קורולה',
    part_param := 'כנף'
);

-- ============================================================================
-- CHECK 7: Data Quality Check
-- ============================================================================

SELECT '--- CHECK 7: Data Quality Status ---' as check_name;

SELECT 
    'Data quality metrics:' as metric,
    COUNT(*) as total_records,
    COUNT(CASE WHEN part_name IS NOT NULL THEN 1 END) as has_part_name,
    COUNT(CASE WHEN part_family IS NOT NULL AND part_family != 'לא מוגדר' THEN 1 END) as has_part_family,
    COUNT(CASE WHEN extracted_year IS NOT NULL THEN 1 END) as has_year,
    COUNT(CASE WHEN model IS NOT NULL THEN 1 END) as has_model,
    ROUND(COUNT(CASE WHEN part_name IS NOT NULL THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2) as part_name_pct,
    ROUND(COUNT(CASE WHEN extracted_year IS NOT NULL THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2) as year_pct
FROM catalog_items;

-- ============================================================================
-- CHECK 8: Check if Previous Fixes Were Applied
-- ============================================================================

SELECT '--- CHECK 8: Function Status Check ---' as check_name;

-- Check if reversal functions exist
SELECT 
    'Reversal functions status:' as check_type,
    COUNT(CASE WHEN proname = 'reverse_hebrew_smart' THEN 1 END) as has_reverse_hebrew_smart,
    COUNT(CASE WHEN proname = 'is_hebrew_reversed' THEN 1 END) as has_is_hebrew_reversed,
    COUNT(CASE WHEN proname = 'is_full_string_reversed' THEN 1 END) as has_is_full_string_reversed,
    COUNT(CASE WHEN proname = 'auto_fix_and_extract' THEN 1 END) as has_auto_fix_and_extract
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

SELECT '=== DIAGNOSTIC COMPLETE ===' as section;
