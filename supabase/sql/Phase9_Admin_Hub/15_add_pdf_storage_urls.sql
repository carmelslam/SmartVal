-- =====================================================
-- Phase 9: Fix Report Tables - Add PDF Storage URLs
-- Date: 2025-10-25
-- Purpose: Add PDF storage fields like parts_export_reports
-- =====================================================

-- Add PDF storage fields to tracking_expertise
ALTER TABLE tracking_expertise
ADD COLUMN IF NOT EXISTS pdf_storage_path TEXT,
ADD COLUMN IF NOT EXISTS pdf_public_url TEXT;

-- Add PDF storage fields to tracking_final_report
ALTER TABLE tracking_final_report
ADD COLUMN IF NOT EXISTS pdf_storage_path TEXT,
ADD COLUMN IF NOT EXISTS pdf_public_url TEXT;

-- Add indexes for PDF URL queries
CREATE INDEX IF NOT EXISTS idx_tracking_expertise_pdf_url
ON tracking_expertise(pdf_public_url)
WHERE pdf_public_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tracking_final_report_pdf_url
ON tracking_final_report(pdf_public_url)
WHERE pdf_public_url IS NOT NULL;

COMMENT ON COLUMN tracking_expertise.pdf_storage_path IS 'Storage path in Supabase Storage bucket (expertise-reports)';
COMMENT ON COLUMN tracking_expertise.pdf_public_url IS 'Public URL to view/download PDF report';
COMMENT ON COLUMN tracking_final_report.pdf_storage_path IS 'Storage path in Supabase Storage bucket (final-reports or estimate-reports)';
COMMENT ON COLUMN tracking_final_report.pdf_public_url IS 'Public URL to view/download PDF report';

-- =====================================================
-- END OF SCRIPT
-- =====================================================
