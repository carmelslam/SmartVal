# Phase 9: Admin Hub Enhancement & Supabase Integration - SQL Scripts

**Phase:** 9
**Date:** 2025-10-24
**Session:** 75
**Status:** Planning Complete

---

## Overview

This folder contains all SQL scripts for Phase 9 of the Supabase Migration Project, focusing on Admin Hub enhancement and integration.

---

## SQL Scripts (Execution Order)

### 1. Payment & Tracking Tables

**01_create_payment_tracking_table.sql**
- Creates `payment_tracking` table
- Fee tracking per case ID
- Payment status management
- User tracking fields (created_by, updated_by)
- RLS policies for organization-based access

**02_create_tracking_general_table.sql**
- Creates `tracking_general` table
- 21 columns as specified by user
- General case tracking for Nicole and Make.com
- Indexes for performance

**03_create_tracking_expertise_table.sql**
- Creates `tracking_expertise` table
- Expertise/damage assessment tracking
- 10 columns for damage centers and planned work

**04_create_tracking_final_report_table.sql**
- Creates `tracking_final_report` table
- Final report and estimate tracking
- 10 columns for actual repairs and compensation

---

### 2. Reminders & Admin Functions

**05_create_reminders_table.sql**
- Creates `reminders` table
- Categories: payment, follow-up, etc.
- Due date tracking and notifications
- Status management (pending, completed, overdue)

---

### 3. Health Check & Analytics

**06_create_health_check_functions.sql**
- SQL functions for system health metrics
- Case health checks
- Data integrity validation
- Performance monitoring
- User activity statistics

**09_create_analytics_views.sql**
- Materialized views for dashboard metrics
- Cases per month aggregation
- Payment collection rates
- User productivity metrics
- Top garages by volume

---

### 4. Automation & Integration

**07_create_tracking_update_triggers.sql**
- Trigger functions for auto-update
- Extracts data from helper JSON
- Updates tracking tables on helper save
- Maintains timestamp history

**08_create_nicole_query_functions.sql**
- SQL functions for Nicole queries
- Full-text search across tables
- Fuzzy plate number matching
- Query optimization

---

### 5. Indexes, RLS & Realtime

**10_create_indexes_and_rls.sql**
- Performance indexes on all Phase 9 tables
- Row Level Security policies
- Organization-based access control
- Admin override permissions

**11_enable_realtime_tracking_tables.sql**
- Enables Supabase Realtime on tracking tables
- Real-time updates for admin dashboard
- Notification subscriptions

---

## Execution Instructions

### Prerequisites
- Phase 4, 5, 5a, and 6 must be completed
- Supabase project must be active
- Service role access required

### Execution Order
Run scripts in numerical order (01 through 11) via:
1. Supabase Dashboard > SQL Editor
2. OR Supabase CLI: `supabase db push`

### Rollback
If needed, each script has a corresponding rollback section at the bottom (commented out)

---

## Tables Created

1. `payment_tracking` - Fee and payment tracking
2. `tracking_general` - General case tracking (21 columns)
3. `tracking_expertise` - Expertise tracking (10 columns)
4. `tracking_final_report` - Final report tracking (10 columns)
5. `reminders` - Reminder system

---

## Functions Created

### Health Check Functions
- `get_case_health_stats()` - Case health metrics
- `get_data_integrity_stats()` - Data integrity checks
- `get_performance_stats()` - Performance metrics
- `get_user_activity_stats()` - User activity tracking
- `check_orphaned_cases()` - Cases without helpers
- `check_version_conflicts()` - Version inconsistencies

### Nicole Query Functions
- `search_cases_full_text(query TEXT)` - Full-text case search
- `search_tracking_data(criteria JSONB)` - Tracking table search
- `get_payment_status(plate TEXT)` - Payment status lookup
- `fuzzy_plate_match(plate TEXT)` - Fuzzy plate number search

### Analytics Functions
- `get_cases_per_month(months INT)` - Cases trend
- `get_payment_collection_rate()` - Payment statistics
- `get_top_garages(limit INT)` - Garage rankings

---

## Views Created

1. `v_case_summary` - Case overview with stats
2. `v_payment_overview` - Payment tracking summary
3. `v_tracking_dashboard` - Combined tracking data
4. `v_user_productivity` - User activity metrics

---

## Triggers Created

1. `trg_update_tracking_general` - Auto-update general tracking
2. `trg_update_tracking_expertise` - Auto-update expertise tracking
3. `trg_update_tracking_final_report` - Auto-update final report tracking
4. `trg_payment_overdue_alert` - Generate overdue payment alerts
5. `trg_reminder_notification` - Send reminder notifications

---

## RLS Policies

### payment_tracking
- `payment_tracking_select_policy` - Users can view org payments
- `payment_tracking_insert_policy` - Authenticated users can insert
- `payment_tracking_update_policy` - Users can update own org
- `payment_tracking_delete_policy` - Admins only

### tracking_general, tracking_expertise, tracking_final_report
- `tracking_select_policy` - All authenticated users can view
- `tracking_insert_policy` - System auto-insert only
- `tracking_update_policy` - System auto-update only

### reminders
- `reminders_select_policy` - Users can view own org reminders
- `reminders_insert_policy` - Users can create reminders
- `reminders_update_policy` - Users can update own reminders
- `reminders_delete_policy` - Users can delete own reminders

---

## Indexes

### payment_tracking
- `idx_payment_tracking_plate`
- `idx_payment_tracking_case_id`
- `idx_payment_tracking_status`
- `idx_payment_tracking_expected_date`

### tracking_general
- `idx_tracking_general_plate`
- `idx_tracking_general_case_id`
- `idx_tracking_general_timestamp`

### tracking_expertise
- `idx_tracking_expertise_plate`
- `idx_tracking_expertise_case_id`

### tracking_final_report
- `idx_tracking_final_report_plate`
- `idx_tracking_final_report_case_id`

### reminders
- `idx_reminders_case_id`
- `idx_reminders_due_date`
- `idx_reminders_status`
- `idx_reminders_created_by`

---

## Realtime Subscriptions

All Phase 9 tables are enabled for Realtime:
- `payment_tracking`
- `tracking_general`
- `tracking_expertise`
- `tracking_final_report`
- `reminders`

Admins can subscribe to real-time updates for live dashboard

---

## Testing Checklist

After executing all scripts:

- [ ] Verify all tables exist in Supabase dashboard
- [ ] Test INSERT on payment_tracking
- [ ] Verify RLS policies (try as different users)
- [ ] Test health check functions return data
- [ ] Verify triggers fire on helper save
- [ ] Test Nicole query functions with sample data
- [ ] Verify Realtime subscriptions work
- [ ] Test analytics views return correct data
- [ ] Verify indexes exist (check query performance)
- [ ] Test Make.com API access to tracking tables

---

## Notes

- All tables include `created_at` and `updated_at` timestamps
- User tracking fields: `created_by`, `updated_by` (UUID references to profiles)
- All text fields support Hebrew (UTF-8)
- RTL compatibility maintained
- Timestamps use TIMESTAMPTZ (timezone-aware)

---

## Related Files

- **Plan:** `/home/user/SmartVal/todo.md`
- **Session Log:** `/home/user/SmartVal/supabase migration/SESSION_75_PHASE9_ADMIN_HUB.md`
- **Project Doc:** `/home/user/SmartVal/supabase migration/SUPABASE_MIGRATION_PROJECT.md`

---

**Status:** Ready for SQL script creation

**Next Step:** Write individual SQL scripts (01 through 11)
