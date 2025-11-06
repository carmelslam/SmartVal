-- Clean up old validation records that reference "Issue date is required" 
-- and re-run validation with fixed function

-- First, see current validation records with issue_date errors
SELECT 
  'CURRENT VALIDATION ERRORS' as section,
  id,
  invoice_id,
  validation_errors,
  validation_score,
  updated_at
FROM invoice_validations 
WHERE validation_errors::text LIKE '%Issue date is required%';

-- Delete validation records that have the old "Issue date" error
DELETE FROM invoice_validations 
WHERE validation_errors::text LIKE '%Issue date is required%';

-- Show how many were deleted
SELECT 
  'AFTER CLEANUP' as section,
  COUNT(*) as remaining_validations,
  COUNT(CASE WHEN validation_errors::text LIKE '%Issue date%' THEN 1 END) as issue_date_errors
FROM invoice_validations;

-- Re-run validation for all invoices to generate fresh validation records
-- This will use the fixed validate_invoice function
SELECT 
  'RE-RUNNING VALIDATION' as section,
  i.id as invoice_id,
  auto_validate_and_save(i.id) as validation_id
FROM invoices i;

-- Show final validation state
SELECT 
  'FINAL VALIDATION STATE' as section,
  COUNT(*) as total_validations,
  COUNT(CASE WHEN is_valid = true THEN 1 END) as valid_invoices,
  COUNT(CASE WHEN is_valid = false THEN 1 END) as invalid_invoices
FROM invoice_validations;