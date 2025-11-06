-- Find underlying table for invoice_details view and populate invoice_date
-- Task: invoice_details is a VIEW - need to find the underlying table to update

-- First, check if invoice_details is a view and get its definition
SELECT 
  'VIEW DEFINITION' as section,
  table_type,
  view_definition
FROM information_schema.views 
WHERE table_name = 'invoice_details' 
  AND table_schema = 'public';

-- Also check what tables exist that might be the base table
SELECT 
  'RELATED TABLES' as section,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%invoice%'
ORDER BY table_name;

-- Check current state of invoice_details view
SELECT 
  'CURRENT STATE' as section,
  COUNT(*) as total_details,
  COUNT(CASE WHEN invoice_date IS NULL THEN 1 END) as empty_invoice_dates,
  COUNT(CASE WHEN invoice_date IS NOT NULL THEN 1 END) as filled_invoice_dates
FROM invoice_details;

-- NOTE: Cannot update invoice_details directly as it's a VIEW
-- Need to identify the underlying table(s) and update those instead
-- Run the queries above first to understand the view structure
-- Then update the appropriate base table(s)