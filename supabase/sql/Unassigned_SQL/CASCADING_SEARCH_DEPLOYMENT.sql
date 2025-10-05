-- CASCADING SEARCH DEPLOYMENT - Based on User Requirements
-- Implements specific fallback logic for car identification and part search
-- Plate always accepted, car fields cascade: make → model → model_code → trim → year
-- Engine fields ignored if missing, part search with variants

SELECT '=== CASCADING SEARCH DEPLOYMENT ===' as section;

-- ============================================================================
-- MAIN CASCADING SEARCH FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS cascading_parts_search CASCADE;

CREATE OR REPLACE FUNCTION cascading_parts_search(
    -- Car identification (priority cascade order)
    plate TEXT DEFAULT NULL,              -- Always accept
    make TEXT DEFAULT NULL,               -- טויוטה יפן → טויוטה
    model TEXT DEFAULT NULL,              -- COROLLA CROSS → טויוטה
    model_code TEXT DEFAULT NULL,         -- ZVG12L-KHXGBW → COROLLA CROSS or טויוטה
    actual_trim TEXT DEFAULT NULL,        -- ADVENTURE → model_code or COROLLA CROSS or טויוטה
    year_from INTEGER DEFAULT NULL,       -- 2022 → טויוטה if missing
    
    -- Optional car parameters (ignore if missing)
    engine_code TEXT DEFAULT NULL,        -- 2ZR - ignore if missing
    engine_type TEXT DEFAULT NULL,        -- בנזין - ignore if missing
    vin TEXT DEFAULT NULL,                -- JTNADACB20J001538 - ignore if missing
    
    -- Part search parameters
    part_name TEXT DEFAULT NULL,          -- כנף → variants if missing
    
    -- Advanced part parameters
    part_family TEXT DEFAULT NULL,        -- דלת family
    advanced_part_name TEXT DEFAULT NULL, -- דלת part name
    source TEXT DEFAULT NULL,             -- ignore if missing (show all)
    
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
    version_date TEXT,
    availability TEXT,
    extracted_year TEXT,
    model_display TEXT,
    match_score INTEGER,
    fallback_level TEXT,
    search_message TEXT
) AS $$
DECLARE
    results_count INTEGER;
    current_level TEXT;
    car_filters TEXT := '';
    part_filters TEXT := '';
    full_query TEXT;
    search_message TEXT;
