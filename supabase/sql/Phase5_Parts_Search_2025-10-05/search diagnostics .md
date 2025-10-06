Section 1 :

[
  {
    "function_name": "normalize_search_term",
    "parameters": "term text",
    "definition_preview": "CREATE OR REPLACE FUNCTION public.normalize_search_term(term text)\n RETURNS text\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    normalized TEXT;\nBEGIN\n    normalized := term;\n    \n    -- שמאל variations (12,134 records have שמ', only 634 have שמאל)\n    normalized := regexp_replace(normalized, 'שמאל(ית)?', '(שמ''|שמאל|שמאלית)', 'gi');\n    normalized := regexp_replace(normalized, 'צד\\s+שמאל', '(צד שמאל|שמ'')', 'gi');\n    \n    -- ימין variations (11,998 records have ימ', only 870 have ימין)\n    normalized := regexp_replace(normalized, 'ימין(ית)?', '(ימ''|ימין|ימנית)', 'gi');\n    normalized := regexp_replace(normalized, 'צד\\s+ימין', '(צד ימין|ימ'')', 'gi');\n    \n    -- אחורי variations (9,392 records have אח', only 693 have אחורי)\n    normalized := regexp_replace(normalized, 'אחורי(ת)?', '(אח''|אחורי|אחורית)', 'gi');\n    \n    -- קדמי variations\n    normalized := regexp_replace(normalized, 'קדמי(ת)?', '(קד''|קדמי|קדמית)', 'gi');\n    \n    -- תחתון variations\n    normalized := regexp_replace(normalized, 'תחתון(ה)?', '(תח''|תחתון|תחתונה)', 'gi');\n    \n    -- עליון variations\n    normalized := regexp_replace(normalized, 'עליון(ה)?', '(על''|עליון|עליונה)', 'gi');\n    \n    RETURN normalized;\nEND;\n$function$\n"
  },
  {
    "function_name": "smart_parts_search",
    "parameters": "make_param text DEFAULT NULL::text, model_param text DEFAULT NULL::text, free_query_param text DEFAULT NULL::text, part_param text DEFAULT NULL::text, oem_param text DEFAULT NULL::text, family_param text DEFAULT NULL::text, limit_results integer DEFAULT 50, car_plate text DEFAULT NULL::text, engine_code_param text DEFAULT NULL::text, engine_type_param text DEFAULT NULL::text, engine_volume_param text DEFAULT NULL::text, model_code_param text DEFAULT NULL::text, quantity_param integer DEFAULT NULL::integer, source_param text DEFAULT NULL::text, trim_param text DEFAULT NULL::text, vin_number_param text DEFAULT NULL::text, year_param text DEFAULT NULL::text",
    "definition_preview": "CREATE OR REPLACE FUNCTION public.smart_parts_search(make_param text DEFAULT NULL::text, model_param text DEFAULT NULL::text, free_query_param text DEFAULT NULL::text, part_param text DEFAULT NULL::text, oem_param text DEFAULT NULL::text, family_param text DEFAULT NULL::text, limit_results integer DEFAULT 50, car_plate text DEFAULT NULL::text, engine_code_param text DEFAULT NULL::text, engine_type_param text DEFAULT NULL::text, engine_volume_param text DEFAULT NULL::text, model_code_param text DEFAULT NULL::text, quantity_param integer DEFAULT NULL::integer, source_param text DEFAULT NULL::text, trim_param text DEFAULT NULL::text, vin_number_param text DEFAULT NULL::text, year_param text DEFAULT NULL::text)\n RETURNS TABLE(id uuid, cat_num_desc text, supplier_name text, pcode text, price numeric, oem text, make text, model text, part_family text, side_position text, version_date text, availability text, extracted_year text, model_display text, match_score integer, year_from integer, year_to integer, search_message text)\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    result_count INT := 0;\n    where_parts TEXT[] := ARRAY[]::TEXT[];\n    final_where TEXT;\n    final_query TEXT;\n    \n    part_terms TEXT[];\n    free_terms TEXT[];\n    make_terms TEXT[];\n    model_terms TEXT[];\n    year_formats TEXT[];\n    \n    current_search TEXT;\n    normalized_search TEXT;\n    search_message TEXT := '';\n    \n    -- Store which filter was used and the filter itself\n    used_free_query BOOLEAN := FALSE;\n    used_part_param BOOLEAN := FALSE;\n    stored_part_filter TEXT := NULL;\n    \n    i INT;\nBEGIN\n    -- Requirement: Either part_param OR free_query_param\n    IF (part_param IS NULL OR part_param = '') AND (free_query_param IS NULL OR free_query_param = '') THEN\n        RETURN;\n    END IF;\n    \n    -- ============================================================================\n    -- STEP 1: FAMILY\n    -- ============================================================================\n    \n    IF family_param IS NOT NULL AND family_param != '' THEN\n        where_parts := array_append(where_parts,\n            format('ci.part_family ILIKE %L', '%' || family_param || '%'));\n        \n        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n        \n        IF result_count > 0 THEN\n            search_message := 'משפחה: ' || family_param;\n        ELSE\n            where_parts := where_parts[1:array_length(where_parts,1)-1];\n        END IF;\n    END IF;\n    \n    -- ============================================================================\n    -- STEP 2: free_query_param (FIRST TIME - with field cascade)\n    -- ============================================================================\n    \n    IF free_query_param IS NOT NULL AND free_query_param != '' THEN\n        free_terms := string_to_array(free_query_param, ' ');\n        used_free_query := TRUE;\n        \n        FOR i IN REVERSE array_length(free_terms, 1)..1 LOOP\n            current_search := array_to_string(free_terms[1:i], ' ');\n            normalized_search := normalize_search_term(current_search);\n            \n            where_parts := array_append(where_parts,\n                format('(ci.cat_num_desc ~* %L OR ci.part_family ~* %L)',\n                    normalized_search, normalized_search));\n            \n            EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n            \n            IF result_count > 0 THEN\n                stored_part_filter := array_to_string(where_parts[array_length(where_parts,1):array_length(where_parts,1)], '');\n                search_message := search_message || ', חיפוש: ' || current_search;\n                EXIT;\n            END IF;\n            where_parts := where_parts[1:array_length(where_parts,1)-1];\n        END LOOP;\n        \n        IF result_count = 0 THEN RETURN; END IF;\n    END IF;\n    \n    -- ============================================================================\n    -- STEP 3: PART_param (FIRST TIME - with field cascade)\n    -- ============================================================================\n    \n    IF part_param IS NOT NULL AND part_param != '' THEN\n        part_terms := string_to_array(part_param, ' ');\n        used_part_param := TRUE;\n        \n        FOR i IN REVERSE array_length(part_terms, 1)..1 LOOP\n            current_search := array_to_string(part_terms[1:i], ' ');\n            normalized_search := normalize_search_term(current_search);\n            \n            where_parts := array_append(where_parts,\n                format('(ci.cat_num_desc ~* %L OR ci.part_family ~* %L)',\n                    normalized_search, normalized_search));\n            \n            EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n            \n            IF result_count > 0 THEN\n                stored_part_filter := array_to_string(where_parts[array_length(where_parts,1):array_length(where_parts,1)], '');\n                search_message := search_message || ', חלק: ' || current_search;\n                EXIT;\n            END IF;\n            where_parts := where_parts[1:array_length(where_parts,1)-1];\n        END LOOP;\n        \n        IF result_count = 0 THEN RETURN; END IF;\n    END IF;\n    \n    -- ============================================================================\n    -- STEP 4: MAKE\n    -- ============================================================================\n    \n    IF make_param IS NOT NULL AND make_param != '' THEN\n        make_terms := string_to_array(make_param, ' ');\n        \n        where_parts := array_append(where_parts,\n            format('ci.make ILIKE %L', '%' || make_param || '%'));\n        \n        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n        \n        IF result_count = 0 AND array_length(make_terms, 1) > 1 THEN\n            where_parts := where_parts[1:array_length(where_parts,1)-1];\n            \n            FOR i IN 1..array_length(make_terms, 1) LOOP\n                current_search := make_terms[i];\n                where_parts := array_append(where_parts,\n                    format('ci.make ILIKE %L', '%' || current_search || '%'));\n                \n                EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n                \n                IF result_count > 0 THEN\n                    search_message := search_message || ', יצרן: ' || current_search;\n                    EXIT;\n                END IF;\n                where_parts := where_parts[1:array_length(where_parts,1)-1];\n            END LOOP;\n        ELSE\n            search_message := search_message || ', יצרן: ' || make_param;\n        END IF;\n        \n        IF result_count = 0 THEN RETURN; END IF;\n    END IF;\n    \n    -- ============================================================================\n    -- STEP 5: MODEL\n    -- ============================================================================\n    \n    IF model_param IS NOT NULL AND model_param != '' THEN\n        model_terms := string_to_array(model_param, ' ');\n        \n        where_parts := array_append(where_parts,\n            format('ci.model ILIKE %L', '%' || model_param || '%'));\n        \n        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n        \n        IF result_count = 0 AND array_length(model_terms, 1) > 1 THEN\n            where_parts := where_parts[1:array_length(where_parts,1)-1];\n            \n            FOR i IN 1..array_length(model_terms, 1) LOOP\n                current_search := model_terms[i];\n                where_parts := array_append(where_parts,\n                    format('ci.model ILIKE %L', '%' || current_search || '%'));\n                \n                EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n                \n                IF result_count > 0 THEN\n                    search_message := search_message || ', דגם: ' || current_search;\n                    EXIT;\n                END IF;\n                where_parts := where_parts[1:array_length(where_parts,1)-1];\n            END LOOP;\n        ELSIF result_count > 0 THEN\n            search_message := search_message || ', דגם: ' || model_param;\n        END IF;\n        \n        IF result_count = 0 THEN\n            where_parts := where_parts[1:array_length(where_parts,1)-1];\n        END IF;\n    END IF;\n    \n    -- ============================================================================\n    -- STEP 6: free_query_param (SECOND TIME - STRICT, no cascade)\n    -- ============================================================================\n    \n    IF used_free_query AND stored_part_filter IS NOT NULL THEN\n        where_parts := array_append(where_parts, stored_part_filter);\n        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n    END IF;\n    \n    -- ============================================================================\n    -- STEP 7: PART_param (SECOND TIME - STRICT, no cascade)\n    -- ============================================================================\n    \n    IF used_part_param AND stored_part_filter IS NOT NULL THEN\n        where_parts := array_append(where_parts, stored_part_filter);\n        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n    END IF;\n    \n    -- ============================================================================\n    -- STEP 8: OEM\n    -- ============================================================================\n    \n    IF oem_param IS NOT NULL AND oem_param != '' THEN\n        where_parts := array_append(where_parts, format('ci.oem ILIKE %L', '%' || oem_param || '%'));\n        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n        IF result_count = 0 THEN where_parts := where_parts[1:array_length(where_parts,1)-1]; END IF;\n    END IF;\n    \n    -- ============================================================================\n    -- STEP 9: YEAR\n    -- ============================================================================\n    \n    IF year_param IS NOT NULL AND year_param != '' THEN\n        IF length(year_param) = 4 THEN\n            year_formats := ARRAY[year_param, LPAD((year_param::INT % 100)::TEXT, 3, '0'), (year_param::INT % 100)::TEXT];\n        ELSE\n            year_formats := ARRAY[year_param];\n        END IF;\n        \n        FOR i IN 1..array_length(year_formats, 1) LOOP\n            where_parts := array_append(where_parts,\n                format('(ci.year_from::TEXT ILIKE %L OR ci.year_range ILIKE %L)',\n                    '%' || year_formats[i] || '%', '%' || year_formats[i] || '%'));\n            EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n            IF result_count > 0 THEN EXIT; END IF;\n            where_parts := where_parts[1:array_length(where_parts,1)-1];\n        END LOOP;\n        \n        IF result_count = 0 THEN where_parts := where_parts[1:array_length(where_parts,1)-1]; END IF;\n    END IF;\n    \n    -- ============================================================================\n    -- STEP 10: TRIM\n    -- ============================================================================\n    \n    IF trim_param IS NOT NULL AND trim_param != '' THEN\n        where_parts := array_append(where_parts, format('ci.trim ILIKE %L', '%' || trim_param || '%'));\n        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n        IF result_count = 0 THEN where_parts := where_parts[1:array_length(where_parts,1)-1]; END IF;\n    END IF;\n    \n    -- ============================================================================\n    -- STEP 11: MODEL_CODE\n    -- ============================================================================\n    \n    IF model_code_param IS NOT NULL AND model_code_param != '' THEN\n        where_parts := array_append(where_parts, format('ci.model_code ILIKE %L', '%' || model_code_param || '%'));\n        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n        IF result_count = 0 THEN where_parts := where_parts[1:array_length(where_parts,1)-1]; END IF;\n    END IF;\n    \n    -- ============================================================================\n    -- STEP 12: VIN\n    -- ============================================================================\n    \n    IF vin_number_param IS NOT NULL AND vin_number_param != '' THEN\n        where_parts := array_append(where_parts, format('ci.vin ILIKE %L', '%' || vin_number_param || '%'));\n        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n        IF result_count = 0 THEN where_parts := where_parts[1:array_length(where_parts,1)-1]; END IF;\n    END IF;\n    \n    -- ============================================================================\n    -- STEP 13: ENGINE_CODE\n    -- ============================================================================\n    \n    IF engine_code_param IS NOT NULL AND engine_code_param != '' THEN\n        where_parts := array_append(where_parts, format('ci.engine_code ILIKE %L', '%' || engine_code_param || '%'));\n        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n        IF result_count = 0 THEN where_parts := where_parts[1:array_length(where_parts,1)-1]; END IF;\n    END IF;\n    \n    -- ============================================================================\n    -- STEP 14: ENGINE_VOLUME\n    -- ============================================================================\n    \n    IF engine_volume_param IS NOT NULL AND engine_volume_param != '' THEN\n        where_parts := array_append(where_parts, format('ci.engine_volume ILIKE %L', '%' || engine_volume_param || '%'));\n        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n        IF result_count = 0 THEN where_parts := where_parts[1:array_length(where_parts,1)-1]; END IF;\n    END IF;\n    \n    -- ============================================================================\n    -- STEP 15: ENGINE_TYPE (fuel type)\n    -- ============================================================================\n    \n    IF engine_type_param IS NOT NULL AND engine_type_param != '' THEN\n        where_parts := array_append(where_parts, format('ci.engine_type ILIKE %L', '%' || engine_type_param || '%'));\n        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n        IF result_count = 0 THEN where_parts := where_parts[1:array_length(where_parts,1)-1]; END IF;\n    END IF;\n    \n    -- ============================================================================\n    -- STEP 16: SOURCE\n    -- ============================================================================\n    \n    IF source_param IS NOT NULL AND source_param != '' THEN\n        where_parts := array_append(where_parts, format('ci.source ILIKE %L', '%' || source_param || '%'));\n        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n        IF result_count = 0 THEN where_parts := where_parts[1:array_length(where_parts,1)-1]; END IF;\n    END IF;\n    \n    -- ============================================================================\n    -- EXECUTE FINAL QUERY\n    -- ============================================================================\n    \n    final_where := array_to_string(where_parts, ' AND ');\n    IF final_where = '' THEN final_where := 'TRUE'; END IF;\n    \n    final_query := format('\n        SELECT \n            ci.id, ci.cat_num_desc, ci.supplier_name, ci.pcode, ci.price::NUMERIC,\n            ci.oem, ci.make, ci.model,\n            COALESCE(ci.part_family, ''לא מוגדר'') as part_family,\n            ci.side_position, ci.version_date::TEXT,\n            COALESCE(ci.source, ''חליפי'') as availability,\n            ci.extracted_year, ci.model_display,\n            10 as match_score, ci.year_from, ci.year_to,\n            %L as search_message\n        FROM catalog_items ci\n        WHERE %s\n        ORDER BY ci.price ASC NULLS LAST\n        LIMIT %s\n    ', search_message, final_where, limit_results);\n    \n    RETURN QUERY EXECUTE final_query;\nEND;\n$function$\n"
  }
]

