-- =====================================================
-- Phase 5a: Storage Policies for 'docs' Bucket
-- Date: 2025-10-25
-- Session: 79
-- Purpose: Create RLS policies for invoice document storage
-- PREREQUISITE: 'docs' bucket must exist (create manually in dashboard)
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads to docs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated to view docs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated to update docs" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to delete docs" ON storage.objects;

-- =====================================================
-- Policy 1: Allow authenticated users to INSERT (upload) files
-- =====================================================
CREATE POLICY "Allow authenticated uploads to docs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'docs');

-- =====================================================
-- Policy 2: Allow authenticated users to SELECT (view) files
-- =====================================================
CREATE POLICY "Allow authenticated to view docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'docs');

-- =====================================================
-- Policy 3: Allow authenticated users to UPDATE files
-- =====================================================
CREATE POLICY "Allow authenticated to update docs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'docs');

-- =====================================================
-- Policy 4: Allow admins to DELETE files
-- =====================================================
CREATE POLICY "Allow admins to delete docs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'docs' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'developer')
  )
);

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check if bucket exists
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets 
WHERE name = 'docs';

-- Check policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%docs%'
ORDER BY policyname;

-- Test query: Check uploaded files
SELECT id, name, bucket_id, owner, created_at
FROM storage.objects 
WHERE bucket_id = 'docs'
ORDER BY created_at DESC
LIMIT 5;
