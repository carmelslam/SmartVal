-- BATCH 2: Extract FRONT/REAR position only

UPDATE catalog_items
SET front_rear = CASE
    -- Hebrew patterns (both normal and reversed)
    WHEN lower(cat_num_desc) LIKE '%קדמי%' OR lower(cat_num_desc) LIKE '%ימדק%' THEN 'קדמי'
    WHEN lower(cat_num_desc) LIKE '%אחורי%' OR lower(cat_num_desc) LIKE '%ירוחא%' THEN 'אחורי'
    -- English patterns
    WHEN lower(cat_num_desc) LIKE '%front%' OR lower(cat_num_desc) LIKE '%fr%' THEN 'קדמי'
    WHEN lower(cat_num_desc) LIKE '%rear%' OR lower(cat_num_desc) LIKE '%rr%' OR lower(cat_num_desc) LIKE '%back%' THEN 'אחורי'
    ELSE front_rear
END
WHERE (front_rear IS NULL OR front_rear = '')
  AND id IN (
    SELECT id FROM catalog_items 
    WHERE (front_rear IS NULL OR front_rear = '')
    LIMIT 50000
  );

-- Check progress
SELECT 
    COUNT(*) as total,
    COUNT(front_rear) as with_position,
    COUNT(front_rear) * 100.0 / COUNT(*) as percentage
FROM catalog_items;