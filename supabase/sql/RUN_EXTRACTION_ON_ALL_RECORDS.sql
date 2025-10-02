-- ============================================================================
-- RUN EXTRACTION ON ALL EXISTING RECORDS
-- Date: 2025-10-02
-- Purpose: Trigger the new extraction function on all 48,272 records
-- Approach: Update cat_num_desc to itself to trigger the BEFORE UPDATE trigger
-- ============================================================================

-- This will trigger the extract_model_and_year() function on all records
-- We do a dummy update to cat_num_desc which triggers the extraction

-- Process in batches to avoid timeout
-- Batch size: 5000 records at a time

UPDATE catalog_items
SET cat_num_desc = cat_num_desc  -- Dummy update triggers the BEFORE UPDATE trigger
WHERE id IN (
    SELECT id 
    FROM catalog_items
    ORDER BY id
    LIMIT 5000
);

-- Check extraction results
SELECT 
    'EXTRACTION RESULTS - BATCH 1' as section,
    COUNT(*) as total_records,
    COUNT(CASE WHEN model IS NOT NULL AND model != '' THEN 1 END) as has_model,
    ROUND(COUNT(CASE WHEN model IS NOT NULL AND model != '' THEN 1 END) * 100.0 / COUNT(*), 1) as model_pct,
    COUNT(CASE WHEN year_from IS NOT NULL THEN 1 END) as has_year,
    ROUND(COUNT(CASE WHEN year_from IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 1) as year_pct
FROM catalog_items;

-- Show sample extracted data
SELECT 
    cat_num_desc,
    make,
    model,
    year_from,
    year_to
FROM catalog_items
WHERE model IS NOT NULL
ORDER BY RANDOM()
LIMIT 10;
