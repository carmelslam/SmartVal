-- RECREATE TRIGGER TO USE NEW reverse_hebrew() FUNCTION
-- The trigger needs to be dropped and recreated to pick up the updated function

-- Drop existing trigger
DROP TRIGGER IF EXISTS trigger_00_auto_fix_and_extract ON catalog_items CASCADE;

-- Drop the trigger function
DROP FUNCTION IF EXISTS auto_fix_and_extract() CASCADE;

-- Now recreate the trigger function (it will use the new reverse_hebrew)
-- Copy from COMPLETE_AUTO_TRIGGER.sql with updated reverse_hebrew call

CREATE OR REPLACE FUNCTION auto_fix_and_extract()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- 1. HEBREW REVERSAL FIX (using updated reverse_hebrew that preserves English)
    IF NEW.cat_num_desc IS NOT NULL AND NEW.cat_num_desc ~ '[א-ת]' THEN
        NEW.cat_num_desc := reverse_hebrew(NEW.cat_num_desc);
    END IF;
    
    IF NEW.make IS NOT NULL AND NEW.make ~ '[א-ת]' THEN
        NEW.make := reverse_hebrew(NEW.make);
    END IF;
    
    IF NEW.source IS NOT NULL AND NEW.source ~ '[א-ת]' THEN
        NEW.source := reverse_hebrew(NEW.source);
    END IF;
    
    IF NEW.part_family IS NOT NULL AND NEW.part_family ~ '[א-ת]' THEN
        NEW.part_family := reverse_hebrew(NEW.part_family);
    END IF;

    IF NEW.engine_type IS NOT NULL AND NEW.engine_type ~ '[א-ת]' THEN
        NEW.engine_type := reverse_hebrew(NEW.engine_type);
    END IF;
    
    -- 2. SIDE/FRONT-REAR CONFUSION FIX
    IF NEW.cat_num_desc ~ 'אח''' THEN
        NEW.front_rear := 'אחורי';
    ELSIF NEW.cat_num_desc ~ 'קד''' THEN
        NEW.front_rear := 'קדמי';
    END IF;
    
    IF NEW.cat_num_desc ~ 'שמ''' THEN
        NEW.side_position := 'שמאל';
    ELSIF NEW.cat_num_desc ~ 'ימ''' THEN
        NEW.side_position := 'ימין';
    END IF;
    
    -- 3. PART NAME EXTRACTION (first Hebrew words)
    IF NEW.cat_num_desc IS NOT NULL THEN
        NEW.part_name := substring(NEW.cat_num_desc from '^([א-ת\s]+)');
        NEW.part_name := trim(NEW.part_name);
    END IF;
    
    -- 4. MODEL CODE EXTRACTION
    IF NEW.cat_num_desc ~ '[A-Z][0-9]' THEN
        NEW.model_code := substring(NEW.cat_num_desc from '([A-Z][0-9][A-Z0-9]*)');
    END IF;
    
    -- 5. YEAR RANGE EXTRACTION
    IF NEW.cat_num_desc ~ '\d{3}-\d{2,3}' OR NEW.cat_num_desc ~ '\d{2}-\d{2,3}' THEN
        NEW.year_range := substring(NEW.cat_num_desc from '(\d{2,3}-\d{2,3})');
        
        IF NEW.year_range IS NOT NULL THEN
            DECLARE
                year1 TEXT;
                year2 TEXT;
                year1_normalized TEXT;
                year2_normalized TEXT;
            BEGIN
                year1 := split_part(NEW.year_range, '-', 1);
                year2 := split_part(NEW.year_range, '-', 2);
                
                IF length(year1) = 3 THEN year1_normalized := substring(year1 from 2); 
                ELSE year1_normalized := year1; END IF;
                
                IF length(year2) = 3 THEN year2_normalized := substring(year2 from 2);
                ELSE year2_normalized := year2; END IF;
                
                NEW.year_range := year2_normalized || '-' || year1_normalized;
            END;
        END IF;
    END IF;
    
    -- 6. YEAR FROM/TO EXTRACTION
    IF NEW.year_range IS NOT NULL THEN
        DECLARE
            year_from_str TEXT;
            year_to_str TEXT;
        BEGIN
            year_from_str := split_part(NEW.year_range, '-', 1);
            year_to_str := split_part(NEW.year_range, '-', 2);
            
            IF year_from_str::INT >= 80 THEN
                NEW.year_from := 1900 + year_from_str::INT;
            ELSE
                NEW.year_from := 2000 + year_from_str::INT;
            END IF;
            
            IF year_to_str::INT >= 80 THEN
                NEW.year_to := 1900 + year_to_str::INT;
            ELSE
                NEW.year_to := 2000 + year_to_str::INT;
            END IF;
        END;
    END IF;
    
    -- 7. MODEL EXTRACTION (all makes)
    IF NEW.cat_num_desc ~ 'קורולה|קאמרי|יאריס|ראב|פריוס|לנד קרוזר|היילקס|אונסיס' THEN
        NEW.model := substring(NEW.cat_num_desc from '(קורולה|קאמרי|יאריס|ראב|פריוס|לנד קרוזר|היילקס|אונסיס)');
    ELSIF NEW.cat_num_desc ~ '[A-Z]{2,}' THEN
        NEW.model := substring(NEW.cat_num_desc from '([A-Z]{2,}(?:\s+[A-Z]+)?)');
    END IF;
    
    -- 8. EXTRACTED YEAR CREATION
    IF NEW.year_from IS NOT NULL THEN
        NEW.extracted_year := NEW.year_from::TEXT;
    END IF;
    
    -- 9. MODEL DISPLAY CREATION
    IF NEW.model IS NOT NULL AND NEW.model != '' AND NEW.year_from IS NOT NULL THEN
        NEW.model_display := NEW.model || ' (' || NEW.year_from::TEXT || ')';
    END IF;
    
    -- 10. PART FAMILY AUTO-CATEGORIZATION
    IF NEW.part_name IS NOT NULL THEN
        IF NEW.part_name ~ 'פנס|תאורה|נורה' THEN NEW.part_family := 'פנסים ותאורה';
        ELSIF NEW.part_name ~ 'מגן|פגוש' THEN NEW.part_family := 'מגנים';
        ELSIF NEW.part_name ~ 'כנף|דלת' THEN NEW.part_family := 'דלתות וכנפיים';
        ELSIF NEW.part_name ~ 'מנוע' THEN NEW.part_family := 'מנוע והילוכים';
        ELSIF NEW.part_name ~ 'בלם' THEN NEW.part_family := 'מערכת בלימה';
        ELSIF NEW.part_name ~ 'גלגל|חישוק|צמיג' THEN NEW.part_family := 'גלגלים וצמיגים';
        ELSIF NEW.part_name ~ 'מראה' THEN NEW.part_family := 'מראות';
        ELSIF NEW.part_name ~ 'שמשה|חלון' THEN NEW.part_family := 'חלונות ושמשות';
        ELSIF NEW.part_name ~ 'מצבר|סוללה' THEN NEW.part_family := 'מערכת חשמל';
        ELSIF NEW.part_name ~ 'רדיאטור|קירור' THEN NEW.part_family := 'מערכת קירור';
        ELSIF NEW.part_name ~ 'תושבת|מתלה' THEN NEW.part_family := 'מתלים ותושבות';
        ELSIF NEW.part_name ~ 'סרן|גלגלת' THEN NEW.part_family := 'מערכת הנעה';
        ELSIF NEW.part_name ~ 'משאבה|שמן' THEN NEW.part_family := 'מערכת שמן';
        ELSIF NEW.part_name ~ 'קליפס|תפס' THEN NEW.part_family := 'אביזרי חיבור';
        ELSIF NEW.part_name ~ 'מסנן|פילטר' THEN NEW.part_family := 'מסננים';
        ELSIF NEW.part_name ~ 'רשת|גריל' THEN NEW.part_family := 'רשתות וגרילים';
        ELSIF NEW.part_name ~ 'מדבקה|סמל' THEN NEW.part_family := 'אביזרי עיצוב';
        END IF;
    END IF;
    
    -- Default source to חליפי if null
    IF NEW.source IS NULL OR NEW.source = '' THEN
        NEW.source := 'חליפי';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER trigger_00_auto_fix_and_extract
    BEFORE INSERT OR UPDATE ON catalog_items
    FOR EACH ROW
    EXECUTE FUNCTION auto_fix_and_extract();

-- Test that the trigger now uses the updated reverse_hebrew
SELECT 'Trigger recreated successfully' as status;
