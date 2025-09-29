-- ANALYZE CATALOG PATTERNS TO UNDERSTAND REAL DATA
-- This will help us understand what part families actually exist

-- ============================================================================
-- 1. ANALYZE EXISTING DATA STRUCTURE
-- ============================================================================

-- Check what columns exist in catalog_items
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'catalog_items'
ORDER BY ordinal_position;

-- ============================================================================
-- 2. ANALYZE EXISTING PART FAMILIES (IF ANY)
-- ============================================================================

-- Check if there are existing part_family values
SELECT 
    part_family,
    count(*) as count,
    array_agg(DISTINCT cat_num_desc) as sample_descriptions
FROM catalog_items 
WHERE part_family IS NOT NULL 
GROUP BY part_family 
ORDER BY count DESC;

-- ============================================================================
-- 3. ANALYZE CAT_NUM_DESC PATTERNS
-- ============================================================================

-- Get sample descriptions to understand patterns
SELECT 
    cat_num_desc,
    supplier_name,
    pcode,
    make,
    model
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL 
LIMIT 20;

-- ============================================================================
-- 4. FIND COMMON HEBREW WORDS IN DESCRIPTIONS
-- ============================================================================

-- This will help us understand what Hebrew terms are actually used
WITH hebrew_words AS (
    SELECT 
        unnest(string_to_array(cat_num_desc, ' ')) as word,
        cat_num_desc
    FROM catalog_items 
    WHERE cat_num_desc IS NOT NULL 
    AND cat_num_desc LIKE '%פ%' -- Contains Hebrew characters
    LIMIT 1000
)
SELECT 
    word,
    count(*) as frequency,
    array_agg(DISTINCT cat_num_desc) as sample_descriptions
FROM hebrew_words 
WHERE length(word) >= 2
GROUP BY word 
HAVING count(*) >= 3
ORDER BY frequency DESC
LIMIT 30;

-- ============================================================================
-- 5. ANALYZE SUPPLIERS AND THEIR PATTERNS
-- ============================================================================

-- See what suppliers exist and their naming patterns
SELECT 
    supplier_name,
    count(*) as parts_count,
    array_agg(DISTINCT cat_num_desc) as sample_descriptions
FROM catalog_items 
WHERE supplier_name IS NOT NULL
GROUP BY supplier_name
ORDER BY parts_count DESC
LIMIT 10;

-- ============================================================================
-- 6. CHECK FOR EXISTING NORMALIZED FIELDS
-- ============================================================================

-- Check what data already exists in extracted fields
SELECT 
    'oem' as field_name,
    count(CASE WHEN oem IS NOT NULL THEN 1 END) as has_data,
    count(*) as total,
    round(100.0 * count(CASE WHEN oem IS NOT NULL THEN 1 END) / count(*), 2) as percentage
FROM catalog_items
UNION ALL
SELECT 
    'make' as field_name,
    count(CASE WHEN make IS NOT NULL THEN 1 END) as has_data,
    count(*) as total,
    round(100.0 * count(CASE WHEN make IS NOT NULL THEN 1 END) / count(*), 2) as percentage
FROM catalog_items
UNION ALL
SELECT 
    'model' as field_name,
    count(CASE WHEN model IS NOT NULL THEN 1 END) as has_data,
    count(*) as total,
    round(100.0 * count(CASE WHEN model IS NOT NULL THEN 1 END) / count(*), 2) as percentage
FROM catalog_items
UNION ALL
SELECT 
    'part_family' as field_name,
    count(CASE WHEN part_family IS NOT NULL THEN 1 END) as has_data,
    count(*) as total,
    round(100.0 * count(CASE WHEN part_family IS NOT NULL THEN 1 END) / count(*), 2) as percentage
FROM catalog_items;

-- ============================================================================
-- 7. SEARCH FOR SPECIFIC PATTERNS FROM YOUR SCREENSHOT
-- ============================================================================

-- Look for entries that contain "פנס" (headlight)
SELECT 
    cat_num_desc,
    supplier_name,
    pcode,
    price,
    oem,
    make,
    model,
    part_family
FROM catalog_items 
WHERE cat_num_desc LIKE '%פנס%'
LIMIT 10;

-- Look for Toyota entries
SELECT 
    cat_num_desc,
    supplier_name,
    pcode,
    price,
    make,
    model
FROM catalog_items 
WHERE cat_num_desc LIKE '%טויוטה%' 
   OR make LIKE '%Toyota%'
   OR make LIKE '%טויוטה%'
LIMIT 10;

-- ============================================================================
-- 8. UNDERSTAND THE ACTUAL DATA STRUCTURE FROM M-PINES
-- ============================================================================

-- Check for patterns that match your screenshot examples
SELECT 
    id,
    cat_num_desc,
    supplier_name,
    pcode,
    price,
    oem,
    availability,
    make,
    model,
    part_family
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL
AND (
    cat_num_desc LIKE '%T5%' OR
    cat_num_desc LIKE '%08%' OR
    cat_num_desc LIKE '%שמאל%' OR
    cat_num_desc LIKE '%ימין%' OR
    cat_num_desc LIKE '%016%'
)
LIMIT 15;