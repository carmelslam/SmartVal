# Fee Invoices Storage Bucket Setup

## Overview
This document provides step-by-step instructions for setting up the Supabase Storage bucket for fee invoices.

**Bucket Name**: `fee-invoices`
**Access**: Private (authenticated users only)
**Structure**: `fee-invoices/{plate}/{filename}`

---

## Step 1: Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Click **"New Bucket"**
3. Enter bucket details:
   - **Name**: `fee-invoices`
   - **Public**: ❌ **NO** (Keep it PRIVATE)
   - **File size limit**: 10 MB (recommended)
   - **Allowed MIME types**:
     - `application/pdf`
     - `image/jpeg`
     - `image/jpg`
     - `image/png`
     - `image/heic`
     - `image/webp`

4. Click **"Create Bucket"**

---

## Step 2: Configure Bucket Policies (RLS)

### Policy 1: Allow authenticated users to upload invoices

```sql
-- Policy: Authenticated users can upload fee invoices
CREATE POLICY "Authenticated users can upload fee invoices"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'fee-invoices' AND
  (storage.foldername(name))[1] IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'assistant', 'developer', 'assessor')
  )
);
```

### Policy 2: Allow authenticated users to read/download invoices

```sql
-- Policy: Authenticated users can view fee invoices
CREATE POLICY "Authenticated users can view fee invoices"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'fee-invoices'
);
```

### Policy 3: Allow admins and developers to delete invoices

```sql
-- Policy: Admins and developers can delete fee invoices
CREATE POLICY "Admins and developers can delete fee invoices"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'fee-invoices' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'developer')
  )
);
```

### Policy 4: Allow authorized users to update invoice metadata

```sql
-- Policy: Authorized users can update fee invoice metadata
CREATE POLICY "Authorized users can update fee invoices"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'fee-invoices' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'assistant', 'developer', 'assessor')
  )
)
WITH CHECK (
  bucket_id = 'fee-invoices'
);
```

---

## Step 3: Apply Policies via Dashboard

1. Go to **Storage** → Click on `fee-invoices` bucket
2. Go to **Policies** tab
3. Click **"New Policy"**
4. For each policy above:
   - Click **"For full customization"**
   - Name the policy (copy from SQL comment)
   - Select operation: INSERT / SELECT / DELETE / UPDATE
   - Paste the policy code in **"Policy Definition"**
   - Click **"Review"** → **"Save Policy"**

---

## Step 4: Verify Setup

### Test Upload (via SQL)
```sql
-- This should work for authenticated admin/assistant/developer/assessor
SELECT storage.upload(
  'fee-invoices/22184003/test-invoice.pdf',
  decode('JVBERi0xLjQKJeLjz9MK...', 'base64'),
  'application/pdf'
);
```

### Test Read (via SQL)
```sql
-- This should return the file
SELECT storage.get_public_url('fee-invoices', '22184003/test-invoice.pdf');
```

### Test Delete (via SQL - admin/developer only)
```sql
-- This should work for admin/developer
SELECT storage.delete('fee-invoices', ARRAY['22184003/test-invoice.pdf']);
```

---

## File Naming Convention

**Format**: `{invoice_type}-{timestamp}.{extension}`

**Examples**:
- `initial-2025-01-15-14-30-22.pdf`
- `supplementary-2025-02-10-09-15-44.jpg`
- `final-2025-03-20-16-45-10.pdf`

**Path Structure**:
```
fee-invoices/
├── 22184003/
│   ├── initial-2025-01-15-14-30-22.pdf
│   ├── supplementary-2025-02-10-09-15-44.jpg
│   └── final-2025-03-20-16-45-10.pdf
├── 12345678/
│   ├── initial-2025-01-20-10-00-00.pdf
│   └── final-2025-02-15-11-30-00.pdf
```

---

## Integration with fee_invoices Table

When uploading an invoice:

1. **Upload file to Storage** → Get file path
2. **Insert record to fee_invoices table**:
   - `file_path`: Path in storage (e.g., `fee-invoices/22184003/initial-2025-01-15.pdf`)
   - `file_name`: Original filename
   - `file_size`: File size in bytes
   - `file_type`: MIME type
   - `uploaded_by`: Current user ID
   - `invoice_type`: initial / supplementary / final
   - `invoice_date`: Extracted via OCR or manual input

3. **Trigger auto-fires** → Updates `payment_tracking.fee_invoice_date`

---

## OCR Integration (Future Enhancement)

For automatic invoice date extraction:

**Recommended Services**:
- **Tesseract.js** (client-side, free)
- **Google Vision API** (server-side, paid)
- **AWS Textract** (server-side, paid)

**Workflow**:
1. User uploads invoice file
2. Send to OCR service
3. Extract date patterns (DD/MM/YYYY, DD.MM.YYYY, etc.)
4. Store in `fee_invoices.invoice_date`
5. Set `date_extracted_from_ocr = true`
6. Store OCR confidence score and metadata

---

## Security Considerations

✅ **Private Bucket** - Only authenticated users can access
✅ **Role-Based Upload** - Only admin/assistant/developer/assessor can upload
✅ **Role-Based Delete** - Only admin/developer can delete
✅ **Folder Structure** - Organized by plate number
✅ **File Size Limits** - Prevent abuse (10 MB recommended)
✅ **MIME Type Restrictions** - Only allow documents and images

---

## Deployment Checklist

- [ ] Create `fee-invoices` bucket in Supabase Dashboard
- [ ] Set bucket to **PRIVATE**
- [ ] Configure file size limit (10 MB)
- [ ] Set allowed MIME types
- [ ] Apply all 4 RLS policies
- [ ] Test upload with authenticated user
- [ ] Test download/view
- [ ] Test delete (admin only)
- [ ] Deploy SQL scripts:
  - [ ] `10_modify_payment_tracking_for_invoices.sql`
  - [ ] `11_create_fee_invoices_table.sql`

---

## Support

For issues or questions:
- Check Supabase Storage logs
- Verify RLS policies are enabled
- Check user role in profiles table
- Verify bucket name is exactly `fee-invoices`

---

**Date**: 2025-10-25
**Session**: 78
**Phase**: 9 - Admin Hub Enhancement
