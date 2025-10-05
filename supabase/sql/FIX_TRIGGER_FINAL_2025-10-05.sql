-- ============================================================================
-- FIX TRIGGER FINAL - Fix line 88 integer conversion error
-- Date: 2025-10-05
-- Problem: auto_fix_and_extract() still has empty string to integer conversion
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
    
    -- Extract year range with EXTRA SAFE integer conversion
    IF NEW.cat_num_desc IS NOT NULL THEN
        yr_match := regexp_match(NEW.cat_num_desc, '(\d{2,3})-(\d{2,3})');
        
        IF yr_match IS NOT NULL AND yr_match[1] IS NOT NULL AND yr_match[2] IS NOT NULL THEN
            yr_from_str := trim(yr_match[1]);
            yr_to_str := trim(yr_match[2]);
            
            -- EXTRA SAFE: Check if string is NOT empty AND contains ONLY digits
            IF yr_from_str != '' AND yr_from_str ~ '^\d+$' THEN
                BEGIN
                    yr_from_int := yr_from_str::INT;
                    
                    -- Normalize 3-digit years
                    IF yr_from_int >= 100 THEN
                        yr_from_int := yr_from_int % 100;
                    END IF;
                    
                    -- Convert to 4-digit
                    IF yr_from_int < 100 THEN
                        IF yr_from_int >= 90 THEN
                            yr_from_int := 1900 + yr_from_int;
                        ELSE
                            yr_from_int := 2000 + yr_from_int;
                        END IF;
                    END IF;
                    
                    NEW.year_from := yr_from_int;
                EXCEPTION WHEN OTHERS THEN
                    -- Silently ignore conversion errors
                    NULL;
                END;
            END IF;
            
            -- Same for year_to
            IF yr_to_str != '' AND yr_to_str ~ '^\d+$' THEN
                BEGIN
                    yr_to_int := yr_to_str::INT;
                    
                    IF yr_to_int >= 100 THEN
                        yr_to_int := yr_to_int % 100;
                    END IF;
                    
                    IF yr_to_int < 100 THEN
                        IF yr_to_int >= 90 THEN
                            yr_to_int := 1900 + yr_to_int;
                        ELSE
                            yr_to_int := 2000 + yr_to_int;
                        END IF;
                    END IF;
                    
                    NEW.year_to := yr_to_int;
                EXCEPTION WHEN OTHERS THEN
                    NULL;
                END;
            END IF;
            
            -- Set extracted_year
            IF NEW.year_from IS NOT NULL THEN
                NEW.extracted_year := NEW.year_from::TEXT;
            END IF;
        END IF;
    END IF;
    
    -- Extract model (safe patterns only)
    IF NEW.model IS NULL AND NEW.cat_num_desc IS NOT NULL THEN
        NEW.model := CASE
            WHEN NEW.cat_num_desc ILIKE '%קורולה%' THEN 'קורולה'
            WHEN NEW.cat_num_desc ILIKE '%קאמרי%' THEN 'קאמרי'
            WHEN NEW.cat_num_desc ILIKE '%יאריס%' THEN 'יאריס'
            WHEN NEW.cat_num_desc ILIKE '%RAV4%' THEN 'RAV4'
            WHEN NEW.cat_num_desc ILIKE '%גולף%' THEN 'גולף'
            WHEN NEW.cat_num_desc ILIKE '%פולו%' THEN 'פולו'
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

-- Re-create the trigger
DROP TRIGGER IF EXISTS trigger_auto_fix_and_extract ON catalog_items;

CREATE TRIGGER trigger_auto_fix_and_extract
    BEFORE INSERT OR UPDATE
    ON catalog_items
    FOR EACH ROW
    EXECUTE FUNCTION auto_fix_and_extract();

SELECT 'Trigger fixed with exception handling' as status;

-- Test it
DO $$
BEGIN
    UPDATE catalog_items 
    SET cat_num_desc = cat_num_desc 
    WHERE id = (SELECT id FROM catalog_items LIMIT 1);
    
    RAISE NOTICE 'Test update successful - trigger works!';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Still has error: %', SQLERRM;
END $$;
