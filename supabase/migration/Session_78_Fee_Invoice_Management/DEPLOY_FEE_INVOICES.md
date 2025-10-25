# Fee Invoice Management - Deployment Guide

## 📋 Overview
Complete deployment checklist for Fee Invoice Management system integration with Payment Tracking.

**Components**:
- Database tables (payment_tracking modifications + fee_invoices table)
- Supabase Storage bucket (fee-invoices)
- Service layer methods (admin-supabase-service.js)
- UI components (admin.html - Payment Tracking section)

---

## ✅ Deployment Checklist

### Phase 1: Database Layer (SQL Scripts)

#### Step 1.1: Modify Payment Tracking Table
**File**: `supabase/sql/Phase9_Admin_Hub/10_modify_payment_tracking_for_invoices.sql`

1. Go to Supabase Dashboard → SQL Editor
2. Click **"New Query"**
3. Copy entire contents of `10_modify_payment_tracking_for_invoices.sql`
4. Paste into SQL Editor
5. Click **"Run"**
6. Verify:
   ```sql
   -- Check new columns exist
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'payment_tracking'
   AND column_name IN ('last_contacted_by', 'last_contacted_at', 'last_contact_notes', 'fee_invoice_date');

   -- Should return 4 rows
   ```

**What this does**:
- ✅ Adds `last_contacted_by` (user reference)
- ✅ Adds `last_contacted_at` (timestamp)
- ✅ Adds `last_contact_notes` (optional notes)
- ✅ Adds `fee_invoice_date` (date from invoice)
- ✅ Creates helper function `update_payment_last_contact()`
- ✅ Creates helper function `set_fee_invoice_date()`

---

#### Step 1.2: Create Fee Invoices Table
**File**: `supabase/sql/Phase9_Admin_Hub/11_create_fee_invoices_table.sql`

1. Go to Supabase Dashboard → SQL Editor
2. Click **"New Query"**
3. Copy entire contents of `11_create_fee_invoices_table.sql`
4. Paste into SQL Editor
5. Click **"Run"**
6. Verify:
   ```sql
   -- Check table exists
   SELECT table_name FROM information_schema.tables WHERE table_name = 'fee_invoices';

   -- Check helper functions exist
   SELECT proname FROM pg_proc WHERE proname IN ('get_fee_invoices', 'get_invoice_counts', 'delete_fee_invoice');

   -- Should return 3 function names
   ```

**What this does**:
- ✅ Creates `fee_invoices` table with full schema
- ✅ Supports 3 invoice types: initial, supplementary, final
- ✅ Includes OCR metadata fields
- ✅ Auto-sync trigger to update payment_tracking.fee_invoice_date
- ✅ RLS policies (admin/assistant/developer/assessor permissions)
- ✅ Helper functions: get_fee_invoices(), get_invoice_counts(), delete_fee_invoice()

---

### Phase 2: Storage Layer (Supabase Storage)

#### Step 2.1: Create Storage Bucket
**Reference**: `supabase/SETUP_FEE_INVOICES_STORAGE.md`

1. Go to Supabase Dashboard → **Storage**
2. Click **"New Bucket"**
3. Configure:
   - **Name**: `fee-invoices`
   - **Public**: ❌ **NO** (PRIVATE)
   - **File size limit**: 10 MB
   - **Allowed MIME types**:
     - `application/pdf`
     - `image/jpeg`
     - `image/jpg`
     - `image/png`
     - `image/heic`
     - `image/webp`
4. Click **"Create Bucket"**

---

#### Step 2.2: Apply Storage Policies (RLS)
**Reference**: `supabase/SETUP_FEE_INVOICES_STORAGE.md` (Step 2)

1. Go to **Storage** → Click on `fee-invoices` bucket
2. Go to **Policies** tab
3. Click **"New Policy"**
4. Create **4 policies** (copy from SETUP_FEE_INVOICES_STORAGE.md):
   - ✅ Policy 1: Authenticated users can upload invoices
   - ✅ Policy 2: Authenticated users can view invoices
   - ✅ Policy 3: Admins/developers can delete invoices
   - ✅ Policy 4: Authorized users can update invoice metadata

For each policy:
- Click **"For full customization"**
- Name the policy
- Select operation (INSERT/SELECT/DELETE/UPDATE)
- Paste policy code
- Click **"Review"** → **"Save Policy"**

