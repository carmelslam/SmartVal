-- ============================================================================
-- SESSION 7 - FIX 3: Improve Model Extraction from cat_num_desc
-- Date: 2025-10-05
-- Purpose: Extract models for 41,137 NULL model records (85.2% of database)
-- ============================================================================

-- Current problem:
-- - 41,137 records (85.2%) have NULL model
-- - Models like RAV4, YARIS, CAMRY, COROLLA visible in cat_num_desc but not extracted
-- - trigger_extract_model_and_year exists but may have limited patterns

-- Solution: Force trigger to re-run for all NULL models
-- The trigger_extract_model_and_year will extract from cat_num_desc

UPDATE catalog_items
SET id = id  -- Dummy update to fire trigger_extract_model_and_year
WHERE model IS NULL 
  AND cat_num_desc IS NOT NULL;

-- Step 2: Verification - Check model extraction rate
SELECT 
    'After Fix - Model Extraction Status' as test,
    COUNT(*) as total_records,
    COUNT(model) as has_model,
    COUNT(*) - COUNT(model) as null_model,
    ROUND(COUNT(model)::NUMERIC / COUNT(*) * 100, 1) as populated_pct,
    CASE 
        WHEN COUNT(model)::NUMERIC / COUNT(*) > 0.3 
        THEN '✅ Good extraction rate (>30%)'
        ELSE '⚠️ Low extraction rate (<30%)'
    END as status
FROM catalog_items;

-- Step 3: Sample extracted models
SELECT 
    'Sample Extracted Models' as test,
    cat_num_desc,
    model,
    CASE 
        WHEN model IS NULL THEN '❌ NOT EXTRACTED'
        ELSE '✅ EXTRACTED'
    END as status
FROM catalog_items
WHERE cat_num_desc IS NOT NULL
LIMIT 30;

-- Step 4: Check common model patterns that might be missing
SELECT 
    'Missing Common Models' as test,
    COUNT(*) FILTER (WHERE cat_num_desc ILIKE '%RAV4%' AND model IS NULL) as missing_rav4,
    COUNT(*) FILTER (WHERE cat_num_desc ILIKE '%YARIS%' AND model IS NULL) as missing_yaris,
    COUNT(*) FILTER (WHERE cat_num_desc ILIKE '%CAMRY%' AND model IS NULL) as missing_camry,
    COUNT(*) FILTER (WHERE cat_num_desc ILIKE '%COROLLA%' AND model IS NULL) as missing_corolla,
    COUNT(*) FILTER (WHERE cat_num_desc ILIKE '%קורולה%' AND model IS NULL) as missing_corolla_hebrew,
    CASE 
        WHEN COUNT(*) FILTER (WHERE (cat_num_desc ILIKE '%RAV4%' OR cat_num_desc ILIKE '%YARIS%' OR cat_num_desc ILIKE '%CAMRY%') AND model IS NULL) = 0
        THEN '✅ All common models extracted'
        ELSE '⚠️ Some common models still missing'
    END as status
FROM catalog_items;

-- Step 5: Show distribution of extracted models
SELECT 
    'Model Distribution' as test,
    model,
    COUNT(*) as count
FROM catalog_items
WHERE model IS NOT NULL
GROUP BY model
ORDER BY count DESC
LIMIT 20;
