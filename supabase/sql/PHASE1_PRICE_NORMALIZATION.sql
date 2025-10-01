-- PHASE 1: PRICE NORMALIZATION - FIX ASTRONOMICAL PRICES
-- URGENT: Fix prices like ₪939,000,103 to realistic values
-- Based on diagnostic findings showing decimal point misplacement

-- ============================================================================
-- STEP 1: ANALYZE PRICE PATTERNS
-- ============================================================================

SELECT '=== PRICE ANALYSIS ===' as section;

-- Get price distribution to understand the problem
SELECT 
    'Price Range Analysis:' as analysis_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN price < 100 THEN 1 END) as under_100,
    COUNT(CASE WHEN price BETWEEN 100 AND 1000 THEN 1 END) as range_100_1000,
    COUNT(CASE WHEN price BETWEEN 1000 AND 10000 THEN 1 END) as range_1k_10k,
    COUNT(CASE WHEN price BETWEEN 10000 AND 100000 THEN 1 END) as range_10k_100k,
    COUNT(CASE WHEN price > 100000 THEN 1 END) as over_100k,
    MIN(price) as min_price,
    MAX(price) as max_price,
    AVG(price)::NUMERIC(10,2) as avg_price
FROM catalog_items
WHERE price IS NOT NULL;

-- Show sample astronomical prices to identify patterns
SELECT 
    'Astronomical Price Samples:' as sample_type,
    id,
    cat_num_desc,
    make,
    price,
    -- Try to identify the pattern (likely decimal shift)
    CASE 
        WHEN price > 1000000 THEN price / 1000000.0
        WHEN price > 100000 THEN price / 100000.0
        WHEN price > 10000 THEN price / 1000.0
        ELSE price
    END as potential_correct_price
FROM catalog_items
WHERE price > 50000
ORDER BY price DESC
LIMIT 10;

-- ============================================================================
-- STEP 2: IDENTIFY PRICE CORRECTION ALGORITHM
-- ============================================================================

SELECT '=== PRICE CORRECTION ALGORITHM ===' as section;

-- Analyze price patterns to determine correction logic
WITH price_analysis AS (
    SELECT 
        price,
        cat_num_desc,
        make,
        -- Test different division factors
        price / 1000000.0 as div_million,
        price / 100000.0 as div_100k,
        price / 10000.0 as div_10k,
        price / 1000.0 as div_1k,
        CASE 
            WHEN price > 10000000 THEN 'EXTREME_ASTRONOMICAL'
            WHEN price > 1000000 THEN 'VERY_HIGH'
            WHEN price > 100000 THEN 'HIGH'
            WHEN price > 10000 THEN 'ELEVATED'
            ELSE 'NORMAL'
        END as price_category
    FROM catalog_items
    WHERE price > 10000
    ORDER BY price DESC
    LIMIT 20
)
SELECT 
    'Price Correction Samples:' as sample_type,
    price_category,
    COUNT(*) as count,
    AVG(price)::NUMERIC(10,2) as avg_current,
    AVG(div_million)::NUMERIC(10,2) as avg_if_div_million,
    AVG(div_100k)::NUMERIC(10,2) as avg_if_div_100k,
    AVG(div_10k)::NUMERIC(10,2) as avg_if_div_10k
FROM price_analysis
GROUP BY price_category
ORDER BY avg_current DESC;

-- ============================================================================
-- STEP 3: CREATE PRICE NORMALIZATION FUNCTION
-- ============================================================================

SELECT '=== CREATING PRICE NORMALIZATION FUNCTION ===' as section;

-- Create function to normalize astronomical prices
CREATE OR REPLACE FUNCTION normalize_price(input_price NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
    -- Handle NULL prices
    IF input_price IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Handle negative prices (set to 0)
    IF input_price < 0 THEN
        RETURN 0;
    END IF;
    
    -- For extremely astronomical prices (>10M) - likely 6-digit shift
    IF input_price > 10000000 THEN
        RETURN ROUND(input_price / 1000000.0, 2);
    END IF;
    
    -- For very high prices (1M-10M) - likely 5-digit shift  
    IF input_price > 1000000 THEN
        RETURN ROUND(input_price / 100000.0, 2);
    END IF;
    
    -- For high prices (100k-1M) - likely 4-digit shift
    IF input_price > 100000 THEN
        RETURN ROUND(input_price / 10000.0, 2);
    END IF;
    
    -- For elevated prices (10k-100k) - likely 3-digit shift
    IF input_price > 50000 THEN
        RETURN ROUND(input_price / 1000.0, 2);
    END IF;
    
    -- Prices under 50k are probably correct
    RETURN input_price;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- STEP 4: TEST NORMALIZATION ON SAMPLE DATA
-- ============================================================================

SELECT '=== TESTING PRICE NORMALIZATION ===' as section;

-- Test the normalization function on problematic prices
SELECT 
    'Normalization Test Results:' as test_type,
    id,
    cat_num_desc,
    make,
    price as original_price,
    normalize_price(price) as normalized_price,
    CASE 
        WHEN normalize_price(price) BETWEEN 10 AND 10000 THEN '✅ REALISTIC'
        WHEN normalize_price(price) > 10000 THEN '⚠️ STILL HIGH'
        WHEN normalize_price(price) < 10 THEN '⚠️ TOO LOW'
        ELSE '❓ UNKNOWN'
    END as normalization_result
FROM catalog_items
WHERE price > 10000
ORDER BY price DESC
LIMIT 20;

-- Show statistics after normalization
SELECT 
    'Post-Normalization Statistics:' as stats_type,
    COUNT(*) as total_prices,
    COUNT(CASE WHEN normalize_price(price) BETWEEN 10 AND 10000 THEN 1 END) as realistic_range,
    COUNT(CASE WHEN normalize_price(price) > 10000 THEN 1 END) as still_high,
    COUNT(CASE WHEN normalize_price(price) < 10 THEN 1 END) as too_low,
    ROUND(
        COUNT(CASE WHEN normalize_price(price) BETWEEN 10 AND 10000 THEN 1 END) * 100.0 / COUNT(*), 
        1
    ) as realistic_percentage
FROM catalog_items
WHERE price IS NOT NULL;

-- ============================================================================
-- STEP 5: BACKUP AND APPLY PRICE NORMALIZATION
-- ============================================================================

SELECT '=== APPLYING PRICE NORMALIZATION ===' as section;

-- First, add a backup column to store original prices
DO $$
BEGIN
    -- Add backup column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_items' AND column_name = 'original_price_backup'
    ) THEN
        ALTER TABLE catalog_items ADD COLUMN original_price_backup NUMERIC;
        RAISE NOTICE 'Added original_price_backup column';
    END IF;
