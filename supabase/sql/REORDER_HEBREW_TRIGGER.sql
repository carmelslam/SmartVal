-- Drop and recreate the Hebrew fix trigger to run FIRST

DROP TRIGGER IF EXISTS trigger_00_auto_fix_hebrew_reversal ON catalog_items;
DROP TRIGGER IF EXISTS trigger_01_catalog_items_set_supplier_name ON catalog_items;
DROP TRIGGER IF EXISTS 01_catalog_items_set_supplier_name ON catalog_items;

-- Recreate Hebrew fix trigger (will be order 1 now)
CREATE TRIGGER trigger_00_auto_fix_hebrew_reversal
    BEFORE INSERT OR UPDATE
    ON catalog_items
    FOR EACH ROW
    EXECUTE FUNCTION auto_fix_hebrew_reversal();

-- Recreate supplier name trigger (will be order 2)
CREATE TRIGGER trigger_01_catalog_items_set_supplier_name
    BEFORE INSERT OR UPDATE
    ON catalog_items
    FOR EACH ROW
    EXECUTE FUNCTION set_supplier_name();

-- Verify order
SELECT 
    trigger_name,
    event_manipulation,
    action_order
FROM information_schema.triggers
WHERE event_object_table = 'catalog_items'
ORDER BY action_order;
