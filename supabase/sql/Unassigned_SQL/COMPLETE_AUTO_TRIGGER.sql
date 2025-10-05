-- COMPLETE AUTOMATIC TRIGGER - ALL FIXES AND EXTRACTIONS
-- This ONE trigger handles EVERYTHING on catalog upload:
--
-- 1. Hebrew Reversal Fix (make, source, part_family, cat_num_desc)
-- 2. Side/Front-Rear Confusion Fix (קד'/אח' → front_rear, שמ'/ימ' → side_position)
-- 3. Part Name Extraction (first Hebrew words from cat_num_desc)
-- 4. Model Code Extraction (A3, X5, etc.)
-- 5. Year Range Extraction with Reversal Fix (01-80 → 80-01)
-- 6. Year From/To Extraction (with century logic: ≥80=19XX, <80=20XX)
-- 7. Model Extraction (all makes: טויוטה, VAG, BMW, פולקסווגן, פורד, etc.)
-- 8. Extracted Year Creation (for display and search)
-- 9. Model Display Creation (model + year combined display)
-- 10. Part Family Auto-Categorization (17 categories based on part_name patterns)
--
-- Replaces: auto_fix_hebrew_reversal, process_catalog_item_complete, extract_model_and_year

DROP FUNCTION IF EXISTS auto_fix_and_extract() CASCADE;

CREATE OR REPLACE FUNCTION auto_fix_and_extract()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    txt text;
    year_match text[];
    yr_from_str text;
    yr_to_str text;
    yr_from_int int;
    yr_to_int int;
    temp_year_range text;
