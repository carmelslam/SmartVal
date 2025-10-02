-- Check if cat_num_desc still has reversed Hebrew

SELECT 
    id,
    cat_num_desc,
    part_name,
    source
FROM catalog_items
WHERE cat_num_desc LIKE '%קלוח%'
   OR cat_num_desc LIKE '%הלטנפ%'
   OR cat_num_desc LIKE '%הביפולוק%'
LIMIT 10;

-- Check source field values
SELECT 
    source,
    COUNT(*) as count
FROM catalog_items
GROUP BY source
ORDER BY count DESC;
