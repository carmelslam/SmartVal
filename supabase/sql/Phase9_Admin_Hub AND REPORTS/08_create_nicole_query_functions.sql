-- =====================================================
-- Phase 9: Admin Hub Enhancement
-- Script 08: Nicole Query Functions
-- Date: 2025-10-24
-- Session: 75
-- =====================================================
--
-- Purpose: Create query functions for Nicole smart assistant
-- Dependencies:
--   - Requires: All tracking tables
--   - Requires: cases, case_helper, payment_tracking, reminders
-- Nicole Integration: Enable Nicole to query Supabase data
-- =====================================================

-- =====================================================
-- Function: Full-text search across all data
-- =====================================================

CREATE OR REPLACE FUNCTION nicole_search_all(search_query TEXT)
RETURNS TABLE (
  source TEXT,
  case_id UUID,
  plate TEXT,
  title TEXT,
  description TEXT,
  relevance REAL,
  data JSONB
) AS $$
BEGIN
  RETURN QUERY
  -- Search in cases
  SELECT
    'case'::TEXT as source,
    c.id as case_id,
    c.plate,
    'תיק: ' || c.plate as title,
    c.owner_name as description,
    1.0::REAL as relevance,
    jsonb_build_object(
      'id', c.id,
      'plate', c.plate,
      'owner_name', c.owner_name,
      'status', c.status,
      'created_at', c.created_at
    ) as data
  FROM cases c
  WHERE c.plate ILIKE '%' || search_query || '%'
     OR c.owner_name ILIKE '%' || search_query || '%'

  UNION ALL

  -- Search in tracking_general
  SELECT
    'tracking_general'::TEXT as source,
    tg.case_id,
    tg.plate,
    'מידע כללי: ' || tg.plate as title,
    tg.general_notes as description,
    0.9::REAL as relevance,
    jsonb_build_object(
      'plate', tg.plate,
      'owner_name', tg.owner_name,
      'manufacturer', tg.manufacturer,
      'garage', tg.garage,
      'general_status', tg.general_status,
      'vehicle_value', tg.vehicle_value
    ) as data
  FROM tracking_general tg
  WHERE tg.plate ILIKE '%' || search_query || '%'
     OR tg.owner_name ILIKE '%' || search_query || '%'
     OR tg.manufacturer ILIKE '%' || search_query || '%'
     OR tg.garage ILIKE '%' || search_query || '%'

  UNION ALL

  -- Search in payment_tracking
  SELECT
    'payment_tracking'::TEXT as source,
    pt.case_id,
    pt.plate,
    'תשלום: ' || pt.plate as title,
    'סטטוס: ' || pt.payment_status as description,
    0.8::REAL as relevance,
    jsonb_build_object(
      'plate', pt.plate,
      'owner_name', pt.owner_name,
      'total_fee', pt.total_fee,
      'payment_status', pt.payment_status,
      'expected_payment_date', pt.expected_payment_date
    ) as data
  FROM payment_tracking pt
  WHERE pt.plate ILIKE '%' || search_query || '%'
     OR pt.owner_name ILIKE '%' || search_query || '%'

  UNION ALL

  -- Search in reminders
  SELECT
    'reminder'::TEXT as source,
    r.case_id,
    r.plate,
    'תזכורת: ' || r.title as title,
    r.description as description,
    0.7::REAL as relevance,
    jsonb_build_object(
      'plate', r.plate,
      'title', r.title,
      'category', r.category,
      'due_date', r.due_date,
      'status', r.status,
      'priority', r.priority
    ) as data
  FROM reminders r
  WHERE r.plate ILIKE '%' || search_query || '%'
     OR r.title ILIKE '%' || search_query || '%'
     OR r.description ILIKE '%' || search_query || '%'

  ORDER BY relevance DESC, case_id DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Fuzzy plate number matching
-- =====================================================

