-- ============================================================================
-- REMOVE ALL REVERSAL LOGIC - Session 6
-- Date: 2025-10-05
-- Purpose: Python import is NOW FIXED - data is correct. All reversal logic
--          is BREAKING correct Hebrew. This script removes ALL reversal.
-- ============================================================================

-- Step 1: DROP ALL REVERSAL TRIGGERS
-- These are reversing CORRECT Hebrew from fixed Python import

DROP TRIGGER IF EXISTS hebrew_reversal_trigger ON catalog_items;
DROP TRIGGER IF EXISTS trigger_00_auto_fix_hebrew_reversal ON catalog_items;
DROP TRIGGER IF EXISTS trigger_auto_fix_and_extract ON catalog_items;

-- Step 2: DROP ALL REVERSAL FUNCTIONS
-- These contain reverse() logic that breaks correct data

DROP FUNCTION IF EXISTS auto_fix_hebrew_reversal() CASCADE;
DROP FUNCTION IF EXISTS process_hebrew_before_insert() CASCADE;
DROP FUNCTION IF EXISTS reverse_hebrew(text) CASCADE;
DROP FUNCTION IF EXISTS reverse_hebrew_smart(text) CASCADE;
DROP FUNCTION IF EXISTS reverse_hebrew_text(text) CASCADE;
DROP FUNCTION IF EXISTS fix_hebrew_text(text) CASCADE;
DROP FUNCTION IF EXISTS is_full_string_reversed(text) CASCADE;
DROP FUNCTION IF EXISTS reverse_full_string(text) CASCADE;

-- Step 3: DROP OLD auto_fix_and_extract (contains reversal + old families)
DROP FUNCTION IF EXISTS auto_fix_and_extract() CASCADE;

-- Step 4: KEEP these safe functions (NO reversal logic)
-- ✅ trigger_01_set_supplier_name → calls _set_supplier_name() [SAFE]
-- ✅ trigger_extract_model_and_year → calls extract_model_and_year() [SAFE]
-- ✅ auto_extract_catalog_data() [SAFE but has OLD families - will replace]

-- Verification
SELECT 
    'CLEANUP COMPLETE' as status,
    'Removed all reversal triggers and functions' as action;

-- Check remaining triggers
SELECT 
    'REMAINING TRIGGERS' as type,
    tgname as trigger_name,
    pg_get_functiondef(tgfoid) as function_used
FROM pg_trigger
WHERE tgrelid = 'catalog_items'::regclass
  AND tgname NOT LIKE 'RI_Constraint%'
ORDER BY tgname;
