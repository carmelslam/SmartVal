-- AUTOMATIC DEPLOYMENT SYSTEM - COMPLETE SOLUTION
-- Combines all our fixes with automatic deployment triggers
-- Based on suggested sql and regex.md automatic deployment patterns

SELECT '=== AUTOMATIC DEPLOYMENT SYSTEM - COMPLETE ===' as section;

-- ============================================================================
-- STEP 1: CREATE ALL ESSENTIAL FUNCTIONS
-- ============================================================================

-- Hebrew text fix function
CREATE OR REPLACE FUNCTION fix_hebrew_text(input_text TEXT)
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
-- STEP 2: CREATE AUTOMATIC PROCESSING TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION process_catalog_item_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only process if cat_num_desc exists
    IF NEW.cat_num_desc IS NOT NULL AND NEW.cat_num_desc != '' THEN
        
        -- Extract part_name (component type)
        IF NEW.part_name IS NULL THEN
            NEW.part_name := (regexp_match(NEW.cat_num_desc, '^([\u0590-\u05FF]+(?:\s+[\u0590-\u05FF]+)*?)'))[1];
        END IF;
        
        -- Extract model code
        IF NEW.model_code IS NULL THEN
            NEW.model_code := (regexp_match(NEW.cat_num_desc, '[\u0590-\u05FF]+\s+([A-Z0-9]{1,3})(?:\s|$)'))[1];
        END IF;
        
        -- Extract side position
        IF NEW.side_position IS NULL THEN
            NEW.side_position := (regexp_match(NEW.cat_num_desc, '(שמ''|ימ''|אח''|קד'')'))[1];
        END IF;
        
        -- Extract year range
        IF NEW.year_range IS NULL THEN
            NEW.year_range := (regexp_match(NEW.cat_num_desc, '(\d{2,4}-\d{2,4}|\d{4})'))[1];
        END IF;
        
        -- Extract extracted_year (new field)
        IF NEW.extracted_year IS NULL THEN
            NEW.extracted_year := COALESCE(
                (regexp_match(NEW.cat_num_desc, '(\d{4})'))[1],
                (regexp_match(NEW.model, '(\d{4})'))[1]
            );
        END IF;
        
        -- Create model_display (new field)
        NEW.model_display := CASE 
            WHEN NEW.model IS NOT NULL AND NEW.extracted_year IS NOT NULL THEN 
                NEW.model || ' (' || NEW.extracted_year || ')'
            WHEN NEW.model IS NOT NULL THEN 
                NEW.model
            WHEN NEW.extracted_year IS NOT NULL THEN 
                'שנת ' || NEW.extracted_year
            ELSE 
                'לא מוגדר'
        END;
        
        -- Auto-categorize part_family using comprehensive patterns
        IF NEW.part_family IS NULL OR NEW.part_family = 'מקורי' THEN
            NEW.part_family := CASE 
                -- פנסים ותאורה
                WHEN NEW.part_name ~ 'פנס|נורה|זרקור|מהבהב|איתות|עדשה|רפלקטור' THEN 'פנסים ותאורה'
                
                -- דלתות וכנפיים
                WHEN NEW.part_name ~ 'דלת|כנף|מכסה מנוע|תא מטען|חלון' THEN 'דלתות וכנפיים'
                
                -- מגנים ופגושים
                WHEN NEW.part_name ~ 'מגן|פגוש|ספוילר|גריל|מסגרת' THEN 'מגנים ופגושים'
                
                -- חלקי מרכב
                WHEN NEW.part_name ~ 'ידית|מנעול|ציר|בולם דלת|מרים|תומך|קורת רוחב|שלדת|תא מטען|רצפת|גג|דופן' THEN 'חלקי מרכב'
                
                -- חלונות ומראות
                WHEN NEW.part_name ~ 'מראה|חלון|שמשה|זכוכית' THEN 'חלונות ומראות'
                
                -- גלגלים וצמיגים
                WHEN NEW.part_name ~ 'גלגל|צמיג|מייסב גלגל|תושבת גלגל|ג''אנט|טאסה' THEN 'גלגלים וצמיגים'
                
                -- מנוע וחלקי מנוע
                WHEN NEW.part_name ~ 'מנוע|בלוק|ראש מנוע|משאבת|מסנן|פילטר|אגן שמן|אטם|טרמוסטט|טורבו|אלטרנטור|קראנק|קאמשפט|רצועת|מצת|מזרק' THEN 'מנוע וחלקי מנוע'
                
                -- חיישני מנוע
                WHEN NEW.part_name ~ 'חיישן' THEN 'חיישני מנוע'
                
                -- חשמל
                WHEN NEW.part_name ~ 'מצבר|ממסר|יחידת בקרה|מחשב|סוויץ|מתג|צמת חוטים|קופסת פיוזים|אזעקה|אימוביליזר' THEN 'חשמל'
                
                -- מערכות בלימה והיגוי
                WHEN NEW.part_name ~ 'בלם|קליפר|דיסק|הגה|זרוע|בולם זעזועים|מסרק|רפידות' THEN 'מערכות בלימה והיגוי'
                
                -- תיבת הילוכים וחלקים
                WHEN NEW.part_name ~ 'גיר|תיבת|קלאץ|מצמד|דיפרנציאל|סרן|ציריה' THEN 'תיבת הילוכים וחלקים'
                
                -- מערכת דלק
                WHEN NEW.part_name ~ 'דלק|טנק|מיכל דלק|מצוף|קרבורטור|מצערת' THEN 'מערכת דלק'
                
                -- מערכות חימום וקירור
                WHEN NEW.part_name ~ 'רדיאטור|מאוורר|מזגן|אינטרקולר|מעבה|מאייד|מדחס' THEN 'מערכות חימום וקירור'
                
                -- מערכת ABS
                WHEN NEW.part_name ~ 'ABS|טבעות ABS' THEN 'מערכת ABS'
                
                -- מערכת הפליטה
                WHEN NEW.part_name ~ 'אגזוז|סעפת|צנרת פליטה|ממיר קטליטי' THEN 'מערכת הפליטה'
                
                -- כריות אוויר
                WHEN NEW.part_name ~ 'כרית אוויר|SRS' THEN 'כריות אוויר'
                
                -- אביזרים נלווים
                WHEN NEW.part_name ~ 'אנטנה|וו גרירה|מדרגה|חצאית|רדיו' THEN 'אביזרים נלווים'
                
                -- חלקי פנים
                WHEN NEW.part_name ~ 'כסא|מושב|דאשבורד|טורפדו|לוח מכוונים|ריפוד|דיפון|קונסולה|תא כפפות|משענת|חגורת בטיחות|מגן שמש|שטיח' THEN 'חלקי פנים'
                
                ELSE COALESCE(NEW.part_family, 'לא מוגדר')
            END;
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 3: CREATE ENHANCED SMART_PARTS_SEARCH FUNCTION
-- ============================================================================

