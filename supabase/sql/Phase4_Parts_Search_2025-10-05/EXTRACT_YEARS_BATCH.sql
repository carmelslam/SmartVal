-- ============================================================================
-- EXTRACT YEARS - Batched (run this multiple times)
-- Date: 2025-10-05
-- Purpose: Extract years in small batches to avoid timeout
-- ============================================================================

-- Process 1000 records at a time
WITH batch AS (
    SELECT id, cat_num_desc
    FROM catalog_items
    WHERE year_from IS NULL
      AND cat_num_desc ~ '\d{2,3}-'
    LIMIT 1000
)
UPDATE catalog_items ci
SET 
    year_from = CASE
        WHEN b.cat_num_desc ~ '(\d{2})-' THEN 
            2000 + (substring(b.cat_num_desc from '(\d{2})-'))::INT
        ELSE NULL
    END,
    year_to = CASE
        WHEN b.cat_num_desc ~ '(\d{2})-(\d{2})' THEN
            2000 + (substring(b.cat_num_desc from '-(\d{2})'))::INT
        WHEN b.cat_num_desc ~ '(\d{2})-' THEN 
            2000 + (substring(b.cat_num_desc from '(\d{2})-'))::INT
        ELSE NULL
    END
FROM batch b
WHERE ci.id = b.id;

-- Check progress
SELECT 
    'Progress Check' as status,
    COUNT(*) as total_records,
    COUNT(year_from) as has_year_from,
    COUNT(*) - COUNT(year_from) as remaining
FROM catalog_items;
