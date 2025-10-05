-- Get all unique makes to see which ones have slashes with reversed Hebrew

SELECT 
    make,
    COUNT(*) as count,
    CASE 
        WHEN make LIKE '%ו /%' OR make LIKE '%ר /%' OR make LIKE '%ל /%' THEN 'Likely reversed'
        ELSE 'Check manually'
    END as assessment
FROM catalog_items
WHERE make LIKE '%/%'
GROUP BY make
ORDER BY count DESC;

-- Get all part_family with slashes
SELECT 
    'PART_FAMILY' as section;
    
SELECT 
    part_family,
    COUNT(*) as count
FROM catalog_items
WHERE part_family LIKE '%/%'
GROUP BY part_family
ORDER BY count DESC;

-- Count total records affected
SELECT 
    'Total records with slash in cat_num_desc' as metric,
    COUNT(*) as count
FROM catalog_items
WHERE cat_num_desc LIKE '%/%';
