-- ============================================================================
-- FIX SLASH-SEPARATED REVERSED HEBREW
-- Date: 2025-10-02
-- Problem: When Hebrew contains /, each segment was reversed separately
-- Example: "קרייזלר / דוג" became "וד / רלזיירק"
-- Solution: Split by /, reverse each part, rejoin
-- ============================================================================

-- Create helper function to reverse slash-separated Hebrew
CREATE OR REPLACE FUNCTION reverse_slash_separated(text_in text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    parts text[];
    reversed_parts text[];
    i int;
BEGIN
    -- Split by /
    parts := string_to_array(text_in, '/');
    
    -- Reverse each part
    FOR i IN 1..array_length(parts, 1) LOOP
        reversed_parts[i] := reverse(trim(parts[i]));
    END LOOP;
    
    -- Join back with /
    RETURN array_to_string(reversed_parts, ' / ');
END;
$$;

-- Test the function first
SELECT 'TEST' as section;
SELECT reverse_slash_separated('וד / רלזיירק') as test1;
SELECT reverse_slash_separated('ר/רבורדנאל') as test2;

-- Fix makes with slashes
SELECT 'Fixing makes with slashes...' as status;

UPDATE catalog_items
SET make = reverse_slash_separated(make)
WHERE make LIKE '%/%'
  AND (make LIKE '%ו /%' OR make LIKE '%ר /%' OR make LIKE '%ל /%' 
       OR make LIKE '%/ ו%' OR make LIKE '%/ ר%' OR make LIKE '%/ ל%');

-- Fix part_family with slashes
SELECT 'Fixing part_family with slashes...' as status;

UPDATE catalog_items
SET part_family = reverse_slash_separated(part_family)
WHERE part_family LIKE '%/%'
  AND (part_family LIKE '%ו /%' OR part_family LIKE '%ר /%' OR part_family LIKE '%ל /%'
       OR part_family LIKE '%/ ו%' OR part_family LIKE '%/ ר%' OR part_family LIKE '%/ ל%');

-- Fix cat_num_desc with slashes - process in batches
SELECT 'Fixing cat_num_desc with slashes - BATCH 1...' as status;

UPDATE catalog_items
SET cat_num_desc = reverse_slash_separated(cat_num_desc)
WHERE id IN (
    SELECT id
    FROM catalog_items
    WHERE cat_num_desc LIKE '%/%'
      AND (cat_num_desc LIKE '%ו%' OR cat_num_desc LIKE '%ר%' OR cat_num_desc LIKE '%ל%')
      AND (cat_num_desc LIKE '%תכרע%' OR cat_num_desc LIKE '%שנלפ%' OR cat_num_desc LIKE '%רלוק%'
           OR cat_num_desc LIKE '%קופר%' OR cat_num_desc LIKE '%הארמ%' OR cat_num_desc LIKE '%הזיבי%'
           OR cat_num_desc LIKE '%דיזל%' OR cat_num_desc LIKE '%דס%' OR cat_num_desc LIKE '%אוןיזנב%'
           OR cat_num_desc LIKE '%האיטל%' OR cat_num_desc LIKE '%הבעמ%' OR cat_num_desc LIKE '%אקספ%'
           OR cat_num_desc LIKE '%דידמ%' OR cat_num_desc LIKE '%אוקט%' OR cat_num_desc LIKE '%דגנר%')
    LIMIT 500
);

-- Verify results
SELECT 'VERIFICATION' as section;

SELECT 
    make,
    COUNT(*) as count
FROM catalog_items
WHERE make LIKE '%/%'
GROUP BY make
ORDER BY count DESC
LIMIT 10;

SELECT 
    'Records with slash in cat_num_desc still containing reversed patterns' as metric,
    COUNT(*) as count
FROM catalog_items
WHERE cat_num_desc LIKE '%/%'
  AND (cat_num_desc LIKE '%תכרע%' OR cat_num_desc LIKE '%שנלפ%' OR cat_num_desc LIKE '%רלוק%');
