-- Take the OLD WORKING SQL and add part/free_query requirement
-- WITHOUT using COUNT queries for the requirement check
-- Just check if parameters are provided, then use normal cascading

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
BEGIN
    -- ============================================================================
    -- CRITICAL REQUIREMENT: Either part_param OR free_query_param must be provided
    -- This is a simple NULL check - no COUNT queries needed
    -- ============================================================================
    
    IF (part_param IS NULL OR part_param = '') AND (free_query_param IS NULL OR free_query_param = '') THEN
        RETURN; -- Return empty - no part search criteria provided
    END IF;
    
    -- ============================================================================
    -- STEP 1: CASCADE MAKE (טויוטה יפן → טויוטה)
    -- ============================================================================
    
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
    
    -- ============================================================================
    -- STEP 2: CASCADE MODEL_CODE
    -- ============================================================================
    
    IF model_code_param IS NOT NULL AND model_code_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.model_code ILIKE %L', '%' || model_code_param || '%'));
        
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        
        IF result_count = 0 THEN
            IF position('-' IN model_code_param) > 0 THEN
                where_parts := where_parts[1:array_length(where_parts,1)-1];
                current_search := split_part(model_code_param, '-', 1);
                
                where_parts := array_append(where_parts,
                    format('ci.model_code ILIKE %L', '%' || current_search || '%'));
                
                EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
            END IF;
            
            IF result_count = 0 THEN
                where_parts := where_parts[1:array_length(where_parts,1)-1];
            END IF;
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 3: CASCADE TRIM
    -- ============================================================================
    
    IF trim_param IS NOT NULL AND trim_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.trim ILIKE %L', '%' || trim_param || '%'));
        
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        
        IF result_count = 0 THEN
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 4: CASCADE MODEL
    -- ============================================================================
    
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
    
    -- ============================================================================
    -- STEP 5: CASCADE YEAR
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
            where_parts := array_append(where_parts,
                format('(ci.year_from::TEXT ILIKE %L OR ci.extracted_year ILIKE %L)',
                    '%' || year_formats[i] || '%', '%' || year_formats[i] || '%'));
            
            EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
            
            IF result_count > 0 THEN EXIT; END IF;
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END LOOP;
    END IF;
    
    -- ============================================================================
    -- STEP 6: ENGINE PARAMETERS - IGNORE if don't exist
    -- ============================================================================
    
    IF engine_code_param IS NOT NULL AND engine_code_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.engine_code ILIKE %L', '%' || engine_code_param || '%'));
        
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        
        IF result_count = 0 THEN
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END IF;
    END IF;
    
    IF engine_type_param IS NOT NULL AND engine_type_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.engine_type ILIKE %L', '%' || engine_type_param || '%'));
        
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        
        IF result_count = 0 THEN
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END IF;
    END IF;
    
    IF engine_volume_param IS NOT NULL AND engine_volume_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.engine_volume ILIKE %L', '%' || engine_volume_param || '%'));
        
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        
        IF result_count = 0 THEN
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END IF;
    END IF;
    
    IF vin_number_param IS NOT NULL AND vin_number_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.vin ILIKE %L', '%' || vin_number_param || '%'));
        
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        
        IF result_count = 0 THEN
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 7: PART PARAMETERS - Use part_param if provided, else free_query
    -- ============================================================================
    
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
        
        IF result_count = 0 THEN RETURN; END IF;
    END IF;
    
    IF oem_param IS NOT NULL AND oem_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.oem ILIKE %L', '%' || oem_param || '%'));
    END IF;
    
    IF family_param IS NOT NULL AND family_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.part_family ILIKE %L', '%' || family_param || '%'));
    END IF;
    
    IF source_param IS NOT NULL AND source_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.source ILIKE %L', '%' || source_param || '%'));
    END IF;
    
    IF free_query_param IS NOT NULL AND free_query_param != '' THEN
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
