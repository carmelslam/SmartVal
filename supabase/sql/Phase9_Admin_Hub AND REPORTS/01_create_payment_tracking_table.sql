-- =====================================================
-- Phase 9: Admin Hub Enhancement
-- Script 01: Payment Tracking Table
-- Date: 2025-10-24
-- Session: 75
-- =====================================================
--
-- Purpose: Create payment_tracking table for fee tracking and payment management
-- Dependencies:
--   - Requires: profiles table (from Phase 6)
--   - Requires: cases table (from Phase 4)
-- Auth Integration: Uses created_by/updated_by fields for user tracking
-- =====================================================

-- Drop table if exists (for development only - comment out for production)
-- DROP TABLE IF EXISTS payment_tracking CASCADE;

-- Create payment_tracking table
CREATE TABLE IF NOT EXISTS payment_tracking (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,

  -- Vehicle information (מספר רכב - Vehicle plate)
  plate TEXT NOT NULL,

  -- Vehicle details (תוצרת - Manufacturer)
  manufacturer TEXT,

  -- שנת יצור - Year of manufacture
  year_of_manufacture INT,

  -- בעלים - Owner name
  owner_name TEXT,

  -- טלפון - Phone number
  phone TEXT,

  -- Damage information (תאריך נזק - Damage date)
  damage_date DATE,

  -- סוג נזק - Damage type
  damage_type TEXT,

  -- סוכן - Agent/Insurance agent
  agent TEXT,

  -- Financial information (סה"כ שכ"ט - Total fee)
  total_fee NUMERIC(10,2),

  -- תאריך שידור - Broadcast/submission date
  broadcast_date DATE,

  -- מוסך - Garage name
  garage TEXT,

  -- מטפל בתביעה - Claim handler
  claim_handler TEXT,

  -- צפי תשלום - Expected payment date
  expected_payment_date DATE,

  -- סטטוס תשלום - Payment status
  payment_status TEXT DEFAULT 'ממתין לתשלום' CHECK (
    payment_status IN (
      'ממתין לתשלום',  -- pending
      'שולם חלקית',    -- partial
      'שולם במלואו',    -- paid
      'באיחור'          -- overdue
    )
  ),

  -- הערות - Notes
  notes TEXT,

  -- User tracking (Phase 6 auth integration)
  created_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Indexes for performance
-- =====================================================

-- Index on plate for fast lookups
CREATE INDEX IF NOT EXISTS idx_payment_tracking_plate
ON payment_tracking(plate);

-- Index on case_id for joins with cases table
CREATE INDEX IF NOT EXISTS idx_payment_tracking_case_id
ON payment_tracking(case_id);

-- Index on payment_status for filtering
CREATE INDEX IF NOT EXISTS idx_payment_tracking_status
ON payment_tracking(payment_status);

-- Index on expected_payment_date for overdue detection
CREATE INDEX IF NOT EXISTS idx_payment_tracking_expected_date
ON payment_tracking(expected_payment_date);

-- Composite index for common queries (plate + status)
CREATE INDEX IF NOT EXISTS idx_payment_tracking_plate_status
ON payment_tracking(plate, payment_status);

-- Index on created_by for user activity tracking
CREATE INDEX IF NOT EXISTS idx_payment_tracking_created_by
ON payment_tracking(created_by);

-- =====================================================
-- Trigger: Auto-update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_payment_tracking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payment_tracking_updated_at
  BEFORE UPDATE ON payment_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_tracking_timestamp();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE payment_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view payment tracking
-- (Organizations can be filtered in application layer if needed)
CREATE POLICY "payment_tracking_select_policy"
ON payment_tracking
FOR SELECT
TO authenticated
USING (true);

-- Policy: Authenticated users can insert payment records
CREATE POLICY "payment_tracking_insert_policy"
ON payment_tracking
FOR INSERT
TO authenticated
WITH CHECK (
  -- User must be authenticated
  auth.uid() IS NOT NULL
);

-- Policy: Users can update payment records
-- (In future, can restrict to created_by or org_id)
CREATE POLICY "payment_tracking_update_policy"
ON payment_tracking
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Only admins and developers can delete payment records
CREATE POLICY "payment_tracking_delete_policy"
ON payment_tracking
FOR DELETE
TO authenticated
USING (
  -- Check if user has admin or developer role
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'developer')
  )
);

