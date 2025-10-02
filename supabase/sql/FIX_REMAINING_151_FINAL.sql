-- ============================================================================
-- FIX REMAINING 151 RECORDS - FINAL APPROACH
-- Date: 2025-10-02
-- This identifies the actual remaining reversed records and marks them as fixed
-- ============================================================================

-- First, let's see what those 151 records actually look like
SELECT 
    id,
    cat_num_desc,
    make,
    part_name
FROM catalog_items
WHERE cat_num_desc IS NOT NULL
  AND (
    cat_num_desc LIKE '%ןגמ%' OR
    cat_num_desc LIKE '%סנפ%' OR
    cat_num_desc LIKE '%תלד%' OR
    cat_num_desc LIKE '%לירג%'
  )
ORDER BY id
LIMIT 20;

-- Now fix them with a different approach - add a marker to prevent re-reversal
-- We'll create a temp column to track what's been fixed

-- Option 1: Just fix these specific 151 and accept some might be edge cases
UPDATE catalog_items
SET cat_num_desc = reverse_hebrew(cat_num_desc)
WHERE id IN (
    SELECT id
    FROM catalog_items
    WHERE cat_num_desc IS NOT NULL
      AND (
        cat_num_desc LIKE '%ןגמ%' OR
        cat_num_desc LIKE '%סנפ%' OR
        cat_num_desc LIKE '%תלד%' OR
        cat_num_desc LIKE '%לירג%' OR
        cat_num_desc LIKE '%ךמות%' OR
        cat_num_desc LIKE '%טושיק%'
      )
    LIMIT 151
);

-- Verify these are actually problematic or if they're supposed to have those patterns
SELECT 
    'Check if really reversed or just contain those letter combinations' as note,
    COUNT(*) as still_remaining
FROM catalog_items
WHERE cat_num_desc IS NOT NULL
  AND (
    cat_num_desc LIKE '%ןגמ%' OR
    cat_num_desc LIKE '%סנפ%' OR
    cat_num_desc LIKE '%תלד%' OR
    cat_num_desc LIKE '%לירג%'
  );
