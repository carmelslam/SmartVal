-- ============================================================================
-- SESSION 35: Fix Source Display in Search Results PiP
-- Date: 2025-10-15
-- 
-- Problem:
-- Search results PiP shows "מקורי" (original) when database has "חלופי" (aftermarket)
-- 
-- Root Cause:
-- parts-search-results-pip.js line 378 uses item.availability instead of item.source
-- When availability is NULL, it defaults to 'מקורי'
-- 
-- Database diagnostic confirmed: source column IS correct in database
-- All sample records show source="חלופי" correctly
-- 
-- Fix Location:
-- File: parts-search-results-pip.js
-- Line: 378
-- Change: item.availability → item.source
-- 
-- JAVASCRIPT FIX NEEDED (not SQL):
-- Before: <td class="col-type">${item.availability || 'מקורי'}</td>
-- After:  <td class="col-type">${item.source || 'חלופי'}</td>
-- 
-- Reasoning:
-- - RPC function smart_parts_search does NOT return 'availability' column
-- - It DOES return 'source' column (populated by SESSION_35_POPULATE_MISSING_EXTRACTED_COLUMNS.sql)
-- - Default should be 'חלופי' not 'מקורי' (most parts are aftermarket)
-- ============================================================================

-- This file is for documentation purposes only
-- The actual fix must be made in the JavaScript file: parts-search-results-pip.js
-- See line 378 in generateResultsTableHTML() function

-- Verification query to confirm source column is correct:
SELECT 
    'Source Column Verification' as test,
    cat_num_desc,
    supplier_name,
    source,
    CASE 
        WHEN source = 'חלופי' THEN '✅ Correct'
        WHEN source = 'מקורי' THEN '⚠️ Original'
        ELSE '❌ NULL'
    END as validation
FROM catalog_items
WHERE supplier_name = 'מ.פינס בע"מ'
LIMIT 20;

-- ============================================================================
-- DEPLOYMENT:
-- This is NOT a SQL fix - it's a JavaScript fix
-- Edit parts-search-results-pip.js line 378 manually
-- ============================================================================
