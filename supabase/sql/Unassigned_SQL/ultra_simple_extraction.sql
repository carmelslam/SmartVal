-- ULTRA SIMPLE EXTRACTION - NO COMPLEX RAISE STATEMENTS
-- This version avoids all PostgreSQL parameter limit issues
-- Run this COMPLETE script - maximum compatibility

-- ============================================================================
-- 1. DROP AND RECREATE DICTIONARIES (CLEAN START)
-- ============================================================================

-- Clean slate - drop existing tables that might have wrong structure
DROP TABLE IF EXISTS dict_makes CASCADE;
DROP TABLE IF EXISTS dict_models CASCADE;
DROP TABLE IF EXISTS dict_parts CASCADE;

-- Dictionary for vehicle makes
CREATE TABLE dict_makes (
    id SERIAL PRIMARY KEY,
    synonym TEXT UNIQUE NOT NULL,
    canonical TEXT NOT NULL
);

-- Dictionary for vehicle models  
CREATE TABLE dict_models (
    id SERIAL PRIMARY KEY,
    synonym TEXT UNIQUE NOT NULL,
    canonical TEXT NOT NULL,
    body_code TEXT -- For generation codes like MK6, C6, F30
);

-- Dictionary for part families
CREATE TABLE dict_parts (
    id SERIAL PRIMARY KEY,
    synonym TEXT UNIQUE NOT NULL,
    canonical TEXT NOT NULL,
    part_family TEXT
);

-- ============================================================================
-- 2. POPULATE DICTIONARIES
-- ============================================================================

-- Popular vehicle makes
INSERT INTO dict_makes (synonym, canonical) VALUES
('VOLKSWAGEN', 'Volkswagen'),
('VW', 'Volkswagen'),
('AUDI', 'Audi'),
('BMW', 'BMW'),
('MERCEDES', 'Mercedes'),
('BENZ', 'Mercedes-Benz'),
('FORD', 'Ford'),
('PEUGEOT', 'Peugeot'),
('RENAULT', 'Renault'),
('CITROEN', 'Citroen'),
('SKODA', 'Skoda'),
('CHEVROLET', 'Chevrolet'),
('OPEL', 'Opel'),
('SUZUKI', 'Suzuki'),
('MAZDA', 'Mazda'),
('NISSAN', 'Nissan'),
('TOYOTA', 'Toyota'),
('HONDA', 'Honda'),
('HYUNDAI', 'Hyundai'),
('KIA', 'Kia'),
('MITSUBISHI', 'Mitsubishi'),
('SEAT', 'Seat'),
('FIAT', 'Fiat'),
('VOLVO', 'Volvo'),
('JEEP', 'Jeep'),
('LEXUS', 'Lexus');

-- Popular vehicle models with generation codes
INSERT INTO dict_models (synonym, canonical, body_code) VALUES
-- Volkswagen Golf
('GOLF', 'Golf', NULL),
('MK1', 'Golf', 'MK1'),
('MK2', 'Golf', 'MK2'),
('MK3', 'Golf', 'MK3'),
('MK4', 'Golf', 'MK4'),
('MK5', 'Golf', 'MK5'),
('MK6', 'Golf', 'MK6'),
('MK7', 'Golf', 'MK7'),
('MK8', 'Golf', 'MK8'),

-- Audi A6
('A6', 'A6', NULL),
('C4', 'A6', 'C4'),
('C5', 'A6', 'C5'),
('C6', 'A6', 'C6'),
('C7', 'A6', 'C7'),
('C8', 'A6', 'C8'),

-- Audi A4
('A4', 'A4', NULL),
('B5', 'A4', 'B5'),
('B6', 'A4', 'B6'),
('B7', 'A4', 'B7'),
('B8', 'A4', 'B8'),
('B9', 'A4', 'B9'),

-- BMW 3 Series
('3 SERIES', '3 Series', NULL),
('E30', '3 Series', 'E30'),
('E36', '3 Series', 'E36'),
('E46', '3 Series', 'E46'),
('E90', '3 Series', 'E90'),
('E91', '3 Series', 'E91'),
('E92', '3 Series', 'E92'),
('F30', '3 Series', 'F30'),
('G20', '3 Series', 'G20'),

