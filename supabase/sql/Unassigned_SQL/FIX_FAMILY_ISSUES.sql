-- FIX TWO FAMILY ISSUES:
-- 1. Family gets reversed when it shouldn't (trigger reverses part_family)
-- 2. "דלתות וכנפיים" doesn't exist in UI - should be "חלקי מרכב"

-- First, fix the reversed families in existing data
UPDATE catalog_items
SET part_family = reverse_hebrew(part_family)
WHERE part_family ~ '[א-ת]' 
  AND part_family LIKE '%ו%ת%ל%ד%'; -- Matches reversed "דלתות"

-- Second, change "דלתות וכנפיים" to "חלקי מרכב" to match UI
UPDATE catalog_items
SET part_family = 'חלקי מרכב'
WHERE part_family = 'דלתות וכנפיים';

-- Also update any other categories that don't match UI exactly:
-- "מגנים" should be "מגנים ופגושים"
UPDATE catalog_items
SET part_family = 'מגנים ופגושים'
WHERE part_family = 'מגנים';

-- "פנסים ותאורה" should match UI which just has "פנסים"
UPDATE catalog_items
SET part_family = 'פנסים'
WHERE part_family = 'פנסים ותאורה';

-- Check results
SELECT 'Fixed families:' as info;
SELECT DISTINCT part_family, COUNT(*) 
FROM catalog_items 
GROUP BY part_family 
ORDER BY COUNT(*) DESC;
