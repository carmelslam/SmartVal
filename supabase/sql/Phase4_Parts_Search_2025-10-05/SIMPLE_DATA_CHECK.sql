-- Simple check to see the actual issues in the data

-- Check 1: See sample part descriptions (to check word order)
SELECT 
    'Part Description Check' as issue,
    pcode,
    cat_num_desc,
    part_family,
    'Is word order backwards?' as question
FROM catalog_items
WHERE cat_num_desc LIKE '%פנס%'
LIMIT 10;

-- Check 2: See year values (to check reversal)
SELECT 
    'Year Reversal Check' as issue,
    cat_num_desc,
    year_from,
    year_to,
    year_range,
    'Are years reversed like 810 instead of 018?' as question
FROM catalog_items
WHERE year_from IS NOT NULL
LIMIT 20;

-- Check 3: See source values (to check Hebrew reversal)
SELECT 
    'Source Field Check' as issue,
    source,
    COUNT(*) as count,
    'Is Hebrew reversed?' as question
FROM catalog_items
WHERE source IS NOT NULL
GROUP BY source
ORDER BY count DESC
LIMIT 5;

