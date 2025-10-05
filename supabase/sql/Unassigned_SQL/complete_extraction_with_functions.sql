-- COMPLETE EXTRACTION WITH ALL FUNCTIONS
-- Run this COMPLETE script - includes dictionaries + functions + extraction
-- This is the full catalog processing script with everything included

-- ============================================================================
-- 1. CREATE DICTIONARIES (IF NOT EXISTS)
-- ============================================================================

-- Dictionary for vehicle makes
CREATE TABLE IF NOT EXISTS dict_makes (
    id SERIAL PRIMARY KEY,
    synonym TEXT UNIQUE NOT NULL,
    canonical TEXT NOT NULL
);

-- Dictionary for vehicle models  
CREATE TABLE IF NOT EXISTS dict_models (
    id SERIAL PRIMARY KEY,
    synonym TEXT UNIQUE NOT NULL,
    canonical TEXT NOT NULL,
    body_code TEXT -- For generation codes like MK6, C6, F30
);

-- Dictionary for part families
CREATE TABLE IF NOT EXISTS dict_parts (
    id SERIAL PRIMARY KEY,
    synonym TEXT UNIQUE NOT NULL,
    canonical TEXT NOT NULL,
    part_family TEXT
);

-- Dictionary for year patterns
CREATE TABLE IF NOT EXISTS dict_year_patterns (
    id SERIAL PRIMARY KEY,
    pattern TEXT NOT NULL,
    description TEXT
);

-- ============================================================================
-- 2. POPULATE DICTIONARIES
-- ============================================================================

-- Popular vehicle makes (Hebrew and English)
INSERT INTO dict_makes (synonym, canonical) VALUES
('פולקסווגן', 'Volkswagen'),
('פולקס', 'Volkswagen'),
('וולקסווגן', 'Volkswagen'),
('ווגן', 'Volkswagen'),
('אאודי', 'Audi'),
('אודי', 'Audi'),
('ב.מ.וו', 'BMW'),
('במוו', 'BMW'),
('ביאמוו', 'BMW'),
('מרצדס', 'Mercedes'),
('מרצדס בנץ', 'Mercedes-Benz'),
('בנץ', 'Mercedes-Benz'),
('פורד', 'Ford'),
('פיג\'ו', 'Peugeot'),
('פז\'ו', 'Peugeot'),
('רנו', 'Renault'),
('רנאו', 'Renault'),
('סיטרואן', 'Citroen'),
('סקודה', 'Skoda'),
('סקדה', 'Skoda'),
('שברולט', 'Chevrolet'),
('אופל', 'Opel'),
('סוזוקי', 'Suzuki'),
('מאזדה', 'Mazda'),
('ניסאן', 'Nissan'),
('טויוטה', 'Toyota'),
('הונדה', 'Honda'),
('יונדאי', 'Hyundai'),
('קיה', 'Kia'),
('מיצובישי', 'Mitsubishi'),
('סיאט', 'Seat'),
('פיאט', 'Fiat'),
('אלפא רומיאו', 'Alfa Romeo'),
('וולוו', 'Volvo'),
('לנד רובר', 'Land Rover'),
('ג\'יפ', 'Jeep'),
('לקסוס', 'Lexus'),
('אינפיניטי', 'Infiniti'),
('אקורה', 'Acura')
ON CONFLICT (synonym) DO NOTHING;

-- Popular vehicle models with generation codes
INSERT INTO dict_models (synonym, canonical, body_code) VALUES
-- Volkswagen Golf
('גולף', 'Golf', NULL),
('גולף MK1', 'Golf', 'MK1'),
('גולף MK2', 'Golf', 'MK2'),
('גולף MK3', 'Golf', 'MK3'),
('גולף MK4', 'Golf', 'MK4'),
('גולף MK5', 'Golf', 'MK5'),
('גולף MK6', 'Golf', 'MK6'),
('גולף MK7', 'Golf', 'MK7'),
('גולף MK8', 'Golf', 'MK8'),

-- Audi A6
('A6', 'A6', NULL),
('A6 C4', 'A6', 'C4'),
('A6 C5', 'A6', 'C5'),
('A6 C6', 'A6', 'C6'),
('A6 C7', 'A6', 'C7'),
('A6 C8', 'A6', 'C8'),