section 2 :

[
  {
    "trigger_name": "auto_process_catalog_on_insert",
    "trigger_definition": "CREATE TRIGGER auto_process_catalog_on_insert BEFORE INSERT ON public.catalog_items FOR EACH ROW EXECUTE FUNCTION auto_extract_catalog_data()"
  },
  {
    "trigger_name": "auto_process_catalog_on_update",
    "trigger_definition": "CREATE TRIGGER auto_process_catalog_on_update BEFORE UPDATE ON public.catalog_items FOR EACH ROW EXECUTE FUNCTION auto_extract_catalog_data()"
  },
  {
    "trigger_name": "trigger_01_set_supplier_name",
    "trigger_definition": "CREATE TRIGGER trigger_01_set_supplier_name BEFORE INSERT OR UPDATE ON public.catalog_items FOR EACH ROW EXECUTE FUNCTION _set_supplier_name()"
  },
  {
    "trigger_name": "trigger_extract_model_and_year",
    "trigger_definition": "CREATE TRIGGER trigger_extract_model_and_year BEFORE INSERT OR UPDATE OF cat_num_desc, make ON public.catalog_items FOR EACH ROW EXECUTE FUNCTION extract_model_and_year()"
  }
]

Section 3 :

[
  {
    "total_records": 48272,
    "unique_suppliers": 1,
    "unique_makes": 113,
    "model_pct": "14.8",
    "year_from_pct": "70.4",
    "year_to_pct": "70.4",
    "part_family_pct": "100.0",
    "side_position_pct": "52.6",
    "front_rear_pct": "61.1",
    "hebrew_makes_count": 37742,
    "hebrew_source_count": 48234
  }
]

