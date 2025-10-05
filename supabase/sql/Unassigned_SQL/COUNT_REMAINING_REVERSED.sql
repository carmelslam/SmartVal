-- Count how many cat_num_desc still have reversed Hebrew

-- Check for known reversed patterns
SELECT 
    'Records with ןאוגיט (reversed טיגואן)' as pattern,
    COUNT(*) as count
FROM catalog_items
WHERE cat_num_desc LIKE '%ןאוגיט%'

UNION ALL

SELECT 
    'Records with ףלוג (reversed גולף)' as pattern,
    COUNT(*) as count
FROM catalog_items
WHERE cat_num_desc LIKE '%ףלוג%'

UNION ALL

SELECT 
    'Records with תאסאפ (reversed פאסאת)' as pattern,
    COUNT(*) as count
FROM catalog_items
WHERE cat_num_desc LIKE '%תאסאפ%'

UNION ALL

SELECT 
    'Records starting with reversed patterns' as pattern,
    COUNT(*) as count
FROM catalog_items
WHERE cat_num_desc LIKE 'ןאוגיט%'
   OR cat_num_desc LIKE 'ףלוג%'
   OR cat_num_desc LIKE 'תאסאפ%'
   OR cat_num_desc LIKE 'ולופ%'
   OR cat_num_desc LIKE 'סוקופ%'
   OR cat_num_desc LIKE 'הלורוק%'
   OR cat_num_desc LIKE 'ירמאק%';

-- Sample reversed records
SELECT 
    cat_num_desc,
    make,
    model
FROM catalog_items
WHERE cat_num_desc LIKE '%ןאוגיט%'
   OR cat_num_desc LIKE '%ףלוג%'
LIMIT 20;
