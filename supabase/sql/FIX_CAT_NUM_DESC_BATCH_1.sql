-- ============================================================================
-- FIX CAT_NUM_DESC REVERSAL - BATCH 1 of 25 (Records 1-2000)
-- Date: 2025-10-02
-- Run batches one at a time to avoid timeout
-- ============================================================================

UPDATE catalog_items
SET cat_num_desc = reverse_hebrew(cat_num_desc)
WHERE id IN (
    SELECT id 
    FROM catalog_items 
    ORDER BY id 
    LIMIT 2000
)
AND cat_num_desc IS NOT NULL;

-- Quick verification
SELECT COUNT(*) as records_fixed FROM catalog_items WHERE id IN (
    SELECT id FROM catalog_items ORDER BY id LIMIT 2000
);
