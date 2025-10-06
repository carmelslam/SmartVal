-- ============================================================================
-- SESSION 7 - FIX 7B: CORRECTED Double Part Filter
-- Date: 2025-10-05
-- Purpose: Exact order as specified - separate free_query and part_param, each applied twice
-- ============================================================================

-- CORRECT ORDER:
-- 1. FAMILY
-- 2. free_query_param (first - loose cascade)
-- 3. PART_param (first - loose cascade)
-- 4. MAKE
-- 5. MODEL
-- 6. free_query_param (second - STRICT no cascade)
-- 7. PART_param (second - STRICT no cascade)
-- 8. OEM
-- 9. YEAR
-- 10. TRIM
-- 11. MODEL_CODE
-- 12. VIN
-- 13. ENGINE_CODE
-- 14. ENGINE_VOLUME
-- 15. ENGINE_TYPE (fuel)
-- 16. SOURCE

DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT, TEXT, TEXT, TEXT, TEXT, TEXT, INT, TEXT, TEXT, TEXT, TEXT);

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
    
    part_terms TEXT[];
    free_terms TEXT[];
    make_terms TEXT[];
    model_terms TEXT[];
    year_formats TEXT[];
    
    current_search TEXT;
    normalized_search TEXT;
    search_message TEXT := '';
    
    -- Store which filter was used and the filter itself
    used_free_query BOOLEAN := FALSE;
    used_part_param BOOLEAN := FALSE;
    stored_part_filter TEXT := NULL;
    
    i INT;
