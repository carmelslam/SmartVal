-- Fix remaining 66 records that have BOTH side AND front/rear in side_position
-- These records already have front_rear populated, just need to clean side_position

-- Case 1: Records with both "קד'" and side info - keep only the side, front_rear already correct
UPDATE catalog_items
SET side_position = NULL
WHERE (side_position = 'קד''' OR side_position = 'אח''')
  AND front_rear IS NOT NULL 
  AND front_rear != '';

-- Verify fix
SELECT 
    'side_position still has front/rear (should be 0)' as status,
    COUNT(*) as count
FROM catalog_items
WHERE side_position LIKE '%קד%' OR side_position LIKE '%אח%';

-- Check distribution
SELECT 
    side_position,
    COUNT(*) as count
FROM catalog_items
WHERE side_position IS NOT NULL AND side_position != ''
GROUP BY side_position
ORDER BY count DESC
LIMIT 10;

SELECT 
    front_rear,
    COUNT(*) as count
FROM catalog_items
WHERE front_rear IS NOT NULL AND front_rear != ''
GROUP BY front_rear
ORDER BY count DESC;
