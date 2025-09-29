-- CATNUMDESC DATA EXTRACTION SQL
-- Parses existing CatNumDesc fields to populate OEM, trim, year, model, etc.
-- Run AFTER parts_final_consolidated.sql

-- ============================================================================
-- 1. CREATE DICTIONARY TABLES FOR PATTERN MATCHING
-- ============================================================================

-- Hebrew makes dictionary
CREATE TABLE IF NOT EXISTS dict_makes (
  synonym TEXT PRIMARY KEY,
  canonical TEXT NOT NULL
);

-- Model patterns and body codes
CREATE TABLE IF NOT EXISTS dict_models (
  synonym TEXT PRIMARY KEY,
  canonical TEXT NOT NULL,
  body_code TEXT NULL
);

-- Part cues for side/position/family extraction
CREATE TABLE IF NOT EXISTS dict_parts (
  cue TEXT PRIMARY KEY,
  side TEXT NULL,
  position TEXT NULL,
  part_family TEXT NULL
);

-- Year pattern mapping (016-018 → 2016-2018)
CREATE TABLE IF NOT EXISTS dict_year_patterns (
  pattern TEXT PRIMARY KEY,
  year_from INT NOT NULL,
  year_to INT NOT NULL
);

-- ============================================================================
-- 2. POPULATE DICTIONARIES WITH COMMON PATTERNS
-- ============================================================================

-- Insert Hebrew makes
INSERT INTO dict_makes (synonym, canonical) VALUES
('אאודי', 'Audi'),
('ב.מ.וו', 'BMW'),
('במוו', 'BMW'),
('פולקסווגן', 'Volkswagen'),
('וי.וי', 'Volkswagen'),
('פורד', 'Ford'),
('מרצדס', 'Mercedes'),
('מזדה', 'Mazda'),
('טויוטה', 'Toyota'),
('הונדה', 'Honda'),
('ניסאן', 'Nissan'),
('קיה', 'Kia'),
('יונדאי', 'Hyundai'),
('סובארו', 'Subaru'),
('מיצובישי', 'Mitsubishi'),
('סקודה', 'Skoda'),
('סיאט', 'Seat'),
('רנו', 'Renault'),
('פיג''ו', 'Peugeot'),
('סיטרואן', 'Citroen')
ON CONFLICT (synonym) DO NOTHING;

-- Insert model patterns with body codes
INSERT INTO dict_models (synonym, canonical, body_code) VALUES
('A6', 'A6', NULL),
('C6', 'A6', 'C6'),
('C7', 'A6', 'C7'),
('A4', 'A4', NULL),
('B8', 'A4', 'B8'),
('B9', 'A4', 'B9'),
('A3', 'A3', NULL),
('8P', 'A3', '8P'),
('8V', 'A3', '8V'),
('Q5', 'Q5', NULL),
('Q3', 'Q3', NULL),
('Q7', 'Q7', NULL),
('E90', '3 Series', 'E90'),
('E91', '3 Series', 'E91'),
('E92', '3 Series', 'E92'),
('F30', '3 Series', 'F30'),
('E60', '5 Series', 'E60'),
('F10', '5 Series', 'F10'),
('E70', 'X5', 'E70'),
('F15', 'X5', 'F15'),
('Golf', 'Golf', NULL),
('MK6', 'Golf', 'MK6'),
('MK7', 'Golf', 'MK7'),
('Passat', 'Passat', NULL),
('B6', 'Passat', 'B6'),
('B7', 'Passat', 'B7'),
('B8', 'Passat', 'B8'),
('Polo', 'Polo', NULL),
('Focus', 'Focus', NULL),
('Fiesta', 'Fiesta', NULL),
('Corolla', 'Corolla', NULL),
('Camry', 'Camry', NULL),
('Civic', 'Civic', NULL),
('Accord', 'Accord', NULL)
ON CONFLICT (synonym) DO NOTHING;

