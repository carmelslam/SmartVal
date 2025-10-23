-- Phase 5a Invoice Integration: Deployment Verification
-- Session 74
-- Date: 2025-10-23
-- Purpose: Verify all 8 SQL files deployed successfully

-- ============================================================================
-- 1. VERIFY TABLES CREATED
-- ============================================================================

SELECT 
  'Tables Check' as test_name,
  COUNT(*) as expected_count,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN (
     'invoices', 'invoice_lines', 'invoice_documents', 
     'invoice_suppliers', 'invoice_validations', 
     'invoice_damage_center_mappings'
   )
  ) as actual_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN (
            'invoices', 'invoice_lines', 'invoice_documents', 
            'invoice_suppliers', 'invoice_validations', 
            'invoice_damage_center_mappings'
          )
         ) = 6 
    THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as status
FROM (SELECT 6 as expected_count) t;

-- List all invoice tables
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name LIKE 'invoice%'
ORDER BY table_name;

-- ============================================================================
-- 2. VERIFY USER TRACKING COLUMNS ADDED (File 01)
-- ============================================================================

SELECT 
  'User Tracking - invoices' as test_name,
  4 as expected_columns,
  COUNT(*) as actual_columns,
  CASE WHEN COUNT(*) = 4 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.columns 
WHERE table_name = 'invoices' 
AND column_name IN ('created_by', 'updated_by', 'created_at', 'updated_at');

SELECT 
  'User Tracking - invoice_lines' as test_name,
  4 as expected_columns,
  COUNT(*) as actual_columns,
  CASE WHEN COUNT(*) = 4 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.columns 
WHERE table_name = 'invoice_lines' 
AND column_name IN ('created_by', 'updated_by', 'created_at', 'updated_at');

-- ============================================================================
-- 3. VERIFY OCR COLUMNS IN invoice_documents (File 02)
-- ============================================================================

SELECT 
  'OCR Columns' as test_name,
  5 as expected_columns,
  COUNT(*) as actual_columns,
  CASE WHEN COUNT(*) = 5 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.columns 
WHERE table_name = 'invoice_documents' 
AND column_name IN ('ocr_status', 'ocr_raw_text', 'ocr_structured_data', 'ocr_confidence', 'language_detected');

-- ============================================================================
-- 4. VERIFY ITEM CATEGORY COLUMNS (File 08)
-- ============================================================================

SELECT 
  'Item Category Columns' as test_name,
  4 as expected_columns,
  COUNT(*) as actual_columns,
  CASE WHEN COUNT(*) = 4 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.columns 
WHERE table_name = 'invoice_lines' 
AND column_name IN ('item_category', 'category_confidence', 'category_method', 'category_suggestions');

-- ============================================================================
-- 5. VERIFY INDEXES CREATED
-- ============================================================================

SELECT 
  'Indexes Created' as test_name,
  COUNT(*) as index_count,
  CASE WHEN COUNT(*) >= 30 THEN '✅ PASS' ELSE '⚠️ WARNING' END as status
FROM pg_indexes 
WHERE tablename LIKE 'invoice%'
AND schemaname = 'public';

-- List key indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE tablename LIKE 'invoice%'
AND schemaname = 'public'
ORDER BY tablename, indexname
LIMIT 20;

-- ============================================================================
-- 6. VERIFY RLS POLICIES CREATED
-- ============================================================================

SELECT 
  'RLS Policies Created' as test_name,
  COUNT(*) as policy_count,
  CASE WHEN COUNT(*) >= 20 THEN '✅ PASS' ELSE '⚠️ WARNING' END as status
FROM pg_policies 
WHERE tablename LIKE 'invoice%';

-- List RLS policies by table
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename LIKE 'invoice%'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- 7. VERIFY REALTIME ENABLED (File 06)
-- ============================================================================

SELECT 
  'Realtime Tables' as test_name,
  6 as expected_tables,
  COUNT(*) as actual_tables,
  CASE WHEN COUNT(*) >= 4 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename LIKE 'invoice%';

-- List realtime-enabled invoice tables
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename LIKE 'invoice%'
ORDER BY tablename;

-- ============================================================================
-- 8. VERIFY FUNCTIONS CREATED
-- ============================================================================

SELECT 
  'Functions Created' as test_name,
  COUNT(*) as function_count,
  CASE WHEN COUNT(*) >= 12 THEN '✅ PASS' ELSE '⚠️ WARNING' END as status
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND (
  routine_name LIKE '%invoice%' OR 
  routine_name LIKE '%supplier%' OR
  routine_name LIKE '%categor%' OR
  routine_name = 'update_updated_at'
);

-- List invoice-related functions
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND (
  routine_name LIKE '%invoice%' OR 
  routine_name LIKE '%supplier%' OR
  routine_name LIKE '%categor%'
)
ORDER BY routine_name;

-- ============================================================================
-- 9. VERIFY TRIGGERS CREATED
-- ============================================================================

SELECT 
  'Triggers Created' as test_name,
  COUNT(*) as trigger_count,
  CASE WHEN COUNT(*) >= 5 THEN '✅ PASS' ELSE '⚠️ WARNING' END as status
FROM information_schema.triggers 
WHERE event_object_table LIKE 'invoice%';

-- List invoice triggers
SELECT event_object_table, trigger_name, action_timing, event_manipulation
FROM information_schema.triggers 
WHERE event_object_table LIKE 'invoice%'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 10. TEST AUTO-CATEGORIZATION FUNCTION (File 08)
-- ============================================================================

SELECT 
  'Auto-Categorization Test' as test_name,
  'Testing keyword matching' as description;

-- Test part keywords
SELECT 'Part Test' as test, * FROM auto_categorize_invoice_line('דלת אחורית ימין');

-- Test work keywords
SELECT 'Work Test' as test, * FROM auto_categorize_invoice_line('צביעה מלאה');

-- Test repair keywords
SELECT 'Repair Test' as test, * FROM auto_categorize_invoice_line('תיקון פח');

-- ============================================================================
-- 11. DEPLOYMENT SUMMARY
-- ============================================================================

SELECT 
  '🎉 DEPLOYMENT SUMMARY' as title,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'invoice%') as total_tables,
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename LIKE 'invoice%') as total_indexes,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename LIKE 'invoice%') as total_rls_policies,
  (SELECT COUNT(*) FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename LIKE 'invoice%') as realtime_tables,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND (routine_name LIKE '%invoice%' OR routine_name LIKE '%supplier%' OR routine_name LIKE '%categor%')) as total_functions,
  (SELECT COUNT(*) FROM information_schema.triggers WHERE event_object_table LIKE 'invoice%') as total_triggers;

-- ============================================================================
-- EXPECTED RESULTS
-- ============================================================================

/*
EXPECTED COUNTS:
- Tables: 6 (invoices, invoice_lines, invoice_documents, invoice_suppliers, invoice_validations, invoice_damage_center_mappings)
- Indexes: ~40
- RLS Policies: ~20-25
- Realtime Tables: 4-6
- Functions: ~12-15
- Triggers: ~5-6

If all tests show ✅ PASS, Phase 5a database deployment is SUCCESSFUL!
*/