-- Drop all existing versions
DROP FUNCTION IF EXISTS smart_parts_search() CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) CASCADE;

-- Create enhanced search with multi-word support
CREATE OR REPLACE FUNCTION smart_parts_search(
    make_param TEXT DEFAULT NULL,
    model_param TEXT DEFAULT NULL,
    free_query_param TEXT DEFAULT NULL,
    part_param TEXT DEFAULT NULL,
    oem_param TEXT DEFAULT NULL,
    family_param TEXT DEFAULT NULL,
    limit_results INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    cat_num_desc TEXT,
    supplier_name TEXT,
    pcode TEXT,
    price NUMERIC,
    oem TEXT,
    make TEXT,
    model TEXT,
    part_family TEXT,
    side_position TEXT,
    version_date TEXT,
    availability TEXT,
    extracted_year TEXT,
    model_display TEXT,
    match_score INTEGER
) AS $$
DECLARE
    make_terms TEXT[];
    free_terms TEXT[];
    make_conditions TEXT[];
    free_conditions TEXT[];
    final_query TEXT;
    where_clause TEXT := '';
BEGIN
    -- Enhanced Make Parameter Processing (handles "טויוטה יפן")
    IF make_param IS NOT NULL AND make_param != '' THEN
        make_terms := string_to_array(trim(make_param), ' ');
        make_conditions := ARRAY[]::TEXT[];
        
        FOR i IN 1..array_length(make_terms, 1) LOOP
            IF trim(make_terms[i]) != '' THEN
                make_conditions := array_append(make_conditions,
                    format('(ci.make ILIKE %L OR ci.supplier_name ILIKE %L)', 
                           '%' || trim(make_terms[i]) || '%',
                           '%' || trim(make_terms[i]) || '%'));
            END IF;
        END LOOP;
        
        IF array_length(make_conditions, 1) > 0 THEN
            where_clause := where_clause || 
                CASE WHEN where_clause != '' THEN ' AND ' ELSE '' END ||
                '(' || array_to_string(make_conditions, ' OR ') || ')';
        END IF;
    END IF;
    
    -- Enhanced Free Query Processing (handles "פנס איתות למראה ימין")
    IF free_query_param IS NOT NULL AND free_query_param != '' THEN
        free_terms := string_to_array(trim(free_query_param), ' ');
        free_conditions := ARRAY[]::TEXT[];
        
        FOR i IN 1..array_length(free_terms, 1) LOOP
            IF trim(free_terms[i]) != '' THEN
                free_conditions := array_append(free_conditions,
                    format('(ci.cat_num_desc ILIKE %L OR ci.part_name ILIKE %L OR ci.part_family ILIKE %L OR ci.make ILIKE %L OR ci.model ILIKE %L OR ci.supplier_name ILIKE %L OR ci.oem ILIKE %L)', 
                           '%' || trim(free_terms[i]) || '%',
                           '%' || trim(free_terms[i]) || '%',
                           '%' || trim(free_terms[i]) || '%',
                           '%' || trim(free_terms[i]) || '%',
                           '%' || trim(free_terms[i]) || '%',
                           '%' || trim(free_terms[i]) || '%',
                           '%' || trim(free_terms[i]) || '%'));
            END IF;
        END LOOP;
        
        IF array_length(free_conditions, 1) > 0 THEN
            where_clause := where_clause || 
                CASE WHEN where_clause != '' THEN ' AND ' ELSE '' END ||
                '(' || array_to_string(free_conditions, ' OR ') || ')';
        END IF;
    END IF;
    
    -- Other filters
    IF model_param IS NOT NULL AND model_param != '' THEN
        where_clause := where_clause || 
            CASE WHEN where_clause != '' THEN ' AND ' ELSE '' END ||
            format('(ci.model ILIKE %L OR ci.model_display ILIKE %L)', 
                   '%' || model_param || '%', '%' || model_param || '%');
    END IF;
    
    IF part_param IS NOT NULL AND part_param != '' THEN
        where_clause := where_clause || 
            CASE WHEN where_clause != '' THEN ' AND ' ELSE '' END ||
            format('(ci.cat_num_desc ILIKE %L OR ci.part_name ILIKE %L)', 
                   '%' || part_param || '%', '%' || part_param || '%');
    END IF;
    
    IF oem_param IS NOT NULL AND oem_param != '' THEN
        where_clause := where_clause || 
            CASE WHEN where_clause != '' THEN ' AND ' ELSE '' END ||
            format('ci.oem ILIKE %L', '%' || oem_param || '%');
    END IF;
    
    IF family_param IS NOT NULL AND family_param != '' THEN
        where_clause := where_clause || 
            CASE WHEN where_clause != '' THEN ' AND ' ELSE '' END ||
            format('ci.part_family ILIKE %L', '%' || family_param || '%');
    END IF;
    
    -- Build final query with Hebrew fix and scoring
    final_query := 'SELECT 
        ci.id,
        fix_hebrew_text(ci.cat_num_desc) as cat_num_desc,
        ci.supplier_name,
        ci.pcode,
        ci.price::NUMERIC,
        ci.oem,
        ci.make,
        ci.model,
        COALESCE(ci.part_family, ''לא מוגדר'') as part_family,
        ci.side_position,
        ci.version_date::TEXT,
        COALESCE(ci.availability, ''מקורי'') as availability,
        ci.extracted_year,
        COALESCE(ci.model_display, ci.model, ''לא מוגדר'') as model_display,
        (CASE WHEN ci.part_name IS NOT NULL THEN 10 ELSE 0 END +
         CASE WHEN ci.price IS NOT NULL AND ci.price > 0 THEN 5 ELSE 0 END +
         CASE WHEN ci.extracted_year IS NOT NULL THEN 3 ELSE 0 END +
         CASE WHEN ci.model IS NOT NULL THEN 2 ELSE 0 END) as match_score
    FROM catalog_items ci';
    
    IF where_clause != '' THEN
        final_query := final_query || ' WHERE ' || where_clause;
    END IF;
    
    final_query := final_query || ' ORDER BY 
        match_score DESC,
        CASE WHEN ci.price IS NOT NULL AND ci.price > 0 THEN 0 ELSE 1 END,
        ci.price ASC,
        ci.make,
        ci.cat_num_desc
    LIMIT ' || limit_results;
    
    RETURN QUERY EXECUTE final_query;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: ENSURE REQUIRED COLUMNS EXIST