Section 4 :

[
  {
    "part_family": "חלקי מרכב",
    "count": 35198,
    "percentage": "72.9"
  },
  {
    "part_family": "פנסים",
    "count": 7154,
    "percentage": "14.8"
  },
  {
    "part_family": "חלונות ומראות",
    "count": 1524,
    "percentage": "3.2"
  },
  {
    "part_family": "מנוע וחלקי מנוע",
    "count": 1156,
    "percentage": "2.4"
  },
  {
    "part_family": "מערכות חימום וקירור",
    "count": 923,
    "percentage": "1.9"
  },
  {
    "part_family": "מערכות בלימה והיגוי",
    "count": 794,
    "percentage": "1.6"
  },
  {
    "part_family": "אביזרים נלווים",
    "count": 779,
    "percentage": "1.6"
  },
  {
    "part_family": "גלגלים וצמיגים",
    "count": 211,
    "percentage": "0.4"
  },
  {
    "part_family": "חשמל",
    "count": 160,
    "percentage": "0.3"
  },
  {
    "part_family": "תיבת הילוכים וחלקים",
    "count": 118,
    "percentage": "0.2"
  },
  {
    "part_family": "מערכת הפליטה",
    "count": 63,
    "percentage": "0.1"
  },
  {
    "part_family": "חלקי פנים",
    "count": 63,
    "percentage": "0.1"
  },
  {
    "part_family": "חיישני מנוע",
    "count": 48,
    "percentage": "0.1"
  },
  {
    "part_family": "מערכת דלק",
    "count": 35,
    "percentage": "0.1"
  },
  {
    "part_family": "כריות אוויר",
    "count": 34,
    "percentage": "0.1"
  },
  {
    "part_family": "מנוע - יחידת בקרת ECU",
    "count": 7,
    "percentage": "0.0"
  },
  {
    "part_family": "מתגים/מפסקים/סוויצ'ים",
    "count": 5,
    "percentage": "0.0"
  }
]

