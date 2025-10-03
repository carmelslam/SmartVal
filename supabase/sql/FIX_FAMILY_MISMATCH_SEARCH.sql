-- FIX FAMILY MISMATCH IN SEARCH
-- Problem: UI family names don't match database family names exactly
-- Solution: Make family_param filter OPTIONAL - ignore if no exact match

-- This modifies the search function to be more flexible with family matching
-- If family doesn't match exactly, it continues with other filters (part, make, model)

-- Check current family values in database
SELECT 'Current families in database:' as info;
SELECT DISTINCT part_family, COUNT(*) as count
FROM catalog_items
WHERE part_family IS NOT NULL AND part_family != ''
GROUP BY part_family
ORDER BY count DESC
LIMIT 20;

-- Check what families are being searched from UI
-- (This is informational - shows us what UI sends vs what DB has)
