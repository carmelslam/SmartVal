-- AUTOMATIC DEPLOYMENT SYSTEM FOR CATALOG PROCESSING
-- This ensures all functions deploy automatically on catalog upload
-- CRITICAL: Run this ONCE in Supabase to set up the automatic system

-- =========================================
-- STEP 1: CORE UTILITY FUNCTIONS
-- =========================================

-- Hebrew reversal function
CREATE OR REPLACE FUNCTION reverse_hebrew(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
    hebrew_chars TEXT := 'אבגדהוזחטיכלמנסעפצקרשתךםןףץ';
    reversed_chars TEXT := 'אבגדהוזחטיכלמנסעפצקרשתךםןףץ';
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

-- Make normalization
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
        ELSE RETURN TRIM(make_input);
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Core part term extraction
CREATE OR REPLACE FUNCTION extract_core_part_term(query_text TEXT)
RETURNS TEXT AS $$
DECLARE
    core_terms TEXT[] := ARRAY[
        'דלת', 'תלד', 'כנף', 'ףנכ', 'מגן', 'ןגמ', 'פנס', 'סנפ',
        'ראי', 'יאר', 'מראה', 'הארמ', 'גלגל', 'לגלג', 'מנוע', 'עונמ',
        'שמשה', 'השמש', 'חלון', 'ןולח', 'קישוט', 'טושיק', 'בולם', 'םלוב',
        'כיסוי', 'יוסיכ', 'פח', 'חפ', 'זרוע', 'עורז', 'תושבת', 'תבשות',
        'איתות', 'תותיא', 'ערפל', 'לפרע'
    ];
    term TEXT;
    normalized_term TEXT;
BEGIN
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
-- STEP 2: EXTRACTION FUNCTIONS
-- =========================================

-- Extract part name from cat_num_desc
CREATE OR REPLACE FUNCTION extract_part_name_from_desc(cat_desc TEXT)
RETURNS TEXT AS $$
DECLARE
    part_patterns TEXT[] := ARRAY[
        'תלד|דלת', 'ףנכ|כנף', 'ןגמ|מגן', 'סנפ|פנס', 
        'יאר|ראי|הארמ|מראה', 'לגלג|גלגל', 'עונמ|מנוע',
        'השמש|שמשה', 'ןולח|חלון', 'טושיק|קישוט'
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

-- Extract side/position
CREATE OR REPLACE FUNCTION extract_side_from_desc(cat_desc TEXT)
RETURNS TEXT AS $$
BEGIN
    IF cat_desc IS NULL THEN RETURN NULL; END IF;
    
    -- Hebrew patterns
    IF cat_desc ~* 'ימי|ימין|ימני' THEN RETURN 'ימין'; END IF;
    IF cat_desc ~* 'שמא|שמאל|שמאלי' THEN RETURN 'שמאל'; END IF;
    IF cat_desc ~* 'קדמ|קדמי|קדמית' THEN RETURN 'קדמי'; END IF;
    IF cat_desc ~* 'אחו|אחור|אחורי' THEN RETURN 'אחורי'; END IF;
    
    -- English patterns
    IF cat_desc ~* '\yRIGHT\y|\yRH\y|\yR\.H\y' THEN RETURN 'ימין'; END IF;
    IF cat_desc ~* '\yLEFT\y|\yLH\y|\yL\.H\y' THEN RETURN 'שמאל'; END IF;
    IF cat_desc ~* '\yFRONT\y|\yFR\y' THEN RETURN 'קדמי'; END IF;
    IF cat_desc ~* '\yREAR\y|\yRR\y|\yBACK\y' THEN RETURN 'אחורי'; END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =========================================
-- STEP 3: MAIN SEARCH FUNCTION
-- =========================================

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
    -- Make normalization
    IF make_param IS NOT NULL AND make_param != '' THEN
        normalized_make := normalize_make(make_param);
        where_conditions := array_append(where_conditions, 
            format('(ci.make = %L OR ci.make = %L OR ci.make ILIKE %L)', 
                   normalized_make, make_param, '%' || normalized_make || '%'));
    END IF;
    
    -- Part search with flexibility
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
    
    -- Build and execute query
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
-- STEP 4: AUTOMATIC PROCESSING FUNCTION
-- =========================================

CREATE OR REPLACE FUNCTION process_catalog_item()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract part name
    IF NEW.part_name IS NULL THEN
        NEW.part_name := extract_part_name_from_desc(NEW.cat_num_desc);
    END IF;
    
    -- Extract side/position
    IF NEW.side_position IS NULL THEN
        NEW.side_position := extract_side_from_desc(NEW.cat_num_desc);
    END IF;
    
    -- Normalize make
    IF NEW.make IS NOT NULL THEN
        NEW.make := normalize_make(NEW.make);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- STEP 5: CREATE AUTOMATIC TRIGGERS
-- =========================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS auto_process_catalog_item ON catalog_items;

-- Create trigger for automatic processing
CREATE TRIGGER auto_process_catalog_item
BEFORE INSERT OR UPDATE ON catalog_items
FOR EACH ROW
EXECUTE FUNCTION process_catalog_item();

-- =========================================
-- STEP 6: PROCESS EXISTING DATA
-- =========================================

-- Add part_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'catalog_items' AND column_name = 'part_name') THEN
        ALTER TABLE catalog_items ADD COLUMN part_name TEXT;
    END IF;
END $$;

-- Process all existing records
UPDATE catalog_items
SET 
    part_name = COALESCE(part_name, extract_part_name_from_desc(cat_num_desc)),
    side_position = COALESCE(side_position, extract_side_from_desc(cat_num_desc)),
    make = normalize_make(make)
WHERE part_name IS NULL OR side_position IS NULL;

-- =========================================
-- STEP 7: CREATE MONITORING FUNCTION
-- =========================================

CREATE OR REPLACE FUNCTION check_catalog_processing_status()
RETURNS TABLE(
    total_items BIGINT,
    processed_items BIGINT,
    processing_percentage NUMERIC,
    items_with_part_name BIGINT,
    items_with_side BIGINT,
    items_with_normalized_make BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_items,
        COUNT(CASE WHEN part_name IS NOT NULL OR side_position IS NOT NULL THEN 1 END)::BIGINT as processed_items,
        ROUND(COUNT(CASE WHEN part_name IS NOT NULL OR side_position IS NOT NULL THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as processing_percentage,
        COUNT(part_name)::BIGINT as items_with_part_name,
        COUNT(side_position)::BIGINT as items_with_side,
        COUNT(CASE WHEN make IN ('טויוטה', 'BMW', 'מרצדס', 'אודי', 'פולקסווגן') THEN 1 END)::BIGINT as items_with_normalized_make
    FROM catalog_items;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- FINAL STATUS CHECK
-- =========================================

SELECT 'AUTOMATIC DEPLOYMENT SYSTEM INSTALLED!' as status;
SELECT * FROM check_catalog_processing_status();