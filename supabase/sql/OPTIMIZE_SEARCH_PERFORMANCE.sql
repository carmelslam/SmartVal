-- OPTIMIZE: Remove all COUNT(*) queries to eliminate timeout
-- Build WHERE clause once with cascading logic using OR conditions
-- Let PostgreSQL optimize the single query

DROP FUNCTION IF EXISTS smart_parts_search(
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT, TEXT, TEXT, TEXT, TEXT, TEXT, INT, TEXT, TEXT, TEXT, TEXT
) CASCADE;

CREATE OR REPLACE FUNCTION smart_parts_search(
    make_param TEXT DEFAULT NULL,
    model_param TEXT DEFAULT NULL,
    free_query_param TEXT DEFAULT NULL,
    part_param TEXT DEFAULT NULL,
    oem_param TEXT DEFAULT NULL,
    family_param TEXT DEFAULT NULL,
    limit_results INT DEFAULT 50,
    car_plate TEXT DEFAULT NULL,
    engine_code_param TEXT DEFAULT NULL,
    engine_type_param TEXT DEFAULT NULL,
    engine_volume_param TEXT DEFAULT NULL,
    model_code_param TEXT DEFAULT NULL,
    quantity_param INT DEFAULT NULL,
    source_param TEXT DEFAULT NULL,
    trim_param TEXT DEFAULT NULL,
    vin_number_param TEXT DEFAULT NULL,
    year_param TEXT DEFAULT NULL
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
    match_score INT,
    year_from INT,
    year_to INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    where_parts TEXT[] := ARRAY[]::TEXT[];
    part_conditions TEXT[] := ARRAY[]::TEXT[];
    make_conditions TEXT[] := ARRAY[]::TEXT[];
    model_conditions TEXT[] := ARRAY[]::TEXT[];
    year_conditions TEXT[] := ARRAY[]::TEXT[];
    
    final_where TEXT;
    final_query TEXT;
    
    terms TEXT[];
    year_formats TEXT[];
    i INT;
BEGIN
    -- ============================================================================
    -- CRITICAL: REQUIRE EITHER part_param OR free_query_param
    -- ============================================================================
    
    IF (part_param IS NULL OR part_param = '') AND (free_query_param IS NULL OR free_query_param = '') THEN
        RETURN;
    END IF;
    
    -- ============================================================================
    -- BUILD PART/FREE_QUERY CONDITIONS (MANDATORY - DEAL BREAKER)
    -- Build cascading OR conditions instead of counting
    -- ============================================================================
    
    IF part_param IS NOT NULL AND part_param != '' THEN
        terms := string_to_array(part_param, ' ');
        
        -- Build cascading conditions: try full phrase, then remove words
        FOR i IN REVERSE array_length(terms, 1)..1 LOOP
            part_conditions := array_append(part_conditions,
                format('(ci.cat_num_desc ILIKE %L OR ci.part_family ILIKE %L)',
                    '%' || array_to_string(terms[1:i], ' ') || '%',
                    '%' || array_to_string(terms[1:i], ' ') || '%'));
        END LOOP;
        
        where_parts := array_append(where_parts, '(' || array_to_string(part_conditions, ' OR ') || ')');
        
    ELSIF free_query_param IS NOT NULL AND free_query_param != '' THEN
        terms := string_to_array(free_query_param, ' ');
        
        FOR i IN REVERSE array_length(terms, 1)..1 LOOP
            part_conditions := array_append(part_conditions,
                format('(ci.cat_num_desc ILIKE %L OR ci.part_family ILIKE %L)',
                    '%' || array_to_string(terms[1:i], ' ') || '%',
                    '%' || array_to_string(terms[1:i], ' ') || '%'));
        END LOOP;
        
        where_parts := array_append(where_parts, '(' || array_to_string(part_conditions, ' OR ') || ')');
    END IF;
    
    -- ============================================================================
    -- BUILD MAKE CONDITIONS (CASCADING)
    -- ============================================================================
    
    IF make_param IS NOT NULL AND make_param != '' THEN
        terms := string_to_array(make_param, ' ');
        
        FOR i IN REVERSE array_length(terms, 1)..1 LOOP
            make_conditions := array_append(make_conditions,
                format('ci.make ILIKE %L', '%' || array_to_string(terms[1:i], ' ') || '%'));
        END LOOP;
        
        where_parts := array_append(where_parts, '(' || array_to_string(make_conditions, ' OR ') || ')');
    END IF;
    
    -- ============================================================================
    -- BUILD MODEL CONDITIONS (CASCADING)
    -- ============================================================================
    
    IF model_param IS NOT NULL AND model_param != '' THEN
        terms := string_to_array(model_param, ' ');
        
        FOR i IN REVERSE array_length(terms, 1)..1 LOOP
            model_conditions := array_append(model_conditions,
                format('ci.model ILIKE %L', '%' || array_to_string(terms[1:i], ' ') || '%'));
        END LOOP;
        
        where_parts := array_append(where_parts, '(' || array_to_string(model_conditions, ' OR ') || ')');
    END IF;
    
    -- ============================================================================
    -- BUILD YEAR CONDITIONS (CASCADING)
    -- ============================================================================
    
    IF year_param IS NOT NULL AND year_param != '' THEN
        IF length(year_param) = 4 THEN
            IF year_param::INT >= 2010 THEN
                year_formats := ARRAY[year_param, '0' || substring(year_param from 3), substring(year_param from 3)];
            ELSE
                year_formats := ARRAY[year_param, substring(year_param from 3)];
            END IF;
        ELSE
            year_formats := ARRAY[year_param];
        END IF;
        
        FOR i IN 1..array_length(year_formats, 1) LOOP
            year_conditions := array_append(year_conditions,
                format('(ci.year_from::TEXT ILIKE %L OR ci.extracted_year ILIKE %L)',
                    '%' || year_formats[i] || '%', '%' || year_formats[i] || '%'));
        END LOOP;
        
        where_parts := array_append(where_parts, '(' || array_to_string(year_conditions, ' OR ') || ')');
    END IF;
    
    -- ============================================================================
    -- ADD SIMPLE FILTERS (NO CASCADING)
    -- ============================================================================
    
    IF family_param IS NOT NULL AND family_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.part_family ILIKE %L', '%' || family_param || '%'));
    END IF;
    
    IF source_param IS NOT NULL AND source_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.source ILIKE %L', '%' || source_param || '%'));
    END IF;
    
    IF oem_param IS NOT NULL AND oem_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.oem ILIKE %L', '%' || oem_param || '%'));
    END IF;
    
    -- ============================================================================
    -- EXECUTE SINGLE OPTIMIZED QUERY
    -- ============================================================================
    
    final_where := array_to_string(where_parts, ' AND ');
    IF final_where = '' THEN final_where := 'TRUE'; END IF;
    
    final_query := format('
        SELECT 
            ci.id,
            ci.cat_num_desc,
            ci.supplier_name,
            ci.pcode,
            ci.price::NUMERIC,
            ci.oem,
            ci.make,
            ci.model,
            COALESCE(ci.part_family, ''לא מוגדר'') as part_family,
            ci.side_position,
            ci.version_date::TEXT,
            COALESCE(ci.source, ''חליפי'') as availability,
            ci.extracted_year,
            ci.model_display,
            10 as match_score,
            ci.year_from,
            ci.year_to
        FROM catalog_items ci
        WHERE %s
        ORDER BY ci.price ASC NULLS LAST
        LIMIT %s
    ', final_where, limit_results);
    
    RETURN QUERY EXECUTE final_query;
END;
$$;

-- Test: Simple search
SELECT 'Test: Simple search with free_query' as test;
SELECT COUNT(*) as result_count
FROM smart_parts_search(free_query_param := 'ביטנה כנף קד');

-- Test: Advanced search
SELECT 'Test: Advanced search with part_param' as test;
SELECT COUNT(*) as result_count
FROM smart_parts_search(
    make_param := 'טויוטה',
    part_param := 'כנף אחורית'
);
