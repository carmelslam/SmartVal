-- FIX ALL REVERSED DATA IMMEDIATELY

-- 1. Fix reversed make names
UPDATE catalog_items
SET make = CASE
    -- Reversed Hebrew makes
    WHEN make = 'הטויוט' THEN 'טויוטה'
    WHEN make = 'הטויוט ןפי' THEN 'טויוטה'
    WHEN make = 'ןאסינ' THEN 'ניסן'
    WHEN make = 'יאדנוי' THEN 'יונדאי'
    WHEN make = 'הדנוה' THEN 'הונדה'
    WHEN make = 'הדזמ' THEN 'מזדה'
    WHEN make = 'היק' THEN 'קיה'
    WHEN make = 'ודרופ' THEN 'פורד'
    WHEN make = 'טלורבש' THEN 'שברולט'
    WHEN make = 'יקוזוס' THEN 'סוזוקי'
    WHEN make = 'ישיבוצימ' THEN 'מיצובישי'
    WHEN make = 'ונר' THEN 'רנו'
    WHEN make = 'ו\'גיפ' THEN 'פיג\'ו'
    WHEN make = 'ןאאורטיס' THEN 'סיטרואן'
    WHEN make = 'לפוא' THEN 'אופל'
    WHEN make = 'הדוקס' THEN 'סקודה'
    WHEN make = 'טאיס' THEN 'סיאט'
    WHEN make = 'וראבוס' THEN 'סובארו'
    -- Remove country suffixes
    WHEN make LIKE '%ןפי' THEN REPLACE(make, ' ןפי', '')
    WHEN make LIKE '%בהרא' THEN REPLACE(make, ' בהרא', '')
    WHEN make LIKE '%הינמרג' THEN REPLACE(make, ' הינמרג', '')
    WHEN make LIKE '%האירוק' THEN REPLACE(make, ' האירוק', '')
    ELSE make
END
WHERE make IS NOT NULL;

-- 2. Fix reversed supplier names
UPDATE catalog_items
SET supplier_name = CASE
    WHEN supplier_name = 'םירלכמ סניפ' THEN 'פינס מכלרים'
    WHEN supplier_name = 'סניפ .מ' THEN 'מ. פינס'
    ELSE supplier_name
END
WHERE supplier_name IS NOT NULL;

-- 3. Fix reversed source
UPDATE catalog_items
SET source = CASE
    WHEN source = 'ירוקמ' THEN 'מקורי'
    WHEN source = 'יפולח' THEN 'חלופי'
    WHEN source = 'שדח' THEN 'חדש'
    ELSE source
END
WHERE source IS NOT NULL;

-- 4. Check results
SELECT 'CHECKING FIXES:' as status;

-- Check makes
SELECT 'MAKE VALUES:' as check_type;
SELECT DISTINCT make, COUNT(*) as count
FROM catalog_items
WHERE make IS NOT NULL
GROUP BY make
ORDER BY count DESC
LIMIT 10;

-- Check if we can find Toyota
SELECT 'TOYOTA SEARCH TEST:' as check_type;
SELECT COUNT(*) as toyota_count
FROM catalog_items
WHERE make = 'טויוטה' OR make LIKE 'טויוטה%';

-- Check if we can find doors
SELECT 'DOOR SEARCH TEST:' as check_type;
SELECT COUNT(*) as door_count
FROM catalog_items
WHERE cat_num_desc LIKE '%תלד%' OR cat_num_desc LIKE '%דלת%';

-- 5. Now test search function
SELECT 'SEARCH FUNCTION TEST:' as check_type;
SELECT COUNT(*) as results
FROM smart_parts_search(free_query_param := 'דלת');

-- Show sample results
SELECT 'SAMPLE SEARCH RESULTS:' as check_type;
SELECT id, cat_num_desc, make, supplier_name, price
FROM smart_parts_search(free_query_param := 'דלת')
LIMIT 5;