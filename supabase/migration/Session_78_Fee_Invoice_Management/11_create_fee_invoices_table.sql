-- =====================================================
-- Phase 9: Admin Hub Enhancement
-- Script 11: Fee Invoices Table and Storage
-- Date: 2025-10-25
-- Session: 78
-- =====================================================
--
-- Purpose: Create fee_invoices table for storing fee invoice metadata
-- Features:
--   - Support 3 invoice types: initial, supplementary, final
--   - Flexible invoice count (not limited to 2)
--   - Track file storage in Supabase Storage
--   - Auto-extract invoice date from file (OCR)
--   - User tracking (who uploaded)
-- Storage: fee-invoices bucket (path: fee-invoices/{plate}/{filename})
-- =====================================================

-- Drop table if exists (for development only - comment out for production)
-- DROP TABLE IF EXISTS fee_invoices CASCADE;

-- =====================================================
-- Create fee_invoices table
-- =====================================================

CREATE TABLE IF NOT EXISTS fee_invoices (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  payment_tracking_id UUID REFERENCES payment_tracking(id) ON DELETE CASCADE,

  -- Vehicle information (denormalized for fast queries)
  plate TEXT NOT NULL,

  -- Invoice Details
  invoice_type TEXT NOT NULL CHECK (
    invoice_type IN ('initial', 'supplementary', 'final')
  ),
  invoice_number TEXT, -- e.g., "INV-2025-001"
  invoice_date DATE,
  invoice_amount NUMERIC(10,2),

  -- File Storage (Supabase Storage)
  file_path TEXT NOT NULL, -- e.g., "fee-invoices/22184003/invoice-initial-2025-01-15.pdf"
  file_name TEXT NOT NULL, -- original filename
  file_size INT, -- bytes
  file_type TEXT, -- MIME type: application/pdf, image/jpeg, etc.

  -- OCR/Extraction metadata
  date_extracted_from_ocr BOOLEAN DEFAULT false, -- true if date was auto-extracted
  ocr_confidence NUMERIC(3,2), -- 0.00 to 1.00 confidence score
  extraction_metadata JSONB, -- store OCR results for audit

  -- User tracking
  uploaded_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now(),

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Indexes for performance
-- =====================================================

-- Index on plate for fast lookups
CREATE INDEX IF NOT EXISTS idx_fee_invoices_plate
ON fee_invoices(plate);

-- Index on case_id for joins
CREATE INDEX IF NOT EXISTS idx_fee_invoices_case_id
ON fee_invoices(case_id);

-- Index on payment_tracking_id for linking
CREATE INDEX IF NOT EXISTS idx_fee_invoices_payment_id
ON fee_invoices(payment_tracking_id);

-- Index on invoice_type for filtering
CREATE INDEX IF NOT EXISTS idx_fee_invoices_type
ON fee_invoices(invoice_type);

-- Index on invoice_date for date queries
CREATE INDEX IF NOT EXISTS idx_fee_invoices_date
ON fee_invoices(invoice_date DESC);

-- Index on uploaded_by for user activity
CREATE INDEX IF NOT EXISTS idx_fee_invoices_uploaded_by
ON fee_invoices(uploaded_by);

-- Composite index for common queries (plate + type)
CREATE INDEX IF NOT EXISTS idx_fee_invoices_plate_type
ON fee_invoices(plate, invoice_type);

-- =====================================================
-- Trigger: Auto-update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_fee_invoices_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fee_invoices_updated_at
  BEFORE UPDATE ON fee_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_fee_invoices_timestamp();

-- =====================================================
-- Trigger: Auto-update payment_tracking.fee_invoice_date
-- =====================================================

CREATE OR REPLACE FUNCTION sync_fee_invoice_date_to_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- When a fee invoice is inserted or updated, sync the date to payment_tracking
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.invoice_date IS NOT NULL THEN
    UPDATE payment_tracking
    SET fee_invoice_date = NEW.invoice_date
    WHERE id = NEW.payment_tracking_id;
  END IF;

  -- When a fee invoice is deleted, recalculate from remaining invoices
  IF TG_OP = 'DELETE' THEN
    UPDATE payment_tracking pt
    SET fee_invoice_date = (
      SELECT MAX(invoice_date)
      FROM fee_invoices
      WHERE payment_tracking_id = OLD.payment_tracking_id
    )
    WHERE pt.id = OLD.payment_tracking_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_fee_invoice_date
  AFTER INSERT OR UPDATE OR DELETE ON fee_invoices
  FOR EACH ROW
  EXECUTE FUNCTION sync_fee_invoice_date_to_payment();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE fee_invoices ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view fee invoices
CREATE POLICY "fee_invoices_select_policy"
ON fee_invoices
FOR SELECT
TO authenticated
USING (true);

-- Policy: Admins, assistants, and developers can insert fee invoices
CREATE POLICY "fee_invoices_insert_policy"
ON fee_invoices
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'assistant', 'developer', 'assessor')
  )
);

