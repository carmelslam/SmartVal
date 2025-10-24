-- =====================================================
-- Phase 9: Admin Hub Enhancement
-- Script 09: Additional Nicole Statistic Queries
-- Date: 2025-10-24
-- Session: 75
-- =====================================================
--
-- Purpose: Additional comprehensive statistic queries for Nicole smart assistant
-- Dependencies: All Phase 9 tables deployed
-- =====================================================

-- =====================================================
-- Function: Get payment statistics breakdown
-- =====================================================

CREATE OR REPLACE FUNCTION nicole_get_payment_statistics()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  result := jsonb_build_object(
    'total_payments', (SELECT COUNT(*) FROM payment_tracking),
    'total_fees', (SELECT COALESCE(SUM(total_fee), 0) FROM payment_tracking),
    'by_status', (
      SELECT jsonb_object_agg(payment_status, count)
      FROM (
        SELECT payment_status, COUNT(*) as count
        FROM payment_tracking
        GROUP BY payment_status
      ) s
    ),
    'overdue', (
      SELECT jsonb_build_object(
        'count', COUNT(*),
        'total_amount', COALESCE(SUM(total_fee), 0)
      )
      FROM payment_tracking
      WHERE payment_status = 'באיחור'
    ),
    'pending', (
      SELECT jsonb_build_object(
        'count', COUNT(*),
        'total_amount', COALESCE(SUM(total_fee), 0)
      )
      FROM payment_tracking
      WHERE payment_status = 'ממתין לתשלום'
    ),
    'paid', (
      SELECT jsonb_build_object(
        'count', COUNT(*),
        'total_amount', COALESCE(SUM(total_fee), 0)
      )
      FROM payment_tracking
      WHERE payment_status = 'שולם במלואו'
    ),
    'upcoming_week', (
      SELECT jsonb_build_object(
        'count', COUNT(*),
        'total_amount', COALESCE(SUM(total_fee), 0)
      )
      FROM payment_tracking
      WHERE expected_payment_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
        AND payment_status IN ('ממתין לתשלום', 'שולם חלקית')
    )
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Get garage statistics
-- =====================================================

CREATE OR REPLACE FUNCTION nicole_get_garage_statistics(limit_count INT DEFAULT 10)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  result := jsonb_build_object(
    'top_garages_by_cases', (
      SELECT jsonb_agg(garage_data ORDER BY case_count DESC)
      FROM (
        SELECT
          tg.garage,
          COUNT(*) as case_count,
          AVG(tg.vehicle_value) as avg_vehicle_value,
          COUNT(*) FILTER (WHERE tg.payment_received = true) as paid_count
        FROM tracking_general tg
        WHERE tg.garage IS NOT NULL
        GROUP BY tg.garage
        ORDER BY COUNT(*) DESC
        LIMIT limit_count
      ) garage_data
    ),
    'total_garages', (
      SELECT COUNT(DISTINCT garage)
      FROM tracking_general
      WHERE garage IS NOT NULL
    )
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Get manufacturer statistics
-- =====================================================

CREATE OR REPLACE FUNCTION nicole_get_manufacturer_statistics(limit_count INT DEFAULT 10)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  result := jsonb_build_object(
    'top_manufacturers', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'manufacturer', manufacturer,
          'case_count', case_count,
          'avg_vehicle_value', avg_vehicle_value,
          'total_damage_centers', total_damage_centers
        ) ORDER BY case_count DESC
      )
      FROM (
        SELECT
          tg.manufacturer,
          COUNT(DISTINCT tg.case_id) as case_count,
          AVG(tg.vehicle_value) as avg_vehicle_value,
          COALESCE(SUM(te.damage_center_count), 0) as total_damage_centers
        FROM tracking_general tg
        LEFT JOIN tracking_expertise te ON te.case_id = tg.case_id
        WHERE tg.manufacturer IS NOT NULL
        GROUP BY tg.manufacturer
        ORDER BY COUNT(DISTINCT tg.case_id) DESC
        LIMIT limit_count
      ) mfr_data
    ),
    'total_manufacturers', (
      SELECT COUNT(DISTINCT manufacturer)
      FROM tracking_general
      WHERE manufacturer IS NOT NULL
    )
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Get reminder statistics
-- =====================================================

