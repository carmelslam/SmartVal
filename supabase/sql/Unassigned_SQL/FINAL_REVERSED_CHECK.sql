-- Final comprehensive check for any remaining reversed Hebrew patterns

-- Check all the patterns we've fixed
SELECT 
    'All model name reversals' as section;

SELECT 
    'ףלוג (Golf)' as pattern, COUNT(*) as remaining
FROM catalog_items WHERE cat_num_desc LIKE '%ףלוג%'
UNION ALL
SELECT 'ולופ (Polo)', COUNT(*) FROM catalog_items WHERE cat_num_desc LIKE '%ולופ%'
UNION ALL
SELECT 'ןאוגיט (Tiguan)', COUNT(*) FROM catalog_items WHERE cat_num_desc LIKE '%ןאוגיט%'
UNION ALL
SELECT 'סוקופ (Focus)', COUNT(*) FROM catalog_items WHERE cat_num_desc LIKE '%סוקופ%'
UNION ALL
SELECT 'היבטקוא (Octavia)', COUNT(*) FROM catalog_items WHERE cat_num_desc LIKE '%היבטקוא%'
UNION ALL
SELECT 'ןואל (Leon)', COUNT(*) FROM catalog_items WHERE cat_num_desc LIKE '%ןואל%'
UNION ALL
SELECT 'הרוב (Bora)', COUNT(*) FROM catalog_items WHERE cat_num_desc LIKE '%הרוב%'
UNION ALL
SELECT 'הטלא (Alta)', COUNT(*) FROM catalog_items WHERE cat_num_desc LIKE '%הטלא%'
UNION ALL
SELECT 'הלורוק (Corolla)', COUNT(*) FROM catalog_items WHERE cat_num_desc LIKE '%הלורוק%'
UNION ALL
SELECT 'ירמאק (Camry)', COUNT(*) FROM catalog_items WHERE cat_num_desc LIKE '%ירמאק%'
UNION ALL
SELECT 'סירוה (Auris)', COUNT(*) FROM catalog_items WHERE cat_num_desc LIKE '%סירוה%'
UNION ALL
SELECT 'סוירפ (Prius)', COUNT(*) FROM catalog_items WHERE cat_num_desc LIKE '%סוירפ%';

-- Look for any other potential reversed patterns (6+ consecutive Hebrew chars)
SELECT 
    'Potential remaining reversed patterns' as section;

SELECT 
    cat_num_desc,
    make,
    COUNT(*) as occurrences
FROM catalog_items
WHERE cat_num_desc ~ '[א-ת]{6,}'  -- 6+ consecutive Hebrew
  AND cat_num_desc NOT LIKE '%קורולה%'  -- Exclude known good patterns
  AND cat_num_desc NOT LIKE '%טיגואן%'
  AND cat_num_desc NOT LIKE '%גולף%'
  AND cat_num_desc NOT LIKE '%אוקטביה%'
  AND cat_num_desc NOT LIKE '%מיסב%'
  AND cat_num_desc NOT LIKE '%זרוע%'
GROUP BY cat_num_desc, make
ORDER BY occurrences DESC
LIMIT 20;

-- Summary
SELECT 
    'SUMMARY: Total records with any known reversed pattern' as metric,
    COUNT(*) as count
FROM catalog_items
WHERE cat_num_desc LIKE '%ףלוג%' OR cat_num_desc LIKE '%ולופ%' 
   OR cat_num_desc LIKE '%ןאוגיט%' OR cat_num_desc LIKE '%סוקופ%'
   OR cat_num_desc LIKE '%היבטקוא%' OR cat_num_desc LIKE '%ןואל%'
   OR cat_num_desc LIKE '%הרוב%' OR cat_num_desc LIKE '%הטלא%'
   OR cat_num_desc LIKE '%הלורוק%' OR cat_num_desc LIKE '%ירמאק%'
   OR cat_num_desc LIKE '%סירוה%' OR cat_num_desc LIKE '%סוירפ%';
