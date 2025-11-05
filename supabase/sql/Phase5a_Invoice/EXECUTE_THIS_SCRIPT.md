# Comprehensive OCR Backfill - READY TO EXECUTE

## Script to Run: `correct_ocr_backfill.sql`

This script will populate ALL missing fields in ALL invoice tables from existing OCR data without requiring a new OCR run.

### What it does:

1. **invoice_lines table**:
   - Adds `source` field (Original/Aftermarket/Used from OCR מקור)
   - Adds `catalog_code` field (from OCR מק"ט חלק)
   - Updates `item_category` based on OCR קטגוריה
   - Maps all existing parts data from `invoice_documents.ocr_structured_data->חלקים`

2. **invoices table**:
   - Populates `supplier_tax_id` from OCR ח.פ. data (including raw_webhook_data)
   - Updates `supplier_name`, `total_before_tax`, `tax_amount`, `total_amount`
   - Sets correct `invoice_date` and `invoice_type`
   - Enhances metadata with vehicle details and totals breakdown

3. **invoice_suppliers table**:
   - Creates comprehensive supplier records with ALL available OCR data
   - Includes phone, address, email, website, business_number
   - Extracts from both structured OCR data and raw_webhook_data
   - Adds statistics (total invoices, amounts, dates)

4. **User tracking**:
   - Populates missing `created_by` and `updated_by` fields
   - Uses most recent active user as default

### To Execute:
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the entire content of `correct_ocr_backfill.sql`
3. Click "Run"

### Expected Results:
- All invoice lines will have source and catalog codes populated
- All invoices will have complete supplier information
- All suppliers will have contact details from OCR
- VAT IDs will be extracted from raw_webhook_data structure
- User tracking fields will be populated

### Data Sources:
- Primary: `invoice_documents.ocr_structured_data`
- Secondary: `invoice_documents.metadata.raw_webhook_data.OCR_INVOICES_*.data`
- **Total Before Tax**: `raw_webhook_data.OCR_INVOICES_*.data["עלות כוללת ללא מע״מ"]`
- **VAT ID**: `raw_webhook_data.OCR_INVOICES_*.data["ח.פ."]`

This addresses ALL the missing field population issues mentioned.