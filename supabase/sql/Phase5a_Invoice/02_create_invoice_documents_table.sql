-- Phase 5a Invoice Integration: Invoice Documents Table
-- Session 74 - Task 1.2
-- Date: 2025-10-23
-- Purpose: Store uploaded invoice files and OCR processing results
-- NOTE: This table CAPTURES OCR DATA from Make.com webhook response

-- ============================================================================
-- CREATE INVOICE_DOCUMENTS TABLE (for OCR data capture)
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
  
  -- ========================================================================
  -- OCR PROCESSING DATA (THIS IS WHERE OCR RESULTS ARE CAPTURED)
  -- ========================================================================
  ocr_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  
  -- Raw OCR text extracted from invoice
  ocr_raw_text TEXT, 
  
  -- Structured OCR data from Make.com webhook response
  -- This JSONB field stores the complete webhook response:
  -- {
  --   "items": [{"name": "...", "quantity": 1, "unit_price": 100}, ...],
  --   "total": 1000,
  --   "confidence": 95,
  --   "חלקים": [...],  -- Hebrew OCR data
  --   "עבודות": [...],  -- Works array
  --   "תיקונים": [...]  -- Repairs array
  -- }
  ocr_structured_data JSONB, 
  
  -- OCR confidence score (0-100)
  ocr_confidence NUMERIC(5,2),
  
  -- Language detected by OCR (he, en, ar, etc.)
  language_detected TEXT DEFAULT 'he',
  -- ========================================================================
  
  -- Processing metadata
  processing_method TEXT, -- 'make_ocr', 'manual_upload', 'api_import'
  processing_errors JSONB, -- Array of error messages if OCR fails
  processing_started_at TIMESTAMPTZ, -- When OCR processing started
  processing_completed_at TIMESTAMPTZ, -- When OCR processing completed
  
  -- User tracking (Phase 6)
  uploaded_by UUID REFERENCES profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Fast lookup by invoice
CREATE INDEX IF NOT EXISTS idx_invoice_documents_invoice_id ON invoice_documents(invoice_id);

-- Fast lookup by case
CREATE INDEX IF NOT EXISTS idx_invoice_documents_case_id ON invoice_documents(case_id);

-- Fast lookup by plate
CREATE INDEX IF NOT EXISTS idx_invoice_documents_plate ON invoice_documents(plate);

-- Filter by OCR status
CREATE INDEX IF NOT EXISTS idx_invoice_documents_ocr_status ON invoice_documents(ocr_status);

-- Filter by uploaded_by user
CREATE INDEX IF NOT EXISTS idx_invoice_documents_uploaded_by ON invoice_documents(uploaded_by);

-- Filter by upload date
CREATE INDEX IF NOT EXISTS idx_invoice_documents_created_at ON invoice_documents(created_at DESC);

-- GIN index for fast JSON queries on OCR structured data
CREATE INDEX IF NOT EXISTS idx_invoice_documents_ocr_data_gin 
ON invoice_documents USING gin(ocr_structured_data jsonb_path_ops);

-- ============================================================================
-- CREATE TRIGGER FOR UPDATED_AT
-- ============================================================================

DROP TRIGGER IF EXISTS update_invoice_documents_updated_at ON invoice_documents;
CREATE TRIGGER update_invoice_documents_updated_at
  BEFORE UPDATE ON invoice_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

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
-- HELPER FUNCTIONS FOR OCR DATA
-- ============================================================================

-- Function: Get OCR data by invoice ID
CREATE OR REPLACE FUNCTION get_invoice_ocr_data(p_invoice_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_ocr_data JSONB;
BEGIN
  SELECT ocr_structured_data INTO v_ocr_data
  FROM invoice_documents
  WHERE invoice_id = p_invoice_id
  AND ocr_status = 'completed'
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN v_ocr_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get documents by case with OCR status
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

-- Check OCR columns exist
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'invoice_documents'
-- AND column_name LIKE 'ocr%'
-- ORDER BY column_name;

-- Check indexes
-- SELECT indexname FROM pg_indexes WHERE tablename = 'invoice_documents';

-- Check RLS policies
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'invoice_documents';

-- ============================================================================
-- NOTES - HOW OCR DATA IS CAPTURED
-- ============================================================================

-- WORKFLOW FOR OCR DATA CAPTURE:
-- 
-- 1. User uploads PDF/image via invoice upload.html
-- 2. File saved to Supabase Storage 'docs' bucket
-- 3. Record created in invoice_documents with:
--    - storage_path: path to file in storage
--    - ocr_status: 'pending'
-- 
-- 4. Make.com OCR webhook triggered with file
-- 5. Make.com processes file and returns JSON:
--    {
--      "items": [
--        {"name": "חלק 1", "quantity": 2, "unit_price": 100},
--        {"name": "עבודה", "quantity": 1, "unit_price": 500}
--      ],
--      "total": 700,
--      "confidence": 95.5,
--      "raw_text": "חשבונית מספר 123..."
--    }
-- 
-- 6. JavaScript receives webhook response and UPDATES invoice_documents:
--    UPDATE invoice_documents SET
--      ocr_raw_text = result.raw_text,
--      ocr_structured_data = result, -- ENTIRE JSON STORED HERE
--      ocr_confidence = result.confidence,
--      ocr_status = 'completed',
--      processing_completed_at = now()
--    WHERE id = document_id;
-- 
-- 7. OCR data is now FULLY CAPTURED in database
-- 8. Can query: SELECT ocr_structured_data->'items' FROM invoice_documents
-- 
-- STORAGE:
-- - Files stored in Supabase Storage bucket: 'docs'
-- - Path format: {case_id}/invoices/{filename}
-- - Generate signed URLs: supabase.storage.from('docs').createSignedUrl()
-- - OCR results stored in ocr_structured_data JSONB column