---

### Phase 3: Service Layer (Already Complete)

#### Step 3.1: Verify Service Methods
**File**: `services/admin-supabase-service.js`

✅ **Completed** - The following methods are now available:
1. `uploadFeeInvoice(plate, file, metadata)` - Upload invoice
2. `getFeeInvoices(plate)` - Get all invoices for plate
3. `getInvoiceCounts(plate)` - Get invoice counts by type
4. `deleteFeeInvoice(invoiceId)` - Delete invoice
5. `getFeeInvoiceUrl(filePath)` - Get download URL
6. `updateLastContact(paymentId, userId, notes)` - Update last contact
7. `updateFeeInvoiceDate(paymentId, date)` - Update invoice date

**No deployment needed** - JavaScript file is loaded via script tag in admin.html

---

### Phase 4: UI Layer (Next Step - Not Yet Implemented)

#### Step 4.1: Update Payment Tracking Table Columns
**File**: `admin.html` (Payment Tracking section)

**Required changes**:
1. Add **Last Contact** column (replace Agent column)
   - Display: User name + timestamp
   - Action: Button to open "Update Contact" modal
2. Add **Invoice Date** column
   - Display: Date from fee_invoices
   - Auto-populated from uploaded invoices
3. Add **Invoices** column
   - Display: Badge with count (e.g., "2/3")
   - Action: Button to open "Fee Invoice Management" modal

---

#### Step 4.2: Create Fee Invoice Management Modal
**Component**: Fee Invoice Upload & Management Modal

**Features**:
- View list of uploaded invoices (initial, supplementary, final)
- Upload new invoice (file picker + type selector)
- Download/preview existing invoices
- Delete invoices (admin/developer only)
- Display uploader name and upload timestamp

**Layout**:
```
┌─────────────────────────────────────────────┐
│ Fee Invoices - Plate: 22184003              │
├─────────────────────────────────────────────┤
│ Uploaded Invoices:                          │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 📄 Initial Invoice                      │ │
│ │ Date: 15/01/2025 | Amount: ₪5,000      │ │
│ │ Uploaded by: John Doe on 20/01/2025    │ │
│ │ [View] [Download] [Delete]             │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 📄 Supplementary Invoice                │ │
│ │ Date: 10/02/2025 | Amount: ₪2,000      │ │
│ │ [View] [Download] [Delete]             │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Upload New Invoice:                         │
│ ┌─────────────────────────────────────────┐ │
│ │ Invoice Type: [▼ Select]                │ │
│ │ File: [Choose File] [📷 Scan]           │ │
│ │ Date: [DD/MM/YYYY] (optional)           │ │
│ │ Amount: [₪ 0.00] (optional)             │ │
│ │ Notes: [____________]                   │ │
│ │                                         │ │
│ │ [Upload Invoice]                        │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│                           [Close]           │
└─────────────────────────────────────────────┘
```

---

#### Step 4.3: Create Last Contact Modal
**Component**: Update Last Contact Modal

**Features**:
- Display previous contact info (if any)
- Capture contact notes
- Auto-capture current user + timestamp

**Layout**:
```
┌─────────────────────────────────────────────┐
│ Update Last Contact - Plate: 22184003       │
├─────────────────────────────────────────────┤
│ Previous Contact:                           │
│ User: Jane Smith                            │
│ Date: 15/01/2025 10:30                      │
│ Notes: Called owner, waiting for garage    │
│                                             │
│ New Contact Notes:                          │
│ ┌─────────────────────────────────────────┐ │
│ │                                         │ │
│ │                                         │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Current User: John Doe                      │
│ Timestamp: 25/10/2025 14:30                 │
│                                             │
├─────────────────────────────────────────────┤
│              [Cancel]   [Update Contact]    │
└─────────────────────────────────────────────┘
```

---

## 🧪 Testing Checklist

### Database Tests

