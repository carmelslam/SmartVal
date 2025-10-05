-- Fix ALL remaining cat_num_desc records with slashes and Hebrew
-- Process in larger batches

-- Batch 1: Records with Hebrew patterns
UPDATE catalog_items
SET cat_num_desc = reverse_slash_separated(cat_num_desc)
WHERE id IN (
    SELECT id
    FROM catalog_items
    WHERE cat_num_desc LIKE '%/%'
      AND cat_num_desc ~ '[א-ת]{3,}'  -- Contains Hebrew (3+ Hebrew chars)
    LIMIT 1000
);

-- Check progress
SELECT 
    'Remaining records with slash and Hebrew (4+ chars)' as metric,
    COUNT(*) as count
FROM catalog_items
WHERE cat_num_desc LIKE '%/%'
  AND cat_num_desc ~ '[א-ת]{4,}';

-- Sample to verify
SELECT 
    cat_num_desc
FROM catalog_items
WHERE cat_num_desc LIKE '%/%'
  AND cat_num_desc ~ '[א-ת]{4,}'
LIMIT 10;
