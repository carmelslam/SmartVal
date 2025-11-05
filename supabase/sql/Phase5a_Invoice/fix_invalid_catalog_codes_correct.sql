-- Simple fix for invalid catalog codes in invoice_lines table only
-- The OCR mistakenly extracted "שם" (name) as catalog_code

-- First, let's see what invalid values we have
SELECT 
    'INVALID CATALOG CODES' as section,
    catalog_code,
    COUNT(*) as count
FROM invoice_lines 
WHERE catalog_code IN ('שם', 'תיאור', 'מחיר', 'כמות', 'סה"כ', 'קטגוריה', 'מקור')
   OR catalog_code LIKE '%שם%'
   OR catalog_code LIKE '%תיאור%'
   OR LENGTH(catalog_code) < 3
GROUP BY catalog_code
ORDER BY count DESC;

-- Update invalid catalog codes to NULL so fallback logic can work
UPDATE invoice_lines 
SET catalog_code = NULL
WHERE catalog_code IN ('שם', 'תיאור', 'מחיר', 'כמות', 'סה"כ', 'קטגוריה', 'מקור', '-', '')
   OR catalog_code LIKE '%שם%'
   OR catalog_code LIKE '%תיאור%'
   OR (LENGTH(catalog_code) < 3 AND catalog_code !~ '^[0-9A-Za-z]');

-- Show results after cleanup - only invoice_lines fields
SELECT 
    'RESULTS AFTER CLEANUP' as section,
    catalog_code,
    description,
    item_category,
    COUNT(*) as count
FROM invoice_lines
WHERE created_at > CURRENT_DATE - INTERVAL '7 days'
GROUP BY catalog_code, description, item_category
ORDER BY count DESC
LIMIT 20;