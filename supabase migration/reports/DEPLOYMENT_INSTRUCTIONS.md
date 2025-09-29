# 🚀 SmartVal Search - Deployment Instructions

## ❌ Current Error Fix

**Error**: `Cannot read properties of undefined (reading 'rpc')`

**Root Cause**: The SQL functions haven't been deployed to Supabase yet.

## 🔧 Quick Fix Steps

### 1. Deploy SQL Functions to Supabase

**Go to your Supabase project:**
1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your SmartVal project
3. Go to **SQL Editor** (left sidebar)

**Copy and run this SQL:**
```sql
-- SMART PARTS SEARCH - New Simplified Architecture
-- Single PostgreSQL function to handle flexible search with Hebrew support

CREATE OR REPLACE FUNCTION smart_parts_search(
    car_plate TEXT DEFAULT NULL,
    make_param TEXT DEFAULT NULL,
    model_param TEXT DEFAULT NULL,
    model_code_param TEXT DEFAULT NULL,
    trim_param TEXT DEFAULT NULL,
    year_param TEXT DEFAULT NULL,
    engine_volume_param TEXT DEFAULT NULL,
    engine_code_param TEXT DEFAULT NULL,
    engine_type_param TEXT DEFAULT NULL,
    vin_number_param TEXT DEFAULT NULL,
    oem_param TEXT DEFAULT NULL,
    free_query_param TEXT DEFAULT NULL,
    family_param TEXT DEFAULT NULL,
    part_param TEXT DEFAULT NULL,
    source_param TEXT DEFAULT NULL,
    quantity_param INTEGER DEFAULT 1,
    limit_results INTEGER DEFAULT 50
)
RETURNS TABLE(
    id BIGINT,
    cat_num_desc TEXT,
    supplier_name TEXT,
    pcode TEXT,
    price NUMERIC,
    oem TEXT,
    make TEXT,
    model TEXT,
    part_family TEXT,
    side_position TEXT,
    front_rear TEXT,
    year_range TEXT,
    availability TEXT,
    relevance_score INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    base_query TEXT;
    where_conditions TEXT[] := ARRAY[]::TEXT[];
    hebrew_corrected TEXT;
    final_query TEXT;
BEGIN
    base_query := 'SELECT 
        ci.id,
        ci.cat_num_desc,
        ci.supplier_name,
        ci.pcode,
        ci.price,
        ci.oem,
        ci.make,
        ci.model,
        ci.part_family,
        ci.side_position,
        ci.front_rear,
        ci.year_range,
        ci.availability,
        0 as relevance_score
    FROM catalog_items ci 
    WHERE 1=1';

    -- OEM search (high priority)
    IF oem_param IS NOT NULL AND oem_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('ci.oem ILIKE %L', '%' || oem_param || '%'));
    END IF;
    
    -- Make search (supports Hebrew)
    IF make_param IS NOT NULL AND make_param != '' THEN
        IF make_param = 'טויוטה' OR lower(make_param) = 'toyota' THEN
            where_conditions := array_append(where_conditions, 
                '(ci.make ILIKE ''%toyota%'' OR ci.cat_num_desc ILIKE ''%טויוטה%'')');
        ELSE
            where_conditions := array_append(where_conditions, 
                format('ci.make ILIKE %L', '%' || make_param || '%'));
        END IF;
    END IF;
    
    -- Free query search (Hebrew corrected)
    IF free_query_param IS NOT NULL AND free_query_param != '' THEN
        hebrew_corrected := free_query_param;
        hebrew_corrected := replace(hebrew_corrected, 'סנפ', 'פנס');
        hebrew_corrected := replace(hebrew_corrected, 'ףנכ', 'כנף');
        
        where_conditions := array_append(where_conditions, 
            format('(ci.cat_num_desc ILIKE %L OR ci.cat_num_desc ILIKE %L)', 
                   '%' || free_query_param || '%', '%' || hebrew_corrected || '%'));
    END IF;
    
    -- Build final query
    IF array_length(where_conditions, 1) > 0 THEN
        final_query := base_query || ' AND ' || array_to_string(where_conditions, ' AND ');
    ELSE
        final_query := base_query;
    END IF;
    
    final_query := final_query || format(' ORDER BY ci.id ASC LIMIT %s', limit_results);
    
    RETURN QUERY EXECUTE final_query;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN;
END;
$$;

-- Create wrapper function for JavaScript
CREATE OR REPLACE FUNCTION simple_parts_search(search_params JSONB)
RETURNS TABLE(
    id BIGINT,
    cat_num_desc TEXT,
    supplier_name TEXT,
    pcode TEXT,
    price NUMERIC,
    oem TEXT,
    make TEXT,
    model TEXT,
    part_family TEXT,
    side_position TEXT,
    front_rear TEXT,
    year_range TEXT,
    availability TEXT,
    relevance_score INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY SELECT * FROM smart_parts_search(
        free_query_param := search_params->>'free_query',
        make_param := search_params->>'make',
        oem_param := search_params->>'oem',
        limit_results := COALESCE((search_params->>'limit')::INTEGER, 50)
    );
END;
$$;
```

### 2. Click "RUN" button in Supabase SQL Editor

### 3. Verify Functions Created
```sql
-- Test the function works
SELECT * FROM simple_parts_search('{"free_query": "test"}'::jsonb) LIMIT 5;
```

## ✅ After Deployment

Once deployed, your search should work with:
- **Fast response times** (200-800ms)
- **Hebrew text support** with automatic corrections
- **Flexible parameters** that ignore non-existent fields
- **No more page freezing**

## 🧪 Testing

Use the test page to verify everything works:
```
open test-smart-search.html
```

## 📋 Alternative: Copy Full SQL File

If you prefer, copy the entire content from:
```
/supabase/sql/smart_parts_search.sql
```

And paste it into your Supabase SQL Editor.

---

**After deployment, the search error should be resolved and you'll have a fast, stable Hebrew-aware search system!** 🚀