-- Run extraction on 5000 records

UPDATE catalog_items
SET cat_num_desc = cat_num_desc
WHERE id IN (
    SELECT id 
    FROM catalog_items
    ORDER BY id
    LIMIT 5000
);

-- Check results
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN model IS NOT NULL AND model != '' THEN 1 END) as has_model,
    ROUND(COUNT(CASE WHEN model IS NOT NULL AND model != '' THEN 1 END) * 100.0 / COUNT(*), 1) as model_pct,
    COUNT(CASE WHEN year_from IS NOT NULL THEN 1 END) as has_year,
    ROUND(COUNT(CASE WHEN year_from IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 1) as year_pct
FROM catalog_items;
