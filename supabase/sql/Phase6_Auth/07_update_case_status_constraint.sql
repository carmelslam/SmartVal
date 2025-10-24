-- SESSION: Add Hebrew case status options
-- Date: 2025-10-24
-- Purpose: Expand case status options to include Hebrew claim statuses

-- Drop the existing CHECK constraint on cases.status
ALTER TABLE cases
DROP CONSTRAINT IF EXISTS cases_status_check;

-- Add new CHECK constraint with expanded status options
-- Keeping original English statuses AND adding new Hebrew statuses
ALTER TABLE cases
ADD CONSTRAINT cases_status_check
CHECK (status IN (
  -- Original English statuses
  'OPEN',
  'IN_PROGRESS',
  'CLOSED',
  'ARCHIVED',
  -- New Hebrew claim statuses
  'מחכה לאישור תביעה',  -- Waiting for claim approval
  'מחכה לתשלום',        -- Waiting for payment
  'שולם',               -- Paid
  'תביעה אושרה',        -- Claim approved
  'בתביעת בית משפט',    -- In court claim
  'אחר'                 -- Other
));

-- Verify constraint was created
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'cases'::regclass
  AND conname = 'cases_status_check';
