-- TRUE CASCADING SEARCH SYSTEM
-- Implements proper field-level cascading with normalization and fallback logic
-- Based on user requirements: קורולה קרוס → קורולה, כנף אחורית שמאלית → כנף אחורית → כנף

SELECT '=== DEPLOYING TRUE CASCADING SEARCH ===' as section;

-- ============================================================================
-- DROP ALL EXISTING SEARCH FUNCTIONS
-- ============================================================================

DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT proname, pg_get_function_identity_arguments(oid) as args
        FROM pg_proc 
        WHERE proname IN ('cascading_parts_search', 'smart_parts_search', 'simple_parts_search', 'advanced_parts_search')
          AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.proname || '(' || func_record.args || ') CASCADE';
        RAISE NOTICE 'Dropped function: %(%)', func_record.proname, func_record.args;
    END LOOP;
END $$;

-- ============================================================================
-- MAIN TRUE CASCADING SEARCH FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION true_cascading_search(
    -- Car identification parameters
    plate_param TEXT DEFAULT NULL,
    make_param TEXT DEFAULT NULL,
    model_param TEXT DEFAULT NULL,
    year_param INTEGER DEFAULT NULL,
    trim_param TEXT DEFAULT NULL,
    model_code_param TEXT DEFAULT NULL,
    
    -- Optional car parameters
    engine_code_param TEXT DEFAULT NULL,
    engine_type_param TEXT DEFAULT NULL,
    vin_param TEXT DEFAULT NULL,
    
    -- Part search parameters
    part_name_param TEXT DEFAULT NULL,
    part_family_param TEXT DEFAULT NULL,
    
    -- Other filters
    source_param TEXT DEFAULT NULL,
    limit_results INTEGER DEFAULT 50
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
    part_name TEXT,
    side_position TEXT,
    front_rear TEXT,
    version_date TEXT,
    source TEXT,
    extracted_year TEXT,
    year_from INTEGER,
    year_to INTEGER,
    model_display TEXT,
    match_score INTEGER,
    cascade_level TEXT,
    search_message TEXT
) AS $$
DECLARE
    results_count INTEGER := 0;
    
    -- Normalized search terms
    normalized_make TEXT;
    normalized_model TEXT;
    normalized_year_str TEXT;
    normalized_part_name TEXT;
    
    -- Cascade tracking
    current_cascade_level TEXT;
    current_search_message TEXT;
    
    -- Dynamic query building
    base_query TEXT;
    car_conditions TEXT := '';
    part_conditions TEXT := '';
    full_where_clause TEXT;
