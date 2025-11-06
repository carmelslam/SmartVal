-- Remove invoice date validation rule from validate_invoice function
-- Validation should be based on status (ACCEPTED/VALIDATED), not date population

CREATE OR REPLACE FUNCTION validate_invoice(p_invoice_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_invoice RECORD;
  v_validation_result JSONB;
  v_errors TEXT[] := '{}';
  v_warnings TEXT[] := '{}';
  v_rules_applied JSONB := '{}';
  v_score NUMERIC := 100.0;
BEGIN
  -- Get invoice data
  SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'is_valid', false,
      'errors', ARRAY['Invoice not found'],
      'score', 0
    );
  END IF;
  
  -- Rule 1: Invoice number required
  IF v_invoice.invoice_number IS NULL OR v_invoice.invoice_number = '' THEN
    v_errors := array_append(v_errors, 'Invoice number is required');
    v_score := v_score - 20;
    v_rules_applied := v_rules_applied || jsonb_build_object('invoice_number_required', 
      jsonb_build_object('passed', false, 'message', 'Missing invoice number'));
  ELSE
    v_rules_applied := v_rules_applied || jsonb_build_object('invoice_number_required',
      jsonb_build_object('passed', true, 'message', 'Invoice number present'));
  END IF;
  
  -- Rule 2: Supplier name required
  IF v_invoice.supplier_name IS NULL OR v_invoice.supplier_name = '' THEN
    v_errors := array_append(v_errors, 'Supplier name is required');
    v_score := v_score - 15;
    v_rules_applied := v_rules_applied || jsonb_build_object('supplier_name_required',
      jsonb_build_object('passed', false, 'message', 'Missing supplier name'));
  ELSE
    v_rules_applied := v_rules_applied || jsonb_build_object('supplier_name_required',
      jsonb_build_object('passed', true, 'message', 'Supplier name present'));
  END IF;
  
  -- REMOVED: Rule 3 - Invoice date validation (not needed for supplier invoices)
  -- Validation should be based on invoice status (ACCEPTED/VALIDATED), not date population
  
  -- Rule 4: Total amount must be positive
  IF v_invoice.total_amount IS NULL OR v_invoice.total_amount <= 0 THEN
    v_errors := array_append(v_errors, 'Total amount must be positive');
    v_score := v_score - 20;
  END IF;
  
  -- Rule 5: Total amount should match sum of line items
  DECLARE
    v_line_items_total NUMERIC;
  BEGIN
    SELECT COALESCE(SUM(line_total), 0) INTO v_line_items_total
    FROM invoice_lines
    WHERE invoice_id = p_invoice_id;
    
    IF v_line_items_total > 0 AND ABS(v_invoice.total_amount - v_line_items_total) > 0.01 THEN
      v_warnings := array_append(v_warnings, 
        'Total amount does not match sum of line items (Diff: ' || 
        (v_invoice.total_amount - v_line_items_total)::TEXT || ')');
      v_score := v_score - 10;
    END IF;
  END;
  
  -- Rule 6: Check if invoice has line items
  IF NOT EXISTS (SELECT 1 FROM invoice_lines WHERE invoice_id = p_invoice_id) THEN
    v_warnings := array_append(v_warnings, 'Invoice has no line items');
    v_score := v_score - 5;
  END IF;
  
  -- Ensure score doesn't go below 0
  v_score := GREATEST(v_score, 0);
  
  -- Build result
  v_validation_result := jsonb_build_object(
    'is_valid', array_length(v_errors, 1) IS NULL OR array_length(v_errors, 1) = 0,
    'validation_errors', v_errors,
    'validation_warnings', v_warnings,
    'validation_score', v_score,
    'rules_applied', v_rules_applied
  );
  
  RETURN v_validation_result;
END;
$$;

-- Clean up existing validation records with date errors
DELETE FROM invoice_validations 
WHERE validation_errors::text LIKE '%Issue date%' 
   OR validation_errors::text LIKE '%Invoice date%';