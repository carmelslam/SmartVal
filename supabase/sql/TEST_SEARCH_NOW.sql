-- TEST SEARCH WITH CURRENT SETUP
-- This will show exactly what the search returns

-- 1. Test searching for door (דלת) - the way it's stored in DB
SELECT 'Test 1: Search for תלד (reversed דלת)' as test;
SELECT id, cat_num_desc, supplier_name, pcode, price, make, version_date
FROM smart_parts_search(free_query_param := 'תלד', limit_results := 5);

-- 2. Test searching for door (דלת) - normal Hebrew
SELECT 'Test 2: Search for דלת (normal)' as test;
SELECT id, cat_num_desc, supplier_name, pcode, price, make, version_date
FROM smart_parts_search(free_query_param := 'דלת', limit_results := 5);

-- 3. Test make search for Toyota
SELECT 'Test 3: Search for טויוטה' as test;
SELECT id, cat_num_desc, supplier_name, pcode, price, make, version_date
FROM smart_parts_search(make_param := 'טויוטה', limit_results := 5);

-- 4. Check what makes exist
SELECT 'Test 4: Available makes' as test;
SELECT DISTINCT make, COUNT(*) as count
FROM catalog_items
WHERE make IS NOT NULL
GROUP BY make
ORDER BY count DESC
LIMIT 10;