-- Popular models
('PASSAT', 'Passat', NULL),
('FOCUS', 'Focus', NULL),
('POLO', 'Polo', NULL),
('YARIS', 'Yaris', NULL),
('COROLLA', 'Corolla', NULL),
('CIVIC', 'Civic', NULL);

-- Part families
INSERT INTO dict_parts (synonym, canonical, part_family) VALUES
('LIGHT', 'Light', 'Lighting'),
('HEADLIGHT', 'Headlight', 'Lighting'),
('DOOR', 'Door', 'Body'),
('FENDER', 'Fender', 'Body'),
('BUMPER', 'Bumper', 'Body'),
('MIRROR', 'Mirror', 'Mirrors'),
('BRAKE', 'Brake', 'Braking'),
('WHEEL', 'Wheel', 'Wheels'),
('ENGINE', 'Engine', 'Engine'),
('FILTER', 'Filter', 'Filters');

-- ============================================================================
-- 3. CREATE EXTRACTION FUNCTIONS
-- ============================================================================

-- Extract OEM part numbers
CREATE OR REPLACE FUNCTION extract_oem_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    oem_result TEXT;
BEGIN
    -- Look for alphanumeric codes 8-14 characters at end
    SELECT (regexp_match(desc_text, '([A-Z0-9]{8,14})(?:\s*$)'))[1] INTO oem_result;
    
    IF oem_result IS NOT NULL THEN
        RETURN oem_result;
    END IF;
    
    -- Look for any alphanumeric code 8+ chars
    SELECT (regexp_match(desc_text, '([A-Z0-9]{8,})'))[1] INTO oem_result;
    
    RETURN oem_result;
END;
$$;

-- Extract vehicle models
CREATE OR REPLACE FUNCTION extract_model_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    model_result TEXT;
BEGIN
    -- Check dictionary first
    SELECT canonical INTO model_result
    FROM dict_models dm
    WHERE UPPER(desc_text) LIKE '%' || UPPER(dm.synonym) || '%'
    ORDER BY LENGTH(dm.synonym) DESC
    LIMIT 1;
    
    RETURN model_result;
END;
$$;

-- Extract model codes (generation codes)
CREATE OR REPLACE FUNCTION extract_model_code_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    model_code_result TEXT;
BEGIN
    -- Check dictionary for body codes
    SELECT body_code INTO model_code_result
    FROM dict_models dm
    WHERE UPPER(desc_text) LIKE '%' || UPPER(dm.synonym) || '%'
    AND dm.body_code IS NOT NULL
    ORDER BY LENGTH(dm.synonym) DESC
    LIMIT 1;
    
    IF model_code_result IS NOT NULL THEN
        RETURN model_code_result;
    END IF;
    
    -- Look for common generation codes
    SELECT (regexp_match(UPPER(desc_text), '\b(MK[1-9]|C[4-8]|B[5-9]|[EFG][0-9]{2})\b'))[1] INTO model_code_result;
    
    RETURN model_code_result;
END;
$$;

-- Extract part families
CREATE OR REPLACE FUNCTION extract_part_family_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    family_result TEXT;
BEGIN
    -- Check dictionary
    SELECT part_family INTO family_result
    FROM dict_parts dp
    WHERE UPPER(desc_text) LIKE '%' || UPPER(dp.synonym) || '%'
    AND dp.part_family IS NOT NULL
    ORDER BY LENGTH(dp.synonym) DESC
    LIMIT 1;
    
    -- Hebrew patterns
    IF family_result IS NULL THEN
        IF position('פנס' in desc_text) > 0 THEN
            RETURN 'Lighting';
        END IF;
        IF position('דלת' in desc_text) > 0 THEN
            RETURN 'Body';
        END IF;
        IF position('כנף' in desc_text) > 0 THEN
            RETURN 'Body';
        END IF;
        IF position('מראה' in desc_text) > 0 THEN
            RETURN 'Mirrors';
        END IF;
    END IF;
    
    RETURN family_result;
END;
$$;

-- Extract side information
CREATE OR REPLACE FUNCTION extract_side_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
    IF UPPER(desc_text) LIKE '%RIGHT%' OR position('ימין' in desc_text) > 0 THEN
        RETURN 'Right';
    END IF;
    
    IF UPPER(desc_text) LIKE '%LEFT%' OR position('שמאל' in desc_text) > 0 THEN
        RETURN 'Left';
    END IF;
    
    RETURN NULL;
