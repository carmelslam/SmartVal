-- Fix Hebrew categories back to English in database
-- (UI will display Hebrew translations)

UPDATE invoice_lines 
SET item_category = CASE 
  WHEN item_category = 'חלק' THEN 'part'
  WHEN item_category = 'עבודה' THEN 'work' 
  WHEN item_category = 'תיקון' THEN 'repair'
  WHEN item_category = 'חומר' THEN 'material'
  ELSE item_category
END
WHERE item_category IN ('חלק', 'עבודה', 'תיקון', 'חומר');

-- Report how many were fixed
SELECT 
  'Fixed Hebrew categories back to English' as message,
  COUNT(*) as rows_updated
FROM invoice_lines 
WHERE item_category IN ('part', 'work', 'repair', 'material');