END $$;

-- Backup original prices before normalization
UPDATE catalog_items 
SET original_price_backup = price 
WHERE original_price_backup IS NULL AND price IS NOT NULL;

-- Apply price normalization to all records
UPDATE catalog_items 
SET price = normalize_price(price)
WHERE price IS NOT NULL;

-- ============================================================================
-- STEP 6: VALIDATION AND RESULTS
-- ============================================================================

SELECT '=== PRICE NORMALIZATION RESULTS ===' as section;

-- Show before/after comparison
SELECT 
    'Price Normalization Summary:' as summary_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN original_price_backup > 50000 THEN 1 END) as had_astronomical_prices,
    COUNT(CASE WHEN price BETWEEN 10 AND 10000 THEN 1 END) as now_realistic,
    COUNT(CASE WHEN price > 10000 THEN 1 END) as still_high,
    MIN(price) as new_min_price,
    MAX(price) as new_max_price,
    AVG(price)::NUMERIC(10,2) as new_avg_price,
    ROUND(
        COUNT(CASE WHEN price BETWEEN 10 AND 10000 THEN 1 END) * 100.0 / COUNT(*), 
        1
    ) as realistic_percentage
FROM catalog_items
WHERE price IS NOT NULL;

-- Show sample results for verification
SELECT 
    'Sample Corrected Prices:' as sample_type,
    id,
    cat_num_desc,
    make,
    original_price_backup as before_price,
    price as after_price,
    CASE 
        WHEN price BETWEEN 10 AND 10000 THEN '✅ FIXED'
        ELSE '⚠️ NEEDS REVIEW'
    END as correction_status
FROM catalog_items
WHERE original_price_backup > 50000
ORDER BY original_price_backup DESC
LIMIT 15;

-- Test search results with normalized prices
SELECT 
    'Search Test with Normalized Prices:' as test_type,
    COUNT(*) as search_results,
    AVG(price)::NUMERIC(10,2) as avg_price_in_results,
    MIN(price) as min_price_in_results,
    MAX(price) as max_price_in_results
FROM catalog_items
WHERE cat_num_desc ILIKE '%פנס%'
  AND price IS NOT NULL;

-- ============================================================================
-- FINAL STATUS
-- ============================================================================

SELECT '=== PHASE 1 COMPLETION STATUS ===' as section;

DO $$
DECLARE
    astronomical_count INTEGER;
    realistic_count INTEGER;
    total_count INTEGER;
    success_rate NUMERIC;
BEGIN
    -- Count results
    SELECT COUNT(*) INTO total_count FROM catalog_items WHERE price IS NOT NULL;
    SELECT COUNT(*) INTO realistic_count FROM catalog_items WHERE price BETWEEN 10 AND 10000;
    SELECT COUNT(*) INTO astronomical_count FROM catalog_items WHERE price > 50000;
    
    success_rate := realistic_count * 100.0 / total_count;
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'PHASE 1: PRICE NORMALIZATION COMPLETE';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Total records processed: %', total_count;
    RAISE NOTICE 'Records in realistic range (₪10-₪10,000): %', realistic_count;
    RAISE NOTICE 'Records still astronomical (>₪50,000): %', astronomical_count;
    RAISE NOTICE 'Success rate: %%%', ROUND(success_rate, 1);
    RAISE NOTICE '==========================================';
    
    IF success_rate >= 95 THEN
        RAISE NOTICE 'STATUS: ✅ SUCCESS - Price normalization completed successfully';
    ELSIF success_rate >= 80 THEN
        RAISE NOTICE 'STATUS: ⚠️ PARTIAL SUCCESS - Most prices fixed, some need review';
    ELSE
        RAISE NOTICE 'STATUS: ❌ NEEDS WORK - Price normalization needs adjustment';
    END IF;
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'NEXT: Ready for Phase 2 - Source Field Correction';
    RAISE NOTICE '==========================================';
END $$;