-- Phase 5a Invoice Integration: Invoice Validations Table
-- Session 74 - Task 1.4
-- Date: 2025-10-23
-- Purpose: Track invoice validation and approval workflow

-- ============================================================================
-- CREATE INVOICE_VALIDATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoice_validations (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign key to invoice
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Validation results
  is_valid BOOLEAN DEFAULT false,
  validation_errors TEXT[], -- Array of error messages
  validation_warnings TEXT[], -- Array of warning messages
  validation_score NUMERIC(5,2), -- Confidence score 0-100
  
  -- Manual corrections
  manual_corrections JSONB, -- { field: { old_value, new_value, corrected_by, corrected_at } }
  correction_notes TEXT,
  
  -- Approval workflow
  approval_status TEXT DEFAULT 'pending', -- pending, approved, rejected, needs_review
  approval_required BOOLEAN DEFAULT true,
  
  -- Review details
  reviewed_by UUID REFERENCES profiles(user_id),
  review_date TIMESTAMPTZ,
  review_notes TEXT,
  review_duration_seconds INT, -- Time spent reviewing
  
  -- Approval details
  approved_by UUID REFERENCES profiles(user_id),
  approval_date TIMESTAMPTZ,
  approval_notes TEXT,
  
  -- Rejection details
  rejected_by UUID REFERENCES profiles(user_id),
  rejection_date TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Validation rules applied
  rules_applied JSONB, -- { rule_name: { passed: bool, message: string } }
  auto_validation_enabled BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Fast lookup by invoice
CREATE INDEX idx_invoice_validations_invoice_id ON invoice_validations(invoice_id);

-- Filter by approval status
CREATE INDEX idx_invoice_validations_approval_status ON invoice_validations(approval_status);

-- Filter by validity
CREATE INDEX idx_invoice_validations_is_valid ON invoice_validations(is_valid);

-- Filter by reviewer
CREATE INDEX idx_invoice_validations_reviewed_by ON invoice_validations(reviewed_by);

-- Sort by review date
CREATE INDEX idx_invoice_validations_review_date ON invoice_validations(review_date DESC NULLS LAST);

-- ============================================================================
-- CREATE TRIGGER FOR UPDATED_AT
-- ============================================================================

DROP TRIGGER IF EXISTS update_invoice_validations_updated_at ON invoice_validations;
CREATE TRIGGER update_invoice_validations_updated_at
  BEFORE UPDATE ON invoice_validations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE invoice_validations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view validations for accessible invoices
CREATE POLICY "Users can view validations for accessible invoices"
  ON invoice_validations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      JOIN cases c ON c.id = i.case_id
      WHERE i.id = invoice_validations.invoice_id
      AND (
        c.created_by = auth.uid() OR
        auth.uid() IN (
          SELECT user_id FROM profiles WHERE role IN ('admin', 'developer')
        )
      )
    )
  );

-- Policy: Users can create validations for accessible invoices
CREATE POLICY "Users can create validations for accessible invoices"
  ON invoice_validations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices i
      JOIN cases c ON c.id = i.case_id
      WHERE i.id = invoice_validations.invoice_id
      AND (
        c.created_by = auth.uid() OR
        auth.uid() IN (
          SELECT user_id FROM profiles WHERE role IN ('admin', 'developer')
        )
      )
    )
  );

-- Policy: Users can update validations they created or for their invoices
CREATE POLICY "Users can update their validations"
  ON invoice_validations
  FOR UPDATE
  USING (
    reviewed_by = auth.uid() OR
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role IN ('admin', 'developer')
    )
  );

-- ============================================================================
-- VALIDATION RULES FUNCTIONS
-- ============================================================================