CREATE OR REPLACE FUNCTION nicole_fuzzy_plate_search(plate_input TEXT)
RETURNS TABLE (
  case_id UUID,
  plate TEXT,
  owner_name TEXT,
  status TEXT,
  last_update TIMESTAMPTZ,
  similarity_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id as case_id,
    c.plate,
    c.owner_name,
    c.status,
    c.updated_at as last_update,
    1.0::REAL as similarity_score
  FROM cases c
  WHERE c.plate ILIKE '%' || plate_input || '%'
  ORDER BY c.updated_at DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Get complete case data for Nicole
-- =====================================================

CREATE OR REPLACE FUNCTION nicole_get_case_details(plate_input TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  case_data JSONB;
  tracking_data JSONB;
  payment_data JSONB;
  reminders_data JSONB;
  expertise_data JSONB;
BEGIN
  -- Get case data
  SELECT jsonb_build_object(
    'id', c.id,
    'plate', c.plate,
    'owner_name', c.owner_name,
    'status', c.status,
    'created_at', c.created_at,
    'updated_at', c.updated_at
  )
  INTO case_data
  FROM cases c
  WHERE c.plate = plate_input
  LIMIT 1;

  -- Get tracking_general data
  SELECT jsonb_build_object(
    'manufacturer', tg.manufacturer,
    'year', tg.year_of_manufacture,
    'vehicle_value', tg.vehicle_value,
    'garage', tg.garage,
    'phone', tg.phone,
    'email', tg.email,
    'general_status', tg.general_status,
    'photo_count', tg.photo_count,
    'invoice_received', tg.invoice_received,
    'payment_received', tg.payment_received
  )
  INTO tracking_data
  FROM tracking_general tg
  WHERE tg.plate = plate_input
  LIMIT 1;

  -- Get payment data
  SELECT jsonb_agg(
    jsonb_build_object(
      'total_fee', pt.total_fee,
      'payment_status', pt.payment_status,
      'expected_payment_date', pt.expected_payment_date,
      'garage', pt.garage,
      'agent', pt.agent
    )
  )
  INTO payment_data
  FROM payment_tracking pt
  WHERE pt.plate = plate_input;

  -- Get reminders
  SELECT jsonb_agg(
    jsonb_build_object(
      'title', r.title,
      'category', r.category,
      'due_date', r.due_date,
      'status', r.status,
      'priority', r.priority
    )
  )
  INTO reminders_data
  FROM reminders r
  WHERE r.plate = plate_input;

  -- Get expertise data
  SELECT jsonb_agg(
    jsonb_build_object(
      'damage_center', te.damage_center_name,
      'description', te.description,
      'planned_repairs', te.planned_repairs
    )
  )
  INTO expertise_data
  FROM tracking_expertise te
  WHERE te.plate = plate_input;

  -- Build complete result
  result := jsonb_build_object(
    'case', COALESCE(case_data, '{}'::JSONB),
    'tracking', COALESCE(tracking_data, '{}'::JSONB),
    'payments', COALESCE(payment_data, '[]'::JSONB),
    'reminders', COALESCE(reminders_data, '[]'::JSONB),
    'expertise', COALESCE(expertise_data, '[]'::JSONB)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Get payment status for Nicole
-- =====================================================

CREATE OR REPLACE FUNCTION nicole_get_payment_status(plate_input TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'plate', pt.plate,
      'owner_name', pt.owner_name,
      'total_fee', pt.total_fee,
      'payment_status', pt.payment_status,
      'expected_payment_date', pt.expected_payment_date,
      'days_until_due', (pt.expected_payment_date - CURRENT_DATE),
      'is_overdue', (pt.expected_payment_date < CURRENT_DATE),
      'notes', pt.notes
    )
  )
  INTO result
  FROM payment_tracking pt
  WHERE pt.plate = plate_input
  ORDER BY pt.expected_payment_date DESC;

  RETURN COALESCE(result, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Get active reminders for Nicole
-- =====================================================

CREATE OR REPLACE FUNCTION nicole_get_reminders(
  plate_input TEXT DEFAULT NULL,
  status_filter TEXT DEFAULT 'ממתין'
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', r.id,
      'plate', r.plate,
      'title', r.title,
      'description', r.description,
      'category', r.category,
      'due_date', r.due_date,
      'status', r.status,
      'priority', r.priority,
      'days_until_due', (r.due_date - CURRENT_DATE),
      'is_overdue', (r.due_date < CURRENT_DATE AND r.status = 'ממתין')
    ) ORDER BY r.due_date ASC
  )
  INTO result
  FROM reminders r
  WHERE (plate_input IS NULL OR r.plate = plate_input)
    AND (status_filter IS NULL OR r.status = status_filter);

  RETURN COALESCE(result, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Search tracking data for Nicole
-- =====================================================

CREATE OR REPLACE FUNCTION nicole_search_tracking(
  search_term TEXT,
  search_field TEXT DEFAULT 'all'
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'plate', tg.plate,
      'owner_name', tg.owner_name,
      'manufacturer', tg.manufacturer,
      'garage', tg.garage,
      'general_status', tg.general_status,
      'vehicle_value', tg.vehicle_value,
      'phone', tg.phone,
      'email', tg.email
    )
  )
  INTO result
  FROM tracking_general tg
  WHERE CASE search_field
    WHEN 'plate' THEN tg.plate ILIKE '%' || search_term || '%'
    WHEN 'owner' THEN tg.owner_name ILIKE '%' || search_term || '%'
    WHEN 'garage' THEN tg.garage ILIKE '%' || search_term || '%'
    WHEN 'manufacturer' THEN tg.manufacturer ILIKE '%' || search_term || '%'
    ELSE (
      tg.plate ILIKE '%' || search_term || '%' OR
      tg.owner_name ILIKE '%' || search_term || '%' OR
      tg.garage ILIKE '%' || search_term || '%' OR
      tg.manufacturer ILIKE '%' || search_term || '%'
    )
  END
  LIMIT 20;

  RETURN COALESCE(result, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Get statistics for Nicole
-- =====================================================

CREATE OR REPLACE FUNCTION nicole_get_statistics()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  result := jsonb_build_object(
    'total_cases', (SELECT COUNT(*) FROM cases),
    'open_cases', (SELECT COUNT(*) FROM cases WHERE status = 'OPEN'),
    'total_payments_pending', (SELECT COUNT(*) FROM payment_tracking WHERE payment_status = 'ממתין לתשלום'),
    'total_overdue_payments', (SELECT COUNT(*) FROM payment_tracking WHERE payment_status = 'באיחור'),
    'total_reminders_pending', (SELECT COUNT(*) FROM reminders WHERE status = 'ממתין'),
    'total_overdue_reminders', (SELECT COUNT(*) FROM reminders WHERE status = 'באיחור'),
    'cases_with_tracking', (SELECT COUNT(DISTINCT case_id) FROM tracking_general),
    'total_damage_centers', (SELECT COUNT(*) FROM tracking_expertise),
    'last_update', (SELECT MAX(updated_at) FROM cases)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Get recent activity for Nicole
-- =====================================================

CREATE OR REPLACE FUNCTION nicole_get_recent_activity(days_back INT DEFAULT 7)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  cutoff_date TIMESTAMPTZ;
BEGIN
  cutoff_date := now() - (days_back || ' days')::INTERVAL;

  SELECT jsonb_build_object(
    'new_cases', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'plate', c.plate,
          'owner_name', c.owner_name,
          'created_at', c.created_at
        ) ORDER BY c.created_at DESC
      )
      FROM cases c
      WHERE c.created_at > cutoff_date
      LIMIT 10
    ),
    'updated_cases', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'plate', c.plate,
          'owner_name', c.owner_name,
          'updated_at', c.updated_at
        ) ORDER BY c.updated_at DESC
      )
      FROM cases c
      WHERE c.updated_at > cutoff_date
      LIMIT 10
    ),
    'upcoming_reminders', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'plate', r.plate,
          'title', r.title,
          'due_date', r.due_date
        ) ORDER BY r.due_date ASC
      )
      FROM reminders r
      WHERE r.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + (days_back || ' days')::INTERVAL
        AND r.status = 'ממתין'
      LIMIT 10
    )
  )
  INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON FUNCTION nicole_search_all(TEXT) IS 'Nicole: Full-text search across all data sources';
