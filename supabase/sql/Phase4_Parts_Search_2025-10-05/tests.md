Check 1 :
[
  {
    "type": "TRIGGERS",
    "name": "RI_ConstraintTrigger_c_53849",
    "definition": "CREATE CONSTRAINT TRIGGER \"RI_ConstraintTrigger_c_53849\" AFTER INSERT ON public.catalog_items FROM suppliers NOT DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION \"RI_FKey_check_ins\"()"
  },
  {
    "type": "TRIGGERS",
    "name": "RI_ConstraintTrigger_c_53850",
    "definition": "CREATE CONSTRAINT TRIGGER \"RI_ConstraintTrigger_c_53850\" AFTER UPDATE ON public.catalog_items FROM suppliers NOT DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION \"RI_FKey_check_upd\"()"
  },
  {
    "type": "TRIGGERS",
    "name": "RI_ConstraintTrigger_c_59807",
    "definition": "CREATE CONSTRAINT TRIGGER \"RI_ConstraintTrigger_c_59807\" AFTER INSERT ON public.catalog_items FROM catalogs NOT DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION \"RI_FKey_check_ins\"()"
  },
  {
    "type": "TRIGGERS",
    "name": "RI_ConstraintTrigger_c_59808",
    "definition": "CREATE CONSTRAINT TRIGGER \"RI_ConstraintTrigger_c_59808\" AFTER UPDATE ON public.catalog_items FROM catalogs NOT DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION \"RI_FKey_check_upd\"()"
  },
  {
    "type": "TRIGGERS",
    "name": "hebrew_reversal_trigger",
    "definition": "CREATE TRIGGER hebrew_reversal_trigger BEFORE INSERT OR UPDATE ON public.catalog_items FOR EACH ROW EXECUTE FUNCTION process_hebrew_before_insert()"
  },
  {
    "type": "TRIGGERS",
    "name": "trigger_00_auto_fix_hebrew_reversal",
    "definition": "CREATE TRIGGER trigger_00_auto_fix_hebrew_reversal BEFORE INSERT OR UPDATE ON public.catalog_items FOR EACH ROW EXECUTE FUNCTION auto_fix_hebrew_reversal()"
  },
  {
    "type": "TRIGGERS",
    "name": "trigger_01_set_supplier_name",
    "definition": "CREATE TRIGGER trigger_01_set_supplier_name BEFORE INSERT OR UPDATE ON public.catalog_items FOR EACH ROW EXECUTE FUNCTION _set_supplier_name()"
  },
  {
    "type": "TRIGGERS",
    "name": "trigger_auto_fix_and_extract",
    "definition": "CREATE TRIGGER trigger_auto_fix_and_extract BEFORE INSERT OR UPDATE ON public.catalog_items FOR EACH ROW EXECUTE FUNCTION auto_fix_and_extract()"
  },
  {
    "type": "TRIGGERS",
    "name": "trigger_extract_model_and_year",
    "definition": "CREATE TRIGGER trigger_extract_model_and_year BEFORE INSERT OR UPDATE OF cat_num_desc, make ON public.catalog_items FOR EACH ROW EXECUTE FUNCTION extract_model_and_year()"
  }
]

Check 2 :

