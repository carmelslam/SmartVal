-- PHASE 2: FIELD EXTRACTION - BATCHED PROCESSING
-- Processes ALL rows in batches to avoid timeout, regardless of table size
-- Automatically detects remaining rows and processes until 100% complete

SELECT '=== PHASE 2: FIELD EXTRACTION - BATCHED ===' as section;

-- ============================================================================
-- STEP 1: ADD MISSING COLUMNS TO CATALOG_ITEMS
-- ============================================================================

-- Add year column for display
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_items' AND column_name = 'extracted_year'
    ) THEN
        ALTER TABLE catalog_items ADD COLUMN extracted_year TEXT;
        RAISE NOTICE 'Added extracted_year column';
    END IF;
END $$;

-- Add model display column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_items' AND column_name = 'model_display'
    ) THEN
        ALTER TABLE catalog_items ADD COLUMN model_display TEXT;
        RAISE NOTICE 'Added model_display column';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: BATCH PROCESS PART NAME EXTRACTION
-- ============================================================================

SELECT '=== BATCH PROCESSING PART NAME EXTRACTION ===' as section;

DO $$
DECLARE
    batch_size INTEGER := 1000;
    total_rows INTEGER;
    processed_rows INTEGER := 0;
    affected_rows INTEGER;
    iteration INTEGER := 0;
BEGIN
    -- Get total rows that need processing
    SELECT COUNT(*) INTO total_rows 
    FROM catalog_items 
    WHERE part_name IS NULL 
      AND cat_num_desc IS NOT NULL 
      AND cat_num_desc ~ '^[\u0590-\u05FF]';
    
    RAISE NOTICE 'Starting part_name extraction for % rows', total_rows;
    
    -- Process in batches until all rows are done
    LOOP
        iteration := iteration + 1;
        
        -- Update batch
        UPDATE catalog_items 
        SET part_name = (regexp_match(cat_num_desc, '^([\u0590-\u05FF]+(?:\s+[\u0590-\u05FF]+)*?)'))[1]
        WHERE id IN (
            SELECT id 
            FROM catalog_items 
            WHERE part_name IS NULL 
              AND cat_num_desc IS NOT NULL 
              AND cat_num_desc ~ '^[\u0590-\u05FF]'
            LIMIT batch_size
        );
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        processed_rows := processed_rows + affected_rows;
        
        RAISE NOTICE 'Iteration %: Processed % rows, Total processed: %/%', 
                     iteration, affected_rows, processed_rows, total_rows;
        
        -- Exit when no more rows to process
        EXIT WHEN affected_rows = 0;
        
        -- Brief pause to prevent overwhelming
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    RAISE NOTICE 'Part name extraction complete: % total rows processed', processed_rows;
END $$;

-- ============================================================================
-- STEP 3: BATCH PROCESS YEAR EXTRACTION FROM CAT_NUM_DESC
-- ============================================================================

SELECT '=== BATCH PROCESSING YEAR EXTRACTION ===' as section;

DO $$
DECLARE
    batch_size INTEGER := 1000;
    total_rows INTEGER;
    processed_rows INTEGER := 0;
    affected_rows INTEGER;
    iteration INTEGER := 0;
BEGIN
    -- Get total rows that need processing
    SELECT COUNT(*) INTO total_rows 
    FROM catalog_items 
    WHERE extracted_year IS NULL 
      AND cat_num_desc ~ '\d{2,4}';
    
    RAISE NOTICE 'Starting year extraction for % rows', total_rows;
    
    -- Process in batches until all rows are done
    LOOP
        iteration := iteration + 1;
        
        -- Update batch
        UPDATE catalog_items 
        SET extracted_year = (regexp_match(cat_num_desc, '(\d{2,4}-\d{2,4}|\d{4})'))[1]
        WHERE id IN (
            SELECT id 
            FROM catalog_items 
            WHERE extracted_year IS NULL 
              AND cat_num_desc ~ '\d{2,4}'
            LIMIT batch_size
        );
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        processed_rows := processed_rows + affected_rows;
        
        RAISE NOTICE 'Iteration %: Processed % rows, Total processed: %/%', 
                     iteration, affected_rows, processed_rows, total_rows;
        
        -- Exit when no more rows to process
        EXIT WHEN affected_rows = 0;
        
        -- Brief pause
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    RAISE NOTICE 'Year extraction complete: % total rows processed', processed_rows;
END $$;

-- ============================================================================
-- STEP 4: BATCH PROCESS YEAR EXTRACTION FROM MODEL FIELD
-- ============================================================================

DO $$
DECLARE
    batch_size INTEGER := 1000;
    total_rows INTEGER;
    processed_rows INTEGER := 0;
    affected_rows INTEGER;
    iteration INTEGER := 0;
