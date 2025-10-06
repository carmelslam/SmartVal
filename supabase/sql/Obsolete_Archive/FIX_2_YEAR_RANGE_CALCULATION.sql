-- ============================================================================
-- FIX 2: Year Range Calculation
-- Date: 2025-10-05
-- Version: v1
-- Purpose: Fix year_range to show correct format (018-020 instead of 10-10)
-- ============================================================================

-- Issue: year_range shows wrong values
--   Example: year_from=2011, year_to=2017, but year_range="10-10" (wrong!)
--   Should show: "011-017" (2-digit year format)

-- Fix: Recalculate year_range from year_from and year_to
UPDATE catalog_items
SET year_range = CASE
    -- If both years exist and are valid
    WHEN year_from IS NOT NULL AND year_to IS NOT NULL 
         AND year_from >= 1990 AND year_to >= 1990
         AND year_from <= year_to THEN
        -- Convert to 2-digit format: 2011 -> 011, 2017 -> 017
        LPAD((year_from % 100)::TEXT, 3, '0') || '-' || LPAD((year_to % 100)::TEXT, 3, '0')
    
    -- If only year_from exists
    WHEN year_from IS NOT NULL AND year_from >= 1990 THEN
        LPAD((year_from % 100)::TEXT, 3, '0')
    
    -- Otherwise keep null
    ELSE NULL
END
WHERE year_from IS NOT NULL OR year_to IS NOT NULL;

-- Verify fix - should show formats like "011-017", "015", etc.
SELECT 
    'After Fix - Year Range Check' as status,
    cat_num_desc,
    year_from,
    year_to,
    year_range,
    'Should show 3-digit format like 011-017' as expected
FROM catalog_items
WHERE year_range IS NOT NULL
LIMIT 20;
