-- BATCH 1: Extract SIDE POSITION only (fast)

UPDATE catalog_items
SET side_position = CASE
    -- Hebrew patterns (both normal and reversed)
    WHEN lower(cat_num_desc) LIKE '%שמאל%' OR lower(cat_num_desc) LIKE '%לאמש%' THEN 'שמאל'
    WHEN lower(cat_num_desc) LIKE '%ימין%' OR lower(cat_num_desc) LIKE '%ןימי%' THEN 'ימין'
    -- English patterns
    WHEN lower(cat_num_desc) LIKE '%left%' OR lower(cat_num_desc) LIKE '%lh%' THEN 'שמאל'
    WHEN lower(cat_num_desc) LIKE '%right%' OR lower(cat_num_desc) LIKE '%rh%' THEN 'ימין'
    ELSE side_position
END
WHERE (side_position IS NULL OR side_position = '')
  AND id IN (
    SELECT id FROM catalog_items 
    WHERE (side_position IS NULL OR side_position = '')
    LIMIT 50000
  );

-- Check progress
SELECT 
    COUNT(*) as total,
    COUNT(side_position) as with_side,
    COUNT(side_position) * 100.0 / COUNT(*) as percentage
FROM catalog_items;