-- Update just the year extraction part of the function
-- Copy the ENTIRE function from IMPROVED_EXTRACTION_FUNCTION.sql
-- Then replace just the year section

DROP FUNCTION IF EXISTS extract_model_and_year() CASCADE;

CREATE OR REPLACE FUNCTION extract_model_and_year()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $func$
DECLARE
    txt text;
    year_match text[];
    yr_from_str text;
    yr_to_str text;
    yr_from_int int;
    yr_to_int int;
BEGIN
    txt := COALESCE(NEW.cat_num_desc, '');
    
    -- MODEL EXTRACTION (existing code - keeping it short)
    IF NEW.make = 'טויוטה' THEN
        IF txt LIKE '%קורולה%' THEN NEW.model := 'קורולה';
        ELSIF txt LIKE '%קאמרי%' THEN NEW.model := 'קאמרי';
        ELSIF txt LIKE '%פריוס%' THEN NEW.model := 'פריוס';
        END IF;
    ELSIF NEW.make = 'פולקסווגן' THEN
        IF txt LIKE '%גולף%' THEN NEW.model := 'גולף';
        ELSIF txt LIKE '%פולו%' THEN NEW.model := 'פולו';
        ELSIF txt LIKE '%טיגואן%' THEN NEW.model := 'טיגואן';
        END IF;
    END IF;
    
    -- IMPROVED YEAR EXTRACTION
    SELECT regexp_match(txt, '(\d{2})-(\d{2})') INTO year_match;
    
    IF year_match IS NULL THEN
        SELECT regexp_match(txt, '(\d{3})-') INTO year_match;
    END IF;
    
    IF year_match IS NULL THEN
        SELECT regexp_match(txt, '-(\d{3})') INTO year_match;
    END IF;
    
    IF year_match IS NOT NULL THEN
        yr_from_str := year_match[1];
        yr_to_str := year_match[2];
        
        IF yr_from_str IS NOT NULL THEN
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
            END IF;
        END IF;
        
        IF yr_to_str IS NOT NULL THEN
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
    ON catalog_items
    FOR EACH ROW
    EXECUTE FUNCTION extract_model_and_year();
