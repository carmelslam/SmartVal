-- =====================================================
-- Phase 9: Admin Hub Enhancement
-- Script 02: General Tracking Table
-- Date: 2025-10-24
-- Session: 75
-- =====================================================
--
-- Purpose: Create tracking_general table for Nicole queries and Make.com reporting
-- User Specification: 21 columns for comprehensive case tracking
-- Dependencies:
--   - Requires: cases table (from Phase 4)
-- Helper Integration: Auto-populated from helper JSON via trigger
-- =====================================================

-- Drop table if exists (for development only - comment out for production)
-- DROP TABLE IF EXISTS tracking_general CASCADE;

-- Create tracking_general table with all 21 columns
CREATE TABLE IF NOT EXISTS tracking_general (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to cases
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,

  -- תאריך הבדיקה - Inspection date
  inspection_date DATE,

  -- תאריך חוו״ד - Report/opinion date
  report_date DATE,

  -- מס.רכב - Vehicle plate number
  plate TEXT NOT NULL,

  -- שם היצרן - Manufacturer name
  manufacturer TEXT,

  -- שנת ייצור - Year of manufacture
  year_of_manufacture INT,

  -- ערך הרכב - Vehicle value
  vehicle_value NUMERIC(10,2),

  -- שם בעל הרכב - Owner name
  owner_name TEXT,

  -- טלפון - Phone number
  phone TEXT,

  -- מוסך - Garage name
  garage TEXT,

  -- טלפון מוסך - Garage phone
  garage_phone TEXT,

  -- E-mail
  email TEXT,

  -- דירקטיבה - Directive/instructions
  directive TEXT,

  -- תמונות - Photos available (boolean)
  photos_available BOOLEAN DEFAULT false,

  -- מס' תמונות - Number of photos
  photo_count INT DEFAULT 0,

  -- התקבלה חשבונית - Invoice received
  invoice_received BOOLEAN DEFAULT false,

  -- התקבל תשלום - Payment received
  payment_received BOOLEAN DEFAULT false,

  -- תיק בתביעה - Case in claim/litigation
  case_in_claim BOOLEAN DEFAULT false,

  -- סטטוס כללי - General status
  general_status TEXT,

  -- הערות כלליות - General notes
  general_notes TEXT,

  -- לינק לתיק - Link to case file
  case_link TEXT,

  -- TimeStamp - Timestamp
  timestamp TIMESTAMPTZ DEFAULT now(),

  -- Additional tracking fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Indexes for performance
-- =====================================================

-- Index on plate for Nicole queries
CREATE INDEX IF NOT EXISTS idx_tracking_general_plate
ON tracking_general(plate);

-- Index on case_id for joins
CREATE INDEX IF NOT EXISTS idx_tracking_general_case_id
ON tracking_general(case_id);

-- Index on timestamp for chronological queries
CREATE INDEX IF NOT EXISTS idx_tracking_general_timestamp
ON tracking_general(timestamp DESC);

-- Index on general_status for filtering
CREATE INDEX IF NOT EXISTS idx_tracking_general_status
ON tracking_general(general_status)
WHERE general_status IS NOT NULL;

-- Composite index for common Nicole queries (plate + timestamp)
CREATE INDEX IF NOT EXISTS idx_tracking_general_plate_timestamp
ON tracking_general(plate, timestamp DESC);

-- Index on boolean flags for quick filtering
CREATE INDEX IF NOT EXISTS idx_tracking_general_flags
ON tracking_general(invoice_received, payment_received, case_in_claim);

-- =====================================================
-- Unique constraint: One current tracking record per case
-- =====================================================

-- Create unique index for one active tracking per case
-- (Can have multiple historical records, but enforce in application if needed)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tracking_general_case_unique
ON tracking_general(case_id)
WHERE case_id IS NOT NULL;

-- =====================================================
-- Trigger: Auto-update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_tracking_general_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tracking_general_updated_at
  BEFORE UPDATE ON tracking_general
  FOR EACH ROW
  EXECUTE FUNCTION update_tracking_general_timestamp();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE tracking_general ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view tracking data
CREATE POLICY "tracking_general_select_policy"
ON tracking_general
FOR SELECT
TO authenticated
USING (true);

-- Policy: System can insert tracking records (via trigger from helper save)
-- Allow authenticated users for now, but primary use is via trigger
CREATE POLICY "tracking_general_insert_policy"
ON tracking_general
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Policy: System can update tracking records
CREATE POLICY "tracking_general_update_policy"
ON tracking_general
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Only admins can delete tracking records
CREATE POLICY "tracking_general_delete_policy"
ON tracking_general
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'developer')
  )
);