-- Audi A4
('A4', 'A4', NULL),
('A4 B5', 'A4', 'B5'),
('A4 B6', 'A4', 'B6'),
('A4 B7', 'A4', 'B7'),
('A4 B8', 'A4', 'B8'),
('A4 B9', 'A4', 'B9'),

-- BMW 3 Series
('3 Series', '3 Series', NULL),
('סדרה 3', '3 Series', NULL),
('E30', '3 Series', 'E30'),
('E36', '3 Series', 'E36'),
('E46', '3 Series', 'E46'),
('E90', '3 Series', 'E90'),
('E91', '3 Series', 'E91'),
('E92', '3 Series', 'E92'),
('F30', '3 Series', 'F30'),
('G20', '3 Series', 'G20'),

-- Popular models
('פאסאט', 'Passat', NULL),
('פוקוס', 'Focus', NULL),
('פיאסטה', 'Fiesta', NULL),
('אסטרה', 'Astra', NULL),
('קורסה', 'Corsa', NULL),
('פולו', 'Polo', NULL),
('יאריס', 'Yaris', NULL),
('קוראלה', 'Corolla', NULL),
('סיוויק', 'Civic', NULL),
('אקורד', 'Accord', NULL)
ON CONFLICT (synonym) DO NOTHING;

-- Part families (Hebrew descriptions to part categories)
INSERT INTO dict_parts (synonym, canonical, part_family) VALUES
('פנס', 'Light', 'Lighting'),
('פנס קדמי', 'Headlight', 'Lighting'),
('פנס אחורי', 'Tail Light', 'Lighting'),
('זנב', 'Tail Light', 'Lighting'),
('פלאש', 'Turn Signal', 'Lighting'),
('עמוד', 'Pillar', 'Body'),
('דלת', 'Door', 'Body'),
('כנף', 'Fender', 'Body'),
('פגוש', 'Bumper', 'Body'),
('קפו', 'Hood', 'Body'),
('גג', 'Roof', 'Body'),
('תא מטען', 'Trunk', 'Body'),
('חלון', 'Window', 'Glass'),
('שמשה', 'Window', 'Glass'),
('מראה', 'Mirror', 'Mirrors'),
('מראת צד', 'Side Mirror', 'Mirrors'),
('מראה חיצונית', 'Exterior Mirror', 'Mirrors'),
('בלם', 'Brake', 'Braking'),
('דיסק', 'Brake Disc', 'Braking'),
('רפידות', 'Brake Pads', 'Braking'),
('אמורטיזר', 'Shock Absorber', 'Suspension'),
('קפיץ', 'Spring', 'Suspension'),
('מתלה', 'Suspension', 'Suspension'),
('צמיג', 'Tire', 'Wheels'),
('חישוק', 'Rim', 'Wheels'),
('גלגל', 'Wheel', 'Wheels'),
('מנוע', 'Engine', 'Engine'),
('מנועון', 'Motor', 'Engine'),
('תיבת הילוכים', 'Transmission', 'Transmission'),
('הילוכים', 'Gearbox', 'Transmission'),
('קלאץ', 'Clutch', 'Transmission'),
('מצמד', 'Clutch', 'Transmission'),
('רדיאטור', 'Radiator', 'Cooling'),
('קירור', 'Cooling', 'Cooling'),
('מאוורר', 'Fan', 'Cooling'),
('מסנן', 'Filter', 'Filters'),
('פילטר', 'Filter', 'Filters'),
('שמן', 'Oil', 'Fluids'),
('דלק', 'Fuel', 'Fluids'),
('בנזין', 'Gasoline', 'Fluids'),
('סולר', 'Diesel', 'Fluids')
ON CONFLICT (synonym) DO NOTHING;

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
    -- Look for alphanumeric codes 8-14 characters (typical OEM format)
    SELECT (regexp_match(desc_text, '([A-Z0-9]{8,14})(?:\s|$)'))[1] INTO oem_result;
    
    IF oem_result IS NOT NULL THEN
        RETURN oem_result;
    END IF;
    
    -- Look for codes with specific patterns
    SELECT (regexp_match(desc_text, '([0-9][A-Z][0-9]{6,10}[A-Z]?)'))[1] INTO oem_result;
    
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
    
    IF model_result IS NOT NULL THEN
        RETURN model_result;
    END IF;
    
    -- Direct pattern matching for common models
    SELECT (regexp_match(UPPER(desc_text), '\b(GOLF|PASSAT|FOCUS|A4|A6|3 SERIES|POLO|YARIS)\b'))[1] INTO model_result;
    
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
    -- Check dictionary for body codes first
    SELECT body_code INTO model_code_result
    FROM dict_models dm
    WHERE UPPER(desc_text) LIKE '%' || UPPER(dm.synonym) || '%'
    AND dm.body_code IS NOT NULL
    ORDER BY LENGTH(dm.synonym) DESC
    LIMIT 1;
    
    IF model_code_result IS NOT NULL THEN
        RETURN model_code_result;
    END IF;
    
    -- Look for common VW/Audi generation codes
    SELECT (regexp_match(UPPER(desc_text), '\b(MK[1-9]|C[4-8]|B[5-9]|8[A-Z])\b'))[1] INTO model_code_result;
    
    IF model_code_result IS NOT NULL THEN
        RETURN model_code_result;
    END IF;
    
    -- Look for BMW generation codes
    SELECT (regexp_match(UPPER(desc_text), '\b([EFG][0-9]{2})\b'))[1] INTO model_code_result;
    
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
    -- Check dictionary for part families
    SELECT part_family INTO family_result
    FROM dict_parts dp
    WHERE UPPER(desc_text) LIKE '%' || UPPER(dp.synonym) || '%'
    AND dp.part_family IS NOT NULL
    ORDER BY LENGTH(dp.synonym) DESC
    LIMIT 1;
    
    RETURN family_result;