BEGIN
    -- ========================================================================
    -- LEVEL 1: EXACT MATCH - All provided parameters
    -- ========================================================================
    current_level := 'EXACT_MATCH';
    search_message := 'התאמה מדויקת לכל הפרמטרים';
    car_filters := '';
    
    -- Plate always accepted (never filtered out)
    IF plate IS NOT NULL AND plate != '' THEN
        car_filters := format('ci.plate = %L', plate);
    END IF;
    
    -- Car cascade filters
    IF make IS NOT NULL AND make != '' THEN
        IF car_filters != '' THEN car_filters := car_filters || ' AND '; END IF;
        car_filters := car_filters || format('(ci.make ILIKE %L OR ci.make ILIKE %L)', 
            '%' || make || '%', '%' || SPLIT_PART(make, ' ', 1) || '%');
        
        IF model IS NOT NULL AND model != '' THEN
            car_filters := car_filters || format(' AND ci.model ILIKE %L', '%' || model || '%');
            
            IF model_code IS NOT NULL AND model_code != '' THEN
                car_filters := car_filters || format(' AND ci.model_code ILIKE %L', '%' || model_code || '%');
                
                IF actual_trim IS NOT NULL AND actual_trim != '' THEN
                    car_filters := car_filters || format(' AND ci.actual_trim ILIKE %L', '%' || actual_trim || '%');
                    
                    IF year_from IS NOT NULL THEN
                        car_filters := car_filters || format(' AND (ci.year_from <= %L AND ci.year_to >= %L)', 
                            year_from, year_from);
                    END IF;
                END IF;
            END IF;
        END IF;
    END IF;
    
    -- Optional car parameters (only if provided)
    IF engine_code IS NOT NULL AND engine_code != '' THEN
        car_filters := car_filters || format(' AND ci.engine_code ILIKE %L', '%' || engine_code || '%');
    END IF;
    
    IF engine_type IS NOT NULL AND engine_type != '' THEN
        car_filters := car_filters || format(' AND ci.engine_type ILIKE %L', '%' || engine_type || '%');
    END IF;
    
    IF vin IS NOT NULL AND vin != '' THEN
        car_filters := car_filters || format(' AND ci.vin ILIKE %L', '%' || vin || '%');
    END IF;
    
    -- Part filters (simple or advanced)
    part_filters := '';
    IF part_name IS NOT NULL AND part_name != '' THEN
        part_filters := format('(ci.part_name ILIKE %L OR ci.cat_num_desc ILIKE %L)', 
            '%' || part_name || '%', '%' || part_name || '%');
    END IF;
    
    IF part_family IS NOT NULL AND part_family != '' THEN
        IF part_filters != '' THEN part_filters := part_filters || ' AND '; END IF;
        part_filters := part_filters || format('ci.part_family ILIKE %L', '%' || part_family || '%');
    END IF;
    
    IF advanced_part_name IS NOT NULL AND advanced_part_name != '' THEN
        IF part_filters != '' THEN part_filters := part_filters || ' AND '; END IF;
        part_filters := part_filters || format('(ci.part_name ILIKE %L OR ci.cat_num_desc ILIKE %L)', 
            '%' || advanced_part_name || '%', '%' || advanced_part_name || '%');
    END IF;
    
    -- Source filter (optional)
    IF source IS NOT NULL AND source != '' THEN
        IF part_filters != '' THEN part_filters := part_filters || ' AND '; END IF;
        part_filters := part_filters || format('ci.availability ILIKE %L', '%' || source || '%');
    END IF;
    
    -- Build and test query
    full_query := 'SELECT COUNT(*) FROM catalog_items ci WHERE ';
    IF car_filters != '' AND part_filters != '' THEN
        full_query := full_query || car_filters || ' AND ' || part_filters;
    ELSIF car_filters != '' THEN
        full_query := full_query || car_filters;
    ELSIF part_filters != '' THEN
        full_query := full_query || part_filters;
    ELSE
        full_query := 'SELECT 0';
    END IF;
    
    EXECUTE full_query INTO results_count;
    
    IF results_count > 0 THEN
        RETURN QUERY EXECUTE format(
            'SELECT ci.id, fix_hebrew_text(ci.cat_num_desc), ci.supplier_name, ci.pcode, ci.price::NUMERIC,
                    ci.oem, ci.make, ci.model, COALESCE(ci.part_family, ''לא מוגדר''), ci.part_name,
                    ci.side_position, ci.version_date::TEXT, COALESCE(ci.availability, ''תחלופי''),
                    ci.extracted_year, COALESCE(ci.model_display, ci.model, ''לא מוגדר''),
                    100 as match_score, %L as fallback_level, %L as search_message
             FROM catalog_items ci WHERE %s
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
    
    -- ========================================================================
    -- LEVEL 2: FALLBACK - Remove actual_trim
    -- ========================================================================
    IF actual_trim IS NOT NULL AND actual_trim != '' THEN
        current_level := 'NO_TRIM';
        search_message := 'לא נמצא גימור מדויק: ' || actual_trim;
        car_filters := '';
        
        IF plate IS NOT NULL AND plate != '' THEN
            car_filters := format('ci.plate = %L', plate);
        END IF;
        
        IF make IS NOT NULL AND make != '' THEN
            IF car_filters != '' THEN car_filters := car_filters || ' AND '; END IF;
            car_filters := car_filters || format('(ci.make ILIKE %L OR ci.make ILIKE %L)', 
                '%' || make || '%', '%' || SPLIT_PART(make, ' ', 1) || '%');
            
            IF model IS NOT NULL AND model != '' THEN
                car_filters := car_filters || format(' AND ci.model ILIKE %L', '%' || model || '%');
                
                IF model_code IS NOT NULL AND model_code != '' THEN
                    car_filters := car_filters || format(' AND ci.model_code ILIKE %L', '%' || model_code || '%');
                    
                    IF year_from IS NOT NULL THEN
                        car_filters := car_filters || format(' AND (ci.year_from <= %L AND ci.year_to >= %L)', 
                            year_from, year_from);
                    END IF;
                END IF;
            END IF;
        END IF;
        
        full_query := 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || car_filters;
        IF part_filters != '' THEN
            full_query := full_query || ' AND ' || part_filters;
        END IF;
        
        EXECUTE full_query INTO results_count;
        
        IF results_count > 0 THEN
            RETURN QUERY EXECUTE format(
                'SELECT ci.id, fix_hebrew_text(ci.cat_num_desc), ci.supplier_name, ci.pcode, ci.price::NUMERIC,
                        ci.oem, ci.make, ci.model, COALESCE(ci.part_family, ''לא מוגדר''), ci.part_name,
                        ci.side_position, ci.version_date::TEXT, COALESCE(ci.availability, ''תחלופי''),
                        ci.extracted_year, COALESCE(ci.model_display, ci.model, ''לא מוגדר''),
                        85 as match_score, %L as fallback_level, %L as search_message
                 FROM catalog_items ci WHERE %s
                 ORDER BY ci.price ASC NULLS LAST, ci.cat_num_desc
                 LIMIT %s',
                current_level, search_message,
                CASE WHEN part_filters != '' THEN car_filters || ' AND ' || part_filters ELSE car_filters END,
                limit_results
            );
            RETURN;
        END IF;
    END IF;
    
    -- ========================================================================
    -- LEVEL 3: FALLBACK - Remove model_code
    -- ========================================================================
    IF model_code IS NOT NULL AND model_code != '' THEN
        current_level := 'NO_MODEL_CODE';
        search_message := 'לא נמצא קוד דגם מדויק: ' || model_code;
        car_filters := '';
        
        IF plate IS NOT NULL AND plate != '' THEN
            car_filters := format('ci.plate = %L', plate);
        END IF;
        
        IF make IS NOT NULL AND make != '' THEN
            IF car_filters != '' THEN car_filters := car_filters || ' AND '; END IF;
            car_filters := car_filters || format('(ci.make ILIKE %L OR ci.make ILIKE %L)', 
                '%' || make || '%', '%' || SPLIT_PART(make, ' ', 1) || '%');
            
            IF model IS NOT NULL AND model != '' THEN
                car_filters := car_filters || format(' AND ci.model ILIKE %L', '%' || model || '%');
                
                IF year_from IS NOT NULL THEN
                    car_filters := car_filters || format(' AND (ci.year_from <= %L AND ci.year_to >= %L)', 
                        year_from, year_from);
                END IF;
            END IF;
        END IF;
        
        full_query := 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || car_filters;
        IF part_filters != '' THEN
            full_query := full_query || ' AND ' || part_filters;
        END IF;
        
        EXECUTE full_query INTO results_count;
        
        IF results_count > 0 THEN
            RETURN QUERY EXECUTE format(
                'SELECT ci.id, fix_hebrew_text(ci.cat_num_desc), ci.supplier_name, ci.pcode, ci.price::NUMERIC,
                        ci.oem, ci.make, ci.model, COALESCE(ci.part_family, ''לא מוגדר''), ci.part_name,
                        ci.side_position, ci.version_date::TEXT, COALESCE(ci.availability, ''תחלופי''),
                        ci.extracted_year, COALESCE(ci.model_display, ci.model, ''לא מוגדר''),
                        70 as match_score, %L as fallback_level, %L as search_message
                 FROM catalog_items ci WHERE %s
                 ORDER BY ci.price ASC NULLS LAST, ci.cat_num_desc
                 LIMIT %s',
                current_level, search_message,
                CASE WHEN part_filters != '' THEN car_filters || ' AND ' || part_filters ELSE car_filters END,
                limit_results
            );
            RETURN;
        END IF;
    END IF;
    
    -- ========================================================================
    -- LEVEL 4: FALLBACK - Remove model (show טויוטה)
    -- ========================================================================
    IF model IS NOT NULL AND model != '' THEN
        current_level := 'NO_MODEL';
        search_message := 'לא נמצא דגם מדויק: ' || model || ' - מציג עבור ' || SPLIT_PART(make, ' ', 1);
        car_filters := '';
        
        IF plate IS NOT NULL AND plate != '' THEN
            car_filters := format('ci.plate = %L', plate);
        END IF;
        
        IF make IS NOT NULL AND make != '' THEN
            IF car_filters != '' THEN car_filters := car_filters || ' AND '; END IF;
            car_filters := car_filters || format('(ci.make ILIKE %L OR ci.make ILIKE %L)', 
                '%' || make || '%', '%' || SPLIT_PART(make, ' ', 1) || '%');
        END IF;
        
        full_query := 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || car_filters;
        IF part_filters != '' THEN
            full_query := full_query || ' AND ' || part_filters;
        END IF;
        
        EXECUTE full_query INTO results_count;
        
        IF results_count > 0 THEN
            RETURN QUERY EXECUTE format(
                'SELECT ci.id, fix_hebrew_text(ci.cat_num_desc), ci.supplier_name, ci.pcode, ci.price::NUMERIC,
                        ci.oem, ci.make, ci.model, COALESCE(ci.part_family, ''לא מוגדר''), ci.part_name,
                        ci.side_position, ci.version_date::TEXT, COALESCE(ci.availability, ''תחלופי''),
                        ci.extracted_year, COALESCE(ci.model_display, ci.model, ''לא מוגדר''),
                        55 as match_score, %L as fallback_level, %L as search_message
                 FROM catalog_items ci WHERE %s
                 ORDER BY ci.price ASC NULLS LAST, ci.cat_num_desc
                 LIMIT %s',
                current_level, search_message,
                CASE WHEN part_filters != '' THEN car_filters || ' AND ' || part_filters ELSE car_filters END,
                limit_results
            );
            RETURN;
        END IF;
    END IF;
    
    -- ========================================================================
    -- LEVEL 5: FALLBACK - Part variants (if part not found)
    -- ========================================================================
    IF (part_name IS NOT NULL AND part_name != '') OR (advanced_part_name IS NOT NULL AND advanced_part_name != '') THEN
        current_level := 'PART_VARIANTS';
        search_message := 'לא נמצא חלק מדויק - מציג וריאציות';
        
        -- Create variant searches for parts
        part_filters := '';
        IF part_name IS NOT NULL AND part_name != '' THEN
            part_filters := format(
                '(ci.part_name ILIKE %L OR ci.cat_num_desc ILIKE %L OR ci.part_family ILIKE %L OR ' ||
                'ci.cat_num_desc ILIKE %L OR ci.cat_num_desc ILIKE %L)',
                '%' || part_name || '%',      -- exact
                '%' || part_name || '%',      -- in description
                '%' || part_name || '%',      -- in family
                '%' || SUBSTRING(part_name, 1, 3) || '%', -- prefix
                '%' || REVERSE(part_name) || '%'         -- reverse (Hebrew fix)
            );
        END IF;
        
        IF advanced_part_name IS NOT NULL AND advanced_part_name != '' THEN
            IF part_filters != '' THEN part_filters := part_filters || ' OR '; END IF;
            part_filters := part_filters || format(
                '(ci.part_name ILIKE %L OR ci.cat_num_desc ILIKE %L OR ci.part_family ILIKE %L)',
                '%' || advanced_part_name || '%',
                '%' || advanced_part_name || '%',
                '%' || advanced_part_name || '%'
            );
        END IF;
        
        IF make IS NOT NULL AND make != '' THEN
            car_filters := format('(ci.make ILIKE %L OR ci.make ILIKE %L)', 
                '%' || make || '%', '%' || SPLIT_PART(make, ' ', 1) || '%');
        END IF;
        
        full_query := 'SELECT COUNT(*) FROM catalog_items ci WHERE ';
        IF car_filters != '' AND part_filters != '' THEN
            full_query := full_query || car_filters || ' AND (' || part_filters || ')';
        ELSIF part_filters != '' THEN
            full_query := full_query || '(' || part_filters || ')';
        ELSE
            full_query := 'SELECT 0';
        END IF;
        
        EXECUTE full_query INTO results_count;
        
        IF results_count > 0 THEN
            RETURN QUERY EXECUTE format(
                'SELECT ci.id, fix_hebrew_text(ci.cat_num_desc), ci.supplier_name, ci.pcode, ci.price::NUMERIC,
                        ci.oem, ci.make, ci.model, COALESCE(ci.part_family, ''לא מוגדר''), ci.part_name,
                        ci.side_position, ci.version_date::TEXT, COALESCE(ci.availability, ''תחלופי''),
                        ci.extracted_year, COALESCE(ci.model_display, ci.model, ''לא מוגדר''),
                        40 as match_score, %L as fallback_level, %L as search_message
                 FROM catalog_items ci WHERE %s
                 ORDER BY ci.price ASC NULLS LAST, ci.cat_num_desc
                 LIMIT %s',
                current_level, search_message,
                CASE WHEN car_filters != '' AND part_filters != '' THEN car_filters || ' AND (' || part_filters || ')'
                     ELSE '(' || part_filters || ')' END,
                limit_results
            );
            RETURN;
        END IF;
    END IF;
    
    -- ========================================================================
    -- LEVEL 6: NO RESULTS
    -- ========================================================================
    current_level := 'NO_RESULTS';
    search_message := 'לא נמצאו תוצאות התואמות לקריטריוני החיפוש';
    
    RETURN QUERY SELECT 
        NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, NULL::TEXT,
        NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
        NULL::TEXT, NULL::TEXT, NULL::TEXT, 0::INTEGER, current_level, search_message
    LIMIT 0;
    
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- WRAPPER FUNCTIONS FOR SIMPLE/ADVANCED SEARCH
-- ============================================================================

CREATE OR REPLACE FUNCTION simple_parts_search(
    search_plate TEXT DEFAULT NULL,
    search_make TEXT DEFAULT NULL,
    search_part_name TEXT DEFAULT NULL,
    search_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID, cat_num_desc TEXT, supplier_name TEXT, pcode TEXT, price NUMERIC,
    oem TEXT, make TEXT, model TEXT, part_family TEXT, part_name TEXT,
    side_position TEXT, version_date TEXT, availability TEXT,
    extracted_year TEXT, model_display TEXT, match_score INTEGER,
    fallback_level TEXT, search_message TEXT
) AS $$
BEGIN
    RETURN QUERY SELECT * FROM cascading_parts_search(
        plate := search_plate,
        make := search_make,
        part_name := search_part_name,
        limit_results := search_limit
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION advanced_parts_search(
    search_plate TEXT DEFAULT NULL,
    search_make TEXT DEFAULT NULL,
    search_model TEXT DEFAULT NULL,
    search_model_code TEXT DEFAULT NULL,
    search_trim TEXT DEFAULT NULL,
    search_year INTEGER DEFAULT NULL,
    search_engine_code TEXT DEFAULT NULL,
    search_engine_type TEXT DEFAULT NULL,
    search_vin TEXT DEFAULT NULL,
    search_part_family TEXT DEFAULT NULL,
    search_advanced_part_name TEXT DEFAULT NULL,
    search_source TEXT DEFAULT NULL,
    search_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID, cat_num_desc TEXT, supplier_name TEXT, pcode TEXT, price NUMERIC,
    oem TEXT, make TEXT, model TEXT, part_family TEXT, part_name TEXT,
    side_position TEXT, version_date TEXT, availability TEXT,
    extracted_year TEXT, model_display TEXT, match_score INTEGER,
    fallback_level TEXT, search_message TEXT
) AS $$
BEGIN
    RETURN QUERY SELECT * FROM cascading_parts_search(
        plate := search_plate,
        make := search_make,
        model := search_model,
        model_code := search_model_code,
        actual_trim := search_trim,
        year_from := search_year,
        engine_code := search_engine_code,
        engine_type := search_engine_type,
        vin := search_vin,
        part_family := search_part_family,
        advanced_part_name := search_advanced_part_name,
        source := search_source,
        limit_results := search_limit
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION TESTS
-- ============================================================================

SELECT '=== TESTING CASCADING SEARCH SYSTEM ===' as section;

-- Test 1: Simple search
SELECT 
    'Test 1 - Simple search (טויוטה + כנף):' as test_name,
    fallback_level,
    search_message,
    COUNT(*) as result_count
FROM simple_parts_search('221-84-003', 'טויוטה יפן', 'כנף', 10)
GROUP BY fallback_level, search_message;

-- Test 2: Advanced search with all parameters
SELECT 
    'Test 2 - Advanced search (all params):' as test_name,
    fallback_level,
    search_message,
    COUNT(*) as result_count
FROM advanced_parts_search(
    search_plate := '221-84-003',
    search_make := 'טויוטה יפן',
    search_model := 'COROLLA CROSS',
    search_model_code := 'ZVG12L-KHXGBW',
    search_trim := 'ADVENTURE',
    search_year := 2022,
    search_engine_code := '2ZR',
    search_engine_type := 'בנזין',
    search_part_family := 'דלתות וכנפיים',
    search_advanced_part_name := 'דלת',
    search_limit := 10
)
GROUP BY fallback_level, search_message;

-- Test 3: Check function deployment
SELECT 
    'Function Deployment Status:' as test_name,
    routine_name as function_name,
    'Deployed successfully' as status
FROM information_schema.routines 
WHERE routine_name IN ('cascading_parts_search', 'simple_parts_search', 'advanced_parts_search')
ORDER BY routine_name;

SELECT '=== CASCADING SEARCH DEPLOYMENT COMPLETE ===' as section;