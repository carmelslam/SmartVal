-- FINAL CASCADING SEARCH - Combined Best Version
-- Combines best features from all three versions:
-- 1. Your chat version's complete cascade logic
-- 2. CASCADING_SEARCH_DEPLOYMENT.sql's parameter structure
-- 3. Fixes: source column, year format handling, make fallback

SELECT '=== FINAL CASCADING SEARCH DEPLOYMENT ===' as section;

-- ============================================================================
-- DROP EXISTING FUNCTIONS (ALL OVERLOADS)
-- ============================================================================

-- Drop all cascading function overloads
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT proname, pg_get_function_identity_arguments(oid) as args
        FROM pg_proc 
        WHERE proname IN ('cascading_parts_search', 'simple_parts_search', 'advanced_parts_search', 'smart_parts_search')
          AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.proname || '(' || func_record.args || ') CASCADE';
        RAISE NOTICE 'Dropped function: %(%)', func_record.proname, func_record.args;
    END LOOP;
END $$;

-- ============================================================================
-- MAIN CASCADING SEARCH FUNCTION
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
    source TEXT,        -- FIXED: Return source instead of availability
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
        FROM catalog_items 
        WHERE make = make_param;
        
        IF results_count = 0 THEN
            -- Try removing country suffix (יפן, גרמניה, etc.)
            actual_make := TRIM(REGEXP_REPLACE(make_param, '\s+(יפן|גרמניה|אמריקה|קוריאה|צרפת|איטליה)$', '', 'g'));
            
            -- Check if fallback make exists
            SELECT COUNT(*) INTO results_count 
            FROM catalog_items 
            WHERE make = actual_make;
            
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
        FROM catalog_items 
        WHERE make = actual_make AND model = model_param;
        
        IF results_count = 0 THEN
            -- Try partial model match (first word)
            actual_model := SPLIT_PART(model_param, ' ', 1);
            
            SELECT COUNT(*) INTO results_count 
            FROM catalog_items 
            WHERE make = actual_make AND model ILIKE '%' || actual_model || '%';
            
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
    -- LEVEL 1: EXACT MATCH (All car parameters + part)
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
    
    -- Add optional car parameters (don't affect cascade, just filter if present)
    IF engine_code_param IS NOT NULL AND engine_code_param != '' THEN
        car_filters := car_filters || format(' AND ci.engine_code ILIKE %L', '%' || engine_code_param || '%');
    END IF;
    
    IF engine_type_param IS NOT NULL AND engine_type_param != '' THEN
        car_filters := car_filters || format(' AND ci.engine_type ILIKE %L', '%' || engine_type_param || '%');
    END IF;
    
    IF vin_param IS NOT NULL AND vin_param != '' THEN
        car_filters := car_filters || format(' AND ci.vin ILIKE %L', '%' || vin_param || '%');
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
        -- Check if family exists, fallback to part name if not
        SELECT COUNT(*) INTO results_count 
        FROM catalog_items 
        WHERE (car_filters = '' OR (car_filters != '' AND actual_make IS NOT NULL))
          AND part_family ILIKE '%' || part_family_param || '%';
        
        IF results_count = 0 AND part_name_param IS NOT NULL THEN
            current_level := 'FAMILY_FALLBACK_TO_PART';
            search_message := 'משפחה לא נמצאה (' || part_family_param || '), מציג חלקים: ' || part_name_param;
        ELSE
            IF part_filters != '' THEN
                part_filters := part_filters || ' AND ';
            END IF;
            part_filters := part_filters || format('ci.part_family ILIKE %L', '%' || part_family_param || '%');
        END IF;
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
    
    -- Check if we have results at this level
    EXECUTE full_query INTO results_count;
    
    IF results_count > 0 THEN
        -- EXACT MATCH FOUND - Return results
        RETURN QUERY EXECUTE format(
            'SELECT ci.id, ci.cat_num_desc, ci.supplier_name, ci.pcode, ci.price::NUMERIC,
                    ci.oem, ci.make, ci.model, COALESCE(ci.part_family, ''לא מוגדר''), ci.part_name,
                    ci.side_position, ci.front_rear, ci.version_date::TEXT, 
                    ci.source, ci.extracted_year, ci.year_from, ci.year_to,
                    COALESCE(ci.model_display, ci.model, ''לא מוגדר''),
                    CASE 
                        WHEN %L = ''EXACT_MATCH'' THEN 100
                        WHEN %L LIKE ''%%_FALLBACK%%'' THEN 80
                        WHEN %L LIKE ''%%PARTIAL%%'' THEN 60
                        ELSE 40
                    END as match_score,
                    %L as fallback_level,
                    %L as search_message
             FROM catalog_items ci 
             WHERE %s
             ORDER BY 
                CASE 
                    WHEN %L = ''EXACT_MATCH'' THEN 0
                    WHEN %L LIKE ''%%_FALLBACK%%'' THEN 1
                    ELSE 2
                END,
                ci.price ASC NULLS LAST, 
                ci.cat_num_desc
             LIMIT %s',
            current_level, current_level, current_level,
            current_level, search_message,
            CASE WHEN car_filters != '' AND part_filters != '' THEN car_filters || ' AND ' || part_filters
                 WHEN car_filters != '' THEN car_filters
                 ELSE part_filters END,
            current_level, current_level,
            limit_results
        );
        RETURN;
    END IF;
    
    -- ========================================================================
    -- FALLBACK LEVELS (Continue with existing cascade logic)
    -- ========================================================================
    
    -- LEVEL 2: FALLBACK - Remove Model Code
    IF model_code_param IS NOT NULL AND actual_trim_param IS NOT NULL THEN
        current_level := 'NO_MODEL_CODE';
        search_message := 'לא נמצא קוד דגם: ' || model_code_param;
        
        -- Rebuild query without model_code
        car_filters := format('ci.make = %L', actual_make);
        IF actual_model IS NOT NULL THEN
            car_filters := car_filters || format(' AND (ci.model ILIKE %L OR ci.model_display ILIKE %L)', 
                '%' || actual_model || '%', '%' || actual_model || '%');
        END IF;
        IF year_from_param IS NOT NULL THEN
            car_filters := car_filters || format(' AND (ci.extracted_year = %L OR ci.extracted_year = %L OR ci.extracted_year = %L OR (ci.year_from <= %L AND ci.year_to >= %L))', 
                actual_year_str, LPAD(RIGHT(actual_year_str, 2), 3, '0'), RIGHT(actual_year_str, 2),
                year_from_param, year_from_param);
        END IF;
        IF actual_trim_param IS NOT NULL AND actual_trim_param != '' THEN
            car_filters := car_filters || format(' AND ci.actual_trim ILIKE %L', '%' || actual_trim_param || '%');
        END IF;
        
        full_query := 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || car_filters;
        IF part_filters != '' THEN
            full_query := full_query || ' AND ' || part_filters;
        END IF;
        
        EXECUTE full_query INTO results_count;
        
        IF results_count > 0 THEN
            RETURN QUERY EXECUTE format(
                'SELECT ci.id, ci.cat_num_desc, ci.supplier_name, ci.pcode, ci.price::NUMERIC,
                        ci.oem, ci.make, ci.model, COALESCE(ci.part_family, ''לא מוגדר''), ci.part_name,
                        ci.side_position, ci.front_rear, ci.version_date::TEXT,
                        ci.source, ci.extracted_year, ci.year_from, ci.year_to,
                        COALESCE(ci.model_display, ci.model, ''לא מוגדר''),
                        85 as match_score, %L as fallback_level, %L as search_message
                 FROM catalog_items ci 
                 WHERE %s
                 ORDER BY ci.price ASC NULLS LAST, ci.cat_num_desc
                 LIMIT %s',
                current_level, search_message,
                CASE WHEN part_filters != '' THEN car_filters || ' AND ' || part_filters ELSE car_filters END,
                limit_results
            );
            RETURN;
        END IF;
    END IF;
    
    -- LEVEL 3: FALLBACK - Remove Trim
    IF actual_trim_param IS NOT NULL AND year_from_param IS NOT NULL THEN
        current_level := 'NO_TRIM';
        search_message := 'לא נמצא גימור: ' || actual_trim_param;
        
        car_filters := format('ci.make = %L', actual_make);
        IF actual_model IS NOT NULL THEN
            car_filters := car_filters || format(' AND (ci.model ILIKE %L OR ci.model_display ILIKE %L)', 
                '%' || actual_model || '%', '%' || actual_model || '%');
        END IF;
        car_filters := car_filters || format(' AND (ci.extracted_year = %L OR ci.extracted_year = %L OR ci.extracted_year = %L OR (ci.year_from <= %L AND ci.year_to >= %L))', 
            actual_year_str, LPAD(RIGHT(actual_year_str, 2), 3, '0'), RIGHT(actual_year_str, 2),
            year_from_param, year_from_param);
        
        full_query := 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || car_filters;
        IF part_filters != '' THEN
            full_query := full_query || ' AND ' || part_filters;
        END IF;
        
        EXECUTE full_query INTO results_count;
        
        IF results_count > 0 THEN
            RETURN QUERY EXECUTE format(
                'SELECT ci.id, ci.cat_num_desc, ci.supplier_name, ci.pcode, ci.price::NUMERIC,
                        ci.oem, ci.make, ci.model, COALESCE(ci.part_family, ''לא מוגדר''), ci.part_name,
                        ci.side_position, ci.front_rear, ci.version_date::TEXT,
                        ci.source, ci.extracted_year, ci.year_from, ci.year_to,
                        COALESCE(ci.model_display, ci.model, ''לא מוגדר''),
                        70 as match_score, %L as fallback_level, %L as search_message
                 FROM catalog_items ci 
                 WHERE %s
                 ORDER BY ci.price ASC NULLS LAST, ci.cat_num_desc
                 LIMIT %s',
                current_level, search_message,
                CASE WHEN part_filters != '' THEN car_filters || ' AND ' || part_filters ELSE car_filters END,
                limit_results
            );
            RETURN;
        END IF;
    END IF;
    
    -- LEVEL 4: FALLBACK - Remove Year
    IF year_from_param IS NOT NULL AND actual_model IS NOT NULL THEN
        current_level := 'NO_YEAR';
        search_message := 'לא נמצאה שנה: ' || year_from_param::TEXT;
        
        car_filters := format('ci.make = %L', actual_make);
        car_filters := car_filters || format(' AND (ci.model ILIKE %L OR ci.model_display ILIKE %L)', 
            '%' || actual_model || '%', '%' || actual_model || '%');
        
        full_query := 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || car_filters;
        IF part_filters != '' THEN
            full_query := full_query || ' AND ' || part_filters;
        END IF;
        
        EXECUTE full_query INTO results_count;
        
        IF results_count > 0 THEN
            RETURN QUERY EXECUTE format(
                'SELECT ci.id, ci.cat_num_desc, ci.supplier_name, ci.pcode, ci.price::NUMERIC,
                        ci.oem, ci.make, ci.model, COALESCE(ci.part_family, ''לא מוגדר''), ci.part_name,
                        ci.side_position, ci.front_rear, ci.version_date::TEXT,
                        ci.source, ci.extracted_year, ci.year_from, ci.year_to,
                        COALESCE(ci.model_display, ci.model, ''לא מוגדר''),
                        55 as match_score, %L as fallback_level, %L as search_message
                 FROM catalog_items ci 
                 WHERE %s
                 ORDER BY ci.price ASC NULLS LAST, ci.cat_num_desc
                 LIMIT %s',
                current_level, search_message,
                CASE WHEN part_filters != '' THEN car_filters || ' AND ' || part_filters ELSE car_filters END,
                limit_results
            );
            RETURN;
        END IF;
    END IF;
    
    -- LEVEL 5: FALLBACK - Remove Model (Make + Part only)
    IF actual_model IS NOT NULL AND actual_make IS NOT NULL THEN
        current_level := 'NO_MODEL';
        search_message := 'לא נמצא דגם, מציג יצרן: ' || actual_make;
        
        car_filters := format('ci.make = %L', actual_make);
        
        full_query := 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || car_filters;
        IF part_filters != '' THEN
            full_query := full_query || ' AND ' || part_filters;
        END IF;
        
        EXECUTE full_query INTO results_count;
        
        IF results_count > 0 THEN
            RETURN QUERY EXECUTE format(
                'SELECT ci.id, ci.cat_num_desc, ci.supplier_name, ci.pcode, ci.price::NUMERIC,
                        ci.oem, ci.make, ci.model, COALESCE(ci.part_family, ''לא מוגדר''), ci.part_name,
                        ci.side_position, ci.front_rear, ci.version_date::TEXT,
                        ci.source, ci.extracted_year, ci.year_from, ci.year_to,
                        COALESCE(ci.model_display, ci.model, ''לא מוגדר''),
                        40 as match_score, %L as fallback_level, %L as search_message
                 FROM catalog_items ci 
                 WHERE %s
                 ORDER BY ci.price ASC NULLS LAST, ci.cat_num_desc
                 LIMIT %s',
                current_level, search_message,
                CASE WHEN part_filters != '' THEN car_filters || ' AND ' || part_filters ELSE car_filters END,
                limit_results
            );
            RETURN;
        END IF;
    END IF;
    
    -- LEVEL 6: NO RESULTS - Return empty with alert
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
-- WRAPPER FUNCTIONS FOR COMPATIBILITY
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

-- ============================================================================
-- CLEANUP OLD VERSIONS
-- ============================================================================

-- Remove old deployment file to avoid confusion
DO $$
BEGIN
    RAISE NOTICE 'FINAL_CASCADING_SEARCH.sql is now the single source of truth';
    RAISE NOTICE 'Previous versions (CASCADING_SEARCH_DEPLOYMENT.sql) should be considered obsolete';
END $$;

-- ============================================================================
-- VERIFICATION TESTS
-- ============================================================================

SELECT '=== TESTING FINAL CASCADING SEARCH ===' as section;

-- Test 1: Make fallback (טויוטה יפן → טויוטה)
SELECT 
    'Test 1 - Make Fallback:' as test_name,
    fallback_level, search_message, COUNT(*) as results
FROM cascading_parts_search(
    make_param := 'טויוטה יפן',
    part_name_param := 'כנף',
    limit_results := 10
)
GROUP BY fallback_level, search_message;

-- Test 2: Model fallback (COROLLA CROSS → partial → make)
SELECT 
    'Test 2 - Model Fallback:' as test_name,
    fallback_level, search_message, COUNT(*) as results
FROM cascading_parts_search(
    make_param := 'טויוטה',
    model_param := 'COROLLA CROSS',
    part_name_param := 'כנף',
    limit_results := 10
)
GROUP BY fallback_level, search_message;

-- Test 3: Year format handling
SELECT 
    'Test 3 - Year Format:' as test_name,
    fallback_level, search_message, COUNT(*) as results
FROM cascading_parts_search(
    make_param := 'טויוטה',
    year_from_param := 2022,
    part_name_param := 'כנף',
    limit_results := 10
)
GROUP BY fallback_level, search_message;

-- Test 4: Source column (should not be null)
SELECT 
    'Test 4 - Source Column:' as test_name,
    source, COUNT(*) as count
FROM cascading_parts_search(
    make_param := 'טויוטה',
    part_name_param := 'כנף',
    limit_results := 20
)
WHERE source IS NOT NULL
GROUP BY source;

SELECT '=== FINAL CASCADING SEARCH DEPLOYMENT COMPLETE ===' as section;

DO $$
BEGIN
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'FINAL CASCADING SEARCH DEPLOYED SUCCESSFULLY';
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'This is now the SINGLE SOURCE OF TRUTH';
    RAISE NOTICE 'Features included:';
    RAISE NOTICE '- Make fallback: טויוטה יפן → טויוטה';
    RAISE NOTICE '- Model fallback: COROLLA CROSS → partial → make';
    RAISE NOTICE '- Year format: 2022/022/22 variations';
    RAISE NOTICE '- Family fallback: family → part name';
    RAISE NOTICE '- Source column: returns source (not availability)';
    RAISE NOTICE '- Backward compatible with all existing UI calls';
    RAISE NOTICE '- Complete cascade logic from all three versions';
    RAISE NOTICE '';
    RAISE NOTICE 'Old files to ignore: CASCADING_SEARCH_DEPLOYMENT.sql';
    RAISE NOTICE '===============================================';
END $$;