-- ============================================================================
-- UPDATE STORAGE BUCKET FILE SIZE LIMITS
-- ============================================================================
-- Purpose: Increase file size limits to support high-resolution images
-- Created: 2025-11-21
-- Phase: 1A - Foundation
-- ============================================================================

-- ============================================================================
-- RATIONALE
-- ============================================================================
-- Current 10MB limit is too restrictive for modern cameras:
-- - DSLR cameras produce 20-30MB RAW files
-- - iPhone 14/15 Pro images can be 8-12MB
-- - Users frequently encounter "file too large" errors
--
-- New limits:
-- - originals: 10MB → 50MB (raw uploads)
-- - processed: 10MB → 20MB (Cloudinary optimized versions)
-- ============================================================================

-- ============================================================================
-- 1. CHECK CURRENT LIMITS
-- ============================================================================

SELECT
  id as bucket_name,
  file_size_limit as current_limit_bytes,
  ROUND(file_size_limit / 1024.0 / 1024.0, 2) as current_limit_mb
FROM storage.buckets
WHERE id IN ('originals', 'processed');

-- Expected output:
-- bucket_name | current_limit_bytes | current_limit_mb
-- ------------|---------------------|------------------
-- originals   | 10485760           | 10.00
-- processed   | 10485760           | 10.00

-- ============================================================================
-- 2. UPDATE LIMITS
-- ============================================================================

-- Originals bucket: 10MB → 50MB
UPDATE storage.buckets
SET file_size_limit = 52428800  -- 50MB in bytes
WHERE id = 'originals';

-- Processed bucket: 10MB → 20MB
UPDATE storage.buckets
SET file_size_limit = 20971520  -- 20MB in bytes
WHERE id = 'processed';

-- ============================================================================
-- 3. VERIFY NEW LIMITS
-- ============================================================================

SELECT
  id as bucket_name,
  file_size_limit as new_limit_bytes,
  ROUND(file_size_limit / 1024.0 / 1024.0, 2) as new_limit_mb
FROM storage.buckets
WHERE id IN ('originals', 'processed');

-- Expected output:
-- bucket_name | new_limit_bytes | new_limit_mb
-- ------------|-----------------|-------------
-- originals   | 52428800       | 50.00
-- processed   | 20971520       | 20.00

-- ============================================================================
-- 4. UPDATE ALLOWED MIME TYPES (Optional Enhancement)
-- ============================================================================

-- Add HEIF/HEIC support for iPhone images (if not already present)
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'  -- Added HEIF
]
WHERE id = 'originals'
AND NOT ('image/heif' = ANY(allowed_mime_types));

-- ============================================================================
-- 5. NOTES ON COSTS
-- ============================================================================

-- Supabase Storage Pricing (as of 2025):
-- - Storage: ~$0.021 per GB per month
-- - Bandwidth: ~$0.09 per GB (egress)
--
-- Impact of increased limits:
-- - Allows larger files but doesn't force them
-- - Users still upload average 2-5MB images mostly
-- - Occasional 20-30MB uploads shouldn't significantly impact costs
-- - Monitor with: SELECT SUM(size) FROM storage.objects WHERE bucket_id = 'originals';

-- ============================================================================
-- 6. CLIENT-SIDE UPDATES NEEDED
-- ============================================================================

-- After running this migration, update client-side validation:
--
-- File: /lib/fileUploadService.js
-- Change:
--   const MAX_FILE_SIZE = 10 * 1024 * 1024;  // OLD
--   const MAX_FILE_SIZE = 50 * 1024 * 1024;  // NEW
--
-- File: /upload-images.html
-- Change:
--   const MAX_FILE_SIZE = 10 * 1024 * 1024;  // OLD
--   const MAX_FILE_SIZE = 50 * 1024 * 1024;  // NEW

-- ============================================================================
-- 7. ROLLBACK (If Needed)
-- ============================================================================

-- To revert to original limits:
-- UPDATE storage.buckets SET file_size_limit = 10485760 WHERE id = 'originals';
-- UPDATE storage.buckets SET file_size_limit = 10485760 WHERE id = 'processed';

-- ============================================================================
-- END OF FILE
-- ============================================================================
