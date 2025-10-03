-- REINSERT TEST ROW WITH FIXED TRIGGER
-- Now that reverse_hebrew() preserves English, ADVENTURE should display correctly

-- Delete old test row
DELETE FROM catalog_items WHERE pcode = 'TEST-12345';

-- Insert test row (Hebrew backwards, English normal)
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
    version_date
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
    '2025-10-03'
);

-- Verify cat_num_desc shows ADVENTURE correctly (not ERUTNEVDA)
SELECT 'Verify English preserved:' as test;
SELECT 
    cat_num_desc,
    make,
    model,
    part_name,
    part_family,
    source,
    price
FROM catalog_items 
WHERE pcode = 'TEST-12345';

-- Test search finds it
SELECT 'Search test:' as test;
SELECT make, model, cat_num_desc, part_family, price
FROM smart_parts_search(
    part_param := 'כנף אחורית'
)
WHERE pcode = 'TEST-12345'
LIMIT 1;
