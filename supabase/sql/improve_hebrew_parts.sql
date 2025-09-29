-- IMPROVE HEBREW PART FAMILY DETECTION
-- Enhanced detection for Hebrew automotive terms

-- ============================================================================
-- 1. ANALYZE CURRENT HEBREW TERMS IN CATALOG
-- ============================================================================

-- Find common Hebrew terms that aren't being categorized
SELECT 
    'UNCATEGORIZED HEBREW TERMS' as analysis_type,
    substring(cat_num_desc, 1, 30) as sample_desc,
    COUNT(*) as frequency
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL 
AND part_family IS NULL
AND cat_num_desc ~ '[א-ת]'  -- Contains Hebrew characters
GROUP BY substring(cat_num_desc, 1, 30)
ORDER BY frequency DESC
LIMIT 20;

-- ============================================================================
-- 2. ENHANCED HEBREW PART FAMILY EXTRACTION
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_part_family_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    family_result TEXT;
BEGIN
    -- LIGHTING PARTS (פנסים ותאורה)
    IF position('פנס' in desc_text) > 0 OR position('סנפ' in desc_text) > 0 
       OR position('רוטקלפר' in desc_text) > 0 OR position('רטקלפר' in desc_text) > 0
       OR position('תרואת' in desc_text) > 0 OR position('תאורה' in desc_text) > 0
       OR position('זנב' in desc_text) > 0 OR position('בנז' in desc_text) > 0
       OR position('ךוניח' in desc_text) > 0 OR position('חניכה' in desc_text) > 0 THEN
        RETURN 'Lighting';
    END IF;
    
    -- COOLING SYSTEM PARTS (מערכת קירור)
    IF position('רוטאידר' in desc_text) > 0 OR position('רוטידאר' in desc_text) > 0
       OR position('רורק' in desc_text) > 0 OR position('קירור' in desc_text) > 0
       OR position('םימ' in desc_text) > 0 OR position('מים' in desc_text) > 0
       OR position('רסנדנוק' in desc_text) > 0 OR position('קונדנסר' in desc_text) > 0
       OR position('ךרוונמ' in desc_text) > 0 OR position('מאוורר' in desc_text) > 0 THEN
        RETURN 'Cooling';
    END IF;
    
    -- ENGINE PARTS (חלקי מנוע)
    IF position('עונמ' in desc_text) > 0 OR position('מנוע' in desc_text) > 0
       OR position('ץולחמ' in desc_text) > 0 OR position('מלחץ' in desc_text) > 0
       OR position('ןמש' in desc_text) > 0 OR position('שמן' in desc_text) > 0
       OR position('ןמז' in desc_text) > 0 OR position('זמן' in desc_text) > 0
       OR position('שיג' in desc_text) > 0 OR position('גיש' in desc_text) > 0 THEN
        RETURN 'Engine';
    END IF;
    
    -- TRANSMISSION PARTS (תיבת הילוכים)
    IF position('ךוליה' in desc_text) > 0 OR position('הילוך' in desc_text) > 0
       OR position('םיכוליה' in desc_text) > 0 OR position('הילוכים' in desc_text) > 0
       OR position('טמוטוא' in desc_text) > 0 OR position('אוטומט' in desc_text) > 0
       OR position('הביט' in desc_text) > 0 OR position('תיבה' in desc_text) > 0
       OR position('ץמצמ' in desc_text) > 0 OR position('מצמד' in desc_text) > 0 THEN
        RETURN 'Transmission';
    END IF;
    
    -- SUSPENSION PARTS (מתלים)
    IF position('ילתמ' in desc_text) > 0 OR position('מתלי' in desc_text) > 0
       OR position('םילתמ' in desc_text) > 0 OR position('מתלים' in desc_text) > 0
       OR position('רזיטומרא' in desc_text) > 0 OR position('אמורטיזר' in desc_text) > 0
       OR position('ץיפק' in desc_text) > 0 OR position('קפיץ' in desc_text) > 0
       OR position('טוט' in desc_text) > 0 OR position('טוט' in desc_text) > 0 THEN
        RETURN 'Suspension';
    END IF;
    
    -- BRAKING SYSTEM (מערכת בלמים)
    IF position('םלב' in desc_text) > 0 OR position('בלם' in desc_text) > 0
       OR position('םימלב' in desc_text) > 0 OR position('בלמים' in desc_text) > 0
       OR position('קסיד' in desc_text) > 0 OR position('דיסק' in desc_text) > 0
       OR position('תודיפר' in desc_text) > 0 OR position('רפידות' in desc_text) > 0
       OR position('לגרד' in desc_text) > 0 OR position('דרגל' in desc_text) > 0 THEN
        RETURN 'Braking';
    END IF;
    
    -- BODY PARTS (חלקי מרכב)
    IF position('תלד' in desc_text) > 0 OR position('דלת' in desc_text) > 0
       OR position('ףנכ' in desc_text) > 0 OR position('כנף' in desc_text) > 0
       OR position('שוגפ' in desc_text) > 0 OR position('פגוש' in desc_text) > 0
       OR position('ופק' in desc_text) > 0 OR position('קפו' in desc_text) > 0
       OR position('גג' in desc_text) > 0 OR position('ךג' in desc_text) > 0
       OR position('ןעטמ' in desc_text) > 0 OR position('מטען' in desc_text) > 0
       OR position('בכרמ' in desc_text) > 0 OR position('מרכב' in desc_text) > 0 THEN
        RETURN 'Body';
    END IF;
    
    -- MIRRORS (מראות)
    IF position('הארמ' in desc_text) > 0 OR position('מראה' in desc_text) > 0
       OR position('תוארמ' in desc_text) > 0 OR position('מראות' in desc_text) > 0
       OR position('יטרפ' in desc_text) > 0 OR position('פרטי' in desc_text) > 0 THEN
        RETURN 'Mirrors';
    END IF;
    
    -- GLASS PARTS (זכוכית)
    IF position('תיכוכז' in desc_text) > 0 OR position('זכוכית' in desc_text) > 0
       OR position('ולח' in desc_text) > 0 OR position('חלון' in desc_text) > 0
       OR position('הכשמש' in desc_text) > 0 OR position('שמשה' in desc_text) > 0 THEN
        RETURN 'Glass';
    END IF;
    
    -- WHEELS AND TIRES (גלגלים וצמיגים)
    IF position('לגלג' in desc_text) > 0 OR position('גלגל' in desc_text) > 0
       OR position('םילגלג' in desc_text) > 0 OR position('גלגלים' in desc_text) > 0
       OR position('גימצ' in desc_text) > 0 OR position('צמיג' in desc_text) > 0
       OR position('םיגימצ' in desc_text) > 0 OR position('צמיגים' in desc_text) > 0
       OR position('קושיח' in desc_text) > 0 OR position('חישוק' in desc_text) > 0 THEN
        RETURN 'Wheels';
    END IF;
    
    -- FILTERS (מסננים)
    IF position('ןנסמ' in desc_text) > 0 OR position('מסנן' in desc_text) > 0
       OR position('םיננסמ' in desc_text) > 0 OR position('מסננים' in desc_text) > 0
       OR position('רטליפ' in desc_text) > 0 OR position('פילטר' in desc_text) > 0
       OR position('ריוא' in desc_text) > 0 OR position('אוויר' in desc_text) > 0 THEN
        RETURN 'Filters';
    END IF;
    
    -- ELECTRICAL PARTS (חלקים חשמליים)
    IF position('למשח' in desc_text) > 0 OR position('חשמל' in desc_text) > 0
       OR position('יילמשח' in desc_text) > 0 OR position('חשמלי' in desc_text) > 0
       OR position('הללוס' in desc_text) > 0 OR position('סוללה' in desc_text) > 0
       OR position('תמצח' in desc_text) > 0 OR position('חמצת' in desc_text) > 0 THEN
        RETURN 'Electrical';
    END IF;
    
    -- Check English dictionary terms
    SELECT part_family INTO family_result
    FROM dict_parts dp
    WHERE UPPER(desc_text) LIKE '%' || UPPER(dp.synonym) || '%'
    AND dp.part_family IS NOT NULL
    ORDER BY LENGTH(dp.synonym) DESC
    LIMIT 1;
    
    RETURN family_result;
