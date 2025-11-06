-- =====================================================
-- Phase 10: Legacy Plate Removal & Tracking Table Integration  
-- Script 16: Add pdf_public_url field to tracking tables
-- Date: 2025-11-06
-- =====================================================
--
-- Purpose: Add pdf_public_url field to both tracking tables for PDF storage
-- This enables the load buttons to access generated PDFs
-- Dependencies: tracking_expertise and tracking_final_report tables
-- =====================================================

-- Add pdf_public_url field to tracking_expertise table
ALTER TABLE tracking_expertise 
ADD COLUMN IF NOT EXISTS pdf_public_url TEXT;

-- Add pdf_public_url field to tracking_final_report table  
ALTER TABLE tracking_final_report
ADD COLUMN IF NOT EXISTS pdf_public_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN tracking_expertise.pdf_public_url IS 'Public URL to the generated expertise PDF file';
COMMENT ON COLUMN tracking_final_report.pdf_public_url IS 'Public URL to the generated final report/estimate PDF file';

-- Create indexes on pdf_public_url for performance (optional but good practice)
CREATE INDEX IF NOT EXISTS idx_tracking_expertise_pdf_url
ON tracking_expertise(pdf_public_url) WHERE pdf_public_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tracking_final_report_pdf_url  
ON tracking_final_report(pdf_public_url) WHERE pdf_public_url IS NOT NULL;

-- =====================================================
-- Verification queries (run these to confirm changes)
-- =====================================================

-- Check that columns were added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('tracking_expertise', 'tracking_final_report') 
  AND column_name = 'pdf_public_url'
ORDER BY table_name, column_name;

-- Show table structures to confirm
\d tracking_expertise;
\d tracking_final_report;