BEGIN
    -- ============================================================================
    -- STEP 1: FIX HEBREW REVERSAL (all Hebrew fields)
    -- ============================================================================
    
    IF NEW.make IS NOT NULL AND NEW.make ~ '[א-ת]' THEN
        NEW.make := reverse(NEW.make);
    END IF;
    
    IF NEW.source IS NOT NULL AND NEW.source ~ '[א-ת]' THEN
        NEW.source := reverse(NEW.source);
    END IF;
    
    IF NEW.part_family IS NOT NULL AND NEW.part_family ~ '[א-ת]' THEN
        NEW.part_family := reverse(NEW.part_family);
    END IF;
    
    IF NEW.cat_num_desc IS NOT NULL AND NEW.cat_num_desc ~ '[א-ת]' THEN
        NEW.cat_num_desc := reverse(NEW.cat_num_desc);
    END IF;
    
    -- ============================================================================
    -- STEP 2: EXTRACT BASIC FIELDS FROM cat_num_desc
    -- ============================================================================
    
    txt := COALESCE(NEW.cat_num_desc, '');
    
    -- Extract part_name (first Hebrew word(s))
    IF NEW.part_name IS NULL AND txt != '' THEN
        NEW.part_name := (regexp_match(txt, '^([א-ת'' ]+)'))[1];
    END IF;
    
    -- Extract model_code
    IF NEW.model_code IS NULL THEN
        NEW.model_code := (regexp_match(txt, '[א-ת]+\s+([A-Z0-9]{1,3})(?:\s|$)'))[1];
    END IF;
    
    -- Extract side_position and front_rear (שמ', ימ', אח', קד')
    -- Priority: שמ'/ימ' (side) takes precedence over קד'/אח' (front/rear)
    
    IF txt ~ '(שמ''|ימ'')' THEN
        -- Has side position - extract it
        IF txt ~ 'שמ''' THEN
            NEW.side_position := 'שמאל';
        ELSIF txt ~ 'ימ''' THEN
            NEW.side_position := 'ימין';
        END IF;
        NEW.front_rear := NULL;
    ELSIF txt ~ '(קד''|אח'')' THEN
        -- Has front/rear but no side position
        IF txt ~ 'קד''' THEN
            NEW.front_rear := 'קדמי';
        ELSIF txt ~ 'אח''' THEN
            NEW.front_rear := 'אחורי';
        END IF;
        NEW.side_position := NULL;
    END IF;
    
    -- Extract and normalize year_range
    IF txt ~ '\d{2,4}-\d{2,4}' THEN
        temp_year_range := (regexp_match(txt, '(\d{2,4}-\d{2,4})'))[1];
        
        yr_from_str := split_part(temp_year_range, '-', 1);
        yr_to_str := split_part(temp_year_range, '-', 2);
        
        -- Normalize 3-digit years to 2-digit (810 → 10, 015 → 15)
        IF length(yr_from_str) = 3 THEN
            yr_from_str := RIGHT(yr_from_str, 2);
        END IF;
        IF length(yr_to_str) = 3 THEN
            yr_to_str := RIGHT(yr_to_str, 2);
        END IF;
        
        -- Always store in chronological order (older-newer)
        -- Since source data is reversed, we ALWAYS reverse it
        NEW.year_range := yr_to_str || '-' || yr_from_str;
    END IF;
    
    -- ============================================================================
    -- STEP 3: EXTRACT MODEL (based on make)
    -- ============================================================================
    
    IF NEW.make = 'טויוטה' THEN
        IF txt LIKE '%קורולה%' THEN NEW.model := 'קורולה';
        ELSIF txt LIKE '%קאמרי%' THEN NEW.model := 'קאמרי';
        ELSIF txt LIKE '%פריוס%' THEN NEW.model := 'פריוס';
        ELSIF txt LIKE '%היילקס%' THEN NEW.model := 'היילקס';
        ELSIF txt LIKE '%יאריס%' THEN NEW.model := 'יאריס';
        ELSIF txt LIKE '%אוריס%' THEN NEW.model := 'אוריס';
        ELSIF txt LIKE '%ראב%' THEN NEW.model := 'RAV4';
        END IF;
    ELSIF NEW.make = 'VAG' OR NEW.make = 'אודי' THEN
        IF txt LIKE '%A3%' THEN NEW.model := 'A3';
        ELSIF txt LIKE '%A4%' THEN NEW.model := 'A4';
        ELSIF txt LIKE '%A5%' THEN NEW.model := 'A5';
        ELSIF txt LIKE '%A6%' THEN NEW.model := 'A6';
        ELSIF txt LIKE '%Q3%' THEN NEW.model := 'Q3';
        ELSIF txt LIKE '%Q5%' THEN NEW.model := 'Q5';
        ELSIF txt LIKE '%Q7%' THEN NEW.model := 'Q7';
        END IF;
    ELSIF NEW.make = 'ב.מ.וו / מיני' OR NEW.make = 'BMW / מיני' THEN
        IF txt LIKE '%X1%' THEN NEW.model := 'X1';
        ELSIF txt LIKE '%X3%' THEN NEW.model := 'X3';
        ELSIF txt LIKE '%X5%' THEN NEW.model := 'X5';
        ELSIF txt LIKE '%X6%' THEN NEW.model := 'X6';
        END IF;
    ELSIF NEW.make = 'פולקסווגן' THEN
        IF txt LIKE '%גולף%' THEN NEW.model := 'גולף';
        ELSIF txt LIKE '%פאסאט%' THEN NEW.model := 'פאסאת';
        ELSIF txt LIKE '%פולו%' THEN NEW.model := 'פולו';
        ELSIF txt LIKE '%טיגואן%' THEN NEW.model := 'טיגואן';
        END IF;
    ELSIF NEW.make = 'פורד' THEN
        IF txt LIKE '%פוקוס%' THEN NEW.model := 'פוקוס';
        ELSIF txt LIKE '%פיאסטה%' THEN NEW.model := 'פיאסטה';
        ELSIF txt LIKE '%מונדאו%' THEN NEW.model := 'מונדאו';
        END IF;
    ELSIF NEW.make = 'יונדאי' THEN
        IF txt LIKE '%i10%' THEN NEW.model := 'i10';
        ELSIF txt LIKE '%i20%' THEN NEW.model := 'i20';
        ELSIF txt LIKE '%i30%' THEN NEW.model := 'i30';
        ELSIF txt LIKE '%טוסון%' THEN NEW.model := 'טוסון';
        ELSIF txt LIKE '%סנטה%' THEN NEW.model := 'סנטה פה';
        END IF;
    ELSIF NEW.make = 'קיה' THEN
        IF txt LIKE '%ספורטאז%' THEN NEW.model := 'ספורטאז';
        ELSIF txt LIKE '%סורנטו%' THEN NEW.model := 'סורנטו';
        ELSIF txt LIKE '%ריו%' THEN NEW.model := 'ריו';
        END IF;
    ELSIF NEW.make = 'מאזדה' THEN
        IF txt LIKE '%3%' THEN NEW.model := '3';
        ELSIF txt LIKE '%6%' THEN NEW.model := '6';
        ELSIF txt LIKE '%CX-5%' THEN NEW.model := 'CX-5';
        END IF;
    ELSIF NEW.make = 'סקודה' THEN
        IF txt LIKE '%אוקטביה%' THEN NEW.model := 'אוקטביה';
        ELSIF txt LIKE '%פאביה%' THEN NEW.model := 'פאביה';
        ELSIF txt LIKE '%סופרב%' THEN NEW.model := 'סופרב';
        END IF;
    ELSIF NEW.make = 'סיאט' THEN
        IF txt LIKE '%לאון%' THEN NEW.model := 'לאון';
        ELSIF txt LIKE '%איביזה%' THEN NEW.model := 'איביזה';
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 4: EXTRACT YEAR_FROM and YEAR_TO
    -- ============================================================================
    
    -- Pattern 1: XX-XX (e.g., 01-80)
    SELECT regexp_match(txt, '(\d{2})-(\d{2})') INTO year_match;
    
    -- Pattern 2: XXX- (e.g., 015-)
    IF year_match IS NULL THEN
        SELECT regexp_match(txt, '(\d{3})-') INTO year_match;
    END IF;
    
    -- Pattern 3: -XXX (e.g., -019)
    IF year_match IS NULL THEN
        SELECT regexp_match(txt, '-(\d{3})') INTO year_match;
    END IF;
    
    IF year_match IS NOT NULL THEN
        yr_from_str := year_match[1];
        yr_to_str := year_match[2];
        
        -- Convert year_from
        IF yr_from_str IS NOT NULL THEN
            IF length(yr_from_str) = 2 THEN
                IF yr_from_str::int >= 80 THEN
                    yr_from_int := 1900 + yr_from_str::int;
                ELSE
                    yr_from_int := 2000 + yr_from_str::int;
                END IF;
            ELSIF length(yr_from_str) = 3 THEN
                yr_from_int := 2000 + yr_from_str::int;
            END IF;
            
            IF yr_from_int >= 1980 AND yr_from_int <= 2030 THEN
                NEW.year_from := yr_from_int;
            END IF;
        END IF;
        
        -- Convert year_to
        IF yr_to_str IS NOT NULL THEN
            IF length(yr_to_str) = 2 THEN
                IF yr_to_str::int >= 80 THEN
                    yr_to_int := 1900 + yr_to_str::int;
                ELSE
                    yr_to_int := 2000 + yr_to_str::int;
                END IF;
            ELSIF length(yr_to_str) = 3 THEN
                yr_to_int := 2000 + yr_to_str::int;
            END IF;
            
            IF yr_to_int >= 1980 AND yr_to_int <= 2030 THEN
                NEW.year_to := yr_to_int;
            END IF;
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 5: CREATE extracted_year and model_display
    -- ============================================================================
    
    -- Extract extracted_year (for display and search)
    IF NEW.extracted_year IS NULL THEN
        NEW.extracted_year := COALESCE(
            NEW.year_from::TEXT,
            (regexp_match(txt, '(\d{4})'))[1],
            (regexp_match(NEW.model, '(\d{4})'))[1]
        );
    END IF;
    
    -- Create model_display (combined model + year)
    -- Only populate if we have a model; don't show year-only displays
    NEW.model_display := CASE 
        WHEN NEW.model IS NOT NULL AND NEW.extracted_year IS NOT NULL THEN 
            NEW.model || ' (' || NEW.extracted_year || ')'
        WHEN NEW.model IS NOT NULL THEN 
            NEW.model
        ELSE 
            NULL
    END;
    
    -- ============================================================================
    -- STEP 6: AUTO-CATEGORIZE PART_FAMILY
    -- ============================================================================
    
    IF NEW.part_family IS NULL OR NEW.part_family = 'מקורי' THEN
        NEW.part_family := CASE 
            WHEN NEW.part_name ~ 'פנס|נורה|זרקור|מהבהב|איתות|עדשה|רפלקטור' THEN 'פנסים ותאורה'
            WHEN NEW.part_name ~ 'דלת|כנף|מכסה מנוע|תא מטען|חלון' THEN 'דלתות וכנפיים'
            WHEN NEW.part_name ~ 'מגן|פגוש|ספוילר|גריל|מסגרת' THEN 'מגנים ופגושים'
            WHEN NEW.part_name ~ 'ידית|מנעול|ציר|בולם דלת|מרים|תומך|קורת רוחב|שלדת|רצפת|גג|דופן' THEN 'חלקי מרכב'
            WHEN NEW.part_name ~ 'מראה|חלון|שמשה|זכוכית' THEN 'חלונות ומראות'
            WHEN NEW.part_name ~ 'גלגל|צמיג|מייסב גלגל|תושבת גלגל|ג''אנט|טאסה' THEN 'גלגלים וצמיגים'
            WHEN NEW.part_name ~ 'מנוע|בלוק|ראש מנוע|משאבת|מסנן|פילטר|אגן שמן|אטם|טרמוסטט|טורבו|אלטרנטור' THEN 'מנוע וחלקי מנוע'
            WHEN NEW.part_name ~ 'חיישן' THEN 'חיישני מנוע'
            WHEN NEW.part_name ~ 'מצבר|ממסר|יחידת בקרה|מחשב|סוויץ|מתג' THEN 'חשמל'
            WHEN NEW.part_name ~ 'בלם|קליפר|דיסק|הגה|זרוע|בולם זעזועים|מסרק|רפידות' THEN 'מערכות בלימה והיגוי'
            WHEN NEW.part_name ~ 'גיר|תיבת|קלאץ|מצמד|דיפרנציאל|סרן' THEN 'תיבת הילוכים וחלקים'
            WHEN NEW.part_name ~ 'דלק|טנק|מיכל דלק|מצוף' THEN 'מערכת דלק'
            WHEN NEW.part_name ~ 'רדיאטור|מאוורר|מזגן|אינטרקולר' THEN 'מערכות חימום וקירור'
            WHEN NEW.part_name ~ 'ABS|טבעות ABS' THEN 'מערכת ABS'
            WHEN NEW.part_name ~ 'אגזוז|סעפת|צנרת פליטה|ממיר קטליטי' THEN 'מערכת הפליטה'
            WHEN NEW.part_name ~ 'כרית אוויר|SRS' THEN 'כריות אוויר'
            WHEN NEW.part_name ~ 'כסא|מושב|דאשבורד|טורפדו|לוח מכוונים|ריפוד' THEN 'חלקי פנים'
            ELSE COALESCE(NEW.part_family, 'לא מוגדר')
        END;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Drop ALL existing triggers
