-- ============================================================================
-- DEPLOY CORRECT EXTRACTION - Session 6
-- Date: 2025-10-05
-- Purpose: Deploy clean extraction with:
--          - NO REVERSAL (Python import is fixed)
--          - Correct 18 part families (from parts.js)
--          - Side/position extraction working
--          - Auto-trigger on INSERT/UPDATE for catalog uploads
-- ============================================================================

-- Step 1: Create clean extraction function
CREATE OR REPLACE FUNCTION auto_extract_catalog_data()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    txt text;
    yr text[];
    yr_from_i int;
    yr_to_i int;
BEGIN
    -- Normalize to lowercase for pattern matching
    txt := lower(coalesce(NEW.cat_num_desc, ''));
    
    -- ========================================================================
    -- YEAR EXTRACTION (09-13 / 016-018 patterns)
    -- ========================================================================
    SELECT regexp_match(txt, '(\d{2,3})\s*[-–]\s*(\d{2,3})') INTO yr;
    IF yr IS NOT NULL THEN
        yr_from_i := CASE 
            WHEN length(yr[1]) = 2 THEN 2000 + yr[1]::int
            WHEN length(yr[1]) = 3 THEN 2000 + (yr[1]::int % 100)
            ELSE yr[1]::int 
        END;
        yr_to_i := CASE 
            WHEN length(yr[2]) = 2 THEN 2000 + yr[2]::int
            WHEN length(yr[2]) = 3 THEN 2000 + (yr[2]::int % 100)
            ELSE yr[2]::int 
        END;
        
        IF NEW.year_from IS NULL THEN NEW.year_from := yr_from_i; END IF;
        IF NEW.year_to IS NULL THEN NEW.year_to := yr_to_i; END IF;
        IF NEW.year_range IS NULL THEN 
            NEW.year_range := LPAD((yr_from_i % 100)::TEXT, 3, '0') || '-' || LPAD((yr_to_i % 100)::TEXT, 3, '0');
        END IF;
    END IF;
    
    -- ========================================================================
    -- SIDE EXTRACTION (שמ' / ימ')
    -- ========================================================================
    IF (NEW.side_position IS NULL OR NEW.side_position = '') THEN
        IF txt ~ 'שמ''' OR txt ~ 'שמאל' THEN NEW.side_position := 'שמאל'; END IF;
        IF txt ~ 'ימ''' OR txt ~ 'ימין' THEN NEW.side_position := 'ימין'; END IF;
    END IF;
    
    -- ========================================================================
    -- POSITION EXTRACTION (קד' / אח')
    -- ========================================================================
    IF (NEW.front_rear IS NULL OR NEW.front_rear = '') THEN
        IF txt ~ 'קד''' OR txt ~ 'קדמי' THEN NEW.front_rear := 'קדמי'; END IF;
        IF txt ~ 'אח''' OR txt ~ 'אחורי' THEN NEW.front_rear := 'אחורי'; END IF;
    END IF;
    
    -- ========================================================================
    -- PART NAME EXTRACTION (first Hebrew words)
    -- ========================================================================
    IF NEW.part_name IS NULL AND NEW.cat_num_desc IS NOT NULL THEN
        NEW.part_name := (regexp_match(NEW.cat_num_desc, '^([\u0590-\u05FF\s]+)'))[1];
        NEW.part_name := trim(NEW.part_name);
    END IF;
    
    -- ========================================================================
    -- PART FAMILY - 18 CATEGORIES (from parts.js/PARTS_BANK)
    -- ========================================================================
    IF (NEW.part_family IS NULL OR NEW.part_family = '' OR NEW.part_family = 'לא מוגדר') AND NEW.part_name IS NOT NULL THEN
        
        -- פנסים (Lights)
        IF NEW.part_name ~ 'פנס|תאורה|נורה|אור|לד|קסנון|מהבהב|איתות|זרקור|מחזיר אור|מודול.*פנס|מחשב.*לד|רפלקטור' THEN
            NEW.part_family := 'פנסים';
        
        -- חלונות ומראות (Windows & Mirrors)
        ELSIF NEW.part_name ~ 'מראה|חלון|שמשה|זכוכית|סאנרוף|ראי|כיסוי מראה|יחידת.*חלון' THEN
            NEW.part_family := 'חלונות ומראות';
        
        -- חלקי מרכב (Body Parts) - BIGGEST category
        ELSIF NEW.part_name ~ 'דלת|כנף|מגן|פגוש|בולם דלת|גריל|מכסה מנוע|מכסה.*מטען|טורפדו|טמבון|ידית.*דלת|מנעול|ציר|כננת|מתלה|סמל|פס קישוט|קישוט|תומך|עמוד|גג|רצפת|תא מטען|שלדת|פח|ספויילר' THEN
            NEW.part_family := 'חלקי מרכב';
        
        -- מנוע וחלקי מנוע (Engine & Engine Parts)
        ELSIF NEW.part_name ~ 'מנוע|אגן שמן|ראש|קראנק|טורבו|אינטרקולר|מזרק|בלוק|כיסוי שסתומים|משאבת.*מים|משאבת.*שמן|טיימינג|רצועת|מצתים|קיט התנעה|גלגל תנופה|קולר|מסנן שמן|מצנן|קניסטר|תושבת מנוע|קרטר|פולי' THEN
            NEW.part_family := 'מנוע וחלקי מנוע';
        
        -- חיישני מנוע (Engine Sensors)
        ELSIF NEW.part_name ~ 'חיישן.*ABS|חיישן.*קראנק|חיישן.*חמצן|חיישן.*מצערת|חיישן.*לחץ|חיישן.*זרימ|חיישן.*נקישות|חיישן.*TDC|חיישן.*טמפ|חיישן.*כמות|שסתום EGR' THEN
            NEW.part_family := 'חיישני מנוע';
        
        -- מערכות חימום וקירור (Heating & Cooling)
        ELSIF NEW.part_name ~ 'רדיאטור|ראדיאטור|מזגן|מצנן|מאוורר.*רדיאטור|מעבה|מייבש|מדחס|טרמוסטט|מפוח|צינור.*מים|אטם.*טרמו|כונס מצנן|מסנן מזגן|יחידת.*אקלים|רצועת מזגן' THEN
            NEW.part_family := 'מערכות חימום וקירור';
        
        -- מערכות בלימה והיגוי (Braking & Steering)
        ELSIF NEW.part_name ~ 'בלם|בולם זעזועים|בולמים|דיסק|רפידות|קליפר|צלחת|פדל.*בלם|הגה|זרוע|מגבר.*בלם|משאבת.*בלם|נבה|חובק|טבעות ABS|כבל.*בלם יד|עמוד הגה|תפוח הגה' THEN
            NEW.part_family := 'מערכות בלימה והיגוי';
        
        -- תיבת הילוכים וחלקים (Transmission)
        ELSIF NEW.part_name ~ 'גיר|תיבת הילוכים|תיבת העברה|קלאץ|מצמד|ציריה|סרן|דיפרנציאל|פעמון|כבל.*הילוכים|פדל.*קלאץ|אגן שמן גיר|מזלג|תושבת גיר|קולר גיר|וסת הילוכים' THEN
            NEW.part_family := 'תיבת הילוכים וחלקים';
        
        -- מערכת דלק (Fuel System)
        ELSIF NEW.part_name ~ 'משאבת דלק|מיכל דלק|טנק.*דלק|אינגקטור|מרסס|גוף מצערת|מד דלק|מצוף|פילטר דלק|צינור דלק|ממיר קטליטי|קרבורטור|ממסר.*משאבת' THEN
            NEW.part_family := 'מערכת דלק';
        
        -- מערכת הפליטה (Exhaust System)
        ELSIF NEW.part_name ~ 'אגזוז|סעפת.*פליטה|סעפת.*יניקה|דוד|מגן חום|מסנן חלקיקים|צנרת.*פליטה|אטם.*סעפת|מיכל אוריאה' THEN
            NEW.part_family := 'מערכת הפליטה';
        
        -- חשמל (Electrical)
        ELSIF NEW.part_name ~ 'אלטרנטור|סוללה|מצבר|ממסר|צפצפה|צמת חוטים|קופסת פיוזים|מנוע חשמלי|משאבת.*חשמלית|מגבר הצתה|סליל|כוהל|דסטרביוטר|יחידת.*בקרה.*חלון|יחידת.*בקרה.*הגה|מפסק אור|מצלמה|רדאר|שקע טעינה|מודול שליטת|יחידת נעילה|בקר שיוט' THEN
            NEW.part_family := 'חשמל';
        
        -- מנוע - יחידת בקרת ECU
        ELSIF NEW.part_name ~ 'יחידת בקרה.*מנוע|יחידת בקרה.*הצתה|מחשב.*ABS|מחשב.*בודי|יחידת בקרה.*תיבת|יחידת בקרה.*דלק|יחידת בקרה.*נוחות|יחידת בקרה.*אורות|יחידת בקרה.*מזגן|מד זרימת' THEN
            NEW.part_family := 'מנוע - יחידת בקרת ECU';
        
        -- כריות אוויר (Airbags)
        ELSIF NEW.part_name ~ 'כרית אוויר|כרית|חיישן.*כרית|חיישן.*התנגשות|יחידת.*SRS|יחידת.*שליטה.*כרית|סליל.*שעון.*כרית' THEN
            NEW.part_family := 'כריות אוויר';
        
        -- מערכת ABS
        ELSIF NEW.part_name ~ 'יחידת ABS|משאבת ABS|מודולטור|דריישפט|בלם.*קליפר.*ABS|יחידת ECU|יחידת.*שליטה.*בלימה' THEN
            NEW.part_family := 'מערכת ABS';
        
        -- גלגלים וצמיגים (Wheels & Tires)
        ELSIF NEW.part_name ~ 'גלגל|צמיג|ג''ק|ג''אנט|חישוק|מייסב.*גלגל|תושבת גלגל|גלגל רזרבי' THEN
            NEW.part_family := 'גלגלים וצמיגים';
        
        -- חלקי פנים (Interior Parts)
        ELSIF NEW.part_name ~ 'כסא|מושב|גלגל הגה|הגה.*כח|לוח.*מכוונים|לוח.*שעונים|מד.*מהירות|פדל|קונסולה|ריפוד|משענת|ספסל|דיפון|תא כפפות|דלת.*תא|ידית.*פנימית|ידית.*אורות|ידית.*איתות|חגורת בטיחות|בלם יד|כיסוי.*בלם יד|אמברקס|אטמי גומי|גומי.*אוטם|מראה פנימית|מערכת מולטימדיה|מפתח|מפעיל בקר|מתג זכרון|סוויץ|ידית אחיזה' THEN
            NEW.part_family := 'חלקי פנים';
        
        -- מתגים/מפסקים/סוויצ'ים (Switches)
        ELSIF NEW.part_name ~ 'מתג ESP|מתג.*אור ברקס|מתג.*בקר שיוט|מתג.*חימום|מתג.*טמפ|מתג.*מזגן|מתג.*מראה|מתג.*נעילה|מתנע|סטרטר|חיישן דלת|ידית.*מגבים|מתג.*סנרוף' THEN
            NEW.part_family := 'מתגים/מפסקים/סוויצ''ים';
        
        -- ממסרים (Relays)
        ELSIF NEW.part_name ~ 'ממסר.*אלטרנטור|ממסר.*הזרקת|ממסר.*התנעה|ממסר.*מאוורר|ממסר.*מגבים|ממסר.*משאבת דלק|ממסר.*נעילה|ממסר.*פנס' THEN
            NEW.part_family := 'ממסרים';
        
        -- אביזרים נלווים (Accessories)
        ELSIF NEW.part_name ~ 'אזעקה|אימוביליזר|אנטנה|גגון|וו.*גרירה|חיישן.*חניה|חצאית|ידית הילוכים|כיסוי.*וו|כיסוי.*רזרבי|מאפרה|מדף|מדרגה|מיכל.*מים.*מגבים|מכסה.*תא דלק|מנשא|רדיו|ספויילר|סט חישוקי|טאסה|מצת' THEN
            NEW.part_family := 'אביזרים נלווים';
        
        -- Default fallback
        ELSE
            NEW.part_family := 'חלקי מרכב';
        END IF;
    END IF;
    
    -- ========================================================================
    -- MAKE NORMALIZATION (remove country suffixes)
    -- ========================================================================
    IF NEW.make IS NOT NULL THEN
        NEW.make := regexp_replace(NEW.make, '\s+(יפן|ארהב|גרמניה|קוריאה|צרפת|איטליה|אנגליה|שוודיה)$', '', 'gi');
        NEW.make := trim(NEW.make);
    END IF;
    
    RETURN NEW;
END;
$$;

-- Step 2: Create triggers for auto-processing
DROP TRIGGER IF EXISTS auto_process_catalog_on_insert ON catalog_items;
DROP TRIGGER IF EXISTS auto_process_catalog_on_update ON catalog_items;

CREATE TRIGGER auto_process_catalog_on_insert
BEFORE INSERT ON catalog_items
FOR EACH ROW
EXECUTE FUNCTION auto_extract_catalog_data();

CREATE TRIGGER auto_process_catalog_on_update
BEFORE UPDATE ON catalog_items
FOR EACH ROW
EXECUTE FUNCTION auto_extract_catalog_data();

-- Verification
SELECT 
    'DEPLOYMENT COMPLETE' as status,
    'Auto-extraction triggers created' as result;

-- Check triggers
SELECT 
    'ACTIVE TRIGGERS' as type,
    tgname as name
FROM pg_trigger
WHERE tgrelid = 'catalog_items'::regclass
  AND tgname NOT LIKE 'RI_Constraint%'
ORDER BY tgname;
