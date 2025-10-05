-- Check what's actually stored in the database

SELECT 
    'Record VB4211317:' as info,
    cat_num_desc,
    length(cat_num_desc) as text_length,
    substring(cat_num_desc, 1, 10) as first_10_chars,
    substring(cat_num_desc, length(cat_num_desc)-9, 10) as last_10_chars
FROM catalog_items 
WHERE pcode = 'VB4211317';

-- Check a few more records
SELECT 
    'Sample records:' as info,
    pcode,
    cat_num_desc,
    CASE 
        WHEN cat_num_desc ~ '^[\u0590-\u05FF]' THEN 'STARTS WITH HEBREW'
        WHEN cat_num_desc ~ '^[0-9]' THEN 'STARTS WITH NUMBER'
        WHEN cat_num_desc ~ '^[A-Za-z]' THEN 'STARTS WITH ENGLISH'
        ELSE 'STARTS WITH OTHER'
    END as starts_with
FROM catalog_items
WHERE cat_num_desc ~ 'קורולה'
LIMIT 5;
