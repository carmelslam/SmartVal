-- FUNCTION AUDIT AND ORGANIZATION
-- Before deploying cascading search, let's see what we have and organize deployment order
-- This will prevent conflicts and ensure clean deployment

SELECT '=== COMPREHENSIVE FUNCTION AUDIT ===' as section;

-- ============================================================================
-- STEP 1: AUDIT ALL EXISTING FUNCTIONS
-- ============================================================================

-- Check what search functions currently exist
SELECT 
    'Current Search Functions:' as audit_type,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as parameters,
    pg_get_function_result(p.oid) as return_type,
    p.prosrc LIKE '%smart_parts_search%' as is_smart_search,
    p.prosrc LIKE '%cascading%' as is_cascading_search,
    p.prosrc LIKE '%fix_hebrew%' as uses_hebrew_fix
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND (p.proname LIKE '%search%' OR p.proname LIKE '%fix_hebrew%' OR p.proname LIKE '%process_catalog%')
ORDER BY p.proname;

-- ============================================================================
-- STEP 2: CHECK EXTRACTION AND PROCESSING FUNCTIONS
-- ============================================================================

-- Check extraction and processing functions
SELECT 
    'Extraction & Processing Functions:' as audit_type,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as parameters,
    CASE 
        WHEN p.proname LIKE '%extract%' THEN 'Field Extraction'
        WHEN p.proname LIKE '%process%' THEN 'Data Processing' 
        WHEN p.proname LIKE '%trigger%' THEN 'Trigger Function'
        WHEN p.proname LIKE '%hebrew%' THEN 'Hebrew Fix'
        ELSE 'Other'
    END as function_category
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND (p.proname LIKE '%extract%' OR p.proname LIKE '%process%' OR p.proname LIKE '%hebrew%')
ORDER BY function_category, p.proname;

-- ============================================================================
-- STEP 3: CHECK TRIGGERS AND AUTOMATION
-- ============================================================================

-- Check active triggers
SELECT 
    'Active Triggers:' as audit_type,
    trigger_name,
    event_object_table as table_name,
    action_timing,
    event_manipulation as trigger_event,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- STEP 4: CHECK TABLE STRUCTURE AND EXTRACTED FIELDS
-- ============================================================================

-- Check catalog_items table structure
SELECT 
    'Table Structure Analysis:' as audit_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('part_name', 'extracted_year', 'model_display', 'part_family') THEN 'Extracted Field'
        WHEN column_name IN ('make', 'model', 'cat_num_desc', 'price') THEN 'Core Field'
        WHEN column_name IN ('side_position', 'year_range', 'model_code') THEN 'Parsed Field'
        ELSE 'Other Field'
    END as field_category
FROM information_schema.columns 
WHERE table_name = 'catalog_items' 
  AND table_schema = 'public'
ORDER BY field_category, ordinal_position;

-- ============================================================================
-- STEP 5: DATA QUALITY CHECK
-- ============================================================================

-- Check extraction completeness
SELECT 
    'Data Quality Status:' as audit_type,
    COUNT(*) as total_records,
    COUNT(part_name) as has_part_name,
    COUNT(extracted_year) as has_extracted_year,
    COUNT(model_display) as has_model_display,
    COUNT(CASE WHEN part_family IS NOT NULL AND part_family != 'לא מוגדר' THEN 1 END) as has_valid_part_family,
    ROUND(COUNT(part_name) * 100.0 / COUNT(*), 1) as part_name_completion_pct,
    ROUND(COUNT(extracted_year) * 100.0 / COUNT(*), 1) as year_extraction_pct,
    ROUND(COUNT(CASE WHEN part_family IS NOT NULL AND part_family != 'לא מוגדר' THEN 1 END) * 100.0 / COUNT(*), 1) as family_categorization_pct
FROM catalog_items;

-- ============================================================================
-- STEP 6: FUNCTION DEPENDENCY ANALYSIS
-- ============================================================================

-- Check which functions depend on others
DO $$
DECLARE
    func_record RECORD;
    dependency_info TEXT;
BEGIN
    RAISE NOTICE '=== FUNCTION DEPENDENCY ANALYSIS ===';
    
    -- Check smart_parts_search variants
    FOR func_record IN 
        SELECT proname, pg_get_function_identity_arguments(oid) as args, prosrc
        FROM pg_proc 
        WHERE proname LIKE '%search%' 
        ORDER BY proname
    LOOP
        dependency_info := '';
        
        IF func_record.prosrc LIKE '%fix_hebrew_text%' THEN
            dependency_info := dependency_info || 'fix_hebrew_text, ';
        END IF;
        
        IF func_record.prosrc LIKE '%process_catalog%' THEN
            dependency_info := dependency_info || 'process_catalog_item, ';
        END IF;
        
        IF dependency_info != '' THEN
            dependency_info := RTRIM(dependency_info, ', ');
            RAISE NOTICE 'Function: %(%) depends on: %', func_record.proname, func_record.args, dependency_info;
        ELSE
            RAISE NOTICE 'Function: %(%) has no dependencies', func_record.proname, func_record.args;
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 7: DEPLOYMENT CONFLICTS ANALYSIS
-- ============================================================================

