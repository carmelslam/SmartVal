-- ============================================================================
-- FIX CAT_NUM_DESC REVERSAL - SINGLE BATCH APPROACH
-- Date: 2025-10-02
-- Alternative: Fix ALL remaining records that haven't been fixed yet
-- ============================================================================

-- This finds any cat_num_desc that still contains reversed Hebrew patterns
-- and fixes them in batches using a subquery

UPDATE catalog_items
SET cat_num_desc = reverse_hebrew(cat_num_desc)
WHERE id IN (
    SELECT id
    FROM catalog_items
    WHERE cat_num_desc IS NOT NULL
      AND (
        -- Only update if it looks reversed (contains patterns like ןגמ, סנפ, etc.)
        cat_num_desc LIKE '%ןגמ%' OR
        cat_num_desc LIKE '%סנפ%' OR
        cat_num_desc LIKE '%תלד%' OR
        cat_num_desc LIKE '%לירג%' OR
        cat_num_desc LIKE '%ךמות%' OR
        cat_num_desc LIKE '%טושיק%' OR
        cat_num_desc LIKE '%הנטיב%' OR
        cat_num_desc LIKE '%תרגסמ%'
      )
    LIMIT 5000
);

-- Check how many are left
SELECT COUNT(*) as remaining_reversed
FROM catalog_items
WHERE cat_num_desc IS NOT NULL
  AND (
    cat_num_desc LIKE '%ןגמ%' OR
    cat_num_desc LIKE '%סנפ%' OR
    cat_num_desc LIKE '%תלד%' OR
    cat_num_desc LIKE '%לירג%'
  );
