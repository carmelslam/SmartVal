-- Phase 5a Invoice Integration: Additional Indexes and RLS Policies
-- Session 74 - Task 1.5
-- Date: 2025-10-23
-- Purpose: Optimize query performance and secure access

-- ============================================================================
-- ADDITIONAL PERFORMANCE INDEXES
-- ============================================================================

-- Invoices table: Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_invoices_case_plate ON invoices(case_id, plate);
CREATE INDEX IF NOT EXISTS idx_invoices_status_date ON invoices(status, issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_supplier_date ON invoices(supplier_name, issue_date DESC);

-- Invoice lines: Composite index for part lookup
CREATE INDEX IF NOT EXISTS idx_invoice_lines_part_invoice ON invoice_lines(part_id, invoice_id) WHERE part_id IS NOT NULL;

-- Invoice documents: Composite index for case documents
CREATE INDEX IF NOT EXISTS idx_invoice_documents_case_plate ON invoice_documents(case_id, plate);

-- ============================================================================
-- JSONB INDEXES FOR METADATA FIELDS
-- ============================================================================

-- Enable GIN index on metadata JSONB columns for fast JSON queries
CREATE INDEX IF NOT EXISTS idx_invoices_metadata_gin ON invoices USING gin(metadata jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_metadata_gin ON invoice_lines USING gin(metadata jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_invoice_documents_ocr_data_gin ON invoice_documents USING gin(ocr_structured_data jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_invoice_suppliers_metadata_gin ON invoice_suppliers USING gin(metadata jsonb_path_ops);

-- ============================================================================
-- FULL-TEXT SEARCH INDEXES
-- ============================================================================

-- Enable full-text search on invoice supplier names and descriptions
CREATE INDEX IF NOT EXISTS idx_invoices_supplier_name_trgm ON invoices USING gin(supplier_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_description_trgm ON invoice_lines USING gin(description gin_trgm_ops);

-- ============================================================================
-- UPDATE RLS POLICIES FOR INVOICES TABLE
-- ============================================================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "All users can read cases" ON invoices;
DROP POLICY IF EXISTS "All users can create cases" ON invoices;
DROP POLICY IF EXISTS "All users can update cases" ON invoices;

-- Policy: Users can view invoices for cases they have access to
CREATE POLICY "Users can view invoices for accessible cases"
  ON invoices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cases c
      WHERE c.id = invoices.case_id
      AND (
        c.created_by = auth.uid() OR -- Owner
        auth.uid() IN (
          SELECT user_id FROM profiles WHERE role IN ('admin', 'developer')
        ) OR -- Admin/Developer
        auth.uid() IN (
          SELECT collaborator_id FROM case_collaborators 
          WHERE case_id = c.id AND status = 'active'
        ) -- Collaborator
      )
    )
  );

-- Policy: Users can create invoices for their cases
CREATE POLICY "Users can create invoices for their cases"
  ON invoices
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cases c
      WHERE c.id = invoices.case_id
      AND (
        c.created_by = auth.uid() OR
        auth.uid() IN (
          SELECT user_id FROM profiles WHERE role IN ('admin', 'developer')
        ) OR
        auth.uid() IN (
          SELECT collaborator_id FROM case_collaborators 
          WHERE case_id = c.id AND status = 'active'
        )
      )
    )
  );

-- Policy: Users can update invoices for their cases
CREATE POLICY "Users can update invoices for their cases"
  ON invoices
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM cases c
      WHERE c.id = invoices.case_id
      AND (
        c.created_by = auth.uid() OR
        auth.uid() IN (
          SELECT user_id FROM profiles WHERE role IN ('admin', 'developer')
        ) OR
        auth.uid() IN (
          SELECT collaborator_id FROM case_collaborators 
          WHERE case_id = c.id AND status = 'active'
        )
      )
    )
  );

-- Policy: Only admins/developers can delete invoices
CREATE POLICY "Admins can delete invoices"
  ON invoices
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role IN ('admin', 'developer')
    )
  );

-- ============================================================================
-- UPDATE RLS POLICIES FOR INVOICE_LINES TABLE
-- ============================================================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "All users can read helpers" ON invoice_lines;
DROP POLICY IF EXISTS "All users can create helpers" ON invoice_lines;
DROP POLICY IF EXISTS "All users can update helpers" ON invoice_lines;

-- Policy: Users can view invoice lines for accessible invoices
CREATE POLICY "Users can view invoice lines for accessible invoices"
  ON invoice_lines
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      JOIN cases c ON c.id = i.case_id
      WHERE i.id = invoice_lines.invoice_id
      AND (
        c.created_by = auth.uid() OR
        auth.uid() IN (
          SELECT user_id FROM profiles WHERE role IN ('admin', 'developer')
        ) OR
        auth.uid() IN (
          SELECT collaborator_id FROM case_collaborators 
          WHERE case_id = c.id AND status = 'active'
        )
      )
    )
  );

-- Policy: Users can create invoice lines for accessible invoices
CREATE POLICY "Users can create invoice lines for accessible invoices"
  ON invoice_lines
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices i
      JOIN cases c ON c.id = i.case_id
      WHERE i.id = invoice_lines.invoice_id
      AND (
        c.created_by = auth.uid() OR
        auth.uid() IN (
          SELECT user_id FROM profiles WHERE role IN ('admin', 'developer')
        ) OR
        auth.uid() IN (
          SELECT collaborator_id FROM case_collaborators 
          WHERE case_id = c.id AND status = 'active'
        )
      )
    )
  );