BEGIN

    -- ========================================================================
    -- STEP 1: NORMALIZE INPUT PARAMETERS
    -- ========================================================================
    
    -- Initialize cascade tracking
    current_cascade_level := 'FULL_EXACT_MATCH';
    current_search_message := 'התאמה מדויקת מלאה';
    
    -- Normalize make: 'טויוטה יפן' → 'טויוטה'
    IF make_param IS NOT NULL AND make_param != '' THEN
        normalized_make := TRIM(REGEXP_REPLACE(make_param, '\s+(יפן|גרמניה|אמריקה|קוריאה|צרפת|איטליה|אנגליה|יפן)$', '', 'g'));
        IF normalized_make != make_param THEN
            current_cascade_level := 'MAKE_NORMALIZED';
            current_search_message := 'יצרן מנורמל: ' || normalized_make || ' (הוסר: ' || REPLACE(make_param, normalized_make, '') || ')';
        ELSE
            normalized_make := make_param;
        END IF;
    END IF;
    
    -- Normalize model: 'COROLLA CROSS' → 'COROLLA'
    IF model_param IS NOT NULL AND model_param != '' THEN
        normalized_model := SPLIT_PART(model_param, ' ', 1);
        IF normalized_model != model_param THEN
            current_cascade_level := 'MODEL_NORMALIZED';
            current_search_message := 'דגם מנורמל: ' || normalized_model || ' (הוסר: ' || REPLACE(model_param, normalized_model, '') || ')';
        ELSE
            normalized_model := model_param;
        END IF;
    END IF;
    
    -- Normalize year: 2011 → '2011', '011', '11'
    IF year_param IS NOT NULL THEN
        normalized_year_str := year_param::TEXT;
    END IF;
    
    -- Normalize part name: 'כנף אחורית שמאלית' → extract cascading levels
    IF part_name_param IS NOT NULL AND part_name_param != '' THEN
        normalized_part_name := part_name_param;
    END IF;

    -- ========================================================================
    -- STEP 2: CASCADE LEVEL 1 - FULL EXACT MATCH
    -- ========================================================================
    
    -- Build car conditions
    IF normalized_make IS NOT NULL THEN
        car_conditions := car_conditions || format('ci.make ILIKE %L', '%' || normalized_make || '%');
    END IF;
    
    IF normalized_model IS NOT NULL THEN
        IF car_conditions != '' THEN car_conditions := car_conditions || ' AND '; END IF;
        car_conditions := car_conditions || format('(ci.model ILIKE %L OR ci.model_display ILIKE %L)', 
            '%' || normalized_model || '%', '%' || normalized_model || '%');
    END IF;
    
    IF year_param IS NOT NULL THEN
        IF car_conditions != '' THEN car_conditions := car_conditions || ' AND '; END IF;
        car_conditions := car_conditions || format(
            '(ci.extracted_year = %L OR ci.extracted_year = %L OR ci.extracted_year = %L OR ' ||
            '(ci.year_from <= %L AND ci.year_to >= %L))',
            normalized_year_str,
            LPAD(RIGHT(normalized_year_str, 2), 3, '0'),  -- 2011 → 011
            RIGHT(normalized_year_str, 2),                -- 2011 → 11
            year_param, year_param
        );
    END IF;
    
    IF trim_param IS NOT NULL AND trim_param != '' THEN
        IF car_conditions != '' THEN car_conditions := car_conditions || ' AND '; END IF;
        car_conditions := car_conditions || format('ci.actual_trim ILIKE %L', '%' || trim_param || '%');
    END IF;
    
    IF model_code_param IS NOT NULL AND model_code_param != '' THEN
        IF car_conditions != '' THEN car_conditions := car_conditions || ' AND '; END IF;
        car_conditions := car_conditions || format('ci.model_code ILIKE %L', '%' || model_code_param || '%');
    END IF;
    
    -- Build part conditions
    IF normalized_part_name IS NOT NULL THEN
        part_conditions := format(
            '(ci.part_name ILIKE %L OR ci.cat_num_desc ILIKE %L OR ci.part_family ILIKE %L)',
            '%' || normalized_part_name || '%',
            '%' || normalized_part_name || '%',
            '%' || normalized_part_name || '%'
        );
    END IF;
    
    IF part_family_param IS NOT NULL AND part_family_param != '' THEN
        IF part_conditions != '' THEN part_conditions := part_conditions || ' AND '; END IF;
        part_conditions := part_conditions || format('ci.part_family ILIKE %L', '%' || part_family_param || '%');
    END IF;
    
    IF source_param IS NOT NULL AND source_param != '' THEN
        IF part_conditions != '' THEN part_conditions := part_conditions || ' AND '; END IF;
        part_conditions := part_conditions || format('ci.source ILIKE %L', '%' || source_param || '%');
    END IF;
    
    -- Combine all conditions
    full_where_clause := '';
    IF car_conditions != '' THEN
        full_where_clause := car_conditions;
    END IF;
    IF part_conditions != '' THEN
        IF full_where_clause != '' THEN
            full_where_clause := full_where_clause || ' AND ';
        END IF;
        full_where_clause := full_where_clause || part_conditions;
    END IF;
    
    -- Test this level
    IF full_where_clause != '' THEN
        EXECUTE format('SELECT COUNT(*) FROM catalog_items ci WHERE %s', full_where_clause) INTO results_count;
        
        IF results_count > 0 THEN
            -- Return results from this level
            RETURN QUERY EXECUTE format(
                'SELECT ci.id, ci.cat_num_desc, ci.supplier_name, ci.pcode, ci.price::NUMERIC,
                        ci.oem, ci.make, ci.model, COALESCE(ci.part_family, ''לא מוגדר''), ci.part_name,
                        ci.side_position, ci.front_rear, ci.version_date::TEXT,
                        ci.source, ci.extracted_year, ci.year_from, ci.year_to,
                        COALESCE(ci.model_display, ci.model, ''לא מוגדר''),
                        100 as match_score, %L as cascade_level, %L as search_message
                 FROM catalog_items ci 
                 WHERE %s
                 ORDER BY ci.price ASC NULLS LAST, ci.cat_num_desc
                 LIMIT %s',
                current_cascade_level, current_search_message, full_where_clause, limit_results
            );
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- STEP 3: CASCADE LEVEL 2 - REMOVE MODEL SPECIFICS
    -- ========================================================================
    
    IF model_param IS NOT NULL AND model_param != normalized_model THEN
        current_cascade_level := 'MODEL_FALLBACK';
        current_search_message := 'לא נמצא ' || model_param || ', מציג ' || normalized_model;
        
        -- Rebuild without full model name, use only first word
        car_conditions := '';
        IF normalized_make IS NOT NULL THEN
            car_conditions := format('ci.make ILIKE %L', '%' || normalized_make || '%');
        END IF;
        
        IF normalized_model IS NOT NULL THEN
            IF car_conditions != '' THEN car_conditions := car_conditions || ' AND '; END IF;
            car_conditions := car_conditions || format('ci.model ILIKE %L', '%' || normalized_model || '%');
        END IF;
        
        -- Add other car conditions back
        IF year_param IS NOT NULL THEN
            IF car_conditions != '' THEN car_conditions := car_conditions || ' AND '; END IF;
            car_conditions := car_conditions || format(
                '(ci.extracted_year = %L OR ci.extracted_year = %L OR ci.extracted_year = %L OR ' ||
                '(ci.year_from <= %L AND ci.year_to >= %L))',
                normalized_year_str, LPAD(RIGHT(normalized_year_str, 2), 3, '0'), RIGHT(normalized_year_str, 2),
                year_param, year_param
            );
        END IF;
        
        -- Combine with part conditions
        full_where_clause := car_conditions;
        IF part_conditions != '' THEN
            IF full_where_clause != '' THEN full_where_clause := full_where_clause || ' AND '; END IF;
            full_where_clause := full_where_clause || part_conditions;
        END IF;
        
        -- Test this level
        IF full_where_clause != '' THEN
            EXECUTE format('SELECT COUNT(*) FROM catalog_items ci WHERE %s', full_where_clause) INTO results_count;
            
            IF results_count > 0 THEN
                RETURN QUERY EXECUTE format(
                    'SELECT ci.id, ci.cat_num_desc, ci.supplier_name, ci.pcode, ci.price::NUMERIC,
                            ci.oem, ci.make, ci.model, COALESCE(ci.part_family, ''לא מוגדר''), ci.part_name,
                            ci.side_position, ci.front_rear, ci.version_date::TEXT,
                            ci.source, ci.extracted_year, ci.year_from, ci.year_to,
                            COALESCE(ci.model_display, ci.model, ''לא מוגדר''),
                            85 as match_score, %L as cascade_level, %L as search_message
                     FROM catalog_items ci 
                     WHERE %s
                     ORDER BY ci.price ASC NULLS LAST, ci.cat_num_desc
                     LIMIT %s',
                    current_cascade_level, current_search_message, full_where_clause, limit_results
                );
                RETURN;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- STEP 4: CASCADE LEVEL 3 - PART NAME CASCADING
    -- ========================================================================
    
    IF part_name_param IS NOT NULL AND LENGTH(part_name_param) > 3 THEN
        -- Try removing last word: 'כנף אחורית שמאלית' → 'כנף אחורית'
        DECLARE
            part_words TEXT[];
            cascaded_part_name TEXT;
        BEGIN
            part_words := string_to_array(part_name_param, ' ');
            
            -- If more than one word, try without the last word
            IF array_length(part_words, 1) > 1 THEN
                cascaded_part_name := array_to_string(part_words[1:array_length(part_words, 1)-1], ' ');
                
                current_cascade_level := 'PART_NAME_CASCADED';
                current_search_message := 'לא נמצא ' || part_name_param || ', מציג ' || cascaded_part_name;
                
                -- Rebuild part conditions with cascaded name
                part_conditions := format(
                    '(ci.part_name ILIKE %L OR ci.cat_num_desc ILIKE %L OR ci.part_family ILIKE %L)',
                    '%' || cascaded_part_name || '%',
                    '%' || cascaded_part_name || '%',
                    '%' || cascaded_part_name || '%'
                );
                
                -- Use simplified car conditions (just make)
                car_conditions := '';
                IF normalized_make IS NOT NULL THEN
                    car_conditions := format('ci.make ILIKE %L', '%' || normalized_make || '%');
                END IF;
                
                -- Combine conditions
                full_where_clause := '';
                IF car_conditions != '' THEN
                    full_where_clause := car_conditions;
                END IF;
                IF part_conditions != '' THEN
                    IF full_where_clause != '' THEN full_where_clause := full_where_clause || ' AND '; END IF;
                    full_where_clause := full_where_clause || part_conditions;
                END IF;
                
                -- Test this level
                IF full_where_clause != '' THEN
                    EXECUTE format('SELECT COUNT(*) FROM catalog_items ci WHERE %s', full_where_clause) INTO results_count;
                    
                    IF results_count > 0 THEN
                        RETURN QUERY EXECUTE format(
                            'SELECT ci.id, ci.cat_num_desc, ci.supplier_name, ci.pcode, ci.price::NUMERIC,
                                    ci.oem, ci.make, ci.model, COALESCE(ci.part_family, ''לא מוגדר''), ci.part_name,
                                    ci.side_position, ci.front_rear, ci.version_date::TEXT,
                                    ci.source, ci.extracted_year, ci.year_from, ci.year_to,
                                    COALESCE(ci.model_display, ci.model, ''לא מוגדר''),
                                    70 as match_score, %L as cascade_level, %L as search_message
                             FROM catalog_items ci 
                             WHERE %s
                             ORDER BY ci.price ASC NULLS LAST, ci.cat_num_desc
                             LIMIT %s',
                            current_cascade_level, current_search_message, full_where_clause, limit_results
                        );
                        RETURN;
                    END IF;
                END IF;
            END IF;
        END;
    END IF;

    -- ========================================================================
    -- STEP 5: CASCADE LEVEL 4 - CORE TERM ONLY
    -- ========================================================================
    
    IF part_name_param IS NOT NULL THEN
        -- Extract core term (first word): 'כנף אחורית שמאלית' → 'כנף'
        DECLARE
            core_term TEXT;
        BEGIN
            core_term := SPLIT_PART(part_name_param, ' ', 1);
            
            IF LENGTH(core_term) >= 2 THEN
                current_cascade_level := 'CORE_TERM_ONLY';
                current_search_message := 'לא נמצא ' || part_name_param || ', מציג חלקים עם: ' || core_term;
                
                -- Simple core term search
                part_conditions := format(
                    '(ci.part_name ILIKE %L OR ci.cat_num_desc ILIKE %L)',
                    '%' || core_term || '%', '%' || core_term || '%'
                );
                
                -- Use only make filter if available
                car_conditions := '';
                IF normalized_make IS NOT NULL THEN
                    car_conditions := format('ci.make ILIKE %L', '%' || normalized_make || '%');
                END IF;
                
                -- Combine conditions
                full_where_clause := part_conditions;
                IF car_conditions != '' THEN
                    full_where_clause := car_conditions || ' AND ' || part_conditions;
                END IF;
                
                -- Test this level
                EXECUTE format('SELECT COUNT(*) FROM catalog_items ci WHERE %s', full_where_clause) INTO results_count;
                
                IF results_count > 0 THEN
                    RETURN QUERY EXECUTE format(
                        'SELECT ci.id, ci.cat_num_desc, ci.supplier_name, ci.pcode, ci.price::NUMERIC,
                                ci.oem, ci.make, ci.model, COALESCE(ci.part_family, ''לא מוגדר''), ci.part_name,
                                ci.side_position, ci.front_rear, ci.version_date::TEXT,
                                ci.source, ci.extracted_year, ci.year_from, ci.year_to,
                                COALESCE(ci.model_display, ci.model, ''לא מוגדר''),
                                50 as match_score, %L as cascade_level, %L as search_message
                         FROM catalog_items ci 
                         WHERE %s
                         ORDER BY ci.price ASC NULLS LAST, ci.cat_num_desc
                         LIMIT %s',
                        current_cascade_level, current_search_message, full_where_clause, limit_results
                    );
                    RETURN;
                END IF;
            END IF;
        END;
    END IF;

    -- ========================================================================
    -- STEP 6: NO RESULTS
    -- ========================================================================
    
    current_cascade_level := 'NO_RESULTS';
    current_search_message := 'לא נמצאו תוצאות התואמות לקריטריוני החיפוש';
    
    RETURN QUERY SELECT 
        NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, NULL::TEXT,
        NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
        NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::INTEGER, NULL::INTEGER, NULL::TEXT,
        0::INTEGER, current_cascade_level, current_search_message
    LIMIT 0;

