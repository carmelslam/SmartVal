-- DEBUG CASCADING SEARCH LOGIC
-- Test if the cascading actually executes

-- Test 1: Simple make search (should work)
SELECT 'Test 1: Simple make' as test_name;
SELECT make, model, cat_num_desc, price
FROM smart_parts_search(make_param := 'טויוטה')
LIMIT 3;

-- Test 2: Multi-word make (should cascade: "טויוטה יפן" → "טויוטה")
SELECT 'Test 2: Multi-word make cascading' as test_name;
SELECT make, model, cat_num_desc, price
FROM smart_parts_search(make_param := 'טויוטה יפן')
LIMIT 3;

-- Test 3: Multi-word model (should cascade: "קורולה קרוס" → "קורולה")
SELECT 'Test 3: Multi-word model cascading' as test_name;
SELECT make, model, cat_num_desc, price
FROM smart_parts_search(
    make_param := 'טויוטה',
    model_param := 'קורולה קרוס'
)
LIMIT 3;

-- Test 4: Multi-word part (should cascade: "כנף אחורית שמאלית" → "כנף אחורית" → "כנף")
SELECT 'Test 4: Multi-word part cascading' as test_name;
SELECT make, model, cat_num_desc, part_family, price
FROM smart_parts_search(part_param := 'כנף אחורית שמאלית')
LIMIT 3;

-- Test 5: Year cascading (2011 → 011 → 11)
SELECT 'Test 5: Year cascading' as test_name;
SELECT make, model, cat_num_desc, year_from, price
FROM smart_parts_search(
    make_param := 'טויוטה',
    year_param := '2011'
)
LIMIT 3;

-- Test 6: Model code search
SELECT 'Test 6: Model code search' as test_name;
SELECT make, model, cat_num_desc, price
FROM smart_parts_search(
    make_param := 'טויוטה',
    model_code_param := 'ZVG12L'
)
LIMIT 3;

-- Test 7: OEM search
SELECT 'Test 7: OEM search' as test_name;
SELECT make, model, cat_num_desc, oem, price
FROM smart_parts_search(
    oem_param := '5311'
)
LIMIT 3;

-- Test 8: Free query search
SELECT 'Test 8: Free query search' as test_name;
SELECT make, model, cat_num_desc, price
FROM smart_parts_search(
    free_query_param := 'פנס'
)
LIMIT 3;

-- Test 9: Trim search
SELECT 'Test 9: Trim search' as test_name;
SELECT make, model, cat_num_desc, price
FROM smart_parts_search(
    make_param := 'טויוטה',
    trim_param := 'ADVENTURE'
)
LIMIT 3;

-- Test 10: Part family search
SELECT 'Test 10: Part family search' as test_name;
SELECT make, model, cat_num_desc, part_family, price
FROM smart_parts_search(
    family_param := 'פנסים ותאורה'
)
LIMIT 3;

-- Test 11: Combined search (all parameters)
SELECT 'Test 11: Combined search' as test_name;
SELECT make, model, cat_num_desc, year_from, part_family, price
FROM smart_parts_search(
    make_param := 'טויוטה',
    model_param := 'קורולה',
    year_param := '2010',
    part_param := 'פנס',
    family_param := 'פנסים ותאורה'
)
LIMIT 3;

-- Test 12: Source search (חליפי/מקורי)
SELECT 'Test 12: Source search' as test_name;
SELECT make, model, cat_num_desc, availability as source, price
FROM smart_parts_search(
    source_param := 'חליפי'
)
LIMIT 3;

-- Test 13: Data availability check
SELECT 'Test 13: Data availability check' as test_name;
SELECT 
    COUNT(*) FILTER (WHERE make ILIKE '%טויוטה%') as toyota_count,
    COUNT(*) FILTER (WHERE make ILIKE '%טויוטה%' AND model ILIKE '%קורולה%') as corolla_count,
    COUNT(*) FILTER (WHERE cat_num_desc ILIKE '%כנף%') as knaf_count,
    COUNT(*) FILTER (WHERE cat_num_desc ILIKE '%כנף אחורית%') as knaf_achorit_count,
    COUNT(*) FILTER (WHERE year_from = 2011) as year_2011_count,
    COUNT(*) FILTER (WHERE oem IS NOT NULL AND oem != '') as has_oem_count,
    COUNT(*) FILTER (WHERE part_family = 'פנסים ותאורה') as lights_family_count,
    COUNT(*) FILTER (WHERE source = 'חליפי') as chalifi_count,
    COUNT(*) FILTER (WHERE source = 'מקורי') as mekori_count
FROM catalog_items;