-- Policy: Admins, assistants, and developers can update fee invoices
CREATE POLICY "fee_invoices_update_policy"
ON fee_invoices
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'assistant', 'developer', 'assessor')
  )
)
WITH CHECK (true);

-- Policy: Only admins and developers can delete fee invoices
CREATE POLICY "fee_invoices_delete_policy"
ON fee_invoices
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'developer')
  )
);

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function: Get fee invoices for a plate/case
CREATE OR REPLACE FUNCTION get_fee_invoices(p_plate TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', fi.id,
      'plate', fi.plate,
      'invoice_type', fi.invoice_type,
      'invoice_number', fi.invoice_number,
      'invoice_date', fi.invoice_date,
      'invoice_amount', fi.invoice_amount,
      'file_path', fi.file_path,
      'file_name', fi.file_name,
      'file_size', fi.file_size,
      'file_type', fi.file_type,
      'uploaded_by', fi.uploaded_by,
      'uploaded_at', fi.uploaded_at,
      'uploader_name', p.name,
      'notes', fi.notes
    ) ORDER BY fi.invoice_date DESC, fi.created_at DESC
  ) INTO result
  FROM fee_invoices fi
  LEFT JOIN profiles p ON p.user_id = fi.uploaded_by
  WHERE fi.plate = p_plate;

  RETURN COALESCE(result, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get invoice count by type for a plate
CREATE OR REPLACE FUNCTION get_invoice_counts(p_plate TEXT)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'total', COUNT(*),
      'by_type', jsonb_object_agg(
        invoice_type,
        count
      )
    )
    FROM (
      SELECT invoice_type, COUNT(*) as count
      FROM fee_invoices
      WHERE plate = p_plate
      GROUP BY invoice_type
    ) counts
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Delete invoice and cleanup storage path
CREATE OR REPLACE FUNCTION delete_fee_invoice(p_invoice_id UUID)
RETURNS JSONB AS $$
DECLARE
  invoice_record fee_invoices;
  result JSONB;
BEGIN
  -- Get invoice details before deletion
  SELECT * INTO invoice_record
  FROM fee_invoices
  WHERE id = p_invoice_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invoice not found'
    );
  END IF;

  -- Delete the record (storage file must be deleted separately via Storage API)
  DELETE FROM fee_invoices
  WHERE id = p_invoice_id;

  -- Return file path for storage cleanup
  RETURN jsonb_build_object(
    'success', true,
    'file_path', invoice_record.file_path,
    'message', 'Invoice record deleted. Remember to delete storage file.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE fee_invoices IS 'Fee invoices storage and metadata for payment tracking (Phase 9)';
COMMENT ON COLUMN fee_invoices.plate IS 'Vehicle plate number (denormalized)';
COMMENT ON COLUMN fee_invoices.invoice_type IS 'Type: initial, supplementary, or final';
COMMENT ON COLUMN fee_invoices.file_path IS 'Storage path in Supabase Storage bucket: fee-invoices';
COMMENT ON COLUMN fee_invoices.date_extracted_from_ocr IS 'True if invoice date was auto-extracted via OCR';
COMMENT ON COLUMN fee_invoices.ocr_confidence IS 'OCR confidence score 0.00-1.00';
COMMENT ON COLUMN fee_invoices.extraction_metadata IS 'Full OCR extraction results (JSON)';

COMMENT ON FUNCTION get_fee_invoices(TEXT) IS 'Get all fee invoices for a plate with uploader details';
COMMENT ON FUNCTION get_invoice_counts(TEXT) IS 'Get invoice counts by type for a plate';
COMMENT ON FUNCTION delete_fee_invoice(UUID) IS 'Delete fee invoice record and return storage path for cleanup';

-- =====================================================
-- Grant permissions
-- =====================================================

GRANT SELECT ON fee_invoices TO authenticated;
GRANT INSERT, UPDATE, DELETE ON fee_invoices TO authenticated; -- RLS restricts

GRANT EXECUTE ON FUNCTION get_fee_invoices(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_invoice_counts(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_fee_invoice(UUID) TO authenticated;

-- =====================================================
-- END OF SCRIPT
-- =====================================================
