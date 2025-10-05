-- Fix reversed model names in cat_num_desc
-- These are model names embedded in descriptions that weren't caught earlier

-- Fix ףלוג → גולף (Golf - 423 records)
UPDATE catalog_items
SET cat_num_desc = REPLACE(cat_num_desc, 'ףלוג', 'גולף')
WHERE cat_num_desc LIKE '%ףלוג%';

SELECT 'Fixed גולף' as status, COUNT(*) as remaining
FROM catalog_items WHERE cat_num_desc LIKE '%ףלוג%';

-- Fix ולופ → פולו (Polo - 197 records)
UPDATE catalog_items
SET cat_num_desc = REPLACE(cat_num_desc, 'ולופ', 'פולו')
WHERE cat_num_desc LIKE '%ולופ%';

SELECT 'Fixed פולו' as status, COUNT(*) as remaining
FROM catalog_items WHERE cat_num_desc LIKE '%ולופ%';

-- Fix ןאוגיט → טיגואן (Tiguan - 74 records)
UPDATE catalog_items
SET cat_num_desc = REPLACE(cat_num_desc, 'ןאוגיט', 'טיגואן')
WHERE cat_num_desc LIKE '%ןאוגיט%';

SELECT 'Fixed טיגואן' as status, COUNT(*) as remaining
FROM catalog_items WHERE cat_num_desc LIKE '%ןאוגיט%';

-- Fix סוקופ → פוקוס (Focus - 31 records)
UPDATE catalog_items
SET cat_num_desc = REPLACE(cat_num_desc, 'סוקופ', 'פוקוס')
WHERE cat_num_desc LIKE '%סוקופ%';

SELECT 'Fixed פוקוס' as status, COUNT(*) as remaining
FROM catalog_items WHERE cat_num_desc LIKE '%סוקופ%';

-- Check for other common reversed patterns
SELECT 
    'Other potential reversed patterns' as section;

SELECT 
    cat_num_desc,
    COUNT(*) as count
FROM catalog_items
WHERE cat_num_desc ~ '[א-ת]{5,}'  -- 5+ consecutive Hebrew chars
  AND (cat_num_desc LIKE '%היבטקוא%' 
    OR cat_num_desc LIKE '%תאסאפ%'
    OR cat_num_desc LIKE '%הטש%'
    OR cat_num_desc LIKE '%ירמאק%')
GROUP BY cat_num_desc
ORDER BY count DESC
LIMIT 10;