END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMPATIBILITY WRAPPER FUNCTIONS
-- ============================================================================

-- Simple search wrapper (maintains compatibility)
CREATE OR REPLACE FUNCTION simple_parts_search(
    search_make TEXT DEFAULT NULL,
    search_part_name TEXT DEFAULT NULL,
    search_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID, cat_num_desc TEXT, supplier_name TEXT, pcode TEXT, price NUMERIC,
    oem TEXT, make TEXT, model TEXT, part_family TEXT, part_name TEXT,
    side_position TEXT, front_rear TEXT, version_date TEXT, source TEXT,
    extracted_year TEXT, year_from INTEGER, year_to INTEGER, model_display TEXT,
    match_score INTEGER, cascade_level TEXT, search_message TEXT
) AS $$
BEGIN
    RETURN QUERY SELECT * FROM true_cascading_search(
        make_param := search_make,
        part_name_param := search_part_name,
        limit_results := search_limit
    );
END;
$$ LANGUAGE plpgsql;

-- Advanced search wrapper (maintains compatibility)
CREATE OR REPLACE FUNCTION advanced_parts_search(
    search_make TEXT DEFAULT NULL,
    search_model TEXT DEFAULT NULL,
    search_year INTEGER DEFAULT NULL,
    search_trim TEXT DEFAULT NULL,
    search_model_code TEXT DEFAULT NULL,
    search_part_family TEXT DEFAULT NULL,
    search_part_name TEXT DEFAULT NULL,
    search_source TEXT DEFAULT NULL,
    search_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID, cat_num_desc TEXT, supplier_name TEXT, pcode TEXT, price NUMERIC,
    oem TEXT, make TEXT, model TEXT, part_family TEXT, part_name TEXT,
    side_position TEXT, front_rear TEXT, version_date TEXT, source TEXT,
    extracted_year TEXT, year_from INTEGER, year_to INTEGER, model_display TEXT,
    match_score INTEGER, cascade_level TEXT, search_message TEXT
) AS $$
BEGIN
    RETURN QUERY SELECT * FROM true_cascading_search(
        make_param := search_make,
        model_param := search_model,
        year_param := search_year,
        trim_param := search_trim,
        model_code_param := search_model_code,
        part_name_param := search_part_name,
        part_family_param := search_part_family,
        source_param := search_source,
        limit_results := search_limit
    );