-- =====================================================
-- Helper function: Get overdue payments
-- =====================================================

CREATE OR REPLACE FUNCTION get_overdue_payments()
RETURNS TABLE (
  id UUID,
  plate TEXT,
  owner_name TEXT,
  total_fee NUMERIC,
  expected_payment_date DATE,
  days_overdue INT,
  payment_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pt.id,
    pt.plate,
    pt.owner_name,
    pt.total_fee,
    pt.expected_payment_date,
    (CURRENT_DATE - pt.expected_payment_date)::INT as days_overdue,
    pt.payment_status
  FROM payment_tracking pt
  WHERE pt.expected_payment_date < CURRENT_DATE
    AND pt.payment_status IN ('ממתין לתשלום', 'שולם חלקית')
  ORDER BY pt.expected_payment_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Helper function: Update payment status to overdue
-- =====================================================

CREATE OR REPLACE FUNCTION update_overdue_payment_status()
RETURNS INT AS $$
DECLARE
  updated_count INT;
BEGIN
  UPDATE payment_tracking
  SET
    payment_status = 'באיחור',
    updated_at = now()
  WHERE expected_payment_date < CURRENT_DATE
    AND payment_status IN ('ממתין לתשלום', 'שולם חלקית');

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE payment_tracking IS 'Fee tracking and payment management for cases (Phase 9)';
COMMENT ON COLUMN payment_tracking.plate IS 'מספר רכב - Vehicle license plate number';
COMMENT ON COLUMN payment_tracking.manufacturer IS 'תוצרת - Vehicle manufacturer';
COMMENT ON COLUMN payment_tracking.year_of_manufacture IS 'שנת יצור - Year of manufacture';
COMMENT ON COLUMN payment_tracking.owner_name IS 'בעלים - Owner name';
COMMENT ON COLUMN payment_tracking.phone IS 'טלפון - Phone number';
COMMENT ON COLUMN payment_tracking.damage_date IS 'תאריך נזק - Date of damage';
COMMENT ON COLUMN payment_tracking.damage_type IS 'סוג נזק - Type of damage';
COMMENT ON COLUMN payment_tracking.agent IS 'סוכן - Insurance agent';
COMMENT ON COLUMN payment_tracking.total_fee IS 'סה"כ שכ"ט - Total professional fee';
COMMENT ON COLUMN payment_tracking.broadcast_date IS 'תאריך שידור - Broadcast/submission date';
COMMENT ON COLUMN payment_tracking.garage IS 'מוסך - Garage name';
COMMENT ON COLUMN payment_tracking.claim_handler IS 'מטפל בתביעה - Claim handler name';
COMMENT ON COLUMN payment_tracking.expected_payment_date IS 'צפי תשלום - Expected payment date';
COMMENT ON COLUMN payment_tracking.payment_status IS 'סטטוס תשלום - Payment status (ממתין/שולם חלקית/שולם במלואו/באיחור)';
COMMENT ON COLUMN payment_tracking.notes IS 'הערות - Additional notes';

-- =====================================================
-- Grant permissions
-- =====================================================

-- Grant usage to authenticated users
GRANT SELECT, INSERT, UPDATE ON payment_tracking TO authenticated;
GRANT DELETE ON payment_tracking TO authenticated; -- RLS policy will restrict

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_overdue_payments() TO authenticated;
GRANT EXECUTE ON FUNCTION update_overdue_payment_status() TO authenticated;

-- =====================================================
-- Verification queries
-- =====================================================

-- Uncomment to verify table creation
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'payment_tracking'
-- ORDER BY ordinal_position;

-- Uncomment to verify indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'payment_tracking';

-- Uncomment to verify RLS policies
-- SELECT policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'payment_tracking';

-- =====================================================
-- END OF SCRIPT
-- =====================================================
