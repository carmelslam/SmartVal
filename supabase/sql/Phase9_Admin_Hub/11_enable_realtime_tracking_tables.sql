-- =====================================================
-- Phase 9: Admin Hub Enhancement
-- Script 11: Enable Realtime Subscriptions
-- Date: 2025-10-24
-- Session: 75
-- =====================================================
--
-- Purpose: Enable Supabase Realtime for all Phase 9 tracking tables
-- Dependencies:
--   - Requires: All Phase 9 tables created
-- Integration: Enables live updates in admin dashboard
-- =====================================================

-- =====================================================
-- Enable Realtime for payment_tracking
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE payment_tracking;

COMMENT ON TABLE payment_tracking IS 'REALTIME ENABLED: Fee tracking and payment management (Phase 9)';

-- =====================================================
-- Enable Realtime for tracking_general
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE tracking_general;

COMMENT ON TABLE tracking_general IS 'REALTIME ENABLED: General case tracking for Nicole and Make.com (Phase 9)';

-- =====================================================
-- Enable Realtime for tracking_expertise
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE tracking_expertise;

COMMENT ON TABLE tracking_expertise IS 'REALTIME ENABLED: Expertise/damage assessment tracking (Phase 9)';

-- =====================================================
-- Enable Realtime for tracking_final_report
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE tracking_final_report;

COMMENT ON TABLE tracking_final_report IS 'REALTIME ENABLED: Final report/estimate tracking (Phase 9)';

-- =====================================================
-- Enable Realtime for reminders
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE reminders;

COMMENT ON TABLE reminders IS 'REALTIME ENABLED: Reminders system for payments and follow-ups (Phase 9)';

-- =====================================================
-- Verification: Check which tables have Realtime enabled
-- =====================================================

-- Uncomment to verify Realtime is enabled
-- SELECT schemaname, tablename
-- FROM pg_publication_tables
-- WHERE pubname = 'supabase_realtime'
-- AND tablename IN (
--   'payment_tracking',
--   'tracking_general',
--   'tracking_expertise',
--   'tracking_final_report',
--   'reminders'
-- );

-- =====================================================
-- Realtime Configuration Notes
-- =====================================================

/*
  REALTIME SUBSCRIPTION EXAMPLES FOR CLIENT-SIDE:

  1. Subscribe to payment tracking updates:
  ```javascript
  const paymentSubscription = supabase
    .channel('payment-changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'payment_tracking' },
      (payload) => {
        console.log('Payment update:', payload);
        // Update UI
      }
    )
    .subscribe();
  ```

  2. Subscribe to reminders updates:
  ```javascript
  const reminderSubscription = supabase
    .channel('reminder-changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'reminders',
        filter: 'status=eq.ממתין' },
      (payload) => {
        console.log('New pending reminder:', payload);
        // Show notification
      }
    )
    .subscribe();
  ```

  3. Subscribe to tracking_general updates:
  ```javascript
  const trackingSubscription = supabase
    .channel('tracking-changes')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'tracking_general' },
      (payload) => {
        console.log('New tracking record:', payload);
        // Update dashboard
      }
    )
    .subscribe();
  ```

  4. Subscribe to specific plate updates:
  ```javascript
  const plateSubscription = supabase
    .channel('plate-12345678')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'tracking_general',
        filter: 'plate=eq.12345678' },
      (payload) => {
        console.log('Plate 12345678 updated:', payload);
      }
    )
    .subscribe();
  ```

  EVENTS:
  - 'INSERT': New records
  - 'UPDATE': Updated records
  - 'DELETE': Deleted records
  - '*': All events

  UNSUBSCRIBE:
  ```javascript
  supabase.removeChannel(subscriptionChannel);
  ```
*/

-- =====================================================
-- Helper function: Get Realtime table status
-- =====================================================

CREATE OR REPLACE FUNCTION get_realtime_tables()
RETURNS TABLE (
  table_name TEXT,
  realtime_enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.tablename::TEXT,
    EXISTS (
      SELECT 1
      FROM pg_publication_tables pt
      WHERE pt.pubname = 'supabase_realtime'
      AND pt.tablename = t.tablename
    ) as realtime_enabled
  FROM pg_tables t
  WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'payment_tracking',
    'tracking_general',
    'tracking_expertise',
    'tracking_final_report',
    'reminders',
    'cases',
    'case_helper'
  )
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_realtime_tables() IS 'Check which Phase 9 tables have Realtime enabled';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_realtime_tables() TO authenticated;

-- =====================================================
-- Performance Recommendations for Realtime
-- =====================================================

/*
  PERFORMANCE TIPS:

  1. Use filters to reduce data transfer:
     - Filter by plate, case_id, or status
     - Only subscribe to relevant data

  2. Limit subscription scope:
     - Subscribe to specific tables, not all
     - Use specific event types (INSERT vs *)

  3. Debounce rapid updates:
     - Group multiple updates in UI
     - Use throttling for high-frequency changes

  4. Unsubscribe when not needed:
     - Remove subscriptions on page/component unmount
     - Prevents memory leaks

  5. Handle connection state:
     - Monitor subscription status
     - Reconnect on network issues

  6. Batch UI updates:
     - Don't update DOM on every change
     - Use requestAnimationFrame for smooth updates

  EXAMPLE OPTIMIZED SUBSCRIPTION:
  ```javascript
  let updateTimeout;
  const subscription = supabase
    .channel('optimized-tracking')
    .on('postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'tracking_general',
        filter: `plate=eq.${currentPlate}`
      },
      (payload) => {
        // Debounce updates
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
          updateDashboard(payload.new);
        }, 500);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Connected to real-time updates');
      }
    });
  ```
*/

-- =====================================================
-- Verification Query
-- =====================================================

-- Run this to verify all tables are enabled
SELECT * FROM get_realtime_tables();

-- =====================================================
-- END OF SCRIPT
-- =====================================================
