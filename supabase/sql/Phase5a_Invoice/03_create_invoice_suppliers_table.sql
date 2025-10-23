-- Phase 5a Invoice Integration: Invoice Suppliers Table
-- Session 74 - Task 1.3
-- Date: 2025-10-23
-- Purpose: Cache supplier information for auto-complete and analytics

-- ============================================================================
-- CREATE INVOICE_SUPPLIERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoice_suppliers (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Supplier information
  name TEXT NOT NULL UNIQUE,
  tax_id TEXT, -- Israeli ח.פ. or עוסק מורשה number
  business_number TEXT, -- מספר עסק
  
  -- Contact information
  address TEXT,
  city TEXT,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  
  -- Business details
  category TEXT, -- 'parts', 'labor', 'materials', 'services', 'towing', 'mixed'
  subcategory TEXT, -- More specific categorization
  is_preferred BOOLEAN DEFAULT false, -- Preferred supplier flag
  discount_rate NUMERIC(5,2), -- Default discount percentage
  payment_terms TEXT, -- e.g., 'net_30', 'net_60', 'cash'
  
  -- Statistics (auto-calculated)
  total_invoices INT DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  average_invoice_amount NUMERIC(10,2) DEFAULT 0,
  last_invoice_date DATE,
  
  -- Metadata
  metadata JSONB, -- Additional custom fields
  notes TEXT,
  
  -- User tracking
  created_by UUID REFERENCES profiles(user_id),
  updated_by UUID REFERENCES profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Fast lookup by name (for auto-complete)
CREATE INDEX idx_invoice_suppliers_name ON invoice_suppliers(name);

-- Fast lookup by name pattern (for search)
CREATE INDEX idx_invoice_suppliers_name_pattern ON invoice_suppliers USING gin(name gin_trgm_ops);

-- Filter by category
CREATE INDEX idx_invoice_suppliers_category ON invoice_suppliers(category);

-- Filter by preferred suppliers
CREATE INDEX idx_invoice_suppliers_preferred ON invoice_suppliers(is_preferred) WHERE is_preferred = true;

-- Sort by last invoice date
CREATE INDEX idx_invoice_suppliers_last_invoice ON invoice_suppliers(last_invoice_date DESC NULLS LAST);

-- ============================================================================
-- ENABLE TRIGRAM EXTENSION (for fuzzy search)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- CREATE TRIGGER FOR UPDATED_AT
-- ============================================================================

DROP TRIGGER IF EXISTS update_invoice_suppliers_updated_at ON invoice_suppliers;
CREATE TRIGGER update_invoice_suppliers_updated_at
  BEFORE UPDATE ON invoice_suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE invoice_suppliers ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view suppliers
CREATE POLICY "All users can view suppliers"
  ON invoice_suppliers
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: All authenticated users can create suppliers
CREATE POLICY "All users can create suppliers"
  ON invoice_suppliers
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: All authenticated users can update suppliers
CREATE POLICY "All users can update suppliers"
  ON invoice_suppliers
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Policy: Only admins/developers can delete suppliers
CREATE POLICY "Admins can delete suppliers"
  ON invoice_suppliers
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role IN ('admin', 'developer')
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Search suppliers by name (fuzzy matching)
CREATE OR REPLACE FUNCTION search_suppliers(search_term TEXT, result_limit INT DEFAULT 10)
RETURNS TABLE (
  id UUID,
  name TEXT,
  category TEXT,
  phone TEXT,
  email TEXT,
  is_preferred BOOLEAN,
  total_invoices INT,
  similarity_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.category,
    s.phone,
    s.email,
    s.is_preferred,
    s.total_invoices,
    similarity(s.name, search_term) as similarity_score
  FROM invoice_suppliers s
  WHERE s.name % search_term -- Uses trigram similarity
  ORDER BY similarity_score DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update supplier statistics
CREATE OR REPLACE FUNCTION update_supplier_statistics(p_supplier_name TEXT)
RETURNS VOID AS $$
DECLARE
  v_total_invoices INT;
  v_total_amount NUMERIC(12,2);
  v_avg_amount NUMERIC(10,2);
  v_last_date DATE;
BEGIN
  -- Calculate statistics from invoices table
  SELECT 
    COUNT(*),
    COALESCE(SUM(total_amount), 0),
    COALESCE(AVG(total_amount), 0),
    MAX(issue_date)
  INTO v_total_invoices, v_total_amount, v_avg_amount, v_last_date
  FROM invoices
  WHERE supplier_name = p_supplier_name;
  
  -- Update supplier record
  UPDATE invoice_suppliers
  SET 
    total_invoices = v_total_invoices,
    total_amount = v_total_amount,
    average_invoice_amount = v_avg_amount,
    last_invoice_date = v_last_date,
    updated_at = now()
  WHERE name = p_supplier_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Auto-create supplier from invoice
CREATE OR REPLACE FUNCTION auto_create_supplier_if_not_exists(
  p_supplier_name TEXT,
  p_category TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_supplier_id UUID;
BEGIN
  -- Check if supplier already exists
  SELECT id INTO v_supplier_id
  FROM invoice_suppliers
  WHERE name = p_supplier_name;
  
  -- If not exists, create new supplier
  IF v_supplier_id IS NULL THEN
    INSERT INTO invoice_suppliers (name, category, created_by)
    VALUES (p_supplier_name, p_category, p_created_by)
    RETURNING id INTO v_supplier_id;
  END IF;
  
  RETURN v_supplier_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: AUTO-UPDATE SUPPLIER STATS WHEN INVOICE CHANGES
-- ============================================================================

-- Function to update supplier stats when invoice changes
CREATE OR REPLACE FUNCTION trigger_update_supplier_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update stats for the supplier mentioned in the invoice
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM update_supplier_statistics(NEW.supplier_name);
  END IF;
  
  -- If supplier name changed, update old supplier too
  IF TG_OP = 'UPDATE' AND OLD.supplier_name <> NEW.supplier_name THEN
    PERFORM update_supplier_statistics(OLD.supplier_name);
  END IF;
  
  -- If invoice deleted, update stats
  IF TG_OP = 'DELETE' THEN
    PERFORM update_supplier_statistics(OLD.supplier_name);
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on invoices table
DROP TRIGGER IF EXISTS update_supplier_stats_on_invoice_change ON invoices;
CREATE TRIGGER update_supplier_stats_on_invoice_change
  AFTER INSERT OR UPDATE OR DELETE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_supplier_stats();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check table created
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'invoice_suppliers';

-- Check indexes
-- SELECT indexname FROM pg_indexes WHERE tablename = 'invoice_suppliers';

-- Test fuzzy search
-- SELECT * FROM search_suppliers('מוסך', 5);

-- ============================================================================
-- NOTES
-- ============================================================================

-- This table caches supplier information for:
-- 1. Auto-complete in invoice forms
-- 2. Analytics and reporting
-- 3. Supplier performance tracking
-- 4. Preferred supplier management
--
-- WORKFLOW:
-- 1. When invoice created with supplier_name, auto-create supplier if not exists
-- 2. Statistics auto-updated when invoices change (via trigger)
-- 3. UI can query search_suppliers() for auto-complete
-- 4. Mark preferred suppliers for quick access
--
-- FUZZY SEARCH:
-- Uses PostgreSQL trigram extension (pg_trgm) for typo-tolerant search
-- Example: searching "מוסך" will match "מוסך דוד", "מוסך הכל", etc.
