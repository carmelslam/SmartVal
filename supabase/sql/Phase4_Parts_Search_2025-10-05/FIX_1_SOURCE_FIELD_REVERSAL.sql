-- ============================================================================
-- FIX 1: Source Field Hebrew Reversal
-- Date: 2025-10-05
-- Version: v1
-- Purpose: Fix reversed Hebrew in source field
-- ============================================================================

-- Issue: 28,195 records have "יפילח" instead of "חליפי"
--        647 records have "ירוקמ םאות" instead of "תואם מקורי"

-- Fix reversed source values
UPDATE catalog_items
SET source = CASE
    WHEN source = 'יפילח' THEN 'חליפי'
    WHEN source = 'ירוקמ םאות' THEN 'תואם מקורי'
    WHEN source = 'רטומ) יפילח' THEN 'חליפי (מותר'
    ELSE source
END
WHERE source IN ('יפילח', 'ירוקמ םאות', 'רטומ) יפילח');

-- Verify fix
SELECT 
    'After Fix - Source Field Check' as status,
    source,
    COUNT(*) as count
FROM catalog_items
WHERE source IS NOT NULL
GROUP BY source
ORDER BY count DESC
LIMIT 5;
