-- Check for reversed Hebrew in fields containing slashes

-- Check makes with slashes
SELECT 
    'MAKES WITH SLASHES' as section;

SELECT 
    make,
    COUNT(*) as count
FROM catalog_items
WHERE make LIKE '%/%'
GROUP BY make
ORDER BY count DESC;

-- Check part_family with slashes
SELECT 
    'PART_FAMILY WITH SLASHES' as section;

SELECT 
    part_family,
    COUNT(*) as count
FROM catalog_items
WHERE part_family LIKE '%/%'
GROUP BY part_family
ORDER BY count DESC
LIMIT 20;

-- Check model with slashes
SELECT 
    'MODEL WITH SLASHES' as section;

SELECT 
    model,
    COUNT(*) as count
FROM catalog_items
WHERE model LIKE '%/%'
GROUP BY model
ORDER BY count DESC
LIMIT 20;

-- Sample cat_num_desc with slashes
SELECT 
    'CAT_NUM_DESC WITH SLASHES' as section;

SELECT 
    cat_num_desc,
    COUNT(*) as count
FROM catalog_items
WHERE cat_num_desc LIKE '%/%'
  AND (cat_num_desc LIKE '%ו%' OR cat_num_desc LIKE '%ר%')
GROUP BY cat_num_desc
ORDER BY count DESC
LIMIT 20;
