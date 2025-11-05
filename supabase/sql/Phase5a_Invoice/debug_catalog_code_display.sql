-- Debug catalog code display issue in invoice floating screen
-- The screen shows "שם" instead of catalog codes

-- Check what's actually in invoice_lines for catalog_code, pcode, oem fields
SELECT 
    'INVOICE LINES CATALOG FIELDS' as section,
    il.id,
    il.invoice_id,
    il.line_number,
    il.description,
    il.catalog_code,
    il.pcode,
    il.oem,
    il.source,
    il.part_name,
    il.created_at,
    i.invoice_number,
    i.supplier_name
FROM invoice_lines il
LEFT JOIN invoices i ON i.id = il.invoice_id
ORDER BY il.created_at DESC
LIMIT 20;

-- Check if there are any fields that might contain "שם" value
SELECT 
    'FIELDS WITH SHM VALUE' as section,
    il.*
FROM invoice_lines il
WHERE il.catalog_code = 'שם' 
   OR il.pcode = 'שם'
   OR il.oem = 'שם'
   OR il.part_name = 'שם'
   OR il.description LIKE '%שם%'
LIMIT 10;

-- Check what recent invoices have in their line data
SELECT 
    'RECENT INVOICE LINES SAMPLE' as section,
    il.catalog_code,
    il.pcode, 
    il.oem,
    il.part_name,
    il.description,
    COUNT(*) as line_count
FROM invoice_lines il
WHERE il.created_at > CURRENT_DATE - INTERVAL '7 days'
GROUP BY il.catalog_code, il.pcode, il.oem, il.part_name, il.description
ORDER BY line_count DESC
LIMIT 15;