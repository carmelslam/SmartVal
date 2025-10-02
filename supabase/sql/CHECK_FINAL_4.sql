-- Check what the final 4 records with reversed patterns are

SELECT 
    id,
    cat_num_desc,
    make,
    model,
    part_name
FROM catalog_items
WHERE cat_num_desc LIKE '%ףלוג%' OR cat_num_desc LIKE '%ולופ%' 
   OR cat_num_desc LIKE '%ןאוגיט%' OR cat_num_desc LIKE '%סוקופ%'
   OR cat_num_desc LIKE '%היבטקוא%' OR cat_num_desc LIKE '%ןואל%'
   OR cat_num_desc LIKE '%הרוב%' OR cat_num_desc LIKE '%הטלא%'
   OR cat_num_desc LIKE '%הלורוק%' OR cat_num_desc LIKE '%ירמאק%'
   OR cat_num_desc LIKE '%סירוה%' OR cat_num_desc LIKE '%סוירפ%';