COMMENT ON FUNCTION nicole_fuzzy_plate_search(TEXT) IS 'Nicole: Fuzzy matching for plate numbers';
COMMENT ON FUNCTION nicole_get_case_details(TEXT) IS 'Nicole: Get complete case data including all tracking';
COMMENT ON FUNCTION nicole_get_payment_status(TEXT) IS 'Nicole: Get payment status for a plate';
COMMENT ON FUNCTION nicole_get_reminders(TEXT, TEXT) IS 'Nicole: Get reminders with optional filters';
COMMENT ON FUNCTION nicole_search_tracking(TEXT, TEXT) IS 'Nicole: Search tracking data by field';
COMMENT ON FUNCTION nicole_get_statistics() IS 'Nicole: Get system-wide statistics';
COMMENT ON FUNCTION nicole_get_recent_activity(INT) IS 'Nicole: Get recent activity (default 7 days)';

-- =====================================================
-- Grant permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION nicole_search_all(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION nicole_fuzzy_plate_search(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION nicole_get_case_details(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION nicole_get_payment_status(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION nicole_get_reminders(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION nicole_search_tracking(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION nicole_get_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION nicole_get_recent_activity(INT) TO authenticated;

-- =====================================================
-- Test queries (uncomment to test)
-- =====================================================

-- Test full search
-- SELECT * FROM nicole_search_all('12345678');

-- Test case details
-- SELECT nicole_get_case_details('12345678');

-- Test payment status
-- SELECT nicole_get_payment_status('12345678');

-- Test statistics
-- SELECT nicole_get_statistics();

-- Test recent activity
-- SELECT nicole_get_recent_activity(7);

-- =====================================================
-- END OF SCRIPT
-- =====================================================
