-- ============================================================================
-- CHECK CURRENT STATE - What's Deployed in Supabase
-- Date: 2025-10-05 Session 6
-- Purpose: Diagnostic to see what triggers/functions exist before cleanup
-- ============================================================================

-- Check all triggers on catalog_items
SELECT 
    'TRIGGERS' as type,
    tgname as name,
    pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'catalog_items'::regclass
ORDER BY tgname;

-- Check all functions related to extraction and reversal
SELECT 
    'FUNCTIONS' as type,
    proname as name,
    pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname LIKE '%extract%'
   OR proname LIKE '%reverse%'
   OR proname LIKE '%hebrew%'
   OR proname LIKE '%auto_fix%'
ORDER BY proname;

-- Check data quality - what's populated vs NULL
SELECT 
    'DATA_QUALITY' as type,
    COUNT(*) as total_records,
    COUNT(year_from) as has_year_from,
    COUNT(year_to) as has_year_to,
    COUNT(side_position) as has_side,
    COUNT(front_rear) as has_position,
    COUNT(part_family) as has_family,
    ROUND(COUNT(year_from)::NUMERIC / COUNT(*) * 100, 1) as year_pct,
    ROUND(COUNT(side_position)::NUMERIC / COUNT(*) * 100, 1) as side_pct,
    ROUND(COUNT(part_family)::NUMERIC / COUNT(*) * 100, 1) as family_pct
FROM catalog_items;

-- Sample 10 records to see current data
SELECT 
    'SAMPLE_DATA' as type,
    cat_num_desc,
    year_from,
    year_to,
    side_position,
    part_family,
    make
FROM catalog_items
LIMIT 10;
