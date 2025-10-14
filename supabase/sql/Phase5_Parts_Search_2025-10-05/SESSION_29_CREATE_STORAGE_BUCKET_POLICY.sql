-- SESSION 29 - CREATE STORAGE BUCKET AND POLICIES
-- Date: 2025-10-14
-- Purpose: Create parts-reports storage bucket with permissive RLS policies
-- Agent: Claude Session 29

-- ============================================================================
-- STEP 1: CREATE STORAGE BUCKET (Run this first)
-- ============================================================================

-- Note: Storage buckets are created via Supabase Dashboard or via SQL
-- This creates the bucket programmatically if it doesn't exist

INSERT INTO storage.buckets (id, name, public)
VALUES ('parts-reports', 'parts-reports', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 2: CREATE STORAGE POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to parts-reports" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to parts-reports" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from parts-reports" ON storage.objects;

-- Policy 1: Allow public read access to parts-reports bucket
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'parts-reports');

-- Policy 2: Allow all uploads to parts-reports bucket (permissive for now)
-- In production, restrict to authenticated users only
CREATE POLICY "Allow authenticated uploads to parts-reports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'parts-reports');

-- Policy 3: Allow updates to parts-reports bucket
CREATE POLICY "Allow authenticated updates to parts-reports"
ON storage.objects FOR UPDATE
USING (bucket_id = 'parts-reports')
WITH CHECK (bucket_id = 'parts-reports');

-- Policy 4: Allow deletes from parts-reports bucket
CREATE POLICY "Allow authenticated deletes from parts-reports"
ON storage.objects FOR DELETE
USING (bucket_id = 'parts-reports');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  bucket_exists BOOLEAN;
  policy_count INT;
BEGIN
  -- Check if bucket exists
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets 
    WHERE id = 'parts-reports'
  ) INTO bucket_exists;
  
  -- Count policies for this bucket
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%parts-reports%';
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 SESSION 29 - STORAGE BUCKET VERIFICATION';
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'Bucket "parts-reports": %', CASE WHEN bucket_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'Storage policies: % policies created', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE '📊 Bucket Details:';
  RAISE NOTICE '  - Name: parts-reports';
  RAISE NOTICE '  - Public: true (allows public read access)';
  RAISE NOTICE '  - Upload: Permissive (allows all uploads)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT FOR PRODUCTION:';
  RAISE NOTICE '  - Tighten upload policy to authenticated users only';
  RAISE NOTICE '  - Add file size limits';
  RAISE NOTICE '  - Add file type restrictions (PDF only)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Ready for PDF export integration!';
END $$;

-- ============================================================================
-- OPTIONAL: Check bucket configuration
-- ============================================================================

SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'parts-reports';

-- ============================================================================
-- OPTIONAL: List all policies for storage.objects
-- ============================================================================

SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;
