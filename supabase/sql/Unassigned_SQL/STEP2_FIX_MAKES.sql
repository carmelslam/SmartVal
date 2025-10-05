-- STEP 2: FIX MAKE NAMES IN DATA

-- Fix reversed makes
UPDATE catalog_items
SET make = normalize_make(make)
WHERE make LIKE '%יפן%' 
   OR make LIKE '%ארהב%'
   OR make LIKE '%גרמניה%'
   OR make LIKE '%קוריאה%';

-- Check results
SELECT DISTINCT make, COUNT(*) as count
FROM catalog_items
WHERE make IS NOT NULL
GROUP BY make
ORDER BY count DESC
LIMIT 20;