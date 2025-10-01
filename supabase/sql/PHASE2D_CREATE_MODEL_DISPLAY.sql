-- PHASE 2: CREATE MODEL DISPLAY - Single batch approach
-- Run this after years are extracted

-- Combine model and year for better display
UPDATE catalog_items 
SET model_display = CASE 
    WHEN model IS NOT NULL AND extracted_year IS NOT NULL THEN 
        model || ' (' || extracted_year || ')'
    WHEN model IS NOT NULL THEN 
        model
    WHEN extracted_year IS NOT NULL THEN 
        'שנת ' || extracted_year
    ELSE 
        'לא מוגדר'
END
WHERE model_display IS NULL
  AND id IN (
    SELECT id 
    FROM catalog_items 
    WHERE model_display IS NULL
    LIMIT 10000  -- Process 10000 at a time (simple field combination)
  );

-- Check progress
SELECT 
    'Model Display Creation Progress:' as status,
    COUNT(*) as total_records,
    COUNT(model_display) as has_model_display,
    COUNT(*) - COUNT(model_display) as remaining_to_process,
    ROUND(COUNT(model_display) * 100.0 / COUNT(*), 1) as completion_percentage
FROM catalog_items;

SELECT 'If completion_percentage < 100, run this script again until 100%' as instruction;