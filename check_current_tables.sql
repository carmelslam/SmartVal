-- SQL to check current table structures in Supabase
-- Run this to see what fields you currently have

-- Check catalog_items table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'catalog_items' 
ORDER BY ordinal_position;

-- Check suppliers table structure  
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'suppliers' 
ORDER BY ordinal_position;

-- Check parts_search_sessions table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'parts_search_sessions' 
ORDER BY ordinal_position;

-- Check parts_search_results table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'parts_search_results' 
ORDER BY ordinal_position;

-- Check selected_parts table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'selected_parts' 
ORDER BY ordinal_position;

-- Check parts_required table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'parts_required' 
ORDER BY ordinal_position;

-- List all your parts-related tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%part%'
ORDER BY table_name;