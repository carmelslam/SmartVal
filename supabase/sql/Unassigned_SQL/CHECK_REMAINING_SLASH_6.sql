-- Check the remaining 6 records with reversed slash patterns

SELECT 
    cat_num_desc,
    make,
    part_name
FROM catalog_items
WHERE cat_num_desc LIKE '%/%'
  AND (cat_num_desc LIKE '%תכרע%' OR cat_num_desc LIKE '%שנלפ%' OR cat_num_desc LIKE '%רלוק%'
       OR cat_num_desc LIKE '%קופר%' OR cat_num_desc LIKE '%הארמ%' OR cat_num_desc LIKE '%הזיבי%'
       OR cat_num_desc LIKE '%דיזל%' OR cat_num_desc LIKE '%דס%' OR cat_num_desc LIKE '%אוןיזנב%'
       OR cat_num_desc LIKE '%האיטל%' OR cat_num_desc LIKE '%הבעמ%' OR cat_num_desc LIKE '%אקספ%'
       OR cat_num_desc LIKE '%דידמ%' OR cat_num_desc LIKE '%אוקט%' OR cat_num_desc LIKE '%דגנר%');

-- Check for any other reversed patterns we might have missed
SELECT 
    cat_num_desc,
    COUNT(*) as count
FROM catalog_items
WHERE cat_num_desc LIKE '%/%'
  AND (
    cat_num_desc ~ '[א-ת]{4,}.*/' OR  -- Hebrew word before slash
    cat_num_desc ~ '/.*[א-ת]{4,}'     -- Hebrew word after slash
  )
GROUP BY cat_num_desc
ORDER BY count DESC
LIMIT 20;
