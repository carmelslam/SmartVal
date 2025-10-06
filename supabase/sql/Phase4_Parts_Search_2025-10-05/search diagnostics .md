Test 1 :

[
  {
    "test": "Function Check",
    "function_name": "smart_parts_search",
    "function_definition": "CREATE OR REPLACE FUNCTION public.smart_parts_search(make_param text DEFAULT NULL::text, model_param text DEFAULT NULL::text, free_query_param text DEFAULT NULL::text, part_param text DEFAULT NULL::text, oem_param text DEFAULT NULL::text, family_param text DEFAULT NULL::text, limit_results integer DEFAULT 50, car_plate text DEFAULT NULL::text, engine_code_param text DEFAULT NULL::text, engine_type_param text DEFAULT NULL::text, engine_volume_param text DEFAULT NULL::text, model_code_param text DEFAULT NULL::text, quantity_param integer DEFAULT NULL::integer, source_param text DEFAULT NULL::text, trim_param text DEFAULT NULL::text, vin_number_param text DEFAULT NULL::text, year_param text DEFAULT NULL::text)\n RETURNS TABLE(id uuid, cat_num_desc text, supplier_name text, pcode text, price numeric, oem text, make text, model text, part_family text, side_position text, version_date text, availability text, extracted_year text, model_display text, match_score integer, year_from integer, year_to integer)\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    result_count INT := 0;\n    where_parts TEXT[] := ARRAY[]::TEXT[];\n    final_where TEXT;\n    final_query TEXT;\n    \n    make_terms TEXT[];\n    model_terms TEXT[];\n    part_terms TEXT[];\n    free_terms TEXT[];\n    year_formats TEXT[];\n    \n    current_search TEXT;\n    i INT;\nBEGIN\n    -- ============================================================================\n    -- CRITICAL REQUIREMENT: Either part_param OR free_query_param must be provided\n    -- This is a simple NULL check - no COUNT queries needed\n    -- ============================================================================\n    \n    IF (part_param IS NULL OR part_param = '') AND (free_query_param IS NULL OR free_query_param = '') THEN\n        RETURN; -- Return empty - no part search criteria provided\n    END IF;\n    \n    -- ============================================================================\n    -- STEP 1: CASCADE MAKE (טויוטה יפן → טויוטה)\n    -- ============================================================================\n    \n    IF make_param IS NOT NULL AND make_param != '' THEN\n        make_terms := string_to_array(make_param, ' ');\n        \n        FOR i IN REVERSE array_length(make_terms, 1)..1 LOOP\n            current_search := array_to_string(make_terms[1:i], ' ');\n            \n            where_parts := array_append(where_parts,\n                format('ci.make ILIKE %L', '%' || current_search || '%'));\n            \n            final_where := array_to_string(where_parts, ' AND ');\n            EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || final_where INTO result_count;\n            \n            IF result_count > 0 THEN EXIT; END IF;\n            where_parts := where_parts[1:array_length(where_parts,1)-1];\n        END LOOP;\n        \n        IF result_count = 0 THEN RETURN; END IF;\n    END IF;\n    \n    -- ============================================================================\n    -- STEP 2: CASCADE MODEL_CODE\n    -- ============================================================================\n    \n    IF model_code_param IS NOT NULL AND model_code_param != '' THEN\n        where_parts := array_append(where_parts,\n            format('ci.model_code ILIKE %L', '%' || model_code_param || '%'));\n        \n        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n        \n        IF result_count = 0 THEN\n            IF position('-' IN model_code_param) > 0 THEN\n                where_parts := where_parts[1:array_length(where_parts,1)-1];\n                current_search := split_part(model_code_param, '-', 1);\n                \n                where_parts := array_append(where_parts,\n                    format('ci.model_code ILIKE %L', '%' || current_search || '%'));\n                \n                EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n            END IF;\n            \n            IF result_count = 0 THEN\n                where_parts := where_parts[1:array_length(where_parts,1)-1];\n            END IF;\n        END IF;\n    END IF;\n    \n    -- ============================================================================\n    -- STEP 3: CASCADE TRIM\n    -- ============================================================================\n    \n    IF trim_param IS NOT NULL AND trim_param != '' THEN\n        where_parts := array_append(where_parts,\n            format('ci.trim ILIKE %L', '%' || trim_param || '%'));\n        \n        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n        \n        IF result_count = 0 THEN\n            where_parts := where_parts[1:array_length(where_parts,1)-1];\n        END IF;\n    END IF;\n    \n    -- ============================================================================\n    -- STEP 4: CASCADE MODEL\n    -- ============================================================================\n    \n    IF model_param IS NOT NULL AND model_param != '' THEN\n        model_terms := string_to_array(model_param, ' ');\n        \n        FOR i IN REVERSE array_length(model_terms, 1)..1 LOOP\n            current_search := array_to_string(model_terms[1:i], ' ');\n            \n            where_parts := array_append(where_parts,\n                format('ci.model ILIKE %L', '%' || current_search || '%'));\n            \n            EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n            \n            IF result_count > 0 THEN EXIT; END IF;\n            where_parts := where_parts[1:array_length(where_parts,1)-1];\n        END LOOP;\n    END IF;\n    \n    -- ============================================================================\n    -- STEP 5: CASCADE YEAR\n    -- ============================================================================\n    \n    IF year_param IS NOT NULL AND year_param != '' THEN\n        IF length(year_param) = 4 THEN\n            IF year_param::INT >= 2010 THEN\n                year_formats := ARRAY[year_param, '0' || substring(year_param from 3), substring(year_param from 3)];\n            ELSE\n                year_formats := ARRAY[year_param, substring(year_param from 3)];\n            END IF;\n        ELSE\n            year_formats := ARRAY[year_param];\n        END IF;\n        \n        FOR i IN 1..array_length(year_formats, 1) LOOP\n            where_parts := array_append(where_parts,\n                format('(ci.year_from::TEXT ILIKE %L OR ci.extracted_year ILIKE %L)',\n                    '%' || year_formats[i] || '%', '%' || year_formats[i] || '%'));\n            \n            EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n            \n            IF result_count > 0 THEN EXIT; END IF;\n            where_parts := where_parts[1:array_length(where_parts,1)-1];\n        END LOOP;\n    END IF;\n    \n    -- ============================================================================\n    -- STEP 6: ENGINE PARAMETERS - IGNORE if don't exist\n    -- ============================================================================\n    \n    IF engine_code_param IS NOT NULL AND engine_code_param != '' THEN\n        where_parts := array_append(where_parts,\n            format('ci.engine_code ILIKE %L', '%' || engine_code_param || '%'));\n        \n        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n        \n        IF result_count = 0 THEN\n            where_parts := where_parts[1:array_length(where_parts,1)-1];\n        END IF;\n    END IF;\n    \n    IF engine_type_param IS NOT NULL AND engine_type_param != '' THEN\n        where_parts := array_append(where_parts,\n            format('ci.engine_type ILIKE %L', '%' || engine_type_param || '%'));\n        \n        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n        \n        IF result_count = 0 THEN\n            where_parts := where_parts[1:array_length(where_parts,1)-1];\n        END IF;\n    END IF;\n    \n    IF engine_volume_param IS NOT NULL AND engine_volume_param != '' THEN\n        where_parts := array_append(where_parts,\n            format('ci.engine_volume ILIKE %L', '%' || engine_volume_param || '%'));\n        \n        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n        \n        IF result_count = 0 THEN\n            where_parts := where_parts[1:array_length(where_parts,1)-1];\n        END IF;\n    END IF;\n    \n    IF vin_number_param IS NOT NULL AND vin_number_param != '' THEN\n        where_parts := array_append(where_parts,\n            format('ci.vin ILIKE %L', '%' || vin_number_param || '%'));\n        \n        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n        \n        IF result_count = 0 THEN\n            where_parts := where_parts[1:array_length(where_parts,1)-1];\n        END IF;\n    END IF;\n    \n    -- ============================================================================\n    -- STEP 7: PART PARAMETERS - Use part_param if provided, else free_query\n    -- ============================================================================\n    \n    IF part_param IS NOT NULL AND part_param != '' THEN\n        part_terms := string_to_array(part_param, ' ');\n        \n        FOR i IN REVERSE array_length(part_terms, 1)..1 LOOP\n            current_search := array_to_string(part_terms[1:i], ' ');\n            \n            where_parts := array_append(where_parts,\n                format('(ci.cat_num_desc ILIKE %L OR ci.part_family ILIKE %L)',\n                    '%' || current_search || '%', '%' || current_search || '%'));\n            \n            EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n            \n            IF result_count > 0 THEN EXIT; END IF;\n            where_parts := where_parts[1:array_length(where_parts,1)-1];\n        END LOOP;\n        \n        IF result_count = 0 THEN RETURN; END IF;\n    END IF;\n    \n    IF oem_param IS NOT NULL AND oem_param != '' THEN\n        where_parts := array_append(where_parts,\n            format('ci.oem ILIKE %L', '%' || oem_param || '%'));\n    END IF;\n    \n    IF family_param IS NOT NULL AND family_param != '' THEN\n        where_parts := array_append(where_parts,\n            format('ci.part_family ILIKE %L', '%' || family_param || '%'));\n    END IF;\n    \n    IF source_param IS NOT NULL AND source_param != '' THEN\n        where_parts := array_append(where_parts,\n            format('ci.source ILIKE %L', '%' || source_param || '%'));\n    END IF;\n    \n    IF free_query_param IS NOT NULL AND free_query_param != '' THEN\n        free_terms := string_to_array(free_query_param, ' ');\n        \n        FOR i IN REVERSE array_length(free_terms, 1)..1 LOOP\n            current_search := array_to_string(free_terms[1:i], ' ');\n            \n            where_parts := array_append(where_parts,\n                format('(ci.cat_num_desc ILIKE %L OR ci.part_family ILIKE %L)',\n                    '%' || current_search || '%', '%' || current_search || '%'));\n            \n            EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;\n            \n            IF result_count > 0 THEN EXIT; END IF;\n            where_parts := where_parts[1:array_length(where_parts,1)-1];\n        END LOOP;\n    END IF;\n    \n    -- ============================================================================\n    -- EXECUTE FINAL QUERY\n    -- ============================================================================\n    \n    final_where := array_to_string(where_parts, ' AND ');\n    IF final_where = '' THEN final_where := 'TRUE'; END IF;\n    \n    final_query := format('\n        SELECT \n            ci.id,\n            ci.cat_num_desc,\n            ci.supplier_name,\n            ci.pcode,\n            ci.price::NUMERIC,\n            ci.oem,\n            ci.make,\n            ci.model,\n            COALESCE(ci.part_family, ''לא מוגדר'') as part_family,\n            ci.side_position,\n            ci.version_date::TEXT,\n            COALESCE(ci.source, ''חליפי'') as availability,\n            ci.extracted_year,\n            ci.model_display,\n            10 as match_score,\n            ci.year_from,\n            ci.year_to\n        FROM catalog_items ci\n        WHERE %s\n        ORDER BY ci.price ASC NULLS LAST\n        LIMIT %s\n    ', final_where, limit_results);\n    \n    RETURN QUERY EXECUTE final_query;\nEND;\n$function$\n"
  }
]

