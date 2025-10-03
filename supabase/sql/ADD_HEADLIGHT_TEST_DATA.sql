-- Add headlight test data for Toyota to verify part filtering works

INSERT INTO catalog_items (
    pcode, cat_num_desc, supplier_name, price, make, model, year_from, year_to, part_family, oem, source, version_date
) VALUES
('TEST-LIGHT-001', 'פנס קדמי ימין - קורולה קרוס', 'טסט ספק', 1500.00, 'טויוטה יפן', 'COROLLA CROSS', 2022, 2025, 'פנסים', 'LIGHT-12345', 'חליפי', CURRENT_DATE),
('TEST-LIGHT-002', 'פנס קדמי שמאל - קורולה קרוס', 'טסט ספק', 1500.00, 'טויוטה יפן', 'COROLLA CROSS', 2022, 2025, 'פנסים', 'LIGHT-12346', 'חליפי', CURRENT_DATE),
('TEST-LIGHT-003', 'פנס אחורי ימין - קורולה קרוס', 'טסט ספק', 800.00, 'טויוטה יפן', 'COROLLA CROSS', 2022, 2025, 'פנסים', 'LIGHT-12347', 'חליפי', CURRENT_DATE);

-- Verify the data
SELECT pcode, cat_num_desc, make, model, part_family, price
FROM catalog_items
WHERE pcode LIKE 'TEST-LIGHT%'
ORDER BY price;
