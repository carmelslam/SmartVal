-- COMPLETE CASCADING SEARCH - ALL 16 PARAMETERS
-- Implements exact cascade logic from task file
--
-- Parameters (in cascade order):
-- 1. car_plate - Always accept (never filters)
-- 2. make - "טויוטה יפן" → "טויוטה"
-- 3. model - "COROLLA CROSS" → "COROLLA" → fallback to make only
-- 4. model_code - "ZVG12L-KHXGBW" → "ZVG12L" → fallback to model → make
-- 5. trim - Fallback to model_code → model → make
-- 6. year - Normalize (2022→022, 1989→89), fallback to make
-- 7. engine_volume - If doesn't exist, IGNORE (don't break search)
-- 8. engine_code - If doesn't exist, IGNORE
-- 9. engine_type - If doesn't exist, IGNORE
-- 10. vin_number - If doesn't exist, IGNORE
-- 11. oem - Search if exists
-- 12. free_query - Multi-word cascade
-- 13. family - Part family filter
-- 14. part - Multi-word cascade "כנף אחורית שמאלית" → "כנף אחורית" → "כנף"
-- 15. source - חליפי/מקורי filter
-- 16. quantity - Informational only

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
    
    -- Cascade variables
    make_terms TEXT[];
    model_terms TEXT[];
    part_terms TEXT[];
    free_terms TEXT[];
    year_formats TEXT[];
    
    current_search TEXT;
    i INT;
BEGIN
    -- ============================================================================
    -- PLATE: Always accepted, never filters (informational only)
    -- ============================================================================
    -- car_plate is stored for context but doesn't filter results
    
    -- ============================================================================
    -- STEP 1: CASCADE MAKE (טויוטה יפן → טויוטה)
    -- ============================================================================
    
    IF make_param IS NOT NULL AND make_param != '' THEN
        make_terms := string_to_array(make_param, ' ');
        
        -- Try progressively fewer words
        FOR i IN REVERSE array_length(make_terms, 1)..1 LOOP
            current_search := array_to_string(make_terms[1:i], ' ');
            
            where_parts := array_append(where_parts,
                format('ci.make ILIKE %L', '%' || current_search || '%'));
            
            final_where := array_to_string(where_parts, ' AND ');
            EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || final_where INTO result_count;
            
            IF result_count > 0 THEN EXIT; END IF;
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END LOOP;
        
        -- If no make found, return empty
        IF result_count = 0 THEN RETURN; END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 2: CASCADE MODEL_CODE (ZVG12L-KHXGBW → ZVG12L → model → make)
    -- ============================================================================
    
    IF model_code_param IS NOT NULL AND model_code_param != '' THEN
        -- Try full model_code
        where_parts := array_append(where_parts,
            format('ci.model_code ILIKE %L', '%' || model_code_param || '%'));
        
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        
        IF result_count = 0 THEN
            -- Try code before '-'
            IF position('-' IN model_code_param) > 0 THEN
                where_parts := where_parts[1:array_length(where_parts,1)-1];
                current_search := split_part(model_code_param, '-', 1);
                
                where_parts := array_append(where_parts,
                    format('ci.model_code ILIKE %L', '%' || current_search || '%'));
                
                EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
            END IF;
            
            -- If still no results, fallback to model/make (don't add model_code filter)
            IF result_count = 0 THEN
                where_parts := where_parts[1:array_length(where_parts,1)-1];
            END IF;
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 3: CASCADE TRIM (ADVENTURE → model_code → model → make)
    -- ============================================================================
    
    IF trim_param IS NOT NULL AND trim_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.trim ILIKE %L', '%' || trim_param || '%'));
        
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        
        -- If no trim match, remove filter (fallback to previous filters)
        IF result_count = 0 THEN
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 4: CASCADE MODEL (COROLLA CROSS → COROLLA → make)
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
        
        -- If no model match, continue without model (fallback to make)
    END IF;
    
    -- ============================================================================
    -- STEP 5: CASCADE YEAR (2022 → 022, 1989 → 89)
    -- ============================================================================
    
    IF year_param IS NOT NULL AND year_param != '' THEN
        -- Normalize year format
        IF length(year_param) = 4 THEN
            IF year_param::INT >= 2010 THEN
                -- 2022 → 022 (leading 0 + last 2 digits)
                year_formats := ARRAY[
                    year_param,
                    '0' || substring(year_param from 3),
                    substring(year_param from 3)
                ];
            ELSE
                -- 1989 → 89 (just last 2 digits)
                year_formats := ARRAY[
                    year_param,
                    substring(year_param from 3)
                ];
            END IF;
        ELSE
            year_formats := ARRAY[year_param];
        END IF;
        
        -- Try each year format
        FOR i IN 1..array_length(year_formats, 1) LOOP
            where_parts := array_append(where_parts,
                format('(ci.year_from::TEXT ILIKE %L OR ci.extracted_year ILIKE %L)',
                    '%' || year_formats[i] || '%', '%' || year_formats[i] || '%'));
            
            EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
            
            IF result_count > 0 THEN EXIT; END IF;
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END LOOP;
        
        -- If no year match, continue without year (fallback to make)
    END IF;
    
    -- ============================================================================
    -- STEP 6: ENGINE PARAMETERS - IGNORE if don't exist (don't break search)
    -- ============================================================================
    
    -- engine_code: Try to filter, but ignore if no results
    IF engine_code_param IS NOT NULL AND engine_code_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.engine_code ILIKE %L', '%' || engine_code_param || '%'));
        
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        
        IF result_count = 0 THEN
            where_parts := where_parts[1:array_length(where_parts,1)-1]; -- Ignore
        END IF;
    END IF;
    
    -- engine_type: Try to filter, but ignore if no results
    IF engine_type_param IS NOT NULL AND engine_type_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.engine_type ILIKE %L', '%' || engine_type_param || '%'));
        
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        
        IF result_count = 0 THEN
            where_parts := where_parts[1:array_length(where_parts,1)-1]; -- Ignore
        END IF;
    END IF;
    
    -- engine_volume: Try to filter, but ignore if no results
    IF engine_volume_param IS NOT NULL AND engine_volume_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.engine_volume ILIKE %L', '%' || engine_volume_param || '%'));
        
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        
        IF result_count = 0 THEN
            where_parts := where_parts[1:array_length(where_parts,1)-1]; -- Ignore
        END IF;
    END IF;
    
    -- vin_number: Try to filter, but ignore if no results
    IF vin_number_param IS NOT NULL AND vin_number_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.vin ILIKE %L', '%' || vin_number_param || '%'));
        
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        
        IF result_count = 0 THEN
            where_parts := where_parts[1:array_length(where_parts,1)-1]; -- Ignore
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 7: PART PARAMETERS (parts search)
    -- ============================================================================
    
    -- CASCADE PART (כנף אחורית שמאלית → כנף אחורית → כנף)
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
        
        -- If no part found at all, return empty
        IF result_count = 0 THEN RETURN; END IF;
    END IF;
    
    -- OEM filter
    IF oem_param IS NOT NULL AND oem_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.oem ILIKE %L', '%' || oem_param || '%'));
    END IF;
    
    -- Part family filter
    IF family_param IS NOT NULL AND family_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.part_family ILIKE %L', '%' || family_param || '%'));
    END IF;
    
    -- Source filter (חליפי/מקורי)
    IF source_param IS NOT NULL AND source_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.source ILIKE %L', '%' || source_param || '%'));
    END IF;
    
    -- CASCADE FREE QUERY (multi-word)
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
    -- STEP 8: EXECUTE FINAL QUERY
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
