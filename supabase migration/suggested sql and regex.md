**Universal Regex for CatNumDesc Field Extraction**
# Handles Hebrew automotive parts descriptions

# Main Pattern (use with re.VERBOSE flag in Python for readability)
(?P<component_type>[\u0590-\u05FF]+(?:\s+[\u0590-\u05FF]+)*?)  # Hebrew component type
(?:\s+(?P<series_code>[A-Z0-9]{1,3}))?                       # Optional series code (R, L, etc.)
(?:\s+(?P<position>[\u0590-\u05FF]+'))?                      # Position (שמ', ימ', אח', קד')
(?:\s+(?P<location>ב[\u0590-\u05FF]+))?                      # Location (במגן, בראי, etc.)
(?:\s+(?P<model_name>[\u0590-\u05FF]+(?:\s+[\u0590-\u05FF]+)*))?  # Vehicle model name
(?:\s+(?P<tech_specs>[\u0590-\u05FF-]+(?:\s+[\u0590-\u05FF-]+)*))?  # Technical specs
(?:\s+(?P<connector>ו))?                                     # Hebrew connector "and"
(?:\s+(?P<year_range>\d{2,3}-\d{2,3}|\d{2,3}-|\d{2,3}))?    # Year ranges
(?:\s+(?P<model_codes>[A-Z0-9]+(?:\s+[A-Z0-9]+)*))?         # Model codes
(?:\s+(?P<part_numbers>\d+(?:\s+\d+)*))?                     # Part numbers
(?:\s+(?P<additional_info>.*))?                              # Any remaining info

# Simplified version for basic extraction
^(?P<component_type>[\u0590-\u05FF]+)\s*(?P<series_code>[A-Z0-9]*)\s*(?P<location>ב[\u0590-\u05FF]+)?\s*(?P<tech_specs>[\u0590-\u05FF-]+)?\s*(?P<connector>ו)?\s*(?P<part_numbers>\d+(?:\s+\d+)*)?

# Alternative approach - Step by step extraction patterns:

# 1. Component Type (always first Hebrew word(s))
(?P<component_type>^[\u0590-\u05FF]+(?:\s+[\u0590-\u05FF]+)*)

# 2. Series/Model Code (single alphanumeric after component)
(?P<series_code>\b[A-Z]\b|\b[A-Z0-9]{2,3}\b)

# 3. Position indicators
(?P<position>שמ'|ימ'|אח'|קד')

# 4. Location (starts with ב)
(?P<location>ב[\u0590-\u05FF]+)

# 5. Technical specifications (Hebrew with hyphens)
(?P<tech_specs>[\u0590-\u05FF]+-[\u0590-\u05FF]+)

# 6. Year ranges
(?P<year_range>\d{2,3}-\d{2,3}?|\d{2,3}-)

# 7. Model codes (alphanumeric groups)
(?P<model_codes>[A-Z0-9]+[A-Z]|[0-9]+[A-Z]+)

# 8. Part numbers (pure numeric)
(?P<part_numbers>\b\d+\b)

# 9. Connector "and"
(?P<connector>\bו\b)

# Usage Examples:

# Python implementation:
import re

# For your example: "גריל R במגן דק-זיפ ו 508 15"
pattern = r'(?P<component_type>[\u0590-\u05FF]+)\s+(?P<series_code>[A-Z]+)?\s*(?P<location>ב[\u0590-\u05FF]+)?\s*(?P<tech_specs>[\u0590-\u05FF]+-[\u0590-\u05FF]+)?\s*(?P<connector>ו)?\s*(?P<part_numbers>\d+(?:\s+\d+)*)?'

text = "גריל R במגן דק-זיפ ו 508 15"
match = re.search(pattern, text)
if match:
    print(match.groupdict())

# Expected output:
# {
#   'component_type': 'גריל',
#   'series_code': 'R', 
#   'location': 'במגן',
#   'tech_specs': 'דק-זיפ',
#   'connector': 'ו',
#   'part_numbers': '508 15'
# }

# JavaScript implementation:
const pattern = /(?<component_type>[\u0590-\u05FF]+)\s+(?<series_code>[A-Z]+)?\s*(?<location>ב[\u0590-\u05FF]+)?\s*(?<tech_specs>[\u0590-\u05FF]+-[\u0590-\u05FF]+)?\s*(?<connector>ו)?\s*(?<part_numbers>\d+(?:\s+\d+)*)?/;

const text = "גריל R במגן דק-זיפ ו 508 15";
const match = text.match(pattern);
console.log(match.groups);

# Notes:
# - \u0590-\u05FF covers Hebrew Unicode range
# - ? makes groups optional for flexibility
# - (?P<name>) creates named capture groups in Python
# - (?<name>) creates named capture groups in JavaScript/modern regex engines
# - Adjust quantifiers based on your specific data patterns




**Sql : 1 extraction fro catnumdesc:**

-- Supabase SQL Query to Extract CatNumDesc Components from catalog_items table
-- This query extracts Hebrew automotive parts descriptions into structured fields

SELECT 
    id,
    cat_num_desc,
    
    -- Extract Component Type (part_name equivalent - first Hebrew word(s))
    (regexp_match(cat_num_desc, '^([\u0590-\u05FF]+(?:\s+[\u0590-\u05FF]+)*?)'))[1] AS extracted_part_name,
    
    -- Extract Series/Model Code 
    (regexp_match(cat_num_desc, '[\u0590-\u05FF]+\s+([A-Z0-9]{1,3})(?:\s|$)'))[1] AS extracted_model_code,
    
    -- Extract Position (שמ'=Left, ימ'=Right, אח'=Rear, קד'=Front)
    (regexp_match(cat_num_desc, '(שמ''|ימ''|אח''|קד'')'))[1] AS extracted_side_position,
    
    -- Extract Front/Rear position
    CASE 
        WHEN cat_num_desc ~ 'אח''' THEN 'אח'''  -- Rear
        WHEN cat_num_desc ~ 'קד''' THEN 'קד'''  -- Front
        ELSE NULL
    END AS extracted_front_rear,
    
    -- Extract Location (starts with ב)
    (regexp_match(cat_num_desc, '(ב[\u0590-\u05FF]+)'))[1] AS extracted_location,
    
    -- Extract Technical Specifications (Hebrew with hyphens)
    (regexp_match(cat_num_desc, '([\u0590-\u05FF]+-[\u0590-\u05FF]+)'))[1] AS extracted_tech_specs,
    
    -- Extract Year Range patterns (XX-XX, XXX-, XX)
    (regexp_match(cat_num_desc, '(\d{2,3}-\d{2,3}|\d{2,3}-)'))[1] AS extracted_year_range,
    
    -- Extract individual years for year_from and year_to
    CASE 
        WHEN cat_num_desc ~ '\d{2,3}-\d{2,3}' THEN
            (regexp_match(cat_num_desc, '(\d{2,3})-\d{2,3}'))[1]::integer + 2000
        WHEN cat_num_desc ~ '\d{2,3}-' THEN
            (regexp_match(cat_num_desc, '(\d{2,3})-'))[1]::integer + 2000
        ELSE NULL
    END AS extracted_year_from,
    
    CASE 
        WHEN cat_num_desc ~ '\d{2,3}-\d{2,3}' THEN
            (regexp_match(cat_num_desc, '\d{2,3}-(\d{2,3})'))[1]::integer + 2000
        ELSE NULL
    END AS extracted_year_to,
    
    -- Extract Model Codes (alphanumeric patterns like 5T, 6T, 4X, etc.)
    (regexp_match(cat_num_desc, '\b([A-Z0-9]+[A-Z]|[0-9]+[A-Z]+)\b'))[1] AS extracted_model_variant,
    
    -- Extract Part Numbers (pure numeric sequences)
    array_to_string(
        regexp_split_to_array(
            (regexp_match(cat_num_desc, 'ו\s*(\d+(?:\s+\d+)*)'))[1], 
            '\s+'
        ), 
        ','
    ) AS extracted_part_numbers,
    
    -- Extract Vehicle Model Names (common car models)
    CASE 
        WHEN cat_num_desc ~ 'גולף' THEN 'גולף'
        WHEN cat_num_desc ~ 'פולו' THEN 'פולו'
        WHEN cat_num_desc ~ 'פאסט|פאסאט' THEN 'פאסאט'
        WHEN cat_num_desc ~ 'טיגואן' THEN 'טיגואן'
        WHEN cat_num_desc ~ 'טוראן' THEN 'טוראן'
        WHEN cat_num_desc ~ 'אוקטביה' THEN 'אוקטביה'
        WHEN cat_num_desc ~ 'סיוויק' THEN 'סיוויק'
        WHEN cat_num_desc ~ 'קאדי' THEN 'קאדי'
        WHEN cat_num_desc ~ 'ג''טה|ג''אז' THEN 'ג''טה'
        WHEN cat_num_desc ~ 'אסטרה' THEN 'אסטרה'
        WHEN cat_num_desc ~ 'קורסה' THEN 'קורסה'
        WHEN cat_num_desc ~ 'פיאסטה' THEN 'פיאסטה'
        WHEN cat_num_desc ~ 'ברלינגו' THEN 'ברלינגו'
        WHEN cat_num_desc ~ 'דובלו' THEN 'דובלו'
        WHEN cat_num_desc ~ 'אמרוק' THEN 'אמרוק'
        WHEN cat_num_desc ~ 'טוארג' THEN 'טוארג'
        WHEN cat_num_desc ~ 'בורה' THEN 'בורה'
        WHEN cat_num_desc ~ 'שירוקו' THEN 'שירוקו'
        WHEN cat_num_desc ~ 'קרפטר|קראפטר' THEN 'קרפטר'
        WHEN cat_num_desc ~ 'ספרינטר' THEN 'ספרינטר'
        WHEN cat_num_desc ~ 'טרנזיט' THEN 'טרנזיט'
        WHEN cat_num_desc ~ 'דימקס' THEN 'דימקס'
        WHEN cat_num_desc ~ 'מיטו' THEN 'מיטו'
        WHEN cat_num_desc ~ 'ג''ולייטה|ג''וליאטה' THEN 'ג''וליאטה'
        ELSE NULL
    END AS extracted_model,
    
    -- Extract Part Family (matching PARTS_BANK categories)
    CASE 
        -- פנסים
        WHEN cat_num_desc ~ 'פנס' THEN 'פנסים'
        WHEN cat_num_desc ~ 'מחזיר אור' THEN 'פנסים'
        WHEN cat_num_desc ~ 'רפלקטור' THEN 'פנסים'
        WHEN cat_num_desc ~ 'איתות' THEN 'פנסים'
        
        -- חלקי מרכב  
        WHEN cat_num_desc ~ 'גריל' THEN 'חלקי מרכב'
        WHEN cat_num_desc ~ 'מגן' THEN 'חלקי מרכב'
        WHEN cat_num_desc ~ 'פגוש' THEN 'חלקי מרכב'
        WHEN cat_num_desc ~ 'דלת' THEN 'חלקי מרכב'
        WHEN cat_num_desc ~ 'כנף' THEN 'חלקי מרכב'
        WHEN cat_num_desc ~ 'מכסה' THEN 'חלקי מרכב'
        WHEN cat_num_desc ~ 'טמבון' THEN 'חלקי מרכב'
        WHEN cat_num_desc ~ 'חזית' THEN 'חלקי מרכב'
        WHEN cat_num_desc ~ 'גשר' THEN 'חלקי מרכב'
        WHEN cat_num_desc ~ 'ספויילר' THEN 'חלקי מרכב'
        WHEN cat_num_desc ~ 'סף' THEN 'חלקי מרכב'
        WHEN cat_num_desc ~ 'עמוד' THEN 'חלקי מרכב'
        WHEN cat_num_desc ~ 'ידית' THEN 'חלקי מרכב'
        WHEN cat_num_desc ~ 'מנעול' THEN 'חלקי מרכב'
        WHEN cat_num_desc ~ 'ציר' THEN 'חלקי מרכב'
        WHEN cat_num_desc ~ 'בולם דלת' THEN 'חלקי מרכב'
        WHEN cat_num_desc ~ 'מרים' THEN 'חלקי מרכב'
        WHEN cat_num_desc ~ 'תומך' THEN 'חלקי מרכב'
        WHEN cat_num_desc ~ 'קורת רוחב' THEN 'חלקי מרכב'
        WHEN cat_num_desc ~ 'שלדת' THEN 'חלקי מרכב'
        WHEN cat_num_desc ~ 'תא מטען' THEN 'חלקי מרכב'
        WHEN cat_num_desc ~ 'רצפת' THEN 'חלקי מרכב'
        WHEN cat_num_desc ~ 'גג' THEN 'חלקי מרכב'
        WHEN cat_num_desc ~ 'דופן' THEN 'חלקי מרכב'
        
        -- חלונות ומראות
        WHEN cat_num_desc ~ 'מראה' THEN 'חלונות ומראות'
        WHEN cat_num_desc ~ 'חלון' THEN 'חלונות ומראות'
        WHEN cat_num_desc ~ 'שמשה' THEN 'חלונות ומראות'
        WHEN cat_num_desc ~ 'זכוכית' THEN 'חלונות ומראות'
        
        -- גלגלים וצמיגים
        WHEN cat_num_desc ~ 'גלגל' THEN 'גלגלים וצמיגים'
        WHEN cat_num_desc ~ 'צמיג' THEN 'גלגלים וצמיגים'
        WHEN cat_num_desc ~ 'מייסב גלגל' THEN 'גלגלים וצמיגים'
        WHEN cat_num_desc ~ 'תושבת גלגל' THEN 'גלגלים וצמיגים'
        WHEN cat_num_desc ~ 'ג''אנט' THEN 'גלגלים וצמיגים'
        WHEN cat_num_desc ~ 'טאסה' THEN 'גלגלים וצמיגים'
        
        -- מנוע וחלקי מנוע
        WHEN cat_num_desc ~ 'מנוע' THEN 'מנוע וחלקי מנוע'
        WHEN cat_num_desc ~ 'בלוק' THEN 'מנוע וחלקי מנוע'
        WHEN cat_num_desc ~ 'ראש מנוע' THEN 'מנוע וחלקי מנוע'
        WHEN cat_num_desc ~ 'משאבת' THEN 'מנוע וחלקי מנוע'
        WHEN cat_num_desc ~ 'מסנן' THEN 'מנוע וחלקי מנוע'
        WHEN cat_num_desc ~ 'פילטר' THEN 'מנוע וחלקי מנוע'
        WHEN cat_num_desc ~ 'אגן שמן' THEN 'מנוע וחלקי מנוע'
        WHEN cat_num_desc ~ 'אטם' THEN 'מנוע וחלקי מנוע'
        WHEN cat_num_desc ~ 'טרמוסטט' THEN 'מנוע וחלקי מנוע'
        WHEN cat_num_desc ~ 'טורבו' THEN 'מנוע וחלקי מנוע'
        WHEN cat_num_desc ~ 'אלטרנטור' THEN 'מנוע וחלקי מנוע'
        WHEN cat_num_desc ~ 'קראנק' THEN 'מנוע וחלקי מנוע'
        WHEN cat_num_desc ~ 'קאמשפט' THEN 'מנוע וחלקי מנוע'
        WHEN cat_num_desc ~ 'רצועת' THEN 'מנוע וחלקי מנוע'
        WHEN cat_num_desc ~ 'מצת' THEN 'מנוע וחלקי מנוע'
        WHEN cat_num_desc ~ 'מזרק' THEN 'מנוע וחלקי מנוע'
        
        -- חיישני מנוע
        WHEN cat_num_desc ~ 'חיישן' THEN 'חיישני מנוע'
        
        -- חשמל
        WHEN cat_num_desc ~ 'מצבר' THEN 'חשמל'
        WHEN cat_num_desc ~ 'ממסר' THEN 'חשמל'
        WHEN cat_num_desc ~ 'יחידת בקרה' THEN 'חשמל'
        WHEN cat_num_desc ~ 'מחשב' THEN 'חשמל'
        WHEN cat_num_desc ~ 'סוויץ' THEN 'חשמל'
        WHEN cat_num_desc ~ 'מתג' THEN 'חשמל'
        WHEN cat_num_desc ~ 'צמת חוטים' THEN 'חשמל'
        WHEN cat_num_desc ~ 'קופסת פיוזים' THEN 'חשמל'
        WHEN cat_num_desc ~ 'אזעקה' THEN 'חשמל'
        WHEN cat_num_desc ~ 'אימוביליזר' THEN 'חשמל'
        
        -- מערכות בלימה והיגוי
        WHEN cat_num_desc ~ 'בלם' THEN 'מערכות בלימה והיגוי'
        WHEN cat_num_desc ~ 'קליפר' THEN 'מערכות בלימה והיגוי'
        WHEN cat_num_desc ~ 'דיסק' THEN 'מערכות בלימה והיגוי'
        WHEN cat_num_desc ~ 'הגה' THEN 'מערכות בלימה והיגוי'
        WHEN cat_num_desc ~ 'זרוע' THEN 'מערכות בלימה והיגוי'
        WHEN cat_num_desc ~ 'בולם זעזועים' THEN 'מערכות בלימה והיגוי'
        WHEN cat_num_desc ~ 'מסרק' THEN 'מערכות בלימה והיגוי'
        WHEN cat_num_desc ~ 'רפידות' THEN 'מערכות בלימה והיגוי'
        
        -- תיבת הילוכים וחלקים
        WHEN cat_num_desc ~ 'גיר' THEN 'תיבת הילוכים וחלקים'
        WHEN cat_num_desc ~ 'תיבת' THEN 'תיבת הילוכים וחלקים'
        WHEN cat_num_desc ~ 'קלאץ' THEN 'תיבת הילוכים וחלקים'
        WHEN cat_num_desc ~ 'מצמד' THEN 'תיבת הילוכים וחלקים'
        WHEN cat_num_desc ~ 'דיפרנציאל' THEN 'תיבת הילוכים וחלקים'
        WHEN cat_num_desc ~ 'סרן' THEN 'תיבת הילוכים וחלקים'
        WHEN cat_num_desc ~ 'ציריה' THEN 'תיבת הילוכים וחלקים'
        
        -- מערכת דלק
        WHEN cat_num_desc ~ 'דלק' THEN 'מערכת דלק'
        WHEN cat_num_desc ~ 'טנק' THEN 'מערכת דלק'
        WHEN cat_num_desc ~ 'מיכל דלק' THEN 'מערכת דלק'
        WHEN cat_num_desc ~ 'מצוף' THEN 'מערכת דלק'
        WHEN cat_num_desc ~ 'קרבורטור' THEN 'מערכת דלק'
        WHEN cat_num_desc ~ 'מצערת' THEN 'מערכת דלק'
        
        -- מערכות חימום וקירור  
        WHEN cat_num_desc ~ 'רדיאטור' THEN 'מערכות חימום וקירור'
        WHEN cat_num_desc ~ 'מאוורר' THEN 'מערכות חימום וקירור'
        WHEN cat_num_desc ~ 'מזגן' THEN 'מערכות חימום וקירור'
        WHEN cat_num_desc ~ 'אינטרקולר' THEN 'מערכות חימום וקירור'
        WHEN cat_num_desc ~ 'מעבה' THEN 'מערכות חימום וקירור'
        WHEN cat_num_desc ~ 'מאייד' THEN 'מערכות חימום וקירור'
        WHEN cat_num_desc ~ 'מדחס' THEN 'מערכות חימום וקירור'
        
        -- מערכת ABS
        WHEN cat_num_desc ~ 'ABS' THEN 'מערכת ABS'
        WHEN cat_num_desc ~ 'טבעות ABS' THEN 'מערכת ABS'
        
        -- מערכת הפליטה
        WHEN cat_num_desc ~ 'אגזוז' THEN 'מערכת הפליטה'
        WHEN cat_num_desc ~ 'סעפת' THEN 'מערכת הפליטה'
        WHEN cat_num_desc ~ 'צנרת פליטה' THEN 'מערכת הפליטה'
        WHEN cat_num_desc ~ 'ממיר קטליטי' THEN 'מערכת הפליטה'
        
        -- כריות אוויר
        WHEN cat_num_desc ~ 'כרית אוויר' THEN 'כריות אוויר'
        WHEN cat_num_desc ~ 'SRS' THEN 'כריות אוויר'
        
        -- אביזרים נלווים  
        WHEN cat_num_desc ~ 'אנטנה' THEN 'אביזרים נלווים'
        WHEN cat_num_desc ~ 'וו גרירה' THEN 'אביזרים נלווים'
        WHEN cat_num_desc ~ 'מדרגה' THEN 'אביזרים נלווים'
        WHEN cat_num_desc ~ 'חצאית' THEN 'אביזרים נלווים'
        WHEN cat_num_desc ~ 'רדיו' THEN 'אביזרים נלווים'
        
        -- חלקי פנים
        WHEN cat_num_desc ~ 'כסא' THEN 'חלקי פנים'
        WHEN cat_num_desc ~ 'מושב' THEN 'חלקי פנים'
        WHEN cat_num_desc ~ 'דאשבורד' THEN 'חלקי פנים'
        WHEN cat_num_desc ~ 'טורפדו' THEN 'חלקי פנים'
        WHEN cat_num_desc ~ 'לוח מכוונים' THEN 'חלקי פנים'
        WHEN cat_num_desc ~ 'ריפוד' THEN 'חלקי פנים'
        WHEN cat_num_desc ~ 'דיפון' THEN 'חלקי פנים'
        WHEN cat_num_desc ~ 'קונסולה' THEN 'חלקי פנים'
        WHEN cat_num_desc ~ 'תא כפפות' THEN 'חלקי פנים'
        WHEN cat_num_desc ~ 'משענת' THEN 'חלקי פנים'
        WHEN cat_num_desc ~ 'חגורת בטיחות' THEN 'חלקי פנים'
        WHEN cat_num_desc ~ 'מגן שמש' THEN 'חלקי פנים'
        WHEN cat_num_desc ~ 'שטיח' THEN 'חלקי פנים'
        
        ELSE NULL
    END AS extracted_part_family,
    
    -- Current values for comparison
    part_name,
    model_code,
    side_position,
    front_rear,
    location,
    year_range,
    year_from,
    year_to,
    model,
    part_family,
    
    -- Check if extraction found new data
    CASE 
        WHEN part_name IS NULL AND (regexp_match(cat_num_desc, '^([\u0590-\u05FF]+(?:\s+[\u0590-\u05FF]+)*?)'))[1] IS NOT NULL 
        THEN 'NEW_PART_NAME'
        ELSE 'EXISTING'
    END AS part_name_status,
    
    CASE 
        WHEN model_code IS NULL AND (regexp_match(cat_num_desc, '[\u0590-\u05FF]+\s+([A-Z0-9]{1,3})(?:\s|$)'))[1] IS NOT NULL 
        THEN 'NEW_MODEL_CODE'
        ELSE 'EXISTING'
    END AS model_code_status

FROM public.catalog_items 
WHERE cat_num_desc IS NOT NULL 
  AND cat_num_desc != ''
ORDER BY id
LIMIT 100;  -- Remove LIMIT for full dataset


-- ============================================================================
-- UPDATE QUERY: Use this to actually update the table with extracted values
-- ============================================================================

/*
-- UNCOMMENT AND RUN THIS TO UPDATE THE TABLE:

UPDATE public.catalog_items 
SET 
    part_name = COALESCE(part_name, (regexp_match(cat_num_desc, '^([\u0590-\u05FF]+(?:\s+[\u0590-\u05FF]+)*?)'))[1]),
    
    model_code = COALESCE(model_code, (regexp_match(cat_num_desc, '[\u0590-\u05FF]+\s+([A-Z0-9]{1,3})(?:\s|$)'))[1]),
    
    side_position = COALESCE(side_position, (regexp_match(cat_num_desc, '(שמ''|ימ''|אח''|קד'')'))[1]),
    
    front_rear = COALESCE(front_rear, 
        CASE 
            WHEN cat_num_desc ~ 'אח''' THEN 'אח'''
            WHEN cat_num_desc ~ 'קד''' THEN 'קד'''
            ELSE front_rear
        END),
    
    location = COALESCE(location, (regexp_match(cat_num_desc, '(ב[\u0590-\u05FF]+)'))[1]),
    
    year_range = COALESCE(year_range, (regexp_match(cat_num_desc, '(\d{2,3}-\d{2,3}|\d{2,3}-)'))[1]),
    
    year_from = COALESCE(year_from, 
        CASE 
            WHEN cat_num_desc ~ '\d{2,3}-\d{2,3}' THEN
                (regexp_match(cat_num_desc, '(\d{2,3})-\d{2,3}'))[1]::integer + 2000
            WHEN cat_num_desc ~ '\d{2,3}-' THEN
                (regexp_match(cat_num_desc, '(\d{2,3})-'))[1]::integer + 2000
            ELSE year_from
        END),
    
    year_to = COALESCE(year_to,
        CASE 
            WHEN cat_num_desc ~ '\d{2,3}-\d{2,3}' THEN
                (regexp_match(cat_num_desc, '\d{2,3}-(\d{2,3})'))[1]::integer + 2000
            ELSE year_to
        END),
    
    model = COALESCE(model,
        CASE 
            WHEN cat_num_desc ~ 'גולף' THEN 'גולף'
            WHEN cat_num_desc ~ 'פולו' THEN 'פולו'
            WHEN cat_num_desc ~ 'פאסט|פאסאט' THEN 'פאסאת'
            WHEN cat_num_desc ~ 'טיגואן' THEN 'טיגואן'
            WHEN cat_num_desc ~ 'טוראן' THEN 'טוראן'
            WHEN cat_num_desc ~ 'אוקטביה' THEN 'אוקטביה'
            WHEN cat_num_desc ~ 'סיוויק' THEN 'סיוויק'
            WHEN cat_num_desc ~ 'קאדי' THEN 'קאדי'
            WHEN cat_num_desc ~ 'ג''טה|ג''אז' THEN 'ג''טה'
            WHEN cat_num_desc ~ 'אסטרה' THEN 'אסטרה'
            WHEN cat_num_desc ~ 'קורסה' THEN 'קורסה'
            WHEN cat_num_desc ~ 'פיאסטה' THEN 'פיאסטה'
            WHEN cat_num_desc ~ 'ברלינגו' THEN 'ברלינגו'
            WHEN cat_num_desc ~ 'דובלו' THEN 'דובלו'
            WHEN cat_num_desc ~ 'אמרוק' THEN 'אמרוק'
            WHEN cat_num_desc ~ 'טוארג' THEN 'טוארג'
            WHEN cat_num_desc ~ 'בורה' THEN 'בורה'
            WHEN cat_num_desc ~ 'שירוקו' THEN 'שירוקו'
            WHEN cat_num_desc ~ 'קרפטר|קראפטר' THEN 'קרפטר'
            WHEN cat_num_desc ~ 'ספרינטר' THEN 'ספרינטר'
            WHEN cat_num_desc ~ 'טרנזיט' THEN 'טרנזיט'
            WHEN cat_num_desc ~ 'דימקס' THEN 'דימקס'
            WHEN cat_num_desc ~ 'מיטו' THEN 'מיטו'
            WHEN cat_num_desc ~ 'ג''ולייטה|ג''וליאטה' THEN 'ג''וליאטה'
            ELSE model
        END),
    
    part_family = COALESCE(part_family,
        CASE 
            -- פנסים
            WHEN cat_num_desc ~ 'פנס' THEN 'פנסים'
            WHEN cat_num_desc ~ 'מחזיר אור' THEN 'פנסים'
            WHEN cat_num_desc ~ 'רפלקטור' THEN 'פנסים'
            WHEN cat_num_desc ~ 'איתות' THEN 'פנסים'
            
            -- חלקי מרכב  
            WHEN cat_num_desc ~ 'גריל' THEN 'חלקי מרכב'
            WHEN cat_num_desc ~ 'מגן' THEN 'חלקי מרכב'
            WHEN cat_num_desc ~ 'פגוש' THEN 'חלקי מרכב'
            WHEN cat_num_desc ~ 'דלת' THEN 'חלקי מרכב'
            WHEN cat_num_desc ~ 'כנף' THEN 'חלקי מרכב'
            WHEN cat_num_desc ~ 'מכסה' THEN 'חלקי מרכב'
            WHEN cat_num_desc ~ 'טמבון' THEN 'חלקי מרכב'
            WHEN cat_num_desc ~ 'ידית' THEN 'חלקי מרכב'
            WHEN cat_num_desc ~ 'מנעול' THEN 'חלקי מרכב'
            WHEN cat_num_desc ~ 'ציר' THEN 'חלקי מרכב'
            
            -- חלונות ומראות
            WHEN cat_num_desc ~ 'מראה' THEN 'חלונות ומראות'
            WHEN cat_num_desc ~ 'חלון' THEN 'חלונות ומראות'
            WHEN cat_num_desc ~ 'שמשה' THEN 'חלונות ומראות'
            WHEN cat_num_desc ~ 'זכוכית' THEN 'חלונות ומראות'
            
            -- גלגלים וצמיגים
            WHEN cat_num_desc ~ 'גלגל' THEN 'גלגלים וצמיגים'
            WHEN cat_num_desc ~ 'צמיג' THEN 'גלגלים וצמיגים'
            WHEN cat_num_desc ~ 'מייסב גלגל' THEN 'גלגלים וצמיגים'
            WHEN cat_num_desc ~ 'טאסה' THEN 'גלגלים וצמיגים'
            
            -- מנוע וחלקי מנוע
            WHEN cat_num_desc ~ 'מנוע' THEN 'מנוע וחלקי מנוע'
            WHEN cat_num_desc ~ 'משאבת' THEN 'מנוע וחלקי מנוע'
            WHEN cat_num_desc ~ 'מסנן' THEN 'מנוע וחלקי מנוע'
            WHEN cat_num_desc ~ 'פילטר' THEN 'מנוע וחלקי מנוע'
            WHEN cat_num_desc ~ 'אלטרנטור' THEN 'מנוע וחלקי מנוע'
            WHEN cat_num_desc ~ 'מצת' THEN 'מנוע וחלקי מנוע'
            
            -- חיישני מנוע
            WHEN cat_num_desc ~ 'חיישן' THEN 'חיישני מנוע'
            
            -- חשמל
            WHEN cat_num_desc ~ 'מצבר' THEN 'חשמל'
            WHEN cat_num_desc ~ 'ממסר' THEN 'חשמל'
            WHEN cat_num_desc ~ 'יחידת בקרה' THEN 'חשמל'
            WHEN cat_num_desc ~ 'מחשב' THEN 'חשמל'
            WHEN cat_num_desc ~ 'סוויץ' THEN 'חשמל'
            WHEN cat_num_desc ~ 'מתג' THEN 'חשמל'
            
            -- מערכות בלימה והיגוי
            WHEN cat_num_desc ~ 'בלם' THEN 'מערכות בלימה והיגוי'
            WHEN cat_num_desc ~ 'הגה' THEN 'מערכות בלימה והיגוי'
            WHEN cat_num_desc ~ 'קליפר' THEN 'מערכות בלימה והיגוי'
            
            -- תיבת הילוכים וחלקים
            WHEN cat_num_desc ~ 'גיר' THEN 'תיבת הילוכים וחלקים'
            WHEN cat_num_desc ~ 'תיבת' THEN 'תיבת הילוכים וחלקים'
            
            -- מערכות חימום וקירור  
            WHEN cat_num_desc ~ 'רדיאטור' THEN 'מערכות חימום וקירור'
            WHEN cat_num_desc ~ 'מזגן' THEN 'מערכות חימום וקירור'
            
            -- מערכת ABS
            WHEN cat_num_desc ~ 'ABS' THEN 'מערכת ABS'
            
            -- מערכת הפליטה
            WHEN cat_num_desc ~ 'אגזוז' THEN 'מערכת הפליטה'
            WHEN cat_num_desc ~ 'סעפת' THEN 'מערכת הפליטה'
            
            -- כריות אוויר
            WHEN cat_num_desc ~ 'כרית אוויר' THEN 'כריות אוויר'
            
            -- חלקי פנים
            WHEN cat_num_desc ~ 'כסא' THEN 'חלקי פנים'
            WHEN cat_num_desc ~ 'דאשבורד' THEN 'חלקי פנים'
            WHEN cat_num_desc ~ 'טורפדו' THEN 'חלקי פנים'
            
            ELSE part_family
        END)

WHERE cat_num_desc IS NOT NULL 
  AND cat_num_desc != '';
*/


-- ============================================================================
-- ANALYSIS QUERIES: Use these to check extraction quality
-- ============================================================================

-- Count successful extractions by field
SELECT 
    COUNT(*) as total_records,
    COUNT((regexp_match(cat_num_desc, '^([\u0590-\u05FF]+(?:\s+[\u0590-\u05FF]+)*?)'))[1]) as component_type_extracted,
    COUNT((regexp_match(cat_num_desc, '[\u0590-\u05FF]+\s+([A-Z0-9]{1,3})(?:\s|$)'))[1]) as series_code_extracted,
    COUNT((regexp_match(cat_num_desc, '(שמ''|ימ''|אח''|קד'')'))[1]) as position_extracted,
    COUNT((regexp_match(cat_num_desc, '(ב[\u0590-\u05FF]+)'))[1]) as location_extracted,
    COUNT((regexp_match(cat_num_desc, '(\d{2,3}-\d{2,3}|\d{2,3}-)'))[1]) as year_range_extracted
FROM public.catalog_items 
WHERE cat_num_desc IS NOT NULL AND cat_num_desc != '';

-- Sample of problematic records (no extractions)
SELECT cat_num_desc, id
FROM public.catalog_items 
WHERE cat_num_desc IS NOT NULL 
  AND cat_num_desc != ''
  AND (regexp_match(cat_num_desc, '^([\u0590-\u05FF]+(?:\s+[\u0590-\u05FF]+)*?)'))[1] IS NULL
LIMIT 20;

**Sql 2: Abbreviations to Full Hebrew Words**

-- Supabase SQL Query to Map Position Abbreviations to Full Hebrew Words
-- Maps partial words (שמ', ימ', אח', קד') to full descriptive terms

-- ============================================================================
-- SELECT QUERY: Preview the mapping before applying
-- ============================================================================

SELECT 
    id,
    cat_num_desc,
    side_position,
    front_rear,
    
    -- Map side_position abbreviations to full words
    CASE 
        WHEN side_position = 'שמ''' THEN 'שמאל'      -- Left
        WHEN side_position = 'ימ''' THEN 'ימין'      -- Right
        WHEN side_position = 'אח''' THEN 'אחורי'     -- Rear
        WHEN side_position = 'קד''' THEN 'קדמי'      -- Front
        ELSE side_position
    END AS side_position_full,
    
    -- Map front_rear abbreviations to full words
    CASE 
        WHEN front_rear = 'אח''' THEN 'אחורי'        -- Rear
        WHEN front_rear = 'קד''' THEN 'קדמי'         -- Front
        ELSE front_rear
    END AS front_rear_full,
    
    -- Create combined position description
    CASE 
        WHEN side_position IN ('שמ''', 'ימ''') AND front_rear IN ('אח''', 'קד''') THEN
            CONCAT(
                CASE 
                    WHEN front_rear = 'קד''' THEN 'קדמי '
                    WHEN front_rear = 'אח''' THEN 'אחורי '
                    ELSE ''
                END,
                CASE 
                    WHEN side_position = 'שמ''' THEN 'שמאל'
                    WHEN side_position = 'ימ''' THEN 'ימין'
                    ELSE ''
                END
            )
        WHEN side_position IN ('שמ''', 'ימ''') THEN
            CASE 
                WHEN side_position = 'שמ''' THEN 'שמאל'
                WHEN side_position = 'ימ''' THEN 'ימין'
                ELSE side_position
            END
        WHEN front_rear IN ('אח''', 'קד''') THEN
            CASE 
                WHEN front_rear = 'אח''' THEN 'אחורי'
                WHEN front_rear = 'קד''' THEN 'קדמי'
                ELSE front_rear
            END
        ELSE NULL
    END AS combined_position_full,
    
    -- Extract and map positions directly from cat_num_desc if fields are empty
    CASE 
        WHEN cat_num_desc ~ 'שמ''' THEN 'שמאל'
        WHEN cat_num_desc ~ 'ימ''' THEN 'ימין'
        WHEN cat_num_desc ~ 'אח''' THEN 'אחורי'
        WHEN cat_num_desc ~ 'קד''' THEN 'קדמי'
        ELSE NULL
    END AS position_from_desc,
    
    -- Create display-friendly position for UI
    COALESCE(
        -- Try combined position first
        CASE 
            WHEN side_position IN ('שמ''', 'ימ''') AND front_rear IN ('אח''', 'קד''') THEN
                CONCAT(
                    CASE 
                        WHEN front_rear = 'קד''' THEN 'קדמי '
                        WHEN front_rear = 'אח''' THEN 'אחורי '
                        ELSE ''
                    END,
                    CASE 
                        WHEN side_position = 'שמ''' THEN 'שמאל'
                        WHEN side_position = 'ימ''' THEN 'ימין'
                        ELSE ''
                    END
                )
            ELSE NULL
        END,
        -- Then try individual side position
        CASE 
            WHEN side_position = 'שמ''' THEN 'שמאל'
            WHEN side_position = 'ימ''' THEN 'ימין'
            ELSE NULL
        END,
        -- Then try front/rear position
        CASE 
            WHEN front_rear = 'אח''' THEN 'אחורי'
            WHEN front_rear = 'קד''' THEN 'קדמי'
            ELSE NULL
        END,
        -- Finally extract from description
        CASE 
            WHEN cat_num_desc ~ 'שמ''' THEN 'שמאל'
            WHEN cat_num_desc ~ 'ימ''' THEN 'ימין'
            WHEN cat_num_desc ~ 'אח''' THEN 'אחורי'
            WHEN cat_num_desc ~ 'קד''' THEN 'קדמי'
            ELSE NULL
        END
    ) AS display_position

FROM public.catalog_items 
WHERE cat_num_desc IS NOT NULL 
  AND cat_num_desc != ''
  AND (side_position IS NOT NULL OR front_rear IS NOT NULL OR cat_num_desc ~ '(שמ''|ימ''|אח''|קד'')')
ORDER BY id
LIMIT 100;


-- ============================================================================
-- UPDATE QUERY: Add new columns for full position words
-- ============================================================================

/*
-- First, add new columns to store the full position words (run this once)

ALTER TABLE public.catalog_items 
ADD COLUMN IF NOT EXISTS side_position_full text,
ADD COLUMN IF NOT EXISTS front_rear_full text,
ADD COLUMN IF NOT EXISTS display_position text;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_catalog_side_position_full 
ON public.catalog_items USING btree (side_position_full);

CREATE INDEX IF NOT EXISTS idx_catalog_front_rear_full 
ON public.catalog_items USING btree (front_rear_full);

CREATE INDEX IF NOT EXISTS idx_catalog_display_position 
ON public.catalog_items USING btree (display_position);
*/


-- ============================================================================
-- UPDATE QUERY: Populate the new columns with full words
-- ============================================================================

/*
-- UNCOMMENT AND RUN THIS TO UPDATE THE TABLE:

UPDATE public.catalog_items 
SET 
    -- Update side_position_full
    side_position_full = CASE 
        WHEN side_position = 'שמ''' THEN 'שמאל'
        WHEN side_position = 'ימ''' THEN 'ימין'
        WHEN side_position = 'אח''' THEN 'אחורי'
        WHEN side_position = 'קד''' THEN 'קדמי'
        ELSE side_position_full
    END,
    
    -- Update front_rear_full
    front_rear_full = CASE 
        WHEN front_rear = 'אח''' THEN 'אחורי'
        WHEN front_rear = 'קד''' THEN 'קדמי'
        ELSE front_rear_full
    END,
    
    -- Update display_position with priority logic
    display_position = COALESCE(
        -- Try combined position first
        CASE 
            WHEN side_position IN ('שמ''', 'ימ''') AND front_rear IN ('אח''', 'קד''') THEN
                CONCAT(
                    CASE 
                        WHEN front_rear = 'קד''' THEN 'קדמי '
                        WHEN front_rear = 'אח''' THEN 'אחורי '
                        ELSE ''
                    END,
                    CASE 
                        WHEN side_position = 'שמ''' THEN 'שמאל'
                        WHEN side_position = 'ימ''' THEN 'ימין'
                        ELSE ''
                    END
                )
            ELSE NULL
        END,
        -- Then try individual side position
        CASE 
            WHEN side_position = 'שמ''' THEN 'שמאל'
            WHEN side_position = 'ימ''' THEN 'ימין'
            ELSE NULL
        END,
        -- Then try front/rear position
        CASE 
            WHEN front_rear = 'אח''' THEN 'אחורי'
            WHEN front_rear = 'קד''' THEN 'קדמי'
            ELSE NULL
        END,
        -- Finally extract from description if fields are empty
        CASE 
            WHEN cat_num_desc ~ 'שמ''' THEN 'שמאל'
            WHEN cat_num_desc ~ 'ימ''' THEN 'ימין'
            WHEN cat_num_desc ~ 'אח''' THEN 'אחורי'
            WHEN cat_num_desc ~ 'קד''' THEN 'קדמי'
            ELSE display_position
        END
    )

WHERE cat_num_desc IS NOT NULL 
  AND cat_num_desc != '';
*/


-- ============================================================================
-- ALTERNATIVE: Update existing columns instead of adding new ones
-- ============================================================================

/*
-- If you prefer to update existing columns instead of adding new ones:

UPDATE public.catalog_items 
SET 
    side_position = CASE 
        WHEN side_position = 'שמ''' THEN 'שמאל'
        WHEN side_position = 'ימ''' THEN 'ימין'
        WHEN side_position = 'אח''' THEN 'אחורי'
        WHEN side_position = 'קד''' THEN 'קדמי'
        ELSE side_position
    END,
    
    front_rear = CASE 
        WHEN front_rear = 'אח''' THEN 'אחורי'
        WHEN front_rear = 'קד''' THEN 'קדמי'
        ELSE front_rear
    END

WHERE side_position IN ('שמ''', 'ימ''', 'אח''', 'קד''') 
   OR front_rear IN ('אח''', 'קד''');
*/


-- ============================================================================
-- ANALYSIS QUERIES: Check the mapping results
-- ============================================================================

-- Count position mappings
SELECT 
    'Original Abbreviations' as type,
    side_position,
    COUNT(*) as count
FROM public.catalog_items 
WHERE side_position IS NOT NULL
GROUP BY side_position
ORDER BY count DESC;

-- Count combined positions
SELECT 
    'Combined Positions' as type,
    COALESCE(
        CASE 
            WHEN side_position IN ('שמ''', 'ימ''') AND front_rear IN ('אח''', 'קד''') THEN
                CONCAT(
                    CASE 
                        WHEN front_rear = 'קד''' THEN 'קדמי '
                        WHEN front_rear = 'אח''' THEN 'אחורי '
                        ELSE ''
                    END,
                    CASE 
                        WHEN side_position = 'שמ''' THEN 'שמאל'
                        WHEN side_position = 'ימ''' THEN 'ימין'
                        ELSE ''
                    END
                )
            ELSE side_position
        END,
        'לא מוגדר'
    ) as display_position,
    COUNT(*) as count
FROM public.catalog_items 
WHERE side_position IS NOT NULL OR front_rear IS NOT NULL
GROUP BY display_position
ORDER BY count DESC;

-- Sample results to verify mapping
SELECT 
    cat_num_desc,
    side_position as original_side,
    front_rear as original_front_rear,
    CASE 
        WHEN side_position = 'שמ''' THEN 'שמאל'
        WHEN side_position = 'ימ''' THEN 'ימין'
        WHEN side_position = 'אח''' THEN 'אחורי'
        WHEN side_position = 'קד''' THEN 'קדמי'
        ELSE side_position
    END as mapped_side,
    CASE 
        WHEN front_rear = 'אח''' THEN 'אחורי'
        WHEN front_rear = 'קד''' THEN 'קדמי'
        ELSE front_rear
    END as mapped_front_rear
FROM public.catalog_items 
WHERE side_position IN ('שמ''', 'ימ''', 'אח''', 'קד''') 
   OR front_rear IN ('אח''', 'קד''')
LIMIT 20;


**sql : Reverse Hebrew**

-- Supabase SQL Function to Reverse Hebrew Text Back to Normal Reading Order
-- This fixes Hebrew text that appears reversed in SQL results

-- ============================================================================
-- CREATE FUNCTION: Reverse Hebrew Text
-- ============================================================================

CREATE OR REPLACE FUNCTION reverse_hebrew_text(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- Handle NULL or empty input
    IF input_text IS NULL OR input_text = '' THEN
        RETURN input_text;
    END IF;
    
    -- Reverse the string character by character
    RETURN reverse(input_text);
END;
$$;

-- ============================================================================
-- ALTERNATIVE: More sophisticated function that handles mixed text
-- ============================================================================

CREATE OR REPLACE FUNCTION fix_hebrew_text(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    result TEXT := '';
    char_code INTEGER;
    current_char TEXT;
    is_hebrew BOOLEAN;
    word_buffer TEXT := '';
    i INTEGER;
BEGIN
    -- Handle NULL or empty input
    IF input_text IS NULL OR input_text = '' THEN
        RETURN input_text;
    END IF;
    
    -- Process each character
    FOR i IN 1..length(input_text) LOOP
        current_char := substr(input_text, i, 1);
        char_code := ascii(current_char);
        
        -- Check if character is Hebrew (Unicode range 1488-1514 for Hebrew letters)
        -- Note: In PostgreSQL, we check if it's in Hebrew range
        is_hebrew := current_char ~ '^[\u0590-\u05FF]$';
        
        -- If it's a space or non-Hebrew character, flush Hebrew word buffer
        IF current_char = ' ' OR NOT is_hebrew THEN
            IF word_buffer != '' THEN
                -- Reverse the Hebrew word and add to result
                result := result || reverse(word_buffer);
                word_buffer := '';
            END IF;
            -- Add the current character (space or non-Hebrew)
            result := result || current_char;
        ELSE
            -- Accumulate Hebrew characters
            word_buffer := word_buffer || current_char;
        END IF;
    END LOOP;
    
    -- Flush any remaining Hebrew word buffer
    IF word_buffer != '' THEN
        result := result || reverse(word_buffer);
    END IF;
    
    RETURN result;
END;
$$;

-- ============================================================================
-- SIMPLE VERSION: Basic reverse function
-- ============================================================================

CREATE OR REPLACE FUNCTION reverse_text(input_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT reverse(COALESCE(input_text, ''));
$$;

-- ============================================================================
-- USAGE EXAMPLES: Apply to your extraction queries
-- ============================================================================

-- Example 1: Fix Hebrew text in extraction results
SELECT 
    id,
    cat_num_desc,
    
    -- Apply reverse function to extracted Hebrew components
    reverse_hebrew_text((regexp_match(cat_num_desc, '^([\u0590-\u05FF]+(?:\s+[\u0590-\u05FF]+)*?)'))[1]) AS component_type_fixed,
    
    reverse_hebrew_text((regexp_match(cat_num_desc, '(ב[\u0590-\u05FF]+)'))[1]) AS location_fixed,
    
    reverse_hebrew_text((regexp_match(cat_num_desc, '([\u0590-\u05FF]+-[\u0590-\u05FF]+)'))[1]) AS tech_specs_fixed,
    
    -- Original extractions for comparison
    (regexp_match(cat_num_desc, '^([\u0590-\u05FF]+(?:\s+[\u0590-\u05FF]+)*?)'))[1] AS component_type_original,
    (regexp_match(cat_num_desc, '(ב[\u0590-\u05FF]+)'))[1] AS location_original

FROM public.catalog_items 
WHERE cat_num_desc IS NOT NULL 
LIMIT 10;

-- Example 2: Fix position mappings
SELECT 
    id,
    side_position,
    
    -- Fix abbreviated positions
    reverse_hebrew_text(
        CASE 
            WHEN side_position = 'שמ''' THEN 'שמאל'
            WHEN side_position = 'ימ''' THEN 'ימין'
            WHEN side_position = 'אח''' THEN 'אחורי'
            WHEN side_position = 'קד''' THEN 'קדמי'
            ELSE side_position
        END
    ) AS side_position_fixed

FROM public.catalog_items 
WHERE side_position IS NOT NULL
LIMIT 10;

-- ============================================================================
-- UPDATE QUERIES: Fix existing data in place
-- ============================================================================

/*
-- Update part_name with fixed Hebrew text
UPDATE public.catalog_items 
SET part_name = reverse_hebrew_text(part_name)
WHERE part_name IS NOT NULL 
  AND part_name ~ '[\u0590-\u05FF]';

-- Update model names with fixed Hebrew text  
UPDATE public.catalog_items 
SET model = reverse_hebrew_text(model)
WHERE model IS NOT NULL 
  AND model ~ '[\u0590-\u05FF]';

-- Update location with fixed Hebrew text
UPDATE public.catalog_items 
SET location = reverse_hebrew_text(location)
WHERE location IS NOT NULL 
  AND location ~ '[\u0590-\u05FF]';

-- Update side positions with fixed Hebrew text
UPDATE public.catalog_items 
SET side_position = reverse_hebrew_text(
    CASE 
        WHEN side_position = 'שמ''' THEN 'שמאל'
        WHEN side_position = 'ימ''' THEN 'ימין'
        WHEN side_position = 'אח''' THEN 'אחורי'
        WHEN side_position = 'קד''' THEN 'קדמי'
        ELSE side_position
    END
)
WHERE side_position IS NOT NULL;
*/

-- ============================================================================
-- COMBINED EXTRACTION + REVERSE: Complete solution
-- ============================================================================

SELECT 
    id,
    cat_num_desc,
    
    -- Extract and fix Hebrew components in one step
    reverse_hebrew_text((regexp_match(cat_num_desc, '^([\u0590-\u05FF]+(?:\s+[\u0590-\u05FF]+)*?)'))[1]) AS part_name_fixed,
    
    (regexp_match(cat_num_desc, '[\u0590-\u05FF]+\s+([A-Z0-9]{1,3})(?:\s|$)'))[1] AS model_code,
    
    reverse_hebrew_text((regexp_match(cat_num_desc, '(שמ''|ימ''|אח''|קד'')'))[1]) AS position_abbrev,
    
    reverse_hebrew_text(
        CASE 
            WHEN (regexp_match(cat_num_desc, '(שמ''|ימ''|אח''|קד'')'))[1] = 'שמ''' THEN 'שמאל'
            WHEN (regexp_match(cat_num_desc, '(שמ''|ימ''|אח''|קד'')'))[1] = 'ימ''' THEN 'ימין'
            WHEN (regexp_match(cat_num_desc, '(שמ''|ימ''|אח''|קד'')'))[1] = 'אח''' THEN 'אחורי'
            WHEN (regexp_match(cat_num_desc, '(שמ''|ימ''|אח''|קד'')'))[1] = 'קד''' THEN 'קדמי'
            ELSE NULL
        END
    ) AS position_full_fixed,
    
    reverse_hebrew_text((regexp_match(cat_num_desc, '(ב[\u0590-\u05FF]+)'))[1]) AS location_fixed,
    
    reverse_hebrew_text((regexp_match(cat_num_desc, '([\u0590-\u05FF]+-[\u0590-\u05FF]+)'))[1]) AS tech_specs_fixed,
    
    -- Part family mapping with fixed text
    reverse_hebrew_text(
        CASE 
            WHEN cat_num_desc ~ 'פנס' THEN 'פנסים'
            WHEN cat_num_desc ~ 'גריל' THEN 'חלקי מרכב'
            WHEN cat_num_desc ~ 'מגן' THEN 'חלקי מרכב'
            WHEN cat_num_desc ~ 'מראה' THEN 'חלונות ומראות'
            WHEN cat_num_desc ~ 'חיישן' THEN 'חיישני מנוע'
            ELSE NULL
        END
    ) AS part_family_fixed

FROM public.catalog_items 
WHERE cat_num_desc IS NOT NULL 
  AND cat_num_desc != ''
ORDER BY id
LIMIT 20;

-- ============================================================================
-- TEST THE FUNCTIONS: Verify they work correctly
-- ============================================================================

-- Test with your example
SELECT 
    'גריל R במגן דק-זיפ ו 508 15' as original,
    reverse_hebrew_text('גריל') as reversed_grill,
    reverse_hebrew_text('במגן') as reversed_location,
    reverse_hebrew_text('דק-זיפ') as reversed_tech_spec;

-- Test position mappings
SELECT 
    'שמ''' as original_abbrev,
    reverse_hebrew_text('שמאל') as fixed_full_word,
    'ימ''' as original_abbrev2,
    reverse_hebrew_text('ימין') as fixed_full_word2;

**Sql :flexible search :**
-- Supabase Flexible Search System with Hierarchical Fallbacks
-- Handles empty fields, partial matches, and progressive search refinement

-- ============================================================================
-- HELPER FUNCTIONS FOR SEARCH LOGIC
-- ============================================================================

-- Function to clean and normalize search terms
CREATE OR REPLACE FUNCTION normalize_search_term(input_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT COALESCE(TRIM(UPPER(input_text)), '');
$$;

-- Function to extract core brand name from complex make strings
CREATE OR REPLACE FUNCTION extract_core_make(input_make TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    IF input_make IS NULL OR input_make = '' THEN
        RETURN '';
    END IF;
    
    -- Extract core brand names from complex strings
    RETURN CASE 
        WHEN input_make ~* 'טויוטה' THEN 'טויוטה'
        WHEN input_make ~* 'toyota' THEN 'טויוטה'
        WHEN input_make ~* 'הונדה' THEN 'הונדה'
        WHEN input_make ~* 'honda' THEN 'הונדה'
        WHEN input_make ~* 'מזדה' THEN 'מזדה'
        WHEN input_make ~* 'mazda' THEN 'מזדה'
        WHEN input_make ~* 'ניסן' THEN 'ניסן'
        WHEN input_make ~* 'nissan' THEN 'ניסן'
        WHEN input_make ~* 'פולקסווגן|וולקסווגן' THEN 'פולקסווגן'
        WHEN input_make ~* 'volkswagen|vw' THEN 'פולקסווגן'
        WHEN input_make ~* 'ב\.מ\.וו|במוו' THEN 'ב.מ.וו'
        WHEN input_make ~* 'bmw' THEN 'ב.מ.וו'
        WHEN input_make ~* 'מרצדס' THEN 'מרצדס'
        WHEN input_make ~* 'mercedes' THEN 'מרצדס'
        WHEN input_make ~* 'אודי' THEN 'אודי'
        WHEN input_make ~* 'audi' THEN 'אודי'
        WHEN input_make ~* 'פורד' THEN 'פורד'
        WHEN input_make ~* 'ford' THEN 'פורד'
        WHEN input_make ~* 'שברולט' THEN 'שברולט'
        WHEN input_make ~* 'chevrolet' THEN 'שברולט'
        WHEN input_make ~* 'היונדאי' THEN 'היונדאי'
        WHEN input_make ~* 'hyundai' THEN 'היונדאי'
        WHEN input_make ~* 'קיה' THEN 'קיה'
        WHEN input_make ~* 'kia' THEN 'קיה'
        WHEN input_make ~* 'סקודה' THEN 'סקודה'
        WHEN input_make ~* 'skoda' THEN 'סקודה'
        WHEN input_make ~* 'סיאט' THEN 'סיאט'
        WHEN input_make ~* 'seat' THEN 'סיאט'
        WHEN input_make ~* 'פיאט' THEN 'פיאט'
        WHEN input_make ~* 'fiat' THEN 'פיאט'
        WHEN input_make ~* 'רנו' THEN 'רנו'
        WHEN input_make ~* 'renault' THEN 'רנו'
        WHEN input_make ~* 'פז\'ו|פיג\'ו' THEN 'פז\'ו'
        WHEN input_make ~* 'peugeot' THEN 'פז\'ו'
        WHEN input_make ~* 'סיטרואן' THEN 'סיטרואן'
        WHEN input_make ~* 'citroen' THEN 'סיטרואן'
        WHEN input_make ~* 'אופל' THEN 'אופל'
        WHEN input_make ~* 'opel' THEN 'אופל'
        WHEN input_make ~* 'מיצובישי' THEN 'מיצובישי'
        WHEN input_make ~* 'mitsubishi' THEN 'מיצובישי'
        WHEN input_make ~* 'סובארו' THEN 'סובארו'
        WHEN input_make ~* 'subaru' THEN 'סובארו'
        WHEN input_make ~* 'לקסוס' THEN 'לקסוס'
        WHEN input_make ~* 'lexus' THEN 'לקסוס'
        WHEN input_make ~* 'אינפיניטי' THEN 'אינפיניטי'
        WHEN input_make ~* 'infiniti' THEN 'אינפיניטי'
        WHEN input_make ~* 'אקורה' THEN 'אקורה'
        WHEN input_make ~* 'acura' THEN 'אקורה'
        ELSE TRIM(SPLIT_PART(input_make, ' ', 1))  -- First word if no match
    END;
END;
$$;

-- Function to generate progressive word fallbacks for part names
CREATE OR REPLACE FUNCTION get_part_name_fallbacks(input_part TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
IMMUTABLE
AS $
DECLARE
    fallbacks TEXT[];
    words TEXT[];
    current_combination TEXT;
    i INTEGER;
BEGIN
    IF input_part IS NULL OR input_part = '' THEN
        RETURN ARRAY[]::TEXT[];
    END IF;
    
    -- Split into words and clean them
    words := string_to_array(TRIM(input_part), ' ');
    words := array_remove(words, '');  -- Remove empty strings
    
    -- If only one word, return variants
    IF array_length(words, 1) = 1 THEN
        RETURN get_part_name_variants(input_part);
    END IF;
    
    -- Generate progressive fallbacks by removing words from the end
    -- Example: "פנס איתות למראה ימין" → ["פנס איתות למראה ימין", "פנס איתות למראה", "פנס איתות", "פנס"]
    fallbacks := ARRAY[input_part]; -- Start with full term
    
    FOR i IN REVERSE array_length(words, 1)-1 DOWNTO 1 LOOP
        current_combination := array_to_string(words[1:i], ' ');
        fallbacks := array_append(fallbacks, current_combination);
    END LOOP;
    
    -- Add variants for the base word (first word)
    IF array_length(words, 1) > 0 THEN
        fallbacks := array_cat(fallbacks, get_part_name_variants(words[1]));
    END IF;
    
    RETURN fallbacks;
END;
$;

-- Function to generate part name variants (enhanced)
CREATE OR REPLACE FUNCTION get_part_name_variants(input_part TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
IMMUTABLE
AS $
DECLARE
    variants TEXT[];
BEGIN
    IF input_part IS NULL OR input_part = '' THEN
        RETURN ARRAY[]::TEXT[];
    END IF;
    
    -- Generate variants for common part names
    variants := CASE 
        WHEN input_part ~* 'כנף' THEN ARRAY['כנף', 'כנפיים', 'פנל צד', 'דלת']
        WHEN input_part ~* 'דלת' THEN ARRAY['דלת', 'דלתות', 'כנף', 'פנל']
        WHEN input_part ~* 'פנס' THEN ARRAY['פנס', 'פנסים', 'תאורה', 'אור', 'מחזיר אור', 'רפלקטור']
        WHEN input_part ~* 'איתות' THEN ARRAY['איתות', 'אתת', 'פלאשר', 'פנס איתות']
        WHEN input_part ~* 'מגן|פגוש' THEN ARRAY['מגן', 'פגוש', 'מגנים', 'פגושים']
        WHEN input_part ~* 'מראה|ראי' THEN ARRAY['מראה', 'מראות', 'ראי', 'ראיה', 'מיררור']
        WHEN input_part ~* 'חלון' THEN ARRAY['חלון', 'חלונות', 'שמשה', 'זכוכית']
        WHEN input_part ~* 'גלגל' THEN ARRAY['גלגל', 'גלגלים', 'חישוק', 'חישוקים']
        WHEN input_part ~* 'צמיג' THEN ARRAY['צמיג', 'צמיגים', 'גומי', 'טיירים']
        WHEN input_part ~* 'מנוע' THEN ARRAY['מנוע', 'מנועים', 'מוטור']
        WHEN input_part ~* 'בלם' THEN ARRAY['בלם', 'בלמים', 'בלימה', 'ברקס']
        WHEN input_part ~* 'הגה' THEN ARRAY['הגה', 'היגוי', 'סטרינג']
        WHEN input_part ~* 'מצבר' THEN ARRAY['מצבר', 'בטריה', 'אקו']
        WHEN input_part ~* 'רדיאטור' THEN ARRAY['רדיאטור', 'קירור', 'מים']
        WHEN input_part ~* 'אגזוז' THEN ARRAY['אגזוז', 'פליטה', 'ספורטר']
        WHEN input_part ~* 'חיישן' THEN ARRAY['חיישן', 'סנסור', 'חיישנים']
        WHEN input_part ~* 'מסנן|פילטר' THEN ARRAY['מסנן', 'פילטר', 'מסננים', 'פילטרים']
        ELSE ARRAY[input_part]
    END;
    
    RETURN variants;
END;
$;

-- ============================================================================
-- MAIN FLEXIBLE SEARCH FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION flexible_catalog_search(
    -- Vehicle search parameters
    search_plate TEXT DEFAULT NULL,
    search_make TEXT DEFAULT NULL,
    search_model TEXT DEFAULT NULL,
    search_model_code TEXT DEFAULT NULL,
    search_actual_trim TEXT DEFAULT NULL,
    search_year_from INTEGER DEFAULT NULL,
    search_engine_code TEXT DEFAULT NULL,
    search_engine_type TEXT DEFAULT NULL,
    search_vin TEXT DEFAULT NULL,
    
    -- Parts search parameters
    search_part_name TEXT DEFAULT NULL,
    search_part_family TEXT DEFAULT NULL,
    search_source TEXT DEFAULT NULL,
    
    -- Search options
    search_limit INTEGER DEFAULT 100,
    search_offset INTEGER DEFAULT 0,
    use_fuzzy_matching BOOLEAN DEFAULT TRUE
)
RETURNS TABLE(
    id UUID,
    pcode TEXT,
    cat_num_desc TEXT,
    price NUMERIC,
    make TEXT,
    model TEXT,
    model_code TEXT,
    actual_trim TEXT,
    year_from INTEGER,
    year_to INTEGER,
    part_name TEXT,
    part_family TEXT,
    source TEXT,
    match_score INTEGER,
    match_reasons TEXT[]
)
LANGUAGE plpgsql
AS $$
DECLARE
    base_query TEXT;
    where_conditions TEXT[] := ARRAY[]::TEXT[];
    core_make TEXT;
    part_variants TEXT[];
    condition TEXT;
BEGIN
    -- Start building the query
    base_query := 'SELECT id, pcode, cat_num_desc, price, make, model, model_code, 
                          actual_trim, year_from, year_to, part_name, part_family, source';
    
    -- ========================================================================
    -- VEHICLE SEARCH CONDITIONS (Hierarchical Fallback Logic)
    -- ========================================================================
    
    -- Plate search (always exact match when provided)
    IF search_plate IS NOT NULL AND TRIM(search_plate) != '' THEN
        where_conditions := array_append(where_conditions, 
            format('(pcode = %L)', TRIM(search_plate))
        );
    END IF;
    
    -- Make search with core extraction and fallback
    IF search_make IS NOT NULL AND TRIM(search_make) != '' THEN
        core_make := extract_core_make(search_make);
        where_conditions := array_append(where_conditions, 
            format('(make ILIKE %L OR make ILIKE %L)', 
                '%' || search_make || '%', 
                '%' || core_make || '%'
            )
        );
    END IF;
    
    -- Model search with fallback to make
    IF search_model IS NOT NULL AND TRIM(search_model) != '' THEN
        IF search_make IS NOT NULL AND TRIM(search_make) != '' THEN
            core_make := extract_core_make(search_make);
            where_conditions := array_append(where_conditions, 
                format('(model ILIKE %L OR (model IS NULL AND make ILIKE %L))', 
                    '%' || search_model || '%',
                    '%' || core_make || '%'
                )
            );
        ELSE
            where_conditions := array_append(where_conditions, 
                format('model ILIKE %L', '%' || search_model || '%')
            );
        END IF;
    END IF;
    
    -- Model code search with fallback to model and make
    IF search_model_code IS NOT NULL AND TRIM(search_model_code) != '' THEN
        condition := format('model_code ILIKE %L', '%' || search_model_code || '%');
        
        -- Add fallbacks
        IF search_model IS NOT NULL AND TRIM(search_model) != '' THEN
            condition := condition || format(' OR (model_code IS NULL AND model ILIKE %L)', 
                '%' || search_model || '%');
        END IF;
        
        IF search_make IS NOT NULL AND TRIM(search_make) != '' THEN
            core_make := extract_core_make(search_make);
            condition := condition || format(' OR (model_code IS NULL AND model IS NULL AND make ILIKE %L)', 
                '%' || core_make || '%');
        END IF;
        
        where_conditions := array_append(where_conditions, '(' || condition || ')');
    END IF;
    
    -- Actual trim search with cascading fallbacks
    IF search_actual_trim IS NOT NULL AND TRIM(search_actual_trim) != '' THEN
        condition := format('actual_trim ILIKE %L', '%' || search_actual_trim || '%');
        
        -- Fallback to model_code
        IF search_model_code IS NOT NULL AND TRIM(search_model_code) != '' THEN
            condition := condition || format(' OR (actual_trim IS NULL AND model_code ILIKE %L)', 
                '%' || search_model_code || '%');
        END IF;
        
        -- Fallback to model
        IF search_model IS NOT NULL AND TRIM(search_model) != '' THEN
            condition := condition || format(' OR (actual_trim IS NULL AND model_code IS NULL AND model ILIKE %L)', 
                '%' || search_model || '%');
        END IF;
        
        -- Fallback to make
        IF search_make IS NOT NULL AND TRIM(search_make) != '' THEN
            core_make := extract_core_make(search_make);
            condition := condition || format(' OR (actual_trim IS NULL AND model_code IS NULL AND model IS NULL AND make ILIKE %L)', 
                '%' || core_make || '%');
        END IF;
        
        where_conditions := array_append(where_conditions, '(' || condition || ')');
    END IF;
    
    -- Year search with fallback to make
    IF search_year_from IS NOT NULL THEN
        condition := format('year_from = %s', search_year_from);
        
        IF search_make IS NOT NULL AND TRIM(search_make) != '' THEN
            core_make := extract_core_make(search_make);
            condition := condition || format(' OR (year_from IS NULL AND make ILIKE %L)', 
                '%' || core_make || '%');
        END IF;
        
        where_conditions := array_append(where_conditions, '(' || condition || ')');
    END IF;
    
    -- Engine code search (ignore if not found)
    IF search_engine_code IS NOT NULL AND TRIM(search_engine_code) != '' THEN
        where_conditions := array_append(where_conditions, 
            format('(engine_code ILIKE %L OR engine_code IS NULL)', 
                '%' || search_engine_code || '%')
        );
    END IF;
    
    -- Engine type search (ignore if not found)
    IF search_engine_type IS NOT NULL AND TRIM(search_engine_type) != '' THEN
        where_conditions := array_append(where_conditions, 
            format('(engine_type ILIKE %L OR engine_type IS NULL)', 
                '%' || search_engine_type || '%')
        );
    END IF;
    
    -- VIN search (ignore if not found)
    IF search_vin IS NOT NULL AND TRIM(search_vin) != '' THEN
        where_conditions := array_append(where_conditions, 
            format('(vin ILIKE %L OR vin IS NULL)', 
                '%' || search_vin || '%')
        );
    END IF;
    
    -- ========================================================================
    -- PARTS SEARCH CONDITIONS
    -- ========================================================================
    
    -- Part name search with progressive word fallbacks
    IF search_part_name IS NOT NULL AND TRIM(search_part_name) != '' THEN
        part_variants := get_part_name_fallbacks(search_part_name);
        condition := '';
        
        -- Build OR conditions for all fallbacks and variants
        FOR i IN 1..array_length(part_variants, 1) LOOP
            IF condition != '' THEN
                condition := condition || ' OR ';
            END IF;
            condition := condition || 'part_name ILIKE ' || 
                quote_literal('%' || part_variants[i] || '%');
        END LOOP;
        
        -- Also search in cat_num_desc for broader matching
        condition := condition || ' OR cat_num_desc ILIKE ' || 
            quote_literal('%' || search_part_name || '%');
        
        -- Add progressive fallbacks for cat_num_desc too
        FOR i IN 1..array_length(part_variants, 1) LOOP
            condition := condition || ' OR cat_num_desc ILIKE ' || 
                quote_literal('%' || part_variants[i] || '%');
        END LOOP;
        
        where_conditions := array_append(where_conditions, '(' || condition || ')');
    END IF;
    
    -- Part family search with fallback to part name
    IF search_part_family IS NOT NULL AND TRIM(search_part_family) != '' THEN
        condition := format('part_family ILIKE %L', '%' || search_part_family || '%');
        
        -- If part_family doesn't exist, search in part_name
        condition := condition || format(' OR (part_family IS NULL AND part_name ILIKE %L)', 
            '%' || search_part_family || '%');
        
        where_conditions := array_append(where_conditions, '(' || condition || ')');
    END IF;
    
    -- Source search (show all if not found)
    IF search_source IS NOT NULL AND TRIM(search_source) != '' THEN
        where_conditions := array_append(where_conditions, 
            format('(source ILIKE %L OR source IS NULL)', 
                '%' || search_source || '%')
        );
    END IF;
    
    -- ========================================================================
    -- BUILD AND EXECUTE QUERY
    -- ========================================================================
    
    -- Add scoring and match reasons
    base_query := base_query || ', 
        CASE 
            WHEN ' || COALESCE(quote_literal(search_plate), 'NULL') || ' IS NOT NULL AND pcode = ' || COALESCE(quote_literal(TRIM(search_plate)), 'NULL') || ' THEN 100
            WHEN ' || COALESCE(quote_literal(search_make), 'NULL') || ' IS NOT NULL AND make ILIKE ' || COALESCE(quote_literal('%' || search_make || '%'), 'NULL') || ' THEN 90
            WHEN ' || COALESCE(quote_literal(search_model), 'NULL') || ' IS NOT NULL AND model ILIKE ' || COALESCE(quote_literal('%' || search_model || '%'), 'NULL') || ' THEN 80
            WHEN ' || COALESCE(quote_literal(search_part_name), 'NULL') || ' IS NOT NULL AND part_name ILIKE ' || COALESCE(quote_literal('%' || search_part_name || '%'), 'NULL') || ' THEN 85
            ELSE 50
        END as match_score,
        
        ARRAY[
            CASE WHEN ' || COALESCE(quote_literal(search_plate), 'NULL') || ' IS NOT NULL AND pcode = ' || COALESCE(quote_literal(TRIM(search_plate)), 'NULL') || ' THEN ''exact_plate_match'' ELSE NULL END,
            CASE WHEN ' || COALESCE(quote_literal(search_make), 'NULL') || ' IS NOT NULL AND make ILIKE ' || COALESCE(quote_literal('%' || search_make || '%'), 'NULL') || ' THEN ''make_match'' ELSE NULL END,
            CASE WHEN ' || COALESCE(quote_literal(search_model), 'NULL') || ' IS NOT NULL AND model ILIKE ' || COALESCE(quote_literal('%' || search_model || '%'), 'NULL') || ' THEN ''model_match'' ELSE NULL END,
            CASE WHEN ' || COALESCE(quote_literal(search_part_name), 'NULL') || ' IS NOT NULL AND part_name ILIKE ' || COALESCE(quote_literal('%' || search_part_name || '%'), 'NULL') || ' THEN ''part_match'' ELSE NULL END
        ]::TEXT[] as match_reasons
        
        FROM public.catalog_items';
    
    -- Add WHERE clause if conditions exist
    IF array_length(where_conditions, 1) > 0 THEN
        base_query := base_query || ' WHERE ' || array_to_string(where_conditions, ' AND ');
    END IF;
    
    -- Add ordering and pagination
    base_query := base_query || ' ORDER BY 
        CASE 
            WHEN ' || COALESCE(quote_literal(search_plate), 'NULL') || ' IS NOT NULL AND pcode = ' || COALESCE(quote_literal(TRIM(search_plate)), 'NULL') || ' THEN 1
            WHEN ' || COALESCE(quote_literal(search_make), 'NULL') || ' IS NOT NULL AND make ILIKE ' || COALESCE(quote_literal('%' || search_make || '%'), 'NULL') || ' THEN 2
            ELSE 3
        END,
        price ASC
        LIMIT ' || search_limit || ' OFFSET ' || search_offset;
    
    -- Execute the dynamic query
    RETURN QUERY EXECUTE base_query;
END;
$$;

-- ============================================================================
-- SIMPLIFIED SEARCH FUNCTIONS FOR SPECIFIC USE CASES
-- ============================================================================

-- Simple vehicle search
CREATE OR REPLACE FUNCTION search_by_vehicle(
    plate TEXT DEFAULT NULL,
    make TEXT DEFAULT NULL,
    model TEXT DEFAULT NULL,
    year_from INTEGER DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    pcode TEXT,
    cat_num_desc TEXT,
    price NUMERIC,
    make TEXT,
    model TEXT,
    part_name TEXT,
    part_family TEXT,
    match_score INTEGER
)
LANGUAGE sql
AS $$
    SELECT id, pcode, cat_num_desc, price, make, model, part_name, part_family, match_score
    FROM flexible_catalog_search(
        search_plate := plate,
        search_make := make,
        search_model := model,
        search_year_from := year_from
    );
$$;

-- Simple parts search
CREATE OR REPLACE FUNCTION search_by_parts(
    part_name TEXT DEFAULT NULL,
    part_family TEXT DEFAULT NULL,
    make TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    pcode TEXT,
    cat_num_desc TEXT,
    price NUMERIC,
    part_name TEXT,
    part_family TEXT,
    make TEXT,
    match_score INTEGER
)
LANGUAGE sql
AS $$
    SELECT id, pcode, cat_num_desc, price, part_name, part_family, make, match_score
    FROM flexible_catalog_search(
        search_part_name := part_name,
        search_part_family := part_family,
        search_make := make
    );
$$;

-- Advanced search combining vehicle and parts
CREATE OR REPLACE FUNCTION advanced_search(
    -- Vehicle params
    make TEXT DEFAULT NULL,
    model TEXT DEFAULT NULL,
    year_from INTEGER DEFAULT NULL,
    -- Parts params  
    part_name TEXT DEFAULT NULL,
    part_family TEXT DEFAULT NULL,
    -- Options
    max_results INTEGER DEFAULT 50
)
RETURNS TABLE(
    id UUID,
    pcode TEXT,
    cat_num_desc TEXT,
    price NUMERIC,
    make TEXT,
    model TEXT,
    part_name TEXT,
    part_family TEXT,
    match_score INTEGER,
    match_reasons TEXT[]
)
LANGUAGE sql
AS $$
    SELECT id, pcode, cat_num_desc, price, make, model, part_name, part_family, match_score, match_reasons
    FROM flexible_catalog_search(
        search_make := make,
        search_model := model,
        search_year_from := year_from,
        search_part_name := part_name,
        search_part_family := part_family,
        search_limit := max_results
    );
$$;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

/*
-- Example 1: Vehicle search with fallbacks
SELECT * FROM flexible_catalog_search(
    search_plate := '221-84-003',
    search_make := 'טויוטה יפן',
    search_model := 'COROLLA CROSS',
    search_model_code := 'ZVG12L-KHXGBW',
    search_actual_trim := 'ADVENTURE',
    search_year_from := 2022,
    search_engine_code := '2ZR',
    search_engine_type := 'בנזין',
    search_vin := 'JTNADACB20J001538'
);

-- Example 2: Parts search with variants
SELECT * FROM flexible_catalog_search(
    search_part_name := 'כנף',
    search_part_family := 'חלקי מרכב',
    search_make := 'טויוטה'
);

-- Example 3: Simple vehicle search
SELECT * FROM search_by_vehicle('221-84-003', 'טויוטה', 'קורולה', 2022);

-- Example 4: Simple parts search
SELECT * FROM search_by_parts('דלת', 'חלקי מרכב', 'טויוטה');

-- Example 5: Advanced combined search
SELECT * FROM advanced_search('טויוטה', 'קורולה', 2020, 'פנס', 'פנסים', 20);
*/

-- ============================================================================
-- PERFORMANCE INDEXES (run these for better performance)
-- ============================================================================

/*
-- Add indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_catalog_search_make_model 
ON public.catalog_items USING gin (to_tsvector('simple', COALESCE(make, '') || ' ' || COALESCE(model, '')));

CREATE INDEX IF NOT EXISTS idx_catalog_search_parts 
ON public.catalog_items USING gin (to_tsvector('simple', COALESCE(part_name, '') || ' ' || COALESCE(part_family, '')));

CREATE INDEX IF NOT EXISTS idx_catalog_search_combined 
ON public.catalog_items USING gin (to_tsvector('simple', 
    COALESCE(make, '') || ' ' || 
    COALESCE(model, '') || ' ' || 
    COALESCE(part_name, '') || ' ' || 
    COALESCE(part_family, '')
));
*/


**Sql ; automatic deploy on catalog upload or UI trigger :**

-- Supabase Auto-Deploy System for Catalog Processing
-- Automatically processes catalog items on upload or UI trigger

-- ============================================================================
-- STEP 1: Create Hebrew Text Reversal Functions (if not exists)
-- ============================================================================

CREATE OR REPLACE FUNCTION reverse_hebrew_text(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    IF input_text IS NULL OR input_text = '' THEN
        RETURN input_text;
    END IF;
    RETURN reverse(input_text);
END;
$$;

-- ============================================================================
-- STEP 2: Create Main Processing Function
-- ============================================================================

CREATE OR REPLACE FUNCTION process_catalog_item_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only process if cat_num_desc exists and relevant fields are empty
    IF NEW.cat_num_desc IS NOT NULL AND NEW.cat_num_desc != '' THEN
        
        -- Extract and fix component type (part_name)
        IF NEW.part_name IS NULL THEN
            NEW.part_name := reverse_hebrew_text(
                (regexp_match(NEW.cat_num_desc, '^([\u0590-\u05FF]+(?:\s+[\u0590-\u05FF]+)*?)'))[1]
            );
        END IF;
        
        -- Extract model code
        IF NEW.model_code IS NULL THEN
            NEW.model_code := (regexp_match(NEW.cat_num_desc, '[\u0590-\u05FF]+\s+([A-Z0-9]{1,3})(?:\s|$)'))[1];
        END IF;
        
        -- Extract and fix side position
        IF NEW.side_position IS NULL THEN
            NEW.side_position := reverse_hebrew_text(
                (regexp_match(NEW.cat_num_desc, '(שמ''|ימ''|אח''|קד'')'))[1]
            );
        END IF;
        
        -- Extract and fix front/rear position
        IF NEW.front_rear IS NULL THEN
            NEW.front_rear := reverse_hebrew_text(
                CASE 
                    WHEN NEW.cat_num_desc ~ 'אח''' THEN 'אח'''
                    WHEN NEW.cat_num_desc ~ 'קד''' THEN 'קד'''
                    ELSE NULL
                END
            );
        END IF;
        
        -- Extract and fix location
        IF NEW.location IS NULL THEN
            NEW.location := reverse_hebrew_text(
                (regexp_match(NEW.cat_num_desc, '(ב[\u0590-\u05FF]+)'))[1]
            );
        END IF;
        
        -- Extract year range
        IF NEW.year_range IS NULL THEN
            NEW.year_range := (regexp_match(NEW.cat_num_desc, '(\d{2,3}-\d{2,3}|\d{2,3}-)'))[1];
        END IF;
        
        -- Extract year_from
        IF NEW.year_from IS NULL THEN
            NEW.year_from := CASE 
                WHEN NEW.cat_num_desc ~ '\d{2,3}-\d{2,3}' THEN
                    (regexp_match(NEW.cat_num_desc, '(\d{2,3})-\d{2,3}'))[1]::integer + 2000
                WHEN NEW.cat_num_desc ~ '\d{2,3}-' THEN
                    (regexp_match(NEW.cat_num_desc, '(\d{2,3})-'))[1]::integer + 2000
                ELSE NULL
            END;
        END IF;
        
        -- Extract year_to
        IF NEW.year_to IS NULL THEN
            NEW.year_to := CASE 
                WHEN NEW.cat_num_desc ~ '\d{2,3}-\d{2,3}' THEN
                    (regexp_match(NEW.cat_num_desc, '\d{2,3}-(\d{2,3})'))[1]::integer + 2000
                ELSE NULL
            END;
        END IF;
        
        -- Extract and fix model name
        IF NEW.model IS NULL THEN
            NEW.model := reverse_hebrew_text(
                CASE 
                    WHEN NEW.cat_num_desc ~ 'גולף' THEN 'גולף'
                    WHEN NEW.cat_num_desc ~ 'פולו' THEN 'פולו'
                    WHEN NEW.cat_num_desc ~ 'פאסט|פאסאת' THEN 'פאסאת'
                    WHEN NEW.cat_num_desc ~ 'טיגואן' THEN 'טיגואן'
                    WHEN NEW.cat_num_desc ~ 'טוראן' THEN 'טוראן'
                    WHEN NEW.cat_num_desc ~ 'אוקטביה' THEN 'אוקטביה'
                    WHEN NEW.cat_num_desc ~ 'סיוויק' THEN 'סיוויק'
                    WHEN NEW.cat_num_desc ~ 'קאדי' THEN 'קאדי'
                    WHEN NEW.cat_num_desc ~ 'ג''טה|ג''אז' THEN 'ג''טה'
                    WHEN NEW.cat_num_desc ~ 'אסטרה' THEN 'אסטרה'
                    WHEN NEW.cat_num_desc ~ 'קורסה' THEN 'קורסה'
                    WHEN NEW.cat_num_desc ~ 'פיאסטה' THEN 'פיאסטה'
                    WHEN NEW.cat_num_desc ~ 'ברלינגו' THEN 'ברלינגו'
                    WHEN NEW.cat_num_desc ~ 'דובלו' THEN 'דובלו'
                    WHEN NEW.cat_num_desc ~ 'אמרוק' THEN 'אמרוק'
                    WHEN NEW.cat_num_desc ~ 'טוארג' THEN 'טוארג'
                    WHEN NEW.cat_num_desc ~ 'בורה' THEN 'בורה'
                    WHEN NEW.cat_num_desc ~ 'שירוקו' THEN 'שירוקו'
                    WHEN NEW.cat_num_desc ~ 'קרפטר|קראפטר' THEN 'קרפטר'
                    WHEN NEW.cat_num_desc ~ 'ספרינטר' THEN 'ספרינטר'
                    WHEN NEW.cat_num_desc ~ 'טרנזיט' THEN 'טרנזיט'
                    WHEN NEW.cat_num_desc ~ 'דימקס' THEN 'דימקס'
                    WHEN NEW.cat_num_desc ~ 'מיטו' THEN 'מיטו'
                    WHEN NEW.cat_num_desc ~ 'ג''ולייטה|ג''וליאטה' THEN 'ג''וליאטה'
                    ELSE NULL
                END
            );
        END IF;
        
        -- Extract and fix part family (PARTS_BANK categories)
        IF NEW.part_family IS NULL THEN
            NEW.part_family := CASE 
                -- פנסים
                WHEN NEW.cat_num_desc ~ 'פנס' THEN 'פנסים'
                WHEN NEW.cat_num_desc ~ 'מחזיר אור' THEN 'פנסים'
                WHEN NEW.cat_num_desc ~ 'רפלקטור' THEN 'פנסים'
                WHEN NEW.cat_num_desc ~ 'איתות' THEN 'פנסים'
                
                -- חלקי מרכב  
                WHEN NEW.cat_num_desc ~ 'גריל' THEN 'חלקי מרכב'
                WHEN NEW.cat_num_desc ~ 'מגן' THEN 'חלקי מרכב'
                WHEN NEW.cat_num_desc ~ 'פגוש' THEN 'חלקי מרכב'
                WHEN NEW.cat_num_desc ~ 'דלת' THEN 'חלקי מרכב'
                WHEN NEW.cat_num_desc ~ 'כנף' THEN 'חלקי מרכב'
                WHEN NEW.cat_num_desc ~ 'מכסה' THEN 'חלקי מרכב'
                WHEN NEW.cat_num_desc ~ 'טמבון' THEN 'חלקי מרכב'
                WHEN NEW.cat_num_desc ~ 'ידית' THEN 'חלקי מרכב'
                WHEN NEW.cat_num_desc ~ 'מנעול' THEN 'חלקי מרכב'
                WHEN NEW.cat_num_desc ~ 'ציר' THEN 'חלקי מרכב'
                
                -- חלונות ומראות
                WHEN NEW.cat_num_desc ~ 'מראה' THEN 'חלונות ומראות'
                WHEN NEW.cat_num_desc ~ 'חלון' THEN 'חלונות ומראות'
                WHEN NEW.cat_num_desc ~ 'שמשה' THEN 'חלונות ומראות'
                WHEN NEW.cat_num_desc ~ 'זכוכית' THEN 'חלונות ומראות'
                
                -- גלגלים וצמיגים
                WHEN NEW.cat_num_desc ~ 'גלגל' THEN 'גלגלים וצמיגים'
                WHEN NEW.cat_num_desc ~ 'צמיג' THEN 'גלגלים וצמיגים'
                WHEN NEW.cat_num_desc ~ 'מייסב גלגל' THEN 'גלגלים וצמיגים'
                WHEN NEW.cat_num_desc ~ 'טאסה' THEN 'גלגלים וצמיגים'
                
                -- מנוע וחלקי מנוע
                WHEN NEW.cat_num_desc ~ 'מנוע' THEN 'מנוע וחלקי מנוע'
                WHEN NEW.cat_num_desc ~ 'משאבת' THEN 'מנוע וחלקי מנוע'
                WHEN NEW.cat_num_desc ~ 'מסנן' THEN 'מנוע וחלקי מנוע'
                WHEN NEW.cat_num_desc ~ 'פילטר' THEN 'מנוע וחלקי מנוע'
                WHEN NEW.cat_num_desc ~ 'אלטרנטור' THEN 'מנוע וחלקי מנוע'
                WHEN NEW.cat_num_desc ~ 'מצת' THEN 'מנוע וחלקי מנוע'
                
                -- חיישני מנוע
                WHEN NEW.cat_num_desc ~ 'חיישן' THEN 'חיישני מנוע'
                
                -- חשמל
                WHEN NEW.cat_num_desc ~ 'מצבר' THEN 'חשמל'
                WHEN NEW.cat_num_desc ~ 'ממסר' THEN 'חשמל'
                WHEN NEW.cat_num_desc ~ 'יחידת בקרה' THEN 'חשמל'
                WHEN NEW.cat_num_desc ~ 'מחשב' THEN 'חשמל'
                WHEN NEW.cat_num_desc ~ 'סוויץ' THEN 'חשמל'
                WHEN NEW.cat_num_desc ~ 'מתג' THEN 'חשמל'
                
                -- מערכות בלימה והיגוי
                WHEN NEW.cat_num_desc ~ 'בלם' THEN 'מערכות בלימה והיגוי'
                WHEN NEW.cat_num_desc ~ 'הגה' THEN 'מערכות בלימה והיגוי'
                WHEN NEW.cat_num_desc ~ 'קליפר' THEN 'מערכות בלימה והיגוי'
                
                -- תיבת הילוכים וחלקים
                WHEN NEW.cat_num_desc ~ 'גיר' THEN 'תיבת הילוכים וחלקים'
                WHEN NEW.cat_num_desc ~ 'תיבת' THEN 'תיבת הילוכים וחלקים'
                
                -- מערכות חימום וקירור  
                WHEN NEW.cat_num_desc ~ 'רדיאטור' THEN 'מערכות חימום וקירור'
                WHEN NEW.cat_num_desc ~ 'מזגן' THEN 'מערכות חימום וקירור'
                
                -- מערכת ABS
                WHEN NEW.cat_num_desc ~ 'ABS' THEN 'מערכת ABS'
                
                -- מערכת הפליטה
                WHEN NEW.cat_num_desc ~ 'אגזוז' THEN 'מערכת הפליטה'
                WHEN NEW.cat_num_desc ~ 'סעפת' THEN 'מערכת הפליטה'
                
                -- כריות אוויר
                WHEN NEW.cat_num_desc ~ 'כרית אוויר' THEN 'כריות אוויר'
                
                -- חלקי פנים
                WHEN NEW.cat_num_desc ~ 'כסא' THEN 'חלקי פנים'
                WHEN NEW.cat_num_desc ~ 'דאשבורד' THEN 'חלקי פנים'
                WHEN NEW.cat_num_desc ~ 'טורפדו' THEN 'חלקי פנים'
                
                ELSE NULL
            END;
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 3: Create Position Mapping Function
-- ============================================================================

CREATE OR REPLACE FUNCTION map_position_abbreviations()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Map side position abbreviations to full words
    IF NEW.side_position IS NOT NULL THEN
        NEW.side_position := reverse_hebrew_text(
            CASE 
                WHEN NEW.side_position = 'שמ''' THEN 'שמאל'
                WHEN NEW.side_position = 'ימ''' THEN 'ימין'
                WHEN NEW.side_position = 'אח''' THEN 'אחורי'
                WHEN NEW.side_position = 'קד''' THEN 'קדמי'
                ELSE NEW.side_position
            END
        );
    END IF;
    
    -- Map front/rear abbreviations to full words
    IF NEW.front_rear IS NOT NULL THEN
        NEW.front_rear := reverse_hebrew_text(
            CASE 
                WHEN NEW.front_rear = 'אח''' THEN 'אחורי'
                WHEN NEW.front_rear = 'קד''' THEN 'קדמי'
                ELSE NEW.front_rear
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 4: Create Batch Processing Function (for UI trigger)
-- ============================================================================

CREATE OR REPLACE FUNCTION batch_process_catalog_items(
    catalog_id_param UUID DEFAULT NULL,
    supplier_id_param UUID DEFAULT NULL,
    process_all BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
    processed_count INTEGER,
    success_count INTEGER,
    error_count INTEGER,
    processing_summary JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    processed_items INTEGER := 0;
    success_items INTEGER := 0;
    error_items INTEGER := 0;
    current_item RECORD;
    error_detail TEXT;
BEGIN
    -- Process items based on parameters
    FOR current_item IN 
        SELECT * FROM public.catalog_items 
        WHERE 
            (process_all = TRUE OR catalog_id = catalog_id_param OR supplier_id = supplier_id_param)
            AND cat_num_desc IS NOT NULL 
            AND cat_num_desc != ''
    LOOP
        BEGIN
            processed_items := processed_items + 1;
            
            -- Apply the processing function logic
            UPDATE public.catalog_items 
            SET 
                part_name = COALESCE(part_name, reverse_hebrew_text(
                    (regexp_match(cat_num_desc, '^([\u0590-\u05FF]+(?:\s+[\u0590-\u05FF]+)*?)'))[1]
                )),
                model_code = COALESCE(model_code, 
                    (regexp_match(cat_num_desc, '[\u0590-\u05FF]+\s+([A-Z0-9]{1,3})(?:\s|$)'))[1]
                ),
                side_position = COALESCE(side_position, reverse_hebrew_text(
                    CASE 
                        WHEN (regexp_match(cat_num_desc, '(שמ''|ימ''|אח''|קד'')'))[1] = 'שמ''' THEN 'שמאל'
                        WHEN (regexp_match(cat_num_desc, '(שמ''|ימ''|אח''|קד'')'))[1] = 'ימ''' THEN 'ימין'
                        WHEN (regexp_match(cat_num_desc, '(שמ''|ימ''|אח''|קד'')'))[1] = 'אח''' THEN 'אחורי'
                        WHEN (regexp_match(cat_num_desc, '(שמ''|ימ''|אח''|קד'')'))[1] = 'קד''' THEN 'קדמי'
                        ELSE NULL
                    END
                )),
                location = COALESCE(location, reverse_hebrew_text(
                    (regexp_match(cat_num_desc, '(ב[\u0590-\u05FF]+)'))[1]
                )),
                year_range = COALESCE(year_range, 
                    (regexp_match(cat_num_desc, '(\d{2,3}-\d{2,3}|\d{2,3}-)'))[1]
                ),
                year_from = COALESCE(year_from, 
                    CASE 
                        WHEN cat_num_desc ~ '\d{2,3}-\d{2,3}' THEN
                            (regexp_match(cat_num_desc, '(\d{2,3})-\d{2,3}'))[1]::integer + 2000
                        WHEN cat_num_desc ~ '\d{2,3}-' THEN
                            (regexp_match(cat_num_desc, '(\d{2,3})-'))[1]::integer + 2000
                        ELSE NULL
                    END
                ),
                year_to = COALESCE(year_to,
                    CASE 
                        WHEN cat_num_desc ~ '\d{2,3}-\d{2,3}' THEN
                            (regexp_match(cat_num_desc, '\d{2,3}-(\d{2,3})'))[1]::integer + 2000
                        ELSE NULL
                    END
                ),
                part_family = COALESCE(part_family,
                    CASE 
                        WHEN cat_num_desc ~ 'פנס' THEN 'פנסים'
                        WHEN cat_num_desc ~ 'גריל' THEN 'חלקי מרכב'
                        WHEN cat_num_desc ~ 'מגן' THEN 'חלקי מרכב'
                        WHEN cat_num_desc ~ 'מראה' THEN 'חלונות ומראות'
                        WHEN cat_num_desc ~ 'חיישן' THEN 'חיישני מנוע'
                        WHEN cat_num_desc ~ 'מנוע' THEN 'מנוע וחלקי מנוע'
                        WHEN cat_num_desc ~ 'בלם' THEN 'מערכות בלימה והיגוי'
                        ELSE NULL
                    END
                )
            WHERE id = current_item.id;
            
            success_items := success_items + 1;
            
        EXCEPTION WHEN OTHERS THEN
            error_items := error_items + 1;
            error_detail := SQLERRM;
            -- Log error if needed
            RAISE NOTICE 'Error processing item %: %', current_item.id, error_detail;
        END;
    END LOOP;
    
    -- Return summary
    RETURN QUERY SELECT 
        processed_items,
        success_items,
        error_items,
        jsonb_build_object(
            'processed_count', processed_items,
            'success_count', success_items,
            'error_count', error_items,
            'success_rate', 
            CASE 
                WHEN processed_items > 0 THEN 
                    ROUND((success_items::DECIMAL / processed_items::DECIMAL) * 100, 2)
                ELSE 0 
            END
        );
END;
$$;

-- ============================================================================
-- STEP 5: Create Auto-Deploy Triggers
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS auto_process_catalog_complete ON public.catalog_items;
DROP TRIGGER IF EXISTS auto_map_positions ON public.catalog_items;

-- Create main processing trigger for INSERT/UPDATE
CREATE TRIGGER auto_process_catalog_complete
    BEFORE INSERT OR UPDATE OF cat_num_desc
    ON public.catalog_items
    FOR EACH ROW
    EXECUTE FUNCTION process_catalog_item_complete();

-- Create position mapping trigger (runs after main processing)
CREATE TRIGGER auto_map_positions
    BEFORE INSERT OR UPDATE OF side_position, front_rear
    ON public.catalog_items
    FOR EACH ROW
    EXECUTE FUNCTION map_position_abbreviations();

-- ============================================================================
-- STEP 6: Create UI Trigger Functions (RPC endpoints)
-- ============================================================================

-- Function to process specific catalog
CREATE OR REPLACE FUNCTION process_catalog_by_id(catalog_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result RECORD;
BEGIN
    SELECT * INTO result FROM batch_process_catalog_items(catalog_id_param, NULL, FALSE);
    RETURN result.processing_summary;
END;
$$;

-- Function to process by supplier
CREATE OR REPLACE FUNCTION process_catalog_by_supplier(supplier_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result RECORD;
BEGIN
    SELECT * INTO result FROM batch_process_catalog_items(NULL, supplier_id_param, FALSE);
    RETURN result.processing_summary;
END;
$$;

-- Function to process all items (admin only)
CREATE OR REPLACE FUNCTION process_all_catalog_items()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result RECORD;
BEGIN
    SELECT * INTO result FROM batch_process_catalog_items(NULL, NULL, TRUE);
    RETURN result.processing_summary;
END;
$$;

-- Function to reprocess items with empty fields
CREATE OR REPLACE FUNCTION reprocess_incomplete_items()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result RECORD;
    processed_count INTEGER := 0;
BEGIN
    -- Update items where key fields are missing
    UPDATE public.catalog_items 
    SET cat_num_desc = cat_num_desc  -- This will trigger the processing
    WHERE cat_num_desc IS NOT NULL 
      AND cat_num_desc != ''
      AND (part_name IS NULL OR part_family IS NULL OR model IS NULL);
    
    GET DIAGNOSTICS processed_count = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'reprocessed_count', processed_count,
        'status', 'completed'
    );
END;
$$;

-- ============================================================================
-- STEP 7: Create Status/Monitoring Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION get_processing_status()
RETURNS TABLE(
    total_items BIGINT,
    processed_items BIGINT,
    unprocessed_items BIGINT,
    processing_rate NUMERIC,
    by_part_family JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE part_name IS NOT NULL) as processed,
            COUNT(*) FILTER (WHERE part_name IS NULL AND cat_num_desc IS NOT NULL) as unprocessed
        FROM public.catalog_items
        WHERE cat_num_desc IS NOT NULL AND cat_num_desc != ''
    ),
    family_stats AS (
        SELECT jsonb_object_agg(
            COALESCE(part_family, 'לא מסווג'),
            COUNT(*)
        ) as family_breakdown
        FROM public.catalog_items
        WHERE cat_num_desc IS NOT NULL AND cat_num_desc != ''
        GROUP BY part_family
    )
    SELECT 
        s.total,
        s.processed,
        s.unprocessed,
        CASE 
            WHEN s.total > 0 THEN ROUND((s.processed::NUMERIC / s.total::NUMERIC) * 100, 2)
            ELSE 0 
        END,
        f.family_breakdown
    FROM stats s, family_stats f;
END;
$$;

-- ============================================================================
-- STEP 8: Usage Examples & Testing
-- ============================================================================

/*
-- Test the automatic processing on new insert
INSERT INTO public.catalog_items (cat_num_desc, pcode, price) 
VALUES ('גריל R במגן דק-זיפ ו 508 15', 'TEST001', 100.00);

-- Manually trigger processing for specific catalog
SELECT process_catalog_by_id('your-catalog-uuid-here');

-- Process all incomplete items
SELECT reprocess_incomplete_items();

-- Check processing status
SELECT * FROM get_processing_status();

-- Process by supplier
SELECT process_catalog_by_supplier('your-supplier-uuid-here');

-- Process everything (admin function)
SELECT process_all_catalog_items();
*/

-- ============================================================================
-- STEP 9: Grant Permissions (adjust roles as needed)
-- ============================================================================

/*
-- Grant execute permissions to your application role
GRANT EXECUTE ON FUNCTION process_catalog_by_id(UUID) TO your_app_role;
GRANT EXECUTE ON FUNCTION process_catalog_by_supplier(UUID) TO your_app_role;
GRANT EXECUTE ON FUNCTION reprocess_incomplete_items() TO your_app_role;
GRANT EXECUTE ON FUNCTION get_processing_status() TO your_app_role;

-- Admin-only function
GRANT EXECUTE ON FUNCTION process_all_catalog_items() TO your_admin_role;
*/

-- ============================================================================
-- DEPLOYMENT COMPLETE
-- ============================================================================

-- This system provides:
-- 1. Automatic processing on INSERT/UPDATE
-- 2. Manual UI trigger functions  
-- 3. Batch processing capabilities
-- 4. Hebrew text fixing
-- 5. Position mapping
-- 6. Status monitoring
-- 7. Error handling and logging

