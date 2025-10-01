-- SmartVal Supabase Migration: Initial Schema
-- Created: 2025-09-26
-- Description: Complete database schema for SmartVal system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================================================
-- PHASE 1: CORE TABLES
-- ============================================================================

-- 1. Organizations (for future multi-tenancy)
CREATE TABLE IF NOT EXISTS public.orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. User Profiles (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'viewer')),
  org_id UUID REFERENCES public.orgs(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Cases (main entity)
CREATE TABLE IF NOT EXISTS public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate TEXT NOT NULL,
  owner_name TEXT,
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'CLOSED', 'ARCHIVED')),
  org_id UUID REFERENCES public.orgs(id),
  created_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partial unique index for one active case per plate
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_case_per_plate 
ON public.cases(plate) 
WHERE status IN ('OPEN', 'IN_PROGRESS');

-- 4. Case Helper (versioned JSON storage)
CREATE TABLE IF NOT EXISTS public.case_helper (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT false,
  helper_name TEXT NOT NULL, -- e.g., "12345678_helper_v1"
  helper_json JSONB NOT NULL,
  source TEXT DEFAULT 'system',
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
  sync_error TEXT,
  updated_by UUID REFERENCES public.profiles(user_id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure only one current version per case
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_current_helper 
ON public.case_helper(case_id) 
WHERE is_current = true;

-- 5. Helper Versions (immutable history)
CREATE TABLE IF NOT EXISTS public.helper_versions (
  id BIGSERIAL PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  version INT NOT NULL,
  helper_name TEXT NOT NULL,
  helper_json JSONB NOT NULL,
  source TEXT DEFAULT 'system',
  saved_by UUID REFERENCES public.profiles(user_id),
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- PHASE 2: NEW MODULES (PARTS & INVOICES)
-- ============================================================================

-- 6. Parts Module
CREATE TABLE IF NOT EXISTS public.parts_search_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  plate TEXT NOT NULL,
  search_context JSONB,
  created_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.parts_search_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.parts_search_sessions(id) ON DELETE CASCADE,
  supplier TEXT,
  search_query JSONB,
  results JSONB,
  response_time_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.parts_required (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  damage_center_code TEXT,
  part_number TEXT,
  part_name TEXT,
  manufacturer TEXT,
  quantity INT DEFAULT 1,
  unit_price NUMERIC(10,2),
  selected_supplier TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ORDERED', 'RECEIVED', 'CANCELLED')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Invoices Module
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  plate TEXT NOT NULL,
  invoice_number TEXT UNIQUE,
  invoice_type TEXT CHECK (invoice_type IN ('PARTS', 'LABOR', 'TOWING', 'OTHER')),
  supplier_name TEXT,
  supplier_tax_id TEXT,
  issue_date DATE,
  due_date DATE,
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'PAID', 'CANCELLED')),
  total_before_tax NUMERIC(10,2),
  tax_amount NUMERIC(10,2),
  total_amount NUMERIC(10,2),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  line_number INT,
  description TEXT,
  part_id UUID REFERENCES public.parts_required(id),
  quantity NUMERIC(10,2),
  unit_price NUMERIC(10,2),
  discount_percent NUMERIC(5,2) DEFAULT 0,
  line_total NUMERIC(10,2),
  metadata JSONB
);

-- ============================================================================
-- PHASE 3: SUPPORTING TABLES
-- ============================================================================

-- 8. Documents & Files
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('report', 'invoice', 'image', 'license', 'other')),
  filename TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  storage_key TEXT, -- Supabase storage path
  onedrive_file_id TEXT,
  onedrive_web_url TEXT,
  checksum TEXT,
  created_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Knowledge Base