-- ============================================================================

-- Add extracted_year column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_items' AND column_name = 'extracted_year'
    ) THEN
        ALTER TABLE catalog_items ADD COLUMN extracted_year TEXT;
        RAISE NOTICE 'Added extracted_year column';
    END IF;
END $$;

-- Add model_display column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_items' AND column_name = 'model_display'
    ) THEN
        ALTER TABLE catalog_items ADD COLUMN model_display TEXT;
        RAISE NOTICE 'Added model_display column';
    END IF;
END $$;

-- ============================================================================
-- STEP 5: CREATE AUTOMATIC DEPLOYMENT TRIGGER
-- ============================================================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS auto_process_catalog_item ON catalog_items;

-- Create new trigger for automatic processing
CREATE TRIGGER auto_process_catalog_item
BEFORE INSERT OR UPDATE ON catalog_items
FOR EACH ROW
EXECUTE FUNCTION process_catalog_item_complete();

-- ============================================================================
-- STEP 6: MANUAL PROCESSING FOR EXISTING DATA
-- ============================================================================

-- Process existing records that haven't been processed
UPDATE catalog_items 
SET cat_num_desc = cat_num_desc  -- This triggers the trigger function
WHERE (part_name IS NULL OR extracted_year IS NULL OR model_display IS NULL)
  AND cat_num_desc IS NOT NULL;

