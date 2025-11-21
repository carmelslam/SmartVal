-- ============================================================================
-- 10_create_originals_bucket_policy.sql
-- ============================================================================
--
-- Purpose: Create public read access policy for originals bucket
-- Date: 2025-11-21
-- Issue: Cloudinary fetch URLs need public access to source images
--
-- ============================================================================

-- Check if originals bucket exists and apply all policies
DO $$
BEGIN
  -- Check bucket exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'originals'
  ) THEN
    RAISE EXCEPTION 'originals bucket does not exist - create it first';
  END IF;

  -- 1. Make originals bucket public
  UPDATE storage.buckets
  SET public = true
  WHERE id = 'originals';

  RAISE NOTICE '✅ originals bucket set to public';

  -- 2. Create SELECT policy for public read access
  DROP POLICY IF EXISTS "Public read access for originals" ON storage.objects;

  CREATE POLICY "Public read access for originals"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'originals');

  RAISE NOTICE '✅ Public read policy created for originals bucket';

  -- 3. Create INSERT policy for authenticated users
  DROP POLICY IF EXISTS "Authenticated users can upload to originals" ON storage.objects;

  CREATE POLICY "Authenticated users can upload to originals"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'originals');

  RAISE NOTICE '✅ Insert policy created for authenticated users';

  -- 4. Create UPDATE policy for authenticated users
  DROP POLICY IF EXISTS "Authenticated users can update originals" ON storage.objects;

  CREATE POLICY "Authenticated users can update originals"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'originals' AND owner_id = auth.uid())
  WITH CHECK (bucket_id = 'originals' AND owner_id = auth.uid());

  RAISE NOTICE '✅ Update policy created for authenticated users';

  -- 5. Create DELETE policy for authenticated users
  DROP POLICY IF EXISTS "Authenticated users can delete originals" ON storage.objects;

  CREATE POLICY "Authenticated users can delete originals"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'originals' AND owner_id = auth.uid());

  RAISE NOTICE '✅ Delete policy created for authenticated users';
END $$;

-- ============================================================================
-- 6. Verify bucket settings
-- ============================================================================

SELECT
  id as bucket_name,
  public as is_public,
  file_size_limit / 1024 / 1024 as max_size_mb,
  array_length(allowed_mime_types, 1) as mime_types_count
FROM storage.buckets
WHERE id = 'originals';

-- Expected output:
-- bucket_name | is_public | max_size_mb | mime_types_count
-- ------------|-----------|-------------|------------------
-- originals   | true      | 50          | 5

-- ============================================================================
-- 7. Verify policies
-- ============================================================================

SELECT
  policyname,
  cmd as operation,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND policyname LIKE '%originals%';

-- ============================================================================
-- 8. Test public access (run after applying)
-- ============================================================================

-- To test if public access works, use this query to get a test URL:
-- SELECT
--   CONCAT(
--     'https://nvqrptokmwdhvpiufrad.supabase.co/storage/v1/object/public/originals/',
--     name
--   ) as public_url
-- FROM storage.objects
-- WHERE bucket_id = 'originals'
-- LIMIT 1;
--
-- Then open that URL in browser (incognito) - should show image without login

-- ============================================================================
-- NOTES
-- ============================================================================

-- Why public bucket?
-- - Cloudinary fetch URLs need direct HTTP access to source images
-- - Signed URLs expire and break transformation caching
-- - Files are still protected by obscure paths (UUID-based)
-- - Row Level Security (RLS) still protects database metadata

-- Security considerations:
-- - Only image files should be stored in originals bucket
-- - Sensitive documents should go in private buckets
-- - File paths use UUIDs (not guessable)
-- - Database queries still protected by RLS

-- Alternative approach (if public is not desired):
-- - Use signed URLs with long expiry (1 year)
-- - Update transformation URLs periodically when they expire
-- - Store signed URL in database instead of public URL

-- ============================================================================
-- END OF FILE
-- ============================================================================
