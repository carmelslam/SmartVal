-- SESSION 9 - CREATE PARTS SEARCH TABLES
-- Date: 2025-10-06
-- Purpose: Verify and create tables for parts search sessions, results, and selected parts
-- Strategy: OPTION 1 - Save every search session (complete audit trail)
-- Agent: Claude Session 9

-- ============================================================================
-- TABLE 1: parts_search_sessions
-- Purpose: Store every search session metadata (plate, search params, timestamp)
-- Trigger: Every time user clicks search (even if 0 results)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.parts_search_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  plate TEXT NOT NULL,
  search_context JSONB, -- Full search parameters from UI
  created_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_sessions_plate ON public.parts_search_sessions(plate);
CREATE INDEX IF NOT EXISTS idx_search_sessions_created ON public.parts_search_sessions(created_at DESC);

-- ============================================================================
-- TABLE 2: parts_search_results
-- Purpose: Store actual search results from each session
-- Trigger: After search completes (linked to session_id)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.parts_search_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.parts_search_sessions(id) ON DELETE CASCADE,
  supplier TEXT,
  search_query JSONB, -- Original query parameters
  results JSONB, -- Full results array as returned from search
  response_time_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_search_results_session ON public.parts_search_results(session_id);
CREATE INDEX IF NOT EXISTS idx_search_results_created ON public.parts_search_results(created_at DESC);

-- ============================================================================
-- TABLE 3: selected_parts
-- Purpose: Store parts that user actually selected (checked checkboxes)
-- Trigger: When user checks a checkbox in PiP
-- Structure: Matches helper.parts_search.selected_parts array structure
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.selected_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate TEXT NOT NULL, -- Main identifier for filtering
  
  -- Part identification
  name TEXT, -- Part name (Hebrew)
  pcode TEXT, -- Catalog/part code
  cat_num_desc TEXT, -- Full catalog description
  oem TEXT, -- OEM number if available
  
  -- Pricing and supplier
  supplier TEXT,
  supplier_name TEXT,
  price NUMERIC(10,2),
  source TEXT, -- "חליפי/מקורי/משומש" etc
  
  -- Metadata from search
  part_family TEXT, -- "פנסים ותאורה", "דלתות", etc
  availability TEXT,
  location TEXT,
  
  -- Usage context (optional - for damage center assignment)
  damage_center_id TEXT,
  damage_center_name TEXT,
  damage_center_number TEXT,
  damage_center_location TEXT,
  usage_context TEXT, -- "damage_center_assignment" or "parts_required"
  
  -- Entry metadata
  entry_method TEXT, -- "manual_typed", "search_selected", etc
  entry_type TEXT, -- "manual_entry", "search_result", etc
  from_suggestion BOOLEAN DEFAULT false,
  selection_mode TEXT, -- "damage_center_integration", "direct_select"
  selected_in_module TEXT, -- "parts_required", "parts_search", etc
  
  -- Additional fields
  quantity INT DEFAULT 1,
  comments TEXT,
  raw_data JSONB, -- Store complete original data
  
  -- Timestamps
  selected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_selected_parts_plate ON public.selected_parts(plate);
CREATE INDEX IF NOT EXISTS idx_selected_parts_damage_center ON public.selected_parts(damage_center_id);
CREATE INDEX IF NOT EXISTS idx_selected_parts_selected_at ON public.selected_parts(selected_at DESC);
CREATE INDEX IF NOT EXISTS idx_selected_parts_pcode ON public.selected_parts(pcode);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (Permissive for development)
-- ============================================================================

ALTER TABLE public.parts_search_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_search_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.selected_parts ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (tighten in production)
CREATE POLICY IF NOT EXISTS "Enable all access for search sessions" 
  ON public.parts_search_sessions FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all access for search results" 
  ON public.parts_search_results FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all access for selected parts" 
  ON public.selected_parts FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- ENABLE REALTIME SUBSCRIPTIONS
-- ============================================================================

-- Enable realtime for selected_parts (so רשימת חלקים נבחרים updates live)
DO $$
BEGIN
  -- Check if table is already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'selected_parts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.selected_parts;
    RAISE NOTICE '✅ Added selected_parts to realtime publication';
  ELSE
    RAISE NOTICE 'ℹ️ selected_parts already in realtime publication';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  sessions_exists BOOLEAN;
  results_exists BOOLEAN;
  selected_exists BOOLEAN;
BEGIN
  -- Check tables exist
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parts_search_sessions') INTO sessions_exists;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parts_search_results') INTO results_exists;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'selected_parts') INTO selected_exists;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 SESSION 9 - TABLE VERIFICATION';
  RAISE NOTICE '================================';
  RAISE NOTICE 'parts_search_sessions: %', CASE WHEN sessions_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'parts_search_results: %', CASE WHEN results_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'selected_parts: %', CASE WHEN selected_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE '';
  RAISE NOTICE '📊 Strategy: OPTION 1 - Save every search';
  RAISE NOTICE '🔄 Realtime: Enabled for selected_parts';
  RAISE NOTICE '🔒 RLS: Enabled (permissive policies)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Ready for service layer integration!';
END $$;
