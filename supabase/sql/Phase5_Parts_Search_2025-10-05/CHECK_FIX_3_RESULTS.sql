-- Check how many records were actually updated by FIX 3

-- Count records that still have reversed patterns
SELECT 
    'Records still reversed after FIX 3' as status,
    COUNT(*) as still_reversed_count
FROM catalog_items
WHERE cat_num_desc LIKE '%עונמ%' 
   OR cat_num_desc LIKE '%הרמנפ%'
   OR cat_num_desc LIKE '%הרמנאפ%'
   OR cat_num_desc LIKE '%ןגמ%'
   OR cat_num_desc LIKE '%קוזיח%';

-- Check if the reverse function exists and test it
SELECT 
    'Test reverse function' as test,
    reverse_full_string('עונמ הסכמ') as should_be_correct;
