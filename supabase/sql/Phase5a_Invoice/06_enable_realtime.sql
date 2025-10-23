-- Phase 5a Invoice Integration: Enable Realtime Subscriptions
-- Session 74 - Task 1.6
-- Date: 2025-10-23
-- Purpose: Enable real-time updates for invoice tables

-- ============================================================================
-- ENABLE REALTIME FOR INVOICE TABLES
-- ============================================================================

-- Note: Tables invoices and invoice_lines already added to realtime in initial schema
-- This file adds the new tables created in Phase 5a

-- Enable realtime for invoice_documents table (conditionally)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'invoice_documents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE invoice_documents;
  END IF;
END $$;

-- Enable realtime for invoice_suppliers table (conditionally)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'invoice_suppliers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE invoice_suppliers;
  END IF;
END $$;

-- Enable realtime for invoice_validations table (conditionally)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'invoice_validations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE invoice_validations;
  END IF;
END $$;

-- NOTE: invoice_damage_center_mappings is added to realtime in file 07
-- (after the table is created)

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Check which tables are in realtime publication
-- SELECT schemaname, tablename 
-- FROM pg_publication_tables 
-- WHERE pubname = 'supabase_realtime'
-- AND tablename LIKE 'invoice%'
-- ORDER BY tablename;

-- ============================================================================
-- NOTES
-- ============================================================================

-- This file enables realtime for 3 tables:
-- 1. invoice_documents (already added by file 02, skip if exists)
-- 2. invoice_suppliers (new in this file)
-- 3. invoice_validations (new in this file)
--
-- invoice_damage_center_mappings is added by file 07 (after table creation)
--
-- Realtime enables:
-- 1. Live updates when invoices change
-- 2. Multi-user collaboration notifications
-- 3. Real-time validation status updates
-- 4. Instant supplier cache updates
-- 5. Live approval workflow notifications
--
-- JavaScript subscription example:
-- 
-- const subscription = supabase
--   .channel('invoice-changes')
--   .on('postgres_changes', 
--     { event: '*', schema: 'public', table: 'invoices' }, 
--     (payload) => {
--       console.log('Invoice changed:', payload);
--       // Update UI with new data
--     }
--   )
--   .subscribe();