CREATE OR REPLACE FUNCTION nicole_get_reminder_statistics()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  result := jsonb_build_object(
    'total_reminders', (SELECT COUNT(*) FROM reminders),
    'by_status', (
      SELECT jsonb_object_agg(status, count)
      FROM (
        SELECT status, COUNT(*) as count
        FROM reminders
        GROUP BY status
      ) s
    ),
    'by_category', (
      SELECT jsonb_object_agg(category, count)
      FROM (
        SELECT category, COUNT(*) as count
        FROM reminders
        GROUP BY category
      ) c
    ),
    'by_priority', (
      SELECT jsonb_object_agg(priority, count)
      FROM (
        SELECT priority, COUNT(*) as count
        FROM reminders
        GROUP BY priority
      ) p
    ),
    'overdue', (
      SELECT COUNT(*)
      FROM reminders
      WHERE due_date < CURRENT_DATE AND status = 'ממתין'
    ),
    'due_today', (
      SELECT COUNT(*)
      FROM reminders
      WHERE due_date = CURRENT_DATE AND status = 'ממתין'
    ),
    'due_this_week', (
      SELECT COUNT(*)
      FROM reminders
      WHERE due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
        AND status = 'ממתין'
    ),
    'urgent_pending', (
      SELECT COUNT(*)
      FROM reminders
      WHERE priority = 'דחוף' AND status = 'ממתין'
    )
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Get damage assessment statistics
-- =====================================================

CREATE OR REPLACE FUNCTION nicole_get_damage_statistics()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  result := jsonb_build_object(
    'total_cases_with_expertise', (
      SELECT COUNT(DISTINCT case_id) FROM tracking_expertise
    ),
    'total_damage_centers', (
      SELECT COUNT(*) FROM tracking_expertise
    ),
    'avg_damage_centers_per_case', (
      SELECT AVG(damage_center_count)::NUMERIC(10,2)
      FROM (
        SELECT case_id, COUNT(*) as damage_center_count
        FROM tracking_expertise
        GROUP BY case_id
      ) dc
    ),
    'most_common_damage_centers', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'damage_center', damage_center_name,
          'count', count
        ) ORDER BY count DESC
      )
      FROM (
        SELECT damage_center_name, COUNT(*) as count
        FROM tracking_expertise
        WHERE damage_center_name IS NOT NULL
        GROUP BY damage_center_name
        ORDER BY COUNT(*) DESC
        LIMIT 10
      ) dc
    )
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Get financial statistics (final reports)
-- =====================================================

