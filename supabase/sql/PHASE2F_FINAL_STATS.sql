-- PHASE 2: FINAL STATISTICS
-- Run this last to see the complete results

SELECT '=== PHASE 2 FINAL RESULTS ===' as section;

-- Show comprehensive extraction statistics
SELECT 
    'Final Extraction Statistics:' as stats_type,
    COUNT(*) as total_records,
    COUNT(part_name) as has_part_name,
    COUNT(extracted_year) as has_year,
    COUNT(model_display) as has_model_display,
    COUNT(CASE WHEN part_family != 'לא מוגדר' AND part_family IS NOT NULL THEN 1 END) as categorized_parts,
    ROUND(COUNT(part_name) * 100.0 / COUNT(*), 1) as part_name_percentage,
    ROUND(COUNT(extracted_year) * 100.0 / COUNT(*), 1) as year_percentage,
    ROUND(COUNT(model_display) * 100.0 / COUNT(*), 1) as model_display_percentage,
    ROUND(COUNT(CASE WHEN part_family != 'לא מוגדר' AND part_family IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 1) as categorization_percentage
FROM catalog_items;

-- Show sample results
SELECT 
    'Sample Extracted Data:' as sample_type,
    cat_num_desc,
    part_name,
    extracted_year,
    model_display,
    part_family
FROM catalog_items
WHERE part_name IS NOT NULL
ORDER BY RANDOM()
LIMIT 10;

-- Show part family distribution
SELECT 
    'Part Family Distribution:' as distribution_type,
    part_family,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM catalog_items), 1) as percentage
FROM catalog_items
WHERE part_family IS NOT NULL
GROUP BY part_family
ORDER BY count DESC
LIMIT 15;

SELECT '=== PHASE 2 COMPLETE - Ready for Phase 3 ===' as section;