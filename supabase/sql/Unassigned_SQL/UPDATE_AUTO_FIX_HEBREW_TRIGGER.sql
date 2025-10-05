-- Update auto_fix_hebrew_reversal to apply reverse_hebrew() to ALL fields
-- Instead of hardcoded CASE statements, detect Hebrew and reverse

DROP FUNCTION IF EXISTS auto_fix_hebrew_reversal() CASCADE;

CREATE OR REPLACE FUNCTION auto_fix_hebrew_reversal()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Fix make field if it contains Hebrew
    IF NEW.make IS NOT NULL AND NEW.make ~ '[א-ת]' THEN
        NEW.make := reverse_hebrew(NEW.make);
    END IF;
    
    -- Fix source field if it contains Hebrew
    IF NEW.source IS NOT NULL AND NEW.source ~ '[א-ת]' THEN
        NEW.source := reverse_hebrew(NEW.source);
    END IF;
    
    -- Fix part_family field if it contains Hebrew
    IF NEW.part_family IS NOT NULL AND NEW.part_family ~ '[א-ת]' THEN
        NEW.part_family := reverse_hebrew(NEW.part_family);
    END IF;
    
    -- Fix cat_num_desc field if it contains Hebrew
    IF NEW.cat_num_desc IS NOT NULL AND NEW.cat_num_desc ~ '[א-ת]' THEN
        NEW.cat_num_desc := reverse_hebrew(NEW.cat_num_desc);
    END IF;
    
    RETURN NEW;
END;
$$;

-- Recreate the trigger to ensure it's first in execution order
DROP TRIGGER IF EXISTS trigger_00_auto_fix_hebrew_reversal ON catalog_items;

CREATE TRIGGER trigger_00_auto_fix_hebrew_reversal
    BEFORE INSERT OR UPDATE ON catalog_items
    FOR EACH ROW
    EXECUTE FUNCTION auto_fix_hebrew_reversal();

-- Test the function with ACTUAL source data patterns (as they come from Excel)
SELECT 
    reverse_hebrew('ןגווסקלופ') as make_test,  -- Should become: פולקסווגן
    reverse_hebrew('יפילח') as source_test;    -- Should become: חליפי
