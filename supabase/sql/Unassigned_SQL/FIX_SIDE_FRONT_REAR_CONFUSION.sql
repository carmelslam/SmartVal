-- ============================================================================
-- FIX SIDE_POSITION vs FRONT_REAR CONFUSION
-- Date: 2025-10-02
-- Purpose: Move front/rear data from side_position to front_rear
-- Problem: 20,995 records have front/rear in side_position (should be in front_rear)
-- ============================================================================

-- Step 1: Move front from side_position to front_rear
UPDATE catalog_items
SET 
    front_rear = 'קדמי',
    side_position = NULL
WHERE side_position = 'קד'''
  AND (front_rear IS NULL OR front_rear = '');

-- Step 2: Move rear from side_position to front_rear
UPDATE catalog_items
SET 
    front_rear = 'אחורי',
    side_position = NULL
WHERE side_position = 'אח'''
  AND (front_rear IS NULL OR front_rear = '');

-- Step 3: Normalize abbreviated forms to full words

UPDATE catalog_items
SET side_position = 'ימין'
WHERE side_position = 'ימ''';

UPDATE catalog_items
SET side_position = 'שמאל'
WHERE side_position = 'שמ''';

UPDATE catalog_items
SET side_position = 'ימין'
WHERE side_position = 'ןימי';

UPDATE catalog_items
SET side_position = 'שמאל'
WHERE side_position = 'לאמש';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'AFTER FIX - SIDE_POSITION' as section;

SELECT 
    side_position,
    COUNT(*) as count
FROM catalog_items
WHERE side_position IS NOT NULL AND side_position != ''
GROUP BY side_position
ORDER BY count DESC;

SELECT 'AFTER FIX - FRONT_REAR' as section;

SELECT 
    front_rear,
    COUNT(*) as count
FROM catalog_items
WHERE front_rear IS NOT NULL AND front_rear != ''
GROUP BY front_rear
ORDER BY count DESC;

-- Final counts
SELECT 'SUMMARY' as section;

SELECT 
    'side_position has left/right (CORRECT)' as status,
    COUNT(*) as count
FROM catalog_items
WHERE side_position IN ('ימין', 'שמאל')

UNION ALL

SELECT 
    'front_rear has front/rear (CORRECT)' as status,
    COUNT(*) as count
FROM catalog_items
WHERE front_rear IN ('קדמי', 'אחורי')

UNION ALL

SELECT 
    'side_position still has front/rear (PROBLEM)' as status,
    COUNT(*) as count
FROM catalog_items
WHERE side_position LIKE '%קד%' OR side_position LIKE '%אח%';
