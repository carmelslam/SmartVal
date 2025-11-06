-- Restore validation data by re-running validation for all invoices
-- This will populate the invoice_validations table with fresh data using the fixed function

-- Check current state
SELECT 
  'CURRENT STATE' as section,
  COUNT(*) as total_validations
FROM invoice_validations;

-- Check how many invoices need validation
SELECT 
  'INVOICES TO VALIDATE' as section,
  COUNT(*) as total_invoices
FROM invoices;

-- Re-run validation for all invoices to restore validation data
INSERT INTO invoice_validations (
  invoice_id,
  is_valid,
  validation_errors,
  validation_warnings,
  validation_score,
  rules_applied,
  approval_status,
  auto_validation_enabled
)
SELECT 
  i.id as invoice_id,
  (validate_invoice(i.id)->>'is_valid')::BOOLEAN as is_valid,
  ARRAY(SELECT jsonb_array_elements_text(validate_invoice(i.id)->'validation_errors')) as validation_errors,
  ARRAY(SELECT jsonb_array_elements_text(validate_invoice(i.id)->'validation_warnings')) as validation_warnings,
  (validate_invoice(i.id)->>'validation_score')::NUMERIC as validation_score,
  validate_invoice(i.id)->'rules_applied' as rules_applied,
  CASE 
    WHEN (validate_invoice(i.id)->>'is_valid')::BOOLEAN THEN 'approved'
    ELSE 'needs_review'
  END as approval_status,
  true as auto_validation_enabled
FROM invoices i
WHERE NOT EXISTS (
  SELECT 1 FROM invoice_validations iv WHERE iv.invoice_id = i.id
);

-- Show final state
SELECT 
  'AFTER RESTORE' as section,
  COUNT(*) as total_validations,
  COUNT(CASE WHEN is_valid = true THEN 1 END) as valid_invoices,
  COUNT(CASE WHEN is_valid = false THEN 1 END) as invalid_invoices
FROM invoice_validations;