-- INSERT TEST ROW WITH FULL DATA FROM SCREENSHOT
-- This will test all 16 search parameters with complete data

INSERT INTO catalog_items (
    cat_num_desc,
    supplier_name,
    pcode,
    price,
    oem,
    make,
    model,
    model_code,
    trim,
    year_from,
    year_to,
    engine_volume,
    engine_code,
    engine_type,
    vin,
    part_family,
    source,
    side_position,
    front_rear,
    version_date
) VALUES (
    'כנף אחורית שמאלית קורולה קרוס ADVENTURE',
    'טסט ספק',
    'TEST-12345',
    9999.99,
    'מספר OEM',
    'טויוטה יפן',
    'COROLLA CROSS',
    'ZVG12L-KHXGBW',
    'ADVENTURE',
    2022,
    2025,
    'נפח מנוע',
    '2ZR',
    'בנזין',
    'JTNADACB20J001538',
    'בחר קבוצת חלקים',
    'בחר מקור',
    'שמאל',
    'אחורי',
    '2025-10-03'
);

-- Verify the insert
SELECT 
    id,
    cat_num_desc,
    make,
    model,
    model_code,
    trim,
    year_from,
    engine_code,
    engine_type,
    engine_volume,
    vin,
    oem,
    part_family,
    source,
    price
FROM catalog_items 
WHERE pcode = 'TEST-12345';
