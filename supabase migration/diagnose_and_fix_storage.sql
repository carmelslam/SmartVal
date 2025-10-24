-- Diagnose and Fix Storage Issues
-- SESSION 74: Complete storage bucket setup for invoices

-- ============================================================================
-- STEP 1: CHECK IF BUCKET EXISTS
-- ============================================================================

-- Check if 'docs' bucket exists
SELECT * FROM storage.buckets WHERE id = 'docs';

-- If it doesn't exist, create it
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'docs',
  'docs',
  false, -- Not public, requires authentication
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'image/heic', 'image/heif']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 2: DROP ALL EXISTING POLICIES (Clean slate)
-- ============================================================================

DROP POLICY IF EXISTS "Allow authenticated users to upload case documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read case documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to docs bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can read from docs bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can update docs bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete from docs bucket" ON storage.objects;

-- ============================================================================
-- STEP 3: CREATE NEW SIMPLE POLICIES (Allow all authenticated users)
-- ============================================================================

-- INSERT Policy
CREATE POLICY "docs_insert_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'docs'
);

-- SELECT Policy
CREATE POLICY "docs_select_policy"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'docs'
);

-- UPDATE Policy
CREATE POLICY "docs_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'docs')
WITH CHECK (bucket_id = 'docs');

-- DELETE Policy
CREATE POLICY "docs_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'docs'
);

-- ============================================================================
-- STEP 4: VERIFICATION
-- ============================================================================

-- Check bucket exists and is configured
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'docs';

-- Check all policies on storage.objects
SELECT 
  policyname,
  cmd,
  roles::text,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'docs_%'
ORDER BY policyname;

-- Count policies (should be 4)
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'docs_%';
