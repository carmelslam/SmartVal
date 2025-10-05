-- FIX: Un-reverse Hebrew in part_family in BATCHES to avoid timeout
-- Run each UPDATE separately in Supabase SQL editor

-- ============================================================================
-- BATCH 1: Un-reverse part_family (10000 rows at a time)
-- ============================================================================

-- First batch
UPDATE catalog_items
SET part_family = reverse(part_family)
WHERE id IN (
    SELECT id FROM catalog_items
    WHERE part_family ~ '[א-ת]'
      AND part_family IS NOT NULL
    LIMIT 10000
);

-- Check progress
SELECT COUNT(*) as remaining_to_fix
FROM catalog_items
WHERE part_family ~ '[א-ת]'
  AND part_family IS NOT NULL
  AND part_family != reverse(reverse(part_family)); -- Check if still reversed
