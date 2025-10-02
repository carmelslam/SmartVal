-- Fix additional reversed model names found in cat_num_desc

-- Fix היבטקוא → אוקטביה (Octavia)
UPDATE catalog_items
SET cat_num_desc = REPLACE(cat_num_desc, 'היבטקוא', 'אוקטביה')
WHERE cat_num_desc LIKE '%היבטקוא%';

SELECT 'Fixed אוקטביה' as status, COUNT(*) as remaining
FROM catalog_items WHERE cat_num_desc LIKE '%היבטקוא%';

-- Check for other common reversed car/part names
SELECT 
    'Checking for more reversed patterns' as section;

-- Look for reversed: אלטא, לאון, הרוב (common VAG models/terms)
SELECT 
    SUBSTRING(cat_num_desc FROM position('הטלא' IN cat_num_desc) FOR 10) as sample,
    COUNT(*) as count
FROM catalog_items
WHERE cat_num_desc LIKE '%הטלא%'
GROUP BY sample
ORDER BY count DESC
LIMIT 5;

SELECT 
    SUBSTRING(cat_num_desc FROM position('ןואל' IN cat_num_desc) FOR 10) as sample,
    COUNT(*) as count
FROM catalog_items
WHERE cat_num_desc LIKE '%ןואל%'
GROUP BY sample
ORDER BY count DESC
LIMIT 5;

SELECT 
    SUBSTRING(cat_num_desc FROM position('הרוב' IN cat_num_desc) FOR 10) as sample,
    COUNT(*) as count
FROM catalog_items
WHERE cat_num_desc LIKE '%הרוב%'
GROUP BY sample
ORDER BY count DESC
LIMIT 5;

-- Count total
SELECT 
    'הטלא (reversed אלטא)' as pattern, COUNT(*) as count
FROM catalog_items WHERE cat_num_desc LIKE '%הטלא%'
UNION ALL
SELECT 
    'ןואל (reversed לאון)' as pattern, COUNT(*) as count
FROM catalog_items WHERE cat_num_desc LIKE '%ןואל%'
UNION ALL
SELECT 
    'הרוב (reversed בורה)' as pattern, COUNT(*) as count
FROM catalog_items WHERE cat_num_desc LIKE '%הרוב%';
