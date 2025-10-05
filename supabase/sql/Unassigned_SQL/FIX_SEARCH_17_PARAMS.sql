-- Drop the 17-parameter version that UI is calling
DROP FUNCTION IF EXISTS smart_parts_search(
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT, TEXT, TEXT, TEXT, TEXT, TEXT, INT, TEXT, TEXT, TEXT, TEXT
) CASCADE;

-- Drop the 11-parameter version we just created
DROP FUNCTION IF EXISTS smart_parts_search(
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT
) CASCADE;

-- Create NEW cascading search with 17-parameter signature (what UI expects)
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
    year_formats TEXT[];
    current_part_search TEXT;
BEGIN
    -- ============================================================================
    -- CASCADE MAKE (טויוטה יפן → טויוטה)
    -- ============================================================================
    
    IF make_param IS NOT NULL AND make_param != '' THEN
        make_terms := string_to_array(make_param, ' ');
        
        FOR i IN REVERSE array_length(make_terms, 1)..1 LOOP
            DECLARE
                current_make TEXT := array_to_string(make_terms[1:i], ' ');
            BEGIN
                IF current_make != '' THEN
                    where_parts := array_append(where_parts,
                        format('ci.make ILIKE %L', '%' || current_make || '%'));
                    
                    final_where := array_to_string(where_parts, ' AND ');
                    EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || final_where INTO result_count;
                    
                    IF result_count > 0 THEN EXIT; END IF;
                    where_parts := where_parts[1:array_length(where_parts,1)-1];
                END IF;
            END;
        END LOOP;
        
        IF result_count = 0 THEN RETURN; END IF;
    END IF;
    
    -- ============================================================================
    -- CASCADE MODEL (COROLLA CROSS → COROLLA)
    -- ============================================================================
    
    IF model_param IS NOT NULL AND model_param != '' THEN
        model_terms := string_to_array(model_param, ' ');
        
        FOR i IN REVERSE array_length(model_terms, 1)..1 LOOP
            DECLARE
                current_model TEXT := array_to_string(model_terms[1:i], ' ');
            BEGIN
                IF current_model != '' THEN
                    where_parts := array_append(where_parts,
                        format('ci.model ILIKE %L', '%' || current_model || '%'));
                    
                    final_where := array_to_string(where_parts, ' AND ');
                    EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || final_where INTO result_count;
                    
                    IF result_count > 0 THEN EXIT; END IF;
                    where_parts := where_parts[1:array_length(where_parts,1)-1];
                END IF;
            END;
        END LOOP;
    END IF;
    
    -- ============================================================================
    -- CASCADE YEAR (2011 → 011 → 11)
    -- ============================================================================
    
    IF year_param IS NOT NULL AND year_param != '' THEN
        IF length(year_param) = 4 THEN
            year_formats := ARRAY[year_param, substring(year_param from 2), substring(year_param from 3)];
        ELSIF length(year_param) = 3 THEN
            year_formats := ARRAY[year_param, '2' || year_param, substring(year_param from 2)];
        ELSE
            year_formats := ARRAY[year_param];
        END IF;
        
        FOR i IN 1..array_length(year_formats, 1) LOOP
            where_parts := array_append(where_parts,
                format('(ci.year_from::TEXT ILIKE %L OR ci.extracted_year ILIKE %L)',
                    '%' || year_formats[i] || '%', '%' || year_formats[i] || '%'));
            
            final_where := array_to_string(where_parts, ' AND ');
            EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || final_where INTO result_count;
            
            IF result_count > 0 THEN EXIT; END IF;
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END LOOP;
    END IF;
    
    -- ============================================================================
    -- CASCADE PART (כנף אחורית שמאלית → כנף אחורית → כנף)
    -- ============================================================================
    
    IF part_param IS NOT NULL AND part_param != '' THEN
        part_terms := string_to_array(part_param, ' ');
        
        FOR i IN REVERSE array_length(part_terms, 1)..1 LOOP
            current_part_search := array_to_string(part_terms[1:i], ' ');
            
            IF current_part_search != '' THEN
                where_parts := array_append(where_parts,
                    format('(ci.cat_num_desc ILIKE %L OR ci.part_name ILIKE %L OR ci.part_family ILIKE %L)',
                        '%' || current_part_search || '%', '%' || current_part_search || '%', '%' || current_part_search || '%'));
                
                final_where := array_to_string(where_parts, ' AND ');
                EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || final_where INTO result_count;
                
                IF result_count > 0 THEN EXIT; END IF;
                where_parts := where_parts[1:array_length(where_parts,1)-1];
            END IF;
        END LOOP;
        
        IF result_count = 0 AND part_param IS NOT NULL THEN RETURN; END IF;
    END IF;
    
    -- ============================================================================
    -- OTHER FILTERS
    -- ============================================================================
    
    IF oem_param IS NOT NULL AND oem_param != '' THEN
        where_parts := array_append(where_parts, format('ci.oem ILIKE %L', '%' || oem_param || '%'));
    END IF;
    
    IF family_param IS NOT NULL AND family_param != '' THEN
        where_parts := array_append(where_parts, format('ci.part_family ILIKE %L', '%' || family_param || '%'));
    END IF;
    
    IF free_query_param IS NOT NULL AND free_query_param != '' THEN
        where_parts := array_append(where_parts,
            format('(ci.cat_num_desc ILIKE %L OR ci.part_name ILIKE %L)',
                '%' || free_query_param || '%', '%' || free_query_param || '%'));
    END IF;
    
    -- ============================================================================
    -- EXECUTE QUERY
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
