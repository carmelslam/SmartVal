-- ============================================================================
-- SESSION 7 - DIAGNOSTIC: Check Current Database State
-- Date: 2025-10-05
-- Purpose: Verify what was deployed and what still needs fixing
-- ============================================================================

-- TEST 1: Check source field - are there still reversed values?
SELECT 
    '1. SOURCE FIELD STATUS' as test,
    source,
    COUNT(*) as count,
    CASE 
        WHEN source LIKE '%יפילח%' OR source LIKE '%ירוקמ%' THEN '❌ REVERSED'
        ELSE '✅ CORRECT'
    END as status
FROM catalog_items
WHERE source IS NOT NULL
GROUP BY source
ORDER BY count DESC
LIMIT 10;

-- TEST 2: Check year_range - how many NULL vs populated?
SELECT 
    '2. YEAR_RANGE STATUS' as test,
    COUNT(*) as total_records,
    COUNT(year_range) as has_year_range,
    COUNT(*) - COUNT(year_range) as null_year_range,
    ROUND(COUNT(year_range)::NUMERIC / COUNT(*) * 100, 1) as populated_pct
FROM catalog_items;

-- TEST 3: Sample year_range values - are they in correct format?
SELECT 
    '3. YEAR_RANGE FORMAT CHECK' as test,
    year_from,
    year_to,
    year_range,
    CASE 
        WHEN year_range IS NULL THEN '❌ NULL'
        WHEN year_range ~ '^\d{3}-\d{3}$' THEN '✅ CORRECT FORMAT (3-digit)'
        ELSE '❌ WRONG FORMAT'
    END as format_status
FROM catalog_items
WHERE year_from IS NOT NULL OR year_to IS NOT NULL
LIMIT 20;

-- TEST 4: Check model extraction - how many NULL?
SELECT 
    '4. MODEL EXTRACTION STATUS' as test,
    COUNT(*) as total_records,
    COUNT(model) as has_model,
    COUNT(*) - COUNT(model) as null_model,
    ROUND(COUNT(model)::NUMERIC / COUNT(*) * 100, 1) as populated_pct
FROM catalog_items;

-- TEST 5: Sample records - check if model exists in cat_num_desc but not extracted
SELECT 
    '5. MISSING MODEL EXTRACTION' as test,
    cat_num_desc,
    model,
    CASE 
        WHEN model IS NULL AND (cat_num_desc ILIKE '%RAV4%' OR cat_num_desc ILIKE '%YARIS%' OR cat_num_desc ILIKE '%CAMRY%') 
        THEN '❌ MODEL IN DESC BUT NOT EXTRACTED'
        ELSE '✅ OK'
    END as status
FROM catalog_items
WHERE cat_num_desc IS NOT NULL
LIMIT 20;

-- TEST 6: Part family - check if OLD categories exist (should NOT exist)
SELECT 
    '6A. PART FAMILY - OLD CATEGORIES CHECK' as test,
    part_family,
    COUNT(*) as count,
    CASE 
        WHEN part_family IN ('פנסים ותאורה', 'דלתות וכנפיים', 'מגנים ופגושים', 'חלקי פח') 
        THEN '❌ OLD CATEGORY (must fix)'
        ELSE '✅ OK'
    END as status
FROM catalog_items
WHERE part_family IS NOT NULL
GROUP BY part_family
ORDER BY count DESC;

-- TEST 6B: Part family - verify CORRECT 19 categories from parts.js
-- Correct categories (in index order):
-- 1. אביזרים נלווים
-- 2. גלגלים וצמיגים
-- 3. חיישני מנוע
-- 4. חלונות ומראות
-- 5. חלקי מרכב
-- 6. חלקי פנים
-- 7. חשמל
-- 8. כריות אוויר
-- 9. ממסרים
-- 10. מנוע - יחידת בקרת ECU
-- 11. מנוע וחלקי מנוע
-- 12. מערכות בלימה והיגוי
-- 13. מערכות חימום וקירור
-- 14. מערכת ABS
-- 15. מערכת דלק
-- 16. מערכת הפליטה
-- 17. מתגים/מפסקים/סוויצ'ים
-- 18. פנסים
-- 19. תיבת הילוכים וחלקים

SELECT 
    '6B. CORRECT CATEGORIES STATUS' as test,
    part_family,
    COUNT(*) as count,
    CASE 
        WHEN part_family IN (
            'אביזרים נלווים', 'גלגלים וצמיגים', 'חיישני מנוע', 'חלונות ומראות',
            'חלקי מרכב', 'חלקי פנים', 'חשמל', 'כריות אוויר', 'ממסרים',
            'מנוע - יחידת בקרת ECU', 'מנוע וחלקי מנוע', 'מערכות בלימה והיגוי',
            'מערכות חימום וקירור', 'מערכת ABS', 'מערכת דלק', 'מערכת הפליטה',
            'מתגים/מפסקים/סוויצ\'ים', 'פנסים', 'תיבת הילוכים וחלקים'
        ) THEN '✅ CORRECT'
        ELSE '❌ WRONG CATEGORY'
    END as status
FROM catalog_items
WHERE part_family IS NOT NULL
GROUP BY part_family
ORDER BY count DESC;

-- TEST 7: Check active triggers
SELECT 
    '7. ACTIVE TRIGGERS' as test,
    tgname as trigger_name,
    CASE 
        WHEN tgname LIKE '%revers%' THEN '❌ REVERSAL TRIGGER (should be removed)'
        WHEN tgname LIKE '%auto%' THEN '✅ AUTO TRIGGER'
        ELSE '⚠️ OTHER'
    END as status
FROM pg_trigger 
WHERE tgrelid = 'catalog_items'::regclass
  AND tgname NOT LIKE 'RI_Constraint%'
ORDER BY tgname;
