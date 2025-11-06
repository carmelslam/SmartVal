-- Fix validation function that references old issue_date field
-- The function validate_invoice is trying to access v_invoice.issue_date which no longer exists

-- First, let's see the current validation function
SELECT 
  'CURRENT FUNCTION' as section,
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'validate_invoice';

-- Check what triggers are calling this function
SELECT 
  'TRIGGERS USING FUNCTION' as section,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE action_statement LIKE '%validate_invoice%';

-- We need to update the function to use invoice_date instead of issue_date
-- This will be done after we see the current function definition