-- Insert part cues for Hebrew text parsing
INSERT INTO dict_parts (cue, side, position, part_family) VALUES
('פנס קדמי', NULL, 'קדמי', 'light'),
('פנס אחורי', NULL, 'אחורי', 'light'),
('פנס אח''', NULL, 'אחורי', 'light'),
('פגוש קדמי', NULL, 'קדמי', 'bumper'),
('פגוש אחורי', NULL, 'אחורי', 'bumper'),
('כנף', NULL, 'כנף', 'panel'),
('דלת', NULL, 'דלת', 'panel'),
('מראה', NULL, 'מראה', 'mirror'),
('איתות', NULL, 'מראה', 'light'),
('רפלקטור', NULL, NULL, 'reflector'),
('שמאל', 'שמאל', NULL, NULL),
('שמ''', 'שמאל', NULL, NULL),
('ימין', 'ימין', NULL, NULL),
('ימ''', 'ימין', NULL, NULL),
('ל''', 'שמאל', NULL, NULL),
('ר''', 'ימין', NULL, NULL),
('קדמי', NULL, 'קדמי', NULL),
('אחורי', NULL, 'אחורי', NULL),
('אח''', NULL, 'אחורי', NULL),
('קד''', NULL, 'קדמי', NULL)
ON CONFLICT (cue) DO NOTHING;

-- Insert common year patterns
INSERT INTO dict_year_patterns (pattern, year_from, year_to) VALUES
('007-010', 2007, 2010),
('008-011', 2008, 2011),
('009-012', 2009, 2012),
('010-013', 2010, 2013),
('011-014', 2011, 2014),
('012-015', 2012, 2015),
('013-016', 2013, 2016),
('014-017', 2014, 2017),
('015-018', 2015, 2018),
('016-019', 2016, 2019),
('017-020', 2017, 2020),
('018-021', 2018, 2021),
('019-022', 2019, 2022),
('020-023', 2020, 2023),
('07-10', 2007, 2010),
('08-11', 2008, 2011),
('09-12', 2009, 2012),
('10-13', 2010, 2013),
('11-14', 2011, 2014),
('12-15', 2012, 2015),
('13-16', 2013, 2016),
('14-17', 2014, 2017),
('15-18', 2015, 2018),
('16-19', 2016, 2019),
('17-20', 2017, 2020),
('18-21', 2018, 2021),
('19-22', 2019, 2022),
('20-23', 2020, 2023)
ON CONFLICT (pattern) DO NOTHING;

-- ============================================================================
-- 3. CREATE HELPER FUNCTIONS FOR DATA EXTRACTION
-- ============================================================================

-- Function to extract OEM number from description
CREATE OR REPLACE FUNCTION extract_oem_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    oem_match TEXT;
BEGIN
    -- Look for OEM pattern: alphanumeric block of 8-14 characters at end
    SELECT regexp_match(desc_text, '([A-Z0-9]{8,14})(?:\s|$)', 'g') INTO oem_match;
    
    IF oem_match IS NOT NULL THEN
        RETURN oem_match[1];
    END IF;
    
    -- Alternative pattern: look for common OEM prefixes
    SELECT regexp_match(desc_text, '((?:8E|4F|8K|8J|8P|8V|1K|5K|3C|7L|7P|4B|4D|8D|8H|A6|A4|A3|Q5|Q7)[A-Z0-9]{6,12})', 'gi') INTO oem_match;
    
    IF oem_match IS NOT NULL THEN
        RETURN UPPER(oem_match[1]);
    END IF;
    
    RETURN NULL;
END;
$$;

-- Function to extract year range from description
CREATE OR REPLACE FUNCTION extract_year_range_from_desc(desc_text TEXT)
RETURNS INT[]
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    year_match TEXT;
    year_result INT[] := ARRAY[NULL::INT, NULL::INT];
BEGIN
    -- Check dictionary patterns first
    SELECT ARRAY[year_from, year_to] INTO year_result
    FROM dict_year_patterns dyp
    WHERE desc_text ~ dyp.pattern
    LIMIT 1;
    
    IF year_result[1] IS NOT NULL THEN
        RETURN year_result;
    END IF;
    
    -- Look for pattern like "016-018" or "16-18"
    SELECT regexp_match(desc_text, '(\d{2,3})-(\d{2,3})') INTO year_match;
    
    IF year_match IS NOT NULL THEN
        DECLARE
            y1 INT := year_match[1]::INT;
            y2 INT := year_match[2]::INT;
        BEGIN
            -- Convert 2-3 digit years to full years
            IF y1 < 50 THEN y1 := y1 + 2000; END IF;
            IF y1 >= 50 AND y1 < 100 THEN y1 := y1 + 1900; END IF;
            IF y1 >= 100 AND y1 < 2000 THEN y1 := y1 + 2000; END IF;
            
            IF y2 < 50 THEN y2 := y2 + 2000; END IF;
            IF y2 >= 50 AND y2 < 100 THEN y2 := y2 + 1900; END IF;
            IF y2 >= 100 AND y2 < 2000 THEN y2 := y2 + 2000; END IF;
            
            RETURN ARRAY[y1, y2];
        END;
    END IF;
    
    -- Look for single 4-digit year
    SELECT regexp_match(desc_text, '(20\d{2})') INTO year_match;
    
    IF year_match IS NOT NULL THEN
        DECLARE
            single_year INT := year_match[1]::INT;
        BEGIN
            RETURN ARRAY[single_year, single_year];
        END;
    END IF;
    
    RETURN ARRAY[NULL::INT, NULL::INT];
