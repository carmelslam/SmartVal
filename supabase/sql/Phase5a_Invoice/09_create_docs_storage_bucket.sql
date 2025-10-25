-- =====================================================
-- Phase 5a: Create 'docs' Storage Bucket for Invoices
-- Date: 2025-10-25
-- Session: 79
-- Purpose: Create missing 'docs' bucket for invoice document storage
-- =====================================================

-- Note: Storage bucket creation must be done via Supabase Dashboard or CLI
-- This file documents the required configuration

/*
BUCKET CONFIGURATION:
---------------------
Bucket Name: docs
Public: false (private bucket)
File Size Limit: 10MB
Allowed MIME Types: 
  - application/pdf
  - image/jpeg
  - image/png
  - image/webp

Path Structure: {case_id}/invoices/{timestamp}_{filename}
Example: a1b2c3d4-e5f6-7890-abcd-ef1234567890/invoices/1698765432000_invoice.pdf
*/

-- =====================================================
-- STORAGE POLICIES FOR 'docs' BUCKET
-- =====================================================

-- These policies must be created in Supabase Dashboard:
-- Storage > docs bucket > Policies

-- Policy 1: Allow authenticated users to INSERT (upload) files
-- Name: "Allow authenticated uploads to docs"
-- Operation: INSERT
-- Policy Definition:
/*
CREATE POLICY "Allow authenticated uploads to docs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'docs' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT case_id FROM cases WHERE user_id = auth.uid()
  )
);
*/

-- Policy 2: Allow authenticated users to SELECT (view) their files
-- Name: "Allow authenticated to view docs"
-- Operation: SELECT
-- Policy Definition:
/*
CREATE POLICY "Allow authenticated to view docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'docs' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT case_id FROM cases WHERE user_id = auth.uid()
  )
);
*/

-- Policy 3: Allow authenticated users to UPDATE their files
-- Name: "Allow authenticated to update docs"
-- Operation: UPDATE
-- Policy Definition:
/*
CREATE POLICY "Allow authenticated to update docs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'docs' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT case_id FROM cases WHERE user_id = auth.uid()
  )
);
*/

-- Policy 4: Allow only admins to DELETE files
-- Name: "Allow admins to delete docs"
-- Operation: DELETE
-- Policy Definition:
/*
CREATE POLICY "Allow admins to delete docs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'docs' AND
  (
    SELECT role FROM profiles WHERE user_id = auth.uid()
  ) IN ('admin', 'developer')
);
*/

-- =====================================================
-- MANUAL STEPS REQUIRED IN SUPABASE DASHBOARD
-- =====================================================

/*
1. Go to Supabase Dashboard > Storage
2. Click "Create Bucket"
3. Set the following:
   - Name: docs
   - Public: OFF (private bucket)
   - File size limit: 10485760 (10MB)
   - Allowed MIME types: application/pdf, image/jpeg, image/png, image/webp

4. After creating bucket, go to Policies tab
5. Create the 4 policies above using the policy editor

6. Test upload from invoice upload.html
7. Verify files appear in Storage > docs bucket

VERIFICATION QUERIES:
--------------------
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE name = 'docs';

-- Check bucket policies
SELECT * FROM storage.policies WHERE bucket_id = 'docs';

-- View uploaded files
SELECT * FROM storage.objects WHERE bucket_id = 'docs' LIMIT 10;

-- Check invoice_documents table
SELECT id, filename, storage_path, storage_bucket, ocr_status 
FROM invoice_documents 
ORDER BY created_at DESC 
LIMIT 5;
*/

-- =====================================================
-- ALTERNATIVE: Use existing bucket
-- =====================================================

/*
If you prefer NOT to create a new bucket, you can modify invoice-service.js
to use an existing bucket like 'expertise-reports':

Line 310: Change from 'docs' to 'expertise-reports'
Line 326: Change storage_bucket default to 'expertise-reports'

Then update invoice_documents table default:
*/

-- Option: Change default bucket to expertise-reports (if preferred)
-- ALTER TABLE invoice_documents 
-- ALTER COLUMN storage_bucket SET DEFAULT 'expertise-reports';

-- =====================================================
-- END OF FILE
-- =====================================================
