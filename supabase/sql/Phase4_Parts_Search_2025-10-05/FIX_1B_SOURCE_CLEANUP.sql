-- ============================================================================
-- FIX 1B: Source Field Cleanup - Edge Cases
-- Date: 2025-10-05
-- Version: v1b
-- Purpose: Fix remaining edge cases with parentheses
-- ============================================================================

-- Fix remaining cases with parentheses
UPDATE catalog_items
SET source = CASE
    WHEN source LIKE 'יפילח%' THEN 'חליפי' || substring(source from 6)  -- Keep any trailing chars
    WHEN source LIKE '%יפילח%' THEN replace(source, 'יפילח', 'חליפי')
    WHEN source = '(חליפי' THEN 'חליפי'
    ELSE source
END
WHERE source LIKE '%יפילח%' OR source = '(חליפי';

-- Verify all cleaned up
SELECT 
    'After Cleanup - Source Check' as status,
    source,
    COUNT(*) as count
FROM catalog_items
WHERE source IS NOT NULL
GROUP BY source
ORDER BY count DESC
LIMIT 5;