END;
$$;

-- Extract position information
CREATE OR REPLACE FUNCTION extract_position_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
    IF UPPER(desc_text) LIKE '%FRONT%' OR position('קדמי' in desc_text) > 0 THEN
        RETURN 'Front';
    END IF;
    
    IF UPPER(desc_text) LIKE '%REAR%' OR position('אחורי' in desc_text) > 0 THEN
        RETURN 'Rear';
    END IF;
    
    RETURN NULL;
END;
$$;

-- Extract year range
CREATE OR REPLACE FUNCTION extract_year_range_as_text(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    year_match TEXT[];
BEGIN
    -- Look for year range pattern
    SELECT regexp_match(desc_text, '(\d{4})-(\d{4})') INTO year_match;
    
    IF year_match IS NOT NULL THEN
        RETURN year_match[1] || '-' || year_match[2];
    END IF;
    
    -- Look for single year
    SELECT regexp_match(desc_text, '(20\d{2})') INTO year_match;
    IF year_match IS NOT NULL THEN
        RETURN year_match[1];
    END IF;
    
    RETURN NULL;
END;
$$;

-- ============================================================================
-- 4. ADD MISSING COLUMNS
-- ============================================================================

-- Add columns
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS model_code TEXT;
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS part_family TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_catalog_model_code ON catalog_items(model_code);
CREATE INDEX IF NOT EXISTS idx_catalog_part_family ON catalog_items(part_family);

-- ============================================================================
-- 5. CHECK BEFORE
-- ============================================================================

SELECT 
    'BEFORE EXTRACTION' as status,
    COUNT(*) as total_items,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END) as has_descriptions
FROM catalog_items;

-- ============================================================================
-- 6. EXTRACT DATA
-- ============================================================================

-- Update ALL catalog items
UPDATE catalog_items SET
    oem = extract_oem_from_desc(cat_num_desc),
    model = extract_model_from_desc(cat_num_desc),
    model_code = extract_model_code_from_desc(cat_num_desc),
    part_family = extract_part_family_from_desc(cat_num_desc),
    engine_volume = extract_side_from_desc(cat_num_desc),
    engine_code = extract_position_from_desc(cat_num_desc),
    "trim" = extract_year_range_as_text(cat_num_desc)
WHERE cat_num_desc IS NOT NULL;

-- ============================================================================
-- 7. CHECK RESULTS
-- ============================================================================

-- Final results
SELECT 
    'AFTER EXTRACTION' as status,
    COUNT(*) as total_items,
    COUNT(CASE WHEN oem IS NOT NULL THEN 1 END) as extracted_oem,
    COUNT(CASE WHEN model IS NOT NULL THEN 1 END) as extracted_model,
    COUNT(CASE WHEN model_code IS NOT NULL THEN 1 END) as extracted_model_code,
    COUNT(CASE WHEN part_family IS NOT NULL THEN 1 END) as extracted_family
FROM catalog_items;

-- Success rates
SELECT 
    'SUCCESS RATES' as metric_type,
    ROUND(100.0 * COUNT(CASE WHEN oem IS NOT NULL THEN 1 END) / NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1) as oem_success_percent,
    ROUND(100.0 * COUNT(CASE WHEN model_code IS NOT NULL THEN 1 END) / NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1) as model_code_success_percent
FROM catalog_items
WHERE cat_num_desc IS NOT NULL;

-- Sample data
SELECT 
    'SAMPLE DATA' as sample_type,
    cat_num_desc,
    oem,
    model,
    model_code,
    part_family
FROM catalog_items 
WHERE oem IS NOT NULL 
LIMIT 5;

-- Model codes found
SELECT 
    'MODEL CODES FOUND' as stat_type,
    model_code,
    COUNT(*) as count
FROM catalog_items 
WHERE model_code IS NOT NULL
GROUP BY model_code
ORDER BY count DESC;

-- Simple completion notice (no parameters)
DO $$
BEGIN
    RAISE NOTICE 'EXTRACTION COMPLETE - CHECK RESULTS ABOVE';
END $$;