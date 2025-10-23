# Phase 5a: Invoice Management Integration - SQL Migrations

**Session:** 74  
**Date:** 2025-10-23  
**Purpose:** Database schema for complete invoice management system

---

## 📋 MIGRATION FILES

### File Order (Execute in this sequence):

1. **01_add_user_tracking_to_invoices.sql** ✅
   - Adds `created_by`, `updated_by`, `updated_at` to `invoices` table
   - Adds `created_by`, `updated_by`, `created_at`, `updated_at` to `invoice_lines` table
   - Creates triggers for automatic `updated_at` timestamp
   - Creates indexes for user tracking
   - **Depends on:** Existing `invoices` and `invoice_lines` tables (Phase 1)

2. **02_create_invoice_documents_table.sql** ✅
   - Creates `invoice_documents` table for uploaded files
   - Stores file metadata and OCR processing results
   - Links documents to invoices and cases
   - Creates indexes for fast lookups
   - Sets up RLS policies for case-based access
   - Enables Realtime subscriptions
   - **Depends on:** `invoices`, `cases`, `profiles` tables

3. **03_create_invoice_suppliers_table.sql** ✅
   - Creates `invoice_suppliers` table for supplier cache
   - Stores supplier contact and business information
   - Auto-calculates statistics (total invoices, amounts)
   - Enables fuzzy search with trigram extension
   - Creates helper functions for search and auto-creation
   - Creates trigger to auto-update stats when invoices change
   - **Depends on:** `invoices`, `profiles` tables, `pg_trgm` extension

4. **04_create_invoice_validations_table.sql** ✅
   - Creates `invoice_validations` table for approval workflow
   - Stores validation results and approval status
   - Implements 6 validation rules
   - Creates validation functions
   - Creates trigger to auto-validate on invoice changes
   - **Depends on:** `invoices`, `invoice_lines`, `profiles` tables

5. **05_create_indexes_and_rls.sql** ✅
   - Creates additional performance indexes
   - Creates JSONB GIN indexes for metadata fields
   - Creates full-text search indexes with trigram
   - Updates RLS policies for all invoice tables
   - Creates `invoice_details` view
   - Creates statistics helper functions
   - **Depends on:** All previous migrations

6. **06_enable_realtime.sql** ✅
   - Enables Realtime subscriptions for new tables
   - Adds `invoice_documents`, `invoice_suppliers`, `invoice_validations` to realtime publication
   - **Depends on:** All previous migrations

---

## 🗃️ TABLES CREATED

### New Tables (Phase 5a):

1. **invoice_documents** - Uploaded invoice files and OCR results
2. **invoice_suppliers** - Supplier cache for auto-complete
3. **invoice_validations** - Validation and approval workflow

### Modified Tables (Phase 5a):

1. **invoices** - Added user tracking fields
2. **invoice_lines** - Added user tracking fields

### Existing Tables (from Phase 1):

1. **invoices** - Main invoice records
2. **invoice_lines** - Invoice line items

---

## 🚀 DEPLOYMENT INSTRUCTIONS

### Prerequisites:

1. ✅ Supabase project set up
2. ✅ Phase 1 migrations applied (initial schema)
3. ✅ Phase 6 migrations applied (authentication)
4. ✅ `pg_trgm` extension enabled (for fuzzy search)

### Step 1: Check Prerequisites

```sql
-- Check if required tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('invoices', 'invoice_lines', 'cases', 'profiles')
AND table_schema = 'public';

-- Should return all 4 tables

-- Check if pg_trgm extension exists
SELECT * FROM pg_extension WHERE extname = 'pg_trgm';

-- If not exists, run:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### Step 2: Execute Migrations

```bash
# Navigate to Phase5a_Invoice folder
cd supabase/sql/Phase5a_Invoice

# Execute each file in order using Supabase SQL Editor or psql
# Copy and paste contents of each file into Supabase dashboard SQL editor
# Or use psql:
psql -h your-project.supabase.co -U postgres -d postgres -f 01_add_user_tracking_to_invoices.sql
psql -h your-project.supabase.co -U postgres -d postgres -f 02_create_invoice_documents_table.sql
psql -h your-project.supabase.co -U postgres -d postgres -f 03_create_invoice_suppliers_table.sql
psql -h your-project.supabase.co -U postgres -d postgres -f 04_create_invoice_validations_table.sql
psql -h your-project.supabase.co -U postgres -d postgres -f 05_create_indexes_and_rls.sql
psql -h your-project.supabase.co -U postgres -d postgres -f 06_enable_realtime.sql
```

### Step 3: Verify Deployment

```sql
-- 1. Check all tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'invoice%'
AND table_schema = 'public'
ORDER BY table_name;

-- Expected: invoices, invoice_lines, invoice_documents, invoice_suppliers, invoice_validations

-- 2. Check user tracking columns added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'invoices' 
AND column_name IN ('created_by', 'updated_by', 'updated_at');

-- Expected: 3 rows

-- 3. Check indexes created
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE tablename LIKE 'invoice%'
AND schemaname = 'public'
ORDER BY tablename, indexname;

-- Expected: ~30 indexes

-- 4. Check RLS policies
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename LIKE 'invoice%'
ORDER BY tablename, policyname;

-- Expected: ~20 policies

