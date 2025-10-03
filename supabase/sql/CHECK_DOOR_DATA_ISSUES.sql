-- Check the actual door data from screenshot to see what's missing

-- Check rows by pcode from screenshot
SELECT 
    pcode,
    cat_num_desc,
    part_family,
    year_from,
    year_to,
    year_range,
    extracted_year,
    make,
    model
FROM catalog_items
WHERE pcode IN ('VBP42072661', 'VBP42072662', 'VB42111211', 'VB42111212', 'VB42111211T')
ORDER BY pcode;

-- Also check if part_family is being reversed
SELECT 
    'Family check:' as test,
    part_family,
    reverse(part_family) as reversed_family
FROM catalog_items
WHERE pcode = 'VBP42072661';
