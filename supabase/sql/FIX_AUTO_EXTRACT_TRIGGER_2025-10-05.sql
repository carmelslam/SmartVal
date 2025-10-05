-- ============================================================================
-- FIX AUTO_EXTRACT TRIGGER - Fix Integer Conversion Error
-- Date: 2025-10-05
-- Problem: auto_fix_and_extract() fails on empty string to integer conversion
-- Solution: Add NULL checks before integer conversions
-- ============================================================================

SELECT '=== FIXING AUTO_EXTRACT TRIGGER ===' as section;

-- Find and display the current problematic function
SELECT 'Current auto_fix_and_extract function:' as info;

SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE proname = 'auto_fix_and_extract'
LIMIT 1;

-- ============================================================================
-- FIX: Replace the function with safe integer conversions
-- ============================================================================

DROP FUNCTION IF EXISTS auto_fix_and_extract() CASCADE;

CREATE OR REPLACE FUNCTION auto_fix_and_extract()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    yr_match TEXT[];
    yr_from_str TEXT;
    yr_to_str TEXT;
    yr_from_int INT;
    yr_to_int INT;
BEGIN
    -- Extract part_name (first Hebrew word)
    IF NEW.part_name IS NULL AND NEW.cat_num_desc IS NOT NULL THEN
        NEW.part_name := (regexp_match(NEW.cat_num_desc, '^([\u0590-\u05FF]+(?:\s+[\u0590-\u05FF]+)?)'))[1];
    END IF;
    
    -- Extract year range with SAFE integer conversion
    IF NEW.cat_num_desc IS NOT NULL THEN
        -- Try pattern 1: XX-XX (e.g., 10-20)
        yr_match := regexp_match(NEW.cat_num_desc, '(\d{2,3})-(\d{2,3})');
        
        IF yr_match IS NOT NULL THEN
            yr_from_str := yr_match[1];
            yr_to_str := yr_match[2];
            
            -- SAFE conversion: only convert if NOT empty and is numeric
            IF yr_from_str IS NOT NULL AND yr_from_str != '' AND yr_from_str ~ '^\d+$' THEN
                yr_from_int := yr_from_str::INT;
                
                -- Normalize 3-digit years (810 → 10, 910 → 19)
                IF yr_from_int >= 100 THEN
                    yr_from_int := yr_from_int - (yr_from_int / 100) * 100;
                END IF;
                
                -- Convert 2-digit to 4-digit year (10 → 2010)
                IF yr_from_int < 100 THEN
                    IF yr_from_int >= 90 THEN
                        yr_from_int := 1900 + yr_from_int;
                    ELSE
                        yr_from_int := 2000 + yr_from_int;
                    END IF;
                END IF;
                
                NEW.year_from := yr_from_int;
            END IF;
            
            -- SAFE conversion for year_to
            IF yr_to_str IS NOT NULL AND yr_to_str != '' AND yr_to_str ~ '^\d+$' THEN
                yr_to_int := yr_to_str::INT;
                
                -- Normalize 3-digit years
                IF yr_to_int >= 100 THEN
                    yr_to_int := yr_to_int - (yr_to_int / 100) * 100;
                END IF;
                
                -- Convert 2-digit to 4-digit year
                IF yr_to_int < 100 THEN
                    IF yr_to_int >= 90 THEN
                        yr_to_int := 1900 + yr_to_int;
                    ELSE
                        yr_to_int := 2000 + yr_to_int;
                    END IF;
                END IF;
                
                NEW.year_to := yr_to_int;
            END IF;
            
            -- Set extracted_year to year_from
            IF NEW.year_from IS NOT NULL THEN
                NEW.extracted_year := NEW.year_from::TEXT;
            END IF;
        END IF;
    END IF;
    
    -- Extract model (common models only)
    IF NEW.model IS NULL AND NEW.cat_num_desc IS NOT NULL THEN
        NEW.model := CASE
            WHEN NEW.cat_num_desc ILIKE '%קורולה%' THEN 'קורולה'
            WHEN NEW.cat_num_desc ILIKE '%קאמרי%' THEN 'קאמרי'
            WHEN NEW.cat_num_desc ILIKE '%יאריס%' THEN 'יאריס'
            WHEN NEW.cat_num_desc ILIKE '%RAV4%' OR NEW.cat_num_desc ILIKE '%ראב%' THEN 'RAV4'
            WHEN NEW.cat_num_desc ILIKE '%גולף%' THEN 'גולף'
            WHEN NEW.cat_num_desc ILIKE '%פולו%' THEN 'פולו'
            WHEN NEW.cat_num_desc ILIKE '%A3%' THEN 'A3'
            WHEN NEW.cat_num_desc ILIKE '%A4%' THEN 'A4'
            ELSE NULL
        END;
    END IF;
    
    -- Auto-categorize part_family
    IF NEW.part_family IS NULL OR NEW.part_family = 'מקורי' THEN
        IF NEW.part_name IS NOT NULL THEN
            NEW.part_family := CASE 
                WHEN NEW.part_name ~ 'פנס|נורה|זרקור|מהבהב|איתות' THEN 'פנסים ותאורה'
                WHEN NEW.part_name ~ 'דלת|כנף|מכסה מנוע|תא מטען' THEN 'דלתות וכנפיים'
                WHEN NEW.part_name ~ 'מגן|פגוש|ספוילר|גריל' THEN 'מגנים ופגושים'
                WHEN NEW.part_name ~ 'ידית|מנעול|ציר|בולם דלת|תומך' THEN 'חלקי מרכב'
                WHEN NEW.part_name ~ 'מראה|חלון|שמשה|זכוכית' THEN 'חלונות ומראות'
                WHEN NEW.part_name ~ 'גלגל|צמיג' THEN 'גלגלים וצמיגים'
                ELSE 'לא מוגדר'
            END;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- ============================================================================
-- Re-create the trigger
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_auto_fix_and_extract ON catalog_items;

CREATE TRIGGER trigger_auto_fix_and_extract
    BEFORE INSERT OR UPDATE
    ON catalog_items
    FOR EACH ROW
    EXECUTE FUNCTION auto_fix_and_extract();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Fixed function deployed successfully' as status;

-- Test the fix by updating a single record (should not error now)
DO $$
BEGIN
    UPDATE catalog_items 
    SET cat_num_desc = cat_num_desc 
    WHERE id = (SELECT id FROM catalog_items LIMIT 1);
    
    RAISE NOTICE 'Test update successful - no integer conversion error';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Still has error: %', SQLERRM;
END $$;

SELECT '=== AUTO_EXTRACT FIX COMPLETE ===' as section;
