-- Quick status check after final Hebrew fix

SELECT 
    'HEBREW FIX STATUS:' as info,
    COUNT(CASE WHEN is_hebrew_reversed(cat_num_desc) THEN 1 END) as still_reversed,
    COUNT(*) as total_records,
    ROUND(COUNT(CASE WHEN is_hebrew_reversed(cat_num_desc) THEN 1 END)::NUMERIC / COUNT(*) * 100, 2) as reversed_pct
FROM catalog_items;

-- Show a few samples
SELECT 
    'Sample records:' as info,
    cat_num_desc,
    make,
    CASE 
        WHEN cat_num_desc LIKE '%מגן%' OR cat_num_desc LIKE '%מכסה%' OR cat_num_desc LIKE '%ציר%' THEN '✅ CORRECT'
        WHEN cat_num_desc LIKE '%ןגמ%' OR cat_num_desc LIKE '%הסכמ%' OR cat_num_desc LIKE '%ריצ%' THEN '❌ REVERSED'
        ELSE '?'
    END as status
FROM catalog_items
WHERE cat_num_desc ~ '[\u0590-\u05FF]'
LIMIT 10;