Section 5 :

SELECT '=== SECTION 5: HEBREW TEXT SAMPLES ===' as section;

SELECT 
    make,
    source,
    part_family,
    LEFT(cat_num_desc, 50) as cat_num_desc_sample,
    side_position,
    front_rear
FROM catalog_items
WHERE make IS NOT NULL
LIMIT 10;

Section 6 :

Test 1 :
[
  {
    "test_name": "Test 1: Part search (כנף)",
    "result_count": 50
  }
]

Test 2 :

[
  {
    "test_name": "Test 2: Make search (טויוטה)",
    "result_count": 50
  }
]

Test 3 :

[
  {
    "test_name": "Test 3: Family search (חלקי מרכב)",
    "result_count": 50
  }
]

Section 7:

[
  {
    "supplier_name": "מ.פינס בע\"מ",
    "make": "טויוטה",
    "model": "קורולה",
    "description": "תושבת פנס - קורולה 93-97 4D",
    "part_family": "פנסים",
    "side_position": null,
    "year_from": 1997,
    "year_to": 1993,
    "extracted_year": "1997",
    "model_display": "קורולה (1997)",
    "availability": "חליפי",
    "price": "20.0",
    "pcode": "VB6379",
    "oem": null,
    "match_score": 10,
    "search_message": ", חלק: פנס, יצרן: טויוטה"
  },
  {
    "supplier_name": "מ.פינס בע\"מ",
    "make": "טויוטה",
    "model": "קורולה",
    "description": "קישוט פנס אח' ימ' - קורולה 019-",
    "part_family": "פנסים",
    "side_position": "ימין",
    "year_from": 2019,
    "year_to": 2019,
    "extracted_year": "2019",
    "model_display": "קורולה (2019)",
    "availability": "חליפי",
    "price": "72.47",
    "pcode": "VBP4211831",
    "oem": null,
    "match_score": 10,
    "search_message": ", חלק: פנס, יצרן: טויוטה"
  },
  {
    "supplier_name": "מ.פינס בע\"מ",
    "make": "טויוטה",
    "model": "היילקס",
    "description": "פנס אח' שמ' - היילקס 98-01",
    "part_family": "פנסים",
    "side_position": "שמאל",
    "year_from": 2001,
    "year_to": 1998,
    "extracted_year": "2001",
    "model_display": "היילקס (2001)",
    "availability": "חליפי",
    "price": "75.43",
    "pcode": "DEP21219B4L",
    "oem": null,
    "match_score": 10,
    "search_message": ", חלק: פנס, יצרן: טויוטה"
  },
  {
    "supplier_name": "מ.פינס בע\"מ",
    "make": "טויוטה",
    "model": "קורולה",
    "description": "כיסוי פנס ערפלR קורולה 09-13",
    "part_family": "פנסים",
    "side_position": null,
    "year_from": 2013,
    "year_to": 2009,
    "extracted_year": "2013",
    "model_display": "קורולה (2013)",
    "availability": "חליפי",
    "price": "77.42",
    "pcode": "VB421178761",
    "oem": null,
    "match_score": 10,
    "search_message": ", חלק: פנס, יצרן: טויוטה"
  },
  {
    "supplier_name": "מ.פינס בע\"מ",
    "make": "טויוטה",
    "model": "קורולה",
    "description": "פנס צד לבן - קורולה 01-07",
    "part_family": "פנסים",
    "side_position": null,
    "year_from": 2007,
    "year_to": 2001,
    "extracted_year": "2007",
    "model_display": "קורולה (2007)",
    "availability": "חליפי",
    "price": "81.03",
    "pcode": "DEP2121409NC",
    "oem": null,
    "match_score": 10,
    "search_message": ", חלק: פנס, יצרן: טויוטה"
  }
]

