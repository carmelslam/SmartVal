-- Drop ALL existing triggers on catalog_items
DROP TRIGGER IF EXISTS trigger_00_auto_fix_hebrew_reversal ON catalog_items;
DROP TRIGGER IF EXISTS trigger_01_catalog_items_set_supplier_name ON catalog_items;
DROP TRIGGER IF EXISTS "01_catalog_items_set_supplier_name" ON catalog_items;
DROP TRIGGER IF EXISTS auto_process_catalog_item ON catalog_items;
DROP TRIGGER IF EXISTS auto_process_catalog_on_insert ON catalog_items;
DROP TRIGGER IF EXISTS auto_process_catalog_on_update ON catalog_items;
DROP TRIGGER IF EXISTS trigger_extract_model_and_year ON catalog_items;

-- Recreate in correct order (order is determined by creation sequence)

-- Order 1: Fix Hebrew first
CREATE TRIGGER trigger_00_auto_fix_hebrew_reversal
    BEFORE INSERT OR UPDATE
    ON catalog_items
    FOR EACH ROW
    EXECUTE FUNCTION auto_fix_hebrew_reversal();

-- Order 2: Set supplier name
CREATE TRIGGER trigger_01_set_supplier_name
    BEFORE INSERT OR UPDATE
    ON catalog_items
    FOR EACH ROW
    EXECUTE FUNCTION _set_supplier_name();

-- Order 3: Auto process catalog item
CREATE TRIGGER trigger_02_auto_process_catalog_item
    BEFORE INSERT OR UPDATE
    ON catalog_items
    FOR EACH ROW
    EXECUTE FUNCTION process_catalog_item_complete();

-- Order 4: Extract model and year
CREATE TRIGGER trigger_03_extract_model_and_year
    BEFORE INSERT OR UPDATE OF cat_num_desc, make
    ON catalog_items
    FOR EACH ROW
    EXECUTE FUNCTION extract_model_and_year();

-- Verify trigger order
SELECT 
    trigger_name,
    event_manipulation,
    action_order
FROM information_schema.triggers
WHERE event_object_table = 'catalog_items'
ORDER BY action_order, event_manipulation;