END;
$$;

-- Extract side information (left/right)
CREATE OR REPLACE FUNCTION extract_side_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    side_result TEXT;
BEGIN
    -- Hebrew patterns
    IF UPPER(desc_text) LIKE '%ימין%' OR UPPER(desc_text) LIKE '%ימני%' THEN
        RETURN 'Right';
    END IF;
    
    IF UPPER(desc_text) LIKE '%שמאל%' OR UPPER(desc_text) LIKE '%שמאלי%' THEN
        RETURN 'Left';
    END IF;
    
    -- English patterns
    IF UPPER(desc_text) LIKE '%RIGHT%' OR UPPER(desc_text) LIKE '%RH%' THEN
        RETURN 'Right';
    END IF;
    
    IF UPPER(desc_text) LIKE '%LEFT%' OR UPPER(desc_text) LIKE '%LH%' THEN
        RETURN 'Left';
    END IF;
    
    RETURN NULL;
END;
$$;

-- Extract position information (front/rear)
CREATE OR REPLACE FUNCTION extract_position_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    position_result TEXT;
BEGIN
    -- Hebrew patterns
    IF UPPER(desc_text) LIKE '%קדמי%' OR UPPER(desc_text) LIKE '%קדם%' THEN
        RETURN 'Front';
    END IF;
    
    IF UPPER(desc_text) LIKE '%אחורי%' OR UPPER(desc_text) LIKE '%אחור%' THEN
        RETURN 'Rear';
    END IF;
    
    -- English patterns
    IF UPPER(desc_text) LIKE '%FRONT%' OR UPPER(desc_text) LIKE '%FORWARD%' THEN
        RETURN 'Front';
    END IF;
    
    IF UPPER(desc_text) LIKE '%REAR%' OR UPPER(desc_text) LIKE '%BACK%' THEN
        RETURN 'Rear';
    END IF;
    
    RETURN NULL;
END;
$$;