CREATE TABLE IF NOT EXISTS public.kb_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  source TEXT,
  lang TEXT DEFAULT 'he',
  tags TEXT[],
  body TEXT,
  -- embedding vector(1536), -- For future AI search (uncomment after enabling vector extension)
  org_id UUID REFERENCES public.orgs(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Webhook Sync Log (track Make.com sync)
CREATE TABLE IF NOT EXISTS public.webhook_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_name TEXT NOT NULL,
  direction TEXT CHECK (direction IN ('TO_SUPABASE', 'FROM_SUPABASE')),
  case_id UUID REFERENCES public.cases(id),
  payload JSONB,
  status TEXT CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Audit Trail
CREATE TABLE IF NOT EXISTS public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor UUID REFERENCES public.profiles(user_id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Case indexes
CREATE INDEX IF NOT EXISTS idx_cases_plate ON public.cases(plate);
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_created ON public.cases(created_at DESC);

-- Helper indexes
CREATE INDEX IF NOT EXISTS idx_case_helper_case_version ON public.case_helper(case_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_case_helper_sync_status ON public.case_helper(sync_status);
CREATE INDEX IF NOT EXISTS idx_helper_json_gin ON public.case_helper USING gin(helper_json jsonb_path_ops);

-- Parts indexes
CREATE INDEX IF NOT EXISTS idx_parts_case ON public.parts_required(case_id);
CREATE INDEX IF NOT EXISTS idx_parts_status ON public.parts_required(status);
CREATE INDEX IF NOT EXISTS idx_parts_supplier ON public.parts_required(selected_supplier);

-- Invoice indexes
CREATE INDEX IF NOT EXISTS idx_invoices_case ON public.invoices(case_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);

-- Document indexes
CREATE INDEX IF NOT EXISTS idx_documents_case ON public.documents(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);

-- Audit indexes
CREATE INDEX IF NOT EXISTS idx_audit_actor_date ON public.audit_log(actor, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_table_record ON public.audit_log(table_name, record_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_helper ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helper_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_search_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_search_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_required ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permissive for now, tighten in production)
-- Note: These are very permissive for development. Will be tightened later.

-- Cases policies
CREATE POLICY "Enable all access for cases" ON public.cases
FOR ALL USING (true) WITH CHECK (true);

-- Helper policies
CREATE POLICY "Enable all access for helpers" ON public.case_helper
FOR ALL USING (true) WITH CHECK (true);

-- Parts policies
CREATE POLICY "Enable all access for parts" ON public.parts_required
FOR ALL USING (true) WITH CHECK (true);

-- Invoices policies
CREATE POLICY "Enable all access for invoices" ON public.invoices
FOR ALL USING (true) WITH CHECK (true);

-- Documents policies
CREATE POLICY "Enable all access for documents" ON public.documents
FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================================

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.cases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.case_helper;
ALTER PUBLICATION supabase_realtime ADD TABLE public.parts_required;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_orgs_updated_at BEFORE UPDATE ON public.orgs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_case_helper_updated_at BEFORE UPDATE ON public.case_helper
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_parts_required_updated_at BEFORE UPDATE ON public.parts_required
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to save helper with proper versioning
CREATE OR REPLACE FUNCTION save_helper_version()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new helper is saved as current, save to versions table
  IF NEW.is_current = true THEN
    INSERT INTO public.helper_versions (
      case_id, version, helper_name, helper_json, source, saved_by
    ) VALUES (
      NEW.case_id, NEW.version, NEW.helper_name, NEW.helper_json, NEW.source, NEW.updated_by
    );
    
    -- Mark all other versions as not current
    UPDATE public.case_helper
    SET is_current = false
    WHERE case_id = NEW.case_id AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER save_helper_version_trigger AFTER INSERT OR UPDATE ON public.case_helper
  FOR EACH ROW EXECUTE FUNCTION save_helper_version();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Create default organization (optional, for development)
INSERT INTO public.orgs (name) VALUES ('SmartVal Default Org')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.cases IS 'Main case table - each case represents a vehicle assessment';
COMMENT ON TABLE public.case_helper IS 'Current helper JSON for each case with versioning';
COMMENT ON TABLE public.helper_versions IS 'Immutable history of all helper versions';
COMMENT ON TABLE public.parts_required IS 'Parts identified for repair in each case';
COMMENT ON TABLE public.invoices IS 'Invoices associated with cases';
COMMENT ON TABLE public.documents IS 'File references for documents stored in Supabase Storage';
COMMENT ON TABLE public.webhook_sync_log IS 'Track synchronization between Make.com and Supabase';
COMMENT ON COLUMN public.case_helper.helper_name IS 'Format: {plate}_helper_v{version}';
COMMENT ON COLUMN public.case_helper.sync_status IS 'Track if helper was successfully synced with Make.com';

-- End of initial schema migration