-- Check for potential conflicts with cascading search
SELECT 
    'Potential Conflicts Analysis:' as audit_type,
    COUNT(CASE WHEN proname = 'smart_parts_search' THEN 1 END) as smart_search_variants,
    COUNT(CASE WHEN proname = 'cascading_parts_search' THEN 1 END) as cascading_search_exists,
    COUNT(CASE WHEN proname = 'simple_parts_search' THEN 1 END) as simple_search_exists,
    COUNT(CASE WHEN proname = 'advanced_parts_search' THEN 1 END) as advanced_search_exists,
    COUNT(CASE WHEN proname = 'fix_hebrew_text' THEN 1 END) as hebrew_fix_exists,
    CASE 
        WHEN COUNT(CASE WHEN proname = 'smart_parts_search' THEN 1 END) > 1 THEN 
            'CONFLICT: Multiple smart_parts_search functions exist'
        WHEN COUNT(CASE WHEN proname = 'cascading_parts_search' THEN 1 END) > 0 THEN
            'WARNING: cascading_parts_search already exists'
        WHEN COUNT(CASE WHEN proname = 'fix_hebrew_text' THEN 1 END) = 0 THEN
            'ERROR: fix_hebrew_text function missing - required dependency'
        ELSE 'READY: Safe to deploy cascading search'
    END as deployment_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';

-- ============================================================================
-- STEP 8: RECOMMENDED DEPLOYMENT STRATEGY
-- ============================================================================

DO $$
DECLARE
    smart_search_count INTEGER;
    hebrew_fix_exists INTEGER;
    extraction_complete INTEGER;
    deployment_strategy TEXT;
BEGIN
    -- Get current state
    SELECT COUNT(*) INTO smart_search_count 
    FROM pg_proc 
    WHERE proname = 'smart_parts_search';
    
    SELECT COUNT(*) INTO hebrew_fix_exists 
    FROM pg_proc 
    WHERE proname = 'fix_hebrew_text';
    
    SELECT COUNT(part_name) INTO extraction_complete 
    FROM catalog_items 
    WHERE part_name IS NOT NULL;
    
    RAISE NOTICE '=== RECOMMENDED DEPLOYMENT STRATEGY ===';
    RAISE NOTICE 'Current State Analysis:';
    RAISE NOTICE '- smart_parts_search variants: %', smart_search_count;
    RAISE NOTICE '- fix_hebrew_text exists: %', CASE WHEN hebrew_fix_exists > 0 THEN 'YES' ELSE 'NO' END;
    RAISE NOTICE '- Records with extracted part_name: %', extraction_complete;
    RAISE NOTICE '';
    
    -- Determine strategy
    IF smart_search_count > 1 THEN
        RAISE NOTICE 'STEP 1: CLEANUP REQUIRED';
        RAISE NOTICE '- Run CLEANUP_ALL_FUNCTIONS.sql first';
        RAISE NOTICE '- This will remove conflicting smart_parts_search variants';
        RAISE NOTICE '';
    END IF;
    
    IF hebrew_fix_exists = 0 THEN
        RAISE NOTICE 'STEP 2: DEPLOY HEBREW FIX';
        RAISE NOTICE '- Run PHASE1_HEBREW_TEXT_FIX.sql';
        RAISE NOTICE '- Required dependency for all search functions';
        RAISE NOTICE '';
    END IF;
    
    IF extraction_complete < 40000 THEN
        RAISE NOTICE 'STEP 3: COMPLETE EXTRACTION';
        RAISE NOTICE '- Run PHASE2A through PHASE2F (field extraction)';
        RAISE NOTICE '- Current extraction: % records, target: >40000', extraction_complete;
        RAISE NOTICE '';
    END IF;
    
    RAISE NOTICE 'STEP 4: DEPLOY CASCADING SEARCH';
    RAISE NOTICE '- Run CASCADING_SEARCH_DEPLOYMENT.sql';
    RAISE NOTICE '- This will add new functions without conflicts';
    RAISE NOTICE '';
    
    RAISE NOTICE 'STEP 5: TEST AND COMPARE';
    RAISE NOTICE '- Test both smart_parts_search and cascading_parts_search';
    RAISE NOTICE '- Compare results and performance';
    RAISE NOTICE '- Choose final system';
    RAISE NOTICE '';
    
    RAISE NOTICE 'STEP 6: UPDATE AUTO-DEPLOYMENT';
    RAISE NOTICE '- Update AUTOMATIC_DEPLOYMENT_COMPLETE.sql';
    RAISE NOTICE '- Include chosen search system';
    RAISE NOTICE '- Remove deprecated functions';
END $$;

-- ============================================================================
-- STEP 9: SAFE DEPLOYMENT ORDER
-- ============================================================================

SELECT '=== RECOMMENDED SAFE DEPLOYMENT ORDER ===' as section;

SELECT 
    sequence_order,
    file_name,
    purpose,
    prerequisite,
    estimated_time
FROM (
    VALUES 
    (1, 'CLEANUP_ALL_FUNCTIONS.sql', 'Remove conflicting functions', 'None', '30 seconds'),
    (2, 'PHASE1_HEBREW_TEXT_FIX.sql', 'Deploy Hebrew text fix', 'Clean database', '1 minute'),
    (3, 'PHASE2A_ADD_COLUMNS.sql', 'Add extraction columns', 'Hebrew fix deployed', '2 minutes'),
    (4, 'PHASE2B through PHASE2F', 'Extract and categorize fields', 'Columns added', '15 minutes'),
    (5, 'CASCADING_SEARCH_DEPLOYMENT.sql', 'Deploy cascading search', 'Extraction complete', '2 minutes'),
    (6, 'COMPREHENSIVE_FUNCTION_TEST.sql', 'Test both systems', 'All functions deployed', '3 minutes'),
    (7, 'Frontend Integration', 'Update UI to use chosen system', 'Tests passed', '30 minutes'),
    (8, 'AUTOMATIC_DEPLOYMENT_COMPLETE.sql', 'Update auto-deployment', 'System chosen', '2 minutes')
) AS deployment_order(sequence_order, file_name, purpose, prerequisite, estimated_time)
ORDER BY sequence_order;

SELECT '=== FUNCTION AUDIT COMPLETE ===' as section;