Section 8 :
[
  {
    "input": "Original: אח'",
    "normalized": "אח'"
  },
  {
    "input": "Original: שמ'",
    "normalized": "שמ'"
  },
  {
    "input": "Original: ימ'",
    "normalized": "ימ'"
  },
  {
    "input": "Original: קד'",
    "normalized": "קד'"
  }
]

Section 9 :

[
  {
    "cat_num_desc": "מחזיר אור אח' שמ' - אקספלורר 016-",
    "year_from": 2016,
    "year_to": 2016,
    "extracted_year": null,
    "model": null
  },
  {
    "cat_num_desc": "כיסוי ערפל קד' שמ' - אקספלורר 016-017",
    "year_from": 2016,
    "year_to": 2017,
    "extracted_year": "2016",
    "model": null
  },
  {
    "cat_num_desc": "תומך קד' ימ' צדדי - פוקוס 06-010",
    "year_from": 2010,
    "year_to": 2010,
    "extracted_year": "2006",
    "model": null
  },
  {
    "cat_num_desc": "קישוט עומד אח' שמ' פוקוס 06-07",
    "year_from": 2006,
    "year_to": 2007,
    "extracted_year": "2006",
    "model": null
  },
  {
    "cat_num_desc": "פחית לתומך שמ' לחיזוק אח' - -023 F250",
    "year_from": 2023,
    "year_to": 2023,
    "extracted_year": null,
    "model": null
  },
  {
    "cat_num_desc": "פחית לתומך שמ' לחיזוק אח' - -023 F250",
    "year_from": 2023,
    "year_to": 2023,
    "extracted_year": null,
    "model": null
  },
  {
    "cat_num_desc": "ביטנה קד' ימ' - -023 F250",
    "year_from": 2023,
    "year_to": 2023,
    "extracted_year": null,
    "model": null
  },
  {
    "cat_num_desc": "תומך קד' ימ' - פוקוס 08-010",
    "year_from": 2010,
    "year_to": 2010,
    "extracted_year": "2008",
    "model": null
  },
  {
    "cat_num_desc": "תומך קד' שמ' - פוקוס 08-010",
    "year_from": 2010,
    "year_to": 2010,
    "extracted_year": "2008",
    "model": null
  },
  {
    "cat_num_desc": "ביטנה קד' ימ' - -023 F250 LARIAT",
    "year_from": 2023,
    "year_to": 2023,
    "extracted_year": null,
    "model": null
  }
]

