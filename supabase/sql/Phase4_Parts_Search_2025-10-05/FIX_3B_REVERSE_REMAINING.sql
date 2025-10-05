-- ============================================================================
-- FIX 3B: Reverse Remaining 1,339 Backwards Strings
-- Date: 2025-10-05
-- Version: v3b
-- Purpose: Fix all remaining fully reversed cat_num_desc
-- ============================================================================

-- Simply reverse ALL records that contain reversed Hebrew patterns
UPDATE catalog_items
SET cat_num_desc = reverse(cat_num_desc)
WHERE cat_num_desc LIKE '%עונמ%' 
   OR cat_num_desc LIKE '%הרמנפ%'
   OR cat_num_desc LIKE '%הרמנאפ%'
   OR cat_num_desc LIKE '%ןגמ%'
   OR cat_num_desc LIKE '%קוזיח%';

-- Verify - should be 0 or very few remaining
SELECT 
    'After FIX 3B - Check' as status,
    COUNT(*) as still_reversed
FROM catalog_items
WHERE cat_num_desc LIKE '%עונמ%' 
   OR cat_num_desc LIKE '%הרמנפ%'
   OR cat_num_desc LIKE '%ןגמ%'
   OR cat_num_desc LIKE '%קוזיח%';

-- Show sample of fixed records
SELECT 
    'Sample Fixed Records' as status,
    cat_num_desc
FROM catalog_items
WHERE cat_num_desc LIKE '%מכסה מנוע%'
   OR cat_num_desc LIKE '%פאנמרה%'
   OR cat_num_desc LIKE '%מגן%'
LIMIT 10;
