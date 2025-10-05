-- Check the remaining 66 records with front/rear in side_position

SELECT 
    side_position,
    COUNT(*) as count
FROM catalog_items
WHERE side_position LIKE '%קד%' OR side_position LIKE '%אח%'
GROUP BY side_position
ORDER BY count DESC;

-- Sample records
SELECT 
    id,
    side_position,
    front_rear,
    cat_num_desc,
    part_name
FROM catalog_items
WHERE side_position LIKE '%קד%' OR side_position LIKE '%אח%'
LIMIT 20;
