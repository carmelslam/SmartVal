-- ============================================================================
-- SESSION 7 - FIX 6: FINAL COMPLETE SEARCH FUNCTION
-- Date: 2025-10-05
-- Purpose: Single complete search with correct order + field/parameter cascade + normalization
-- ============================================================================

-- Drop old field cascade function
DROP FUNCTION IF EXISTS smart_parts_search_field_cascade(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT);

-- Create THE ONLY search function needed
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
    version_date TEXT,
    availability TEXT,
    extracted_year TEXT,
    model_display TEXT,
    match_score INTEGER,
    year_from INTEGER,
    year_to INTEGER,
    search_message TEXT
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
    normalized_search TEXT;
    search_message TEXT := '';
    i INT;
BEGIN
    -- ============================================================================
    -- REQUIREMENT: Either part_param OR free_query_param must be provided
    -- ============================================================================
    
    IF (part_param IS NULL OR part_param = '') AND (free_query_param IS NULL OR free_query_param = '') THEN
        RETURN;
    END IF;
    
    -- ============================================================================
    -- STEP 1: MAKE (STRICT - must match, field cascade)
    -- ============================================================================
    
    IF make_param IS NOT NULL AND make_param != '' THEN
        make_terms := string_to_array(make_param, ' ');
        
        -- Try full make first
        where_parts := array_append(where_parts,
            format('ci.make ILIKE %L', '%' || make_param || '%'));
        
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        
        -- Field cascade: try word-by-word
        IF result_count = 0 AND array_length(make_terms, 1) > 1 THEN
            where_parts := where_parts[1:array_length(where_parts,1)-1];
            
            FOR i IN 1..array_length(make_terms, 1) LOOP
                current_search := make_terms[i];
                where_parts := array_append(where_parts,
                    format('ci.make ILIKE %L', '%' || current_search || '%'));
                
                EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
                
                IF result_count > 0 THEN
                    search_message := 'יצרן: ' || current_search;
                    EXIT;
                END IF;
                where_parts := where_parts[1:array_length(where_parts,1)-1];
            END LOOP;
        ELSE
            search_message := 'יצרן: ' || make_param;
        END IF;
        
        -- If no make found, return 0
        IF result_count = 0 THEN
            RETURN;
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 2: MODEL (parameter cascade - continue without if not found)
    -- ============================================================================
    
    IF model_param IS NOT NULL AND model_param != '' THEN
        model_terms := string_to_array(model_param, ' ');
        
        -- Try full model
        where_parts := array_append(where_parts,
            format('ci.model ILIKE %L', '%' || model_param || '%'));
        
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        
        -- Field cascade: try word-by-word
        IF result_count = 0 AND array_length(model_terms, 1) > 1 THEN
            where_parts := where_parts[1:array_length(where_parts,1)-1];
            
            FOR i IN 1..array_length(model_terms, 1) LOOP
                current_search := model_terms[i];
                where_parts := array_append(where_parts,
                    format('ci.model ILIKE %L', '%' || current_search || '%'));
                
                EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
                
                IF result_count > 0 THEN
                    search_message := search_message || ', דגם: ' || current_search;
                    EXIT;
                END IF;
                where_parts := where_parts[1:array_length(where_parts,1)-1];
            END LOOP;
        ELSIF result_count > 0 THEN
            search_message := search_message || ', דגם: ' || model_param;
        END IF;
        
        -- Parameter cascade: if no model, remove filter and continue
        IF result_count = 0 THEN
            where_parts := where_parts[1:array_length(where_parts,1)-1];
            search_message := search_message || ', דגם לא נמצא';
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 3: FAMILY (parameter cascade - continue without if not found)
    -- ============================================================================
    
    IF family_param IS NOT NULL AND family_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.part_family ILIKE %L', '%' || family_param || '%'));
        
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        
        IF result_count > 0 THEN
            search_message := search_message || ', משפחה: ' || family_param;
        ELSE
            where_parts := where_parts[1:array_length(where_parts,1)-1];
            search_message := search_message || ', משפחה לא נמצאה';
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 4: PART SEARCH (free_query OR part_param) WITH NORMALIZATION + FIELD CASCADE
    -- ============================================================================
    
    -- Simple search: free_query_param
    IF free_query_param IS NOT NULL AND free_query_param != '' THEN
        free_terms := string_to_array(free_query_param, ' ');
        
        -- Field cascade: try progressively shorter (remove last word)
        FOR i IN REVERSE array_length(free_terms, 1)..1 LOOP
            current_search := array_to_string(free_terms[1:i], ' ');
            normalized_search := normalize_search_term(current_search);
            
            where_parts := array_append(where_parts,
                format('(ci.cat_num_desc ~* %L OR ci.part_family ~* %L)',
                    normalized_search, normalized_search));
            
            EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
            
            IF result_count > 0 THEN
                IF i < array_length(free_terms, 1) THEN
                    search_message := search_message || ', חיפוש: ' || current_search || ' (לא נמצא: ' || array_to_string(free_terms[i+1:array_length(free_terms,1)], ' ') || ')';
                ELSE
                    search_message := search_message || ', חיפוש: ' || current_search;
                END IF;
                EXIT;
            END IF;
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END LOOP;
        
        IF result_count = 0 THEN RETURN; END IF;
    END IF;
    
    -- Advanced search: part_param
    IF part_param IS NOT NULL AND part_param != '' THEN
        part_terms := string_to_array(part_param, ' ');
        
        -- Field cascade: try progressively shorter
        FOR i IN REVERSE array_length(part_terms, 1)..1 LOOP
            current_search := array_to_string(part_terms[1:i], ' ');
            normalized_search := normalize_search_term(current_search);
            
            where_parts := array_append(where_parts,
                format('(ci.cat_num_desc ~* %L OR ci.part_family ~* %L)',
                    normalized_search, normalized_search));
            
            EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
            
            IF result_count > 0 THEN
                IF i < array_length(part_terms, 1) THEN
                    search_message := search_message || ', חלק: ' || current_search || ' (לא נמצא: ' || array_to_string(part_terms[i+1:array_length(part_terms,1)], ' ') || ')';
                ELSE
                    search_message := search_message || ', חלק: ' || current_search;
                END IF;
                EXIT;
            END IF;
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END LOOP;
        
        IF result_count = 0 THEN RETURN; END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 5: OEM (parameter cascade)
    -- ============================================================================
    
    IF oem_param IS NOT NULL AND oem_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.oem ILIKE %L', '%' || oem_param || '%'));
        
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        
        IF result_count = 0 THEN
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 6: SOURCE (parameter cascade)
    -- ============================================================================
    
    IF source_param IS NOT NULL AND source_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.source ILIKE %L', '%' || source_param || '%'));
        
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        
        IF result_count = 0 THEN
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 7: YEAR (field cascade - multiple formats)
    -- ============================================================================
    
    IF year_param IS NOT NULL AND year_param != '' THEN
        IF length(year_param) = 4 THEN
            year_formats := ARRAY[year_param, LPAD((year_param::INT % 100)::TEXT, 3, '0'), (year_param::INT % 100)::TEXT];
        ELSE
            year_formats := ARRAY[year_param];
        END IF;
        
        FOR i IN 1..array_length(year_formats, 1) LOOP
            where_parts := array_append(where_parts,
                format('(ci.year_from::TEXT ILIKE %L OR ci.year_range ILIKE %L)',
                    '%' || year_formats[i] || '%', '%' || year_formats[i] || '%'));
            
            EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
            
            IF result_count > 0 THEN EXIT; END IF;
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END LOOP;
        
        -- Parameter cascade: continue without year if not found
        IF result_count = 0 THEN
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 8-13: TRIM, MODEL_CODE, VIN, ENGINE params (all parameter cascade)
    -- ============================================================================
    
    IF trim_param IS NOT NULL AND trim_param != '' THEN
        where_parts := array_append(where_parts, format('ci.trim ILIKE %L', '%' || trim_param || '%'));
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        IF result_count = 0 THEN where_parts := where_parts[1:array_length(where_parts,1)-1]; END IF;
    END IF;
    
    IF model_code_param IS NOT NULL AND model_code_param != '' THEN
        where_parts := array_append(where_parts, format('ci.model_code ILIKE %L', '%' || model_code_param || '%'));
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        IF result_count = 0 THEN where_parts := where_parts[1:array_length(where_parts,1)-1]; END IF;
    END IF;
    
    IF vin_number_param IS NOT NULL AND vin_number_param != '' THEN
        where_parts := array_append(where_parts, format('ci.vin ILIKE %L', '%' || vin_number_param || '%'));
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        IF result_count = 0 THEN where_parts := where_parts[1:array_length(where_parts,1)-1]; END IF;
    END IF;
    
    IF engine_code_param IS NOT NULL AND engine_code_param != '' THEN
        where_parts := array_append(where_parts, format('ci.engine_code ILIKE %L', '%' || engine_code_param || '%'));
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        IF result_count = 0 THEN where_parts := where_parts[1:array_length(where_parts,1)-1]; END IF;
    END IF;
    
    IF engine_type_param IS NOT NULL AND engine_type_param != '' THEN
        where_parts := array_append(where_parts, format('ci.engine_type ILIKE %L', '%' || engine_type_param || '%'));
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        IF result_count = 0 THEN where_parts := where_parts[1:array_length(where_parts,1)-1]; END IF;
    END IF;
    
    IF engine_volume_param IS NOT NULL AND engine_volume_param != '' THEN
        where_parts := array_append(where_parts, format('ci.engine_volume ILIKE %L', '%' || engine_volume_param || '%'));
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        IF result_count = 0 THEN where_parts := where_parts[1:array_length(where_parts,1)-1]; END IF;
    END IF;
    
    -- ============================================================================
    -- EXECUTE FINAL QUERY
    -- ============================================================================
    
    final_where := array_to_string(where_parts, ' AND ');
    IF final_where = '' THEN final_where := 'TRUE'; END IF;
    
    final_query := format('
        SELECT 
            ci.id, ci.cat_num_desc, ci.supplier_name, ci.pcode, ci.price::NUMERIC,
            ci.oem, ci.make, ci.model,
            COALESCE(ci.part_family, ''לא מוגדר'') as part_family,
            ci.side_position, ci.version_date::TEXT,
            COALESCE(ci.source, ''חליפי'') as availability,
            ci.extracted_year, ci.model_display,
            10 as match_score, ci.year_from, ci.year_to,
            %L as search_message
        FROM catalog_items ci
        WHERE %s
        ORDER BY ci.price ASC NULLS LAST
        LIMIT %s
    ', search_message, final_where, limit_results);
    
    RETURN QUERY EXECUTE final_query;
END;
$$;

-- Test complete function
SELECT 'Test: Complete function with all features' as test;
SELECT search_message, pcode, cat_num_desc, make, model, part_family, price
FROM smart_parts_search(
    make_param := 'טויוטה',
    model_param := 'קורולה',
    part_param := 'כנף אחורית שמאל'
)
LIMIT 5;
