-- VERIFY TEST ROW EXISTS AND CHECK ITS DATA

-- 1. Check if row exists
SELECT 'Row exists?' as test;
SELECT COUNT(*) as count FROM catalog_items WHERE pcode = 'TEST-12345';

-- 2. Check all fields in the test row
SELECT 'Test row data:' as test;
SELECT 
    id,
    pcode,
    cat_num_desc,
    make,
    model,
    model_code,
    trim,
    year_from,
    year_to,
    engine_code,
    engine_type,
    engine_volume,
    vin,
    oem,
    part_family,
    source,
    price,
    side_position,
    front_rear
FROM catalog_items 
WHERE pcode = 'TEST-12345';

-- 3. Test if simple search finds it by make
SELECT 'Search by make only:' as test;
SELECT make, model, cat_num_desc, price, pcode
FROM smart_parts_search(make_param := 'טויוטה')
WHERE pcode = 'TEST-12345'
LIMIT 1;

-- 4. Test if search finds it by model
SELECT 'Search by make + model:' as test;
SELECT make, model, cat_num_desc, price, pcode
FROM smart_parts_search(
    make_param := 'טויוטה',
    model_param := 'COROLLA CROSS'
)
WHERE pcode = 'TEST-12345'
LIMIT 1;

-- 5. Test if search finds it by part
SELECT 'Search by part (כנף):' as test;
SELECT make, model, cat_num_desc, price, pcode
FROM smart_parts_search(part_param := 'כנף')
WHERE pcode = 'TEST-12345'
LIMIT 1;

-- 6. Check if Hebrew was reversed by trigger
SELECT 'Check Hebrew reversal:' as test;
SELECT 
    cat_num_desc,
    make,
    source,
    part_family
FROM catalog_items 
WHERE pcode = 'TEST-12345';
