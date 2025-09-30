-- SAFE SEARCH DEPLOYMENT - NO DATA DELETION
-- This file ONLY creates search functions, NO DELETE statements
-- Safe to run multiple times

-- =========================================
-- NOTICE: This file contains NO DELETE statements
-- It will NOT delete any catalog data
-- =========================================

-- 1. Create or replace Hebrew reversal (safe)
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

-- 2. Create or replace make normalization (safe)
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
        ELSE RETURN TRIM(make_input);
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Drop old search function safely (only drops function, not data)
DROP FUNCTION IF EXISTS smart_parts_search CASCADE;

-- 4. Create new search function (safe)
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
    where_conditions TEXT[] := ARRAY[]::TEXT[];
    final_query TEXT;
BEGIN
    -- Handle make parameter
    IF make_param IS NOT NULL AND make_param != '' THEN
        normalized_make := normalize_make(make_param);
        where_conditions := array_append(where_conditions, 
            format('(ci.make = %L OR ci.make ILIKE %L)', 
                   normalized_make, '%' || normalized_make || '%'));
    END IF;
    
    -- Handle free query (for simple search)
    IF free_query_param IS NOT NULL AND free_query_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('(ci.cat_num_desc ILIKE %L OR ci.cat_num_desc ILIKE %L)', 
                   '%' || free_query_param || '%',
                   '%' || reverse_hebrew(free_query_param) || '%'));
    END IF;
    
    -- Build query - READ ONLY, no updates or deletes
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

-- 5. Check data is still there
SELECT 'Data check:' as status, COUNT(*) as total_records FROM catalog_items;

-- 6. Test search (READ ONLY)
SELECT 'Search test:' as status;
SELECT COUNT(*) FROM smart_parts_search(free_query_param := 'דלת', limit_results := 10);

SELECT '✅ SAFE DEPLOYMENT COMPLETE - NO DATA DELETED' as status;