-- Policy: Users can update invoice lines for accessible invoices
CREATE POLICY "Users can update invoice lines for accessible invoices"
  ON invoice_lines
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      JOIN cases c ON c.id = i.case_id
      WHERE i.id = invoice_lines.invoice_id
      AND (
        c.created_by = auth.uid() OR
        auth.uid() IN (
          SELECT user_id FROM profiles WHERE role IN ('admin', 'developer')
        ) OR
        auth.uid() IN (
          SELECT collaborator_id FROM case_collaborators 
          WHERE case_id = c.id AND status = 'active'
        )
      )
    )
  );

-- Policy: Admins can delete invoice lines
CREATE POLICY "Admins can delete invoice lines"
  ON invoice_lines
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role IN ('admin', 'developer')
    )
  );

-- ============================================================================
-- STORAGE BUCKET POLICIES (for invoice documents)
-- ============================================================================

-- Note: Storage policies are managed through Supabase dashboard or API
-- These are SQL comments showing what should be configured:

/*
Storage Bucket: 'docs'
Path: {case_id}/invoices/{filename}

Policies:
1. SELECT: Users can view files for cases they have access to
   - Match: storage.foldername(name)[1] = case_id from cases table
   - Check: user has access to that case_id

2. INSERT: Users can upload files to their cases
   - Match: storage.foldername(name)[1] = case_id from cases table
   - Check: user has access to that case_id

3. UPDATE: Users can update metadata for files in their cases
   - Match: storage.foldername(name)[1] = case_id from cases table
   - Check: user has access to that case_id

4. DELETE: Only admins can delete files
   - Check: user role is admin or developer
*/

-- ============================================================================
-- HELPER VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Complete invoice details with supplier and validation info
CREATE OR REPLACE VIEW invoice_details AS
SELECT 
  i.id,
  i.case_id,
  i.plate,
  i.invoice_number,
  i.invoice_type,
  i.supplier_name,
  i.supplier_tax_id,
  i.issue_date,
  i.due_date,
  i.status,
  i.total_before_tax,
  i.tax_amount,
  i.total_amount,
  i.created_by,
  i.updated_by,
  i.created_at,
  i.updated_at,
  
  -- Supplier details
  s.phone as supplier_phone,
  s.email as supplier_email,
  s.category as supplier_category,
  s.is_preferred as supplier_is_preferred,
  
  -- Validation details
  v.is_valid,
  v.validation_errors,
  v.validation_warnings,
  v.validation_score,
  v.approval_status,
  v.reviewed_by,
  v.review_date,
  
  -- Line items count
  (SELECT COUNT(*) FROM invoice_lines il WHERE il.invoice_id = i.id) as line_items_count,
  
  -- Documents count
  (SELECT COUNT(*) FROM invoice_documents d WHERE d.invoice_id = i.id) as documents_count
  
FROM invoices i
LEFT JOIN invoice_suppliers s ON s.name = i.supplier_name
LEFT JOIN invoice_validations v ON v.invoice_id = i.id;

-- ============================================================================
-- PERFORMANCE STATISTICS FUNCTIONS
-- ============================================================================

-- Function: Get invoice statistics by case
CREATE OR REPLACE FUNCTION get_invoice_stats_by_case(p_case_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_invoices', COUNT(*),
    'total_amount', COALESCE(SUM(total_amount), 0),
    'average_amount', COALESCE(AVG(total_amount), 0),
    'by_type', jsonb_object_agg(
      COALESCE(invoice_type, 'unknown'),
      type_stats
    )
  ) INTO v_stats
  FROM invoices i
  LEFT JOIN LATERAL (
    SELECT jsonb_build_object(
      'count', COUNT(*),
      'total', COALESCE(SUM(total_amount), 0)
    ) as type_stats
    FROM invoices
    WHERE case_id = p_case_id 
    AND invoice_type = i.invoice_type
  ) t ON true
  WHERE i.case_id = p_case_id;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all indexes created
-- SELECT schemaname, tablename, indexname 
-- FROM pg_indexes 
-- WHERE tablename IN ('invoices', 'invoice_lines', 'invoice_documents', 'invoice_suppliers', 'invoice_validations')
-- ORDER BY tablename, indexname;

-- Check all RLS policies
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies 
-- WHERE tablename IN ('invoices', 'invoice_lines', 'invoice_documents', 'invoice_suppliers', 'invoice_validations')
-- ORDER BY tablename, policyname;

-- Test invoice details view
-- SELECT * FROM invoice_details LIMIT 5;

-- ============================================================================
-- NOTES
-- ============================================================================

-- This file creates:
-- 1. Performance indexes for common query patterns
-- 2. JSONB GIN indexes for fast metadata searches
-- 3. Full-text search indexes using trigram
-- 4. Proper RLS policies matching Phase 6 case ownership
-- 5. Helper view for complete invoice details
-- 6. Statistics functions for analytics
--
-- All policies integrate with Phase 6 authentication:
-- - Case owners can manage their invoices
-- - Admins/developers can manage all invoices
-- - Collaborators can manage shared case invoices
-- - RLS policies prevent unauthorized access
