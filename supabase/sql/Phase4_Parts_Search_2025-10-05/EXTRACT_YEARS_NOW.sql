-- ============================================================================
-- EXTRACT YEARS NOW - One-time manual extraction
-- Date: 2025-10-05
-- Purpose: Extract years from cat_num_desc into year_from/year_to columns
-- ============================================================================

-- Extract year patterns from cat_num_desc
-- Patterns: "13-", "-013", "010-014", etc.

UPDATE catalog_items
SET 
    year_from = CASE
        -- Pattern: "13-" or "013-" at start/end (single year)
        WHEN cat_num_desc ~ '\y0?(\d{2})-' THEN 
            2000 + (substring(cat_num_desc from '\y0?(\d{2})-'))::INT
        
        -- Pattern: "010-014" (year range)
        WHEN cat_num_desc ~ '0?(\d{2})-0?(\d{2})' THEN
            2000 + (substring(cat_num_desc from '0?(\d{2})-0?\d{2}'))::INT
        
        ELSE NULL
    END,
    
    year_to = CASE
        -- Pattern: "010-014" (year range - get second year)
        WHEN cat_num_desc ~ '0?(\d{2})-0?(\d{2})' THEN
            2000 + (substring(cat_num_desc from '0?\d{2}-0?(\d{2})'))::INT
        
        -- Single year - year_to = year_from
        WHEN cat_num_desc ~ '\y0?(\d{2})-' THEN 
            2000 + (substring(cat_num_desc from '\y0?(\d{2})-'))::INT
        
        ELSE NULL
    END
WHERE cat_num_desc ~ '\d{2,3}-';

-- Calculate year_range
UPDATE catalog_items
SET year_range = CASE
    WHEN year_from IS NOT NULL AND year_to IS NOT NULL THEN
        LPAD((year_from % 100)::TEXT, 3, '0') || '-' || LPAD((year_to % 100)::TEXT, 3, '0')
    WHEN year_from IS NOT NULL THEN
        LPAD((year_from % 100)::TEXT, 3, '0')
    ELSE NULL
END
WHERE year_from IS NOT NULL;

-- Check results
SELECT 
    'Extraction Results' as status,
    cat_num_desc,
    year_from,
    year_to,
    year_range
FROM catalog_items
WHERE pcode LIKE 'VBP4211959%'
LIMIT 10;