-- ============================================================================
-- STEP 7: VALIDATION AND STATUS
-- ============================================================================

SELECT '=== AUTOMATIC DEPLOYMENT STATUS ===' as section;

-- Check function deployment
SELECT 
    'Function Deployment Status:' as check_type,
    COUNT(*) as function_count,
    string_agg(proname, ', ') as deployed_functions
FROM pg_proc 
WHERE proname IN ('fix_hebrew_text', 'smart_parts_search', 'process_catalog_item_complete');

-- Check trigger deployment
SELECT 
    'Trigger Deployment Status:' as check_type,
    COUNT(*) as trigger_count
FROM information_schema.triggers 
WHERE trigger_name = 'auto_process_catalog_item' AND event_object_table = 'catalog_items';

-- Check data processing
SELECT 
    'Data Processing Status:' as check_type,
    COUNT(*) as total_records,
    COUNT(part_name) as has_part_name,
    COUNT(extracted_year) as has_extracted_year,
    COUNT(model_display) as has_model_display,
    ROUND(COUNT(part_name) * 100.0 / COUNT(*), 1) as processing_percentage
FROM catalog_items;

-- Test multi-word search
SELECT 
    'Multi-word Search Test:' as check_type,
    COUNT(*) as toyota_japan_results,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Working'
        ELSE '❌ Not working'
    END as status
FROM smart_parts_search(make_param := 'טויוטה יפן', limit_results := 5);

SELECT '=== AUTOMATIC DEPLOYMENT COMPLETE ===' as section;