END;
$$;

-- Function to extract model from description
CREATE OR REPLACE FUNCTION extract_model_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    model_result TEXT;
BEGIN
    -- Check dictionary models
    SELECT canonical INTO model_result
    FROM dict_models dm
    WHERE desc_text ~* dm.synonym
    ORDER BY LENGTH(dm.synonym) DESC
    LIMIT 1;
    
    RETURN model_result;
END;
$$;

-- Function to extract side from description
CREATE OR REPLACE FUNCTION extract_side_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    side_result TEXT;
BEGIN
    -- Check for Hebrew side indicators
    IF desc_text ~* 'שמאל|שמ''|ל''' THEN
        RETURN 'שמאל';
    ELSIF desc_text ~* 'ימין|ימ''|ר''' THEN
        RETURN 'ימין';
    END IF;
    
    -- Check for English side indicators
    IF desc_text ~* '\bLEFT\b|\bL\b' THEN
        RETURN 'שמאל';
    ELSIF desc_text ~* '\bRIGHT\b|\bR\b' THEN
        RETURN 'ימין';
    END IF;
    
    RETURN NULL;
END;
$$;

-- Function to extract position from description
CREATE OR REPLACE FUNCTION extract_position_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
    -- Check for common position patterns
    IF desc_text ~* 'קדמי|קד''' THEN
        RETURN 'קדמי';
    ELSIF desc_text ~* 'אחורי|אח''' THEN
        RETURN 'אחורי';
    ELSIF desc_text ~* 'כנף' THEN
        RETURN 'כנף';
    ELSIF desc_text ~* 'דלת' THEN
        RETURN 'דלת';
    ELSIF desc_text ~* 'מראה' THEN
        RETURN 'מראה';
    ELSIF desc_text ~* 'פגוש' THEN
        RETURN 'פגוש';
    END IF;
    
    RETURN NULL;
END;
$$;

-- Function to extract part family from description
CREATE OR REPLACE FUNCTION extract_part_family_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
    -- Light components
    IF desc_text ~* 'פנס|לד|איתות|רפלקטור' THEN
        RETURN 'light';
    -- Body panels
    ELSIF desc_text ~* 'כנף|דלת|פגוש|קאפוט|מכסה' THEN
        RETURN 'panel';
    -- Mirrors
    ELSIF desc_text ~* 'מראה' THEN
        RETURN 'mirror';
    -- Glass
    ELSIF desc_text ~* 'זכוכית|שמשה' THEN
        RETURN 'glass';
    -- Trim/Interior
    ELSIF desc_text ~* 'רשת|גריל|פנלים|עור' THEN
        RETURN 'trim';
    -- Mechanical
    ELSIF desc_text ~* 'בולם|קפיץ|בלם|דיסק' THEN
        RETURN 'mechanical';
    END IF;
    
    RETURN NULL;
END;
$$;

