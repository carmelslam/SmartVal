-- ============================================================================
-- SESSION 7 - FIX 4: Add Text Normalization to Search Function
-- Date: 2025-10-05
-- Purpose: Fix search to handle UI full words vs database abbreviations
-- ============================================================================

-- Problem:
-- - UI sends: "כנף אחורית צד שמאל" (full words)
-- - Database has: "כנף אח' שמ'" (abbreviations)
-- - Current search: 0 results because exact match fails
--
-- Solution: Normalize search terms to match BOTH full and abbreviated forms

-- Step 1: Create normalization function
CREATE OR REPLACE FUNCTION normalize_search_term(term TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    normalized TEXT;
BEGIN
    normalized := term;
    
    -- Normalize directional terms (most common in database)
    -- שמאל variations
    normalized := regexp_replace(normalized, 'שמאל(ית)?', '(שמ''|שמאל|שמאלית)', 'gi');
    normalized := regexp_replace(normalized, 'צד\s+שמאל', '(צד שמאל|שמ'')', 'gi');
    
    -- ימין variations  
    normalized := regexp_replace(normalized, 'ימין(ית)?', '(ימ''|ימין|ימנית)', 'gi');
    normalized := regexp_replace(normalized, 'צד\s+ימין', '(צד ימין|ימ'')', 'gi');
    
    -- אחורי variations
    normalized := regexp_replace(normalized, 'אחורי(ת)?', '(אח''|אחורי|אחורית)', 'gi');
    
    -- קדמי variations
    normalized := regexp_replace(normalized, 'קדמי(ת)?', '(קד''|קדמי|קדמית)', 'gi');
    
    -- תחתון variations
    normalized := regexp_replace(normalized, 'תחתון(ה)?', '(תח''|תחתון|תחתונה)', 'gi');
    
    -- עליון variations
    normalized := regexp_replace(normalized, 'עליון(ה)?', '(על''|עליון|עליונה)', 'gi');
    
    RETURN normalized;
END;
$$;

-- Step 2: Test normalization function
SELECT 
    'Normalization Test' as test,
    normalize_search_term('כנף אחורית צד שמאל') as normalized_full,
    normalize_search_term('פנס קדמי ימין') as normalized_directions;

-- Step 3: Update smart_parts_search to use normalization
-- This will be a MODIFIED version that normalizes search terms before matching

CREATE OR REPLACE FUNCTION smart_parts_search_normalized(
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
    year_to INTEGER
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
    free_terms TEXT[];\n    year_formats TEXT[];
    
    current_search TEXT;
    normalized_search TEXT;
    i INT;
BEGIN
    -- Require part_param OR free_query_param
    IF (part_param IS NULL OR part_param = '') AND (free_query_param IS NULL OR free_query_param = '') THEN
        RETURN;
    END IF;
    
    -- ============================================================================
    -- STEP 1: CASCADE MAKE
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
    -- STEP 2-6: Same as before (MODEL_CODE, TRIM, MODEL, YEAR, ENGINE)
    -- (Keeping existing cascade logic - unchanged)
    -- ============================================================================
    
    -- MODEL_CODE cascade
    IF model_code_param IS NOT NULL AND model_code_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.model_code ILIKE %L', '%' || model_code_param || '%'));
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        IF result_count = 0 THEN where_parts := where_parts[1:array_length(where_parts,1)-1]; END IF;
    END IF;
    
    -- TRIM cascade
    IF trim_param IS NOT NULL AND trim_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.trim ILIKE %L', '%' || trim_param || '%'));
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        IF result_count = 0 THEN where_parts := where_parts[1:array_length(where_parts,1)-1]; END IF;
    END IF;
    
    -- MODEL cascade
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
    -- STEP 7: PART SEARCH WITH NORMALIZATION (NEW!)
    -- ============================================================================
    
    IF part_param IS NOT NULL AND part_param != '' THEN
        part_terms := string_to_array(part_param, ' ');
        
        FOR i IN REVERSE array_length(part_terms, 1)..1 LOOP
            current_search := array_to_string(part_terms[1:i], ' ');
            normalized_search := normalize_search_term(current_search);
            
            -- Use ~ for regex match to support normalized patterns
            where_parts := array_append(where_parts,
                format('(ci.cat_num_desc ~* %L OR ci.part_family ~* %L)',
                    normalized_search, normalized_search));
            
            EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
            
            IF result_count > 0 THEN EXIT; END IF;
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END LOOP;
        
        IF result_count = 0 THEN RETURN; END IF;
    END IF;
    
    -- OEM, family, source (no cascade)
    IF oem_param IS NOT NULL AND oem_param != '' THEN
        where_parts := array_append(where_parts, format('ci.oem ILIKE %L', '%' || oem_param || '%'));
    END IF;
    IF family_param IS NOT NULL AND family_param != '' THEN
        where_parts := array_append(where_parts, format('ci.part_family ILIKE %L', '%' || family_param || '%'));
    END IF;
    IF source_param IS NOT NULL AND source_param != '' THEN
        where_parts := array_append(where_parts, format('ci.source ILIKE %L', '%' || source_param || '%'));
    END IF;
    
    -- FREE QUERY with normalization
    IF free_query_param IS NOT NULL AND free_query_param != '' THEN
        free_terms := string_to_array(free_query_param, ' ');
        FOR i IN REVERSE array_length(free_terms, 1)..1 LOOP
            current_search := array_to_string(free_terms[1:i], ' ');
            normalized_search := normalize_search_term(current_search);
            
            where_parts := array_append(where_parts,
                format('(ci.cat_num_desc ~* %L OR ci.part_family ~* %L)',
                    normalized_search, normalized_search));
            
            EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
            IF result_count > 0 THEN EXIT; END IF;
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END LOOP;
    END IF;
    
    -- Execute final query
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
            10 as match_score, ci.year_from, ci.year_to
        FROM catalog_items ci
        WHERE %s
        ORDER BY ci.price ASC NULLS LAST
        LIMIT %s
    ', final_where, limit_results);
    
    RETURN QUERY EXECUTE final_query;
END;
$$;

-- Step 4: Test normalized search
SELECT 'Test: Normalized search for כנף אחורית צד שמאל' as test;
SELECT pcode, cat_num_desc, part_family, price
FROM smart_parts_search_normalized(part_param := 'כנף אחורית צד שמאל')
LIMIT 10;