DROP TRIGGER IF EXISTS trigger_00_auto_fix_hebrew_reversal ON catalog_items;
DROP TRIGGER IF EXISTS trigger_01_set_supplier_name ON catalog_items;
DROP TRIGGER IF EXISTS trigger_02_auto_process_catalog_item ON catalog_items;
DROP TRIGGER IF EXISTS trigger_03_extract_model_and_year ON catalog_items;
DROP TRIGGER IF EXISTS auto_process_catalog_item ON catalog_items;
DROP TRIGGER IF EXISTS trigger_extract_model_and_year ON catalog_items;

-- Create supplier name trigger (keep this separate, it's not related to extraction)
CREATE TRIGGER trigger_01_set_supplier_name
    BEFORE INSERT OR UPDATE
    ON catalog_items
    FOR EACH ROW
    EXECUTE FUNCTION _set_supplier_name();

-- Create the ONE comprehensive trigger
CREATE TRIGGER trigger_00_auto_fix_and_extract
    BEFORE INSERT OR UPDATE
    ON catalog_items
    FOR EACH ROW
    EXECUTE FUNCTION auto_fix_and_extract();

-- Verify trigger order
SELECT 
    trigger_name,
    event_manipulation,
    action_order
FROM information_schema.triggers
WHERE event_object_table = 'catalog_items'
ORDER BY action_order;