-- ============================================================================
-- 4. MAIN EXTRACTION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION parse_and_extract_catnumdesc(catalog_id UUID)
RETURNS TABLE(
    extracted_oem TEXT,
    extracted_model TEXT,
    extracted_year_from INT,
    extracted_year_to INT,
    extracted_side TEXT,
    extracted_position TEXT,
    extracted_part_family TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    desc_text TEXT;
    year_range INT[];
BEGIN
    -- Get the current cat_num_desc
    SELECT cat_num_desc INTO desc_text 
    FROM catalog_items 
    WHERE id = catalog_id;
    
    IF desc_text IS NULL THEN
        RETURN;
    END IF;
    
    -- Extract year range
    year_range := extract_year_range_from_desc(desc_text);
    
    -- Return all extracted data
    RETURN QUERY SELECT
        extract_oem_from_desc(desc_text),
        extract_model_from_desc(desc_text),
        year_range[1],
        year_range[2],
        extract_side_from_desc(desc_text),
        extract_position_from_desc(desc_text),
        extract_part_family_from_desc(desc_text);
END;
$$;

-- ============================================================================
-- 5. BATCH EXTRACTION PROCEDURE
-- ============================================================================

CREATE OR REPLACE PROCEDURE extract_all_catnumdesc_data()
LANGUAGE plpgsql
AS $$
DECLARE
    catalog_record RECORD;
    extracted_data RECORD;
    processed_count INT := 0;
    updated_count INT := 0;
BEGIN
    RAISE NOTICE 'Starting CatNumDesc data extraction...';
    
    -- Process all catalog items that have cat_num_desc but missing extracted fields
    FOR catalog_record IN 
        SELECT id, cat_num_desc 
        FROM catalog_items 
        WHERE cat_num_desc IS NOT NULL 
        AND (oem IS NULL OR model IS NULL OR part_family IS NULL)
        ORDER BY id
    LOOP
        processed_count := processed_count + 1;
        
        -- Extract data for this item
        SELECT * INTO extracted_data 
        FROM parse_and_extract_catnumdesc(catalog_record.id);
        
        -- Update the catalog item with extracted data
        UPDATE catalog_items SET
            oem = COALESCE(oem, extracted_data.extracted_oem),
            model = COALESCE(model, extracted_data.extracted_model),
            year = COALESCE(year, CAST(extracted_data.extracted_year_from AS TEXT)),
            trim = COALESCE(trim, 
                CASE 
                    WHEN extracted_data.extracted_year_from IS NOT NULL AND extracted_data.extracted_year_to IS NOT NULL 
                    THEN extracted_data.extracted_year_from::TEXT || '-' || extracted_data.extracted_year_to::TEXT
                    ELSE NULL 
                END
            ),
            -- Add custom fields for extracted data
            engine_volume = COALESCE(engine_volume, 
                CASE 
                    WHEN extracted_data.extracted_side IS NOT NULL 
                    THEN extracted_data.extracted_side
                    ELSE engine_volume
                END
            ),
            engine_code = COALESCE(engine_code,
                CASE 
                    WHEN extracted_data.extracted_position IS NOT NULL 
                    THEN extracted_data.extracted_position
                    ELSE engine_code
                END
            ),
            part_family = COALESCE(part_family, extracted_data.extracted_part_family)
        WHERE id = catalog_record.id;
        
        IF FOUND THEN
            updated_count := updated_count + 1;
        END IF;
        
        -- Progress indicator
        IF processed_count % 1000 = 0 THEN
            RAISE NOTICE 'Processed % items, updated %', processed_count, updated_count;
            COMMIT;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'CatNumDesc extraction complete! Processed: %, Updated: %', processed_count, updated_count;
END;
$$;

-- ============================================================================
-- 6. ADD YEAR_FROM AND YEAR_TO FIELDS FOR PROPER YEAR RANGE SUPPORT
-- ============================================================================

-- Add year range fields to catalog_items for proper filtering
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS year_from INT;
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS year_to INT;

-- Create indexes for year range queries
CREATE INDEX IF NOT EXISTS idx_catalog_year_range ON catalog_items(year_from, year_to);

-- Update year_from/year_to from extracted data
CREATE OR REPLACE PROCEDURE update_year_ranges()
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE NOTICE 'Updating year_from and year_to fields...';
    
    UPDATE catalog_items SET
        year_from = (extract_year_range_from_desc(cat_num_desc))[1],
        year_to = (extract_year_range_from_desc(cat_num_desc))[2]
    WHERE cat_num_desc IS NOT NULL 
    AND (year_from IS NULL OR year_to IS NULL);
    
    RAISE NOTICE 'Year range update complete!';
END;
$$;

-- ============================================================================
-- 7. EXECUTION INSTRUCTIONS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🚀 CATNUMDESC DATA EXTRACTION READY!';
    RAISE NOTICE '';
    RAISE NOTICE 'To extract data from your CatNumDesc fields, run:';
    RAISE NOTICE '1. CALL extract_all_catnumdesc_data();';
    RAISE NOTICE '2. CALL update_year_ranges();';
    RAISE NOTICE '';
    RAISE NOTICE 'This will populate:';
    RAISE NOTICE '- OEM numbers from descriptions';
    RAISE NOTICE '- Model names using dictionary matching';
    RAISE NOTICE '- Year ranges (year_from, year_to)';
    RAISE NOTICE '- Side indicators (שמאל/ימין)';
    RAISE NOTICE '- Position (קדמי/אחורי/כנף/דלת/מראה)';
    RAISE NOTICE '- Part family classifications';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Monitor progress with SELECT COUNT(*) FROM catalog_items WHERE oem IS NOT NULL;';
END $$;