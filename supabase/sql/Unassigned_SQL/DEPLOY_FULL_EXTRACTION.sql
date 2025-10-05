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
    
    IF NEW.make = 'טויוטה' THEN
        IF txt LIKE '%קורולה%' THEN NEW.model := 'קורולה';
        ELSIF txt LIKE '%קאמרי%' THEN NEW.model := 'קאמרי';
        ELSIF txt LIKE '%פריוס%' THEN NEW.model := 'פריוס';
        ELSIF txt LIKE '%היילקס%' THEN NEW.model := 'היילקס';
        ELSIF txt LIKE '%סיינה%' THEN NEW.model := 'סיינה';
        ELSIF txt LIKE '%היילנדר%' THEN NEW.model := 'היילנדר';
        ELSIF txt LIKE '%יאריס%' THEN NEW.model := 'יאריס';
        ELSIF txt LIKE '%אוריס%' THEN NEW.model := 'אוריס';
        ELSIF txt LIKE '%אוונסיס%' THEN NEW.model := 'אוונסיס';
        ELSIF txt LIKE '%ראב%' THEN NEW.model := 'RAV4';
        END IF;
    ELSIF NEW.make = 'VAG' OR NEW.make = 'אודי' THEN
        IF txt LIKE '%A3%' THEN NEW.model := 'A3';
        ELSIF txt LIKE '%A4%' THEN NEW.model := 'A4';
        ELSIF txt LIKE '%A5%' THEN NEW.model := 'A5';
        ELSIF txt LIKE '%A6%' THEN NEW.model := 'A6';
        ELSIF txt LIKE '%A7%' THEN NEW.model := 'A7';
        ELSIF txt LIKE '%A8%' THEN NEW.model := 'A8';
        ELSIF txt LIKE '%Q3%' THEN NEW.model := 'Q3';
        ELSIF txt LIKE '%Q5%' THEN NEW.model := 'Q5';
        ELSIF txt LIKE '%Q7%' THEN NEW.model := 'Q7';
        END IF;
    ELSIF NEW.make = 'BMW / מיני' THEN
        IF txt LIKE '%X1%' THEN NEW.model := 'X1';
        ELSIF txt LIKE '%X3%' THEN NEW.model := 'X3';
        ELSIF txt LIKE '%X5%' THEN NEW.model := 'X5';
        ELSIF txt LIKE '%X6%' THEN NEW.model := 'X6';
        END IF;
    ELSIF NEW.make = 'פולקסווגן' THEN
        IF txt LIKE '%גולף%' THEN NEW.model := 'גולף';
        ELSIF txt LIKE '%פאסאט%' THEN NEW.model := 'פאסאת';
        ELSIF txt LIKE '%פולו%' THEN NEW.model := 'פולו';
        ELSIF txt LIKE '%טיגואן%' THEN NEW.model := 'טיגואן';
        END IF;
    ELSIF NEW.make = 'פורד' THEN
        IF txt LIKE '%פוקוס%' THEN NEW.model := 'פוקוס';
        ELSIF txt LIKE '%פיאסטה%' THEN NEW.model := 'פיאסטה';
        ELSIF txt LIKE '%מונדאו%' THEN NEW.model := 'מונדאו';
        END IF;
    ELSIF NEW.make = 'יונדאי' THEN
        IF txt LIKE '%i10%' THEN NEW.model := 'i10';
        ELSIF txt LIKE '%i20%' THEN NEW.model := 'i20';
        ELSIF txt LIKE '%i30%' THEN NEW.model := 'i30';
        ELSIF txt LIKE '%i40%' THEN NEW.model := 'i40';
        ELSIF txt LIKE '%טוסון%' THEN NEW.model := 'טוסון';
        ELSIF txt LIKE '%סנטה%' THEN NEW.model := 'סנטה פה';
        END IF;
    ELSIF NEW.make = 'קיה' THEN
        IF txt LIKE '%ספורטאז%' THEN NEW.model := 'ספורטאז';
        ELSIF txt LIKE '%סורנטו%' THEN NEW.model := 'סורנטו';
        ELSIF txt LIKE '%פיקנטו%' THEN NEW.model := 'פיקנטו';
        ELSIF txt LIKE '%ריו%' THEN NEW.model := 'ריו';
        ELSIF txt LIKE '%סיד%' THEN NEW.model := 'סיד';
        END IF;
    END IF;
    
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
    ON catalog_items FOR EACH ROW
    EXECUTE FUNCTION extract_model_and_year();
