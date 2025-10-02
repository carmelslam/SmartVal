-- ============================================================================
-- CHECK REMAINING 151 RECORDS - Are they actually reversed?
-- Date: 2025-10-02
-- Let's examine these records to see if they're truly reversed or just false positives
-- ============================================================================

-- Show sample of the 151 "remaining" records
SELECT 
    cat_num_desc,
    make,
    model,
    part_name,
    CASE 
        -- Check if it starts with reversed patterns (actual problem)
        WHEN cat_num_desc LIKE 'ןגמ%' OR cat_num_desc LIKE 'סנפ%' OR cat_num_desc LIKE 'תלד%' THEN 'TRULY REVERSED - FIX IT'
        -- Check if it just contains those letters somewhere (might be OK)
        WHEN cat_num_desc LIKE '%ןגמ%' OR cat_num_desc LIKE '%סנפ%' THEN 'CONTAINS PATTERN - MIGHT BE OK'
        ELSE 'UNKNOWN'
    END as assessment
FROM catalog_items
WHERE cat_num_desc IS NOT NULL
  AND (
    cat_num_desc LIKE '%ןגמ%' OR
    cat_num_desc LIKE '%סנפ%' OR
    cat_num_desc LIKE '%תלד%' OR
    cat_num_desc LIKE '%לירג%'
  )
ORDER BY 
    CASE 
        WHEN cat_num_desc LIKE 'ןגמ%' OR cat_num_desc LIKE 'סנפ%' THEN 1
        ELSE 2
    END,
    id
LIMIT 30;

-- Count how many are TRULY reversed vs just contain the pattern
SELECT 
    'TRULY REVERSED (starts with pattern)' as category,
    COUNT(*) as count
FROM catalog_items
WHERE cat_num_desc IS NOT NULL
  AND (
    cat_num_desc LIKE 'ןגמ%' OR 
    cat_num_desc LIKE 'סנפ%' OR 
    cat_num_desc LIKE 'תלד%' OR 
    cat_num_desc LIKE 'לירג%' OR
    cat_num_desc LIKE 'ךמות%'
  )

UNION ALL

SELECT 
    'CONTAINS PATTERN (might be OK)' as category,
    COUNT(*) as count
FROM catalog_items
WHERE cat_num_desc IS NOT NULL
  AND (
    cat_num_desc LIKE '%ןגמ%' OR
    cat_num_desc LIKE '%סנפ%' OR
    cat_num_desc LIKE '%תלד%' OR
    cat_num_desc LIKE '%לירג%'
  )
  AND NOT (
    cat_num_desc LIKE 'ןגמ%' OR 
    cat_num_desc LIKE 'סנפ%' OR 
    cat_num_desc LIKE 'תלד%' OR 
    cat_num_desc LIKE 'לירג%' OR
    cat_num_desc LIKE 'ךמות%'
  );
