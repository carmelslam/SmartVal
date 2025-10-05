-- PHASE 2: EXTRACT PART NAMES - Single batch approach
-- Run this after PHASE2_STEP_BY_STEP.sql

-- Extract part_name using first Hebrew word(s) from cat_num_desc
-- Processing in smaller manageable batch
UPDATE catalog_items 
SET part_name = (regexp_match(cat_num_desc, '^([\u0590-\u05FF]+(?:\s+[\u0590-\u05FF]+)*?)'))[1]
WHERE part_name IS NULL 
  AND cat_num_desc IS NOT NULL 
  AND cat_num_desc ~ '^[\u0590-\u05FF]'
  AND id IN (
    SELECT id 
    FROM catalog_items 
    WHERE part_name IS NULL 
      AND cat_num_desc IS NOT NULL 
      AND cat_num_desc ~ '^[\u0590-\u05FF]'
    LIMIT 5000  -- Process 5000 at a time
  );

-- Check progress
SELECT 
    'Part Name Extraction Progress:' as status,
    COUNT(*) as total_records,
    COUNT(part_name) as has_part_name,
    COUNT(*) - COUNT(part_name) as remaining_to_process,
    ROUND(COUNT(part_name) * 100.0 / COUNT(*), 1) as completion_percentage
FROM catalog_items
WHERE cat_num_desc IS NOT NULL AND cat_num_desc ~ '^[\u0590-\u05FF]';

SELECT 'If completion_percentage < 100, run this script again until 100%' as instruction;