BEGIN
    -- Get total rows that need processing
    SELECT COUNT(*) INTO total_rows 
    FROM catalog_items 
    WHERE extracted_year IS NULL 
      AND model ~ '\d{4}';
    
    RAISE NOTICE 'Starting model year extraction for % rows', total_rows;
    
    -- Process in batches until all rows are done
    LOOP
        iteration := iteration + 1;
        
        -- Update batch
        UPDATE catalog_items 
        SET extracted_year = COALESCE(extracted_year, (regexp_match(model, '(\d{4})'))[1])
        WHERE id IN (
            SELECT id 
            FROM catalog_items 
            WHERE extracted_year IS NULL 
              AND model ~ '\d{4}'
            LIMIT batch_size
        );
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        processed_rows := processed_rows + affected_rows;
        
        RAISE NOTICE 'Iteration %: Processed % rows, Total processed: %/%', 
                     iteration, affected_rows, processed_rows, total_rows;
        
        -- Exit when no more rows to process
        EXIT WHEN affected_rows = 0;
        
        -- Brief pause
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    RAISE NOTICE 'Model year extraction complete: % total rows processed', processed_rows;
END $$;

-- ============================================================================
-- STEP 5: BATCH PROCESS MODEL DISPLAY CREATION
-- ============================================================================

SELECT '=== BATCH PROCESSING MODEL DISPLAY CREATION ===' as section;

DO $$
DECLARE
    batch_size INTEGER := 2000;  -- Larger batch for simple field combination
    total_rows INTEGER;
    processed_rows INTEGER := 0;
    affected_rows INTEGER;
    iteration INTEGER := 0;
BEGIN
    -- Get total rows in table
    SELECT COUNT(*) INTO total_rows FROM catalog_items;
    
    RAISE NOTICE 'Starting model_display creation for % rows', total_rows;
    
    -- Process in batches until all rows are done
    LOOP
        iteration := iteration + 1;
        
        -- Update batch
        UPDATE catalog_items 
        SET model_display = CASE 
            WHEN model IS NOT NULL AND extracted_year IS NOT NULL THEN 
                model || ' (' || extracted_year || ')'
            WHEN model IS NOT NULL THEN 
                model
            WHEN extracted_year IS NOT NULL THEN 
                'שנת ' || extracted_year
            ELSE 
                'לא מוגדר'
        END
        WHERE id IN (
            SELECT id 
            FROM catalog_items 
            WHERE model_display IS NULL
            LIMIT batch_size
        );
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        processed_rows := processed_rows + affected_rows;
        
        RAISE NOTICE 'Iteration %: Processed % rows, Total processed: %/%', 
                     iteration, affected_rows, processed_rows, total_rows;
        
        -- Exit when no more rows to process
        EXIT WHEN affected_rows = 0;
        
        -- Brief pause
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    RAISE NOTICE 'Model display creation complete: % total rows processed', processed_rows;
END $$;

-- ============================================================================
-- STEP 6: BATCH PROCESS SMART PART FAMILY CATEGORIZATION
-- ============================================================================

SELECT '=== BATCH PROCESSING PART FAMILY CATEGORIZATION ===' as section;

DO $$
DECLARE
    batch_size INTEGER := 1000;
    total_rows INTEGER;
    processed_rows INTEGER := 0;
    affected_rows INTEGER;
    iteration INTEGER := 0;
