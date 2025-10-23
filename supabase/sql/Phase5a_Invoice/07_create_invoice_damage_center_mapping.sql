-- Phase 5a Invoice Integration: Invoice to Damage Center Mapping Table
-- Session 74 - Task 1.7 (ADDED after reviewing Invoice Module Instructions)
-- Date: 2025-10-23
-- Purpose: Track mapping between invoice items and damage center fields

-- ============================================================================
-- CREATE INVOICE_DAMAGE_CENTER_MAPPING TABLE
-- ============================================================================

-- This table implements the workflow described in Invoice Module Instructions:
-- User selects an OCR item from invoice and maps it to a damage center field
-- This updates the field with invoice data (name, cost, description, etc.)

CREATE TABLE IF NOT EXISTS invoice_damage_center_mappings (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  invoice_line_id UUID REFERENCES invoice_lines(id) ON DELETE SET NULL,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  
  -- Damage center identification
  damage_center_id TEXT NOT NULL, -- e.g., "center_1", "center_2"
  damage_center_name TEXT, -- User-friendly name
  
  -- Field identification
  field_type TEXT NOT NULL, -- 'work', 'part', 'repair'
  field_index INTEGER, -- Position in the array (0-based)
  field_id TEXT, -- Unique identifier for the field if available
  
  -- Original field data (before mapping)
  original_field_data JSONB,
  
  -- Mapped invoice data (what was applied to the field)
  mapped_data JSONB, -- {name, description, serialNumber, costWithoutVat, quantity}
  
  -- Mapping metadata
  mapping_status TEXT DEFAULT 'active', -- active, replaced, removed
  is_user_modified BOOLEAN DEFAULT false, -- True if user edited after mapping
  user_modifications JSONB, -- Track what user changed after auto-fill
  
  -- Confidence and validation
  mapping_confidence NUMERIC(5,2), -- How confident we are in this mapping (0-100)
  validation_status TEXT DEFAULT 'pending', -- pending, validated, rejected
  
  -- User tracking
  mapped_by UUID REFERENCES profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Fast lookup by invoice
CREATE INDEX IF NOT EXISTS idx_invoice_dc_mappings_invoice_id 
ON invoice_damage_center_mappings(invoice_id);

-- Fast lookup by case
CREATE INDEX IF NOT EXISTS idx_invoice_dc_mappings_case_id 
ON invoice_damage_center_mappings(case_id);

-- Fast lookup by damage center
CREATE INDEX IF NOT EXISTS idx_invoice_dc_mappings_dc_id 
ON invoice_damage_center_mappings(damage_center_id);

-- Composite index for finding field mappings
CREATE INDEX IF NOT EXISTS idx_invoice_dc_mappings_dc_field 
ON invoice_damage_center_mappings(damage_center_id, field_type, field_index);

-- Filter by mapping status
CREATE INDEX IF NOT EXISTS idx_invoice_dc_mappings_status 
ON invoice_damage_center_mappings(mapping_status) 
WHERE mapping_status = 'active';

-- GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_invoice_dc_mappings_mapped_data_gin 
ON invoice_damage_center_mappings USING gin(mapped_data jsonb_path_ops);

-- ============================================================================
-- CREATE TRIGGER FOR UPDATED_AT
-- ============================================================================

DROP TRIGGER IF EXISTS update_invoice_dc_mappings_updated_at ON invoice_damage_center_mappings;
CREATE TRIGGER update_invoice_dc_mappings_updated_at
  BEFORE UPDATE ON invoice_damage_center_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE invoice_damage_center_mappings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view mappings for cases they have access to
CREATE POLICY "Users can view mappings for accessible cases"
  ON invoice_damage_center_mappings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cases c
      WHERE c.id = invoice_damage_center_mappings.case_id
      AND (
        c.created_by = auth.uid() OR
        auth.uid() IN (
          SELECT user_id FROM profiles WHERE role IN ('admin', 'developer')
        ) OR
        auth.uid() IN (
          SELECT collaborator_id FROM case_collaborators 
          WHERE case_id = c.id AND status = 'active'
        )
      )
    )
  );

-- Policy: Users can create mappings for their cases
CREATE POLICY "Users can create mappings for their cases"
  ON invoice_damage_center_mappings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cases c
      WHERE c.id = invoice_damage_center_mappings.case_id
      AND (
        c.created_by = auth.uid() OR
        auth.uid() IN (
          SELECT user_id FROM profiles WHERE role IN ('admin', 'developer')
        ) OR
        auth.uid() IN (
          SELECT collaborator_id FROM case_collaborators 
          WHERE case_id = c.id AND status = 'active'
        )
      )
    )
  );

-- Policy: Users can update mappings for their cases
CREATE POLICY "Users can update mappings for their cases"
  ON invoice_damage_center_mappings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM cases c
      WHERE c.id = invoice_damage_center_mappings.case_id
      AND (
        c.created_by = auth.uid() OR
        auth.uid() IN (
          SELECT user_id FROM profiles WHERE role IN ('admin', 'developer')
        ) OR
        auth.uid() IN (
          SELECT collaborator_id FROM case_collaborators 
          WHERE case_id = c.id AND status = 'active'
        )
      )
    )
  );

