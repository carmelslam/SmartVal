-- Fix invalid catalog codes that contain Hebrew header text instead of actual codes
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

-- Try to populate catalog_code from OCR structured data again, but with better field mapping
UPDATE invoice_lines il
SET catalog_code = COALESCE(
    -- Try different Hebrew OCR field names for catalog code
    (id.ocr_structured_data->>'מק''ט חלק'),
    (id.ocr_structured_data->>'מקט חלק'),
    (id.ocr_structured_data->>'קוד חלק'),
    (id.ocr_structured_data->>'מספר חלק'),
    (id.ocr_structured_data->>'מק"ט'),
    (id.ocr_structured_data->>'קוד'),
    -- Try from raw webhook data with timestamp key
    (SELECT jsonb_extract_path_text(id.raw_webhook_data, key, 'data', 'מק''ט חלק')
     FROM jsonb_object_keys(id.raw_webhook_data) key 
     WHERE key LIKE 'OCR_INVOICES_%' 
     LIMIT 1),
    (SELECT jsonb_extract_path_text(id.raw_webhook_data, key, 'data', 'מקט חלק')
     FROM jsonb_object_keys(id.raw_webhook_data) key 
     WHERE key LIKE 'OCR_INVOICES_%' 
     LIMIT 1),
    -- Use line-specific extraction from PARTS array
    (SELECT jsonb_extract_path_text(part_data, 'מק''ט חלק')
     FROM (
         SELECT jsonb_array_elements(
             jsonb_extract_path(id.raw_webhook_data, 
                 (SELECT key FROM jsonb_object_keys(id.raw_webhook_data) k(key) 
                  WHERE key LIKE 'OCR_INVOICES_%' LIMIT 1), 
                 'data', 'PARTS')
         ) as part_data
     ) parts
     WHERE part_data->>'תיאור' = il.description
     LIMIT 1)
)
FROM invoice_documents id
WHERE id.invoice_id = il.invoice_id 
  AND il.catalog_code IS NULL
  AND il.item_category = 'part';

-- For works, try to get work codes from WORKS array
UPDATE invoice_lines il  
SET catalog_code = COALESCE(
    -- Try different Hebrew OCR field names for work codes
    (id.ocr_structured_data->>'קוד עבודה'),
    (id.ocr_structured_data->>'מספר עבודה'),
    -- Use line-specific extraction from WORKS array
    (SELECT jsonb_extract_path_text(work_data, 'קוד עבודה')
     FROM (
         SELECT jsonb_array_elements(
             jsonb_extract_path(id.raw_webhook_data, 
                 (SELECT key FROM jsonb_object_keys(id.raw_webhook_data) k(key) 
                  WHERE key LIKE 'OCR_INVOICES_%' LIMIT 1), 
                 'data', 'WORKS')
         ) as work_data
     ) works
     WHERE work_data->>'תיאור עבודה' = il.description
     LIMIT 1)
)
FROM invoice_documents id
WHERE id.invoice_id = il.invoice_id 
  AND il.catalog_code IS NULL
  AND il.item_category = 'work';

-- Show results after cleanup
SELECT 
    'RESULTS AFTER CLEANUP' as section,
    il.catalog_code,
    il.pcode,
    il.oem,
    il.description,
    il.item_category,
    COUNT(*) as count
FROM invoice_lines il
WHERE il.created_at > CURRENT_DATE - INTERVAL '7 days'
GROUP BY il.catalog_code, il.pcode, il.oem, il.description, il.item_category
ORDER BY count DESC
LIMIT 20;