[
  {
    "type": "FUNCTIONS",
    "name": "auto_extract_catalog_data",
    "definition": "CREATE OR REPLACE FUNCTION public.auto_extract_catalog_data()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    txt           text;\n    yr            text[];\n    yr_from_i     int;\n    yr_to_i       int;\n    oem_m         text[];\n    model_code_m  text[];\n    model_m       text[];\nBEGIN\n    -- Normalize to lowercase\n    txt := lower(coalesce(new.cat_num_desc, ''));\n\n    -- Extract OEM: 8-14 alphanumeric (skip 'dep' prefixes)\n    SELECT regexp_match(txt, '([a-z0-9]{8,14})') INTO oem_m;\n    IF oem_m IS NOT NULL AND (new.oem IS NULL OR new.oem = '') THEN\n        IF left(oem_m[1], 3) <> 'dep' THEN\n            new.oem := oem_m[1];\n        END IF;\n    END IF;\n\n    -- Extract year range: 09-13 / 016-018 / 2009-2013\n    SELECT regexp_match(txt, '(\\d{2,4})\\s*[-–]\\s*(\\d{2,4})') INTO yr;\n    IF yr IS NOT NULL THEN\n        yr_from_i := CASE \n            WHEN length(yr[1]) = 2 THEN 2000 + yr[1]::int\n            WHEN length(yr[1]) = 3 THEN 2000 + yr[1]::int\n            ELSE yr[1]::int \n        END;\n        yr_to_i := CASE \n            WHEN length(yr[2]) = 2 THEN 2000 + yr[2]::int\n            WHEN length(yr[2]) = 3 THEN 2000 + yr[2]::int\n            ELSE yr[2]::int \n        END;\n\n        IF new.year_from IS NULL THEN new.year_from := yr_from_i; END IF;\n        IF new.year_to IS NULL THEN new.year_to := yr_to_i; END IF;\n        IF new.year_range IS NULL THEN new.year_range := yr[1] || '-' || yr[2]; END IF;\n    END IF;\n\n    -- Extract side: ימין/שמאל\n    IF (new.side_position IS NULL OR new.side_position = '') THEN\n        IF txt LIKE '%שמאל%' THEN new.side_position := 'שמאל'; END IF;\n        IF txt LIKE '%ימין%' THEN new.side_position := 'ימין'; END IF;\n    END IF;\n\n    -- Extract position: קדמי/אחורי\n    IF (new.front_rear IS NULL OR new.front_rear = '') THEN\n        IF txt LIKE '%קדמי%' THEN new.front_rear := 'קדמי'; END IF;\n        IF txt LIKE '%אחורי%' THEN new.front_rear := 'אחורי'; END IF;\n    END IF;\n\n    -- Extract part family (Hebrew)\n    IF (new.part_family IS NULL OR new.part_family = '') THEN\n        IF txt LIKE '%פנס%' THEN new.part_family := 'פנס'; END IF;\n        IF txt LIKE '%רפלקטור%' THEN new.part_family := 'רפלקטור'; END IF;\n        IF txt LIKE '%מראה%' THEN new.part_family := 'מראה'; END IF;\n        IF txt LIKE '%טמבון%' OR txt LIKE '%מגן%' THEN new.part_family := 'פגוש'; END IF;\n        IF txt LIKE '%גריל%' THEN new.part_family := 'גריל'; END IF;\n        IF new.part_family IS NULL THEN\n            IF txt LIKE '%כנף%' OR txt LIKE '%דלת%' OR txt LIKE '%מכסה מנוע%' OR txt LIKE '%מכסה תא מטען%' THEN \n                new.part_family := 'פח'; \n            END IF;\n        END IF;\n    END IF;\n\n    -- Extract model code (e70/f26/c6 etc)\n    SELECT regexp_match(txt, '([ecfg][0-9]{2})') INTO model_code_m;\n    IF model_code_m IS NOT NULL AND (new.model_code IS NULL OR new.model_code = '') THEN\n        new.model_code := upper(model_code_m[1]);\n    END IF;\n\n    -- Extract model\n    SELECT regexp_match(txt, '(a[0-9]{1,2}|s[0-9]{1,2}|q[0-9]{1,2}|x[0-9]{1,2}|t[0-9]{1,2}|גולף|פאסאט|פיאסטה|פוקוס|קורולה)')\n    INTO model_m;\n    IF model_m IS NOT NULL AND (new.model IS NULL OR new.model = '') THEN\n        new.model := upper(replace(model_m[1], ' ', ''));\n    END IF;\n\n    -- Extract engine type\n    IF (new.engine_type IS NULL OR new.engine_type = '') THEN\n        IF txt LIKE '%דיזל%' THEN new.engine_type := 'דיזל'; END IF;\n        IF txt LIKE '%בנזין%' THEN new.engine_type := 'בנזין'; END IF;\n        IF txt LIKE '%היבריד%' THEN new.engine_type := 'היברידי'; END IF;\n        IF txt LIKE '%חשמלי%' THEN new.engine_type := 'חשמלי'; END IF;\n    END IF;\n\n    -- Normalize make\n    IF new.make IS NOT NULL THEN\n        new.make := normalize_make(new.make);\n    END IF;\n\n    RETURN new;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "auto_fix_and_extract",
    "definition": "CREATE OR REPLACE FUNCTION public.auto_fix_and_extract()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    yr_match TEXT[];\n    yr_from_str TEXT;\n    yr_to_str TEXT;\n    yr_from_int INT;\n    yr_to_int INT;\nBEGIN\n    -- Extract part_name (first Hebrew word)\n    IF NEW.part_name IS NULL AND NEW.cat_num_desc IS NOT NULL THEN\n        NEW.part_name := (regexp_match(NEW.cat_num_desc, '^([\\u0590-\\u05FF]+(?:\\s+[\\u0590-\\u05FF]+)?)'))[1];\n    END IF;\n    \n    -- Extract year range with SAFE integer conversion\n    IF NEW.cat_num_desc IS NOT NULL THEN\n        -- Try pattern 1: XX-XX (e.g., 10-20)\n        yr_match := regexp_match(NEW.cat_num_desc, '(\\d{2,3})-(\\d{2,3})');\n        \n        IF yr_match IS NOT NULL THEN\n            yr_from_str := yr_match[1];\n            yr_to_str := yr_match[2];\n            \n            -- SAFE conversion: only convert if NOT empty and is numeric\n            IF yr_from_str IS NOT NULL AND yr_from_str != '' AND yr_from_str ~ '^\\d+$' THEN\n                yr_from_int := yr_from_str::INT;\n                \n                -- Normalize 3-digit years (810 → 10, 910 → 19)\n                IF yr_from_int >= 100 THEN\n                    yr_from_int := yr_from_int - (yr_from_int / 100) * 100;\n                END IF;\n                \n                -- Convert 2-digit to 4-digit year (10 → 2010)\n                IF yr_from_int < 100 THEN\n                    IF yr_from_int >= 90 THEN\n                        yr_from_int := 1900 + yr_from_int;\n                    ELSE\n                        yr_from_int := 2000 + yr_from_int;\n                    END IF;\n                END IF;\n                \n                NEW.year_from := yr_from_int;\n            END IF;\n            \n            -- SAFE conversion for year_to\n            IF yr_to_str IS NOT NULL AND yr_to_str != '' AND yr_to_str ~ '^\\d+$' THEN\n                yr_to_int := yr_to_str::INT;\n                \n                -- Normalize 3-digit years\n                IF yr_to_int >= 100 THEN\n                    yr_to_int := yr_to_int - (yr_to_int / 100) * 100;\n                END IF;\n                \n                -- Convert 2-digit to 4-digit year\n                IF yr_to_int < 100 THEN\n                    IF yr_to_int >= 90 THEN\n                        yr_to_int := 1900 + yr_to_int;\n                    ELSE\n                        yr_to_int := 2000 + yr_to_int;\n                    END IF;\n                END IF;\n                \n                NEW.year_to := yr_to_int;\n            END IF;\n            \n            -- Set extracted_year to year_from\n            IF NEW.year_from IS NOT NULL THEN\n                NEW.extracted_year := NEW.year_from::TEXT;\n            END IF;\n        END IF;\n    END IF;\n    \n    -- Extract model (common models only)\n    IF NEW.model IS NULL AND NEW.cat_num_desc IS NOT NULL THEN\n        NEW.model := CASE\n            WHEN NEW.cat_num_desc ILIKE '%קורולה%' THEN 'קורולה'\n            WHEN NEW.cat_num_desc ILIKE '%קאמרי%' THEN 'קאמרי'\n            WHEN NEW.cat_num_desc ILIKE '%יאריס%' THEN 'יאריס'\n            WHEN NEW.cat_num_desc ILIKE '%RAV4%' OR NEW.cat_num_desc ILIKE '%ראב%' THEN 'RAV4'\n            WHEN NEW.cat_num_desc ILIKE '%גולף%' THEN 'גולף'\n            WHEN NEW.cat_num_desc ILIKE '%פולו%' THEN 'פולו'\n            WHEN NEW.cat_num_desc ILIKE '%A3%' THEN 'A3'\n            WHEN NEW.cat_num_desc ILIKE '%A4%' THEN 'A4'\n            ELSE NULL\n        END;\n    END IF;\n    \n    -- Auto-categorize part_family\n    IF NEW.part_family IS NULL OR NEW.part_family = 'מקורי' THEN\n        IF NEW.part_name IS NOT NULL THEN\n            NEW.part_family := CASE \n                WHEN NEW.part_name ~ 'פנס|נורה|זרקור|מהבהב|איתות' THEN 'פנסים ותאורה'\n                WHEN NEW.part_name ~ 'דלת|כנף|מכסה מנוע|תא מטען' THEN 'דלתות וכנפיים'\n                WHEN NEW.part_name ~ 'מגן|פגוש|ספוילר|גריל' THEN 'מגנים ופגושים'\n                WHEN NEW.part_name ~ 'ידית|מנעול|ציר|בולם דלת|תומך' THEN 'חלקי מרכב'\n                WHEN NEW.part_name ~ 'מראה|חלון|שמשה|זכוכית' THEN 'חלונות ומראות'\n                WHEN NEW.part_name ~ 'גלגל|צמיג' THEN 'גלגלים וצמיגים'\n                ELSE 'לא מוגדר'\n            END;\n        END IF;\n    END IF;\n    \n    RETURN NEW;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "auto_fix_hebrew_reversal",
    "definition": "CREATE OR REPLACE FUNCTION public.auto_fix_hebrew_reversal()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    -- Fix reversed makes (if they start with reversed patterns)\n    IF NEW.make IS NOT NULL THEN\n        NEW.make := CASE\n            WHEN NEW.make = 'ינימ / וו.מ.ב' THEN 'BMW / מיני'\n            WHEN NEW.make = 'יאדנוי' THEN 'יונדאי'\n            WHEN NEW.make = 'הדזמ' THEN 'מזדה'\n            WHEN NEW.make = 'היק' THEN 'קיה'\n            WHEN NEW.make = 'ישיבוצימ' THEN 'מיצובישי'\n            WHEN NEW.make = 'הדנוה' THEN 'הונדה'\n            WHEN NEW.make = 'הדוקס' THEN 'סקודה'\n            WHEN NEW.make = 'תוזיפ' THEN 'פיזו'\n            ELSE NEW.make\n        END;\n    END IF;\n    \n    -- Fix reversed part_family (if they start with reversed patterns)\n    IF NEW.part_family IS NOT NULL THEN\n        NEW.part_family := CASE\n            WHEN NEW.part_family LIKE 'םישוגפו םינגמ%' THEN 'מגנים ופגושים'\n            WHEN NEW.part_family LIKE 'הרואתו םיסנפ%' THEN 'פנסים ותאורה'\n            WHEN NEW.part_family LIKE 'םייפנכו תותלד%' THEN 'דלתות וכנפיים'\n            WHEN NEW.part_family LIKE 'בכרמ יקלח%' THEN 'חלקי מרכב'\n            WHEN NEW.part_family LIKE 'תוארמו תונולח%' THEN 'חלונות ומראות'\n            WHEN NEW.part_family LIKE 'םיגלג%' THEN 'גלגלים'\n            WHEN NEW.part_family LIKE 'עונמ%' THEN 'מנוע'\n            WHEN NEW.part_family LIKE 'למשח%' THEN 'חשמל'\n            WHEN NEW.part_family LIKE 'םינפ יקלח%' THEN 'חלקי פנים'\n            ELSE NEW.part_family\n        END;\n    END IF;\n    \n    -- Fix cat_num_desc - reverse Hebrew portions while preserving English/numbers\n    -- This is the critical fix for descriptions\n    IF NEW.cat_num_desc IS NOT NULL AND NEW.cat_num_desc != '' THEN\n        -- Check if Hebrew is reversed (contains reversed patterns)\n        IF NEW.cat_num_desc LIKE '%ןגמ%' OR NEW.cat_num_desc LIKE '%סנפ%' \n           OR NEW.cat_num_desc LIKE '%ףנכ%' OR NEW.cat_num_desc LIKE '%הלד%'\n           OR NEW.cat_num_desc LIKE '%יארמ%' OR NEW.cat_num_desc LIKE '%תלד%' THEN\n            -- Reverse the entire string to fix Hebrew\n            NEW.cat_num_desc := reverse(NEW.cat_num_desc);\n        END IF;\n        \n        -- Fix specific reversed model names that might appear\n        NEW.cat_num_desc := REPLACE(NEW.cat_num_desc, 'ףלוג', 'גולף');\n        NEW.cat_num_desc := REPLACE(NEW.cat_num_desc, 'ולופ', 'פולו');\n        NEW.cat_num_desc := REPLACE(NEW.cat_num_desc, 'ןאוגיט', 'טיגואן');\n        NEW.cat_num_desc := REPLACE(NEW.cat_num_desc, 'הלורוק', 'קורולה');\n        NEW.cat_num_desc := REPLACE(NEW.cat_num_desc, 'ירמאק', 'קאמרי');\n        NEW.cat_num_desc := REPLACE(NEW.cat_num_desc, 'היבטקוא', 'אוקטביה');\n        NEW.cat_num_desc := REPLACE(NEW.cat_num_desc, 'ןואל', 'לאון');\n        NEW.cat_num_desc := REPLACE(NEW.cat_num_desc, 'הרוב', 'בורה');\n    END IF;\n    \n    RETURN NEW;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "enhanced_extract_batch_fixed",
    "definition": "CREATE OR REPLACE PROCEDURE public.enhanced_extract_batch_fixed(IN batch_limit integer DEFAULT 100)\n LANGUAGE plpgsql\nAS $procedure$\nDECLARE\n    processed_count INT := 0;\n    year_range_text TEXT;\n    year_array INT[];\nBEGIN\n    RAISE NOTICE 'Starting enhanced extraction for % items...', batch_limit;\n    \n    -- Process each item individually to avoid array indexing issues\n    FOR year_range_text IN \n        SELECT id FROM catalog_items \n        WHERE cat_num_desc IS NOT NULL \n        LIMIT batch_limit\n    LOOP\n        UPDATE catalog_items SET\n            oem = COALESCE(oem, extract_oem_from_desc(cat_num_desc)),\n            model = COALESCE(model, extract_model_from_desc(cat_num_desc)),\n            model_code = COALESCE(model_code, extract_model_code_from_desc(cat_num_desc)),\n            part_family = COALESCE(part_family, extract_part_family_from_desc(cat_num_desc)),\n            engine_volume = COALESCE(engine_volume, extract_side_from_desc(cat_num_desc)),\n            engine_code = COALESCE(engine_code, extract_position_from_desc(cat_num_desc))\n        WHERE id = year_range_text::UUID;\n        \n        processed_count := processed_count + 1;\n        \n        -- Progress update every 50 items\n        IF processed_count % 50 = 0 THEN\n            RAISE NOTICE 'Processed % items so far...', processed_count;\n        END IF;\n    END LOOP;\n    \n    RAISE NOTICE 'Enhanced extraction complete! Updated % rows.', processed_count;\nEND;\n$procedure$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "extract",
    "definition": "CREATE OR REPLACE FUNCTION pg_catalog.\"extract\"(text, date)\n RETURNS numeric\n LANGUAGE internal\n IMMUTABLE PARALLEL SAFE STRICT\nAS $function$extract_date$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "extract",
    "definition": "CREATE OR REPLACE FUNCTION pg_catalog.\"extract\"(text, time without time zone)\n RETURNS numeric\n LANGUAGE internal\n IMMUTABLE PARALLEL SAFE STRICT\nAS $function$extract_time$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "extract",
    "definition": "CREATE OR REPLACE FUNCTION pg_catalog.\"extract\"(text, timestamp with time zone)\n RETURNS numeric\n LANGUAGE internal\n STABLE PARALLEL SAFE STRICT\nAS $function$extract_timestamptz$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "extract",
    "definition": "CREATE OR REPLACE FUNCTION pg_catalog.\"extract\"(text, timestamp without time zone)\n RETURNS numeric\n LANGUAGE internal\n IMMUTABLE PARALLEL SAFE STRICT\nAS $function$extract_timestamp$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "extract",
    "definition": "CREATE OR REPLACE FUNCTION pg_catalog.\"extract\"(text, interval)\n RETURNS numeric\n LANGUAGE internal\n IMMUTABLE PARALLEL SAFE STRICT\nAS $function$extract_interval$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "extract",
    "definition": "CREATE OR REPLACE FUNCTION pg_catalog.\"extract\"(text, time with time zone)\n RETURNS numeric\n LANGUAGE internal\n IMMUTABLE PARALLEL SAFE STRICT\nAS $function$extract_timetz$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "extract_all_catnumdesc_data",
    "definition": "CREATE OR REPLACE PROCEDURE public.extract_all_catnumdesc_data()\n LANGUAGE plpgsql\nAS $procedure$\nDECLARE\n    catalog_record RECORD;\n    extracted_data RECORD;\n    processed_count INT := 0;\n    updated_count INT := 0;\nBEGIN\n    RAISE NOTICE 'Starting CatNumDesc data extraction...';\n    \n    -- Process all catalog items that have cat_num_desc but missing extracted fields\n    FOR catalog_record IN \n        SELECT id, cat_num_desc \n        FROM catalog_items \n        WHERE cat_num_desc IS NOT NULL \n        AND (oem IS NULL OR model IS NULL OR part_family IS NULL)\n        ORDER BY id\n    LOOP\n        processed_count := processed_count + 1;\n        \n        -- Extract data for this item\n        SELECT * INTO extracted_data \n        FROM parse_and_extract_catnumdesc(catalog_record.id);\n        \n        -- Update the catalog item with extracted data\n        UPDATE catalog_items SET\n            oem = COALESCE(oem, extracted_data.extracted_oem),\n            model = COALESCE(model, extracted_data.extracted_model),\n            year = COALESCE(year, CAST(extracted_data.extracted_year_from AS TEXT)),\n            trim = COALESCE(trim, \n                CASE \n                    WHEN extracted_data.extracted_year_from IS NOT NULL AND extracted_data.extracted_year_to IS NOT NULL \n                    THEN extracted_data.extracted_year_from::TEXT || '-' || extracted_data.extracted_year_to::TEXT\n                    ELSE NULL \n                END\n            ),\n            -- Add custom fields for extracted data\n            engine_volume = COALESCE(engine_volume, \n                CASE \n                    WHEN extracted_data.extracted_side IS NOT NULL \n                    THEN extracted_data.extracted_side\n                    ELSE engine_volume\n                END\n            ),\n            engine_code = COALESCE(engine_code,\n                CASE \n                    WHEN extracted_data.extracted_position IS NOT NULL \n                    THEN extracted_data.extracted_position\n                    ELSE engine_code\n                END\n            ),\n            part_family = COALESCE(part_family, extracted_data.extracted_part_family)\n        WHERE id = catalog_record.id;\n        \n        IF FOUND THEN\n            updated_count := updated_count + 1;\n        END IF;\n        \n        -- Progress indicator\n        IF processed_count % 1000 = 0 THEN\n            RAISE NOTICE 'Processed % items, updated %', processed_count, updated_count;\n            COMMIT;\n        END IF;\n    END LOOP;\n    \n    RAISE NOTICE 'CatNumDesc extraction complete! Processed: %, Updated: %', processed_count, updated_count;\nEND;\n$procedure$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "extract_model_and_year",
    "definition": "CREATE OR REPLACE FUNCTION public.extract_model_and_year()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    txt text;\n    year_match text[];\n    yr_from_str text;\n    yr_to_str text;\n    yr_from_int int;\n    yr_to_int int;\nBEGIN\n    txt := COALESCE(NEW.cat_num_desc, '');\n    \n    -- MODEL EXTRACTION (keep existing)\n    IF NEW.make = 'טויוטה' THEN\n        IF txt LIKE '%קורולה%' THEN NEW.model := 'קורולה';\n        ELSIF txt LIKE '%קאמרי%' THEN NEW.model := 'קאמרי';\n        ELSIF txt LIKE '%פריוס%' THEN NEW.model := 'פריוס';\n        END IF;\n    ELSIF NEW.make = 'VAG' OR NEW.make = 'אודי' THEN\n        IF txt LIKE '%A3%' THEN NEW.model := 'A3';\n        ELSIF txt LIKE '%A4%' THEN NEW.model := 'A4';\n        ELSIF txt LIKE '%A5%' THEN NEW.model := 'A5';\n        ELSIF txt LIKE '%Q3%' THEN NEW.model := 'Q3';\n        ELSIF txt LIKE '%Q5%' THEN NEW.model := 'Q5';\n        END IF;\n    ELSIF NEW.make = 'פולקסווגן' THEN\n        IF txt LIKE '%גולף%' THEN NEW.model := 'גולף';\n        ELSIF txt LIKE '%פולו%' THEN NEW.model := 'פולו';\n        ELSIF txt LIKE '%טיגואן%' THEN NEW.model := 'טיגואן';\n        END IF;\n    END IF;\n    \n    -- YEAR EXTRACTION - improved patterns\n    -- Pattern 1: 2-digit dash 2-digit (e.g., 15-19, 89-01)\n    SELECT regexp_match(txt, '(\\d{2})-(\\d{2})(?:\\D|$)') INTO year_match;\n    \n    -- Pattern 2: 3-digit dash 3-digit (e.g., 015-019)\n    IF year_match IS NULL THEN\n        SELECT regexp_match(txt, '(\\d{3})-(\\d{3})(?:\\D|$)') INTO year_match;\n    END IF;\n    \n    -- Pattern 3: 3-digit followed by dash and space/end (e.g., 013- )\n    IF year_match IS NULL THEN\n        SELECT regexp_match(txt, '[^\\d](\\d{3})-(?:\\s|$)') INTO year_match;\n    END IF;\n    \n    -- Pattern 4: space/dash followed by 3-digit year (e.g., -019 or \" 019\")\n    IF year_match IS NULL THEN\n        SELECT regexp_match(txt, '[\\s-](\\d{3})(?:\\s|$|-)') INTO year_match;\n    END IF;\n    \n    IF year_match IS NOT NULL THEN\n        yr_from_str := year_match[1];\n        yr_to_str := year_match[2];\n        \n        IF yr_from_str IS NOT NULL AND yr_from_str ~ '^\\d+$' THEN\n            IF length(yr_from_str) = 2 THEN\n                IF yr_from_str::int >= 80 THEN\n                    yr_from_int := 1900 + yr_from_str::int;\n                ELSE\n                    yr_from_int := 2000 + yr_from_str::int;\n                END IF;\n            ELSIF length(yr_from_str) = 3 THEN\n                yr_from_int := 2000 + yr_from_str::int;\n            END IF;\n            \n            IF yr_from_int >= 1980 AND yr_from_int <= 2030 THEN\n                NEW.year_from := yr_from_int;\n                NEW.year_to := yr_from_int;\n            END IF;\n        END IF;\n        \n        IF yr_to_str IS NOT NULL AND yr_to_str ~ '^\\d+$' THEN\n            IF length(yr_to_str) = 2 THEN\n                IF yr_to_str::int >= 80 THEN\n                    yr_to_int := 1900 + yr_to_str::int;\n                ELSE\n                    yr_to_int := 2000 + yr_to_str::int;\n                END IF;\n            ELSIF length(yr_to_str) = 3 THEN\n                yr_to_int := 2000 + yr_to_str::int;\n            END IF;\n            \n            IF yr_to_int >= 1980 AND yr_to_int <= 2030 THEN\n                NEW.year_to := yr_to_int;\n            END IF;\n        END IF;\n    END IF;\n    \n    RETURN NEW;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "extract_model_code_from_desc",
    "definition": "CREATE OR REPLACE FUNCTION public.extract_model_code_from_desc(desc_text text)\n RETURNS text\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nDECLARE\n    model_code_result TEXT;\nBEGIN\n    -- Look for BMW generation codes first (E70, F30, G20, etc.)\n    SELECT (regexp_match(desc_text, '\\b([EFG][0-9]{2})\\b', 'i'))[1] INTO model_code_result;\n    \n    IF model_code_result IS NOT NULL THEN\n        RETURN UPPER(model_code_result);\n    END IF;\n    \n    -- Look for VW/Audi generation codes (MK6, C6, B8, etc.)\n    SELECT (regexp_match(desc_text, '\\b(MK[1-9]|C[4-8]|B[5-9]|8[A-Z])\\b', 'i'))[1] INTO model_code_result;\n    \n    IF model_code_result IS NOT NULL THEN\n        RETURN UPPER(model_code_result);\n    END IF;\n    \n    -- Check dictionary for body codes\n    SELECT body_code INTO model_code_result\n    FROM dict_models dm\n    WHERE UPPER(desc_text) LIKE '%' || UPPER(dm.synonym) || '%'\n    AND dm.body_code IS NOT NULL\n    ORDER BY LENGTH(dm.synonym) DESC\n    LIMIT 1;\n    \n    RETURN model_code_result;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "extract_model_from_desc",
    "definition": "CREATE OR REPLACE FUNCTION public.extract_model_from_desc(desc_text text)\n RETURNS text\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nDECLARE\n    model_result TEXT;\nBEGIN\n    -- Check dictionary first\n    SELECT canonical INTO model_result\n    FROM dict_models dm\n    WHERE UPPER(desc_text) LIKE '%' || UPPER(dm.synonym) || '%'\n    ORDER BY LENGTH(dm.synonym) DESC\n    LIMIT 1;\n    \n    RETURN model_result;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "extract_oem_from_desc",
    "definition": "CREATE OR REPLACE FUNCTION public.extract_oem_from_desc(desc_text text)\n RETURNS text\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nDECLARE\n    oem_result TEXT;\nBEGIN\n    -- Look for alphanumeric codes 8-14 characters at end of string\n    SELECT (regexp_match(desc_text, '([A-Z0-9]{8,14})\\s*$'))[1] INTO oem_result;\n    \n    IF oem_result IS NOT NULL THEN\n        RETURN oem_result;\n    END IF;\n    \n    -- Look for alphanumeric codes 8+ characters anywhere\n    SELECT (regexp_match(desc_text, '([A-Z0-9]{8,})'))[1] INTO oem_result;\n    \n    RETURN oem_result;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "extract_part_family_fixed",
    "definition": "CREATE OR REPLACE FUNCTION public.extract_part_family_fixed(desc_text text)\n RETURNS text\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nDECLARE\n    fixed_text TEXT;\nBEGIN\n    IF desc_text IS NULL OR desc_text = '' THEN\n        RETURN NULL;\n    END IF;\n    \n    -- Fix the reversed Hebrew first\n    fixed_text := fix_hebrew_words(desc_text);\n    fixed_text := lower(fixed_text);\n    \n    -- Now extract part families from corrected text\n    IF position('פנס' in fixed_text) > 0 OR position('פנסים' in fixed_text) > 0 THEN\n        RETURN 'פנסים';\n    END IF;\n    \n    IF position('כנף' in fixed_text) > 0 THEN\n        RETURN 'כנפים';\n    END IF;\n    \n    IF position('איתות' in fixed_text) > 0 THEN\n        RETURN 'איתות';\n    END IF;\n    \n    IF position('מראה' in fixed_text) > 0 OR position('מראות' in fixed_text) > 0 THEN\n        RETURN 'מראות';\n    END IF;\n    \n    IF position('דלת' in fixed_text) > 0 OR position('דלתות' in fixed_text) > 0 THEN\n        RETURN 'דלתות';\n    END IF;\n    \n    IF position('פגוש' in fixed_text) > 0 OR position('פגושים' in fixed_text) > 0 THEN\n        RETURN 'פגושים';\n    END IF;\n    \n    RETURN 'כללי';\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "extract_part_family_from_desc",
    "definition": "CREATE OR REPLACE FUNCTION public.extract_part_family_from_desc(desc_text text)\n RETURNS text\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nDECLARE\n    family_result TEXT;\nBEGIN\n    -- LIGHTING PARTS (פנסים ותאורה)\n    IF position('פנס' in desc_text) > 0 OR position('סנפ' in desc_text) > 0 \n       OR position('רוטקלפר' in desc_text) > 0 OR position('רטקלפר' in desc_text) > 0\n       OR position('תרואת' in desc_text) > 0 OR position('תאורה' in desc_text) > 0\n       OR position('זנב' in desc_text) > 0 OR position('בנז' in desc_text) > 0\n       OR position('ךוניח' in desc_text) > 0 OR position('חניכה' in desc_text) > 0 THEN\n        RETURN 'Lighting';\n    END IF;\n    \n    -- COOLING SYSTEM PARTS (מערכת קירור)\n    IF position('רוטאידר' in desc_text) > 0 OR position('רוטידאר' in desc_text) > 0\n       OR position('רורק' in desc_text) > 0 OR position('קירור' in desc_text) > 0\n       OR position('םימ' in desc_text) > 0 OR position('מים' in desc_text) > 0\n       OR position('רסנדנוק' in desc_text) > 0 OR position('קונדנסר' in desc_text) > 0\n       OR position('ךרוונמ' in desc_text) > 0 OR position('מאוורר' in desc_text) > 0 THEN\n        RETURN 'Cooling';\n    END IF;\n    \n    -- ENGINE PARTS (חלקי מנוע)\n    IF position('עונמ' in desc_text) > 0 OR position('מנוע' in desc_text) > 0\n       OR position('ץולחמ' in desc_text) > 0 OR position('מלחץ' in desc_text) > 0\n       OR position('ןמש' in desc_text) > 0 OR position('שמן' in desc_text) > 0\n       OR position('ןמז' in desc_text) > 0 OR position('זמן' in desc_text) > 0\n       OR position('שיג' in desc_text) > 0 OR position('גיש' in desc_text) > 0 THEN\n        RETURN 'Engine';\n    END IF;\n    \n    -- TRANSMISSION PARTS (תיבת הילוכים)\n    IF position('ךוליה' in desc_text) > 0 OR position('הילוך' in desc_text) > 0\n       OR position('םיכוליה' in desc_text) > 0 OR position('הילוכים' in desc_text) > 0\n       OR position('טמוטוא' in desc_text) > 0 OR position('אוטומט' in desc_text) > 0\n       OR position('הביט' in desc_text) > 0 OR position('תיבה' in desc_text) > 0\n       OR position('ץמצמ' in desc_text) > 0 OR position('מצמד' in desc_text) > 0 THEN\n        RETURN 'Transmission';\n    END IF;\n    \n    -- SUSPENSION PARTS (מתלים)\n    IF position('ילתמ' in desc_text) > 0 OR position('מתלי' in desc_text) > 0\n       OR position('םילתמ' in desc_text) > 0 OR position('מתלים' in desc_text) > 0\n       OR position('רזיטומרא' in desc_text) > 0 OR position('אמורטיזר' in desc_text) > 0\n       OR position('ץיפק' in desc_text) > 0 OR position('קפיץ' in desc_text) > 0\n       OR position('טוט' in desc_text) > 0 OR position('טוט' in desc_text) > 0 THEN\n        RETURN 'Suspension';\n    END IF;\n    \n    -- BRAKING SYSTEM (מערכת בלמים)\n    IF position('םלב' in desc_text) > 0 OR position('בלם' in desc_text) > 0\n       OR position('םימלב' in desc_text) > 0 OR position('בלמים' in desc_text) > 0\n       OR position('קסיד' in desc_text) > 0 OR position('דיסק' in desc_text) > 0\n       OR position('תודיפר' in desc_text) > 0 OR position('רפידות' in desc_text) > 0\n       OR position('לגרד' in desc_text) > 0 OR position('דרגל' in desc_text) > 0 THEN\n        RETURN 'Braking';\n    END IF;\n    \n    -- BODY PARTS (חלקי מרכב)\n    IF position('תלד' in desc_text) > 0 OR position('דלת' in desc_text) > 0\n       OR position('ףנכ' in desc_text) > 0 OR position('כנף' in desc_text) > 0\n       OR position('שוגפ' in desc_text) > 0 OR position('פגוש' in desc_text) > 0\n       OR position('ופק' in desc_text) > 0 OR position('קפו' in desc_text) > 0\n       OR position('גג' in desc_text) > 0 OR position('ךג' in desc_text) > 0\n       OR position('ןעטמ' in desc_text) > 0 OR position('מטען' in desc_text) > 0\n       OR position('בכרמ' in desc_text) > 0 OR position('מרכב' in desc_text) > 0 THEN\n        RETURN 'Body';\n    END IF;\n    \n    -- MIRRORS (מראות)\n    IF position('הארמ' in desc_text) > 0 OR position('מראה' in desc_text) > 0\n       OR position('תוארמ' in desc_text) > 0 OR position('מראות' in desc_text) > 0\n       OR position('יטרפ' in desc_text) > 0 OR position('פרטי' in desc_text) > 0 THEN\n        RETURN 'Mirrors';\n    END IF;\n    \n    -- GLASS PARTS (זכוכית)\n    IF position('תיכוכז' in desc_text) > 0 OR position('זכוכית' in desc_text) > 0\n       OR position('ולח' in desc_text) > 0 OR position('חלון' in desc_text) > 0\n       OR position('הכשמש' in desc_text) > 0 OR position('שמשה' in desc_text) > 0 THEN\n        RETURN 'Glass';\n    END IF;\n    \n    -- WHEELS AND TIRES (גלגלים וצמיגים)\n    IF position('לגלג' in desc_text) > 0 OR position('גלגל' in desc_text) > 0\n       OR position('םילגלג' in desc_text) > 0 OR position('גלגלים' in desc_text) > 0\n       OR position('גימצ' in desc_text) > 0 OR position('צמיג' in desc_text) > 0\n       OR position('םיגימצ' in desc_text) > 0 OR position('צמיגים' in desc_text) > 0\n       OR position('קושיח' in desc_text) > 0 OR position('חישוק' in desc_text) > 0 THEN\n        RETURN 'Wheels';\n    END IF;\n    \n    -- FILTERS (מסננים)\n    IF position('ןנסמ' in desc_text) > 0 OR position('מסנן' in desc_text) > 0\n       OR position('םיננסמ' in desc_text) > 0 OR position('מסננים' in desc_text) > 0\n       OR position('רטליפ' in desc_text) > 0 OR position('פילטר' in desc_text) > 0\n       OR position('ריוא' in desc_text) > 0 OR position('אוויר' in desc_text) > 0 THEN\n        RETURN 'Filters';\n    END IF;\n    \n    -- ELECTRICAL PARTS (חלקים חשמליים)\n    IF position('למשח' in desc_text) > 0 OR position('חשמל' in desc_text) > 0\n       OR position('יילמשח' in desc_text) > 0 OR position('חשמלי' in desc_text) > 0\n       OR position('הללוס' in desc_text) > 0 OR position('סוללה' in desc_text) > 0\n       OR position('תמצח' in desc_text) > 0 OR position('חמצת' in desc_text) > 0 THEN\n        RETURN 'Electrical';\n    END IF;\n    \n    -- Check English dictionary terms\n    SELECT part_family INTO family_result\n    FROM dict_parts dp\n    WHERE UPPER(desc_text) LIKE '%' || UPPER(dp.synonym) || '%'\n    AND dp.part_family IS NOT NULL\n    ORDER BY LENGTH(dp.synonym) DESC\n    LIMIT 1;\n    \n    RETURN family_result;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "extract_part_name",
    "definition": "CREATE OR REPLACE FUNCTION public.extract_part_name(desc_text text)\n RETURNS text\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nDECLARE\n    result TEXT;\n    -- Common part patterns\n    patterns TEXT[] := ARRAY[\n        'תלד', 'דלת',\n        'ףנכ', 'כנף',\n        'ןגמ', 'מגן',\n        'סנפ', 'פנס',\n        'הארמ', 'מראה', 'יאר', 'ראי',\n        'לפרע', 'ערפל',\n        'תותיא', 'איתות',\n        'טפט',\n        'םלוב', 'בולם',\n        'טושיק', 'קישוט',\n        'יוסיכ', 'כיסוי',\n        'רוצע', 'עוצר',\n        'לבכ', 'כבל',\n        'תבשות', 'תושבת',\n        'ספ', 'פס',\n        'עורז', 'זרוע',\n        'החפ', 'פח',\n        'השמש', 'שמשה',\n        'ללוס', 'סולל'\n    ];\n    pattern TEXT;\nBEGIN\n    result := desc_text;\n    \n    -- Try to find any of the patterns\n    FOREACH pattern IN ARRAY patterns LOOP\n        IF desc_text ILIKE '%' || pattern || '%' THEN\n            -- Extract the part name based on pattern location\n            CASE pattern\n                WHEN 'תלד' THEN result := 'דלת';\n                WHEN 'דלת' THEN result := 'דלת';\n                WHEN 'ףנכ' THEN result := 'כנף';\n                WHEN 'כנף' THEN result := 'כנף';\n                WHEN 'ןגמ' THEN result := 'מגן';\n                WHEN 'מגן' THEN result := 'מגן';\n                WHEN 'סנפ' THEN result := 'פנס';\n                WHEN 'פנס' THEN result := 'פנס';\n                WHEN 'הארמ' THEN result := 'מראה';\n                WHEN 'מראה' THEN result := 'מראה';\n                WHEN 'יאר' THEN result := 'ראי';\n                WHEN 'ראי' THEN result := 'ראי';\n                WHEN 'לפרע' THEN result := 'ערפל';\n                WHEN 'ערפל' THEN result := 'ערפל';\n                WHEN 'תותיא' THEN result := 'איתות';\n                WHEN 'איתות' THEN result := 'איתות';\n                WHEN 'טפט' THEN result := 'טפט';\n                WHEN 'םלוב' THEN result := 'בולם';\n                WHEN 'בולם' THEN result := 'בולם';\n                WHEN 'טושיק' THEN result := 'קישוט';\n                WHEN 'קישוט' THEN result := 'קישוט';\n                WHEN 'יוסיכ' THEN result := 'כיסוי';\n                WHEN 'כיסוי' THEN result := 'כיסוי';\n                WHEN 'רוצע' THEN result := 'עוצר';\n                WHEN 'עוצר' THEN result := 'עוצר';\n                WHEN 'לבכ' THEN result := 'כבל';\n                WHEN 'כבל' THEN result := 'כבל';\n                WHEN 'תבשות' THEN result := 'תושבת';\n                WHEN 'תושבת' THEN result := 'תושבת';\n                WHEN 'ספ' THEN result := 'פס';\n                WHEN 'פס' THEN result := 'פס';\n                WHEN 'עורז' THEN result := 'זרוע';\n                WHEN 'זרוע' THEN result := 'זרוע';\n                WHEN 'החפ' THEN result := 'פח';\n                WHEN 'פח' THEN result := 'פח';\n                WHEN 'השמש' THEN result := 'שמשה';\n                WHEN 'שמשה' THEN result := 'שמשה';\n                WHEN 'ללוס' THEN result := 'סולל';\n                WHEN 'סולל' THEN result := 'סולל';\n                ELSE result := pattern;\n            END CASE;\n            EXIT; -- Found a match, exit loop\n        END IF;\n    END LOOP;\n    \n    RETURN result;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "extract_part_name_from_desc",
    "definition": "CREATE OR REPLACE FUNCTION public.extract_part_name_from_desc(cat_desc text)\n RETURNS text\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nDECLARE\n    part_patterns TEXT[] := ARRAY[\n        'תלד|דלת', 'ףנכ|כנף', 'ןגמ|מגן', 'סנפ|פנס', \n        'יאר|ראי|הארמ|מראה', 'לגלג|גלגל', 'עונמ|מנוע',\n        'השמש|שמשה', 'ןולח|חלון', 'טושיק|קישוט'\n    ];\n    pattern TEXT;\n    match TEXT;\nBEGIN\n    IF cat_desc IS NULL THEN RETURN NULL; END IF;\n    \n    FOREACH pattern IN ARRAY part_patterns LOOP\n        match := substring(cat_desc from pattern);\n        IF match IS NOT NULL THEN\n            RETURN extract_core_part_term(match);\n        END IF;\n    END LOOP;\n    \n    RETURN NULL;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "extract_position_fixed",
    "definition": "CREATE OR REPLACE FUNCTION public.extract_position_fixed(desc_text text)\n RETURNS text\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nDECLARE\n    fixed_text TEXT;\nBEGIN\n    IF desc_text IS NULL OR desc_text = '' THEN\n        RETURN NULL;\n    END IF;\n    \n    fixed_text := fix_hebrew_words(desc_text);\n    fixed_text := lower(fixed_text);\n    \n    IF position('קדמי' in fixed_text) > 0 OR position('קד''' in fixed_text) > 0 THEN\n        RETURN 'קדמי';\n    END IF;\n    \n    IF position('אחורי' in fixed_text) > 0 OR position('אח''' in fixed_text) > 0 THEN\n        RETURN 'אחורי';\n    END IF;\n    \n    RETURN NULL;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "extract_position_from_desc",
    "definition": "CREATE OR REPLACE FUNCTION public.extract_position_from_desc(desc_text text)\n RETURNS text\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nBEGIN\n    -- Check for front variations\n    IF desc_text ILIKE '%קד''%' OR desc_text ILIKE '%קדמ%' OR desc_text ILIKE '%דק%' THEN\n        RETURN 'קדמי';\n    -- Check for rear variations\n    ELSIF desc_text ILIKE '%אח''%' OR desc_text ILIKE '%אחו%' OR desc_text ILIKE '%חא%' THEN\n        RETURN 'אחורי';\n    ELSE\n        RETURN NULL;\n    END IF;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "extract_side_fixed",
    "definition": "CREATE OR REPLACE FUNCTION public.extract_side_fixed(desc_text text)\n RETURNS text\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nDECLARE\n    fixed_text TEXT;\nBEGIN\n    IF desc_text IS NULL OR desc_text = '' THEN\n        RETURN NULL;\n    END IF;\n    \n    fixed_text := fix_hebrew_words(desc_text);\n    fixed_text := lower(fixed_text);\n    \n    IF position('שמאל' in fixed_text) > 0 OR position('שמ''' in fixed_text) > 0 THEN\n        RETURN 'שמאל';\n    END IF;\n    \n    IF position('ימין' in fixed_text) > 0 OR position('ים''' in fixed_text) > 0 THEN\n        RETURN 'ימין';\n    END IF;\n    \n    RETURN NULL;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "extract_side_from_desc",
    "definition": "CREATE OR REPLACE FUNCTION public.extract_side_from_desc(cat_desc text)\n RETURNS text\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nBEGIN\n    IF cat_desc IS NULL THEN RETURN NULL; END IF;\n    \n    -- Hebrew patterns\n    IF cat_desc ~* 'ימי|ימין|ימני' THEN RETURN 'ימין'; END IF;\n    IF cat_desc ~* 'שמא|שמאל|שמאלי' THEN RETURN 'שמאל'; END IF;\n    IF cat_desc ~* 'קדמ|קדמי|קדמית' THEN RETURN 'קדמי'; END IF;\n    IF cat_desc ~* 'אחו|אחור|אחורי' THEN RETURN 'אחורי'; END IF;\n    \n    -- English patterns\n    IF cat_desc ~* '\\yRIGHT\\y|\\yRH\\y|\\yR\\.H\\y' THEN RETURN 'ימין'; END IF;\n    IF cat_desc ~* '\\yLEFT\\y|\\yLH\\y|\\yL\\.H\\y' THEN RETURN 'שמאל'; END IF;\n    IF cat_desc ~* '\\yFRONT\\y|\\yFR\\y' THEN RETURN 'קדמי'; END IF;\n    IF cat_desc ~* '\\yREAR\\y|\\yRR\\y|\\yBACK\\y' THEN RETURN 'אחורי'; END IF;\n    \n    RETURN NULL;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "extract_simple_make",
    "definition": "CREATE OR REPLACE FUNCTION public.extract_simple_make(desc_text text)\n RETURNS text\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nBEGIN\n    IF desc_text IS NULL OR desc_text = '' THEN\n        RETURN NULL;\n    END IF;\n    \n    desc_text := lower(desc_text);\n    \n    -- Check for known makes\n    IF position('טויוטה' in desc_text) > 0 OR position('toyota' in desc_text) > 0 THEN\n        RETURN 'Toyota';\n    END IF;\n    \n    IF position('פולקסווגן' in desc_text) > 0 OR position('volkswagen' in desc_text) > 0 OR position('vw' in desc_text) > 0 THEN\n        RETURN 'Volkswagen';\n    END IF;\n    \n    IF position('אאודי' in desc_text) > 0 OR position('audi' in desc_text) > 0 THEN\n        RETURN 'Audi';\n    END IF;\n    \n    IF position('במוו' in desc_text) > 0 OR position('bmw' in desc_text) > 0 THEN\n        RETURN 'BMW';\n    END IF;\n    \n    IF position('מרצדס' in desc_text) > 0 OR position('mercedes' in desc_text) > 0 THEN\n        RETURN 'Mercedes-Benz';\n    END IF;\n    \n    IF position('פורד' in desc_text) > 0 OR position('ford' in desc_text) > 0 THEN\n        RETURN 'Ford';\n    END IF;\n    \n    IF position('רנו' in desc_text) > 0 OR position('renault' in desc_text) > 0 THEN\n        RETURN 'Renault';\n    END IF;\n    \n    RETURN NULL;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "extract_simple_part_family",
    "definition": "CREATE OR REPLACE FUNCTION public.extract_simple_part_family(desc_text text)\n RETURNS text\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nBEGIN\n    IF desc_text IS NULL OR desc_text = '' THEN\n        RETURN NULL;\n    END IF;\n    \n    -- Convert to lowercase for comparison\n    desc_text := lower(desc_text);\n    \n    -- Hebrew lighting terms\n    IF position('פנס' in desc_text) > 0 OR position('light' in desc_text) > 0 THEN\n        RETURN 'lighting';\n    END IF;\n    \n    -- Hebrew body parts\n    IF position('כנף' in desc_text) > 0 OR position('wing' in desc_text) > 0 OR position('panel' in desc_text) > 0 THEN\n        RETURN 'body';\n    END IF;\n    \n    -- Hebrew bumpers\n    IF position('פגוש' in desc_text) > 0 OR position('bumper' in desc_text) > 0 THEN\n        RETURN 'bumper';\n    END IF;\n    \n    -- Hebrew mirrors\n    IF position('מראה' in desc_text) > 0 OR position('mirror' in desc_text) > 0 THEN\n        RETURN 'mirror';\n    END IF;\n    \n    -- Hebrew doors\n    IF position('דלת' in desc_text) > 0 OR position('door' in desc_text) > 0 THEN\n        RETURN 'door';\n    END IF;\n    \n    -- Hebrew signals\n    IF position('איתות' in desc_text) > 0 OR position('signal' in desc_text) > 0 THEN\n        RETURN 'signal';\n    END IF;\n    \n    RETURN 'general';\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "extract_simple_position",
    "definition": "CREATE OR REPLACE FUNCTION public.extract_simple_position(desc_text text)\n RETURNS text\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nBEGIN\n    IF desc_text IS NULL OR desc_text = '' THEN\n        RETURN NULL;\n    END IF;\n    \n    desc_text := lower(desc_text);\n    \n    -- Hebrew front position\n    IF position('קדמי' in desc_text) > 0 OR position('front' in desc_text) > 0 THEN\n        RETURN 'קדמי';\n    END IF;\n    \n    -- Hebrew rear position\n    IF position('אחורי' in desc_text) > 0 OR position('rear' in desc_text) > 0 THEN\n        RETURN 'אחורי';\n    END IF;\n    \n    RETURN NULL;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "extract_simple_side",
    "definition": "CREATE OR REPLACE FUNCTION public.extract_simple_side(desc_text text)\n RETURNS text\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nBEGIN\n    IF desc_text IS NULL OR desc_text = '' THEN\n        RETURN NULL;\n    END IF;\n    \n    desc_text := lower(desc_text);\n    \n    -- Hebrew left side\n    IF position('שמאל' in desc_text) > 0 OR position('left' in desc_text) > 0 THEN\n        RETURN 'שמאל';\n    END IF;\n    \n    -- Hebrew right side\n    IF position('ימין' in desc_text) > 0 OR position('right' in desc_text) > 0 THEN\n        RETURN 'ימין';\n    END IF;\n    \n    RETURN NULL;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "extract_simple_years",
    "definition": "CREATE OR REPLACE FUNCTION public.extract_simple_years(desc_text text)\n RETURNS text\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nDECLARE\n    year_match TEXT;\nBEGIN\n    IF desc_text IS NULL OR desc_text = '' THEN\n        RETURN NULL;\n    END IF;\n    \n    -- Look for pattern like \"016-018\"\n    SELECT substring(desc_text from '\\d{3}-\\d{3}') INTO year_match;\n    IF year_match IS NOT NULL THEN\n        RETURN '20' || substring(year_match from 1 for 2) || '-20' || substring(year_match from 5 for 2);\n    END IF;\n    \n    -- Look for pattern like \"08-10\"\n    SELECT substring(desc_text from '\\d{2}-\\d{2}') INTO year_match;\n    IF year_match IS NOT NULL THEN\n        RETURN '20' || year_match;\n    END IF;\n    \n    -- Look for single year like \"T5 08\"\n    SELECT substring(desc_text from 'T\\d+ (\\d{2})') INTO year_match;\n    IF year_match IS NOT NULL THEN\n        RETURN '20' || year_match;\n    END IF;\n    \n    RETURN NULL;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "extract_trim_from_desc",
    "definition": "CREATE OR REPLACE FUNCTION public.extract_trim_from_desc(desc_text text)\n RETURNS text\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nBEGIN\n    -- Look for common trim levels in Hebrew/English\n    IF position('בייסיק' in desc_text) > 0 OR UPPER(desc_text) LIKE '%BASIC%' THEN\n        RETURN 'Basic';\n    END IF;\n    \n    IF position('קומפורט' in desc_text) > 0 OR UPPER(desc_text) LIKE '%COMFORT%' THEN\n        RETURN 'Comfort';\n    END IF;\n    \n    IF position('ספורט' in desc_text) > 0 OR UPPER(desc_text) LIKE '%SPORT%' THEN\n        RETURN 'Sport';\n    END IF;\n    \n    IF position('יוקרה' in desc_text) > 0 OR UPPER(desc_text) LIKE '%LUXURY%' THEN\n        RETURN 'Luxury';\n    END IF;\n    \n    IF UPPER(desc_text) LIKE '%EXECUTIVE%' THEN\n        RETURN 'Executive';\n    END IF;\n    \n    IF UPPER(desc_text) LIKE '%PREMIUM%' THEN\n        RETURN 'Premium';\n    END IF;\n    \n    RETURN NULL;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "extract_year_range_as_text",
    "definition": "CREATE OR REPLACE FUNCTION public.extract_year_range_as_text(desc_text text)\n RETURNS text\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nDECLARE\n    year_match TEXT[];\nBEGIN\n    -- Look for year range pattern\n    SELECT regexp_match(desc_text, '(\\d{4})-(\\d{4})') INTO year_match;\n    \n    IF year_match IS NOT NULL THEN\n        RETURN year_match[1] || '-' || year_match[2];\n    END IF;\n    \n    -- Look for single year\n    SELECT regexp_match(desc_text, '(20\\d{2})') INTO year_match;\n    IF year_match IS NOT NULL THEN\n        RETURN year_match[1];\n    END IF;\n    \n    RETURN NULL;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "extract_year_range_from_desc",
    "definition": "CREATE OR REPLACE FUNCTION public.extract_year_range_from_desc(desc_text text)\n RETURNS integer[]\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nDECLARE\n    year_match TEXT[];\n    year_result INT[] := ARRAY[NULL::INT, NULL::INT];\n    y1 INT;\n    y2 INT;\nBEGIN\n    -- Check dictionary patterns first\n    SELECT ARRAY[year_from, year_to] INTO year_result\n    FROM dict_year_patterns dyp\n    WHERE desc_text ~ dyp.pattern\n    LIMIT 1;\n    \n    IF year_result[1] IS NOT NULL THEN\n        RETURN year_result;\n    END IF;\n    \n    -- Look for pattern like \"016-018\" or \"16-18\" or \"2016-2018\"\n    SELECT regexp_match(desc_text, '(\\d{2,4})-(\\d{2,4})') INTO year_match;\n    \n    IF year_match IS NOT NULL THEN\n        y1 := year_match[1]::INT;\n        y2 := year_match[2]::INT;\n        \n        -- Convert 2-3 digit years to full years\n        IF y1 < 50 THEN y1 := y1 + 2000; END IF;\n        IF y1 >= 50 AND y1 < 100 THEN y1 := y1 + 1900; END IF;\n        IF y1 >= 100 AND y1 < 2000 THEN y1 := y1 + 2000; END IF;\n        \n        IF y2 < 50 THEN y2 := y2 + 2000; END IF;\n        IF y2 >= 50 AND y2 < 100 THEN y2 := y2 + 1900; END IF;\n        IF y2 >= 100 AND y2 < 2000 THEN y2 := y2 + 2000; END IF;\n        \n        RETURN ARRAY[y1, y2];\n    END IF;\n    \n    -- Look for single 4-digit year\n    SELECT regexp_match(desc_text, '(20\\d{2})') INTO year_match;\n    \n    IF year_match IS NOT NULL THEN\n        y1 := year_match[1]::INT;\n        RETURN ARRAY[y1, y1];\n    END IF;\n    \n    RETURN ARRAY[NULL::INT, NULL::INT];\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "fix_hebrew_catalog_batch",
    "definition": "CREATE OR REPLACE FUNCTION public.fix_hebrew_catalog_batch(batch_size integer DEFAULT 1000)\n RETURNS text\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    processed_count INT := 0;\nBEGIN\n    RAISE NOTICE 'Fixing reversed Hebrew text for % items...', batch_size;\n    \n    UPDATE catalog_items SET\n        part_family = extract_part_family_fixed(cat_num_desc),\n        side_position = extract_side_fixed(cat_num_desc),\n        front_rear = extract_position_fixed(cat_num_desc)\n    WHERE id IN (\n        SELECT id FROM catalog_items \n        WHERE cat_num_desc IS NOT NULL \n        AND cat_num_desc != ''\n        ORDER BY id\n        LIMIT batch_size\n    );\n    \n    GET DIAGNOSTICS processed_count = ROW_COUNT;\n    \n    RAISE NOTICE 'Hebrew correction complete! Updated % rows.', processed_count;\n    \n    RETURN format('Successfully processed %s items with Hebrew text correction', processed_count);\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "fix_hebrew_if_reversed",
    "definition": "CREATE OR REPLACE FUNCTION public.fix_hebrew_if_reversed(p_text text)\n RETURNS text\n LANGUAGE plpgsql\nAS $function$\nbegin\n  if p_text ~ '^[\\u0590-\\u05FF]{3,}$' and reverse(p_text) > p_text then\n    return reverse(p_text);\n  else\n    return p_text;\n  end if;\nend;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "fix_hebrew_text",
    "definition": "CREATE OR REPLACE FUNCTION public.fix_hebrew_text(input_text text)\n RETURNS text\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nBEGIN\n    IF input_text IS NULL OR input_text = '' THEN\n        RETURN input_text;\n    END IF;\n    RETURN reverse(input_text);\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "fix_hebrew_words",
    "definition": "CREATE OR REPLACE FUNCTION public.fix_hebrew_words(input_text text)\n RETURNS text\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nDECLARE\n    result TEXT;\nBEGIN\n    IF input_text IS NULL OR input_text = '' THEN\n        RETURN input_text;\n    END IF;\n    \n    result := input_text;\n    \n    -- Fix common reversed Hebrew words\n    result := replace(result, 'סנפ', 'פנס');        -- headlight\n    result := replace(result, 'ףנכ', 'כנף');        -- wing  \n    result := replace(result, 'תותיא', 'איתות');     -- signals\n    result := replace(result, 'הארמ', 'מראה');       -- mirror\n    result := replace(result, 'תלד', 'דלת');         -- door\n    result := replace(result, 'שוגפ', 'פגוש');       -- bumper\n    result := replace(result, 'לאמש', 'שמאל');       -- left\n    result := replace(result, 'נימי', 'ימין');       -- right\n    result := replace(result, 'ימדק', 'קדמי');       -- front\n    result := replace(result, 'ירוחא', 'אחורי');     -- rear\n    result := replace(result, 'הטויוט', 'טויוטה');   -- Toyota\n    result := replace(result, 'חותפ', 'פתוח');       -- open\n    result := replace(result, 'רוגס', 'סגור');       -- closed\n    result := replace(result, 'םיאר', 'ראים');       -- mirrors\n    result := replace(result, 'םיסנפ', 'פנסים');     -- headlights\n    \n    -- Fix abbreviated sides\n    result := replace(result, '''מש', 'שמ''');       -- left abbreviation\n    result := replace(result, '''מי', 'ים''');       -- right abbreviation\n    result := replace(result, '''דק', 'קד''');       -- front abbreviation\n    result := replace(result, '''חא', 'אח''');       -- rear abbreviation\n    \n    RETURN result;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "fix_hebrew_words_in_text",
    "definition": "CREATE OR REPLACE FUNCTION public.fix_hebrew_words_in_text(input_text text)\n RETURNS text\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    words TEXT[];\n    fixed_words TEXT[];\n    word TEXT;\n    i INTEGER;\nBEGIN\n    IF input_text IS NULL OR input_text = '' THEN\n        RETURN input_text;\n    END IF;\n    \n    -- Split by spaces\n    words := string_to_array(input_text, ' ');\n    fixed_words := ARRAY[]::TEXT[];\n    \n    -- Process each word\n    FOR i IN 1..array_length(words, 1) LOOP\n        word := words[i];\n        \n        -- If word is Hebrew (only Hebrew characters), reverse it\n        IF word ~ '^[א-ת''״״-]+$' AND LENGTH(word) > 1 THEN\n            word := reverse(word);\n        END IF;\n        \n        fixed_words := array_append(fixed_words, word);\n    END LOOP;\n    \n    RETURN array_to_string(fixed_words, ' ');\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "get_hebrew_part_family",
    "definition": "CREATE OR REPLACE FUNCTION public.get_hebrew_part_family(desc_text text, eng_family text)\n RETURNS text\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nBEGIN\n    -- Check description for Hebrew part types\n    IF desc_text ILIKE '%סנפ%' OR desc_text ILIKE '%פנס%' THEN\n        RETURN 'תאורה';\n    ELSIF desc_text ILIKE '%תלד%' OR desc_text ILIKE '%דלת%' THEN\n        RETURN 'מרכב';\n    ELSIF desc_text ILIKE '%ףנכ%' OR desc_text ILIKE '%כנף%' THEN\n        RETURN 'מרכב';\n    ELSIF desc_text ILIKE '%ןגמ%' OR desc_text ILIKE '%מגן%' OR desc_text ILIKE '%פגוש%' THEN\n        RETURN 'מרכב';\n    ELSIF desc_text ILIKE '%הארמ%' OR desc_text ILIKE '%מראה%' THEN\n        RETURN 'מראות';\n    ELSIF desc_text ILIKE '%תיכוכז%' OR desc_text ILIKE '%זכוכית%' OR desc_text ILIKE '%שמשה%' THEN\n        RETURN 'זכוכית';\n    ELSIF desc_text ILIKE '%עונמ%' OR desc_text ILIKE '%מנוע%' THEN\n        RETURN 'מנוע';\n    ELSIF desc_text ILIKE '%רוריק%' OR desc_text ILIKE '%קירור%' OR desc_text ILIKE '%מצנן%' THEN\n        RETURN 'קירור';\n    -- Map English families if no Hebrew found\n    ELSIF eng_family = 'Lighting' THEN\n        RETURN 'תאורה';\n    ELSIF eng_family = 'Body' THEN\n        RETURN 'מרכב';\n    ELSIF eng_family = 'Engine' THEN\n        RETURN 'מנוע';\n    ELSIF eng_family = 'Cooling' THEN\n        RETURN 'קירור';\n    ELSIF eng_family = 'Glass' THEN\n        RETURN 'זכוכית';\n    ELSIF eng_family = 'Mirrors' THEN\n        RETURN 'מראות';\n    ELSIF eng_family = 'Braking' THEN\n        RETURN 'בלמים';\n    ELSIF eng_family = 'Electrical' THEN\n        RETURN 'חשמל';\n    ELSIF eng_family = 'Filters' THEN\n        RETURN 'מסננים';\n    ELSIF eng_family = 'Wheels' THEN\n        RETURN 'גלגלים';\n    ELSIF eng_family = 'Transmission' THEN\n        RETURN 'תיבת הילוכים';\n    ELSIF eng_family = 'Suspension' THEN\n        RETURN 'מתלים';\n    ELSE\n        RETURN 'כללי';\n    END IF;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "gin_extract_jsonb",
    "definition": "CREATE OR REPLACE FUNCTION pg_catalog.gin_extract_jsonb(jsonb, internal, internal)\n RETURNS internal\n LANGUAGE internal\n IMMUTABLE PARALLEL SAFE STRICT\nAS $function$gin_extract_jsonb$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "gin_extract_jsonb_path",
    "definition": "CREATE OR REPLACE FUNCTION pg_catalog.gin_extract_jsonb_path(jsonb, internal, internal)\n RETURNS internal\n LANGUAGE internal\n IMMUTABLE PARALLEL SAFE STRICT\nAS $function$gin_extract_jsonb_path$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "gin_extract_jsonb_query",
    "definition": "CREATE OR REPLACE FUNCTION pg_catalog.gin_extract_jsonb_query(jsonb, internal, smallint, internal, internal, internal, internal)\n RETURNS internal\n LANGUAGE internal\n IMMUTABLE PARALLEL SAFE STRICT\nAS $function$gin_extract_jsonb_query$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "gin_extract_jsonb_query_path",
    "definition": "CREATE OR REPLACE FUNCTION pg_catalog.gin_extract_jsonb_query_path(jsonb, internal, smallint, internal, internal, internal, internal)\n RETURNS internal\n LANGUAGE internal\n IMMUTABLE PARALLEL SAFE STRICT\nAS $function$gin_extract_jsonb_query_path$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "gin_extract_query_trgm",
    "definition": "CREATE OR REPLACE FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal)\n RETURNS internal\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gin_extract_query_trgm$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "gin_extract_tsquery",
    "definition": "CREATE OR REPLACE FUNCTION pg_catalog.gin_extract_tsquery(tsvector, internal, smallint, internal, internal, internal, internal)\n RETURNS internal\n LANGUAGE internal\n IMMUTABLE PARALLEL SAFE STRICT\nAS $function$gin_extract_tsquery$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "gin_extract_tsquery",
    "definition": "CREATE OR REPLACE FUNCTION pg_catalog.gin_extract_tsquery(tsquery, internal, smallint, internal, internal)\n RETURNS internal\n LANGUAGE internal\n IMMUTABLE PARALLEL SAFE STRICT\nAS $function$gin_extract_tsquery_5args$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "gin_extract_tsquery",
    "definition": "CREATE OR REPLACE FUNCTION pg_catalog.gin_extract_tsquery(tsquery, internal, smallint, internal, internal, internal, internal)\n RETURNS internal\n LANGUAGE internal\n IMMUTABLE PARALLEL SAFE STRICT\nAS $function$gin_extract_tsquery_oldsig$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "gin_extract_tsvector",
    "definition": "CREATE OR REPLACE FUNCTION pg_catalog.gin_extract_tsvector(tsvector, internal)\n RETURNS internal\n LANGUAGE internal\n IMMUTABLE PARALLEL SAFE STRICT\nAS $function$gin_extract_tsvector_2args$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "gin_extract_tsvector",
    "definition": "CREATE OR REPLACE FUNCTION pg_catalog.gin_extract_tsvector(tsvector, internal, internal)\n RETURNS internal\n LANGUAGE internal\n IMMUTABLE PARALLEL SAFE STRICT\nAS $function$gin_extract_tsvector$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "gin_extract_value_trgm",
    "definition": "CREATE OR REPLACE FUNCTION public.gin_extract_value_trgm(text, internal)\n RETURNS internal\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gin_extract_value_trgm$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "ginarrayextract",
    "definition": "CREATE OR REPLACE FUNCTION pg_catalog.ginarrayextract(anyarray, internal, internal)\n RETURNS internal\n LANGUAGE internal\n IMMUTABLE PARALLEL SAFE STRICT\nAS $function$ginarrayextract$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "ginarrayextract",
    "definition": "CREATE OR REPLACE FUNCTION pg_catalog.ginarrayextract(anyarray, internal)\n RETURNS internal\n LANGUAGE internal\n IMMUTABLE PARALLEL SAFE STRICT\nAS $function$ginarrayextract_2args$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "ginqueryarrayextract",
    "definition": "CREATE OR REPLACE FUNCTION pg_catalog.ginqueryarrayextract(anyarray, internal, smallint, internal, internal, internal, internal)\n RETURNS internal\n LANGUAGE internal\n IMMUTABLE PARALLEL SAFE STRICT\nAS $function$ginqueryarrayextract$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "is_full_string_reversed",
    "definition": "CREATE OR REPLACE FUNCTION public.is_full_string_reversed(input_text text)\n RETURNS boolean\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nBEGIN\n    IF input_text IS NULL OR input_text = '' THEN\n        RETURN FALSE;\n    END IF;\n    \n    -- Detect patterns that indicate FULL string reversal\n    -- Look for reversed patterns that appear at START of string\n    RETURN (\n        -- Pattern 1: Starts with reversed \"גריל\" = \"לירג\"\n        input_text LIKE 'לירג %' OR\n        -- Pattern 2: Starts with reversed \"תומך\" = \"ךמות\"\n        input_text LIKE 'ךמות %' OR\n        -- Pattern 3: Starts with reversed common words\n        input_text LIKE 'ריצ %' OR        -- reversed \"ציר\"\n        input_text LIKE 'טושיק %' OR      -- reversed \"קישוט\"\n        input_text LIKE 'הסכמ %' OR       -- reversed \"מכסה\"\n        -- Pattern 4: Has year at END (wrong - should be at start after model)\n        input_text ~ '\\d{2}-\\d{2}$' OR\n        -- Pattern 5: Ends with model name (wrong - model should be in middle)\n        input_text ~ 'הלורוק \\d{2}-\\d{2}$' OR\n        -- Pattern 6: Has \"(reversed parentheses)\" like \"(םלשומ)\" \n        input_text LIKE '%(םלשומ)%' OR     -- reversed \"(מושלם)\"\n        input_text LIKE '%(ראופמ)%' OR     -- reversed \"(מפואר)\"\n        -- Pattern 7: Contains reversed \"ניקלים\" = \"םילקינ\"\n        input_text LIKE '%םילקינ%'\n    );\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "is_fully_reversed_hebrew",
    "definition": "CREATE OR REPLACE FUNCTION public.is_fully_reversed_hebrew(text_to_check text)\n RETURNS boolean\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nBEGIN\n    -- Check if string contains common reversed patterns\n    -- Reversed: עונמ (should be מנוע), הרמנפ (should be פנמרה)\n    RETURN (\n        text_to_check LIKE '%עונמ%' OR\n        text_to_check LIKE '%הרמנפ%' OR\n        text_to_check LIKE '%הרמנאפ%' OR\n        text_to_check LIKE '%ןגמ%' OR\n        text_to_check LIKE '%קוזיח%'\n    );\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "is_hebrew_reversed",
    "definition": "CREATE OR REPLACE FUNCTION public.is_hebrew_reversed(input_text text)\n RETURNS boolean\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nBEGIN\n    IF input_text IS NULL OR input_text = '' THEN\n        RETURN FALSE;\n    END IF;\n    \n    RETURN (\n        input_text LIKE '%ןגמ%' OR input_text LIKE '%תלד%' OR \n        input_text LIKE '%סנפ%' OR input_text LIKE '%ףנכ%' OR \n        input_text LIKE '%הארמ%' OR input_text LIKE '%הלורוק%' OR \n        input_text LIKE '%ךמות%' OR input_text LIKE '%לירג%' OR \n        input_text LIKE '%הסכמ%' OR input_text LIKE '%ריצ%' OR\n        input_text LIKE '%תידי%'\n    );\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "json_extract_path",
    "definition": "CREATE OR REPLACE FUNCTION pg_catalog.json_extract_path(from_json json, VARIADIC path_elems text[])\n RETURNS json\n LANGUAGE internal\n IMMUTABLE PARALLEL SAFE STRICT\nAS $function$json_extract_path$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "json_extract_path_text",
    "definition": "CREATE OR REPLACE FUNCTION pg_catalog.json_extract_path_text(from_json json, VARIADIC path_elems text[])\n RETURNS text\n LANGUAGE internal\n IMMUTABLE PARALLEL SAFE STRICT\nAS $function$json_extract_path_text$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "jsonb_extract_path",
    "definition": "CREATE OR REPLACE FUNCTION pg_catalog.jsonb_extract_path(from_json jsonb, VARIADIC path_elems text[])\n RETURNS jsonb\n LANGUAGE internal\n IMMUTABLE PARALLEL SAFE STRICT\nAS $function$jsonb_extract_path$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "jsonb_extract_path_text",
    "definition": "CREATE OR REPLACE FUNCTION pg_catalog.jsonb_extract_path_text(from_json jsonb, VARIADIC path_elems text[])\n RETURNS text\n LANGUAGE internal\n IMMUTABLE PARALLEL SAFE STRICT\nAS $function$jsonb_extract_path_text$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "parse_and_extract_catnumdesc",
    "definition": "CREATE OR REPLACE FUNCTION public.parse_and_extract_catnumdesc(catalog_id uuid)\n RETURNS TABLE(extracted_oem text, extracted_model text, extracted_year_from integer, extracted_year_to integer, extracted_side text, extracted_position text, extracted_part_family text)\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    desc_text TEXT;\n    year_range INT[];\nBEGIN\n    -- Get the current cat_num_desc\n    SELECT cat_num_desc INTO desc_text \n    FROM catalog_items \n    WHERE id = catalog_id;\n    \n    IF desc_text IS NULL THEN\n        RETURN;\n    END IF;\n    \n    -- Extract year range\n    year_range := extract_year_range_from_desc(desc_text);\n    \n    -- Return all extracted data\n    RETURN QUERY SELECT\n        extract_oem_from_desc(desc_text),\n        extract_model_from_desc(desc_text),\n        year_range[1],\n        year_range[2],\n        extract_side_from_desc(desc_text),\n        extract_position_from_desc(desc_text),\n        extract_part_family_from_desc(desc_text);\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "process_hebrew_before_insert",
    "definition": "CREATE OR REPLACE FUNCTION public.process_hebrew_before_insert()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\n  BEGIN\n      IF NEW.cat_num_desc IS NOT NULL\n  AND NEW.cat_num_desc != '' THEN\n          NEW.cat_num_desc :=\n  reverse_hebrew(NEW.cat_num_desc);\n      END IF;\n\n      RETURN NEW;\n  END;\n  $function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "reverse",
    "definition": "CREATE OR REPLACE FUNCTION pg_catalog.reverse(text)\n RETURNS text\n LANGUAGE internal\n IMMUTABLE PARALLEL SAFE STRICT\nAS $function$text_reverse$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "reverse_full_string",
    "definition": "CREATE OR REPLACE FUNCTION public.reverse_full_string(text_to_reverse text)\n RETURNS text\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nBEGIN\n    RETURN reverse(text_to_reverse);\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "reverse_hebrew",
    "definition": "CREATE OR REPLACE FUNCTION public.reverse_hebrew(text_input text)\n RETURNS text\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    words TEXT[];\n    word TEXT;\n    reversed_words TEXT[] := ARRAY[]::TEXT[];\n    result TEXT := '';\nBEGIN\n    IF text_input IS NULL OR text_input = '' THEN\n        RETURN text_input;\n    END IF;\n    \n    -- Split by space\n    words := string_to_array(text_input, ' ');\n    \n    -- Process each word\n    FOREACH word IN ARRAY words LOOP\n        -- Only reverse if word contains Hebrew characters\n        IF word ~ '[א-ת]' THEN\n            -- Reverse the Hebrew word\n            reversed_words := array_append(reversed_words, reverse(word));\n        ELSE\n            -- Keep English/Latin/numbers as-is\n            reversed_words := array_append(reversed_words, word);\n        END IF;\n    END LOOP;\n    \n    -- Reverse word order and join\n    result := array_to_string(ARRAY(SELECT unnest(reversed_words) ORDER BY generate_subscripts(reversed_words, 1) DESC), ' ');\n    \n    RETURN result;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "reverse_hebrew_smart",
    "definition": "CREATE OR REPLACE FUNCTION public.reverse_hebrew_smart(input_text text)\n RETURNS text\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nDECLARE\n    result TEXT := '';\n    current_chunk TEXT := '';\n    current_char TEXT;\n    is_hebrew BOOLEAN := FALSE;\n    prev_was_hebrew BOOLEAN := FALSE;\n    chunks TEXT[] := ARRAY[]::TEXT[];\n    chunk_types BOOLEAN[] := ARRAY[]::BOOLEAN[];\n    i INTEGER;\nBEGIN\n    IF input_text IS NULL OR input_text = '' THEN\n        RETURN input_text;\n    END IF;\n    \n    FOR i IN 1..length(input_text) LOOP\n        current_char := substring(input_text from i for 1);\n        is_hebrew := current_char ~ '[\\u0590-\\u05FF]';\n        \n        IF i > 1 AND is_hebrew != prev_was_hebrew THEN\n            chunks := array_append(chunks, current_chunk);\n            chunk_types := array_append(chunk_types, prev_was_hebrew);\n            current_chunk := current_char;\n        ELSE\n            current_chunk := current_chunk || current_char;\n        END IF;\n        \n        prev_was_hebrew := is_hebrew;\n    END LOOP;\n    \n    IF current_chunk != '' THEN\n        chunks := array_append(chunks, current_chunk);\n        chunk_types := array_append(chunk_types, prev_was_hebrew);\n    END IF;\n    \n    FOR i IN 1..array_length(chunks, 1) LOOP\n        IF chunk_types[i] = TRUE THEN\n            result := result || reverse(chunks[i]);\n        ELSE\n            result := result || chunks[i];\n        END IF;\n    END LOOP;\n    \n    RETURN result;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "reverse_hebrew_text",
    "definition": "CREATE OR REPLACE FUNCTION public.reverse_hebrew_text(input_text text)\n RETURNS text\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nDECLARE\n    result TEXT := '';\n    char_code INT;\n    current_char TEXT;\n    i INT;\nBEGIN\n    IF input_text IS NULL OR input_text = '' THEN\n        RETURN input_text;\n    END IF;\n    \n    -- Process each character\n    FOR i IN 1..length(input_text) LOOP\n        current_char := substring(input_text from i for 1);\n        char_code := ascii(current_char);\n        \n        -- Check if character is Hebrew (Unicode range 1488-1514)\n        -- In UTF-8, Hebrew characters are in specific ranges\n        IF current_char ~ '[א-ת]' THEN\n            -- Hebrew character - add to beginning (reverse)\n            result := current_char || result;\n        ELSE\n            -- Non-Hebrew character (numbers, spaces, punctuation) - add to end\n            result := result || current_char;\n        END IF;\n    END LOOP;\n    \n    RETURN result;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "reverse_slash_separated",
    "definition": "CREATE OR REPLACE FUNCTION public.reverse_slash_separated(text_in text)\n RETURNS text\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    parts text[];\n    reversed_parts text[];\n    i int;\nBEGIN\n    -- Split by /\n    parts := string_to_array(text_in, '/');\n    \n    -- Reverse each part\n    FOR i IN 1..array_length(parts, 1) LOOP\n        reversed_parts[i] := reverse(trim(parts[i]));\n    END LOOP;\n    \n    -- Join back with /\n    RETURN array_to_string(reversed_parts, ' / ');\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "reverse_text",
    "definition": "CREATE OR REPLACE FUNCTION public.reverse_text(input_text text)\n RETURNS text\n LANGUAGE plpgsql\nAS $function$\n  BEGIN\n      IF input_text IS NULL OR input_text = ''\n   THEN\n          RETURN input_text;\n      END IF;\n\n      RETURN (\n          SELECT string_agg(substr(input_text,\n   i, 1), '')\n          FROM\n  generate_series(length(input_text), 1, -1)\n  AS i\n      );\n  END;\n  $function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "run_simple_hebrew_extraction",
    "definition": "CREATE OR REPLACE FUNCTION public.run_simple_hebrew_extraction(batch_size integer DEFAULT 1000)\n RETURNS text\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    processed_count INT := 0;\nBEGIN\n    RAISE NOTICE 'Starting simple Hebrew extraction for % items...', batch_size;\n    \n    UPDATE catalog_items SET\n        part_family = extract_simple_part_family(cat_num_desc),\n        side_position = extract_simple_side(cat_num_desc),\n        front_rear = extract_simple_position(cat_num_desc),\n        year_range = extract_simple_years(cat_num_desc),\n        make = COALESCE(make, extract_simple_make(cat_num_desc))\n    WHERE id IN (\n        SELECT id FROM catalog_items \n        WHERE cat_num_desc IS NOT NULL \n        AND cat_num_desc != ''\n        AND part_family IS NULL\n        ORDER BY id\n        LIMIT batch_size\n    );\n    \n    GET DIAGNOSTICS processed_count = ROW_COUNT;\n    \n    RAISE NOTICE 'Simple extraction complete! Updated % rows.', processed_count;\n    \n    RETURN format('Successfully processed %s items with simple Hebrew extraction', processed_count);\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "search_catalog_hebrew",
    "definition": "CREATE OR REPLACE FUNCTION public.search_catalog_hebrew(search_term text)\n RETURNS TABLE(id uuid, pcode text, cat_num_desc text, part_family text, make text, model text, year_from integer, year_to integer, price numeric, oem text, supplier_name text, availability text, location text, comments text, version_date date, created_at timestamp with time zone, source text)\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n  -- Normalize search term: remove special characters but keep Hebrew\n  search_term := TRIM(REGEXP_REPLACE(search_term, '[^\\w\\s\\u0590-\\u05FF]', '', 'g'));\n  \n  -- Return early if search term is empty\n  IF LENGTH(search_term) = 0 THEN\n    RETURN;\n  END IF;\n  \n  RETURN QUERY\n  SELECT \n    c.id,\n    c.pcode,\n    c.cat_num_desc,\n    c.part_family,\n    c.make,\n    c.model,\n    c.year_from,\n    c.year_to,\n    c.price,\n    c.oem,\n    c.supplier_name,\n    c.availability,\n    c.location,\n    c.comments,\n    c.version_date,\n    c.created_at,\n    c.source\n  FROM catalog_items c\n  WHERE \n    -- Hebrew text fields with ILIKE for case-insensitive search\n    c.cat_num_desc ILIKE '%' || search_term || '%'\n    OR c.part_family ILIKE '%' || search_term || '%'\n    OR c.make ILIKE '%' || search_term || '%'\n    OR c.model ILIKE '%' || search_term || '%'\n    OR c.supplier_name ILIKE '%' || search_term || '%'\n    OR c.comments ILIKE '%' || search_term || '%'\n    -- Non-Hebrew fields (exact/partial match)\n    OR c.pcode ILIKE '%' || search_term || '%'\n    OR c.oem ILIKE '%' || search_term || '%'\n    OR c.location ILIKE '%' || search_term || '%'\n    OR c.availability ILIKE '%' || search_term || '%'\n  ORDER BY \n    -- Prioritize exact matches, then starts with, then contains\n    CASE \n      WHEN c.part_family = search_term THEN 1\n      WHEN c.part_family ILIKE search_term || '%' THEN 2\n      WHEN c.cat_num_desc = search_term THEN 3\n      WHEN c.cat_num_desc ILIKE search_term || '%' THEN 4\n      WHEN c.make = search_term THEN 5\n      WHEN c.make ILIKE search_term || '%' THEN 6\n      WHEN c.pcode = search_term THEN 7\n      WHEN c.oem = search_term THEN 8\n      ELSE 9\n    END,\n    -- Secondary sort by price (nulls last)\n    c.price ASC NULLS LAST,\n    -- Tertiary sort by creation date (newest first)\n    c.created_at DESC NULLS LAST\n  LIMIT 100; -- Add reasonable limit\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "search_catalog_hebrew_filtered",
    "definition": "CREATE OR REPLACE FUNCTION public.search_catalog_hebrew_filtered(search_term text, filter_make text DEFAULT NULL::text, filter_model text DEFAULT NULL::text, max_results integer DEFAULT 50)\n RETURNS TABLE(id uuid, pcode text, cat_num_desc text, part_family text, make text, model text, year_from integer, year_to integer, price numeric, oem text, supplier_name text, availability text, location text, comments text, version_date date, created_at timestamp with time zone, source text, relevance_score integer)\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n  -- Normalize search term\n  search_term := TRIM(REGEXP_REPLACE(search_term, '[^\\w\\s\\u0590-\\u05FF]', '', 'g'));\n  \n  -- Normalize filters\n  IF filter_make IS NOT NULL THEN\n    filter_make := TRIM(filter_make);\n  END IF;\n  \n  IF filter_model IS NOT NULL THEN\n    filter_model := TRIM(filter_model);\n  END IF;\n  \n  RETURN QUERY\n  SELECT \n    c.id,\n    c.pcode,\n    c.cat_num_desc,\n    c.part_family,\n    c.make,\n    c.model,\n    c.year_from,\n    c.year_to,\n    c.price,\n    c.oem,\n    c.supplier_name,\n    c.availability,\n    c.location,\n    c.comments,\n    c.version_date,\n    c.created_at,\n    c.source,\n    -- Calculate relevance score\n    (CASE \n      WHEN c.part_family = search_term THEN 10\n      WHEN c.part_family ILIKE search_term || '%' THEN 9\n      WHEN c.cat_num_desc = search_term THEN 8\n      WHEN c.cat_num_desc ILIKE search_term || '%' THEN 7\n      WHEN c.make = search_term THEN 6\n      WHEN c.make ILIKE search_term || '%' THEN 5\n      WHEN c.pcode = search_term THEN 4\n      WHEN c.oem = search_term THEN 3\n      WHEN c.part_family ILIKE '%' || search_term || '%' THEN 2\n      ELSE 1\n    END)::INTEGER AS relevance_score\n  FROM catalog_items c\n  WHERE \n    -- Text search conditions\n    (LENGTH(search_term) = 0 OR (\n      c.cat_num_desc ILIKE '%' || search_term || '%'\n      OR c.part_family ILIKE '%' || search_term || '%'\n      OR c.make ILIKE '%' || search_term || '%'\n      OR c.model ILIKE '%' || search_term || '%'\n      OR c.supplier_name ILIKE '%' || search_term || '%'\n      OR c.comments ILIKE '%' || search_term || '%'\n      OR c.pcode ILIKE '%' || search_term || '%'\n      OR c.oem ILIKE '%' || search_term || '%'\n      OR c.location ILIKE '%' || search_term || '%'\n      OR c.availability ILIKE '%' || search_term || '%'\n    ))\n    -- Make filter\n    AND (filter_make IS NULL OR c.make ILIKE '%' || filter_make || '%')\n    -- Model filter\n    AND (filter_model IS NULL OR c.model ILIKE '%' || filter_model || '%')\n  ORDER BY \n    relevance_score DESC,\n    c.price ASC NULLS LAST,\n    c.created_at DESC NULLS LAST\n  LIMIT max_results;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "search_catalog_hebrew_simple",
    "definition": "CREATE OR REPLACE FUNCTION public.search_catalog_hebrew_simple(search_term text, max_results integer DEFAULT 20)\n RETURNS SETOF catalog_items\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n  -- Normalize search term\n  search_term := TRIM(REGEXP_REPLACE(search_term, '[^\\w\\s\\u0590-\\u05FF]', '', 'g'));\n  \n  RETURN QUERY\n  SELECT * FROM catalog_items c\n  WHERE \n    c.cat_num_desc ILIKE '%' || search_term || '%'\n    OR c.part_family ILIKE '%' || search_term || '%'\n    OR c.make ILIKE '%' || search_term || '%'\n    OR c.model ILIKE '%' || search_term || '%'\n    OR c.supplier_name ILIKE '%' || search_term || '%'\n    OR c.pcode ILIKE '%' || search_term || '%'\n    OR c.oem ILIKE '%' || search_term || '%'\n  ORDER BY \n    CASE \n      WHEN c.part_family = search_term THEN 1\n      WHEN c.part_family ILIKE search_term || '%' THEN 2\n      WHEN c.cat_num_desc = search_term THEN 3\n      ELSE 4\n    END,\n    c.price ASC NULLS LAST\n  LIMIT max_results;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "simple_extract_batch",
    "definition": "CREATE OR REPLACE PROCEDURE public.simple_extract_batch(IN batch_limit integer DEFAULT 100)\n LANGUAGE plpgsql\nAS $procedure$\nDECLARE\n    processed_count INT := 0;\nBEGIN\n    RAISE NOTICE 'Starting simple extraction for % items...', batch_limit;\n    \n    UPDATE catalog_items SET\n        oem = COALESCE(oem, extract_oem_from_desc(cat_num_desc)),\n        model = COALESCE(model, extract_model_from_desc(cat_num_desc)),\n        part_family = COALESCE(part_family, extract_part_family_from_desc(cat_num_desc)),\n        -- Store extracted data in available fields\n        engine_volume = COALESCE(engine_volume, extract_side_from_desc(cat_num_desc)),\n        engine_code = COALESCE(engine_code, extract_position_from_desc(cat_num_desc))\n    WHERE id IN (\n        SELECT id FROM catalog_items \n        WHERE cat_num_desc IS NOT NULL \n        LIMIT batch_limit\n    );\n    \n    GET DIAGNOSTICS processed_count = ROW_COUNT;\n    RAISE NOTICE 'Simple extraction complete! Updated % rows.', processed_count;\nEND;\n$procedure$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "test_extraction_enhanced",
    "definition": "CREATE OR REPLACE FUNCTION public.test_extraction_enhanced(test_desc text)\n RETURNS TABLE(description text, extracted_oem text, extracted_model text, extracted_model_code text, extracted_years integer[], extracted_side text, extracted_position text, extracted_family text)\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    RETURN QUERY SELECT\n        test_desc,\n        extract_oem_from_desc(test_desc),\n        extract_model_from_desc(test_desc),\n        extract_model_code_from_desc(test_desc),\n        extract_year_range_from_desc(test_desc),\n        extract_side_from_desc(test_desc),\n        extract_position_from_desc(test_desc),\n        extract_part_family_from_desc(test_desc);\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "test_extraction_simple",
    "definition": "CREATE OR REPLACE FUNCTION public.test_extraction_simple(test_desc text)\n RETURNS TABLE(description text, extracted_oem text, extracted_model text, extracted_years integer[], extracted_side text, extracted_position text, extracted_family text)\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    RETURN QUERY SELECT\n        test_desc,\n        extract_oem_from_desc(test_desc),\n        extract_model_from_desc(test_desc),\n        extract_year_range_from_desc(test_desc),\n        extract_side_from_desc(test_desc),\n        extract_position_from_desc(test_desc),\n        extract_part_family_from_desc(test_desc);\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "test_extraction_simple_fixed",
    "definition": "CREATE OR REPLACE FUNCTION public.test_extraction_simple_fixed(test_desc text)\n RETURNS TABLE(description text, extracted_oem text, extracted_model text, extracted_model_code text, extracted_year_range text, extracted_side text, extracted_position text, extracted_family text)\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    RETURN QUERY SELECT\n        test_desc,\n        extract_oem_from_desc(test_desc),\n        extract_model_from_desc(test_desc),\n        extract_model_code_from_desc(test_desc),\n        extract_year_range_as_text(test_desc),\n        extract_side_from_desc(test_desc),\n        extract_position_from_desc(test_desc),\n        extract_part_family_from_desc(test_desc);\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "test_hebrew_search",
    "definition": "CREATE OR REPLACE FUNCTION public.test_hebrew_search()\n RETURNS text\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n  test_result TEXT;\n  record_count INTEGER;\nBEGIN\n  -- Test basic search\n  SELECT COUNT(*) INTO record_count\n  FROM search_catalog_hebrew('טויוטה');\n  \n  IF record_count > 0 THEN\n    test_result := 'Hebrew search working: found ' || record_count || ' Toyota results';\n  ELSE\n    test_result := 'Hebrew search test: no Toyota results found';\n  END IF;\n  \n  RETURN test_result;\nEND;\n$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "uuid_extract_timestamp",
    "definition": "CREATE OR REPLACE FUNCTION pg_catalog.uuid_extract_timestamp(uuid)\n RETURNS timestamp with time zone\n LANGUAGE internal\n IMMUTABLE PARALLEL SAFE STRICT LEAKPROOF\nAS $function$uuid_extract_timestamp$function$\n"
  },
  {
    "type": "FUNCTIONS",
    "name": "uuid_extract_version",
    "definition": "CREATE OR REPLACE FUNCTION pg_catalog.uuid_extract_version(uuid)\n RETURNS smallint\n LANGUAGE internal\n IMMUTABLE PARALLEL SAFE STRICT LEAKPROOF\nAS $function$uuid_extract_version$function$\n"
  }
]

