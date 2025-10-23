-- Phase 5a Invoice Integration: Enable Realtime Subscriptions
-- Session 74 - Task 1.6
-- Date: 2025-10-23
-- Purpose: Enable real-time updates for invoice tables

-- ============================================================================
-- ENABLE REALTIME FOR INVOICE TABLES
-- ============================================================================

-- Note: Tables invoices and invoice_lines already added to realtime in initial schema
-- This file adds the new tables created in Phase 5a

-- Enable realtime for invoice_documents table
ALTER PUBLICATION supabase_realtime ADD TABLE invoice_documents;

-- Enable realtime for invoice_suppliers table
ALTER PUBLICATION supabase_realtime ADD TABLE invoice_suppliers;

-- Enable realtime for invoice_validations table
ALTER PUBLICATION supabase_realtime ADD TABLE invoice_validations;

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
