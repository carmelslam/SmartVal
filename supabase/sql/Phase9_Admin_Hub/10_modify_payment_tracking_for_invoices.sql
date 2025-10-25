-- =====================================================
-- Phase 9: Admin Hub Enhancement
-- Script 10: Modify Payment Tracking for Fee Invoice Management
-- Date: 2025-10-25
-- Session: 78
-- =====================================================
--
-- Purpose: Add last contact tracking and fee invoice date to payment_tracking
-- Changes:
--   - Remove agent column (replaced with last_contacted fields)
--   - Add last_contacted_by (user reference)
--   - Add last_contacted_at (timestamp)
--   - Add last_contact_notes (optional notes)
--   - Add fee_invoice_date (date from invoice)
-- =====================================================

-- =====================================================
-- Step 1: Add new columns
-- =====================================================

-- Add last contact tracking columns
ALTER TABLE payment_tracking
  ADD COLUMN IF NOT EXISTS last_contacted_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_contact_notes TEXT,
  ADD COLUMN IF NOT EXISTS fee_invoice_date DATE;

-- =====================================================
-- Step 2: Remove old agent column (if you're sure you don't need it)
-- =====================================================

-- IMPORTANT: Only run this if you're 100% sure agent data is not needed
-- Comment this out if you want to keep the agent column
-- ALTER TABLE payment_tracking DROP COLUMN IF EXISTS agent;

-- =====================================================
-- Step 3: Create indexes for performance
-- =====================================================

-- Index on last_contacted_by for user activity queries
CREATE INDEX IF NOT EXISTS idx_payment_tracking_last_contacted_by
ON payment_tracking(last_contacted_by);

-- Index on last_contacted_at for recent contact queries
CREATE INDEX IF NOT EXISTS idx_payment_tracking_last_contacted_at
ON payment_tracking(last_contacted_at DESC);

-- Index on fee_invoice_date for invoice date queries
CREATE INDEX IF NOT EXISTS idx_payment_tracking_fee_invoice_date
ON payment_tracking(fee_invoice_date);

-- =====================================================
-- Step 4: Create helper function to update last contact
-- =====================================================

CREATE OR REPLACE FUNCTION update_payment_last_contact(
  p_payment_id UUID,
  p_user_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Update payment tracking with last contact info
  UPDATE payment_tracking
  SET
    last_contacted_by = p_user_id,
    last_contacted_at = now(),
    last_contact_notes = p_notes,
    updated_at = now()
  WHERE id = p_payment_id;

  -- Return updated record
  SELECT jsonb_build_object(
    'id', id,
    'plate', plate,
    'last_contacted_by', last_contacted_by,
    'last_contacted_at', last_contacted_at,
    'last_contact_notes', last_contact_notes
  ) INTO result
  FROM payment_tracking
  WHERE id = p_payment_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Step 5: Create helper function to set fee invoice date
-- =====================================================

CREATE OR REPLACE FUNCTION set_fee_invoice_date(
  p_payment_id UUID,
  p_invoice_date DATE
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Update payment tracking with fee invoice date
  UPDATE payment_tracking
  SET
    fee_invoice_date = p_invoice_date,
    updated_at = now()
  WHERE id = p_payment_id;

  -- Return updated record
  SELECT jsonb_build_object(
    'id', id,
    'plate', plate,
    'fee_invoice_date', fee_invoice_date
  ) INTO result
  FROM payment_tracking
  WHERE id = p_payment_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Step 6: Comments for documentation
-- =====================================================

COMMENT ON COLUMN payment_tracking.last_contacted_by IS 'User who last contacted about this payment';
COMMENT ON COLUMN payment_tracking.last_contacted_at IS 'Timestamp of last contact';
COMMENT ON COLUMN payment_tracking.last_contact_notes IS 'Optional notes from last contact';
COMMENT ON COLUMN payment_tracking.fee_invoice_date IS 'Date from uploaded fee invoice (auto or manual)';

COMMENT ON FUNCTION update_payment_last_contact(UUID, UUID, TEXT) IS 'Update last contact info for a payment';
COMMENT ON FUNCTION set_fee_invoice_date(UUID, DATE) IS 'Set fee invoice date for a payment';

-- =====================================================
-- Step 7: Grant permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION update_payment_last_contact(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION set_fee_invoice_date(UUID, DATE) TO authenticated;

-- =====================================================
-- END OF SCRIPT
-- =====================================================
