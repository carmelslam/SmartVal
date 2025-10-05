-- CHECK TEST ROW DETAILS
SELECT 
    pcode,
    cat_num_desc,
    part_name,
    part_family,
    make,
    model,
    year_from,
    price
FROM catalog_items
WHERE pcode = 'TEST-12345';
