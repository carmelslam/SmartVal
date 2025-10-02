-- ============================================================================
-- CHECK SIDE_POSITION vs FRONT_REAR CONFUSION
-- Date: 2025-10-02
-- Purpose: Identify if side_position contains front/rear data
-- ============================================================================

-- 1. Check what's in side_position field
SELECT 'SIDE_POSITION ANALYSIS' as section;

SELECT 
    side_position,
    COUNT(*) as count,
    CASE 
        WHEN side_position LIKE '%קד%' OR side_position LIKE '%אח%' THEN '❌ WRONG - Contains front/rear'
        WHEN side_position LIKE '%ימ%' OR side_position LIKE '%שמ%' THEN '✅ CORRECT - Contains left/right'
        WHEN side_position IS NULL OR side_position = '' THEN '⚠️ EMPTY'
        ELSE '⚠️ UNKNOWN'
    END as assessment
FROM catalog_items
WHERE side_position IS NOT NULL AND side_position != ''
GROUP BY side_position
ORDER BY count DESC
LIMIT 20;

-- 2. Check what's in front_rear field
SELECT 'FRONT_REAR ANALYSIS' as section;

SELECT 
    front_rear,
    COUNT(*) as count,
    CASE 
        WHEN front_rear LIKE '%ימ%' OR front_rear LIKE '%שמ%' THEN '❌ WRONG - Contains left/right'
        WHEN front_rear LIKE '%קד%' OR front_rear LIKE '%אח%' THEN '✅ CORRECT - Contains front/rear'
        WHEN front_rear IS NULL OR front_rear = '' THEN '⚠️ EMPTY'
        ELSE '⚠️ UNKNOWN'
    END as assessment
FROM catalog_items
WHERE front_rear IS NOT NULL AND front_rear != ''
GROUP BY front_rear
ORDER BY count DESC
LIMIT 20;

-- 3. Count the confusion
SELECT 'CONFUSION SUMMARY' as section;

SELECT 
    'side_position contains front/rear (WRONG)' as issue,
    COUNT(*) as count
FROM catalog_items
WHERE side_position LIKE '%קד%' OR side_position LIKE '%אח%'

UNION ALL

SELECT 
    'front_rear contains left/right (WRONG)' as issue,
    COUNT(*) as count
FROM catalog_items
WHERE front_rear LIKE '%ימ%' OR front_rear LIKE '%שמ%'

UNION ALL

SELECT 
    'side_position has left/right (CORRECT)' as issue,
    COUNT(*) as count
FROM catalog_items
WHERE side_position LIKE '%ימ%' OR side_position LIKE '%שמ%'

UNION ALL

SELECT 
    'front_rear has front/rear (CORRECT)' as issue,
    COUNT(*) as count
FROM catalog_items
WHERE front_rear LIKE '%קד%' OR front_rear LIKE '%אח%';

-- 4. Sample records showing the confusion
SELECT 'SAMPLE CONFUSED RECORDS' as section;

SELECT 
    cat_num_desc,
    side_position,
    front_rear,
    part_name
FROM catalog_items
WHERE side_position LIKE '%קד%' OR side_position LIKE '%אח%'
LIMIT 10;
