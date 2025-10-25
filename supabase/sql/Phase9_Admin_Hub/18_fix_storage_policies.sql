-- =====================================================
-- Phase 9: Fix Storage RLS Policies
-- Date: 2025-10-25
-- Purpose: Fix 403 errors on storage uploads despite policies existing
-- =====================================================

-- Note: These policies target storage.objects table
-- They must be created by Supabase Dashboard or CLI with proper permissions
-- This file documents the required policies for reference

-- =====================================================
-- EXPERTISE REPORTS BUCKET POLICIES
-- =====================================================

-- Drop existing policies if they have wrong conditions
DROP POLICY IF EXISTS "Allow authenticated uploads expertise" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read expertise" ON storage.objects;

-- Policy 1: Allow authenticated users to INSERT (upload) to expertise-reports
CREATE POLICY "Allow authenticated uploads expertise"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'expertise-reports');

-- Policy 2: Allow public to SELECT (read/download) from expertise-reports
CREATE POLICY "Allow public read expertise"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'expertise-reports');

-- =====================================================
-- FINAL REPORTS BUCKET POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Allow authenticated uploads final" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read final" ON storage.objects;

CREATE POLICY "Allow authenticated uploads final"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'final-reports');

CREATE POLICY "Allow public read final"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'final-reports');

-- =====================================================
-- ESTIMATE REPORTS BUCKET POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Allow authenticated uploads estimate" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read estimate" ON storage.objects;

CREATE POLICY "Allow authenticated uploads estimate"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'estimate-reports');

CREATE POLICY "Allow public read estimate"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'estimate-reports');

-- =====================================================
-- ALTERNATIVE: If above fails, try UPDATE policies too
-- =====================================================

-- Some Supabase versions need UPDATE policy for upsert parameter
DROP POLICY IF EXISTS "Allow authenticated update expertise" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update final" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update estimate" ON storage.objects;

CREATE POLICY "Allow authenticated update expertise"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'expertise-reports')
WITH CHECK (bucket_id = 'expertise-reports');

CREATE POLICY "Allow authenticated update final"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'final-reports')
WITH CHECK (bucket_id = 'final-reports');

CREATE POLICY "Allow authenticated update estimate"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'estimate-reports')
WITH CHECK (bucket_id = 'estimate-reports');

-- =====================================================
-- DIAGNOSTIC QUERY
-- =====================================================
-- Run this to verify policies are active:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- =====================================================
-- END OF SCRIPT
-- =====================================================
