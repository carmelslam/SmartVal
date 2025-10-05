-- FIND WHAT DOOR PATTERNS ACTUALLY EXIST IN THE DATA

-- 1. Search for any variation of door
SELECT 'DOOR PATTERN SEARCH:' as status;

-- Check common door patterns
SELECT 'Normal דלת:' as pattern, COUNT(*) FROM catalog_items WHERE cat_num_desc ILIKE '%דלת%';
SELECT 'Reversed תלד:' as pattern, COUNT(*) FROM catalog_items WHERE cat_num_desc ILIKE '%תלד%';
SELECT 'Door English:' as pattern, COUNT(*) FROM catalog_items WHERE cat_num_desc ILIKE '%door%';
SELECT 'Delet Hebrew:' as pattern, COUNT(*) FROM catalog_items WHERE cat_num_desc ILIKE '%דלת%';

-- 2. Sample what cat_num_desc actually looks like
SELECT 'SAMPLE CAT_NUM_DESC:' as status;
SELECT cat_num_desc, make, supplier_name
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL
LIMIT 20;

-- 3. Search for common car part terms
SELECT 'PART SEARCH RESULTS:' as status;
SELECT 'Lights פנס:' as part_type, COUNT(*) FROM catalog_items WHERE cat_num_desc ILIKE '%פנס%';
SELECT 'Lights reversed סנפ:' as part_type, COUNT(*) FROM catalog_items WHERE cat_num_desc ILIKE '%סנפ%';
SELECT 'Mirror מראה:' as part_type, COUNT(*) FROM catalog_items WHERE cat_num_desc ILIKE '%מראה%';
SELECT 'Mirror reversed הארמ:' as part_type, COUNT(*) FROM catalog_items WHERE cat_num_desc ILIKE '%הארמ%';
SELECT 'Bumper מגן:' as part_type, COUNT(*) FROM catalog_items WHERE cat_num_desc ILIKE '%מגן%';
SELECT 'Bumper reversed ןגמ:' as part_type, COUNT(*) FROM catalog_items WHERE cat_num_desc ILIKE '%ןגמ%';

-- 4. Search for any Hebrew text patterns
SELECT 'HEBREW TEXT CHECK:' as status;
SELECT COUNT(*) as has_hebrew FROM catalog_items WHERE cat_num_desc ~ '[א-ת]';

-- 5. Look for actual door terms that might exist
SELECT 'DOOR VARIATIONS:' as status;
SELECT cat_num_desc, COUNT(*) 
FROM catalog_items 
WHERE cat_num_desc ILIKE '%door%' 
   OR cat_num_desc ILIKE '%דלת%'
   OR cat_num_desc ILIKE '%תלד%'
   OR cat_num_desc ILIKE '%דלף%'
   OR cat_num_desc ILIKE '%בלת%'
GROUP BY cat_num_desc
LIMIT 10;

-- 6. Search for Toyota specifically
SELECT 'TOYOTA DATA:' as status;
SELECT cat_num_desc, make, model, price
FROM catalog_items 
WHERE make ILIKE '%טויוטה%'
LIMIT 10;