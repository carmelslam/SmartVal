-- Fix invoice_details view to use invoice_date from invoices table directly
-- Simple solution: change the view to use i.invoice_date instead of i.invoice_number_from_issue_date

CREATE OR REPLACE VIEW invoice_details AS
SELECT i.id,
    i.case_id,
    i.plate,
    i.invoice_number,
    i.invoice_type,
    i.supplier_name,
    i.supplier_tax_id,
    i.invoice_date AS invoice_date,  -- FIXED: Use actual invoice_date field
    i.due_date,
    i.status,
    i.total_before_tax,
    i.tax_amount,
    i.total_amount,
    i.created_by,
    i.updated_by,
    i.created_at,
    i.updated_at,
    s.phone AS supplier_phone,
    s.email AS supplier_email,
    s.category AS supplier_category,
    s.is_preferred AS supplier_is_preferred,
    v.is_valid,
    v.validation_errors,
    v.validation_warnings,
    v.validation_score,
    v.approval_status,
    v.reviewed_by,
    v.review_date,
    ( SELECT count(*) AS count
           FROM invoice_lines il
          WHERE (il.invoice_id = i.id)) AS line_items_count,
    ( SELECT count(*) AS count
           FROM invoice_documents d
          WHERE (d.invoice_id = i.id)) AS documents_count
   FROM ((invoices i
     LEFT JOIN invoice_suppliers s ON ((s.name = i.supplier_name)))
     LEFT JOIN invoice_validations v ON ((v.invoice_id = i.id)));