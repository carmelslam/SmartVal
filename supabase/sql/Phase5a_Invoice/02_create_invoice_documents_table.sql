-- Phase 5a Invoice Integration: Invoice Documents Table
-- Session 74 - Task 1.2
-- Date: 2025-10-23
-- Purpose: Store uploaded invoice files and OCR processing results

-- ============================================================================
-- CREATE INVOICE_DOCUMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoice_documents (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  plate TEXT NOT NULL,
  
  -- File information
  filename TEXT NOT NULL,
  file_size BIGINT, -- Size in bytes
  mime_type TEXT, -- e.g., 'application/pdf', 'image/jpeg'
  storage_path TEXT, -- Path in Supabase Storage bucket
  storage_bucket TEXT DEFAULT 'docs', -- Bucket name
  
  -- OCR processing status
  ocr_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  ocr_raw_text TEXT, -- Raw text extracted by OCR
  ocr_structured_data JSONB, -- Structured data from OCR
  ocr_confidence NUMERIC(5,2), -- Confidence score 0-100
  language_detected TEXT DEFAULT 'he', -- he, en, ar, etc.
  
  -- Processing metadata
  processing_method TEXT, -- 'make_ocr', 'manual_upload', 'api_import'
  processing_errors JSONB, -- Array of error messages
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  
  -- User tracking (Phase 6)
  uploaded_by UUID REFERENCES profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Fast lookup by invoice
CREATE INDEX idx_invoice_documents_invoice_id ON invoice_documents(invoice_id);

-- Fast lookup by case
CREATE INDEX idx_invoice_documents_case_id ON invoice_documents(case_id);

-- Fast lookup by plate
CREATE INDEX idx_invoice_documents_plate ON invoice_documents(plate);

-- Filter by OCR status
CREATE INDEX idx_invoice_documents_ocr_status ON invoice_documents(ocr_status);

-- Filter by uploaded_by user
CREATE INDEX idx_invoice_documents_uploaded_by ON invoice_documents(uploaded_by);

-- Filter by upload date
CREATE INDEX idx_invoice_documents_created_at ON invoice_documents(created_at DESC);

-- ============================================================================
-- CREATE TRIGGER FOR UPDATED_AT
-- ============================================================================

DROP TRIGGER IF EXISTS update_invoice_documents_updated_at ON invoice_documents;
CREATE TRIGGER update_invoice_documents_updated_at
  BEFORE UPDATE ON invoice_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE invoice_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view invoice documents for cases they have access to
CREATE POLICY "Users can view invoice documents for accessible cases"
  ON invoice_documents
  FOR SELECT
  USING (
    -- Case ownership check (from Phase 6)
    EXISTS (
      SELECT 1 FROM cases c
      WHERE c.id = invoice_documents.case_id
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

-- Policy: Users can upload documents to their own cases
CREATE POLICY "Users can upload documents to their cases"
  ON invoice_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cases c
      WHERE c.id = invoice_documents.case_id
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

-- Policy: Users can update documents they uploaded or own
CREATE POLICY "Users can update their invoice documents"
  ON invoice_documents
  FOR UPDATE
  USING (
    uploaded_by = auth.uid() OR
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role IN ('admin', 'developer')
    )
  );

-- Policy: Only admins/developers can delete documents
CREATE POLICY "Admins can delete invoice documents"
  ON invoice_documents
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role IN ('admin', 'developer')
    )
  );

-- ============================================================================
-- ENABLE REALTIME
-- ============================================================================

-- Enable real-time subscriptions for invoice documents
ALTER PUBLICATION supabase_realtime ADD TABLE invoice_documents;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Get documents by case
CREATE OR REPLACE FUNCTION get_invoice_documents_by_case(p_case_id UUID)
RETURNS TABLE (
  id UUID,
  invoice_id UUID,
  filename TEXT,
  file_size BIGINT,
  mime_type TEXT,
  storage_path TEXT,
  ocr_status TEXT,
  ocr_confidence NUMERIC,
  uploaded_by UUID,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.invoice_id,
    d.filename,
    d.file_size,
    d.mime_type,
    d.storage_path,
    d.ocr_status,
    d.ocr_confidence,
    d.uploaded_by,
    d.created_at
  FROM invoice_documents d
  WHERE d.case_id = p_case_id
  ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check table created
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'invoice_documents';

-- Check columns
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'invoice_documents';

-- Check indexes
-- SELECT indexname FROM pg_indexes WHERE tablename = 'invoice_documents';

-- Check RLS policies
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'invoice_documents';

-- ============================================================================
-- NOTES
-- ============================================================================

-- This table stores metadata about uploaded invoice files
-- 
-- WORKFLOW:
-- 1. User uploads PDF/image via invoice upload.html
-- 2. File saved to Supabase Storage 'docs' bucket
-- 3. Record created in invoice_documents with storage_path
-- 4. Make.com OCR webhook triggered for processing
-- 5. OCR results written back to ocr_raw_text and ocr_structured_data
-- 6. Invoice record created in invoices table with link to this document
--
-- STORAGE:
-- - Files stored in Supabase Storage bucket: 'docs'
-- - Path format: {case_id}/invoices/{filename}
-- - Generate signed URLs for viewing: supabase.storage.from('docs').createSignedUrl()
