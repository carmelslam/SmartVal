-- ============================================================================
-- FIX HEBREW REVERSAL - MAKES ONLY (BATCH 1)
-- Date: 2025-10-02
-- Purpose: Fix reversed Hebrew text in MAKE field only
-- ============================================================================

-- Fix BMW / Mini
UPDATE catalog_items
SET make = 'BMW / מיני'
WHERE make = 'ינימ / וו.מ.ב';

-- Fix Hyundai
UPDATE catalog_items
SET make = 'יונדאי'
WHERE make = 'יאדנוי';

-- Fix Mazda
UPDATE catalog_items
SET make = 'מזדה'
WHERE make = 'הדזמ';

-- Fix Kia
UPDATE catalog_items
SET make = 'קיה'
WHERE make = 'היק';

-- Fix Mitsubishi
UPDATE catalog_items
SET make = 'מיצובישי'
WHERE make = 'ישיבוצימ';

-- Fix Honda
UPDATE catalog_items
SET make = 'הונדה'
WHERE make = 'הדנוה';

-- Fix Skoda
UPDATE catalog_items
SET make = 'סקודה'
WHERE make = 'הדוקס';

-- Fix Renault
UPDATE catalog_items
SET make = 'רנו'
WHERE make = 'ונר';

-- Verification
SELECT 
    make,
    COUNT(*) as count
FROM catalog_items
WHERE make IN (
    'BMW / מיני', 'יונדאי', 'מזדה', 'קיה', 'מיצובישי', 
    'הונדה', 'סקודה', 'רנו'
)
GROUP BY make
ORDER BY count DESC;
