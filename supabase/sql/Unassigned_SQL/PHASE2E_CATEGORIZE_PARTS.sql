-- PHASE 2: CATEGORIZE PARTS - Single batch approach
-- Run this last, after all other extractions

-- Apply smart part family categorization
UPDATE catalog_items 
SET part_family = CASE 
    -- פנסים ותאורה
    WHEN part_name ~ 'פנס|נורה|זרקור|מהבהב|איתות|עדשה|רפלקטור' THEN 'פנסים ותאורה'
    
    -- דלתות וכנפיים
    WHEN part_name ~ 'דלת|כנף|מכסה מנוע|תא מטען|חלון' THEN 'דלתות וכנפיים'
    
    -- מגנים ופגושים
    WHEN part_name ~ 'מגן|פגוש|ספוילר|גריל|מסגרת' THEN 'מגנים ופגושים'
    
    -- חלקי מרכב
    WHEN part_name ~ 'ידית|מנעול|ציר|בולם דלת|מרים|תומך|קורת רוחב|שלדת|תא מטען|רצפת|גג|דופן' THEN 'חלקי מרכב'
    
    -- חלונות ומראות
    WHEN part_name ~ 'מראה|חלון|שמשה|זכוכית' THEN 'חלונות ומראות'
    
    -- גלגלים וצמיגים
    WHEN part_name ~ 'גלגל|צמיג|מייסב גלגל|תושבת גלגל|ג''אנט|טאסה' THEN 'גלגלים וצמיגים'
    
    -- מנוע וחלקי מנוע
    WHEN part_name ~ 'מנוע|בלוק|ראש מנוע|משאבת|מסנן|פילטר|אגן שמן|אטם|טרמוסטט|טורבו|אלטרנטור|קראנק|קאמשפט|רצועת|מצת|מזרק' THEN 'מנוע וחלקי מנוע'
    
    -- חיישני מנוע
    WHEN part_name ~ 'חיישן' THEN 'חיישני מנוע'
    
    -- חשמל
    WHEN part_name ~ 'מצבר|ממסר|יחידת בקרה|מחשב|סוויץ|מתג|צמת חוטים|קופסת פיוזים|אזעקה|אימוביליזר' THEN 'חשמל'
    
    -- מערכות בלימה והיגוי
    WHEN part_name ~ 'בלם|קליפר|דיסק|הגה|זרוע|בולם זעזועים|מסרק|רפידות' THEN 'מערכות בלימה והיגוי'
    
    -- תיבת הילוכים וחלקים
    WHEN part_name ~ 'גיר|תיבת|קלאץ|מצמד|דיפרנציאל|סרן|ציריה' THEN 'תיבת הילוכים וחלקים'
    
    -- מערכת דלק
    WHEN part_name ~ 'דלק|טנק|מיכל דלק|מצוף|קרבורטור|מצערת' THEN 'מערכת דלק'
    
    -- מערכות חימום וקירור
    WHEN part_name ~ 'רדיאטור|מאוורר|מזגן|אינטרקולר|מעבה|מאייד|מדחס' THEN 'מערכות חימום וקירור'
    
    -- מערכת ABS
    WHEN part_name ~ 'ABS|טבעות ABS' THEN 'מערכת ABS'
    
    -- מערכת הפליטה
    WHEN part_name ~ 'אגזוז|סעפת|צנרת פליטה|ממיר קטליטי' THEN 'מערכת הפליטה'
    
    -- כריות אוויר
    WHEN part_name ~ 'כרית אוויר|SRS' THEN 'כריות אוויר'
    
    -- אביזרים נלווים
    WHEN part_name ~ 'אנטנה|וו גרירה|מדרגה|חצאית|רדיו' THEN 'אביזרים נלווים'
    
    -- חלקי פנים
    WHEN part_name ~ 'כסא|מושב|דאשבורד|טורפדו|לוח מכוונים|ריפוד|דיפון|קונסולה|תא כפפות|משענת|חגורת בטיחות|מגן שמש|שטיח' THEN 'חלקי פנים'
    
    ELSE COALESCE(part_family, 'לא מוגדר')
END
WHERE part_name IS NOT NULL
  AND id IN (
    SELECT id 
    FROM catalog_items 
    WHERE part_name IS NOT NULL
    LIMIT 3000  -- Process 3000 at a time
  );

-- Check progress
SELECT 
    'Part Categorization Progress:' as status,
    COUNT(*) as total_with_part_names,
    COUNT(CASE WHEN part_family != 'לא מוגדר' AND part_family IS NOT NULL THEN 1 END) as categorized,
    COUNT(*) - COUNT(CASE WHEN part_family != 'לא מוגדר' AND part_family IS NOT NULL THEN 1 END) as remaining_to_process,
    ROUND(COUNT(CASE WHEN part_family != 'לא מוגדר' AND part_family IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 1) as completion_percentage
FROM catalog_items
WHERE part_name IS NOT NULL;

SELECT 'If completion_percentage < 100, run this script again until 100%' as instruction;