Check 3 :

[
  {
    "type": "DATA_QUALITY",
    "total_records": 48272,
    "has_year_from": 33786,
    "has_year_to": 33786,
    "has_side": 0,
    "has_position": 0,
    "has_family": 48272,
    "year_pct": "70.0",
    "side_pct": "0.0",
    "family_pct": "100.0"
  }
].   THE FAMILIES ARE WRONG , THEY NEED TO MATCH THE FAMILES IN THE UI , THERE IS ALREADY A FUNCTION FOR THIS AND A LIST OF THE ACTUAL FAMILES 

Check 4:

[
  {
    "type": "SAMPLE_DATA",
    "cat_num_desc": "פנס אח' שמ' - 08 T5 פתוח",
    "year_from": null,
    "year_to": null,
    "side_position": null,
    "part_family": "פנסים ותאורה",
    "make": "ןגווסקלופ"
  },
  {
    "type": "SAMPLE_DATA",
    "cat_num_desc": "פנס אח' שמ' - 08 T5 פתוח",
    "year_from": null,
    "year_to": null,
    "side_position": null,
    "part_family": "פנסים ותאורה",
    "make": "VAG"
  },
  {
    "type": "SAMPLE_DATA",
    "cat_num_desc": "רפלקטור ימ' למגן אח' ג'יפ 08-10 E70 X5",
    "year_from": 2008,
    "year_to": 2010,
    "side_position": null,
    "part_family": "לא מוגדר",
    "make": "BMW / מיני"
  },
  {
    "type": "SAMPLE_DATA",
    "cat_num_desc": "איתות בכנף קד' שמ' 016-018 ~ X4 (F26)",
    "year_from": 2016,
    "year_to": 2018,
    "side_position": null,
    "part_family": "פנסים ותאורה",
    "make": "BMW / מיני"
  },
  {
    "type": "SAMPLE_DATA",
    "cat_num_desc": "איתות בכנף קד' ימ' 016-018 ~ X4 (F26)",
    "year_from": 2016,
    "year_to": 2018,
    "side_position": null,
    "part_family": "פנסים ותאורה",
    "make": "BMW / מיני"
  },
  {
    "type": "SAMPLE_DATA",
    "cat_num_desc": "פנס אור מס' ברלינגו 09-",
    "year_from": null,
    "year_to": null,
    "side_position": null,
    "part_family": "פנסים ותאורה",
    "make": "ןאורטיס"
  },
  {
    "type": "SAMPLE_DATA",
    "cat_num_desc": "פנס איתות בראי שמ' דובלו 011-",
    "year_from": 2011,
    "year_to": 2011,
    "side_position": null,
    "part_family": "פנסים ותאורה",
    "make": "טאיפ"
  },
  {
    "type": "SAMPLE_DATA",
    "cat_num_desc": "פנס איתות בראי ימ' דובלו 011-",
    "year_from": 2011,
    "year_to": 2011,
    "side_position": null,
    "part_family": "פנסים ותאורה",
    "make": "טאיפ"
  },
  {
    "type": "SAMPLE_DATA",
    "cat_num_desc": "פנס איתות במראה שמ' פיאסטה 09-13",
    "year_from": 2009,
    "year_to": 2013,
    "side_position": null,
    "part_family": "פנסים ותאורה",
    "make": "דרופ"
  },
  {
    "type": "SAMPLE_DATA",
    "cat_num_desc": "איתות במראה ימ' - פיאסטה 09-012",
    "year_from": 2012,
    "year_to": 2012,
    "side_position": null,
    "part_family": "פנסים ותאורה",
    "make": "דרופ"
  }
] there are fields like make theta are still reversed , probably due to functions deployed .