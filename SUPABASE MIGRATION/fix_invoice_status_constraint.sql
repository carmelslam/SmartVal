-- Fix Invoice Status Constraint
-- Session 90 - Fix status flow to use proper status names
-- Date: 2025-11-02

-- Problem: Current constraint only allows ('DRAFT', 'SENT', 'PAID', 'CANCELLED')
-- Solution: Update to allow proper workflow statuses ('PENDING', 'ASSIGNED', 'ACCEPTED')

-- Remove existing constraint
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_status_check;

-- Add updated constraint with correct status values
ALTER TABLE public.invoices ADD CONSTRAINT invoices_status_check 
CHECK (status IN ('DRAFT', 'PENDING', 'ASSIGNED', 'ACCEPTED', 'SENT', 'PAID', 'CANCELLED'));

-- Verify constraint was updated
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.invoices'::regclass 
AND conname = 'invoices_status_check';

-- Add comment explaining the status flow
COMMENT ON CONSTRAINT invoices_status_check ON public.invoices IS 
'Invoice workflow statuses: PENDING (ready for assignment) → ASSIGNED (mapped to damage centers) → ACCEPTED (applied to final report). Legacy statuses: DRAFT, SENT, PAID, CANCELLED.';