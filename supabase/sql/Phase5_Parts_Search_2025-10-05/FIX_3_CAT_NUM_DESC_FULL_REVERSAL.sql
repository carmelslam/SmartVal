-- ============================================================================
-- FIX 3: cat_num_desc Full String Reversal
-- Date: 2025-10-05
-- Version: v1
-- Purpose: Fix completely reversed cat_num_desc strings
-- ============================================================================

-- Issue: Some cat_num_desc are COMPLETELY reversed
--   Example: "עונמ ררוואמ + סנוכ הרמנאפ 510-90 (079)"
--   Should be: "(970) 09-015 ~ פאנמרה כונס + מאורר מנוע"

-- Create function to detect if string is fully reversed
CREATE OR REPLACE FUNCTION is_fully_reversed_hebrew(text_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if string contains common reversed patterns
    -- Reversed: עונמ (should be מנוע), הרמנפ (should be פנמרה)
    RETURN (
        text_to_check LIKE '%עונמ%' OR
        text_to_check LIKE '%הרמנפ%' OR
        text_to_check LIKE '%הרמנאפ%' OR
        text_to_check LIKE '%ןגמ%' OR
        text_to_check LIKE '%קוזיח%'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to reverse Hebrew text properly
CREATE OR REPLACE FUNCTION reverse_full_string(text_to_reverse TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN reverse(text_to_reverse);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Find and fix fully reversed strings
UPDATE catalog_items
SET cat_num_desc = reverse_full_string(cat_num_desc)
WHERE is_fully_reversed_hebrew(cat_num_desc);

-- Verify fix
SELECT 
    'After Fix - Fully Reversed Strings' as status,
    cat_num_desc,
    'Should NOT contain: עונמ, הרמנפ, ןגמ, קוזיח' as check
FROM catalog_items
WHERE cat_num_desc LIKE '%עונמ%' 
   OR cat_num_desc LIKE '%הרמנפ%'
   OR cat_num_desc LIKE '%ןגמ%'
LIMIT 10;
