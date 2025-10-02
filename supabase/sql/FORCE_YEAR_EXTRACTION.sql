-- Force year extraction by directly calling the extraction logic
-- This bypasses the trigger issue

DO $$
DECLARE
    rec RECORD;
    txt text;
    year_match text[];
    yr_from_str text;
    yr_to_str text;
    yr_from_int int;
    yr_to_int int;
    batch_count int := 0;
BEGIN
    FOR rec IN 
        SELECT id, cat_num_desc 
        FROM catalog_items 
        WHERE cat_num_desc ~ '\d{2,3}-\d{2,3}|\d{3}-|\-\d{3}'
          AND (year_from IS NULL OR year_to IS NULL)
        LIMIT 5000
    LOOP
        txt := COALESCE(rec.cat_num_desc, '');
        yr_from_int := NULL;
        yr_to_int := NULL;
        
        -- Pattern 1: XX-XX
        SELECT regexp_match(txt, '(\d{2})-(\d{2})(?:\D|$)') INTO year_match;
        
        -- Pattern 2: XXX-XXX
        IF year_match IS NULL THEN
            SELECT regexp_match(txt, '(\d{3})-(\d{3})(?:\D|$)') INTO year_match;
        END IF;
        
        -- Pattern 3: XXX-
        IF year_match IS NULL THEN
            SELECT regexp_match(txt, '[^\d](\d{3})-(?:\s|$)') INTO year_match;
        END IF;
        
        -- Pattern 4: -XXX
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
                    UPDATE catalog_items 
                    SET year_from = yr_from_int, year_to = yr_from_int 
                    WHERE id = rec.id;
                    batch_count := batch_count + 1;
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
                    UPDATE catalog_items SET year_to = yr_to_int WHERE id = rec.id;
                END IF;
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Processed % records', batch_count;
END $$;

-- Check results
SELECT COUNT(*) as total, COUNT(year_from) as has_year, ROUND(COUNT(year_from) * 100.0 / COUNT(*), 1) as year_pct FROM catalog_items;
