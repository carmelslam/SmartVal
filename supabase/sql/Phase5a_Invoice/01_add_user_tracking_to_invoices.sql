-- Phase 5a Invoice Integration: Add User Tracking to Existing Tables
-- Session 74 - Task 1.1
-- Date: 2025-10-23
-- Purpose: Add created_by and updated_by fields to invoices and invoice_lines tables

-- ============================================================================
-- 1. ADD USER TRACKING TO INVOICES TABLE
-- ============================================================================

-- Add created_by column
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(user_id);

-- Add updated_by column
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(user_id);

-- Add updated_at column if not exists
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- 2. ADD USER TRACKING TO INVOICE_LINES TABLE
-- ============================================================================

-- Add created_by column
ALTER TABLE invoice_lines 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(user_id);

-- Add updated_by column
ALTER TABLE invoice_lines 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(user_id);

-- Add created_at column if not exists
ALTER TABLE invoice_lines 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Add updated_at column if not exists
ALTER TABLE invoice_lines 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- 3. CREATE TRIGGER FOR AUTOMATIC UPDATED_AT TIMESTAMP
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for invoices table
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for invoice_lines table
DROP TRIGGER IF EXISTS update_invoice_lines_updated_at ON invoice_lines;
CREATE TRIGGER update_invoice_lines_updated_at
  BEFORE UPDATE ON invoice_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. CREATE INDEXES FOR USER TRACKING
-- ============================================================================

-- Index for invoices created_by (for filtering by user)
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);

-- Index for invoices updated_by (for audit trail)
CREATE INDEX IF NOT EXISTS idx_invoices_updated_by ON invoices(updated_by);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify columns added successfully
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'invoices' 
-- AND column_name IN ('created_by', 'updated_by', 'updated_at');

-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'invoice_lines' 
-- AND column_name IN ('created_by', 'updated_by', 'created_at', 'updated_at');

-- Verify triggers created
-- SELECT trigger_name, event_manipulation, event_object_table 
-- FROM information_schema.triggers 
-- WHERE trigger_name LIKE '%updated_at%';

-- ============================================================================
-- NOTES
-- ============================================================================

-- This migration adds user tracking to existing invoice tables:
-- 1. created_by: UUID of user who created the record
-- 2. updated_by: UUID of user who last updated the record
-- 3. updated_at: Timestamp of last update (automatic via trigger)
--
-- These fields integrate with Phase 6 authentication system
-- Use window.caseOwnershipService.getCurrentUser() in JavaScript to get userId