Section 10:

[
  {
    "pattern": "אח' (abbreviated rear)",
    "count": 9392
  },
  {
    "pattern": "אחורי (full rear)",
    "count": 693
  },
  {
    "pattern": "שמ' (abbreviated left)",
    "count": 12134
  },
  {
    "pattern": "שמאל (full left)",
    "count": 634
  }
]

**TEST NORMALIZATION**


Test 1 :
[
  {
    "description": "אטם לצינור פליטה אח' - 92-04 H1",
    "part_family": "חלקי מרכב",
    "side_position": null,
    "price": "1.04"
  },
  {
    "description": "נבה לדיפרנציאל אח' - 92-04 H1",
    "part_family": "פנסים",
    "side_position": null,
    "price": "1.04"
  },
  {
    "description": "צינור בלם אח' ימ' - 92-04 H1",
    "part_family": "מערכות בלימה והיגוי",
    "side_position": "ימין",
    "price": "1.04"
  }
]

Test 2 :

[
  {
    "description": "אטם לצינור פליטה אח' - 92-04 H1",
    "part_family": "חלקי מרכב",
    "side_position": null,
    "price": "1.04"
  },
  {
    "description": "נבה לדיפרנציאל אח' - 92-04 H1",
    "part_family": "פנסים",
    "side_position": null,
    "price": "1.04"
  },
  {
    "description": "צינור בלם אח' ימ' - 92-04 H1",
    "part_family": "מערכות בלימה והיגוי",
    "side_position": "ימין",
    "price": "1.04"
  }
]