test 2 

[
  {
    "pcode": "VBG29101562",
    "cat_num_desc": "תושבת שלדה - 92-04 H1",
    "make": "רמאה",
    "model": null,
    "part_family": "פנסים",
    "price": "1.04"
  },
  {
    "pcode": "VBE29101707",
    "cat_num_desc": "מתג אור בלם - 92-04 H1",
    "make": "רמאה",
    "model": null,
    "part_family": "פנסים",
    "price": "1.04"
  },
  {
    "pcode": "VBS291017931",
    "cat_num_desc": "נבה לדיפרנציאל אח' - 92-04 H1",
    "make": "רמאה",
    "model": null,
    "part_family": "פנסים",
    "price": "1.04"
  },
  {
    "pcode": "VBP2910179",
    "cat_num_desc": "בית פנס צד כנף אחורי 92-04 ~ H1",
    "make": "האמר",
    "model": null,
    "part_family": "פנסים",
    "price": "1.04"
  },
  {
    "pcode": "VB3225530",
    "cat_num_desc": "תפס לפנס ראשי שמ' - מאליבו 014-",
    "make": "שברולט אמ",
    "model": null,
    "part_family": "פנסים",
    "price": "12.3"
  }
]

Test 3 

[
  {
    "pcode": "VB4010941G",
    "cat_num_desc": "כנף אחורית ימין סיווק היבריידי-610",
    "make": "הונדה",
    "model": null,
    "part_family": "חלקי מרכב",
    "price": "8322.37"
  }
]

