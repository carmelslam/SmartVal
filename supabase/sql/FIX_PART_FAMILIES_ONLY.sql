-- ============================================================================
-- FIX HEBREW REVERSAL - PART_FAMILIES ONLY (BATCH 2)
-- Date: 2025-10-02
-- Purpose: Fix reversed Hebrew text in PART_FAMILY field only
-- Run this AFTER FIX_MAKES_ONLY.sql completes successfully
-- ============================================================================

-- Fix "מגנים ופגושים" (bumpers and shields)
UPDATE catalog_items
SET part_family = 'מגנים ופגושים'
WHERE part_family = 'םישוגפו םינגמ';

-- Fix "פנסים ותאורה" (lights and lighting)
UPDATE catalog_items
SET part_family = 'פנסים ותאורה'
WHERE part_family = 'הרואתו םיסנפ';

-- Fix "דלתות וכנפיים" (doors and fenders)
UPDATE catalog_items
SET part_family = 'דלתות וכנפיים'
WHERE part_family = 'םייפנכו תותלד';

-- Fix "מנוע וחלקי מנוע" (engine and engine parts)
UPDATE catalog_items
SET part_family = 'מנוע וחלקי מנוע'
WHERE part_family = 'עונמ יקלחו עונמ';

-- Fix "מראה" (mirror)
UPDATE catalog_items
SET part_family = 'מראה'
WHERE part_family = 'הארמ';

-- Fix "מערכות בלימה והיגוי" (braking and steering systems)
UPDATE catalog_items
SET part_family = 'מערכות בלימה והיגוי'
WHERE part_family = 'יוגיהו המילב תוכרעמ';

-- Fix "פגוש" (bumper)
UPDATE catalog_items
SET part_family = 'פגוש'
WHERE part_family = 'שוגפ';

-- Fix "חלונות ומראות" (windows and mirrors)
UPDATE catalog_items
SET part_family = 'חלונות ומראות'
WHERE part_family = 'תוארמו תונולח';

-- Fix "גלגלים וצמיגים" (wheels and tires)
UPDATE catalog_items
SET part_family = 'גלגלים וצמיגים'
WHERE part_family = 'םיגימצו םילגלג';

-- Verification
SELECT 
    part_family,
    COUNT(*) as count
FROM catalog_items
WHERE part_family IN (
    'מגנים ופגושים', 'פנסים ותאורה', 'דלתות וכנפיים',
    'מנוע וחלקי מנוע', 'מראה', 'מערכות בלימה והיגוי',
    'פגוש', 'חלונות ומראות', 'גלגלים וצמיגים'
)
GROUP BY part_family
ORDER BY count DESC;
