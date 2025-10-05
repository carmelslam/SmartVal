-- PHASE 1: PRICE NORMALIZATION - FIX OVERFLOW ERROR
-- Fix numeric field overflow error for astronomical prices
-- Handle precision (10,2) limitation properly

-- ============================================================================
-- STEP 1: HANDLE OVERFLOW ISSUE - DIRECT UPDATE APPROACH
-- ============================================================================

SELECT '=== FIXING PRICE OVERFLOW ISSUE ===' as section;

-- First, add backup column for original prices
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_items' AND column_name = 'original_price_backup'
    ) THEN
        ALTER TABLE catalog_items ADD COLUMN original_price_backup TEXT;
        RAISE NOTICE 'Added original_price_backup column as TEXT to handle large values';
    END IF;
END $$;

-- Backup original prices as text to handle overflow
UPDATE catalog_items 
SET original_price_backup = price::TEXT
WHERE original_price_backup IS NULL AND price IS NOT NULL;

-- Check current price field constraints
SELECT 
    'Price Field Analysis:' as analysis_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN price > 99999999 THEN 1 END) as overflow_prices,
    MAX(price) as max_price_stored,
    MIN(price) as min_price_stored
FROM catalog_items
WHERE price IS NOT NULL;

-- ============================================================================
-- STEP 2: FIX ASTRONOMICAL PRICES IN BATCHES
-- ============================================================================

SELECT '=== FIXING ASTRONOMICAL PRICES ===' as section;

-- Fix prices > 100 million (extreme cases)
UPDATE catalog_items 
SET price = CASE 
    WHEN price > 100000000 THEN LEAST(price / 1000000.0, 99999999.99)
    ELSE price
END
WHERE price > 100000000;

-- Fix prices > 10 million 
UPDATE catalog_items 
SET price = CASE 
    WHEN price > 10000000 THEN LEAST(price / 100000.0, 99999999.99)
    ELSE price
END
WHERE price > 10000000 AND price <= 100000000;

-- Fix prices > 1 million
UPDATE catalog_items 
SET price = CASE 
    WHEN price > 1000000 THEN LEAST(price / 10000.0, 99999999.99)
    ELSE price
END
WHERE price > 1000000 AND price <= 10000000;

-- Fix prices > 100k (but keep reasonable high-end prices)
UPDATE catalog_items 
SET price = CASE 
    WHEN price > 100000 THEN LEAST(price / 1000.0, 99999999.99)
    ELSE price
END
WHERE price > 100000 AND price <= 1000000;

-- ============================================================================
-- STEP 3: VALIDATE RESULTS
-- ============================================================================

SELECT '=== VALIDATION RESULTS ===' as section;

-- Check price distribution after fix
SELECT 
    'Post-Fix Price Analysis:' as analysis_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN price < 100 THEN 1 END) as under_100,
    COUNT(CASE WHEN price BETWEEN 100 AND 1000 THEN 1 END) as range_100_1000,
    COUNT(CASE WHEN price BETWEEN 1000 AND 10000 THEN 1 END) as range_1k_10k,
    COUNT(CASE WHEN price BETWEEN 10000 AND 50000 THEN 1 END) as range_10k_50k,
    COUNT(CASE WHEN price > 50000 THEN 1 END) as still_over_50k,
    MIN(price) as min_price,
    MAX(price) as max_price,
    AVG(price)::NUMERIC(10,2) as avg_price
FROM catalog_items
WHERE price IS NOT NULL;

-- Show sample before/after corrections
SELECT 
    'Sample Price Corrections:' as sample_type,
    id,
    SUBSTRING(cat_num_desc, 1, 50) as short_desc,
    make,
    original_price_backup as original_price,
    price as corrected_price,
    CASE 
        WHEN price::NUMERIC < original_price_backup::NUMERIC / 1000 THEN 'MAJOR_REDUCTION'
        WHEN price::NUMERIC < original_price_backup::NUMERIC / 100 THEN 'SIGNIFICANT_REDUCTION'
        WHEN price::NUMERIC < original_price_backup::NUMERIC / 10 THEN 'MODERATE_REDUCTION'
        ELSE 'MINOR_OR_NO_CHANGE'
    END as correction_type
FROM catalog_items
WHERE original_price_backup IS NOT NULL 
  AND original_price_backup::NUMERIC > 10000
ORDER BY original_price_backup::NUMERIC DESC
LIMIT 20;

-- Test search functionality with corrected prices
SELECT 
    'Search Test - Toyota Lights:' as test_type,
    COUNT(*) as result_count,
    AVG(price)::NUMERIC(10,2) as avg_price,
    MIN(price) as min_price,
    MAX(price) as max_price
FROM catalog_items
WHERE make ILIKE '%טויוטה%' 
  AND cat_num_desc ILIKE '%פנס%';

-- Test search functionality with general parts
SELECT 
    'Search Test - All Lights:' as test_type,
    COUNT(*) as result_count,
    AVG(price)::NUMERIC(10,2) as avg_price,
    MIN(price) as min_price,
    MAX(price) as max_price
FROM catalog_items
WHERE part_family = 'פנס';

-- ============================================================================
-- STEP 4: FINAL STATUS REPORT
-- ============================================================================

SELECT '=== PHASE 1 COMPLETION STATUS ===' as section;

DO $$
DECLARE
    total_count INTEGER;
    realistic_count INTEGER;
    still_high_count INTEGER;
    success_rate NUMERIC;
BEGIN
    SELECT COUNT(*) INTO total_count FROM catalog_items WHERE price IS NOT NULL;
    SELECT COUNT(*) INTO realistic_count FROM catalog_items WHERE price BETWEEN 10 AND 20000;
    SELECT COUNT(*) INTO still_high_count FROM catalog_items WHERE price > 50000;
    
    success_rate := realistic_count * 100.0 / total_count;
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'PHASE 1: PRICE NORMALIZATION COMPLETE';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Total records: %', total_count;
    RAISE NOTICE 'Realistic prices (₪10-₪20,000): %', realistic_count;
    RAISE NOTICE 'Still high prices (>₪50,000): %', still_high_count;
    RAISE NOTICE 'Success rate: %%%', ROUND(success_rate, 1);
    RAISE NOTICE '==========================================';
    
    IF still_high_count = 0 THEN
        RAISE NOTICE 'STATUS: ✅ EXCELLENT - No more astronomical prices';
    ELSIF still_high_count < 10 THEN
        RAISE NOTICE 'STATUS: ✅ SUCCESS - Only % high prices remaining', still_high_count;
    ELSIF success_rate >= 90 THEN
        RAISE NOTICE 'STATUS: ⚠️ GOOD - Most prices fixed, % need review', still_high_count;
    ELSE
        RAISE NOTICE 'STATUS: ❌ NEEDS WORK - % prices still problematic', still_high_count;
    END IF;
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Next: Ready for PiP scrolling and flexible search fixes';
    RAISE NOTICE '==========================================';
END $$;