BEGIN
    -- Requirement: Either part_param OR free_query_param
    IF (part_param IS NULL OR part_param = '') AND (free_query_param IS NULL OR free_query_param = '') THEN
        RETURN;
    END IF;
    
    -- ============================================================================
    -- STEP 1: FAMILY
    -- ============================================================================
    
    IF family_param IS NOT NULL AND family_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.part_family ILIKE %L', '%' || family_param || '%'));
        
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        
        IF result_count > 0 THEN
            search_message := 'משפחה: ' || family_param;
        ELSE
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 2: free_query_param (FIRST TIME - with field cascade)
    -- ============================================================================
    
    IF free_query_param IS NOT NULL AND free_query_param != '' THEN
        free_terms := string_to_array(free_query_param, ' ');
        used_free_query := TRUE;
        
        FOR i IN REVERSE array_length(free_terms, 1)..1 LOOP
            current_search := array_to_string(free_terms[1:i], ' ');
            normalized_search := normalize_search_term(current_search);
            
            where_parts := array_append(where_parts,
                format('(ci.cat_num_desc ~* %L OR ci.part_family ~* %L)',
                    normalized_search, normalized_search));
            
            EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
            
            IF result_count > 0 THEN
                stored_part_filter := array_to_string(where_parts[array_length(where_parts,1):array_length(where_parts,1)], '');
                search_message := search_message || ', חיפוש: ' || current_search;
                EXIT;
            END IF;
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END LOOP;
        
        IF result_count = 0 THEN RETURN; END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 3: PART_param (FIRST TIME - with field cascade)
    -- ============================================================================
    
    IF part_param IS NOT NULL AND part_param != '' THEN
        part_terms := string_to_array(part_param, ' ');
        used_part_param := TRUE;
        
        FOR i IN REVERSE array_length(part_terms, 1)..1 LOOP
            current_search := array_to_string(part_terms[1:i], ' ');
            normalized_search := normalize_search_term(current_search);
            
            where_parts := array_append(where_parts,
                format('(ci.cat_num_desc ~* %L OR ci.part_family ~* %L)',
                    normalized_search, normalized_search));
            
            EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
            
            IF result_count > 0 THEN
                stored_part_filter := array_to_string(where_parts[array_length(where_parts,1):array_length(where_parts,1)], '');
                search_message := search_message || ', חלק: ' || current_search;
                EXIT;
            END IF;
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END LOOP;
        
        IF result_count = 0 THEN RETURN; END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 4: MAKE
    -- ============================================================================
    
    IF make_param IS NOT NULL AND make_param != '' THEN
        make_terms := string_to_array(make_param, ' ');
        
        where_parts := array_append(where_parts,
            format('ci.make ILIKE %L', '%' || make_param || '%'));
        
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        
        IF result_count = 0 AND array_length(make_terms, 1) > 1 THEN
            where_parts := where_parts[1:array_length(where_parts,1)-1];
            
            FOR i IN 1..array_length(make_terms, 1) LOOP
                current_search := make_terms[i];
                where_parts := array_append(where_parts,
                    format('ci.make ILIKE %L', '%' || current_search || '%'));
                
                EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
                
                IF result_count > 0 THEN
                    search_message := search_message || ', יצרן: ' || current_search;
                    EXIT;
                END IF;
                where_parts := where_parts[1:array_length(where_parts,1)-1];
            END LOOP;
        ELSE
            search_message := search_message || ', יצרן: ' || make_param;
        END IF;
        
        IF result_count = 0 THEN RETURN; END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 5: MODEL
    -- ============================================================================
    
    IF model_param IS NOT NULL AND model_param != '' THEN
        model_terms := string_to_array(model_param, ' ');
        
        where_parts := array_append(where_parts,
            format('ci.model ILIKE %L', '%' || model_param || '%'));
        
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        
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
        
        IF result_count = 0 THEN
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 6: free_query_param (SECOND TIME - STRICT, no cascade)
    -- ============================================================================
    
    IF used_free_query AND stored_part_filter IS NOT NULL THEN
        where_parts := array_append(where_parts, stored_part_filter);
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
    END IF;
    
    -- ============================================================================
    -- STEP 7: PART_param (SECOND TIME - STRICT, no cascade)
    -- ============================================================================
    
    IF used_part_param AND stored_part_filter IS NOT NULL THEN
        where_parts := array_append(where_parts, stored_part_filter);
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
    END IF;
    
    -- ============================================================================
    -- STEP 8: OEM
    -- ============================================================================
    
    IF oem_param IS NOT NULL AND oem_param != '' THEN
        where_parts := array_append(where_parts, format('ci.oem ILIKE %L', '%' || oem_param || '%'));
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        IF result_count = 0 THEN where_parts := where_parts[1:array_length(where_parts,1)-1]; END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 9: YEAR
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
        
        IF result_count = 0 THEN where_parts := where_parts[1:array_length(where_parts,1)-1]; END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 10: TRIM
    -- ============================================================================
    
    IF trim_param IS NOT NULL AND trim_param != '' THEN
        where_parts := array_append(where_parts, format('ci.trim ILIKE %L', '%' || trim_param || '%'));
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        IF result_count = 0 THEN where_parts := where_parts[1:array_length(where_parts,1)-1]; END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 11: MODEL_CODE
    -- ============================================================================
    
    IF model_code_param IS NOT NULL AND model_code_param != '' THEN
        where_parts := array_append(where_parts, format('ci.model_code ILIKE %L', '%' || model_code_param || '%'));
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        IF result_count = 0 THEN where_parts := where_parts[1:array_length(where_parts,1)-1]; END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 12: VIN
    -- ============================================================================
    
    IF vin_number_param IS NOT NULL AND vin_number_param != '' THEN
        where_parts := array_append(where_parts, format('ci.vin ILIKE %L', '%' || vin_number_param || '%'));
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        IF result_count = 0 THEN where_parts := where_parts[1:array_length(where_parts,1)-1]; END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 13: ENGINE_CODE
    -- ============================================================================
    
    IF engine_code_param IS NOT NULL AND engine_code_param != '' THEN
        where_parts := array_append(where_parts, format('ci.engine_code ILIKE %L', '%' || engine_code_param || '%'));
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        IF result_count = 0 THEN where_parts := where_parts[1:array_length(where_parts,1)-1]; END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 14: ENGINE_VOLUME
    -- ============================================================================
    
    IF engine_volume_param IS NOT NULL AND engine_volume_param != '' THEN
        where_parts := array_append(where_parts, format('ci.engine_volume ILIKE %L', '%' || engine_volume_param || '%'));
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        IF result_count = 0 THEN where_parts := where_parts[1:array_length(where_parts,1)-1]; END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 15: ENGINE_TYPE (fuel type)
    -- ============================================================================
    
    IF engine_type_param IS NOT NULL AND engine_type_param != '' THEN
        where_parts := array_append(where_parts, format('ci.engine_type ILIKE %L', '%' || engine_type_param || '%'));
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        IF result_count = 0 THEN where_parts := where_parts[1:array_length(where_parts,1)-1]; END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 16: SOURCE
    -- ============================================================================
    
    IF source_param IS NOT NULL AND source_param != '' THEN
        where_parts := array_append(where_parts, format('ci.source ILIKE %L', '%' || source_param || '%'));
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

-- Test
SELECT 'Test: Correct order with double filter' as test;
SELECT search_message, pcode, cat_num_desc, make, model, part_family, price
FROM smart_parts_search(
    make_param := 'טויוטה',
    model_param := 'קורולה',
    part_param := 'פנס'
)
LIMIT 5;