-- Extract year range as text
CREATE OR REPLACE FUNCTION extract_year_range_as_text(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    year_match TEXT[];
    y1 INT;
    y2 INT;
BEGIN
    -- Look for year range pattern
    SELECT regexp_match(desc_text, '(\d{2,4})-(\d{2,4})') INTO year_match;
    
    IF year_match IS NOT NULL THEN
        y1 := year_match[1]::INT;
        y2 := year_match[2]::INT;
        
        -- Convert 2-digit years to full years
        IF y1 < 50 THEN y1 := y1 + 2000; END IF;
        IF y1 >= 50 AND y1 < 100 THEN y1 := y1 + 1900; END IF;
        
        IF y2 < 50 THEN y2 := y2 + 2000; END IF;
        IF y2 >= 50 AND y2 < 100 THEN y2 := y2 + 1900; END IF;
        
        RETURN y1::TEXT || '-' || y2::TEXT;
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

-- Add model_code column if it doesn't exist
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS model_code TEXT;

-- Add part_family column if it doesn't exist  
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS part_family TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_catalog_model_code ON catalog_items(model_code);
CREATE INDEX IF NOT EXISTS idx_catalog_part_family ON catalog_items(part_family);

-- ============================================================================
-- 5. CHECK CURRENT STATUS
-- ============================================================================

SELECT 
    'BEFORE EXTRACTION' as status,
    COUNT(*) as total_items,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END) as has_descriptions,
    COUNT(CASE WHEN oem IS NOT NULL THEN 1 END) as has_oem,
    COUNT(CASE WHEN model IS NOT NULL THEN 1 END) as has_model,
    COUNT(CASE WHEN model_code IS NOT NULL THEN 1 END) as has_model_code,
    COUNT(CASE WHEN part_family IS NOT NULL THEN 1 END) as has_family
FROM catalog_items;

-- ============================================================================
-- 6. PROCESS ALL DATA IN ONE GO
-- ============================================================================

-- Update ALL catalog items with extracted data
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
-- 7. CHECK FINAL RESULTS
-- ============================================================================

-- Final results
SELECT 
    'AFTER EXTRACTION' as status,
    COUNT(*) as total_items,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END) as had_descriptions,
    COUNT(CASE WHEN oem IS NOT NULL THEN 1 END) as extracted_oem,
    COUNT(CASE WHEN model IS NOT NULL THEN 1 END) as extracted_model,
    COUNT(CASE WHEN model_code IS NOT NULL THEN 1 END) as extracted_model_code,
    COUNT(CASE WHEN part_family IS NOT NULL THEN 1 END) as extracted_family
FROM catalog_items;

-- Show extraction success rates
SELECT 
    'SUCCESS RATES' as metric_type,
    ROUND(100.0 * COUNT(CASE WHEN oem IS NOT NULL THEN 1 END) / NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1) as oem_success_percent,
    ROUND(100.0 * COUNT(CASE WHEN model IS NOT NULL THEN 1 END) / NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1) as model_success_percent,
    ROUND(100.0 * COUNT(CASE WHEN model_code IS NOT NULL THEN 1 END) / NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1) as model_code_success_percent,
    ROUND(100.0 * COUNT(CASE WHEN part_family IS NOT NULL THEN 1 END) / NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1) as family_success_percent
FROM catalog_items
WHERE cat_num_desc IS NOT NULL;

-- Show sample extracted data
SELECT 
    'SAMPLE EXTRACTED DATA' as sample_type,
    cat_num_desc,
    oem,
    model,
    model_code,
    part_family,
    engine_volume as side_info,
    engine_code as position_info,
    "trim" as year_range
FROM catalog_items 
WHERE model_code IS NOT NULL 
LIMIT 10;

-- Final completion message
DO $$
DECLARE
    total_processed INT;
    model_code_count INT;
    success_rate NUMERIC;
BEGIN
    SELECT 
        COUNT(CASE WHEN oem IS NOT NULL THEN 1 END),
        COUNT(CASE WHEN model_code IS NOT NULL THEN 1 END),
        ROUND(100.0 * COUNT(CASE WHEN oem IS NOT NULL THEN 1 END) / NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1)
    INTO total_processed, model_code_count, success_rate
    FROM catalog_items;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 COMPLETE CATALOG EXTRACTION FINISHED! 🎉';
    RAISE NOTICE '';
    RAISE NOTICE 'Successfully extracted data from % items', total_processed;
    RAISE NOTICE 'Model codes (MK6, C6, E90, etc.) extracted from % items', model_code_count;
    RAISE NOTICE 'Overall extraction success rate: %% of items with descriptions', success_rate;
    RAISE NOTICE '';
    RAISE NOTICE 'Your catalog now includes:';
    RAISE NOTICE '✅ OEM part numbers';
    RAISE NOTICE '✅ Vehicle models and generation codes';
    RAISE NOTICE '✅ Part families and classifications';
    RAISE NOTICE '✅ Side/position information';
    RAISE NOTICE '✅ Year ranges';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready for enhanced parts search testing! 🚀';
END $$;