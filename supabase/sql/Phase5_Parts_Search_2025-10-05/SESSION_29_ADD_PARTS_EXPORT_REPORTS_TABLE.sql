-- SESSION 29 - CREATE PARTS EXPORT REPORTS TABLE
-- Date: 2025-10-14
-- Purpose: Track PDF exports of selected parts list with Supabase Storage integration
-- Agent: Claude Session 29

-- ============================================================================
-- TABLE: parts_export_reports
-- Purpose: Store metadata for PDF exports of selected parts lists
-- Trigger: When user clicks "📤 ייצא לתיקייה" button
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.parts_export_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  plate TEXT NOT NULL,
  report_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  parts_count INT NOT NULL,
  total_estimated_cost NUMERIC(10,2),
  pdf_storage_path TEXT NOT NULL, -- Path in Supabase Storage bucket
  pdf_public_url TEXT NOT NULL,   -- Public URL for PDF access
  vehicle_info JSONB,              -- {make, model, year}
  export_payload JSONB,            -- Full webhook payload sent to Make.com
  created_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_export_reports_case ON public.parts_export_reports(case_id);
CREATE INDEX IF NOT EXISTS idx_export_reports_plate ON public.parts_export_reports(plate);
CREATE INDEX IF NOT EXISTS idx_export_reports_date ON public.parts_export_reports(report_date DESC);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.parts_export_reports ENABLE ROW LEVEL SECURITY;

-- Create permissive policy (tighten in production)
-- Drop existing policy first if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'parts_export_reports' 
    AND policyname = 'Enable all access for export reports'
  ) THEN
    DROP POLICY "Enable all access for export reports" ON public.parts_export_reports;
  END IF;
END $$;

CREATE POLICY "Enable all access for export reports" 
  ON public.parts_export_reports FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- ENABLE REALTIME SUBSCRIPTIONS (Optional)
-- ============================================================================

-- Uncomment if realtime needed:
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM pg_publication_tables 
--     WHERE pubname = 'supabase_realtime' 
--     AND tablename = 'parts_export_reports'
--   ) THEN
--     ALTER PUBLICATION supabase_realtime ADD TABLE public.parts_export_reports;
--     RAISE NOTICE '✅ Added parts_export_reports to realtime publication';
--   END IF;
-- END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'parts_export_reports'
  ) INTO table_exists;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 SESSION 29 - TABLE VERIFICATION';
  RAISE NOTICE '==================================';
  RAISE NOTICE 'parts_export_reports: %', CASE WHEN table_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE '';
  RAISE NOTICE '📊 Purpose: Track PDF exports of selected parts';
  RAISE NOTICE '🔒 RLS: Enabled (permissive policies)';
  RAISE NOTICE '🗂️ Storage Bucket: parts-reports (must be created manually)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Ready for PDF export integration!';
END $$;
