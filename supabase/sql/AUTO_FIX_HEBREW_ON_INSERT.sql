-- ============================================================================
-- AUTOMATIC HEBREW REVERSAL FIX ON INSERT
-- Date: 2025-10-02
-- Purpose: Automatically fix reversed Hebrew when catalog is uploaded
-- This runs BEFORE all other triggers (order 0)
-- ============================================================================

DROP FUNCTION IF EXISTS auto_fix_hebrew_reversal() CASCADE;

CREATE OR REPLACE FUNCTION auto_fix_hebrew_reversal()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Fix reversed makes (if they start with reversed patterns)
    IF NEW.make IS NOT NULL THEN
        NEW.make := CASE
            WHEN NEW.make = 'ינימ / וו.מ.ב' THEN 'BMW / מיני'
            WHEN NEW.make = 'יאדנוי' THEN 'יונדאי'
            WHEN NEW.make = 'הדזמ' THEN 'מזדה'
            WHEN NEW.make = 'היק' THEN 'קיה'
            WHEN NEW.make = 'ישיבוצימ' THEN 'מיצובישי'
            WHEN NEW.make = 'הדנוה' THEN 'הונדה'
            WHEN NEW.make = 'הדוקס' THEN 'סקודה'
            WHEN NEW.make = 'תוזיפ' THEN 'פיזו'
            ELSE NEW.make
        END;
    END IF;
    
    -- Fix reversed part_family (if they start with reversed patterns)
    IF NEW.part_family IS NOT NULL THEN
        NEW.part_family := CASE
            WHEN NEW.part_family LIKE 'םישוגפו םינגמ%' THEN 'מגנים ופגושים'
            WHEN NEW.part_family LIKE 'הרואתו םיסנפ%' THEN 'פנסים ותאורה'
            WHEN NEW.part_family LIKE 'םייפנכו תותלד%' THEN 'דלתות וכנפיים'
            WHEN NEW.part_family LIKE 'בכרמ יקלח%' THEN 'חלקי מרכב'
            WHEN NEW.part_family LIKE 'תוארמו תונולח%' THEN 'חלונות ומראות'
            WHEN NEW.part_family LIKE 'םיגלג%' THEN 'גלגלים'
            WHEN NEW.part_family LIKE 'עונמ%' THEN 'מנוע'
            WHEN NEW.part_family LIKE 'למשח%' THEN 'חשמל'
            WHEN NEW.part_family LIKE 'םינפ יקלח%' THEN 'חלקי פנים'
            ELSE NEW.part_family
        END;
    END IF;
    
    -- Fix cat_num_desc - reverse Hebrew portions while preserving English/numbers/spaces
    -- This is the critical fix for descriptions
    IF NEW.cat_num_desc IS NOT NULL AND NEW.cat_num_desc != '' THEN
        -- Check if Hebrew is reversed (contains reversed patterns)
        IF NEW.cat_num_desc LIKE '%ןגמ%' OR NEW.cat_num_desc LIKE '%סנפ%' 
           OR NEW.cat_num_desc LIKE '%ףנכ%' OR NEW.cat_num_desc LIKE '%הלד%'
           OR NEW.cat_num_desc LIKE '%יארמ%' OR NEW.cat_num_desc LIKE '%תלד%' THEN
            -- Use reverse_hebrew() to preserve spaces and non-Hebrew characters
            NEW.cat_num_desc := reverse_hebrew(NEW.cat_num_desc);
        END IF;
        
        -- Fix specific reversed model names that might appear
        NEW.cat_num_desc := REPLACE(NEW.cat_num_desc, 'ףלוג', 'גולף');
        NEW.cat_num_desc := REPLACE(NEW.cat_num_desc, 'ולופ', 'פולו');
        NEW.cat_num_desc := REPLACE(NEW.cat_num_desc, 'ןאוגיט', 'טיגואן');
        NEW.cat_num_desc := REPLACE(NEW.cat_num_desc, 'הלורוק', 'קורולה');
        NEW.cat_num_desc := REPLACE(NEW.cat_num_desc, 'ירמאק', 'קאמרי');
        NEW.cat_num_desc := REPLACE(NEW.cat_num_desc, 'היבטקוא', 'אוקטביה');
        NEW.cat_num_desc := REPLACE(NEW.cat_num_desc, 'ןואל', 'לאון');
        NEW.cat_num_desc := REPLACE(NEW.cat_num_desc, 'הרוב', 'בורה');
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger with order 0 (runs BEFORE all other triggers)
DROP TRIGGER IF EXISTS trigger_00_auto_fix_hebrew_reversal ON catalog_items;

CREATE TRIGGER trigger_00_auto_fix_hebrew_reversal
    BEFORE INSERT OR UPDATE
    ON catalog_items
    FOR EACH ROW
    EXECUTE FUNCTION auto_fix_hebrew_reversal();

-- Verify trigger order
SELECT 
    trigger_name,
    event_manipulation,
    action_order
FROM information_schema.triggers
WHERE event_object_table = 'catalog_items'
ORDER BY action_order;