Test 4

[
  {
    "pcode": "VB107816621",
    "cat_num_desc": "המשך קשת כנף אח' שמ' (במגן) - ברונקו רפ",
    "side_position": "שמאל",
    "price": "1042223.17".  ASTRONOMIC PRICE  
  },
  {
    "pcode": "VB107816621",
    "cat_num_desc": "המשך קשת כנף אח' שמ' (במגן) - ברונקו רפ",
    "side_position": "שמאל",
    "price": "1042223.17"
  },
  {
    "pcode": "TYC175608009",
    "cat_num_desc": "מחזיר אור אח' שמ' - אקספלורר 016-",
    "side_position": "שמאל",
    "price": "184.72"
  },
  {
    "pcode": "VB1005718",
    "cat_num_desc": "ביטנה קד' שמ' אדג 11-",
    "side_position": "שמאל",
    "price": "500.0"
  },
  {
    "pcode": "VB10865762",
    "cat_num_desc": "כיסוי ערפל קד' שמ' - אקספלורר 016-017",
    "side_position": "שמאל",
    "price": "300.0"
  }
].  PRICE IN THE FIRST 2 IS NOT CORRECT 

TEST 5:

[
  {
    "test": "Test 5A: Data with שמאלית"
  }
]

Test 5B :

[
  {
    "pcode": "VB4010941G",
    "cat_num_desc": "כנף אחורית ימין סיווק היבריידי-610",
    "part_family": "חלקי מרכב",
    "price": "8322.37"
  }
]

Test  6;

[
  {
    "has_ach_abbreviated": 9392,
    "has_achori_full": 693,
    "has_shem_abbreviated": 12134,
    "has_shemal_full": 634,
    "has_yam_abbreviated": 11998,
    "has_yamin_full": 870
  }
]

