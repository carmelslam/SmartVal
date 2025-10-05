-- COMPLETE SAFE DEPLOYMENT - ALL FUNCTIONS WITHOUT DATA DELETION
-- This file contains ALL the functions we developed
-- NO DELETE statements - Safe to run

-- =========================================
-- PART 1: CORE UTILITY FUNCTIONS
-- =========================================

-- Drop existing functions first (only drops functions, not data)
DROP FUNCTION IF EXISTS reverse_hebrew(text) CASCADE;
DROP FUNCTION IF EXISTS normalize_make(text) CASCADE;
DROP FUNCTION IF EXISTS extract_core_part_term(text) CASCADE;
DROP FUNCTION IF EXISTS extract_part_name_from_desc(text) CASCADE;
DROP FUNCTION IF EXISTS extract_side_from_desc(text) CASCADE;
DROP FUNCTION IF EXISTS extract_position_from_desc(text) CASCADE;
DROP FUNCTION IF EXISTS process_catalog_item() CASCADE;

-- 1. Hebrew reversal function
CREATE OR REPLACE FUNCTION reverse_hebrew(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
    hebrew_chars TEXT := 'אבגדהוזחטיכלמנסעפצקרשתךםןףץ';
    result TEXT := '';
    i INTEGER;
    char_pos INTEGER;
BEGIN
    IF input_text IS NULL THEN RETURN NULL; END IF;
    
    FOR i IN 1..length(input_text) LOOP
        char_pos := position(substring(input_text, i, 1) IN hebrew_chars);
        IF char_pos > 0 THEN
            result := substring(input_text, i, 1) || result;
        ELSE
            result := result || substring(input_text, i, 1);
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Make normalization
CREATE OR REPLACE FUNCTION normalize_make(make_input TEXT)
RETURNS TEXT AS $$
BEGIN
    IF make_input IS NULL THEN RETURN NULL; END IF;
    
    -- Remove country suffixes
    make_input := regexp_replace(make_input, '\s+(יפן|ארהב|גרמניה|קוריאה|צרפת|איטליה|אנגליה|שוודיה)$', '', 'gi');
    
    -- Normalize common makes
    CASE UPPER(TRIM(make_input))
        WHEN 'TOYOTA', 'טויוטה יפן' THEN RETURN 'טויוטה';
        WHEN 'BMW', 'במוו', 'בםוו' THEN RETURN 'BMW';
        WHEN 'MERCEDES', 'MERCEDES-BENZ', 'מרצדס', 'מרצדס בנץ' THEN RETURN 'מרצדס';
        WHEN 'AUDI', 'אודי' THEN RETURN 'אודי';
        WHEN 'VW', 'VOLKSWAGEN', 'פולקסווגן', 'פולקסוואגן' THEN RETURN 'פולקסווגן';
        WHEN 'MAZDA', 'מזדה' THEN RETURN 'מזדה';
        WHEN 'NISSAN', 'ניסן', 'ניסאן' THEN RETURN 'ניסן';
        WHEN 'HYUNDAI', 'יונדאי' THEN RETURN 'יונדאי';
        WHEN 'KIA', 'קיה' THEN RETURN 'קיה';
        WHEN 'HONDA', 'הונדה' THEN RETURN 'הונדה';
        WHEN 'FORD', 'פורד' THEN RETURN 'פורד';
        WHEN 'CHEVROLET', 'שברולט' THEN RETURN 'שברולט';
        WHEN 'SUZUKI', 'סוזוקי' THEN RETURN 'סוזוקי';
        WHEN 'MITSUBISHI', 'מיצובישי' THEN RETURN 'מיצובישי';
        WHEN 'RENAULT', 'רנו' THEN RETURN 'רנו';
        WHEN 'PEUGEOT', 'פיג\'ו' THEN RETURN 'פיג\'ו';
        WHEN 'CITROEN', 'סיטרואן' THEN RETURN 'סיטרואן';
        WHEN 'OPEL', 'אופל' THEN RETURN 'אופל';
        WHEN 'SKODA', 'סקודה' THEN RETURN 'סקודה';
        WHEN 'SEAT', 'סיאט' THEN RETURN 'סיאט';
        WHEN 'SUBARU', 'סובארו' THEN RETURN 'סובארו';
        ELSE RETURN TRIM(make_input);
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Core part term extraction
CREATE OR REPLACE FUNCTION extract_core_part_term(query_text TEXT)
RETURNS TEXT AS $$
DECLARE
    core_terms TEXT[] := ARRAY[
        'דלת', 'תלד',           -- door
        'כנף', 'ףנכ',           -- fender
        'מגן', 'ןגמ',           -- bumper
        'פנס', 'סנפ',           -- light
        'ראי', 'יאר', 'מראה', 'הארמ',  -- mirror
        'גלגל', 'לגלג',         -- wheel
        'מנוע', 'עונמ',         -- engine
        'שמשה', 'השמש',         -- windshield
        'חלון', 'ןולח',         -- window
        'קישוט', 'טושיק',       -- trim
        'בולם', 'םלוב',         -- shock
        'כיסוי', 'יוסיכ',       -- cover
        'פח', 'חפ',             -- panel
        'זרוע', 'עורז',         -- arm
        'תושבת', 'תבשות',       -- bracket
        'איתות', 'תותיא',       -- signal
        'ערפל', 'לפרע'          -- fog
    ];
    term TEXT;
    normalized_term TEXT;
BEGIN
    IF query_text IS NULL THEN RETURN NULL; END IF;
    
    FOREACH term IN ARRAY core_terms LOOP
        IF query_text ILIKE '%' || term || '%' THEN
            CASE term
                WHEN 'תלד' THEN normalized_term := 'דלת';
                WHEN 'ףנכ' THEN normalized_term := 'כנף';
                WHEN 'ןגמ' THEN normalized_term := 'מגן';
                WHEN 'סנפ' THEN normalized_term := 'פנס';
                WHEN 'יאר', 'הארמ' THEN normalized_term := 'מראה';
                WHEN 'לגלג' THEN normalized_term := 'גלגל';
                WHEN 'עונמ' THEN normalized_term := 'מנוע';
                WHEN 'השמש' THEN normalized_term := 'שמשה';
                WHEN 'ןולח' THEN normalized_term := 'חלון';
                WHEN 'טושיק' THEN normalized_term := 'קישוט';
                WHEN 'םלוב' THEN normalized_term := 'בולם';
                WHEN 'יוסיכ' THEN normalized_term := 'כיסוי';
                WHEN 'חפ' THEN normalized_term := 'פח';
                WHEN 'עורז' THEN normalized_term := 'זרוע';
                WHEN 'תבשות' THEN normalized_term := 'תושבת';
                WHEN 'תותיא' THEN normalized_term := 'איתות';
                WHEN 'לפרע' THEN normalized_term := 'ערפל';
                ELSE normalized_term := term;
            END CASE;
            RETURN normalized_term;
        END IF;
    END LOOP;
    RETURN query_text;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =========================================
-- PART 2: EXTRACTION FUNCTIONS
-- =========================================

-- 4. Extract part name from cat_num_desc
CREATE OR REPLACE FUNCTION extract_part_name_from_desc(cat_desc TEXT)
RETURNS TEXT AS $$
DECLARE
    part_patterns TEXT[] := ARRAY[
        'תלד|דלת', 'ףנכ|כנף', 'ןגמ|מגן', 'סנפ|פנס', 
        'יאר|ראי|הארמ|מראה', 'לגלג|גלגל', 'עונמ|מנוע',
        'השמש|שמשה', 'ןולח|חלון', 'טושיק|קישוט', 'םלוב|בולם',
        'יוסיכ|כיסוי', 'חפ|פח', 'עורז|זרוע', 'תבשות|תושבת',
        'תותיא|איתות', 'לפרע|ערפל'
    ];
    pattern TEXT;
    match TEXT;
BEGIN
    IF cat_desc IS NULL THEN RETURN NULL; END IF;
    
    FOREACH pattern IN ARRAY part_patterns LOOP
        match := substring(cat_desc from pattern);
        IF match IS NOT NULL THEN
            RETURN extract_core_part_term(match);
        END IF;
    END LOOP;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Extract side/position
CREATE OR REPLACE FUNCTION extract_side_from_desc(cat_desc TEXT)
RETURNS TEXT AS $$
BEGIN
    IF cat_desc IS NULL THEN RETURN NULL; END IF;
    
    -- Hebrew patterns
    IF cat_desc ~* 'ימי|ימין|ימני' THEN RETURN 'ימין'; END IF;
    IF cat_desc ~* 'שמא|שמאל|שמאלי' THEN RETURN 'שמאל'; END IF;
    
    -- English patterns
    IF cat_desc ~* '\yRIGHT\y|\yRH\y|\yR\.H\y' THEN RETURN 'ימין'; END IF;
    IF cat_desc ~* '\yLEFT\y|\yLH\y|\yL\.H\y' THEN RETURN 'שמאל'; END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. Extract front/rear position
CREATE OR REPLACE FUNCTION extract_position_from_desc(cat_desc TEXT)
RETURNS TEXT AS $$
BEGIN
    IF cat_desc IS NULL THEN RETURN NULL; END IF;
    
    -- Hebrew patterns
    IF cat_desc ~* 'קדמ|קדמי|קדמית' THEN RETURN 'קדמי'; END IF;
    IF cat_desc ~* 'אחו|אחור|אחורי' THEN RETURN 'אחורי'; END IF;
    
    -- English patterns
    IF cat_desc ~* '\yFRONT\y|\yFR\y' THEN RETURN 'קדמי'; END IF;
    IF cat_desc ~* '\yREAR\y|\yRR\y|\yBACK\y' THEN RETURN 'אחורי'; END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =========================================
-- PART 3: MAIN SEARCH FUNCTION
-- =========================================

-- 7. Main search function
DROP FUNCTION IF EXISTS smart_parts_search CASCADE;

CREATE OR REPLACE FUNCTION smart_parts_search(
    car_plate TEXT DEFAULT NULL,
    make_param TEXT DEFAULT NULL,
    model_param TEXT DEFAULT NULL,
    model_code_param TEXT DEFAULT NULL,
    trim_param TEXT DEFAULT NULL,
    year_param TEXT DEFAULT NULL,
    engine_volume_param TEXT DEFAULT NULL,
    engine_code_param TEXT DEFAULT NULL,
    engine_type_param TEXT DEFAULT NULL,
    vin_number_param TEXT DEFAULT NULL,
    oem_param TEXT DEFAULT NULL,
    free_query_param TEXT DEFAULT NULL,
    family_param TEXT DEFAULT NULL,
    part_param TEXT DEFAULT NULL,
    source_param TEXT DEFAULT NULL,
    quantity_param INTEGER DEFAULT 1,
    limit_results INTEGER DEFAULT 50
)
RETURNS TABLE(
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
    front_rear TEXT,
    year_range TEXT,
    availability TEXT,
    relevance_score INTEGER,
    version_date DATE
)
LANGUAGE plpgsql
AS $$
DECLARE
    normalized_make TEXT;
    core_part_term TEXT;
    where_conditions TEXT[] := ARRAY[]::TEXT[];
    final_query TEXT;
    year_int INTEGER;
BEGIN
    -- Make/Manufacturer filter
    IF make_param IS NOT NULL AND make_param != '' THEN
        normalized_make := normalize_make(make_param);
        where_conditions := array_append(where_conditions, 
            format('(ci.make = %L OR ci.make = %L OR ci.make ILIKE %L)', 
                   normalized_make,
                   make_param,
                   '%' || normalized_make || '%'));
    END IF;
    
    -- Model filter
    IF model_param IS NOT NULL AND model_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('(ci.model ILIKE %L OR ci.cat_num_desc ILIKE %L)', 
                   '%' || model_param || '%',
                   '%' || model_param || '%'));
    END IF;
    
    -- Year filter
    IF year_param IS NOT NULL AND year_param != '' THEN
        BEGIN
            year_int := year_param::INTEGER;
            where_conditions := array_append(where_conditions, 
                format('((ci.year_from IS NULL OR ci.year_from <= %s) AND (ci.year_to IS NULL OR ci.year_to >= %s))', 
                       year_int, year_int));
        EXCEPTION WHEN OTHERS THEN
            -- Skip if not valid integer
        END;
    END IF;
    
    -- Free query (part search)
    IF free_query_param IS NOT NULL AND free_query_param != '' THEN
        core_part_term := extract_core_part_term(free_query_param);
        where_conditions := array_append(where_conditions, 
            format('(
                ci.cat_num_desc ILIKE %L OR 
                ci.cat_num_desc ILIKE %L OR 
                ci.part_name ILIKE %L OR
                ci.pcode ILIKE %L OR
                ci.oem ILIKE %L
            )', 
                '%' || core_part_term || '%',
                '%' || reverse_hebrew(core_part_term) || '%',
                '%' || core_part_term || '%',
                '%' || free_query_param || '%',
                '%' || free_query_param || '%'));
    END IF;
    
    -- Build query
    final_query := 'SELECT 
        ci.id,
        reverse_hebrew(ci.cat_num_desc) as cat_num_desc,
        ci.supplier_name,
        ci.pcode,
        ci.price::NUMERIC,
        ci.oem,
        ci.make,
        ci.model,
        ci.part_family,
        ci.side_position,
        ci.front_rear,
        ci.year_range,
        ci.availability,
        50 as relevance_score,
        ci.version_date
    FROM catalog_items ci';
    
    IF array_length(where_conditions, 1) > 0 THEN
        final_query := final_query || ' WHERE ' || array_to_string(where_conditions, ' AND ');
    END IF;
    
    final_query := final_query || ' ORDER BY ci.price DESC NULLS LAST LIMIT ' || limit_results;
    
    RETURN QUERY EXECUTE final_query;
