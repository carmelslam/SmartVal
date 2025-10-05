-- ============================================================================
-- FIX SOURCE REVERSED - Session 6 Cleanup
-- Date: 2025-10-05
-- Purpose: Fix ALL remaining reversed source values in database
-- ============================================================================

-- Step 1: Find and fix reversed source values
UPDATE catalog_items
SET source = CASE
    WHEN source = 'יפילח' THEN 'חליפי'
    WHEN source = 'ירוקמ םאות' THEN 'תואם מקורי'
    WHEN source = 'רטומ) יפילח' THEN 'חליפי (מותר)'
    WHEN source = '(חליפי' THEN 'חליפי'
    WHEN source LIKE '%יפילח%' THEN replace(source, 'יפילח', 'חליפי')
    ELSE source
END
WHERE source IN ('יפילח', 'ירוקמ םאות', 'רטומ) יפילח', '(חליפי')
   OR source LIKE '%יפילח%';

-- Step 2: Verification - Check source values distribution
SELECT 
    'SOURCE VERIFICATION' as type,
    source,
    COUNT(*) as count
FROM catalog_items
GROUP BY source
ORDER BY count DESC;

-- Step 3: Check for any remaining reversed patterns
SELECT 
    'REMAINING REVERSED CHECK' as type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'All source values are correct ✅'
        ELSE 'Still have reversed source values ❌'
    END as status
FROM catalog_items
WHERE source LIKE '%יפילח%'
   OR source LIKE '%ירוקמ%';
