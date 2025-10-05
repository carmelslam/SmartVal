-- ============================================================================
-- FIX 2B: Correct Year Extraction from cat_num_desc
-- Date: 2025-10-05
-- Version: v2
-- Purpose: Extract CORRECT year_from, year_to, and year_range from cat_num_desc
-- ============================================================================

-- The pattern in cat_num_desc is like: "710-110" = 2007-2010 or 2010-2011
-- Pattern: 3-digit-3-digit where first digit might be century indicator

-- Create function to extract years correctly
CREATE OR REPLACE FUNCTION extract_years_from_desc(desc_text TEXT)
RETURNS TABLE(yr_from INT, yr_to INT, yr_range TEXT) AS $$
DECLARE
    year_pattern TEXT;
    matches TEXT[];
    from_str TEXT;
    to_str TEXT;
    from_year INT;
    to_year INT;
BEGIN
    -- Pattern 1: "710-110" or "011-017" (3-digit to 3-digit)
    matches := regexp_match(desc_text, '(\d{3})-(\d{3})');
    
    IF matches IS NOT NULL THEN
        from_str := matches[1];
        to_str := matches[2];
        
        -- Convert to full year: 710 -> 2007, 110 -> 2011
        -- If starts with 0, it's 2000s (011 -> 2011)
        -- If starts with 7-9, it's 2000s (710 -> 2007)  
        -- If starts with 1-6, it's 2010s (110 -> 2011)
        
        from_year := CASE 
            WHEN from_str::INT < 100 THEN 2000 + from_str::INT
            WHEN from_str::INT >= 700 THEN 2000 + (from_str::INT - 700)
            ELSE 2000 + from_str::INT
        END;
        
        to_year := CASE 
            WHEN to_str::INT < 100 THEN 2000 + to_str::INT
            WHEN to_str::INT >= 100 AND to_str::INT < 200 THEN 2010 + (to_str::INT - 100)
            ELSE 2000 + to_str::INT
        END;
        
        -- Create year_range in 3-digit format
        yr_range := LPAD((from_year % 100)::TEXT, 3, '0') || '-' || LPAD((to_year % 100)::TEXT, 3, '0');
        yr_from := from_year;
        yr_to := to_year;
        
        RETURN NEXT;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Test the function first
SELECT 
    'Test extraction' as test,
    cat_num_desc,
    (extract_years_from_desc(cat_num_desc)).*
FROM catalog_items
WHERE cat_num_desc LIKE '%710-110%'
   OR cat_num_desc LIKE '%011-017%'
   OR cat_num_desc LIKE '%510-90%'
LIMIT 10;