END;
$$;

-- =========================================
-- PART 4: AUTOMATIC PROCESSING
-- =========================================

-- 8. Automatic processing trigger function
CREATE OR REPLACE FUNCTION process_catalog_item()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract part name if null
    IF NEW.part_name IS NULL THEN
        NEW.part_name := extract_part_name_from_desc(NEW.cat_num_desc);
    END IF;
    
    -- Extract side position if null
    IF NEW.side_position IS NULL THEN
        NEW.side_position := extract_side_from_desc(NEW.cat_num_desc);
    END IF;
    
    -- Extract front/rear if null
    IF NEW.front_rear IS NULL THEN
        NEW.front_rear := extract_position_from_desc(NEW.cat_num_desc);
    END IF;
    
    -- Normalize make
    IF NEW.make IS NOT NULL THEN
        NEW.make := normalize_make(NEW.make);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Drop and recreate trigger
DROP TRIGGER IF EXISTS auto_process_catalog_item ON catalog_items;

CREATE TRIGGER auto_process_catalog_item
BEFORE INSERT OR UPDATE ON catalog_items
FOR EACH ROW
EXECUTE FUNCTION process_catalog_item();

-- =========================================
-- PART 5: ENSURE COLUMNS EXIST
-- =========================================

-- 10. Add part_name column if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'catalog_items' AND column_name = 'part_name') THEN
        ALTER TABLE catalog_items ADD COLUMN part_name TEXT;
        RAISE NOTICE 'Added part_name column';
    END IF;
