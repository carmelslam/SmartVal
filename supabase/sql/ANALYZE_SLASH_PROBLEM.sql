-- Analyze the exact pattern of the slash problem

-- Look at original examples you provided
SELECT 
    cat_num_desc,
    make,
    part_name
FROM catalog_items
WHERE make IN ('שברולט קור', 'לנדרובר/ר')
   OR cat_num_desc LIKE '%וד / רלזיירק%'
   OR cat_num_desc LIKE '%ר/רבורדנאל%';

-- Check if makes are still reversed
SELECT DISTINCT
    make,
    COUNT(*) as count
FROM catalog_items
WHERE make LIKE '%/%'
GROUP BY make
ORDER BY count DESC;

-- Get sample of current slash issues
SELECT 
    cat_num_desc,
    part_name
FROM catalog_items  
WHERE cat_num_desc LIKE '%6X 61F%'
   OR cat_num_desc LIKE '%ןאוגיט%'
   OR cat_num_desc LIKE '%תחאח%'
LIMIT 5;
