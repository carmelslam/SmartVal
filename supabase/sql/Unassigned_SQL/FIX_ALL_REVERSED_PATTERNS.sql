-- Comprehensive fix for all remaining reversed Hebrew patterns in cat_num_desc
-- Total: ~179 + previous patterns

-- Fix ןואל → לאון (Leon - 101 records)
UPDATE catalog_items
SET cat_num_desc = REPLACE(cat_num_desc, 'ןואל', 'לאון')
WHERE cat_num_desc LIKE '%ןואל%';

-- Fix הרוב → בורה (Bora - 67 records)
UPDATE catalog_items
SET cat_num_desc = REPLACE(cat_num_desc, 'הרוב', 'בורה')
WHERE cat_num_desc LIKE '%הרוב%';

-- Fix הטלא → אלטא (Alta - 11 records)
UPDATE catalog_items
SET cat_num_desc = REPLACE(cat_num_desc, 'הטלא', 'אלטא')
WHERE cat_num_desc LIKE '%הטלא%';

-- Verify all model name fixes
SELECT 'VERIFICATION - All reversed model names' as section;

SELECT 
    'ןואל (Leon)' as pattern, COUNT(*) as remaining
FROM catalog_items WHERE cat_num_desc LIKE '%ןואל%'
UNION ALL
SELECT 
    'הרוב (Bora)' as pattern, COUNT(*) as remaining
FROM catalog_items WHERE cat_num_desc LIKE '%הרוב%'
UNION ALL
SELECT 
    'הטלא (Alta)' as pattern, COUNT(*) as remaining
FROM catalog_items WHERE cat_num_desc LIKE '%הטלא%'
UNION ALL
SELECT 
    'ףלוג (Golf)' as pattern, COUNT(*) as remaining
FROM catalog_items WHERE cat_num_desc LIKE '%ףלוג%'
UNION ALL
SELECT 
    'ולופ (Polo)' as pattern, COUNT(*) as remaining
FROM catalog_items WHERE cat_num_desc LIKE '%ולופ%'
UNION ALL
SELECT 
    'ןאוגיט (Tiguan)' as pattern, COUNT(*) as remaining
FROM catalog_items WHERE cat_num_desc LIKE '%ןאוגיט%'
UNION ALL
SELECT 
    'סוקופ (Focus)' as pattern, COUNT(*) as remaining
FROM catalog_items WHERE cat_num_desc LIKE '%סוקופ%'
UNION ALL
SELECT 
    'היבטקוא (Octavia)' as pattern, COUNT(*) as remaining
FROM catalog_items WHERE cat_num_desc LIKE '%היבטקוא%';

-- Check for any remaining common reversed patterns
SELECT 'Checking for other reversed patterns' as section;

SELECT 
    cat_num_desc
FROM catalog_items
WHERE cat_num_desc ~ '[א-ת]{6,}'  -- 6+ consecutive Hebrew (likely reversed)
  AND (cat_num_desc LIKE '%ירמאק%'     -- קאמרי
    OR cat_num_desc LIKE '%הלורוק%'   -- קורולה
    OR cat_num_desc LIKE '%תאסאפ%'    -- פאסאת
    OR cat_num_desc LIKE '%ודנאי%'     -- יונדאי
    OR cat_num_desc LIKE '%טגוא%')     -- אוגט
LIMIT 10;
