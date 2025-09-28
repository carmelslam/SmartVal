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


ANSWERS 28.9 
CATALOG : 
| column_name  | data_type                | is_nullable | column_default     |
| ------------ | ------------------------ | ----------- | ------------------ |
| id           | uuid                     | NO          | uuid_generate_v4() |
| supplier_id  | uuid                     | YES         | null               |
| pcode        | text                     | YES         | null               |
| cat_num_desc | text                     | YES         | null               |
| price        | numeric                  | YES         | null               |
| source       | text                     | YES         | null               |
| make         | text                     | YES         | null               |
| oem          | text                     | YES         | null               |
| availability | text                     | YES         | null               |
| location     | text                     | YES         | null               |
| comments     | text                     | YES         | null               |
| version_date | date                     | NO          | null               |
| raw_row      | jsonb                    | YES         | null               |
| row_hash     | text                     | YES         | null               |
| created_at   | timestamp with time zone | YES         | now()              |


NEEDS MORE: MODEL , TRIM, VIN, ENGINE VOLME, ENGINE CODE , PARTS FAMILY, SUPPLIER NAME 

suppliers 

| column_name | data_type                | is_nullable | column_default     |
| ----------- | ------------------------ | ----------- | ------------------ |
| id          | uuid                     | NO          | uuid_generate_v4() |
| slug        | text                     | NO          | null               |
| name        | text                     | NO          | null               |
| type        | text                     | YES         | null               |
| active      | boolean                  | YES         | true               |
| created_at  | timestamp with time zone | YES         | now()              |


parts search session 
| column_name    | data_type                | is_nullable | column_default    |
| -------------- | ------------------------ | ----------- | ----------------- |
| id             | uuid                     | NO          | gen_random_uuid() |
| case_id        | uuid                     | YES         | null              |
| plate          | text                     | NO          | null              |
| search_context | jsonb                    | YES         | null              |
| created_by     | uuid                     | YES         | null              |
| created_at     | timestamp with time zone | NO          | now()             |

selected parts :
| column_name      | data_type                | is_nullable | column_default     |
| ---------------- | ------------------------ | ----------- | ------------------ |
| id               | uuid                     | NO          | uuid_generate_v4() |
| plate            | text                     | YES         | null               |
| search_result_id | uuid                     | YES         | null               |
| part_name        | text                     | NO          | null               |
| supplier         | text                     | YES         | null               |
| price            | numeric                  | YES         | null               |
| oem_number       | text                     | YES         | null               |
| quantity         | integer                  | YES         | 1                  |
| damage_center_id | text                     | YES         | null               |
| status           | text                     | YES         | 'selected'::text   |
| selected_by      | text                     | YES         | null               |
| selected_at      | timestamp with time zone | YES         | now()              |
| raw_data         | jsonb                    | YES         | null               |

parts_search_results

| column_name      | data_type                | is_nullable | column_default    |
| ---------------- | ------------------------ | ----------- | ----------------- |
| id               | uuid                     | NO          | gen_random_uuid() |
| session_id       | uuid                     | YES         | null              |
| supplier         | text                     | YES         | null              |
| search_query     | jsonb                    | YES         | null              |
| results          | jsonb                    | YES         | null              |
| response_time_ms | integer                  | YES         | null              |
| created_at       | timestamp with time zone | NO          | now()             |

selected_parts:

| column_name      | data_type                | is_nullable | column_default     |
| ---------------- | ------------------------ | ----------- | ------------------ |
| id               | uuid                     | NO          | uuid_generate_v4() |
| plate            | text                     | YES         | null               |
| search_result_id | uuid                     | YES         | null               |
| part_name        | text                     | NO          | null               |
| supplier         | text                     | YES         | null               |
| price            | numeric                  | YES         | null               |
| oem_number       | text                     | YES         | null               |
| quantity         | integer                  | YES         | 1                  |
| damage_center_id | text                     | YES         | null               |
| status           | text                     | YES         | 'selected'::text   |
| selected_by      | text                     | YES         | null               |
| selected_at      | timestamp with time zone | YES         | now()              |
| raw_data         | jsonb                    | YES         | null               |

parts required 
| column_name        | data_type                | is_nullable | column_default    |
| ------------------ | ------------------------ | ----------- | ----------------- |
| id                 | uuid                     | NO          | gen_random_uuid() |
| case_id            | uuid                     | YES         | null              |
| damage_center_code | text                     | YES         | null              |
| part_number        | text                     | YES         | null              |
| part_name          | text                     | YES         | null              |
| manufacturer       | text                     | YES         | null              |
| quantity           | integer                  | YES         | 1                 |
| unit_price         | numeric                  | YES         | null              |
| selected_supplier  | text                     | YES         | null              |
| status             | text                     | YES         | 'PENDING'::text   |
| metadata           | jsonb                    | YES         | null              |
| created_at         | timestamp with time zone | NO          | now()             |
| updated_at         | timestamp with time zone | NO          | now()             |

| table_name            |
| --------------------- |
| parts_required        |
| parts_search_results  |
| parts_search_sessions |
| selected_parts        |


ALL parts tables need to have teh same identification fields and each table to have its unique fields like :
parts required needs to have also quantity and so on 
the current fields are ok and dont need to change we jaut need to add to have all UI query parameters 
use the sql suggestions and instructions in Parts module and supabase.md to bridge the  gap. 
the parts module is built of sevarl independent files, and we will need to add more tools in teh ui once supabse and the main parts search.html file can talk to each other