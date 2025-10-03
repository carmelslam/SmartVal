-- FIX: REQUIRE EITHER part_param OR free_query_param
-- Simple search uses free_query_param
-- Advanced search uses part_param
-- At least ONE must be provided, and it MUST match (deal breaker)

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
    result_count INT := 0;
    where_parts TEXT[] := ARRAY[]::TEXT[];
    final_where TEXT;
    final_query TEXT;
    
    make_terms TEXT[];
    model_terms TEXT[];
    part_terms TEXT[];
    free_terms TEXT[];
    year_formats TEXT[];
    
    current_search TEXT;
    i INT;
    part_search_done BOOLEAN := FALSE;
BEGIN
    -- ============================================================================
    -- CRITICAL: REQUIRE EITHER part_param OR free_query_param
    -- At least one must be provided for search to work
    -- ============================================================================
    
    IF (part_param IS NULL OR part_param = '') AND (free_query_param IS NULL OR free_query_param = '') THEN
        RETURN; -- Return empty - no part search provided
    END IF;
    
    -- ============================================================================
    -- STEP 1: SEARCH FOR PART (MANDATORY - DEAL BREAKER)
    -- Try part_param first, then free_query_param
    -- ============================================================================
    
    -- Try part_param if provided
    IF part_param IS NOT NULL AND part_param != '' THEN
        part_terms := string_to_array(part_param, ' ');
        
        FOR i IN REVERSE array_length(part_terms, 1)..1 LOOP
            current_search := array_to_string(part_terms[1:i], ' ');
            
            where_parts := array_append(where_parts,
                format('(ci.cat_num_desc ILIKE %L OR ci.part_family ILIKE %L)',
                    '%' || current_search || '%', '%' || current_search || '%'));
            
            EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
            
            IF result_count > 0 THEN EXIT; END IF;
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END LOOP;
        
        -- If no part found, return empty (DEAL BREAKER)
        IF result_count = 0 THEN 
            RETURN; 
        END IF;
        
        part_search_done := TRUE;
    END IF;
    
    -- Try free_query_param if part_param wasn't used
    IF NOT part_search_done AND free_query_param IS NOT NULL AND free_query_param != '' THEN
        free_terms := string_to_array(free_query_param, ' ');
        
        FOR i IN REVERSE array_length(free_terms, 1)..1 LOOP
            current_search := array_to_string(free_terms[1:i], ' ');
            
            where_parts := array_append(where_parts,
                format('(ci.cat_num_desc ILIKE %L OR ci.part_family ILIKE %L)',
                    '%' || current_search || '%', '%' || current_search || '%'));
            
            EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
            
            IF result_count > 0 THEN EXIT; END IF;
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END LOOP;
        
        -- If no match found, return empty (DEAL BREAKER)
        IF result_count = 0 THEN 
            RETURN; 
        END IF;
        
        part_search_done := TRUE;
    END IF;
    
    -- ============================================================================
    -- STEP 2: ADD OPTIONAL FILTERS (make, model, year, etc.)
    -- These are only applied if part/free_query found results
    -- ============================================================================
    
    -- Make cascade
    IF make_param IS NOT NULL AND make_param != '' THEN
        make_terms := string_to_array(make_param, ' ');
        
        FOR i IN REVERSE array_length(make_terms, 1)..1 LOOP
            current_search := array_to_string(make_terms[1:i], ' ');
            
            where_parts := array_append(where_parts,
                format('ci.make ILIKE %L', '%' || current_search || '%'));
            
            final_where := array_to_string(where_parts, ' AND ');
            EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || final_where INTO result_count;
            
            IF result_count > 0 THEN EXIT; END IF;
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END LOOP;
        
        IF result_count = 0 THEN RETURN; END IF;
    END IF;
    
    -- Model cascade
    IF model_param IS NOT NULL AND model_param != '' THEN
        model_terms := string_to_array(model_param, ' ');
        
        FOR i IN REVERSE array_length(model_terms, 1)..1 LOOP
            current_search := array_to_string(model_terms[1:i], ' ');
            
            where_parts := array_append(where_parts,
                format('ci.model ILIKE %L', '%' || current_search || '%'));
            
            EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
            
            IF result_count > 0 THEN EXIT; END IF;
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END LOOP;
    END IF;
    
    -- Year cascade
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
            where_parts := array_append(where_parts,
                format('(ci.year_from::TEXT ILIKE %L OR ci.extracted_year ILIKE %L)',
                    '%' || year_formats[i] || '%', '%' || year_formats[i] || '%'));
            
            EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
            
            IF result_count > 0 THEN EXIT; END IF;
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END LOOP;
    END IF;
    
    -- Family filter
    IF family_param IS NOT NULL AND family_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.part_family ILIKE %L', '%' || family_param || '%'));
    END IF;
    
    -- Source filter
    IF source_param IS NOT NULL AND source_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.source ILIKE %L', '%' || source_param || '%'));
    END IF;
    
    -- OEM filter
    IF oem_param IS NOT NULL AND oem_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.oem ILIKE %L', '%' || oem_param || '%'));
    END IF;
    
    -- ============================================================================
    -- EXECUTE FINAL QUERY
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

-- Test 1: Simple search (free_query only) - should work
SELECT 'Test 1: Simple search with free_query' as test;
SELECT COUNT(*) as result_count
FROM smart_parts_search(free_query_param := 'ביטנה כנף קד');

-- Test 2: Advanced search (part_param only) - should work
SELECT 'Test 2: Advanced search with part_param' as test;
SELECT COUNT(*) as result_count
FROM smart_parts_search(
    make_param := 'טויוטה',
    part_param := 'כנף אחורית'
);

-- Test 3: No part OR free_query - should return 0
SELECT 'Test 3: Search without part or free_query (should be 0)' as test;
SELECT COUNT(*) as result_count
FROM smart_parts_search(make_param := 'טויוטה', model_param := 'קורולה');
