-- Fix RLS Policies for Testing
-- This makes the policies more permissive for development/testing

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable all access for cases" ON public.cases;
DROP POLICY IF EXISTS "Enable all access for helpers" ON public.case_helper;
DROP POLICY IF EXISTS "Enable all access for parts" ON public.parts_required;
DROP POLICY IF EXISTS "Enable all access for invoices" ON public.invoices;
DROP POLICY IF EXISTS "Enable all access for documents" ON public.documents;

-- Create more permissive policies for development
-- Cases policies
CREATE POLICY "Allow anonymous access to cases" ON public.cases
FOR ALL USING (true) WITH CHECK (true);

-- Case helper policies  
CREATE POLICY "Allow anonymous access to case_helper" ON public.case_helper
FOR ALL USING (true) WITH CHECK (true);

-- Helper versions policies
CREATE POLICY "Allow anonymous access to helper_versions" ON public.helper_versions
FOR ALL USING (true) WITH CHECK (true);

-- Parts policies
CREATE POLICY "Allow anonymous access to parts_required" ON public.parts_required
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous access to parts_search_sessions" ON public.parts_search_sessions
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous access to parts_search_results" ON public.parts_search_results
FOR ALL USING (true) WITH CHECK (true);

-- Invoice policies
CREATE POLICY "Allow anonymous access to invoices" ON public.invoices
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous access to invoice_lines" ON public.invoice_lines
FOR ALL USING (true) WITH CHECK (true);

-- Document policies
CREATE POLICY "Allow anonymous access to documents" ON public.documents
FOR ALL USING (true) WITH CHECK (true);

-- KB docs policies
CREATE POLICY "Allow anonymous access to kb_docs" ON public.kb_docs
FOR ALL USING (true) WITH CHECK (true);

-- Webhook sync log policies
CREATE POLICY "Allow anonymous access to webhook_sync_log" ON public.webhook_sync_log
FOR ALL USING (true) WITH CHECK (true);

-- Audit log policies (read-only for anonymous)
CREATE POLICY "Allow anonymous read to audit_log" ON public.audit_log
FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert to audit_log" ON public.audit_log
FOR INSERT WITH CHECK (true);

-- Org and profile policies (for future use)
CREATE POLICY "Allow anonymous access to orgs" ON public.orgs
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous access to profiles" ON public.profiles
FOR ALL USING (true) WITH CHECK (true);

-- Add comment explaining these are development policies
COMMENT ON POLICY "Allow anonymous access to cases" ON public.cases IS 
'Development policy - allows anonymous access. Tighten for production.';

COMMENT ON POLICY "Allow anonymous access to case_helper" ON public.case_helper IS 
'Development policy - allows anonymous access. Tighten for production.';

-- Show current policies for verification
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
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;