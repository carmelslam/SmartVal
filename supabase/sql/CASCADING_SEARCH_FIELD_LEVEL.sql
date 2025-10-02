-- FIELD-LEVEL CASCADING SEARCH - EXACT USER REQUIREMENTS
-- Cascades WITHIN each field (word-by-word) and BETWEEN parameters
--
-- Field Cascading Examples:
-- - Part: "כנף אחורית שמאלית" → "כנף אחורית" → "כנף" → 0
-- - Make: "טויוטה יפן" → "טויוטה"
-- - Model: "COROLLA CROSS" → "COROLLA"
-- - Year: 2011 → 011 → 11
--
-- Returns Hebrew messages: "לא נמצא כנף אחורית שמאלית, מציג כנף אחורית"

CREATE OR REPLACE FUNCTION smart_parts_search_field_cascade(
    plate_param TEXT DEFAULT NULL,
    make_param TEXT DEFAULT NULL,
    model_param TEXT DEFAULT NULL,
    year_param TEXT DEFAULT NULL,
    part_param TEXT DEFAULT NULL,
    trim_param TEXT DEFAULT NULL,
    model_code_param TEXT DEFAULT NULL,
    limit_results INT DEFAULT 50
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
    front_rear TEXT,
    year_from INT,
    source TEXT,
    model_display TEXT,
    match_score INT,
    search_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    result_count INT := 0;
    where_parts TEXT[] := ARRAY[]::TEXT[];
    final_where TEXT;
    final_query TEXT;
    
    -- Field cascading variables
    make_terms TEXT[];
    model_terms TEXT[];
    part_terms TEXT[];
    year_formats TEXT[];
    
    current_message TEXT := '';
    ignored_terms TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- ============================================================================
    -- STEP 1: PLATE (always accept, never filter)
    -- ============================================================================
    
    -- Plate is informational only, doesn't filter results
    
    -- ============================================================================
    -- STEP 2: CASCADE MAKE FIELD
    -- ============================================================================
    
    IF make_param IS NOT NULL AND make_param != '' THEN
        make_terms := string_to_array(make_param, ' ');
        
        -- Try full make first
        where_parts := array_append(where_parts, 
            format('ci.make ILIKE %L', '%' || make_param || '%'));
        
        final_where := array_to_string(where_parts, ' AND ');
        final_query := 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || final_where;
        EXECUTE final_query INTO result_count;
        
        -- If no results, try each word separately
        IF result_count = 0 AND array_length(make_terms, 1) > 1 THEN
            where_parts := where_parts[1:array_length(where_parts,1)-1]; -- Remove last condition
            
            FOR i IN 1..array_length(make_terms, 1) LOOP
                where_parts := array_append(where_parts,
                    format('ci.make ILIKE %L', '%' || make_terms[i] || '%'));
                
                final_where := array_to_string(where_parts, ' AND ');
                final_query := 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || final_where;
                EXECUTE final_query INTO result_count;
                
                IF result_count > 0 THEN
                    ignored_terms := array_append(ignored_terms, array_to_string(make_terms[i+1:array_length(make_terms,1)], ' '));
                    current_message := 'נמצא יצרן: ' || make_terms[i];
                    EXIT;
                END IF;
                
                where_parts := where_parts[1:array_length(where_parts,1)-1];
            END LOOP;
        ELSE
            current_message := 'נמצא: ' || make_param;
        END IF;
        
        -- If still no results, make doesn't exist - return 0
        IF result_count = 0 THEN
            current_message := 'לא נמצא יצרן: ' || make_param;
            RETURN;
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 3: CASCADE MODEL FIELD
    -- ============================================================================
    
    IF model_param IS NOT NULL AND model_param != '' THEN
        model_terms := string_to_array(model_param, ' ');
        
        -- Try full model
        where_parts := array_append(where_parts,
            format('ci.model ILIKE %L', '%' || model_param || '%'));
        
        final_where := array_to_string(where_parts, ' AND ');
        final_query := 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || final_where;
        EXECUTE final_query INTO result_count;
        
        -- If no results, cascade word-by-word
        IF result_count = 0 AND array_length(model_terms, 1) > 1 THEN
            where_parts := where_parts[1:array_length(where_parts,1)-1];
            
            FOR i IN 1..array_length(model_terms, 1) LOOP
                where_parts := array_append(where_parts,
                    format('ci.model ILIKE %L', '%' || model_terms[i] || '%'));
                
                final_where := array_to_string(where_parts, ' AND ');
                final_query := 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || final_where;
                EXECUTE final_query INTO result_count;
                
                IF result_count > 0 THEN
                    ignored_terms := array_append(ignored_terms, array_to_string(model_terms[i+1:array_length(model_terms,1)], ' '));
                    current_message := current_message || ', לא נמצא ' || model_param || ', מציג ' || model_terms[i];
                    EXIT;
                END IF;
                
                where_parts := where_parts[1:array_length(where_parts,1)-1];
            END LOOP;
        END IF;
        
        -- If still no results with model, continue without it
        IF result_count = 0 THEN
            current_message := current_message || ', לא נמצא דגם: ' || model_param;
            -- Don't return, continue with make only
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 4: CASCADE YEAR FIELD (try all formats)
    -- ============================================================================
    
    IF year_param IS NOT NULL AND year_param != '' THEN
        -- Generate all year format variations
        IF length(year_param) = 4 THEN
            -- Input: 2011 → try 011, 11
            year_formats := ARRAY[
                year_param,
                substring(year_param from 2),  -- 011
                substring(year_param from 3)   -- 11
            ];
        ELSIF length(year_param) = 3 THEN
            -- Input: 011 → try 2011, 11
            year_formats := ARRAY[
                year_param,
                '2' || year_param,
                substring(year_param from 2)
            ];
        ELSE
            year_formats := ARRAY[year_param];
        END IF;
        
        -- Try each year format
        FOR i IN 1..array_length(year_formats, 1) LOOP
            where_parts := array_append(where_parts,
                format('(ci.year_from::TEXT ILIKE %L OR ci.extracted_year ILIKE %L OR ci.year_range ILIKE %L)',
                    '%' || year_formats[i] || '%', '%' || year_formats[i] || '%', '%' || year_formats[i] || '%'));
            
            final_where := array_to_string(where_parts, ' AND ');
            final_query := 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || final_where;
            EXECUTE final_query INTO result_count;
            
            IF result_count > 0 THEN
                IF i > 1 THEN
                    current_message := current_message || ', שנה: ' || year_formats[i] || ' (פורמט ' || year_param || ')';
                END IF;
                EXIT;
            END IF;
            
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END LOOP;
        
        -- If no year match, continue without year
        IF result_count = 0 THEN
            current_message := current_message || ', לא נמצאה שנה: ' || year_param;
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 5: CASCADE PART FIELD (word-by-word removal from end)
    -- ============================================================================
    
    IF part_param IS NOT NULL AND part_param != '' THEN
        part_terms := string_to_array(part_param, ' ');
        
        -- Try progressively shorter versions (remove last word each time)
        FOR i IN REVERSE array_length(part_terms, 1)..1 LOOP
            DECLARE
                current_part TEXT := array_to_string(part_terms[1:i], ' ');
            BEGIN
                where_parts := array_append(where_parts,
                    format('(ci.cat_num_desc ILIKE %L OR ci.part_name ILIKE %L OR ci.part_family ILIKE %L)',
                        '%' || current_part || '%', '%' || current_part || '%', '%' || current_part || '%'));
                
                final_where := array_to_string(where_parts, ' AND ');
                final_query := 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || final_where;
                EXECUTE final_query INTO result_count;
                
                IF result_count > 0 THEN
                    IF i < array_length(part_terms, 1) THEN
                        ignored_terms := array_append(ignored_terms, array_to_string(part_terms[i+1:array_length(part_terms,1)], ' '));
                        current_message := current_message || ', לא נמצא ' || part_param || ', מציג ' || current_part;
                    ELSE
                        current_message := current_message || ', חלק: ' || current_part;
                    END IF;
                    EXIT;
                END IF;
                
                where_parts := where_parts[1:array_length(where_parts,1)-1];
            END;
        END LOOP;
        
        -- If even first word not found, return 0
        IF result_count = 0 THEN
            current_message := 'לא נמצא: ' || part_terms[1];
            RETURN;
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 6: EXECUTE FINAL QUERY AND RETURN RESULTS
    -- ============================================================================
    
    final_where := array_to_string(where_parts, ' AND ');
    
    IF final_where = '' THEN
        current_message := 'לא הוזנו פרמטרים לחיפוש';
        RETURN;
    END IF;
    
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
            ci.part_family,
            ci.side_position,
            ci.front_rear,
            ci.year_from,
            ci.source,
            ci.model_display,
            10 as match_score,
            %L as search_message
        FROM catalog_items ci
        WHERE %s
        ORDER BY ci.price ASC
        LIMIT %s
    ', current_message, final_where, limit_results);
    
    RETURN QUERY EXECUTE final_query;
END;
$$;

-- Test field-level cascading
SELECT 
    search_message,
    make,
    model,
    cat_num_desc,
    price
FROM smart_parts_search_field_cascade(
    make_param := 'טויוטה יפן',
    model_param := 'COROLLA CROSS',
    year_param := '2011',
    part_param := 'כנף אחורית שמאלית'
)
LIMIT 5;