BEGIN
    -- Get total rows that need categorization
    SELECT COUNT(*) INTO total_rows 
    FROM catalog_items 
    WHERE part_name IS NOT NULL;
    
    RAISE NOTICE 'Starting part family categorization for % rows', total_rows;
    
    -- Process in batches until all rows are done
    LOOP
        iteration := iteration + 1;
        
        -- Update batch with comprehensive categorization
        UPDATE catalog_items 
        SET part_family = CASE 
            -- פנסים ותאורה
            WHEN part_name ~ 'פנס|נורה|זרקור|מהבהב|איתות|עדשה|רפלקטור' THEN 'פנסים ותאורה'
            
            -- דלתות וכנפיים
            WHEN part_name ~ 'דלת|כנף|מכסה מנוע|תא מטען|חלון' THEN 'דלתות וכנפיים'
            
            -- מגנים ופגושים
            WHEN part_name ~ 'מגן|פגוש|ספוילר|גריל|מסגרת' THEN 'מגנים ופגושים'
            
            -- חלקי מרכב
            WHEN part_name ~ 'ידית|מנעול|ציר|בולם דלת|מרים|תומך|קורת רוחב|שלדת|תא מטען|רצפת|גג|דופן' THEN 'חלקי מרכב'
            
            -- חלונות ומראות
            WHEN part_name ~ 'מראה|חלון|שמשה|זכוכית' THEN 'חלונות ומראות'
            
            -- גלגלים וצמיגים
            WHEN part_name ~ 'גלגל|צמיג|מייסב גלגל|תושבת גלגל|ג''אנט|טאסה' THEN 'גלגלים וצמיגים'
            
            -- מנוע וחלקי מנוע
            WHEN part_name ~ 'מנוע|בלוק|ראש מנוע|משאבת|מסנן|פילטר|אגן שמן|אטם|טרמוסטט|טורבו|אלטרנטור|קראנק|קאמשפט|רצועת|מצת|מזרק' THEN 'מנוע וחלקי מנוע'
            
            -- חיישני מנוע
            WHEN part_name ~ 'חיישן' THEN 'חיישני מנוע'
            
            -- חשמל
            WHEN part_name ~ 'מצבר|ממסר|יחידת בקרה|מחשב|סוויץ|מתג|צמת חוטים|קופסת פיוזים|אזעקה|אימוביליזר' THEN 'חשמל'
            
            -- מערכות בלימה והיגוי
            WHEN part_name ~ 'בלם|קליפר|דיסק|הגה|זרוע|בולם זעזועים|מסרק|רפידות' THEN 'מערכות בלימה והיגוי'
            
            -- תיבת הילוכים וחלקים
            WHEN part_name ~ 'גיר|תיבת|קלאץ|מצמד|דיפרנציאל|סרן|ציריה' THEN 'תיבת הילוכים וחלקים'
            
            -- מערכת דלק
            WHEN part_name ~ 'דלק|טנק|מיכל דלק|מצוף|קרבורטור|מצערת' THEN 'מערכת דלק'
            
            -- מערכות חימום וקירור
            WHEN part_name ~ 'רדיאטור|מאוורר|מזגן|אינטרקולר|מעבה|מאייד|מדחס' THEN 'מערכות חימום וקירור'
            
            -- מערכת ABS
            WHEN part_name ~ 'ABS|טבעות ABS' THEN 'מערכת ABS'
            
            -- מערכת הפליטה
            WHEN part_name ~ 'אגזוז|סעפת|צנרת פליטה|ממיר קטליטי' THEN 'מערכת הפליטה'
            
            -- כריות אוויר
            WHEN part_name ~ 'כרית אוויר|SRS' THEN 'כריות אוויר'
            
            -- אביזרים נלווים
            WHEN part_name ~ 'אנטנה|וו גרירה|מדרגה|חצאית|רדיו' THEN 'אביזרים נלווים'
            
            -- חלקי פנים
            WHEN part_name ~ 'כסא|מושב|דאשבורד|טורפדו|לוח מכוונים|ריפוד|דיפון|קונסולה|תא כפפות|משענת|חגורת בטיחות|מגן שמש|שטיח' THEN 'חלקי פנים'
            
            ELSE COALESCE(part_family, 'לא מוגדר')
        END
        WHERE id IN (
            SELECT id 
            FROM catalog_items 
            WHERE part_name IS NOT NULL
            LIMIT batch_size
        );
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        processed_rows := processed_rows + affected_rows;
        
        RAISE NOTICE 'Iteration %: Processed % rows, Total processed: %/%', 
                     iteration, affected_rows, processed_rows, total_rows;
        
        -- Exit when no more rows to process
        EXIT WHEN affected_rows = 0;
        
        -- Brief pause
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    RAISE NOTICE 'Part family categorization complete: % total rows processed', processed_rows;
END $$;

-- ============================================================================
-- STEP 7: FINAL VALIDATION AND STATISTICS
-- ============================================================================

SELECT '=== FINAL EXTRACTION RESULTS ===' as section;

-- Show extraction statistics
SELECT 
    'Final Extraction Statistics:' as stats_type,
    COUNT(*) as total_records,
    COUNT(part_name) as has_part_name,
    COUNT(extracted_year) as has_year,
    COUNT(model_display) as has_model_display,
    COUNT(CASE WHEN part_family != 'לא מוגדר' THEN 1 END) as categorized_parts,
    ROUND(COUNT(part_name) * 100.0 / COUNT(*), 1) as part_name_percentage,
    ROUND(COUNT(extracted_year) * 100.0 / COUNT(*), 1) as year_percentage,
    ROUND(COUNT(CASE WHEN part_family != 'לא מוגדר' THEN 1 END) * 100.0 / COUNT(*), 1) as categorization_percentage
FROM catalog_items;

-- Show sample results
SELECT 
    'Sample Extracted Data:' as sample_type,
    cat_num_desc,
    part_name,
    extracted_year,
    model_display,
    part_family
FROM catalog_items
WHERE part_name IS NOT NULL
LIMIT 10;

SELECT '=== PHASE 2 COMPLETE - ALL ROWS PROCESSED ===' as section;