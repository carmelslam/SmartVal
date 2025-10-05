-- ============================================================================
-- FIX FINAL 69 TRULY REVERSED RECORDS
-- Date: 2025-10-02
-- These are records that START with reversed patterns (not just contain them)
-- ============================================================================

-- Fix only records that START with reversed Hebrew patterns
UPDATE catalog_items
SET cat_num_desc = reverse_hebrew(cat_num_desc)
WHERE cat_num_desc IS NOT NULL
  AND (
    cat_num_desc LIKE 'ןגמ%' OR 
    cat_num_desc LIKE 'סנפ%' OR 
    cat_num_desc LIKE 'תלד%' OR 
    cat_num_desc LIKE 'לירג%' OR
    cat_num_desc LIKE 'ךמות%' OR
    cat_num_desc LIKE 'טושיק%' OR
    cat_num_desc LIKE 'הנטיב%' OR
    cat_num_desc LIKE 'תרגסמ%' OR
    cat_num_desc LIKE 'יאר%' OR
    cat_num_desc LIKE 'חפ%'
  );

-- Verify - should show 0 truly reversed records remaining
SELECT 
    'TRULY REVERSED REMAINING' as check_type,
    COUNT(*) as count
FROM catalog_items
WHERE cat_num_desc IS NOT NULL
  AND (
    cat_num_desc LIKE 'ןגמ%' OR 
    cat_num_desc LIKE 'סנפ%' OR 
    cat_num_desc LIKE 'תלד%' OR 
    cat_num_desc LIKE 'לירג%' OR
    cat_num_desc LIKE 'ךמות%' OR
    cat_num_desc LIKE 'טושיק%'
  );

-- Show sample of what was fixed
SELECT 
    'SAMPLE AFTER FIX' as section,
    cat_num_desc,
    make,
    part_name
FROM catalog_items
WHERE make = 'טויוטה'
ORDER BY RANDOM()
LIMIT 5;
