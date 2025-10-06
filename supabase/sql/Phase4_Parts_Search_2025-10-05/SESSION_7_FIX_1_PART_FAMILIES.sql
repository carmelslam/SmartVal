-- ============================================================================
-- SESSION 7 - FIX 1: Convert OLD Part Families to CORRECT Categories
-- Date: 2025-10-05
-- Purpose: Convert 25,571 records from old categories to correct parts.js categories
-- ============================================================================

-- Current problem:
-- - 12,363 records: "מגנים ופגושים" (old) → should be "חלקי מרכב"
-- - 6,690 records: "פנסים ותאורה" (old) → should be "פנסים"
-- - 6,518 records: "דלתות וכנפיים" (old) → should be "חלקי מרכב"
-- - 37 records: "םיסנפ" (reversed) → should be "פנסים"

-- Step 1: Convert OLD categories to CORRECT categories
UPDATE catalog_items
SET part_family = CASE
    WHEN part_family = 'מגנים ופגושים' THEN 'חלקי מרכב'
    WHEN part_family = 'פנסים ותאורה' THEN 'פנסים'
    WHEN part_family = 'דלתות וכנפיים' THEN 'חלקי מרכב'
    WHEN part_family = 'םיסנפ' THEN 'פנסים'
    ELSE part_family
END
WHERE part_family IN ('מגנים ופגושים', 'פנסים ותאורה', 'דלתות וכנפיים', 'םיסנפ');

-- Step 2: Verification - Check updated counts
SELECT 
    'After Fix - Category Distribution' as status,
    part_family,
    COUNT(*) as count,
    CASE 
        WHEN part_family IN ('מגנים ופגושים', 'פנסים ותאורה', 'דלתות וכנפיים', 'חלקי פח', 'םיסנפ')
        THEN '❌ OLD CATEGORY (should be 0)'
        WHEN part_family IN (
            'אביזרים נלווים', 'גלגלים וצמיגים', 'חיישני מנוע', 'חלונות ומראות',
            'חלקי מרכב', 'חלקי פנים', 'חשמל', 'כריות אוויר', 'ממסרים',
            'מנוע - יחידת בקרת ECU', 'מנוע וחלקי מנוע', 'מערכות בלימה והיגוי',
            'מערכות חימום וקירור', 'מערכת ABS', 'מערכת דלק', 'מערכת הפליטה',
            'מתגים/מפסקים/סוויצ''ים', 'פנסים', 'תיבת הילוכים וחלקים'
        ) THEN '✅ CORRECT'
        ELSE '⚠️ UNKNOWN'
    END as status
FROM catalog_items
WHERE part_family IS NOT NULL
GROUP BY part_family
ORDER BY count DESC;

-- Step 3: Verify OLD categories are gone
SELECT 
    'OLD Categories Check' as test,
    COUNT(*) as old_category_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ All old categories converted'
        ELSE '❌ Still have old categories'
    END as status
FROM catalog_items
WHERE part_family IN ('מגנים ופגושים', 'פנסים ותאורה', 'דלתות וכנפיים', 'חלקי פח', 'םיסנפ');
