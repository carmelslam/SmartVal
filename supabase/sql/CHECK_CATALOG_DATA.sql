-- CHECK IF CATALOG ITEMS DATA WAS DELETED
-- Run this in Supabase SQL Editor to verify data existence

-- 1. CRITICAL: Check total row count
SELECT '=== CHECKING IF DATA EXISTS ===' as status;
SELECT COUNT(*) as total_records, 
       CASE 
           WHEN COUNT(*) = 0 THEN '❌ NO DATA! TABLE IS EMPTY!'
           WHEN COUNT(*) < 100 THEN '⚠️ Very few records'
           ELSE '✅ Data exists'
       END as status
FROM catalog_items;

-- 2. Check data by date to see when it was added
SELECT '=== DATA BY DATE ===' as status;
SELECT 
    DATE(created_at) as date_added,
    COUNT(*) as records_count,
    MIN(created_at) as earliest,
    MAX(created_at) as latest
FROM catalog_items
GROUP BY DATE(created_at)
ORDER BY date_added DESC;

-- 3. Check if we have any supplier data
SELECT '=== SUPPLIERS IN DATA ===' as status;
SELECT 
    supplier_name,
    COUNT(*) as item_count,
    MIN(created_at) as first_added,
    MAX(created_at) as last_added
FROM catalog_items
GROUP BY supplier_name
ORDER BY item_count DESC;

-- 4. Quick data sample (if exists)
SELECT '=== SAMPLE DATA (IF EXISTS) ===' as status;
SELECT 
    id,
    supplier_name,
    cat_num_desc,
    make,
    model,
    price,
    created_at
FROM catalog_items
LIMIT 10;

-- 5. Check catalog versions/dates
SELECT '=== VERSION DATES ===' as status;
SELECT 
    version_date,
    COUNT(*) as records,
    supplier_name
FROM catalog_items
GROUP BY version_date, supplier_name
ORDER BY version_date DESC;

-- 6. Check if part_name column was populated
SELECT '=== PART NAME POPULATION ===' as status;
SELECT 
    COUNT(*) as total,
    COUNT(part_name) as has_part_name,
    COUNT(part_name) * 100.0 / NULLIF(COUNT(*), 0) as percent_with_part_name
FROM catalog_items;

-- 7. Emergency check - look for ANY data
SELECT '=== EMERGENCY DATA CHECK ===' as status;
SELECT 
    'Table exists' as check_item,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'catalog_items') as result
UNION ALL
SELECT 
    'Has any rows',
    EXISTS(SELECT 1 FROM catalog_items LIMIT 1)
UNION ALL
SELECT 
    'Has Hebrew data',
    EXISTS(SELECT 1 FROM catalog_items WHERE cat_num_desc ~ '[א-ת]' LIMIT 1);

-- 8. Final summary
SELECT '=== FINAL SUMMARY ===' as status;
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ NO DATA IN CATALOG_ITEMS!'
        WHEN COUNT(*) < 100 THEN '⚠️ Only ' || COUNT(*) || ' records found'
        ELSE '✅ ' || COUNT(*) || ' records in catalog_items'
    END as summary
FROM catalog_items;