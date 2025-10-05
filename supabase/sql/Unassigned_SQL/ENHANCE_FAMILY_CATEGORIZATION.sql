-- ENHANCE FAMILY CATEGORIZATION
-- Add missing categories to match UI dropdown in parts.js
-- This will reduce "לא מוגדר" from 23% to near 0%

-- Drop and recreate trigger with enhanced family matching
DROP TRIGGER IF EXISTS trigger_00_auto_fix_and_extract ON catalog_items CASCADE;
DROP FUNCTION IF EXISTS auto_fix_and_extract() CASCADE;

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
    
    -- 10. ENHANCED PART FAMILY AUTO-CATEGORIZATION (matches UI dropdown)
    IF NEW.part_name IS NOT NULL THEN
        -- פנסים ותאורה (14.75%)
        IF NEW.part_name ~ 'פנס|תאורה|נורה|אור|לד|קסנון|זנון' THEN 
            NEW.part_family := 'פנסים ותאורה';
        
        -- מגנים ופגושים (34.34% - biggest category!)
        ELSIF NEW.part_name ~ 'מגן|פגוש|בולם' THEN 
            NEW.part_family := 'מגנים ופגושים';
        
        -- דלתות וכנפיים (16.68%)
        ELSIF NEW.part_name ~ 'כנף|דלת|מכסה מנוע|מכסה מטען' THEN 
            NEW.part_family := 'דלתות וכנפיים';
        
        -- חלקי מרכב (2.31%)
        ELSIF NEW.part_name ~ 'גריל|רשת|ספויילר|סף|עמוד|פח|חזית|ציר|קורת|שלדה' THEN 
            NEW.part_family := 'חלקי מרכב';
        
        -- מערכות חימום וקירור (2.30%)
        ELSIF NEW.part_name ~ 'רדיאטור|קירור|מזגן|מאוורר|טרמוסטט|אינטרקולר|מדחס' THEN 
            NEW.part_family := 'מערכות חימום וקירור';
        
        -- מנוע וחלקי מנוע (2.12%)
        ELSIF NEW.part_name ~ 'מנוע|בלוק|ראש|קראנק|קאמשפט|אגן שמן|משאבת שמן|טורבו|אלטרנטור' THEN 
            NEW.part_family := 'מנוע וחלקי מנוע';
        
        -- מערכות בלימה והיגוי (1.55%)
        ELSIF NEW.part_name ~ 'בלם|קליפר|דיסק|תוף|הגה|מסרק|בולם זעזועים|מתלה' THEN 
            NEW.part_family := 'מערכות בלימה והיגוי';
        
        -- חלונות ומראות (0.93%)
        ELSIF NEW.part_name ~ 'מראה|חלון|שמשה|זכוכית|סאנרוף' THEN 
            NEW.part_family := 'חלונות ומראות';
        
        -- חיישני מנוע (0.58%)
        ELSIF NEW.part_name ~ 'חיישן|סנסור' THEN 
            NEW.part_family := 'חיישני מנוע';
        
        -- גלגלים וצמיגים (0.49%)
        ELSIF NEW.part_name ~ 'גלגל|חישוק|צמיג|טאסה|ג''אנט|מייסב גלגל' THEN 
            NEW.part_family := 'גלגלים וצמיגים';
        
        -- תיבת הילוכים וחלקים (0.31%)
        ELSIF NEW.part_name ~ 'גיר|תיבת הילוכים|קלאץ|מצמד|ציריה|דיפרנציאל|סרן' THEN 
            NEW.part_family := 'תיבת הילוכים וחלקים';
        
        -- חשמל (0.21%)
        ELSIF NEW.part_name ~ 'מצבר|סוללה|אלטרנטור|קופסת פיוזים|צמת חוטים|ממסר|רילי' THEN 
            NEW.part_family := 'חשמל';
        
        -- חלקי פנים (0.13%)
        ELSIF NEW.part_name ~ 'כסא|מושב|טורפדו|לוח מכוונים|דיפון|ריפוד|קונסולה' THEN 
            NEW.part_family := 'חלקי פנים';
        
        -- מערכת הפליטה (0.12%)
        ELSIF NEW.part_name ~ 'אגזוז|סעפת|דוד|ממיר קטליטי|פליטה' THEN 
            NEW.part_family := 'מערכת הפליטה';
        
        -- מערכת דלק (0.04%)
        ELSIF NEW.part_name ~ 'משאבת דלק|מיכל דלק|טנק|מסנן דלק|אינג''קטור|מזרק' THEN 
            NEW.part_family := 'מערכת דלק';
        
        -- כריות אוויר (0.01%)
        ELSIF NEW.part_name ~ 'כרית אוויר|איירבג' THEN 
            NEW.part_family := 'כריות אוויר';
        
        -- NEW CATEGORIES FROM UI:
        
        -- מתגים/מפסקים/סוויצ'ים
        ELSIF NEW.part_name ~ 'מתג|מפסק|סוויץ|ידית אורות|ידית איתות' THEN 
            NEW.part_family := 'מתגים/מפסקים/סוויצ''ים';
        
        -- מערכת ABS
        ELSIF NEW.part_name ~ 'ABS|בלם קליפר|דריישפט|טבעות' THEN 
            NEW.part_family := 'מערכת ABS';
        
        -- אביזרים נלווים
        ELSIF NEW.part_name ~ 'וו גרירה|גגון|אנטנה|חיישן חניה|מאפרה|רדיו' THEN 
            NEW.part_family := 'אביזרים נלווים';
        
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

-- Test: Update existing records to recategorize with new logic
SELECT 'Trigger updated. Run this to recategorize existing records:' as info;
SELECT 'UPDATE catalog_items SET part_name = part_name WHERE part_family = ''לא מוגדר'';' as command;