Test 3 :

[
  {
    "description": "גן בוץ כנף אח' שמ' - גייטס 03-05",
    "part_family": "חלקי מרכב",
    "side_position": "שמאל",
    "price": "62.12"
  },
  {
    "description": "ביטנה כנף אח' שמ' - סרטו 08",
    "part_family": "חלקי מרכב",
    "side_position": "שמאל",
    "price": "72.47"
  },
  {
    "description": "ביטנה כנף אח' שמ' - 5D 08 M6",
    "part_family": "חלקי מרכב",
    "side_position": "שמאל",
    "price": "100.0"
  },
  {
    "description": "ביטנה כנף אח' שמ' - -11 M5",
    "part_family": "חלקי מרכב",
    "side_position": "שמאל",
    "price": "103.41"
  },
  {
    "description": "תומך כנף אח' שמ'-פאסט 02",
    "part_family": "חלקי מרכב",
    "side_position": "שמאל",
    "price": "112.62"
  }
]

Test 4 :

[
  {
    "description": "כיסוי פנס קד' שמ' - היילנדר 017-",
    "make": "טויוטה",
    "part_family": "פנסים",
    "side_position": "שמאל",
    "price": "826.47"
  }
]

Test 5 :

[
  {
    "description": "המשך קשת כנף אח' שמ' (במגן) - ברונקו רפ",
    "part_family": "חלקי מרכב"
  },
  {
    "description": "המשך קשת כנף אח' שמ' (במגן) - ברונקו רפ",
    "part_family": "חלקי מרכב"
  },
  {
    "description": "המשך קשת כנף אח' ימ' (במגן) - ברונקו רפטו",
    "part_family": "חלקי מרכב"
  }
]