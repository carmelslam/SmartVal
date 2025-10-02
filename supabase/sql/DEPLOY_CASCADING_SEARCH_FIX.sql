-- REPLACE smart_parts_search WITH FIELD-LEVEL CASCADING VERSION
-- Fixes:
-- 1. Description reversed (don't apply reverse() in search)
-- 2. Wrong source (return actual source column, not 'מקורי')
-- 3. No cascading (implement field-level cascading)

-- Drop ALL versions of old search function (multiple signatures exist)
DROP FUNCTION IF EXISTS smart_parts_search() CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;

-- Create new cascading search with same signature as old function
-- (so UI doesn't need changes)
CREATE OR REPLACE FUNCTION smart_parts_search(
    make_param TEXT DEFAULT NULL,
    model_param TEXT DEFAULT NULL,
    part_param TEXT DEFAULT NULL,
    oem_param TEXT DEFAULT NULL,
    family_param TEXT DEFAULT NULL,
    free_query_param TEXT DEFAULT NULL,
    model_code_param TEXT DEFAULT NULL,
    year_param TEXT DEFAULT NULL,
    engine_code_param TEXT DEFAULT NULL,
    trim_param TEXT DEFAULT NULL,
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
    version_date TEXT,
    source TEXT,
    extracted_year TEXT,
    model_display TEXT,
    match_score INT
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
    
    current_part_search TEXT;
BEGIN
    -- ============================================================================
    -- STEP 1: CASCADE MAKE FIELD (טויוטה יפן → טויוטה)
    -- ============================================================================
    
    IF make_param IS NOT NULL AND make_param != '' THEN
        make_terms := string_to_array(make_param, ' ');
        
        -- Try each word from make (most words to least)
        FOR i IN REVERSE array_length(make_terms, 1)..1 LOOP
            DECLARE
                current_make TEXT := array_to_string(make_terms[1:i], ' ');
            BEGIN
                IF current_make != '' THEN
                    where_parts := array_append(where_parts,
                        format('ci.make ILIKE %L', '%' || current_make || '%'));
                    
                    final_where := array_to_string(where_parts, ' AND ');
                    final_query := 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || final_where;
                    EXECUTE final_query INTO result_count;
                    
                    IF result_count > 0 THEN
                        EXIT; -- Found results with this make variation
                    END IF;
                    
                    where_parts := where_parts[1:array_length(where_parts,1)-1];
                END IF;
            END;
        END LOOP;
        
        -- If no make found at all, return empty
        IF result_count = 0 THEN
            RETURN;
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 2: CASCADE MODEL FIELD (COROLLA CROSS → COROLLA)
    -- ============================================================================
    
    IF model_param IS NOT NULL AND model_param != '' THEN
        model_terms := string_to_array(model_param, ' ');
        
        -- Try progressively shorter model names
        FOR i IN REVERSE array_length(model_terms, 1)..1 LOOP
            DECLARE
                current_model TEXT := array_to_string(model_terms[1:i], ' ');
            BEGIN
                IF current_model != '' THEN
                    where_parts := array_append(where_parts,
                        format('ci.model ILIKE %L', '%' || current_model || '%'));
                    
                    final_where := array_to_string(where_parts, ' AND ');
                    final_query := 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || final_where;
                    EXECUTE final_query INTO result_count;
                    
                    IF result_count > 0 THEN
                        EXIT;
                    END IF;
                    
                    where_parts := where_parts[1:array_length(where_parts,1)-1];
                END IF;
            END;
        END LOOP;
        
        -- If no model found, continue without model (don't fail)
    END IF;
    
    -- ============================================================================
    -- STEP 3: CASCADE YEAR FIELD (2011 → 011 → 11)
    -- ============================================================================
    
    IF year_param IS NOT NULL AND year_param != '' THEN
        -- Generate year format variations
        IF length(year_param) = 4 THEN
            year_formats := ARRAY[
                year_param,
                substring(year_param from 2),  -- 011
                substring(year_param from 3)   -- 11
            ];
        ELSIF length(year_param) = 3 THEN
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
                format('(ci.year_from::TEXT ILIKE %L OR ci.extracted_year ILIKE %L)',
                    '%' || year_formats[i] || '%', '%' || year_formats[i] || '%'));
            
            final_where := array_to_string(where_parts, ' AND ');
            final_query := 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || final_where;
            EXECUTE final_query INTO result_count;
            
            IF result_count > 0 THEN
                EXIT;
            END IF;
            
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END LOOP;
        
        -- If no year match, continue without year
    END IF;
    
    -- ============================================================================
    -- STEP 4: CASCADE PART FIELD (כנף אחורית שמאלית → כנף אחורית → כנף)
    -- ============================================================================
    
    IF part_param IS NOT NULL AND part_param != '' THEN
        part_terms := string_to_array(part_param, ' ');
        
        -- Try progressively shorter part names (remove from end)
        FOR i IN REVERSE array_length(part_terms, 1)..1 LOOP
            current_part_search := array_to_string(part_terms[1:i], ' ');
            
            IF current_part_search != '' THEN
                where_parts := array_append(where_parts,
                    format('(ci.cat_num_desc ILIKE %L OR ci.part_name ILIKE %L OR ci.part_family ILIKE %L)',
                        '%' || current_part_search || '%', '%' || current_part_search || '%', '%' || current_part_search || '%'));
                
                final_where := array_to_string(where_parts, ' AND ');
                final_query := 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || final_where;
                EXECUTE final_query INTO result_count;
                
                IF result_count > 0 THEN
                    EXIT;
                END IF;
                
                where_parts := where_parts[1:array_length(where_parts,1)-1];
            END IF;
        END LOOP;
        
        -- If no part found, return empty
        IF result_count = 0 AND part_param IS NOT NULL THEN
            RETURN;
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 5: ADD OTHER FILTERS (OEM, family, free_query)
    -- ============================================================================
    
    IF oem_param IS NOT NULL AND oem_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.oem ILIKE %L', '%' || oem_param || '%'));
    END IF;
    
    IF family_param IS NOT NULL AND family_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.part_family ILIKE %L', '%' || family_param || '%'));
    END IF;
    
    IF free_query_param IS NOT NULL AND free_query_param != '' THEN
        where_parts := array_append(where_parts,
            format('(ci.cat_num_desc ILIKE %L OR ci.part_name ILIKE %L)',
                '%' || free_query_param || '%', '%' || free_query_param || '%'));
    END IF;
    
    -- ============================================================================
    -- STEP 6: EXECUTE FINAL QUERY
    -- ============================================================================
    
    final_where := array_to_string(where_parts, ' AND ');
    
    IF final_where = '' THEN
        final_where := 'TRUE'; -- No filters, return all
    END IF;
    
    final_query := format('
        SELECT 
            ci.id,
            ci.cat_num_desc,  -- DO NOT reverse (already correct in DB)
            ci.supplier_name,
            ci.pcode,
            ci.price::NUMERIC,
            ci.oem,
            ci.make,
            ci.model,
            COALESCE(ci.part_family, ''לא מוגדר'') as part_family,
            ci.side_position,
            ci.version_date::TEXT,
            COALESCE(ci.source, ''חליפי'') as source,  -- Return actual source, default to חליפי
            ci.extracted_year,
            ci.model_display,
            10 as match_score
        FROM catalog_items ci
        WHERE %s
        ORDER BY ci.price ASC NULLS LAST
        LIMIT %s
    ', final_where, limit_results);
    
    RETURN QUERY EXECUTE final_query;
END;
$$;

-- Test the fixed search (run separately after deployment)
-- SELECT make, model, cat_num_desc, source, part_family, price
-- FROM smart_parts_search(make_param := 'טויוטה', model_param := 'קורולה', part_param := 'כנף')
-- LIMIT 5;
