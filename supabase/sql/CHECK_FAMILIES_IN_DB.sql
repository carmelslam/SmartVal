-- CHECK ALL FAMILY VALUES IN DATABASE
-- This shows what part_family values actually exist in catalog_items

SELECT 'All families in database with counts:' as info;
SELECT 
    part_family,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM catalog_items
WHERE part_family IS NOT NULL AND part_family != ''
GROUP BY part_family
ORDER BY count DESC;

-- Total records with/without family
SELECT 'Family coverage:' as info;
SELECT 
    COUNT(*) FILTER (WHERE part_family IS NOT NULL AND part_family != '') as has_family,
    COUNT(*) FILTER (WHERE part_family IS NULL OR part_family = '') as no_family,
    COUNT(*) as total
FROM catalog_items;
