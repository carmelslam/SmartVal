-- Check the Honda Accord record from screenshot

SELECT 
    pcode,
    cat_num_desc,
    year_from,
    year_to,
    year_range,
    'Is cat_num_desc correct but year_from wrong?' as question
FROM catalog_items
WHERE pcode = 'VBP421195926'
   OR cat_num_desc LIKE '%הונדה%אקורד%'
   OR cat_num_desc LIKE '%דרוקא%הדנוה%'
LIMIT 5;
