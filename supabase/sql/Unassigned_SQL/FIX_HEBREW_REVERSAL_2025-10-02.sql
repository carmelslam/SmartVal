-- ============================================================================
-- FIX HEBREW REVERSAL IN DATABASE
-- Date: 2025-10-02
-- Purpose: Fix reversed Hebrew text in make and part_family fields
-- Based on: current state dignostics 2.10.md findings
-- ============================================================================

-- This will fix the reversed Hebrew text found in diagnostics
-- Running this multiple times is SAFE - it only updates where needed

SELECT '=== STARTING HEBREW REVERSAL FIX ===' as step;

-- ============================================================================
-- STEP 1: Fix MAKE field (highest priority - blocks search)
-- ============================================================================

SELECT '1. Fixing MAKE field reversals...' as step;

-- Fix BMW / Mini
UPDATE catalog_items
SET make = 'BMW / מיני'
WHERE make = 'ינימ / וו.מ.ב';

-- Fix Hyundai
UPDATE catalog_items
SET make = 'יונדאי'
WHERE make = 'יאדנוי';

-- Fix Mazda
UPDATE catalog_items
SET make = 'מזדה'
WHERE make = 'הדזמ';

-- Fix Kia
UPDATE catalog_items
SET make = 'קיה'
WHERE make = 'היק';

-- Fix Mitsubishi
UPDATE catalog_items
SET make = 'מיצובישי'
WHERE make = 'ישיבוצימ';

-- Fix Honda
UPDATE catalog_items
SET make = 'הונדה'
WHERE make = 'הדנוה';

-- Fix Skoda
UPDATE catalog_items
SET make = 'סקודה'
WHERE make = 'הדוקס';

-- Fix Renault
UPDATE catalog_items
SET make = 'רנו'
WHERE make = 'ונר';

-- ============================================================================
-- STEP 2: Fix PART_FAMILY field
-- ============================================================================

SELECT '2. Fixing PART_FAMILY field reversals...' as step;

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

-- ============================================================================
-- STEP 3: Verification - Check results
-- ============================================================================

SELECT '3. Verification - Checking fixed fields...' as step;

-- Check makes are now correct
SELECT 
    make,
    COUNT(*) as count,
    'MAKE' as field_type
FROM catalog_items
WHERE make IN (
    'BMW / מיני', 'יונדאי', 'מזדה', 'קיה', 'מיצובישי', 
    'הונדה', 'סקודה', 'רנו', 'טויוטה'
)
GROUP BY make
ORDER BY count DESC;

-- Check part families are now correct
SELECT 
    part_family,
    COUNT(*) as count,
    'PART_FAMILY' as field_type
FROM catalog_items
WHERE part_family IN (
    'מגנים ופגושים', 'פנסים ותאורה', 'דלתות וכנפיים',
    'מנוע וחלקי מנוע', 'מראה', 'מערכות בלימה והיגוי',
    'פגוש', 'חלונות ומראות', 'גלגלים וצמיגים'
)
GROUP BY part_family
ORDER BY count DESC;

-- Check if any reversed values still exist
SELECT 
    'REMAINING REVERSED MAKES' as check_type,
    COUNT(*) as count
FROM catalog_items
WHERE make IN ('ינימ / וו.מ.ב', 'יאדנוי', 'הדזמ', 'היק', 'ישיבוצימ', 'הדנוה', 'הדוקס', 'ונר');

SELECT 
    'REMAINING REVERSED PART_FAMILIES' as check_type,
    COUNT(*) as count
FROM catalog_items
WHERE part_family IN (
    'םישוגפו םינגמ', 'הרואתו םיסנפ', 'םייפנכו תותלד',
    'עונמ יקלחו עונמ', 'הארמ', 'יוגיהו המילב תוכרעמ',
    'שוגפ', 'תוארמו תונולח', 'םיגימצו םילגלג'
);

SELECT '=== HEBREW REVERSAL FIX COMPLETE ===' as step;

-- ============================================================================
-- EXPECTED RESULTS:
-- - ~3,164 BMW/Mini records fixed
-- - ~2,683 Hyundai records fixed
-- - ~1,713 Mazda records fixed
-- - ~1,380 Kia records fixed
-- - ~1,144 Mitsubishi records fixed
-- - ~1,116 Honda records fixed
-- - ~1,104 Skoda records fixed
-- - ~1,331 Renault records fixed
-- - ~12,941 "מגנים ופגושים" part_family records fixed
-- - ~6,520 "פנסים ותאורה" part_family records fixed
-- - ~6,359 "דלתות וכנפיים" part_family records fixed
-- - And several other part_family fixes
-- ============================================================================
