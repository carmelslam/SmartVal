-- ============================================================================
-- FIX EXISTING DATA - One-time Update
-- Date: 2025-10-05 Session 6
-- Purpose: Fix existing data that was broken by reversal functions
--          This runs AFTER deploying clean extraction triggers
-- ============================================================================

-- Step 1: Fix reversed MAKE values (currently showing: ןגווסקלופ, טאיפ, etc.)
-- These got reversed by old auto_fix_hebrew_reversal() trigger

UPDATE catalog_items
SET make = CASE
    WHEN make = 'ןגווסקלופ' THEN 'פולקסווגן'
    WHEN make = 'טאיפ' THEN 'פיאט'
    WHEN make = 'ןאורטיס' THEN 'סיטרואן'
    WHEN make = 'דרופ' THEN 'פורד'
    WHEN make = 'תוזיפ' THEN 'פיזו'
    WHEN make = 'הדנוה' THEN 'הונדה'
    WHEN make = 'הדוקס' THEN 'סקודה'
    WHEN make = 'יאדנוי' THEN 'יונדאי'
    WHEN make = 'הדזמ' THEN 'מזדה'
    WHEN make = 'היק' THEN 'קיה'
    WHEN make = 'ישיבוצימ' THEN 'מיצובישי'
    ELSE make
END
WHERE make IN ('ןגווסקלופ', 'טאיפ', 'ןאורטיס', 'דרופ', 'תוזיפ', 'הדנוה', 'הדוקס', 'יאדנוי', 'הדזמ', 'היק', 'ישיבוצימ');

-- Step 2: Remove country suffixes from make (יפן, ארהב, etc.)
UPDATE catalog_items
SET make = regexp_replace(make, '\s+(יפן|ארהב|גרמניה|קוריאה|צרפת|איטליה|אנגליה|שוודיה)$', '', 'gi')
WHERE make ~ '(יפן|ארהב|גרמניה|קוריאה|צרפת|איטליה|אנגליה|שוודיה)$';

-- Step 3: Trigger auto-extraction for all records with NULL fields
-- This will populate: side_position, front_rear, part_family with NEW correct values

UPDATE catalog_items
SET id = id  -- Dummy update to trigger auto_extract_catalog_data()
WHERE side_position IS NULL
   OR front_rear IS NULL
   OR part_family IS NULL
   OR part_family IN ('לא מוגדר', 'פנסים ותאורה', 'דלתות וכנפיים', 'מגנים ופגושים');

-- Verification Queries
SELECT 'FIXED DATA SUMMARY' as status;

-- Check makes are correct
SELECT 
    'MAKES' as type,
    make,
    COUNT(*) as count
FROM catalog_items
GROUP BY make
ORDER BY count DESC
LIMIT 10;

-- Check part families distribution
SELECT 
    'PART_FAMILIES' as type,
    part_family,
    COUNT(*) as count
FROM catalog_items
GROUP BY part_family
ORDER BY count DESC;

-- Check extraction rates
SELECT 
    'EXTRACTION_RATES' as type,
    COUNT(*) as total,
    COUNT(side_position) as has_side,
    COUNT(front_rear) as has_position,
    COUNT(part_family) as has_family,
    ROUND(COUNT(side_position)::NUMERIC / COUNT(*) * 100, 1) as side_pct,
    ROUND(COUNT(front_rear)::NUMERIC / COUNT(*) * 100, 1) as position_pct,
    ROUND(COUNT(part_family)::NUMERIC / COUNT(*) * 100, 1) as family_pct
FROM catalog_items;

-- Sample 10 records to verify
SELECT 
    'SAMPLE_VERIFICATION' as type,
    cat_num_desc,
    make,
    side_position,
    front_rear,
    part_family
FROM catalog_items
WHERE cat_num_desc IS NOT NULL
LIMIT 10;
