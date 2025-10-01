-- PHASE 2B: DIAGNOSTIC - Check what's happening with part name extraction

-- First, let's see the actual numbers
SELECT 
    'Part Name Extraction Diagnostic:' as status,
    COUNT(*) as total_hebrew_records,
    COUNT(part_name) as has_part_name,
    COUNT(*) - COUNT(part_name) as remaining_to_process,
    ROUND(COUNT(part_name) * 100.0 / COUNT(*), 1) as completion_percentage
FROM catalog_items
WHERE cat_num_desc IS NOT NULL AND cat_num_desc ~ '^[\u0590-\u05FF]';

-- Check if there are any records that should be processed but aren't
SELECT 
    'Records that should be processed:' as check_type,
    COUNT(*) as count
FROM catalog_items 
WHERE part_name IS NULL 
  AND cat_num_desc IS NOT NULL 
  AND cat_num_desc ~ '^[\u0590-\u05FF]';

-- Show a few sample records that need processing
SELECT 
    'Sample unprocessed records:' as sample_type,
    id,
    cat_num_desc,
    part_name,
    CASE 
        WHEN cat_num_desc ~ '^[\u0590-\u05FF]' THEN 'Matches Hebrew pattern'
        ELSE 'Does not match Hebrew pattern'
    END as pattern_check
FROM catalog_items 
WHERE part_name IS NULL 
  AND cat_num_desc IS NOT NULL 
  AND cat_num_desc ~ '^[\u0590-\u05FF]'
LIMIT 5;

-- Test the regex on a sample
SELECT 
    'Regex test on sample:' as test_type,
    cat_num_desc,
    (regexp_match(cat_num_desc, '^([\u0590-\u05FF]+(?:\s+[\u0590-\u05FF]+)*?)'))[1] as extracted_part
FROM catalog_items 
WHERE part_name IS NULL 
  AND cat_num_desc IS NOT NULL 
  AND cat_num_desc ~ '^[\u0590-\u05FF]'
LIMIT 3;