-- =====================================================
-- Helper function: Extract tracking data from helper JSON
-- =====================================================

CREATE OR REPLACE FUNCTION extract_tracking_general_from_helper(
  helper_json JSONB,
  p_case_id UUID,
  p_plate TEXT
)
RETURNS tracking_general AS $$
DECLARE
  tracking_record tracking_general;
BEGIN
  -- Extract data from helper JSON and populate tracking record
  tracking_record.case_id := p_case_id;
  tracking_record.plate := p_plate;

  -- Extract from helper.case_info
  tracking_record.inspection_date := (helper_json->'case_info'->>'inspection_date')::DATE;
  tracking_record.report_date := (helper_json->'case_info'->>'report_date')::DATE;

  -- Extract from helper.vehicle
  tracking_record.manufacturer := helper_json->'vehicle'->>'manufacturer';
  tracking_record.year_of_manufacture := (helper_json->'vehicle'->>'year')::INT;

  -- Extract from helper.valuation
  tracking_record.vehicle_value := (helper_json->'valuation'->>'vehicle_value')::NUMERIC;

  -- Extract from helper.stakeholders or case_info
  tracking_record.owner_name := COALESCE(
    helper_json->'stakeholders'->'owner'->>'name',
    helper_json->'case_info'->>'owner_name'
  );
  tracking_record.phone := COALESCE(
    helper_json->'stakeholders'->'owner'->>'phone',
    helper_json->'case_info'->>'phone'
  );
  tracking_record.email := helper_json->'stakeholders'->'owner'->>'email';

  -- Extract garage information
  tracking_record.garage := COALESCE(
    helper_json->'stakeholders'->'garage'->>'name',
    helper_json->'case_info'->>'garage'
  );
  tracking_record.garage_phone := helper_json->'stakeholders'->'garage'->>'phone';

  -- Extract directive
  tracking_record.directive := helper_json->'case_info'->>'directive';

  -- Extract photo information
  tracking_record.photo_count := COALESCE(
    (helper_json->'documents'->>'photo_count')::INT,
    0
  );
  tracking_record.photos_available := (tracking_record.photo_count > 0);

  -- Extract financial flags
  tracking_record.invoice_received := COALESCE(
    (helper_json->'financials'->>'invoice_received')::BOOLEAN,
    false
  );
  tracking_record.payment_received := COALESCE(
    (helper_json->'financials'->>'payment_received')::BOOLEAN,
    false
  );

  -- Extract case status
  tracking_record.case_in_claim := COALESCE(
    (helper_json->'case_info'->>'in_litigation')::BOOLEAN,
    false
  );
  tracking_record.general_status := helper_json->'case_info'->>'status';
  tracking_record.general_notes := helper_json->'case_info'->>'notes';

  -- Set case link (can be constructed from plate or case_id)
  tracking_record.case_link := 'case://' || p_plate;

  -- Set timestamp
  tracking_record.timestamp := now();
  tracking_record.created_at := now();
  tracking_record.updated_at := now();

  RETURN tracking_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Helper function: Upsert tracking from helper JSON
-- =====================================================

CREATE OR REPLACE FUNCTION upsert_tracking_general_from_helper(
  helper_json JSONB,
  p_case_id UUID,
  p_plate TEXT
)
RETURNS UUID AS $$
DECLARE
  tracking_id UUID;
