-- FIX: 
-- 1. Un-reverse all reversed Hebrew in part_family
-- 2. Extract year_range from cat_num_desc for display
-- 3. Update trigger to NOT reverse part_family

-- ============================================================================
-- STEP 1: Fix reversed Hebrew in part_family column
-- ============================================================================

-- Un-reverse all part_family values that are currently reversed
UPDATE catalog_items
SET part_family = reverse(part_family)
WHERE part_family ~ '[א-ת]'  -- Only Hebrew text
  AND part_family IS NOT NULL;

-- ============================================================================
-- STEP 2: Extract year_range from cat_num_desc for display
-- ============================================================================

-- Create year_range from year_from/year_to when available
UPDATE catalog_items
SET year_range = 
    CASE 
        WHEN year_from IS NOT NULL AND year_to IS NOT NULL THEN
            substring(year_from::TEXT from 3) || '-' || substring(year_to::TEXT from 3)
        ELSE year_range
    END
WHERE (year_range IS NULL OR year_range = '')
  AND year_from IS NOT NULL 
  AND year_to IS NOT NULL;

-- Extract year range from cat_num_desc patterns (e.g., "220-" or "-220" or "4 910-")
UPDATE catalog_items
SET year_range = 
    CASE
        -- Pattern: "דלת קד ימ' לילה - קורולה קרוס 220-"
        WHEN cat_num_desc ~ '\d{3}-$' THEN 
            substring(cat_num_desc from '(\d{3})-$')
        
        -- Pattern: "כנף קד שמ' - 4 910- קורולה דלתות"
        WHEN cat_num_desc ~ '\d \d{3}-' THEN
            substring(cat_num_desc from '\d (\d{3})-')
        
        ELSE year_range
    END
WHERE (year_range IS NULL OR year_range = '')
  AND cat_num_desc ~ '\d{3}-';

-- Copy year_range to extracted_year for display
UPDATE catalog_items
SET extracted_year = year_range
WHERE year_range IS NOT NULL 
  AND year_range != ''
  AND (extracted_year IS NULL OR extracted_year = '');

-- ============================================================================
-- STEP 3: Update trigger to NOT reverse part_family (only cat_num_desc)
-- ============================================================================

CREATE OR REPLACE FUNCTION reverse_hebrew(text_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    words TEXT[];
    word TEXT;
    reversed_words TEXT[] := ARRAY[]::TEXT[];
    result TEXT;
BEGIN
    IF text_input IS NULL OR text_input = '' THEN
        RETURN text_input;
    END IF;
    
    words := string_to_array(text_input, ' ');
    
    FOREACH word IN ARRAY words LOOP
        -- Only reverse if word contains Hebrew characters
        IF word ~ '[א-ת]' THEN
            reversed_words := array_append(reversed_words, reverse(word));
        ELSE
            -- Keep English and numbers unchanged
            reversed_words := array_append(reversed_words, word);
        END IF;
    END LOOP;
    
    -- Reverse the word order
    result := array_to_string(ARRAY(
        SELECT unnest(reversed_words) 
        ORDER BY generate_subscripts(reversed_words, 1) DESC
    ), ' ');
    
    RETURN result;
END;
$$;

-- Update trigger to ONLY process cat_num_desc (not part_family or other fields)
CREATE OR REPLACE FUNCTION process_hebrew_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only reverse cat_num_desc (part description)
    IF NEW.cat_num_desc IS NOT NULL AND NEW.cat_num_desc != '' THEN
        NEW.cat_num_desc := reverse_hebrew(NEW.cat_num_desc);
    END IF;
    
    -- DO NOT reverse part_family, make, model, or other fields
    -- They should be stored as-is
    
    RETURN NEW;
END;
$$;

-- Recreate trigger with updated function
DROP TRIGGER IF EXISTS hebrew_reversal_trigger ON catalog_items;
CREATE TRIGGER hebrew_reversal_trigger
    BEFORE INSERT OR UPDATE ON catalog_items
    FOR EACH ROW
    EXECUTE FUNCTION process_hebrew_before_insert();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check door records from screenshot
SELECT 
    'Door records after fix:' as test,
    pcode,
    cat_num_desc,
    part_family,
    year_range,
    extracted_year
FROM catalog_items
WHERE pcode IN ('VBP42072661', 'VBP42072662', 'VB42111211', 'VB42111212')
ORDER BY pcode;

-- Check overall statistics
SELECT 
    'Overall stats after fix:' as test,
    COUNT(*) FILTER (WHERE part_family IS NOT NULL AND part_family ~ '[א-ת]') as has_hebrew_family,
    COUNT(*) FILTER (WHERE year_range IS NOT NULL AND year_range != '') as has_year_range,
    COUNT(*) FILTER (WHERE extracted_year IS NOT NULL AND extracted_year != '') as has_extracted_year,
    COUNT(*) as total
FROM catalog_items;
