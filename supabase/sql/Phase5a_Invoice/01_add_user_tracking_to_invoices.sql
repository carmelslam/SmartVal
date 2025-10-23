-- Phase 5a Invoice Integration: Add User Tracking to Existing Tables
-- Session 74 - Task 1.1
-- Date: 2025-10-23
-- Purpose: Add created_by and updated_by fields to invoices and invoice_lines tables
-- NOTE: Tables already exist, only adding missing columns

-- ============================================================================
-- 1. ADD USER TRACKING TO INVOICES TABLE (if columns don't exist)
-- ============================================================================

-- Add created_by column (if not exists)
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(user_id);

-- Add updated_by column (if not exists)
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(user_id);

-- Note: updated_at already exists with trigger

-- ============================================================================
-- 2. ADD USER TRACKING TO INVOICE_LINES TABLE (if columns don't exist)
-- ============================================================================

-- Add created_by column (if not exists)
ALTER TABLE invoice_lines 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(user_id);

-- Add updated_by column (if not exists)
ALTER TABLE invoice_lines 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(user_id);

-- Add created_at column if not exists
ALTER TABLE invoice_lines 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Add updated_at column if not exists
ALTER TABLE invoice_lines 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- 3. CREATE TRIGGER FOR INVOICE_LINES UPDATED_AT (if not exists)
-- ============================================================================

-- Note: update_updated_at() function should already exist from invoices trigger
-- If it doesn't exist, create it:
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for invoice_lines table (if not exists)
DROP TRIGGER IF EXISTS update_invoice_lines_updated_at ON invoice_lines;
CREATE TRIGGER update_invoice_lines_updated_at
  BEFORE UPDATE ON invoice_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 4. CREATE INDEXES FOR USER TRACKING (if not exist)
-- ============================================================================

-- Index for invoices created_by (for filtering by user)
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);

-- Index for invoices updated_by (for audit trail)
CREATE INDEX IF NOT EXISTS idx_invoices_updated_by ON invoices(updated_by);

-- Index for invoice_lines created_by
CREATE INDEX IF NOT EXISTS idx_invoice_lines_created_by ON invoice_lines(created_by);

-- Index for invoice_lines updated_by
CREATE INDEX IF NOT EXISTS idx_invoice_lines_updated_by ON invoice_lines(updated_by);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify columns added successfully to invoices
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'invoices' 
-- AND column_name IN ('created_by', 'updated_by', 'created_at', 'updated_at')
-- ORDER BY column_name;

-- Verify columns added successfully to invoice_lines
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'invoice_lines' 
-- AND column_name IN ('created_by', 'updated_by', 'created_at', 'updated_at')
-- ORDER BY column_name;

-- Verify triggers created
-- SELECT trigger_name, event_manipulation, event_object_table 
-- FROM information_schema.triggers 
-- WHERE event_object_table IN ('invoices', 'invoice_lines')
-- AND trigger_name LIKE '%updated_at%';

-- Verify indexes created
-- SELECT indexname 
-- FROM pg_indexes 
-- WHERE tablename IN ('invoices', 'invoice_lines')
-- AND indexname LIKE '%created_by%' OR indexname LIKE '%updated_by%'
-- ORDER BY indexname;

-- ============================================================================
-- NOTES
-- ============================================================================

-- This migration adds user tracking to existing invoice tables:
-- 1. created_by: UUID of user who created the record
-- 2. updated_by: UUID of user who last updated the record
-- 3. updated_at: Timestamp of last update (automatic via trigger)
-- 4. created_at: Timestamp of creation (for invoice_lines)
--
-- These fields integrate with Phase 6 authentication system
-- Use window.caseOwnershipService.getCurrentUser() in JavaScript to get userId
--
-- SAFETY: All ALTER TABLE commands use IF NOT EXISTS to prevent errors
-- if columns already exist. Safe to run multiple times (idempotent).