BEGIN
  -- Insert or update tracking record
  INSERT INTO tracking_general (
    case_id,
    plate,
    inspection_date,
    report_date,
    manufacturer,
    year_of_manufacture,
    vehicle_value,
    owner_name,
    phone,
    garage,
    garage_phone,
    email,
    directive,
    photos_available,
    photo_count,
    invoice_received,
    payment_received,
    case_in_claim,
    general_status,
    general_notes,
    case_link,
    timestamp
  )
  VALUES (
    p_case_id,
    p_plate,
    (helper_json->'case_info'->>'inspection_date')::DATE,
    (helper_json->'case_info'->>'report_date')::DATE,
    helper_json->'vehicle'->>'manufacturer',
    (helper_json->'vehicle'->>'year')::INT,
    (helper_json->'valuation'->>'vehicle_value')::NUMERIC,
    COALESCE(helper_json->'stakeholders'->'owner'->>'name', helper_json->'case_info'->>'owner_name'),
    COALESCE(helper_json->'stakeholders'->'owner'->>'phone', helper_json->'case_info'->>'phone'),
    COALESCE(helper_json->'stakeholders'->'garage'->>'name', helper_json->'case_info'->>'garage'),
    helper_json->'stakeholders'->'garage'->>'phone',
    helper_json->'stakeholders'->'owner'->>'email',
    helper_json->'case_info'->>'directive',
    COALESCE((helper_json->'documents'->>'photo_count')::INT, 0) > 0,
    COALESCE((helper_json->'documents'->>'photo_count')::INT, 0),
    COALESCE((helper_json->'financials'->>'invoice_received')::BOOLEAN, false),
    COALESCE((helper_json->'financials'->>'payment_received')::BOOLEAN, false),
    COALESCE((helper_json->'case_info'->>'in_litigation')::BOOLEAN, false),
    helper_json->'case_info'->>'status',
    helper_json->'case_info'->>'notes',
    'case://' || p_plate,
    now()
  )
  ON CONFLICT (case_id)
  DO UPDATE SET
    inspection_date = EXCLUDED.inspection_date,
    report_date = EXCLUDED.report_date,
    manufacturer = EXCLUDED.manufacturer,
    year_of_manufacture = EXCLUDED.year_of_manufacture,
    vehicle_value = EXCLUDED.vehicle_value,
    owner_name = EXCLUDED.owner_name,
    phone = EXCLUDED.phone,
    garage = EXCLUDED.garage,
    garage_phone = EXCLUDED.garage_phone,
    email = EXCLUDED.email,
    directive = EXCLUDED.directive,
    photos_available = EXCLUDED.photos_available,
    photo_count = EXCLUDED.photo_count,
    invoice_received = EXCLUDED.invoice_received,
    payment_received = EXCLUDED.payment_received,
    case_in_claim = EXCLUDED.case_in_claim,
    general_status = EXCLUDED.general_status,
    general_notes = EXCLUDED.general_notes,
    timestamp = EXCLUDED.timestamp,
    updated_at = now()
  RETURNING id INTO tracking_id;

  RETURN tracking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE tracking_general IS 'General case tracking for Nicole queries and Make.com reporting (Phase 9) - 21 columns';
COMMENT ON COLUMN tracking_general.inspection_date IS 'תאריך הבדיקה - Inspection date';
COMMENT ON COLUMN tracking_general.report_date IS 'תאריך חוו״ד - Report/opinion date';
COMMENT ON COLUMN tracking_general.plate IS 'מס.רכב - Vehicle plate number';
COMMENT ON COLUMN tracking_general.manufacturer IS 'שם היצרן - Manufacturer name';
COMMENT ON COLUMN tracking_general.year_of_manufacture IS 'שנת ייצור - Year of manufacture';
COMMENT ON COLUMN tracking_general.vehicle_value IS 'ערך הרכב - Vehicle value';
COMMENT ON COLUMN tracking_general.owner_name IS 'שם בעל הרכב - Owner name';
COMMENT ON COLUMN tracking_general.phone IS 'טלפון - Phone number';
COMMENT ON COLUMN tracking_general.garage IS 'מוסך - Garage name';
COMMENT ON COLUMN tracking_general.garage_phone IS 'טלפון מוסך - Garage phone';
COMMENT ON COLUMN tracking_general.email IS 'E-mail';
COMMENT ON COLUMN tracking_general.directive IS 'דירקטיבה - Directive/instructions';
COMMENT ON COLUMN tracking_general.photos_available IS 'תמונות - Photos available';
COMMENT ON COLUMN tracking_general.photo_count IS 'מס\' תמונות - Number of photos';
COMMENT ON COLUMN tracking_general.invoice_received IS 'התקבלה חשבונית - Invoice received';
COMMENT ON COLUMN tracking_general.payment_received IS 'התקבל תשלום - Payment received';
COMMENT ON COLUMN tracking_general.case_in_claim IS 'תיק בתביעה - Case in claim/litigation';
COMMENT ON COLUMN tracking_general.general_status IS 'סטטוס כללי - General status';
COMMENT ON COLUMN tracking_general.general_notes IS 'הערות כלליות - General notes';
COMMENT ON COLUMN tracking_general.case_link IS 'לינק לתיק - Link to case file';
COMMENT ON COLUMN tracking_general.timestamp IS 'TimeStamp - Record timestamp';

-- =====================================================
-- Grant permissions
-- =====================================================

GRANT SELECT ON tracking_general TO authenticated;
GRANT INSERT, UPDATE ON tracking_general TO authenticated; -- Primarily via triggers
GRANT DELETE ON tracking_general TO authenticated; -- RLS policy restricts to admins

GRANT EXECUTE ON FUNCTION extract_tracking_general_from_helper(JSONB, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_tracking_general_from_helper(JSONB, UUID, TEXT) TO authenticated;

-- =====================================================
-- END OF SCRIPT
-- =====================================================