-- 5. Check Realtime enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename LIKE 'invoice%'
ORDER BY tablename;

-- Expected: 5 tables (invoices, invoice_lines, invoice_documents, invoice_suppliers, invoice_validations)

-- 6. Check helper functions created
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%invoice%' 
OR routine_name LIKE '%supplier%'
AND routine_schema = 'public'
ORDER BY routine_name;

-- Expected: Functions like validate_invoice, search_suppliers, etc.

-- 7. Check triggers created
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table LIKE 'invoice%'
ORDER BY event_object_table, trigger_name;

-- Expected: Triggers for updated_at, auto-validation, supplier stats
```

### Step 4: Test Basic Operations

```sql
-- Test 1: Insert test invoice (will trigger auto-validation)
INSERT INTO invoices (
  plate, 
  invoice_number, 
  supplier_name, 
  issue_date, 
  total_amount,
  created_by
) VALUES (
  '12345678',
  'INV-001',
  'Test Supplier',
  CURRENT_DATE,
  1000.00,
  (SELECT user_id FROM profiles LIMIT 1)
)
RETURNING id;

-- Test 2: Check validation was auto-created
SELECT * FROM invoice_validations 
WHERE invoice_id = (SELECT id FROM invoices WHERE invoice_number = 'INV-001');

-- Test 3: Check supplier was auto-created
SELECT * FROM invoice_suppliers WHERE name = 'Test Supplier';

-- Test 4: Test fuzzy search
SELECT * FROM search_suppliers('Test', 5);

-- Test 5: Test invoice details view
SELECT * FROM invoice_details WHERE invoice_number = 'INV-001';

-- Clean up test data
DELETE FROM invoices WHERE invoice_number = 'INV-001';
```

---

## 📊 SCHEMA OVERVIEW

### Table Relationships:

```
cases (1) ─────────┬─── (many) invoices (1) ───┬─── (many) invoice_lines
                   │                            │
                   │                            ├─── (many) invoice_documents
                   │                            │
                   │                            └─── (1) invoice_validations
                   │
                   └─── (many) invoice_documents

profiles (1) ──────┬─── (many) invoices.created_by
                   │
                   ├─── (many) invoices.updated_by
                   │
                   ├─── (many) invoice_documents.uploaded_by
                   │
                   └─── (many) invoice_validations.reviewed_by

invoice_suppliers ─────── (name match) ─────── invoices.supplier_name

parts_required ────────── (optional link) ────── invoice_lines.part_id
```

### Key Features:

1. **User Tracking** - All operations tracked with created_by/updated_by
2. **Case Ownership** - RLS policies enforce case-based access control
3. **Auto-Validation** - Invoices validated automatically on insert/update
4. **Supplier Cache** - Auto-populated from invoice data
5. **Fuzzy Search** - Trigram-based search for typo tolerance
6. **Real-time Updates** - All tables support live subscriptions
7. **Approval Workflow** - Track validation, review, and approval status
8. **File Storage** - Link to Supabase Storage for invoice PDFs

---

## 🔍 COMMON QUERIES

### Get all invoices for a case:

```sql
SELECT * FROM invoice_details 
WHERE case_id = 'your-case-id'
ORDER BY issue_date DESC;
```

### Search invoices by supplier:

```sql
SELECT * FROM invoice_details 
WHERE supplier_name ILIKE '%מוסך%'
ORDER BY issue_date DESC;
```

### Get invoices needing review:

```sql
SELECT * FROM invoice_details 
WHERE approval_status = 'needs_review'
ORDER BY created_at DESC;
```

### Get supplier statistics:

```sql
SELECT * FROM invoice_suppliers 
WHERE total_invoices > 0
ORDER BY total_amount DESC;
```

### Validate specific invoice:

```sql
SELECT validate_invoice('your-invoice-id');
```

---

## 🐛 TROUBLESHOOTING

### Issue: pg_trgm extension not found

```sql
-- Solution: Enable extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### Issue: RLS policies blocking queries

```sql
-- Check current user
SELECT auth.uid(), auth.role();

-- Temporarily disable RLS for testing (NOT for production)
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;

-- Re-enable when done testing
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
```

### Issue: Validation function errors

```sql
-- Check function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'validate_invoice';

-- Test with sample data
SELECT validate_invoice((SELECT id FROM invoices LIMIT 1));
```

### Issue: Realtime not working

```sql
-- Check tables in publication
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename LIKE 'invoice%';

-- If missing, add manually
ALTER PUBLICATION supabase_realtime ADD TABLE invoice_documents;
```

---

## 📝 NOTES

- **Execution Time:** ~1-2 minutes for all migrations
- **Backwards Compatible:** Yes - adds new tables, doesn't modify existing schema
- **Rollback:** Can drop new tables safely without affecting existing data
- **Dependencies:** Requires Phase 1 (foundation) and Phase 6 (auth) to be complete

---

## 🔗 RELATED DOCUMENTATION

- **SESSION_74_PHASE5A_INVOICE_INTEGRATION.md** - Complete implementation plan
- **SUPABASE_MIGRATION_PROJECT.md** - Overall migration strategy
- **Phase6_Auth/README.md** - Authentication system documentation

---

**Created:** 2025-10-23  
**Last Updated:** 2025-10-23  
**Status:** Ready for deployment
