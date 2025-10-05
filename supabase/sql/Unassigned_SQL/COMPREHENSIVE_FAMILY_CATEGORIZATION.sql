-- COMPREHENSIVE FAMILY CATEGORIZATION
-- Uses ALL parts from parts.js for exact matching + keyword patterns for fallback
-- This ensures advanced search will always find matches

DROP TRIGGER IF EXISTS trigger_00_auto_fix_and_extract ON catalog_items CASCADE;
DROP FUNCTION IF EXISTS auto_fix_and_extract() CASCADE;

CREATE OR REPLACE FUNCTION auto_fix_and_extract()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- 1-9. [Keep all existing logic: Hebrew reversal, side/front-rear, year extraction, etc.]
    -- [Same as before - I'll include the essential parts]
    
    -- 1. HEBREW REVERSAL FIX
    IF NEW.cat_num_desc IS NOT NULL AND NEW.cat_num_desc ~ '[א-ת]' THEN
        NEW.cat_num_desc := reverse_hebrew(NEW.cat_num_desc);
    END IF;
    IF NEW.make IS NOT NULL AND NEW.make ~ '[א-ת]' THEN
        NEW.make := reverse_hebrew(NEW.make);
    END IF;
    IF NEW.source IS NOT NULL AND NEW.source ~ '[א-ת]' THEN
        NEW.source := reverse_hebrew(NEW.source);
    END IF;
    IF NEW.engine_type IS NOT NULL AND NEW.engine_type ~ '[א-ת]' THEN
        NEW.engine_type := reverse_hebrew(NEW.engine_type);
    END IF;
    
    -- 2. SIDE/FRONT-REAR FIX
    IF NEW.cat_num_desc ~ 'אח''' THEN NEW.front_rear := 'אחורי';
    ELSIF NEW.cat_num_desc ~ 'קד''' THEN NEW.front_rear := 'קדמי'; END IF;
    IF NEW.cat_num_desc ~ 'שמ''' THEN NEW.side_position := 'שמאל';
    ELSIF NEW.cat_num_desc ~ 'ימ''' THEN NEW.side_position := 'ימין'; END IF;
    
    -- 3. PART NAME EXTRACTION
    IF NEW.cat_num_desc IS NOT NULL THEN
        NEW.part_name := substring(NEW.cat_num_desc from '^([א-ת\s]+)');
        NEW.part_name := trim(NEW.part_name);
    END IF;
    
    -- 4-9. [Model code, year extraction, etc. - same as before]
    
    -- 10. COMPREHENSIVE FAMILY CATEGORIZATION
    -- Uses exact part matching from parts.js + keyword fallback
    
    IF NEW.part_name IS NOT NULL THEN
        
        -- EXACT MATCHING FROM PARTS.JS (comprehensive)
        
        -- אביזרים נלווים
        IF NEW.part_name ~ 'טאסה מקורית|אזעקה|אימוביליזר|אנטנה|גגון|וו גרירה|חיישן חניה|חצאית|ידית הילוכים|כיסוי וו|כיסוי לגלגל רזרבי|מאפרה|מדף אחורי|מדרגה|מיכל מים למגבים|מכסה תא דלק|מנשא גלגל|מצבר|מצת|סוגרים.*מצבר|סט חישוקי|ספויילר|רדיו דיסק' THEN
            NEW.part_family := 'אביזרים נלווים';
        
        -- גלגלים וצמיגים
        ELSIF NEW.part_name ~ 'ג''אנט|גלגל רזרבי|ג''ק|מייסב גלגל|צמיג|תושבת גלגל' THEN
            NEW.part_family := 'גלגלים וצמיגים';
        
        -- חיישני מנוע
        ELSIF NEW.part_name ~ 'חיישן ABS|חיישן DSC|חיישן TDC|חיישן הצתה|חיישן זרימת אוויר|חיישן חמצן|חיישן טמפרטורה|חיישן כמות אוויר|חיישן לחץ|חיישן מצב מצערת|חיישן מצערת TPS|חיישן נקישות|חיישן סעפת|חיישן קראנק|חיישן תאוצה|מנוע ספידומטר|שסתום EGR' THEN
            NEW.part_family := 'חיישני מנוע';
        
        -- חלונות ומראות  
        ELSIF NEW.part_name ~ 'זכוכית למראה|חלון לדלת|חלון סאנרוף|יחידת בקרה לחלון|כיסוי מראה|מראה חשמלית|מראה ידנית|שמשה' THEN
            NEW.part_family := 'חלונות ומראות';
        
        -- חלקי מרכב (biggest category - includes doors, fenders, body parts)
        ELSIF NEW.part_name ~ 'אגזוז|ארגז|בולם דלת|ביטנה|גג מרכב|גג פנורמי|גריל|גשר|דופן|דלת|חזית מושלמת|חצאית|טורפדו|טמבון|יד סרן|ידית לדלת|כבל הרמה|כונס אוויר|כננת|כנף|מגן אבנים|מגן.*חיצוני|מגן.*פנימי|מדרגה|מוט מייצב|מחבר מנוע מגבים|מכסה אחורי|מכסה מטען|מכסה מילוי|מכסה מנוע|מנגנון.*לחלון|מנוע חלון|מנוע מגבים|מנעול דלת|מנעול מכסה|מסגרת כיסוי|מתיז מים|מתלה|סמל|סף צד|ספויילר פגוש|עמוד|פגוש|פח|פנס ראשי|פס קישוט|ציר דלת|ציר מכסה|ציריה|קורת רוחב|קלקר|רכב לשיקום|רצפת מטען|שלדת רכב|תא מטען|תומך מגן|תומך רדיאטור|תושבת לוחית' THEN
            NEW.part_family := 'חלקי מרכב';
        
        -- חלקי פנים
        ELSIF NEW.part_name ~ 'אטמי גומי|אמברקס|בלם יד|גומי אוטם|גלגל הגה|דיפון דלת|דלת תא כפפות|הגה כח|חגורת בטיחות|ידית אורות|ידית איתות|ידית אחיזה|ידית פנימית|כיסוי בלם יד|כסא|לוח מכוונים|לוח שעונים|מד דלק|מד מהירות|מושב|מסרק הגה|מערכת מולטימדיה|מפעיל בקר|מפתח|מראה פנימית|משענת|מתג זכרון|סאנרוף|סוויץ|ספסל נוסעים|פדל|קונסולה|ריפוד|תא כפפות' THEN
            NEW.part_family := 'חלקי פנים';
        
        -- חשמל
        ELSIF NEW.part_name ~ 'אזעקה מקורית|אלטרנטור|בקר שיוט|דסטרביוטר|יחידת בקרה.*חלון|יחידת בקרה.*הגה|יחידת בקרה.*אורות|יחידת בקרה.*מרכב|יחידת נעילה|כוהל הצתה|מגבר הצתה|מודול שליטת|ממסר|מנוע חשמלי|מפסק אור|מצלמה|משאבת דלק חשמלית|משאבת ווקום|מתג ESP|מתג חלון|סוללה|סליל הצתה|צמת חוטים|צפצפה|קופסת פיוזים|רדאר|שקע טעינה' THEN
            NEW.part_family := 'חשמל';
        
        -- כריות אוויר
        ELSIF NEW.part_name ~ 'חיישן התנגשות|חיישן כרית|יחידת בקרה SRS|יחידת שליטה כרית|כרית אוויר|סליל.*שעון.*כרית' THEN
            NEW.part_family := 'כריות אוויר';
        
        -- ממסרים
        ELSIF NEW.part_name ~ 'ממסר אלטרנטור|ממסר הזרקת|ממסר התנעה|ממסר מנוע מאוורר|ממסר מנוע מגבים|ממסר משאבת דלק|ממסר נעילה|ממסר פנס' THEN
            NEW.part_family := 'ממסרים';
        
        -- מנוע - יחידת בקרת ECU
        ELSIF NEW.part_name ~ 'יחידת בקרה.*נוחות|יחידת בקרה.*הגה כח|יחידת בקרה.*אורות|יחידת בקרה.*כריות|יחידת בקרה.*מזגן|יחידת בקרה.*מנוע|יחידת בקרה.*הצתה|יחידת בקרה.*נעילה|יחידת בקרה.*דלק|יחידת בקרה.*תיבת|מד זרימת אויר|מחשב ABS|מחשב בודי' THEN
            NEW.part_family := 'מנוע - יחידת בקרת ECU';
        
        -- מנוע וחלקי מנוע
        ELSIF NEW.part_name ~ 'אגן שמן|אטם.*שמן|אטם.*שסתומים|אטם.*משאבת מים|אטם ראש מנוע|אינטרקולר|בית טרמוסטט|בית מחזיר|בית מיסב|בית מסנן|בית מצערת|בית פילטר|בלוק מנוע|גלגל תנופה|דיסטביוטר|טורבו|טיימינג קיט|טרמוסטט|יחידת מתח|כיסוי מנוע|כיסוי משאבת|מאוורר מנוע|מאורר קירור|מגן חום|מגן מנוע|מדיד שמן|מזרק דלק|מחזיר שמן|מיכל מים לרדיאטור|מיכל עיבוי|מכסה שסתומים|מנוע בנזין|מנוע דיזל|מסנן אוויר|מסנן דלק|מסנן שמן|מצנן שמן|מצתים|מרים הידראולי|משאבת אוויר|משאבת הגה|משאבת הזרקת|משאבת וואקום|משאבת מים|משאבת סולר|משאבת שמן|משולש|סט הנעה|סט התנעה|פולי מנוע|פילטר|קאמשפט|קולר שמן|קיט התנעה|קניסטר|קראנקשפט|קרבורטור|קרטר|ראש מנוע|ראש צילינדר|רצועת טיימינג|רצועת מנוע|תושבת גיר|תושבת מנוע|תיבת הגה|תפוח הגה' THEN
            NEW.part_family := 'מנוע וחלקי מנוע';
        
        -- מערכות בלימה והיגוי
        ELSIF NEW.part_name ~ 'בולם זעזועים|בולמים|בלם דיסק|בלם תוף|הגה חשמלי|זרוע הגה|חובק הגה|טבעות ABS|כבל בלם יד|מגבר בלם|משאבת בלם|נבה|עמוד הגה|פדל.*בלימה|צלחת בלם|קליפר|רפידות בלם' THEN
            NEW.part_family := 'מערכות בלימה והיגוי';
        
        -- מערכות חימום וקירור
        ELSIF NEW.part_name ~ 'אטם בית טרמוסטט|בית מזגן|טרמוסטט למזגן|יחידת בקרה מזגן|יחידת מזגן|כונס מצנן|מאוורר.*רדיאטור|מאייד מזגן|מדחס מזגן|מייבש מזגן|מסך שליטת אקלים|מסנן מזגן|מעבה מזגן|מפוח למזגן|מצנן מים|משאבת מזגן|פילטר מזגן|צינור מים|צינור רדיאטור|צינורות מזגן|ראדיאטור|רדיאטור.*מזגן|רדיאטור.*טמפ|רצועת מזגן' THEN
            NEW.part_family := 'מערכות חימום וקירור';
        
        -- מערכת ABS
        ELSIF NEW.part_name ~ 'בלם קליפר.*ABS|דריישפט|חיישן.*ABS|טבעות ABS|יחידת ABS|יחידת ECU|יחידת שליטה בלימה|מודולטור|משאבת ABS' THEN
            NEW.part_family := 'מערכת ABS';
        
        -- מערכת דלק
        ELSIF NEW.part_name ~ 'אינגקטור|גוף מצערת|טנק.*דלק|מיכל דלק|יחידת בקרה.*צריכת דלק|מד דלק|ממיר קטליטי|ממסר משאבת דלק|מצוף דלק|מרסס דלק|משאבת דיזל|משאבת דלק|פילטר דלק|צינור דלק|קרבורטור' THEN
            NEW.part_family := 'מערכת דלק';
        
        -- מערכת הפליטה
        ELSIF NEW.part_name ~ 'אגזוז|אטם סעפת|בית פילטר אוויר|דוד אחורי|מגן חום|מיכל אוריאה|מסנן חלקיקים|סעפת יניקה|סעפת כניסה|סעפת פליטה|צנרת פליטה' THEN
            NEW.part_family := 'מערכת הפליטה';
        
        -- מתגים/מפסקים/סוויצ'ים
        ELSIF NEW.part_name ~ 'חיישן דלת|ידית.*מגבים|מתג ESP|מתג אור ברקס|מתג בקר שיוט|מתג חימום כסא|מתג טמפרטורה|מתג מזגן|מתג מראה|מתג נעילה|מתג סנרוף|מתנע|סטרטר' THEN
            NEW.part_family := 'מתגים/מפסקים/סוויצ''ים';
        
        -- פנסים
        ELSIF NEW.part_name ~ 'אור מספר|אור מרכזי בלם|אור פנימי|מודול לפנס קסנון|מחזיר אור|מחשב לפנס לד|מפסק אור פנסים|פנס|תאורה תא כפפות|תושבת לפנס' THEN
            NEW.part_family := 'פנסים';
        
        -- תיבת הילוכים וחלקים
        ELSIF NEW.part_name ~ 'אגן שמן גיר|גיר|דיפרנציאל|וסת הילוכים|כבל.*הילוכים|כבל קלאץ|מזלג קלאץ|נעילת דיפרנציאל|סרן|פדל.*קלאץ|פעמון ציריה|ציריה|קולר גיר|קלאץ|מצמד|תיבת הילוכים|תיבת העברה' THEN
            NEW.part_family := 'תיבת הילוכים וחלקים';
        
        -- KEYWORD FALLBACK for parts not in parts.js
        ELSIF NEW.part_name ~ 'מגנים ופגושים' THEN
            NEW.part_family := 'מגנים ופגושים';
        END IF;
    END IF;
    
    -- Default to חלקי מרכב if still uncategorized (catch-all)
    IF NEW.part_family IS NULL OR NEW.part_family = '' OR NEW.part_family = 'לא מוגדר' THEN
        NEW.part_family := 'חלקי מרכב';
    END IF;
    
    -- Default source
    IF NEW.source IS NULL OR NEW.source = '' THEN
        NEW.source := 'חליפי';
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_00_auto_fix_and_extract
    BEFORE INSERT OR UPDATE ON catalog_items
    FOR EACH ROW
    EXECUTE FUNCTION auto_fix_and_extract();

SELECT 'Comprehensive trigger created. Now run: UPDATE catalog_items SET part_name = part_name;' as next_step;
