-- Check exact pcode from screenshot

SELECT 
    pcode,
    cat_num_desc,
    year_from,
    year_to,
    year_range,
    make,
    model
FROM catalog_items
WHERE pcode = 'VBP421195926';

-- Also check similar codes
SELECT 
    pcode,
    cat_num_desc,
    year_from,
    year_to,
    year_range
FROM catalog_items
WHERE pcode LIKE 'VBP4211959%'
LIMIT 10;
