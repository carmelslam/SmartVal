-- RESTORE WORKING SEARCH - Emergency Revert
-- Going back to the working FINAL_CASCADING_SEARCH.sql with just the column fixes

SELECT '=== RESTORING WORKING SEARCH FUNCTION ===' as section;

-- ============================================================================
-- DROP THE BROKEN true_cascading_search
-- ============================================================================

DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT proname, pg_get_function_identity_arguments(oid) as args
        FROM pg_proc 
        WHERE proname IN ('true_cascading_search', 'cascading_parts_search', 'simple_parts_search', 'advanced_parts_search', 'smart_parts_search')
          AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.proname || '(' || func_record.args || ') CASCADE';
        RAISE NOTICE 'Dropped function: %(%)', func_record.proname, func_record.args;
    END LOOP;
END $$;

-- ============================================================================
-- RESTORE THE WORKING CASCADING SEARCH FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION cascading_parts_search(
    -- Car identification parameters (cascade priority order)
    make_param TEXT DEFAULT NULL,
    model_param TEXT DEFAULT NULL,
    year_from_param INTEGER DEFAULT NULL,
    year_to_param INTEGER DEFAULT NULL,
    actual_trim_param TEXT DEFAULT NULL,
    model_code_param TEXT DEFAULT NULL,
    
    -- Optional car parameters (ignore if empty)
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
    source TEXT,        -- Return source instead of availability
    extracted_year TEXT,
    year_from INTEGER,
    year_to INTEGER,
    model_display TEXT,
    match_score INTEGER,
    fallback_level TEXT,
    search_message TEXT
) AS $$
DECLARE
    results_count INTEGER;
    current_level TEXT;
    search_message TEXT;
    base_query TEXT;
    car_filters TEXT := '';
    part_filters TEXT := '';
    full_query TEXT;
    actual_make TEXT;
    actual_model TEXT;
    actual_year_str TEXT;
BEGIN
    
    -- ========================================================================
    -- STEP 1: MAKE NORMALIZATION AND FALLBACK
    -- ========================================================================
    
    actual_make := make_param;
    current_level := 'EXACT_MATCH';
    search_message := 'חיפוש מדויק';
    
    -- Handle make fallback: 'טויוטה יפן' → 'טויוטה'
    IF make_param IS NOT NULL AND make_param != '' THEN
        -- First try exact match
        SELECT COUNT(*) INTO results_count 
        FROM catalog_items ci
        WHERE ci.make = make_param;
        
        IF results_count = 0 THEN
            -- Try removing country suffix (יפן, גרמניה, etc.)
            actual_make := TRIM(REGEXP_REPLACE(make_param, '\s+(יפן|גרמניה|אמריקה|קוריאה|צרפת|איטליה)$', '', 'g'));
            
            -- Check if fallback make exists
            SELECT COUNT(*) INTO results_count 
            FROM catalog_items ci
            WHERE ci.make = actual_make;
            
            IF results_count > 0 THEN
                current_level := 'MAKE_FALLBACK';
                search_message := 'נמצא יצרן: ' || actual_make || ' (ללא מדינה)';
            ELSE
                current_level := 'NO_MAKE';
                search_message := 'יצרן לא נמצא: ' || make_param;
                actual_make := NULL;
            END IF;
        END IF;
    END IF;
    
    -- ========================================================================
    -- STEP 2: MODEL NORMALIZATION
    -- ========================================================================
    
    actual_model := model_param;
    
    -- Handle model fallback: 'COROLLA CROSS' → partial match
    IF model_param IS NOT NULL AND model_param != '' AND actual_make IS NOT NULL THEN
        SELECT COUNT(*) INTO results_count 
        FROM catalog_items ci
        WHERE ci.make = actual_make AND ci.model = model_param;
        
        IF results_count = 0 THEN
            -- Try partial model match (first word)
            actual_model := SPLIT_PART(model_param, ' ', 1);
            
            SELECT COUNT(*) INTO results_count 
            FROM catalog_items ci
            WHERE ci.make = actual_make AND ci.model ILIKE '%' || actual_model || '%';
            
            IF results_count = 0 THEN
                current_level := 'MODEL_FALLBACK_TO_MAKE';
                search_message := 'דגם לא נמצא (' || model_param || '), מציג יצרן: ' || actual_make;
                actual_model := NULL;
            ELSE
                current_level := 'MODEL_PARTIAL';
                search_message := 'נמצא דגם חלקי: ' || actual_model;
            END IF;
        END IF;
    END IF;
    
    -- ========================================================================
    -- STEP 3: YEAR FORMAT NORMALIZATION
    -- ========================================================================
    
    IF year_from_param IS NOT NULL THEN
        actual_year_str := year_from_param::TEXT;
    END IF;
    
    -- ========================================================================
    -- BUILD AND EXECUTE QUERY
    -- ========================================================================
    
    car_filters := '';
    
    -- Build car filters in cascade order
    IF actual_make IS NOT NULL THEN
        car_filters := format('ci.make = %L', actual_make);
        
        IF actual_model IS NOT NULL THEN
            car_filters := car_filters || format(' AND (ci.model ILIKE %L OR ci.model_display ILIKE %L)', 
                '%' || actual_model || '%', '%' || actual_model || '%');
            
            IF year_from_param IS NOT NULL THEN
                -- Use flexible year matching (2022/022/22)
                car_filters := car_filters || format(' AND (ci.extracted_year = %L OR ci.extracted_year = %L OR ci.extracted_year = %L OR (ci.year_from <= %L AND ci.year_to >= %L))', 
                    actual_year_str,
                    LPAD(RIGHT(actual_year_str, 2), 3, '0'),  -- 2022 → 022
                    RIGHT(actual_year_str, 2),                -- 2022 → 22
                    year_from_param, year_from_param);
                
                IF actual_trim_param IS NOT NULL AND actual_trim_param != '' THEN
                    car_filters := car_filters || format(' AND ci.actual_trim ILIKE %L', 
                        '%' || actual_trim_param || '%');
                    
                    IF model_code_param IS NOT NULL AND model_code_param != '' THEN
                        car_filters := car_filters || format(' AND ci.model_code ILIKE %L', 
                            '%' || model_code_param || '%');
                    END IF;
                END IF;
            END IF;
        END IF;
    END IF;
    
    -- Build part filters with variant support
    part_filters := '';
    IF part_name_param IS NOT NULL AND part_name_param != '' THEN
        -- Search in multiple fields for part name
        part_filters := format(
            '(ci.part_name ILIKE %L OR ci.cat_num_desc ILIKE %L OR ci.part_family ILIKE %L)',
            '%' || part_name_param || '%',
            '%' || part_name_param || '%',
            '%' || part_name_param || '%'
        );
    END IF;
    
    IF part_family_param IS NOT NULL AND part_family_param != '' THEN
        IF part_filters != '' THEN
            part_filters := part_filters || ' AND ';
        END IF;
        part_filters := part_filters || format('ci.part_family ILIKE %L', '%' || part_family_param || '%');
    END IF;
    
    -- Source filter
    IF source_param IS NOT NULL AND source_param != '' THEN
        IF part_filters != '' THEN
            part_filters := part_filters || ' AND ';
        END IF;
        part_filters := part_filters || format('ci.source ILIKE %L', '%' || source_param || '%');
    END IF;
    
    -- Combine filters
    full_query := 'SELECT COUNT(*) FROM catalog_items ci WHERE ';
    IF car_filters != '' THEN
        full_query := full_query || car_filters;
        IF part_filters != '' THEN
            full_query := full_query || ' AND ' || part_filters;
        END IF;
    ELSIF part_filters != '' THEN
        full_query := full_query || part_filters;
    ELSE
        full_query := 'SELECT 0';  -- No filters = no search
    END IF;
    
    -- Check if we have results
    EXECUTE full_query INTO results_count;
    
    IF results_count > 0 THEN
        -- Return results
        RETURN QUERY EXECUTE format(
            'SELECT ci.id, ci.cat_num_desc, ci.supplier_name, ci.pcode, ci.price::NUMERIC,
                    ci.oem, ci.make, ci.model, COALESCE(ci.part_family, ''לא מוגדר''), ci.part_name,
                    ci.side_position, ci.front_rear, ci.version_date::TEXT, 
                    ci.source, ci.extracted_year, ci.year_from, ci.year_to,
                    COALESCE(ci.model_display, ci.model, ''לא מוגדר''),
                    100 as match_score,
                    %L as fallback_level,
                    %L as search_message
             FROM catalog_items ci 
             WHERE %s
             ORDER BY ci.price ASC NULLS LAST, ci.cat_num_desc
             LIMIT %s',
            current_level, search_message,
            CASE WHEN car_filters != '' AND part_filters != '' THEN car_filters || ' AND ' || part_filters
                 WHEN car_filters != '' THEN car_filters
                 ELSE part_filters END,
            limit_results
        );
        RETURN;
    END IF;
    
    -- NO RESULTS
    current_level := 'NO_RESULTS';
    search_message := 'לא נמצאו תוצאות התואמות לקריטריוני החיפוש';
    
    RETURN QUERY SELECT 
        NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, NULL::TEXT,
        NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
        NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::INTEGER, NULL::INTEGER, NULL::TEXT,
        0::INTEGER, current_level, search_message
    LIMIT 0;  -- Return empty result set
    
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RESTORE WRAPPER FUNCTIONS
-- ============================================================================

