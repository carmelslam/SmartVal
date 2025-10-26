-- =====================================================
-- Phase 9: Fix Storage Policies - WITH CHECK Clause
-- Date: 2025-10-25
-- Purpose: Drop broken policies and recreate with proper WITH CHECK
-- =====================================================

-- =====================================================
-- 1. Drop ALL existing policies for these buckets
-- =====================================================

-- Expertise reports
DROP POLICY IF EXISTS "Allow authenticated uploads expertise" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update expertise" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read expertise" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view expertise reports" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload expertise reports" ON storage.objects;
DROP POLICY IF EXISTS "expertise_reports_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "expertise_reports_select_policy" ON storage.objects;

-- Final reports
DROP POLICY IF EXISTS "Allow authenticated uploads final" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update final" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read final" ON storage.objects;
DROP POLICY IF EXISTS "final_reports_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "final_reports_select_policy" ON storage.objects;

-- Estimate reports
DROP POLICY IF EXISTS "Allow authenticated uploads estimate" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update estimate" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read estimate" ON storage.objects;
DROP POLICY IF EXISTS "estimate_reports_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "estimate_reports_select_policy" ON storage.objects;

-- =====================================================
-- 2. Create policies with CORRECT syntax (WITH CHECK for INSERT)
-- =====================================================

-- EXPERTISE REPORTS
CREATE POLICY "expertise_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'expertise-reports');

CREATE POLICY "expertise_select"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'expertise-reports');

-- FINAL REPORTS
CREATE POLICY "final_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'final-reports');

CREATE POLICY "final_select"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'final-reports');

-- ESTIMATE REPORTS
CREATE POLICY "estimate_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'estimate-reports');

CREATE POLICY "estimate_select"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'estimate-reports');

-- =====================================================
-- 3. Verify policies have WITH CHECK (not null qual)
-- =====================================================

-- Run this to verify WITH CHECK is set:
-- SELECT policyname, cmd,
--        pg_get_expr(polwithcheck, polrelid) as with_check,
--        pg_get_expr(polqual, polrelid) as using_expr
-- FROM pg_policy p
-- JOIN pg_class c ON p.polrelid = c.oid
-- WHERE c.relname = 'objects'
-- AND policyname LIKE '%expertise%' OR policyname LIKE '%final%' OR policyname LIKE '%estimate%';

-- =====================================================
-- END OF SCRIPT
-- =====================================================
