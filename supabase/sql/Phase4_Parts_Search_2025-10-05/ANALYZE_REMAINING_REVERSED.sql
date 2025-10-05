-- Check what's in the remaining 1,335 reversed records

SELECT 
    'Remaining reversed records sample' as status,
    cat_num_desc,
    'What pattern is this?' as question
FROM catalog_items
WHERE cat_num_desc LIKE '%עונמ%' 
   OR cat_num_desc LIKE '%הרמנפ%'
   OR cat_num_desc LIKE '%ןגמ%'
   OR cat_num_desc LIKE '%קוזיח%'
LIMIT 20;

-- Check if it's a specific pattern
SELECT 
    'Pattern analysis' as check,
    CASE 
        WHEN cat_num_desc LIKE '%ןגמ %' THEN 'Has ןגמ with space after'
        WHEN cat_num_desc LIKE '% ןגמ%' THEN 'Has ןגמ with space before'
        WHEN cat_num_desc LIKE '%ןגמ' THEN 'Ends with ןגמ'
        WHEN cat_num_desc LIKE 'ןגמ%' THEN 'Starts with ןגמ'
        ELSE 'Other pattern'
    END as pattern_type,
    COUNT(*) as count
FROM catalog_items
WHERE cat_num_desc LIKE '%ןגמ%'
GROUP BY pattern_type;