CREATE OR REPLACE FUNCTION nicole_get_financial_statistics()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  result := jsonb_build_object(
    'total_reports', (SELECT COUNT(*) FROM tracking_final_report),
    'by_type', (
      SELECT jsonb_object_agg(report_type, count)
      FROM (
        SELECT report_type, COUNT(*) as count
        FROM tracking_final_report
        GROUP BY report_type
      ) rt
    ),
    'totals', (
      SELECT jsonb_build_object(
        'total_parts', COALESCE(SUM(total_parts), 0),
        'total_work', COALESCE(SUM(total_work), 0),
        'total_claims', COALESCE(SUM(claim_amount), 0),
        'total_depreciation', COALESCE(SUM(depreciation), 0),
        'total_compensation', COALESCE(SUM(final_compensation), 0)
      )
      FROM tracking_final_report
    ),
    'averages', (
      SELECT jsonb_build_object(
        'avg_parts', AVG(total_parts)::NUMERIC(10,2),
        'avg_work', AVG(total_work)::NUMERIC(10,2),
        'avg_claim', AVG(claim_amount)::NUMERIC(10,2),
        'avg_depreciation', AVG(depreciation)::NUMERIC(10,2),
        'avg_compensation', AVG(final_compensation)::NUMERIC(10,2)
      )
      FROM tracking_final_report
    )
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Get case status statistics
-- =====================================================

CREATE OR REPLACE FUNCTION nicole_get_case_status_statistics()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  result := jsonb_build_object(
    'total_cases', (SELECT COUNT(*) FROM cases),
    'by_status', (
      SELECT jsonb_object_agg(status, count)
      FROM (
        SELECT status, COUNT(*) as count
        FROM cases
        GROUP BY status
      ) s
    ),
    'with_tracking', (
      SELECT COUNT(DISTINCT tg.case_id)
      FROM tracking_general tg
    ),
    'with_expertise', (
      SELECT COUNT(DISTINCT te.case_id)
      FROM tracking_expertise te
    ),
    'with_final_report', (
      SELECT COUNT(DISTINCT tfr.case_id)
      FROM tracking_final_report tfr
    ),
    'with_payments', (
      SELECT COUNT(DISTINCT pt.case_id)
      FROM payment_tracking pt
    ),
    'with_reminders', (
      SELECT COUNT(DISTINCT r.case_id)
      FROM reminders r
    ),
    'created_last_30_days', (
      SELECT COUNT(*)
      FROM cases
      WHERE created_at > now() - INTERVAL '30 days'
    ),
    'updated_last_7_days', (
      SELECT COUNT(*)
      FROM cases
      WHERE updated_at > now() - INTERVAL '7 days'
    )
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Get comprehensive dashboard statistics
-- =====================================================

CREATE OR REPLACE FUNCTION nicole_get_dashboard_statistics()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  result := jsonb_build_object(
    'cases', nicole_get_case_status_statistics(),
    'payments', nicole_get_payment_statistics(),
    'reminders', nicole_get_reminder_statistics(),
    'damage', nicole_get_damage_statistics(),
    'financial', nicole_get_financial_statistics(),
    'generated_at', now()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Get time-based trends
-- =====================================================

CREATE OR REPLACE FUNCTION nicole_get_trends(days_back INT DEFAULT 30)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  result := jsonb_build_object(
    'cases_by_day', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', day::DATE,
          'count', count
        ) ORDER BY day
      )
      FROM (
        SELECT DATE_TRUNC('day', created_at) as day, COUNT(*) as count
        FROM cases
        WHERE created_at > now() - (days_back || ' days')::INTERVAL
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY day
      ) daily
    ),
    'payments_by_status_trend', (
      SELECT jsonb_object_agg(payment_status, count)
      FROM (
        SELECT payment_status, COUNT(*) as count
        FROM payment_tracking
        WHERE created_at > now() - (days_back || ' days')::INTERVAL
        GROUP BY payment_status
      ) ps
    ),
    'reminders_created_trend', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', day::DATE,
          'count', count
        ) ORDER BY day
      )
      FROM (
        SELECT DATE_TRUNC('day', created_at) as day, COUNT(*) as count
        FROM reminders
        WHERE created_at > now() - (days_back || ' days')::INTERVAL
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY day
      ) daily
    )
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON FUNCTION nicole_get_payment_statistics() IS 'Nicole: Comprehensive payment statistics including by status, overdue, upcoming';
COMMENT ON FUNCTION nicole_get_garage_statistics(INT) IS 'Nicole: Top garages by case count with statistics';
COMMENT ON FUNCTION nicole_get_manufacturer_statistics(INT) IS 'Nicole: Top manufacturers by case count';
COMMENT ON FUNCTION nicole_get_reminder_statistics() IS 'Nicole: Reminder statistics by status, category, priority';
COMMENT ON FUNCTION nicole_get_damage_statistics() IS 'Nicole: Damage assessment statistics';
COMMENT ON FUNCTION nicole_get_financial_statistics() IS 'Nicole: Financial statistics from final reports';
COMMENT ON FUNCTION nicole_get_case_status_statistics() IS 'Nicole: Case status breakdown and tracking coverage';
COMMENT ON FUNCTION nicole_get_dashboard_statistics() IS 'Nicole: Complete dashboard statistics (all stats combined)';
COMMENT ON FUNCTION nicole_get_trends(INT) IS 'Nicole: Time-based trends for cases, payments, reminders';

-- =====================================================
-- Grant permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION nicole_get_payment_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION nicole_get_garage_statistics(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION nicole_get_manufacturer_statistics(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION nicole_get_reminder_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION nicole_get_damage_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION nicole_get_financial_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION nicole_get_case_status_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION nicole_get_dashboard_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION nicole_get_trends(INT) TO authenticated;

-- =====================================================
-- Test queries (uncomment to test)
-- =====================================================

-- SELECT nicole_get_payment_statistics();
-- SELECT nicole_get_garage_statistics(10);
-- SELECT nicole_get_manufacturer_statistics(5);
-- SELECT nicole_get_reminder_statistics();
-- SELECT nicole_get_damage_statistics();
-- SELECT nicole_get_financial_statistics();
-- SELECT nicole_get_case_status_statistics();
-- SELECT nicole_get_dashboard_statistics();
-- SELECT nicole_get_trends(30);

-- =====================================================
-- END OF SCRIPT
-- =====================================================
