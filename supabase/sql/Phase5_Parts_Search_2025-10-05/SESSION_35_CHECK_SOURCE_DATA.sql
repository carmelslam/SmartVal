-- ============================================================================
-- SESSION 35: Check Source Column Data
-- Date: 2025-10-15
-- Problem: Source showing wrong values (מקורי when should be חלופי)
-- ============================================================================

-- 1. Check what supplier_name values exist
SELECT 
    'Supplier Names' as test,
    supplier_name,
    COUNT(*) as count,
    ROUND(COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM catalog_items) * 100, 1) as percentage
FROM catalog_items
GROUP BY supplier_name
ORDER BY count DESC
LIMIT 20;

-- 2. Check cat_num_desc samples for keyword patterns
SELECT 
    'Keyword Analysis' as test,
    cat_num_desc,
    supplier_name,
    source,
    CASE 
        WHEN cat_num_desc ILIKE '%מקורי%' THEN 'Has מקורי'
        WHEN cat_num_desc ILIKE '%ORIGINAL%' THEN 'Has ORIGINAL'
        WHEN cat_num_desc ILIKE '%OEM%' THEN 'Has OEM'
        WHEN cat_num_desc ILIKE '%חלופי%' THEN 'Has חלופי'
        WHEN cat_num_desc ILIKE '%AFTERMARKET%' THEN 'Has AFTERMARKET'
        WHEN cat_num_desc ILIKE '%תחליפי%' THEN 'Has תחליפי'
        ELSE 'No keyword'
    END as keyword_found
FROM catalog_items
LIMIT 50;

-- 3. Check current source distribution
SELECT 
    'Source Distribution' as test,
    source,
    COUNT(*) as count,
    ROUND(COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM catalog_items) * 100, 1) as percentage
FROM catalog_items
GROUP BY source
ORDER BY count DESC;

-- 4. Sample records with source values
SELECT 
    'Sample Records' as test,
    cat_num_desc,
    supplier_name,
    source
FROM catalog_items
WHERE source IS NOT NULL
LIMIT 20;

-- ============================================================================
-- RUN THIS AND SEND ME ALL RESULTS
-- I need to see the actual data patterns to fix the source logic
-- ============================================================================