```sql
-- Test 1: Upload invoice manually (simulate)
INSERT INTO fee_invoices (
  case_id, payment_tracking_id, plate, invoice_type,
  invoice_date, invoice_amount, file_path, file_name,
  file_size, file_type, uploaded_by
) VALUES (
  (SELECT id FROM cases LIMIT 1),
  (SELECT id FROM payment_tracking LIMIT 1),
  '22184003',
  'initial',
  '2025-01-15',
  5000.00,
  'fee-invoices/22184003/test-invoice.pdf',
  'test-invoice.pdf',
  102400,
  'application/pdf',
  auth.uid()
);

-- Verify trigger auto-updated payment_tracking
SELECT fee_invoice_date FROM payment_tracking WHERE plate = '22184003';
-- Should return: 2025-01-15

-- Test 2: Get invoices for plate
SELECT * FROM get_fee_invoices('22184003');

-- Test 3: Get invoice counts
SELECT * FROM get_invoice_counts('22184003');

-- Test 4: Update last contact
SELECT * FROM update_payment_last_contact(
  (SELECT id FROM payment_tracking LIMIT 1),
  auth.uid(),
  'Called customer about payment'
);

-- Test 5: Delete invoice
SELECT * FROM delete_fee_invoice((SELECT id FROM fee_invoices LIMIT 1));
```

### Storage Tests

1. **Upload Test**: Try uploading a PDF via admin UI
2. **Download Test**: Try downloading uploaded invoice
3. **Delete Test**: Try deleting invoice (admin user)
4. **Permission Test**: Try uploading as non-authorized user (should fail)

---

## 📊 Integration Points

### Payment Tracking Module Updates Needed:

1. **loadPaymentTracking()** function:
   - Add joins to fee_invoices table
   - Get invoice counts per payment
   - Get last_contacted info

2. **renderPaymentsTable()** function:
   - Add Last Contact column (replace Agent)
   - Add Invoice Date column
   - Add Invoices count column
   - Update table header

3. **New functions to create**:
   - `openFeeInvoiceModal(paymentId, plate)` - Open invoice management modal
   - `uploadFeeInvoice(paymentId, plate)` - Handle file upload
   - `viewFeeInvoice(invoiceId)` - View/download invoice
   - `deleteFeeInvoiceUI(invoiceId)` - Delete with confirmation
   - `openLastContactModal(paymentId)` - Open contact update modal
   - `updateLastContactUI(paymentId)` - Submit contact update

---

## 🚀 Deployment Order

### Execute in this order:

1. ✅ **Database** - Deploy SQL scripts (Steps 1.1, 1.2)
2. ✅ **Storage** - Create bucket + policies (Steps 2.1, 2.2)
3. ✅ **Service Layer** - Already complete (admin-supabase-service.js)
4. ⏳ **UI Layer** - Update admin.html (Step 4)
5. ⏳ **Testing** - Run all tests
6. ⏳ **Git Commit** - Commit all changes
7. ⏳ **Git Push** - Push to branch

---

## 📝 Files Modified/Created

### Created:
- ✅ `supabase/sql/Phase9_Admin_Hub/10_modify_payment_tracking_for_invoices.sql`
- ✅ `supabase/sql/Phase9_Admin_Hub/11_create_fee_invoices_table.sql`
- ✅ `supabase/SETUP_FEE_INVOICES_STORAGE.md`
- ✅ `DEPLOY_FEE_INVOICES.md` (this file)

### Modified:
- ✅ `services/admin-supabase-service.js` (added 7 new methods)
- ⏳ `admin.html` (Payment Tracking section - **PENDING**)

---

## ⚠️ Important Notes

1. **Trigger Auto-Sync**: When invoice is uploaded, `fee_invoice_date` in payment_tracking is **automatically updated** by trigger
2. **Manual Override**: Use `set_fee_invoice_date()` function only for manual corrections
3. **OCR Integration**: OCR date extraction is planned but not yet implemented (future enhancement)
4. **File Size Limit**: 10 MB per file (configurable in bucket settings)
5. **Permissions**: Only admin, assistant, developer, and assessor can upload invoices

---

## 🔗 Related Documentation

- Phase 9 Admin Hub Overview: `documentation.md/Phase9_Admin_Hub.md`
- Nicole Query Functions: `supabase/sql/Phase9_Admin_Hub/08_create_nicole_query_functions.sql`
- Payment Statistics: `supabase/sql/Phase9_Admin_Hub/09_additional_nicole_statistics.sql`
- Storage Setup: `supabase/SETUP_FEE_INVOICES_STORAGE.md`

---

**Date**: 2025-10-25
**Session**: 78
**Phase**: 9 - Admin Hub Enhancement
**Status**: Database + Service Layer ✅ Complete | UI Layer ⏳ Pending