END;
$$ LANGUAGE plpgsql;

-- Backward compatible smart_parts_search wrapper
CREATE OR REPLACE FUNCTION smart_parts_search(
    make_param TEXT DEFAULT NULL,
    model_param TEXT DEFAULT NULL,
    free_query_param TEXT DEFAULT NULL,
    part_param TEXT DEFAULT NULL,
    oem_param TEXT DEFAULT NULL,
    family_param TEXT DEFAULT NULL,
    limit_results INTEGER DEFAULT 50,
    car_plate TEXT DEFAULT NULL,
    engine_code_param TEXT DEFAULT NULL,
    engine_type_param TEXT DEFAULT NULL,
    engine_volume_param TEXT DEFAULT NULL,
    model_code_param TEXT DEFAULT NULL,
    quantity_param INTEGER DEFAULT NULL,
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
    source TEXT,
    extracted_year TEXT,
    model_display TEXT,
    match_score INTEGER
) AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        t.id, t.cat_num_desc, t.supplier_name, t.pcode, t.price,
        t.oem, t.make, t.model, t.part_family, t.side_position,
        t.version_date, t.source, t.extracted_year, t.model_display, t.match_score
    FROM true_cascading_search(
        plate_param := car_plate,
        make_param := make_param,
        model_param := model_param,
        year_param := CASE WHEN year_param IS NOT NULL THEN year_param::INTEGER ELSE NULL END,
        trim_param := trim_param,
        model_code_param := model_code_param,
        engine_code_param := engine_code_param,
        engine_type_param := engine_type_param,
        vin_param := vin_number_param,
        part_name_param := COALESCE(part_param, free_query_param),
        part_family_param := family_param,
        source_param := source_param,
        limit_results := limit_results
    ) t;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TEST THE NEW CASCADING SYSTEM
