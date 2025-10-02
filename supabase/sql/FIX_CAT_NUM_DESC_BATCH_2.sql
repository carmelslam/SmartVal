-- ============================================================================
-- FIX CAT_NUM_DESC REVERSAL - BATCH 2 of 25 (Records 2001-4000)
-- Date: 2025-10-02
-- ============================================================================

UPDATE catalog_items
SET cat_num_desc = reverse_hebrew(cat_num_desc)
WHERE id IN (
    SELECT id 
    FROM catalog_items 
    ORDER BY id 
    OFFSET 2000
    LIMIT 2000
)
AND cat_num_desc IS NOT NULL;

SELECT 'Batch 2 complete' as status;
