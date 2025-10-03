-- CHECK CURRENT FAMILY DISTRIBUTION
SELECT 
    part_family,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM catalog_items
GROUP BY part_family
ORDER BY count DESC
LIMIT 25;

-- Check what the uncategorized records look like
SELECT 'Sample uncategorized records:' as info;
SELECT cat_num_desc, part_name, part_family
FROM catalog_items
WHERE part_family IS NULL OR part_family = '' OR part_family = 'לא מוגדר'
LIMIT 10;
