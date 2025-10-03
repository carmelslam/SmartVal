-- DELETE OLD TEST ROW AND INSERT PROPER ONE
-- This row mimics real catalog patterns:
-- - Hebrew will be reversed by trigger
-- - part_name will be auto-extracted
-- - part_family will be auto-categorized
-- - source will default to חליפי

-- Delete old test row
DELETE FROM catalog_items WHERE pcode = 'TEST-12345';

-- Insert new test row with REALISTIC data patterns
-- Note: Insert Hebrew BACKWARDS (like source data), trigger will reverse it
INSERT INTO catalog_items (
    cat_num_desc,
    supplier_name,
    pcode,
    price,
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
    version_date,
    side_position,
    front_rear
) VALUES (
    'ADVENTURE סורק הלורוק - תילאמש תירוחא ףנכ',
    'טסט ספק',
    'TEST-12345',
    9999.99,
    'ןפי הטויוט',
    'COROLLA CROSS',
    'ZVG12L-KHXGBW',
    'ADVENTURE',
    2022,
    2025,
    '2ZR',
    'ןיזנב',
    '2.0',
    'JTNADACB20J001538',
    '12345-67890',
    '2025-10-03',
    NULL,
    NULL
);

-- Verify the insert and trigger processing
SELECT 'Test row after trigger processing:' as test;
SELECT 
    id,
    pcode,
    cat_num_desc,
    part_name,
    make,
    model,
    model_code,
    trim,
    year_from,
    engine_code,
    engine_type,
    oem,
    part_family,
    source,
    price
FROM catalog_items 
WHERE pcode = 'TEST-12345';

-- Test search with this row
SELECT 'Search for test row by part:' as test;
SELECT make, model, cat_num_desc, part_family, price, pcode
FROM smart_parts_search(part_param := 'כנף אחורית')
WHERE pcode = 'TEST-12345'
LIMIT 1;

SELECT 'Search by all parameters:' as test;
SELECT make, model, cat_num_desc, price, pcode
FROM smart_parts_search(
    make_param := 'טויוטה',
    model_param := 'COROLLA CROSS',
    model_code_param := 'ZVG12L-KHXGBW',
    trim_param := 'ADVENTURE',
    year_param := '2022',
    engine_code_param := '2ZR',
    part_param := 'כנף אחורית שמאלית'
)
WHERE pcode = 'TEST-12345'
LIMIT 1;
