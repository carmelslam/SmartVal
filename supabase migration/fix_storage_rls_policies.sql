-- Fix Storage RLS Policies for 'docs' Bucket
-- SESSION 74: Enable invoice document uploads
-- Run this in Supabase SQL Editor

-- ============================================================================
-- STORAGE BUCKET POLICIES
-- ============================================================================

-- Policy 1: Allow authenticated users to upload to their own case folders
CREATE POLICY "Allow authenticated users to upload case documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'docs' AND
  auth.uid() IS NOT NULL
);

-- Policy 2: Allow authenticated users to read documents they have access to
CREATE POLICY "Allow authenticated users to read case documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'docs' AND
  auth.uid() IS NOT NULL
);

-- Policy 3: Allow authenticated users to update their own uploads
CREATE POLICY "Allow authenticated users to update their own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'docs' AND
  auth.uid() IS NOT NULL
)
WITH CHECK (
  bucket_id = 'docs' AND
  auth.uid() IS NOT NULL
);

-- Policy 4: Allow authenticated users to delete their own uploads
CREATE POLICY "Allow authenticated users to delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'docs' AND
  auth.uid() IS NOT NULL
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check if policies were created successfully
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;

-- Check bucket configuration
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'docs';
