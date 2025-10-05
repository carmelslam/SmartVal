-- RECATEGORIZE ALL FAMILIES WITH ENHANCED LOGIC
-- This will apply the new categorization patterns to ALL 48,273 records
-- Not just "לא מוגדר" - all families get recategorized with better patterns

-- IMPORTANT: This will take a few minutes for 48K records
-- The trigger will re-evaluate every record and assign proper categories

UPDATE catalog_items 
SET part_name = part_name;

-- Check results after update
SELECT 'Results after recategorization:' as info;
SELECT 
    part_family,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM catalog_items
WHERE part_family IS NOT NULL AND part_family != ''
GROUP BY part_family
ORDER BY count DESC;

-- Check how many are still uncategorized
SELECT 'Uncategorized count:' as info;
SELECT COUNT(*) as still_uncategorized
FROM catalog_items 
WHERE part_family = 'לא מוגדר' OR part_family IS NULL OR part_family = '';
