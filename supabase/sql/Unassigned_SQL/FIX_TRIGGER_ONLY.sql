-- FIX: Update trigger to NOT reverse part_family (only cat_num_desc)
-- This prevents future data from being reversed

CREATE OR REPLACE FUNCTION process_hebrew_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only reverse cat_num_desc (part description)
    IF NEW.cat_num_desc IS NOT NULL AND NEW.cat_num_desc != '' THEN
        NEW.cat_num_desc := reverse_hebrew(NEW.cat_num_desc);
    END IF;
    
    -- DO NOT reverse part_family - store as-is
    -- DO NOT reverse make, model, or other fields
    
    RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS hebrew_reversal_trigger ON catalog_items;
CREATE TRIGGER hebrew_reversal_trigger
    BEFORE INSERT OR UPDATE ON catalog_items
    FOR EACH ROW
    EXECUTE FUNCTION process_hebrew_before_insert();

-- Test: Insert new row and verify part_family is NOT reversed
INSERT INTO catalog_items (
    pcode, cat_num_desc, part_family, supplier_name, price, make, model, version_date
) VALUES (
    'TEST-TRIGGER', 'דלת קדמית', 'מגנים ופגושים', 'test', 100, 'טסט', 'טסט', CURRENT_DATE
);

-- Verify
SELECT pcode, cat_num_desc, part_family 
FROM catalog_items 
WHERE pcode = 'TEST-TRIGGER';

-- Clean up test
DELETE FROM catalog_items WHERE pcode = 'TEST-TRIGGER';
