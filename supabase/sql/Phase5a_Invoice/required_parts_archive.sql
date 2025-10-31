-- ============================================================================
-- Required Parts Archive Table
-- ============================================================================
-- Purpose: Archive parts_search.required_parts data before invoice assignments
-- Usage: Preserves wizard data when invoices override current parts
-- For: Parts floating screen new tab showing archived parts
-- Session: SESSION 88 - Invoice Assignment Architecture
-- ============================================================================

-- Drop table if exists (for development)
-- DROP TABLE IF EXISTS public.required_parts_archive CASCADE;

CREATE TABLE public.required_parts_archive (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  
  -- Archive metadata
  archive_type text NOT NULL DEFAULT 'pre_invoice_assignment'::text,
  archived_at timestamp with time zone NOT NULL DEFAULT now(),
  archived_by uuid NULL,
  archive_reason text NULL,
  
  -- Case identification (same as parts_required)
  case_id uuid NULL,
  plate text NULL,
  damage_center_code text NULL,
  
  -- Part information (same structure as parts_required)
  part_name text NULL,
  quantity integer NULL DEFAULT 1,
  status text NULL DEFAULT 'ARCHIVED'::text,
  metadata jsonb NULL,
  
  -- Vehicle information (same as parts_required)  
  make text NULL,
  model text NULL,
  trim text NULL,
  year text NULL,
  engine_volume text NULL,
  engine_code text NULL,
  engine_type text NULL,
  vin text NULL,
  
  -- Part details (same as parts_required)
  pcode text NULL,
  cat_num_desc text NULL,
  source text NULL,
  oem text NULL,
  availability text NULL,
  location text NULL,
  comments text NULL,
  supplier_name text NULL,
  part_family text NULL,
  description text NULL,
  
  -- Pricing (same as parts_required)
  price_per_unit numeric(10, 2) NULL,
  reduction_percentage numeric(5, 2) NULL DEFAULT 0,
  wear_percentage numeric(5, 2) NULL DEFAULT 0,
  updated_price numeric(10, 2) NULL,
  total_cost numeric(10, 2) NULL,
  
  -- Original identifiers
  original_row_uuid uuid NULL, -- The row_uuid from parts_search.required_parts
  original_created_at timestamp with time zone NULL,
  original_updated_at timestamp with time zone NULL,
  original_created_by uuid NULL,
  original_updated_by uuid NULL,
  
  -- Archive timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Primary key
  CONSTRAINT required_parts_archive_pkey PRIMARY KEY (id),
  
  -- Foreign keys
  CONSTRAINT required_parts_archive_case_id_fkey 
    FOREIGN KEY (case_id) REFERENCES cases (id) ON DELETE CASCADE,
  CONSTRAINT required_parts_archive_archived_by_fkey 
    FOREIGN KEY (archived_by) REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT required_parts_archive_original_created_by_fkey 
    FOREIGN KEY (original_created_by) REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT required_parts_archive_original_updated_by_fkey 
    FOREIGN KEY (original_updated_by) REFERENCES auth.users (id) ON DELETE SET NULL,
    
  -- Check constraints
  CONSTRAINT required_parts_archive_status_check CHECK (
    status = ANY (ARRAY[
      'ARCHIVED'::text,
      'SUPERSEDED'::text,
      'RESTORED'::text
    ])
  ),
  CONSTRAINT required_parts_archive_type_check CHECK (
    archive_type = ANY (ARRAY[
      'pre_invoice_assignment'::text,
      'manual_backup'::text,
      'version_control'::text
    ])
  )
) TABLESPACE pg_default;

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

-- Core lookup indexes
CREATE INDEX IF NOT EXISTS idx_required_parts_archive_case_id 
  ON public.required_parts_archive USING btree (case_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_required_parts_archive_plate 
  ON public.required_parts_archive USING btree (plate) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_required_parts_archive_damage_center 
  ON public.required_parts_archive USING btree (damage_center_code) TABLESPACE pg_default;

-- Archive-specific indexes  
CREATE INDEX IF NOT EXISTS idx_required_parts_archive_type 
  ON public.required_parts_archive USING btree (archive_type) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_required_parts_archive_archived_at 
  ON public.required_parts_archive USING btree (archived_at) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_required_parts_archive_archived_by 
  ON public.required_parts_archive USING btree (archived_by) TABLESPACE pg_default;

-- Part lookup indexes (same as parts_required)
CREATE INDEX IF NOT EXISTS idx_required_parts_archive_oem 
  ON public.required_parts_archive USING btree (oem) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_required_parts_archive_pcode 
  ON public.required_parts_archive USING btree (pcode) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_required_parts_archive_make_model 
  ON public.required_parts_archive USING btree (make, model) TABLESPACE pg_default;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_required_parts_archive_case_center 
  ON public.required_parts_archive USING btree (case_id, damage_center_code) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_required_parts_archive_case_type 
  ON public.required_parts_archive USING btree (case_id, archive_type) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_required_parts_archive_plate_type 
  ON public.required_parts_archive USING btree (plate, archive_type) TABLESPACE pg_default;

-- Status and original row tracking
CREATE INDEX IF NOT EXISTS idx_required_parts_archive_status 
  ON public.required_parts_archive USING btree (status) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_required_parts_archive_original_uuid 
  ON public.required_parts_archive USING btree (original_row_uuid) TABLESPACE pg_default;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_required_parts_archive_updated_at 
  BEFORE UPDATE ON required_parts_archive 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- COMMENTS for Documentation
-- ============================================================================

COMMENT ON TABLE public.required_parts_archive IS 
'Archive table for parts_search.required_parts data. Preserves wizard parts data before invoice assignments override current parts. Used for parts floating screen archive tab.';

COMMENT ON COLUMN public.required_parts_archive.archive_type IS 
'Type of archive: pre_invoice_assignment, manual_backup, version_control';

COMMENT ON COLUMN public.required_parts_archive.original_row_uuid IS 
'The row_uuid from the original parts_search.required_parts entry';

COMMENT ON COLUMN public.required_parts_archive.archive_reason IS 
'Human-readable reason for archiving (e.g., "Invoice assignment for invoice #12345")';

-- ============================================================================
-- SAMPLE QUERIES for Testing
-- ============================================================================

/*
-- Get all archived parts for a case
SELECT * FROM required_parts_archive 
WHERE case_id = 'your-case-id' 
ORDER BY archived_at DESC;

-- Get pre-invoice archives for a specific plate
SELECT * FROM required_parts_archive 
WHERE plate = '12345678' 
  AND archive_type = 'pre_invoice_assignment'
ORDER BY archived_at DESC;

-- Count archived parts by damage center
SELECT damage_center_code, COUNT(*) as parts_count, SUM(total_cost) as total_value
FROM required_parts_archive 
WHERE case_id = 'your-case-id'
GROUP BY damage_center_code;

-- Get latest archive for each original part
SELECT DISTINCT ON (original_row_uuid) *
FROM required_parts_archive 
WHERE case_id = 'your-case-id'
ORDER BY original_row_uuid, archived_at DESC;
*/