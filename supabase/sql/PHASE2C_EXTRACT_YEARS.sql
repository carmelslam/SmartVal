-- PHASE 2: EXTRACT YEARS - Single batch approach
-- Run this after part names are extracted

-- Extract year ranges from cat_num_desc
UPDATE catalog_items 
SET extracted_year = (regexp_match(cat_num_desc, '(\d{2,4}-\d{2,4}|\d{4})'))[1]
WHERE extracted_year IS NULL 
  AND cat_num_desc ~ '\d{2,4}'
  AND id IN (
    SELECT id 
    FROM catalog_items 
    WHERE extracted_year IS NULL 
      AND cat_num_desc ~ '\d{2,4}'
    LIMIT 5000  -- Process 5000 at a time
  );

-- Check progress
SELECT 
    'Year Extraction Progress:' as status,
    COUNT(*) as total_records_with_years,
    COUNT(extracted_year) as has_extracted_year,
    COUNT(*) - COUNT(extracted_year) as remaining_to_process,
    ROUND(COUNT(extracted_year) * 100.0 / COUNT(*), 1) as completion_percentage
FROM catalog_items
WHERE cat_num_desc ~ '\d{2,4}';

SELECT 'If completion_percentage < 100, run this script again until 100%' as instruction;