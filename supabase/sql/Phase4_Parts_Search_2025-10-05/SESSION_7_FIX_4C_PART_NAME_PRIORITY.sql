-- ============================================================================
-- SESSION 7 - FIX 4C: Test Part Name Priority in Search
-- Date: 2025-10-05
-- Purpose: Verify part_name extraction is being used in search
-- ============================================================================

-- Problem: Search ignores part_name field, always searches full cat_num_desc
-- This means "כנף" matches "מגן קדמי עם כנף" same as "כנף אחורית"

-- Test 1: Check part_name population
SELECT 
    'Part Name Population' as test,
    COUNT(*) as total,
    COUNT(part_name) as has_part_name,
    ROUND(COUNT(part_name)::NUMERIC / COUNT(*) * 100, 1) as populated_pct
FROM catalog_items;

-- Test 2: Sample part_name vs cat_num_desc
SELECT 
    'Sample part_name extraction' as test,
    part_name,
    cat_num_desc,
    part_family
FROM catalog_items
WHERE part_name IS NOT NULL
LIMIT 10;

-- Test 3: Search for "כנף" - show difference between part_name match vs cat_num_desc match
SELECT 
    'Test 3A: Records where part_name starts with כנף' as test,
    part_name,
    cat_num_desc,
    part_family,
    CASE 
        WHEN part_name ILIKE 'כנף%' THEN '✅ EXACT part_name match'
        ELSE '⚠️ contains כנף but not main part'
    END as match_type
FROM catalog_items
WHERE cat_num_desc ILIKE '%כנף%'
LIMIT 10;

-- Test 4: Current smart_parts_search for "כנף" (see what it returns)
SELECT 'Test 4: Current search for כנף' as test;
SELECT pcode, cat_num_desc, part_name, part_family, price
FROM smart_parts_search(part_param := 'כנף')
LIMIT 10;

-- Test 5: Show the problem - search should prioritize part_name match
SELECT 
    'Test 5: Priority Issue' as test,
    COUNT(*) FILTER (WHERE part_name ILIKE 'כנף%') as exact_part_name_match,
    COUNT(*) FILTER (WHERE cat_num_desc ILIKE '%כנף%' AND part_name NOT ILIKE 'כנף%') as mentioned_in_desc_only,
    CASE 
        WHEN COUNT(*) FILTER (WHERE part_name ILIKE 'כנף%') > 0 
        THEN '⚠️ Should prioritize part_name matches'
        ELSE '✅ OK'
    END as recommendation
FROM catalog_items
WHERE cat_num_desc ILIKE '%כנף%';
