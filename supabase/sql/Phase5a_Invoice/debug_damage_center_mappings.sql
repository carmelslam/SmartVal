-- Debug damage center mappings data

-- Check what's in the invoice_damage_center_mappings table
SELECT 
  'DAMAGE CENTER MAPPINGS OVERVIEW' as section,
  COUNT(*) as total_mappings,
  COUNT(DISTINCT case_id) as unique_cases,
  COUNT(DISTINCT invoice_id) as unique_invoices,
  COUNT(DISTINCT damage_center_id) as unique_damage_centers
FROM invoice_damage_center_mappings;

-- Show sample mapping records
SELECT 
  'SAMPLE MAPPINGS' as section,
  idcm.id,
  idcm.case_id,
  idcm.invoice_id,
  idcm.invoice_line_id,
  idcm.damage_center_id,
  idcm.damage_center_name,
  idcm.mapping_status,
  idcm.validation_status,
  i.invoice_number,
  i.supplier_name,
  il.description,
  il.catalog_code,
  il.source
FROM invoice_damage_center_mappings idcm
LEFT JOIN invoices i ON i.id = idcm.invoice_id
LEFT JOIN invoice_lines il ON il.id = idcm.invoice_line_id
LIMIT 10;

-- Check for the specific case from the screenshot (assuming case with 12 mappings)
SELECT 
  'CASE WITH 12 MAPPINGS' as section,
  idcm.case_id,
  COUNT(*) as mapping_count,
  STRING_AGG(DISTINCT idcm.damage_center_id, ', ') as damage_centers
FROM invoice_damage_center_mappings idcm
GROUP BY idcm.case_id
HAVING COUNT(*) = 12
LIMIT 5;