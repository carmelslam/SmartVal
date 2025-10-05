-- Fix year extraction patterns to handle edge cases

DROP FUNCTION IF EXISTS extract_model_and_year() CASCADE;

CREATE OR REPLACE FUNCTION extract_model_and_year()
RETURNS TRIGGER LANGUAGE plpgsql AS $func$
DECLARE
    txt text;
    year_match text[];
    yr_from_str text;
    yr_to_str text;
    yr_from_int int;
    yr_to_int int;
BEGIN
    txt := COALESCE(NEW.cat_num_desc, '');
    
    -- MODEL EXTRACTION (keep existing)
    IF NEW.make = 'טויוטה' THEN
        IF txt LIKE '%קורולה%' THEN NEW.model := 'קורולה';
        ELSIF txt LIKE '%קאמרי%' THEN NEW.model := 'קאמרי';
        ELSIF txt LIKE '%פריוס%' THEN NEW.model := 'פריוס';
        END IF;
    ELSIF NEW.make = 'VAG' OR NEW.make = 'אודי' THEN
        IF txt LIKE '%A3%' THEN NEW.model := 'A3';
        ELSIF txt LIKE '%A4%' THEN NEW.model := 'A4';
        ELSIF txt LIKE '%A5%' THEN NEW.model := 'A5';
        ELSIF txt LIKE '%Q3%' THEN NEW.model := 'Q3';
        ELSIF txt LIKE '%Q5%' THEN NEW.model := 'Q5';
        END IF;
    ELSIF NEW.make = 'פולקסווגן' THEN
        IF txt LIKE '%גולף%' THEN NEW.model := 'גולף';
        ELSIF txt LIKE '%פולו%' THEN NEW.model := 'פולו';
        ELSIF txt LIKE '%טיגואן%' THEN NEW.model := 'טיגואן';
        END IF;
    END IF;
    
    -- YEAR EXTRACTION - improved patterns
    -- Pattern 1: 2-digit dash 2-digit (e.g., 15-19, 89-01)
    SELECT regexp_match(txt, '(\d{2})-(\d{2})(?:\D|$)') INTO year_match;
    
    -- Pattern 2: 3-digit dash 3-digit (e.g., 015-019)
    IF year_match IS NULL THEN
        SELECT regexp_match(txt, '(\d{3})-(\d{3})(?:\D|$)') INTO year_match;
    END IF;
    
    -- Pattern 3: 3-digit followed by dash and space/end (e.g., 013- )
    IF year_match IS NULL THEN
        SELECT regexp_match(txt, '[^\d](\d{3})-(?:\s|$)') INTO year_match;
    END IF;
    
    -- Pattern 4: space/dash followed by 3-digit year (e.g., -019 or " 019")
    IF year_match IS NULL THEN
        SELECT regexp_match(txt, '[\s-](\d{3})(?:\s|$|-)') INTO year_match;
    END IF;
    
    IF year_match IS NOT NULL THEN
        yr_from_str := year_match[1];
        yr_to_str := year_match[2];
        
        IF yr_from_str IS NOT NULL AND yr_from_str ~ '^\d+$' THEN
            IF length(yr_from_str) = 2 THEN
                IF yr_from_str::int >= 80 THEN
                    yr_from_int := 1900 + yr_from_str::int;
                ELSE
                    yr_from_int := 2000 + yr_from_str::int;
                END IF;
            ELSIF length(yr_from_str) = 3 THEN
                yr_from_int := 2000 + yr_from_str::int;
            END IF;
            
            IF yr_from_int >= 1980 AND yr_from_int <= 2030 THEN
                NEW.year_from := yr_from_int;
                NEW.year_to := yr_from_int;
            END IF;
        END IF;
        
        IF yr_to_str IS NOT NULL AND yr_to_str ~ '^\d+$' THEN
            IF length(yr_to_str) = 2 THEN
                IF yr_to_str::int >= 80 THEN
                    yr_to_int := 1900 + yr_to_str::int;
                ELSE
                    yr_to_int := 2000 + yr_to_str::int;
                END IF;
            ELSIF length(yr_to_str) = 3 THEN
                yr_to_int := 2000 + yr_to_str::int;
            END IF;
            
            IF yr_to_int >= 1980 AND yr_to_int <= 2030 THEN
                NEW.year_to := yr_to_int;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$func$;

CREATE TRIGGER trigger_extract_model_and_year
    BEFORE INSERT OR UPDATE OF cat_num_desc, make
    ON catalog_items FOR EACH ROW
    EXECUTE FUNCTION extract_model_and_year();