-- Policy: Users can delete mappings for their cases
CREATE POLICY "Users can delete mappings for their cases"
  ON invoice_damage_center_mappings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM cases c
      WHERE c.id = invoice_damage_center_mappings.case_id
      AND (
        c.created_by = auth.uid() OR
        auth.uid() IN (
          SELECT user_id FROM profiles WHERE role IN ('admin', 'developer')
        ) OR
        auth.uid() IN (
          SELECT collaborator_id FROM case_collaborators 
          WHERE case_id = c.id AND status = 'active'
        )
      )
    )
  );

-- ============================================================================
-- ENABLE REALTIME
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE invoice_damage_center_mappings;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Get all mappings for a damage center
CREATE OR REPLACE FUNCTION get_damage_center_mappings(
  p_case_id UUID,
  p_damage_center_id TEXT
)
RETURNS TABLE (
  id UUID,
  field_type TEXT,
  field_index INTEGER,
  mapped_data JSONB,
  is_user_modified BOOLEAN,
  mapping_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.field_type,
    m.field_index,
    m.mapped_data,
    m.is_user_modified,
    m.mapping_status
  FROM invoice_damage_center_mappings m
  WHERE m.case_id = p_case_id
  AND m.damage_center_id = p_damage_center_id
  AND m.mapping_status = 'active'
  ORDER BY m.field_type, m.field_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get unmapped invoice items (available for mapping)
CREATE OR REPLACE FUNCTION get_unmapped_invoice_items(p_invoice_id UUID)
RETURNS TABLE (
  line_id UUID,
  description TEXT,
  quantity NUMERIC,
  unit_price NUMERIC,
  line_total NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    il.id,
    il.description,
    il.quantity,
    il.unit_price,
    il.line_total
  FROM invoice_lines il
  WHERE il.invoice_id = p_invoice_id
  AND NOT EXISTS (
    SELECT 1 FROM invoice_damage_center_mappings m
    WHERE m.invoice_line_id = il.id
    AND m.mapping_status = 'active'
  )
  ORDER BY il.line_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Create mapping from invoice item to damage center field
CREATE OR REPLACE FUNCTION map_invoice_to_damage_center(
  p_invoice_id UUID,
  p_invoice_line_id UUID,
  p_case_id UUID,
  p_damage_center_id TEXT,
  p_field_type TEXT,
  p_field_index INTEGER,
  p_mapped_data JSONB,
  p_mapped_by UUID
)
RETURNS UUID AS $$
DECLARE
  v_mapping_id UUID;
BEGIN
  -- Deactivate any existing mapping for this field
  UPDATE invoice_damage_center_mappings
  SET mapping_status = 'replaced',
      updated_at = now()
  WHERE case_id = p_case_id
  AND damage_center_id = p_damage_center_id
  AND field_type = p_field_type
  AND field_index = p_field_index
  AND mapping_status = 'active';
  
  -- Create new mapping
  INSERT INTO invoice_damage_center_mappings (
    invoice_id,
    invoice_line_id,
    case_id,
    damage_center_id,
    field_type,
    field_index,
    mapped_data,
    mapping_status,
    mapped_by
  )
  VALUES (
    p_invoice_id,
    p_invoice_line_id,
    p_case_id,
    p_damage_center_id,
    p_field_type,
    p_field_index,
    p_mapped_data,
    'active',
    p_mapped_by
  )
  RETURNING id INTO v_mapping_id;
  
  RETURN v_mapping_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check table created
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_name = 'invoice_damage_center_mappings';

-- Check indexes
-- SELECT indexname FROM pg_indexes 
-- WHERE tablename = 'invoice_damage_center_mappings';

-- Check functions created
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_name LIKE '%damage_center%';

-- ============================================================================
-- NOTES - WORKFLOW IMPLEMENTATION
-- ============================================================================

-- This table implements the workflow from Invoice Module Instructions.md:
--
-- STEP 1: Upload invoice for OCR
--   - File uploaded to invoice_documents
--   - OCR data stored in ocr_structured_data
--
-- STEP 2: Receive webhook response
--   - Invoice lines created in invoice_lines table
--   - OCR items available for mapping
--
-- STEP 3: Prompt user to validate costs
--   - User reviews invoice_lines data
--
-- STEP 4: Opens editable damage centers iframe
--   - Iframe loads damage centers from helper
--   - Each center has works[], parts[], repairs[] arrays
--
-- STEP 5: User types one letter → dropdown shows OCR items
--   - Query unmapped items: get_unmapped_invoice_items()
--   - Filter by field_type (work/part/repair)
--   - Show auto-complete dropdown
--
-- STEP 6: User selects item → fields auto-populated
--   - Call: map_invoice_to_damage_center()
--   - mapped_data = {
--       name: item.description,
--       costWithoutVat: item.unit_price,
--       quantity: item.quantity,
--       description: item.description,
--       serialNumber: metadata.serial
--     }
--   - Field in damage center iframe updates
--
-- STEP 7: User can edit fields after auto-fill
--   - Set is_user_modified = true
--   - Store changes in user_modifications
--
-- STEP 8: User saves → updates helper.centers
--   - Query: get_damage_center_mappings()
--   - Apply all active mappings to helper
--   - Update only modified centers
--
-- STEP 9: Modified centers become source of truth
--   - helper.centers updated with invoice costs
--   - Original centers preserved if not modified
--
-- EXAMPLE MAPPING:
-- Invoice line: "תיקון פח דלת קדמית ימין - 350 ₪"
-- Mapped to: damage_center_1.works[2]
-- Result: {
--   name: "תיקון פח דלת קדמית ימין",
--   costWithoutVat: 350,
--   quantity: 1,
--   field updated from invoice
-- }
