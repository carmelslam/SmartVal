-- SmartVal Supabase Storage Buckets Setup
-- Created: 2025-09-26
-- Description: Create storage buckets for files and documents

-- Note: Storage buckets can be created via SQL or Supabase Dashboard
-- All buckets are private by default for security

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  -- Reports bucket (PDFs)
  ('reports', 'reports', false, 52428800, -- 50MB limit
   ARRAY['application/pdf']),
   
  -- Original images bucket
  ('originals', 'originals', false, 10485760, -- 10MB limit
   ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']),
   
  -- Processed images bucket (watermarked, resized)
  ('processed', 'processed', false, 10485760, -- 10MB limit
   ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
   
  -- General documents bucket
  ('docs', 'docs', false, 52428800, -- 50MB limit
   ARRAY['application/pdf', 'application/msword', 
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/vnd.ms-excel',
         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
         'image/jpeg', 'image/jpg', 'image/png']),
         
  -- Temporary files bucket (auto-cleanup after 24 hours)
  ('temp', 'temp', false, 104857600, -- 100MB limit
   NULL) -- Allow all mime types for temp storage
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for storage buckets
-- Note: These policies control who can access files in each bucket

-- Reports bucket policies
CREATE POLICY "Authenticated users can upload reports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'reports' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view reports"
ON storage.objects FOR SELECT
USING (bucket_id = 'reports' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own reports"
ON storage.objects FOR UPDATE
USING (bucket_id = 'reports' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'reports');

CREATE POLICY "Users can delete their own reports"
ON storage.objects FOR DELETE
USING (bucket_id = 'reports' AND auth.role() = 'authenticated');

-- Original images bucket policies
CREATE POLICY "Authenticated users can upload original images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'originals' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view original images"
ON storage.objects FOR SELECT
USING (bucket_id = 'originals' AND auth.role() = 'authenticated');

-- Processed images bucket policies
CREATE POLICY "Authenticated users can upload processed images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'processed' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view processed images"
ON storage.objects FOR SELECT
USING (bucket_id = 'processed' AND auth.role() = 'authenticated');

-- Documents bucket policies
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'docs' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'docs' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'docs' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'docs');

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'docs' AND auth.role() = 'authenticated');

-- Temporary bucket policies (more permissive)
CREATE POLICY "Authenticated users can manage temp files"
ON storage.objects FOR ALL
USING (bucket_id = 'temp' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'temp' AND auth.role() = 'authenticated');

-- Function to automatically clean up old temp files
CREATE OR REPLACE FUNCTION cleanup_temp_storage()
RETURNS void AS $$
BEGIN
  -- Delete files older than 24 hours from temp bucket
  DELETE FROM storage.objects
  WHERE bucket_id = 'temp' 
    AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (requires pg_cron extension, optional)
-- SELECT cron.schedule('cleanup-temp-storage', '0 2 * * *', 'SELECT cleanup_temp_storage();');

-- Comments for documentation
COMMENT ON POLICY "Authenticated users can upload reports" ON storage.objects IS 
'Allow authenticated users to upload PDF reports to the reports bucket';

COMMENT ON POLICY "Authenticated users can upload original images" ON storage.objects IS 
'Allow authenticated users to upload original images before processing';

COMMENT ON POLICY "Authenticated users can upload processed images" ON storage.objects IS 
'Allow authenticated users to upload watermarked/processed images';

COMMENT ON POLICY "Authenticated users can manage temp files" ON storage.objects IS 
'Allow authenticated users full access to temporary storage';

-- Storage organization structure (for reference)
-- reports/
--   └── {case_id}/
--       └── {report_type}_{timestamp}.pdf
-- originals/
--   └── {case_id}/
--       └── {image_id}_{timestamp}.{ext}
-- processed/
--   └── {case_id}/
--       └── {image_id}_processed_{timestamp}.jpg
-- docs/
--   └── {case_id}/
--       └── {category}/
--           └── {filename}
-- temp/
--   └── {session_id}/
--       └── {filename}