-- ============================================================================

SELECT '=== TESTING TRUE CASCADING SEARCH ===' as section;

-- Test 1: Full model name cascading
SELECT 
    'Test 1 - Model Cascading (קורולה קרוס → קורולה):' as test_name,
    cascade_level, search_message, COUNT(*) as results
FROM true_cascading_search(
    make_param := 'טויוטה',
    model_param := 'COROLLA CROSS',
    part_name_param := 'כנף',
    limit_results := 10
)
GROUP BY cascade_level, search_message;

-- Test 2: Part name cascading
SELECT 
    'Test 2 - Part Cascading (כנף אחורית שמאלית → כנף):' as test_name,
    cascade_level, search_message, COUNT(*) as results
FROM true_cascading_search(
    make_param := 'טויוטה',
    part_name_param := 'כנף אחורית שמאלית',
    limit_results := 10
)
GROUP BY cascade_level, search_message;

-- Test 3: Year normalization
SELECT 
    'Test 3 - Year Normalization (2011 → 011, 11):' as test_name,
    cascade_level, search_message, COUNT(*) as results
FROM true_cascading_search(
    make_param := 'טויוטה',
    year_param := 2011,
    part_name_param := 'כנף',
    limit_results := 10
)
GROUP BY cascade_level, search_message;

