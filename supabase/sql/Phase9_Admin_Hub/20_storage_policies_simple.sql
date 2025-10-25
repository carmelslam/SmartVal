-- =====================================================
-- Phase 9: Storage Policies for Report Buckets
-- Date: 2025-10-25
-- Purpose: Allow authenticated uploads and public reads
-- =====================================================

-- Note: Run this in Supabase SQL Editor
-- These policies work on storage.objects table

-- =====================================================
-- EXPERTISE REPORTS BUCKET
-- =====================================================

-- Allow authenticated users to upload
CREATE POLICY "expertise_reports_insert_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'expertise-reports');

-- Allow everyone to view/download
CREATE POLICY "expertise_reports_select_policy"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'expertise-reports');

-- =====================================================
-- FINAL REPORTS BUCKET
-- =====================================================

CREATE POLICY "final_reports_insert_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'final-reports');

CREATE POLICY "final_reports_select_policy"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'final-reports');

-- =====================================================
-- ESTIMATE REPORTS BUCKET
-- =====================================================

CREATE POLICY "estimate_reports_insert_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'estimate-reports');

CREATE POLICY "estimate_reports_select_policy"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'estimate-reports');

-- =====================================================
-- Verify policies were created
-- =====================================================

-- Run this to check:
-- SELECT policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'storage'
-- AND tablename = 'objects'
-- AND policyname LIKE '%_reports_%';

-- =====================================================
-- END OF SCRIPT
-- =====================================================