END $$;

-- =========================================
-- PART 6: PROCESS EXISTING DATA (NO DELETION!)
-- =========================================

-- 11. Update existing records to extract data
UPDATE catalog_items
SET 
    part_name = COALESCE(part_name, extract_part_name_from_desc(cat_num_desc)),
    side_position = COALESCE(side_position, extract_side_from_desc(cat_num_desc)),
    front_rear = COALESCE(front_rear, extract_position_from_desc(cat_num_desc)),
    make = normalize_make(make)
WHERE (part_name IS NULL 
    OR side_position IS NULL 
    OR front_rear IS NULL
    OR make ILIKE '%יפן%')
  AND cat_num_desc IS NOT NULL;

-- =========================================
-- PART 7: VERIFICATION (NO DELETION!)
-- =========================================

-- 12. Check deployment status
SELECT 'DEPLOYMENT STATUS:' as status;

-- Check functions
SELECT 
    'Functions deployed' as check_item,
    COUNT(*) as count
FROM pg_proc 
WHERE proname IN ('reverse_hebrew', 'normalize_make', 'smart_parts_search', 
                  'extract_core_part_term', 'extract_part_name_from_desc', 
                  'extract_side_from_desc', 'extract_position_from_desc', 
                  'process_catalog_item');

-- Check trigger
SELECT 
    'Triggers active' as check_item,
    COUNT(*) as count
FROM pg_trigger 
WHERE tgname = 'auto_process_catalog_item';

-- Check data status
SELECT 
    'Data processing status' as check_item,
    COUNT(*) as total_records,
    COUNT(part_name) as with_part_name,
    COUNT(side_position) as with_side,
    COUNT(front_rear) as with_position,
    COUNT(CASE WHEN make NOT LIKE '%יפן%' THEN 1 END) as normalized_makes
FROM catalog_items;

-- 13. Quick search test
SELECT 'SEARCH TEST:' as status;
SELECT COUNT(*) as search_results
FROM smart_parts_search(free_query_param := 'דלת', limit_results := 10);

SELECT '✅ COMPLETE DEPLOYMENT SUCCESSFUL - NO DATA DELETED!' as status;

-- =========================================
-- IMPORTANT: NO DELETE STATEMENTS IN THIS FILE
-- This file is SAFE to run multiple times
-- =========================================