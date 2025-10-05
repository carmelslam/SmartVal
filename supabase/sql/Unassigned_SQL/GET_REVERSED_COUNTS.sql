-- Get counts of remaining reversed patterns

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
    'Records with ולופ (reversed פולו)' as pattern,
    COUNT(*) as count
FROM catalog_items
WHERE cat_num_desc LIKE '%ולופ%'

UNION ALL

SELECT 
    'Records with סוקופ (reversed פוקוס)' as pattern,
    COUNT(*) as count
FROM catalog_items
WHERE cat_num_desc LIKE '%סוקופ%';