-- Test 4: Make normalization
SELECT 
    'Test 4 - Make Normalization (טויוטה יפן → טויוטה):' as test_name,
    cascade_level, search_message, COUNT(*) as results
FROM true_cascading_search(
    make_param := 'טויוטה יפן',
    part_name_param := 'כנף',
    limit_results := 10
)
GROUP BY cascade_level, search_message;

SELECT '=== TRUE CASCADING SEARCH DEPLOYMENT COMPLETE ===' as section;

DO $$
BEGIN
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'TRUE CASCADING SEARCH DEPLOYED SUCCESSFULLY';
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'NEW FEATURES:';
    RAISE NOTICE '✅ Field-level cascading: קורולה קרוס → קורולה';
    RAISE NOTICE '✅ Part name cascading: כנף אחורית שמאלית → כנף אחורית → כנף';
    RAISE NOTICE '✅ Year normalization: 2011 → 011 → 11';
    RAISE NOTICE '✅ Make normalization: טויוטה יפן → טויוטה';
    RAISE NOTICE '✅ Descriptive Hebrew messages for each cascade level';
    RAISE NOTICE '✅ Backward compatibility with all existing UI calls';
    RAISE NOTICE '✅ Progressive fallback with appropriate match scores';
    RAISE NOTICE '===============================================';
END $$;