-- Function: Run all validation rules on an invoice
CREATE OR REPLACE FUNCTION validate_invoice(p_invoice_id UUID)
RETURNS JSONB AS $$
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
  
  -- Rule 3: Issue date required and reasonable
  IF v_invoice.issue_date IS NULL THEN
    v_errors := array_append(v_errors, 'Issue date is required');
    v_score := v_score - 10;
  ELSIF v_invoice.issue_date > CURRENT_DATE THEN
    v_warnings := array_append(v_warnings, 'Issue date is in the future');
    v_score := v_score - 5;
  ELSIF v_invoice.issue_date < CURRENT_DATE - INTERVAL '5 years' THEN
    v_warnings := array_append(v_warnings, 'Issue date is more than 5 years old');
    v_score := v_score - 5;
  END IF;
  
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Auto-validate invoice and create validation record
CREATE OR REPLACE FUNCTION auto_validate_and_save(p_invoice_id UUID)
RETURNS UUID AS $$
DECLARE
  v_validation_result JSONB;
  v_validation_id UUID;
BEGIN
  -- Run validation
  v_validation_result := validate_invoice(p_invoice_id);
  
  -- Insert or update validation record
  INSERT INTO invoice_validations (
    invoice_id,
    is_valid,
    validation_errors,
    validation_warnings,
    validation_score,
    rules_applied,
    approval_status
  )
  VALUES (
    p_invoice_id,
    (v_validation_result->>'is_valid')::BOOLEAN,
    ARRAY(SELECT jsonb_array_elements_text(v_validation_result->'validation_errors')),
    ARRAY(SELECT jsonb_array_elements_text(v_validation_result->'validation_warnings')),
    (v_validation_result->>'validation_score')::NUMERIC,
    v_validation_result->'rules_applied',
    CASE 
      WHEN (v_validation_result->>'is_valid')::BOOLEAN THEN 'approved'
      ELSE 'needs_review'
    END
  )
  ON CONFLICT (invoice_id) DO UPDATE SET
    is_valid = EXCLUDED.is_valid,
    validation_errors = EXCLUDED.validation_errors,
    validation_warnings = EXCLUDED.validation_warnings,
    validation_score = EXCLUDED.validation_score,
    rules_applied = EXCLUDED.rules_applied,
    approval_status = EXCLUDED.approval_status,
    updated_at = now()
  RETURNING id INTO v_validation_id;
  
  RETURN v_validation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: AUTO-VALIDATE INVOICE ON INSERT/UPDATE
-- ============================================================================

-- Function to auto-validate invoice when it changes
CREATE OR REPLACE FUNCTION trigger_auto_validate_invoice()
RETURNS TRIGGER AS $$
BEGIN
  -- Run validation asynchronously
  PERFORM auto_validate_and_save(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on invoices table
DROP TRIGGER IF EXISTS auto_validate_invoice_on_change ON invoices;
CREATE TRIGGER auto_validate_invoice_on_change
  AFTER INSERT OR UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_validate_invoice();

-- ============================================================================
-- UNIQUE CONSTRAINT (one validation per invoice)
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoice_validations_unique_invoice 
ON invoice_validations(invoice_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check table created
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'invoice_validations';

-- Test validation function
-- SELECT validate_invoice('your-invoice-id-here');

-- ============================================================================
-- NOTES
-- ============================================================================

-- This table tracks validation and approval workflow for invoices
--
-- VALIDATION RULES:
-- 1. Invoice number required
-- 2. Supplier name required
-- 3. Issue date required and reasonable (not future, not >5 years old)
-- 4. Total amount must be positive
-- 5. Total should match sum of line items
-- 6. Invoice should have line items
--
-- WORKFLOW:
-- 1. Invoice created/updated → Auto-validation triggered
-- 2. Validation results saved to invoice_validations table
-- 3. If errors found → approval_status = 'needs_review'
-- 4. If valid → approval_status = 'approved'
-- 5. User can manually review and override
-- 6. Admin/Developer can approve/reject
--
-- APPROVAL STATUSES:
-- - 'pending': Awaiting initial validation
-- - 'needs_review': Has validation errors, requires manual review
-- - 'approved': Validated and approved
-- - 'rejected': Rejected by reviewer