-- Simple search wrapper
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
    match_score INTEGER, fallback_level TEXT, search_message TEXT
) AS $$
BEGIN
    RETURN QUERY SELECT * FROM cascading_parts_search(
        make_param := search_make,
        part_name_param := search_part_name,
        limit_results := search_limit
    );
END;
$$ LANGUAGE plpgsql;

-- Advanced search wrapper
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
    match_score INTEGER, fallback_level TEXT, search_message TEXT
) AS $$
BEGIN
    RETURN QUERY SELECT * FROM cascading_parts_search(
        make_param := search_make,
        model_param := search_model,
        year_from_param := search_year,
        actual_trim_param := search_trim,
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
        c.id, c.cat_num_desc, c.supplier_name, c.pcode, c.price,
        c.oem, c.make, c.model, c.part_family, c.side_position,
        c.version_date, c.source, c.extracted_year, c.model_display, c.match_score
    FROM cascading_parts_search(
        make_param := make_param,
        model_param := model_param,
        year_from_param := CASE WHEN year_param IS NOT NULL THEN year_param::INTEGER ELSE NULL END,
        actual_trim_param := trim_param,
        model_code_param := model_code_param,
        engine_code_param := engine_code_param,
        engine_type_param := engine_type_param,
        vin_param := vin_number_param,
        part_name_param := COALESCE(part_param, free_query_param),
        part_family_param := family_param,
        source_param := source_param,
        limit_results := limit_results
    ) c;
END;
$$ LANGUAGE plpgsql;

SELECT '=== WORKING SEARCH FUNCTION RESTORED ===' as section;

DO $$
BEGIN
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'WORKING SEARCH FUNCTION RESTORED';
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'Reverted to the working cascading_parts_search';
    RAISE NOTICE 'Hebrew text should display correctly again';
    RAISE NOTICE 'Basic make/model/part filtering working';
    RAISE NOTICE 'Source column returned correctly';
    RAISE NOTICE '===============================================';
END $$;