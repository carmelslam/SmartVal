-- TEST SEARCH WITH FULL DATA ROW
-- After inserting test row, run these searches to verify all parameters work

-- Test 1: Search by model_code (should find the test row)
SELECT 'Test 1: Model code ZVG12L-KHXGBW' as test_name;
SELECT make, model, cat_num_desc, price
FROM smart_parts_search(
    model_code_param := 'ZVG12L-KHXGBW'
)
WHERE pcode = 'TEST-12345'
LIMIT 1;

-- Test 2: Search by model_code prefix (should cascade: ZVG12L-KHXGBW → ZVG12L)
SELECT 'Test 2: Model code prefix ZVG12L' as test_name;
SELECT make, model, cat_num_desc, price
FROM smart_parts_search(
    model_code_param := 'ZVG12L'
)
WHERE pcode = 'TEST-12345'
LIMIT 1;

-- Test 3: Search by trim
SELECT 'Test 3: Trim ADVENTURE' as test_name;
SELECT make, model, cat_num_desc, price
FROM smart_parts_search(
    make_param := 'טויוטה',
    trim_param := 'ADVENTURE'
)
WHERE pcode = 'TEST-12345'
LIMIT 1;

-- Test 4: Search by engine_code
SELECT 'Test 4: Engine code 2ZR' as test_name;
SELECT make, model, cat_num_desc, price
FROM smart_parts_search(
    make_param := 'טויוטה',
    engine_code_param := '2ZR'
)
WHERE pcode = 'TEST-12345'
LIMIT 1;

-- Test 5: Search by engine_type
SELECT 'Test 5: Engine type בנזין' as test_name;
SELECT make, model, cat_num_desc, price
FROM smart_parts_search(
    make_param := 'טויוטה',
    engine_type_param := 'בנזין'
)
WHERE pcode = 'TEST-12345'
LIMIT 1;

-- Test 6: Search by VIN
SELECT 'Test 6: VIN number' as test_name;
SELECT make, model, cat_num_desc, price
FROM smart_parts_search(
    vin_number_param := 'JTNADACB20J001538'
)
WHERE pcode = 'TEST-12345'
LIMIT 1;

-- Test 7: Search by OEM
SELECT 'Test 7: OEM search' as test_name;
SELECT make, model, oem, cat_num_desc, price
FROM smart_parts_search(
    oem_param := 'מספר OEM'
)
WHERE pcode = 'TEST-12345'
LIMIT 1;

-- Test 8: Combined search with ALL parameters
SELECT 'Test 8: All parameters combined' as test_name;
SELECT make, model, year_from, cat_num_desc, price
FROM smart_parts_search(
    make_param := 'טויוטה יפן',
    model_param := 'COROLLA CROSS',
    model_code_param := 'ZVG12L-KHXGBW',
    trim_param := 'ADVENTURE',
    year_param := '2022',
    engine_code_param := '2ZR',
    engine_type_param := 'בנזין',
    part_param := 'כנף אחורית'
)
WHERE pcode = 'TEST-12345'
LIMIT 1;

-- Test 9: Multi-word cascading with full data
SELECT 'Test 9: Multi-word part cascading' as test_name;
SELECT make, model, cat_num_desc, price
FROM smart_parts_search(
    make_param := 'טויוטה',
    model_param := 'COROLLA CROSS',
    part_param := 'כנף אחורית שמאלית'
)
WHERE pcode = 'TEST-12345'
LIMIT 1;

-- Test 10: Year normalization (2022 → 022)
SELECT 'Test 10: Year normalization 2022 → 022' as test_name;
SELECT make, model, year_from, extracted_year, cat_num_desc, price
FROM smart_parts_search(
    make_param := 'טויוטה',
    year_param := '2022'
)
WHERE pcode = 'TEST-12345'
LIMIT 1;
