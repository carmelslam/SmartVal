-- Fix reversed Toyota model names

-- Count first
SELECT 
    'הלורוק (reversed קורולה)' as pattern, COUNT(*) as count
FROM catalog_items WHERE cat_num_desc LIKE '%הלורוק%'
UNION ALL
SELECT 
    'ירמאק (reversed קאמרי)' as pattern, COUNT(*) as count
FROM catalog_items WHERE cat_num_desc LIKE '%ירמאק%'
UNION ALL
SELECT 
    'סירוה (reversed הוריס)' as pattern, COUNT(*) as count
FROM catalog_items WHERE cat_num_desc LIKE '%סירוה%'
UNION ALL
SELECT 
    'סוירפ (reversed פריוס)' as pattern, COUNT(*) as count
FROM catalog_items WHERE cat_num_desc LIKE '%סוירפ%';

-- Fix הלורוק → קורולה (Corolla)
UPDATE catalog_items
SET cat_num_desc = REPLACE(cat_num_desc, 'הלורוק', 'קורולה')
WHERE cat_num_desc LIKE '%הלורוק%';

-- Fix ירמאק → קאמרי (Camry)
UPDATE catalog_items
SET cat_num_desc = REPLACE(cat_num_desc, 'ירמאק', 'קאמרי')
WHERE cat_num_desc LIKE '%ירמאק%';

-- Fix סירוה → הוריס (Auris)
UPDATE catalog_items
SET cat_num_desc = REPLACE(cat_num_desc, 'סירוה', 'הוריס')
WHERE cat_num_desc LIKE '%סירוה%';

-- Fix סוירפ → פריוס (Prius)
UPDATE catalog_items
SET cat_num_desc = REPLACE(cat_num_desc, 'סוירפ', 'פריוס')
WHERE cat_num_desc LIKE '%סוירפ%';

-- Verify
SELECT 
    'הלורוק' as pattern, COUNT(*) as remaining
FROM catalog_items WHERE cat_num_desc LIKE '%הלורוק%'
UNION ALL
SELECT 
    'ירמאק' as pattern, COUNT(*) as remaining
FROM catalog_items WHERE cat_num_desc LIKE '%ירמאק%'
UNION ALL
SELECT 
    'סירוה' as pattern, COUNT(*) as remaining
FROM catalog_items WHERE cat_num_desc LIKE '%סירוה%'
UNION ALL
SELECT 
    'סוירפ' as pattern, COUNT(*) as remaining
FROM catalog_items WHERE cat_num_desc LIKE '%סוירפ%';