END;
$$;

-- ============================================================================
-- 3. TEST THE IMPROVED FUNCTION
-- ============================================================================

-- Test with your actual problematic descriptions
SELECT 
    'IMPROVED HEBREW DETECTION TEST' as test_type,
    'B9 07 ןיזנב ''טוא םימ רוטאידר' as desc1,
    extract_part_family_from_desc('B9 07 ןיזנב ''טוא םימ רוטאידר') as should_be_cooling,
    'F-22 F30 12-17- םימ רוטאידר' as desc2,
    extract_part_family_from_desc('F-22 F30 12-17- םימ רוטאידר') as should_be_cooling2,
    '/F30 -012 ''לד5 1 ''דס ןגזמ )רוסנדנוק( הבעמ' as desc3,
    extract_part_family_from_desc('/F30 -012 ''לד5 1 ''דס ןגזמ )רוסנדנוק( הבעמ') as should_be_cooling3;

-- ============================================================================
-- 4. UPDATE ITEMS WITH IMPROVED DETECTION
-- ============================================================================

-- Update items that currently have NULL part_family
UPDATE catalog_items SET
    part_family = extract_part_family_from_desc(cat_num_desc)
WHERE cat_num_desc IS NOT NULL 
AND part_family IS NULL;

-- ============================================================================
-- 5. CHECK IMPROVED RESULTS
-- ============================================================================

-- Show improved part family statistics
SELECT 
    'IMPROVED PART FAMILY STATS' as stats_type,
    part_family,
    COUNT(*) as count
FROM catalog_items 
WHERE part_family IS NOT NULL
GROUP BY part_family
ORDER BY count DESC;

-- Show sample of newly categorized items
SELECT 
    'NEWLY CATEGORIZED SAMPLES' as sample_type,
    cat_num_desc,
    part_family
FROM catalog_items 
WHERE part_family IN ('Cooling', 'Engine', 'Transmission', 'Electrical', 'Filters')
LIMIT 10;