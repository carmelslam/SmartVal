Invoice lines :
create table public.invoice_lines (
  id uuid not null default gen_random_uuid (),
  invoice_id uuid null,
  line_number integer null,
  description text null,
  part_id uuid null,
  quantity numeric(10, 2) null,
  unit_price numeric(10, 2) null,
  discount_percent numeric(5, 2) null default 0,
  line_total numeric(10, 2) null,
  source text null,
  catalog_code text null,
  metadata jsonb null,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  item_category text null,
  category_confidence numeric(5, 2) null,
  category_method text null,
  category_suggestions jsonb null,
  constraint invoice_lines_pkey primary key (id),
  constraint invoice_lines_created_by_fkey foreign KEY (created_by) references profiles (user_id),
  constraint invoice_lines_invoice_id_fkey foreign KEY (invoice_id) references invoices (id) on delete CASCADE,
  constraint invoice_lines_part_id_fkey foreign KEY (part_id) references parts_required (id),
  constraint invoice_lines_updated_by_fkey foreign KEY (updated_by) references profiles (user_id),
  constraint invoice_lines_item_category_check check (
    (
      (item_category is null)
      or (
        item_category = any (
          array[
            'part'::text,
            'work'::text,
            'repair'::text,
            'material'::text,
            'other'::text,
            'uncategorized'::text
          ]
        )
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_invoice_lines_created_by on public.invoice_lines using btree (created_by) TABLESPACE pg_default;

create index IF not exists idx_invoice_lines_updated_by on public.invoice_lines using btree (updated_by) TABLESPACE pg_default;

create index IF not exists idx_invoice_lines_part_invoice on public.invoice_lines using btree (part_id, invoice_id) TABLESPACE pg_default
where
  (part_id is not null);

create index IF not exists idx_invoice_lines_metadata_gin on public.invoice_lines using gin (metadata jsonb_path_ops) TABLESPACE pg_default;

create index IF not exists idx_invoice_lines_description_trgm on public.invoice_lines using gin (description gin_trgm_ops) TABLESPACE pg_default;

create index IF not exists idx_invoice_lines_category on public.invoice_lines using btree (item_category) TABLESPACE pg_default
where
  (item_category is not null);

create index IF not exists idx_invoice_lines_invoice_category on public.invoice_lines using btree (invoice_id, item_category) TABLESPACE pg_default;

create trigger auto_categorize_on_insert BEFORE INSERT on invoice_lines for EACH row
execute FUNCTION trigger_auto_categorize_invoice_line ();

create trigger update_invoice_lines_updated_at BEFORE
update on invoice_lines for EACH row
execute FUNCTION update_updated_at ();


Invoices:
create table public.invoices (
  id uuid not null default gen_random_uuid (),
  case_id uuid null,
  plate text not null,
  invoice_number text null,
  invoice_type text null,
  supplier_name text null,
  supplier_tax_id text null,
  issue_date date null,
  due_date date null,
  status text null default 'DRAFT'::text,
  total_before_tax numeric(10, 2) null,
  tax_amount numeric(10, 2) null,
  total_amount numeric(10, 2) null,
  metadata jsonb null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  created_by uuid null,
  updated_by uuid null,
  invoice_date date null,
  constraint invoices_pkey primary key (id),
  constraint invoices_invoice_number_key unique (invoice_number),
  constraint invoices_created_by_fkey foreign KEY (created_by) references profiles (user_id),
  constraint invoices_updated_by_fkey foreign KEY (updated_by) references profiles (user_id),
  constraint invoices_case_id_fkey foreign KEY (case_id) references cases (id) on delete CASCADE,
  constraint invoices_invoice_type_check check (
    (
      invoice_type = any (
        array[
          'PARTS'::text,
          'LABOR'::text,
          'TOWING'::text,
          'OTHER'::text
        ]
      )
    )
  ),
  constraint invoices_status_check check (
    (
      status = any (
        array[
          'DRAFT'::text,
          'PENDING'::text,
          'ASSIGNED'::text,
          'ACCEPTED'::text,
          'SENT'::text,
          'PAID'::text,
          'CANCELLED'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_invoices_created_by on public.invoices using btree (created_by) TABLESPACE pg_default;

create index IF not exists idx_invoices_updated_by on public.invoices using btree (updated_by) TABLESPACE pg_default;

create index IF not exists idx_invoices_case on public.invoices using btree (case_id) TABLESPACE pg_default;

create index IF not exists idx_invoices_status on public.invoices using btree (status) TABLESPACE pg_default;

create index IF not exists idx_invoices_number on public.invoices using btree (invoice_number) TABLESPACE pg_default;

create index IF not exists idx_invoices_case_plate on public.invoices using btree (case_id, plate) TABLESPACE pg_default;

create index IF not exists idx_invoices_status_date on public.invoices using btree (status, issue_date desc) TABLESPACE pg_default;

create index IF not exists idx_invoices_supplier_date on public.invoices using btree (supplier_name, issue_date desc) TABLESPACE pg_default;

create index IF not exists idx_invoices_metadata_gin on public.invoices using gin (metadata jsonb_path_ops) TABLESPACE pg_default;

create index IF not exists idx_invoices_supplier_name_trgm on public.invoices using gin (supplier_name gin_trgm_ops) TABLESPACE pg_default;

create index IF not exists idx_invoices_invoice_date on public.invoices using btree (invoice_date) TABLESPACE pg_default;

create index IF not exists idx_invoices_case_invoice_date on public.invoices using btree (case_id, invoice_date) TABLESPACE pg_default;

create trigger auto_validate_invoice_on_change
after INSERT
or
update on invoices for EACH row
execute FUNCTION trigger_auto_validate_invoice ();

create trigger update_invoices_updated_at BEFORE
update on invoices for EACH row
execute FUNCTION update_updated_at ();

create trigger update_supplier_stats_on_invoice_change
after INSERT
or DELETE
or
update on invoices for EACH row
execute FUNCTION trigger_update_supplier_stats ();

invoice_damage_center_mappings:
create table public.invoice_damage_center_mappings (
  id uuid not null default gen_random_uuid (),
  invoice_id uuid not null,
  invoice_line_id uuid null,
  case_id uuid not null,
  damage_center_id text not null,
  damage_center_name text null,
  field_type text not null,
  field_index integer null,
  field_id text null,
  original_field_data jsonb null,
  mapped_data jsonb null,
  mapping_status text null default 'active'::text,
  is_user_modified boolean null default false,
  user_modifications jsonb null,
  mapping_confidence numeric(5, 2) null,
  validation_status text null default 'pending'::text,
  mapped_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint invoice_damage_center_mappings_pkey primary key (id),
  constraint invoice_damage_center_mappings_case_id_fkey foreign KEY (case_id) references cases (id) on delete CASCADE,
  constraint invoice_damage_center_mappings_invoice_id_fkey foreign KEY (invoice_id) references invoices (id) on delete CASCADE,
  constraint invoice_damage_center_mappings_invoice_line_id_fkey foreign KEY (invoice_line_id) references invoice_lines (id) on delete set null,
  constraint invoice_damage_center_mappings_mapped_by_fkey foreign KEY (mapped_by) references profiles (user_id)
) TABLESPACE pg_default;

create index IF not exists idx_invoice_dc_mappings_invoice_id on public.invoice_damage_center_mappings using btree (invoice_id) TABLESPACE pg_default;

create index IF not exists idx_invoice_dc_mappings_case_id on public.invoice_damage_center_mappings using btree (case_id) TABLESPACE pg_default;

create index IF not exists idx_invoice_dc_mappings_dc_id on public.invoice_damage_center_mappings using btree (damage_center_id) TABLESPACE pg_default;

create index IF not exists idx_invoice_dc_mappings_dc_field on public.invoice_damage_center_mappings using btree (damage_center_id, field_type, field_index) TABLESPACE pg_default;

create index IF not exists idx_invoice_dc_mappings_status on public.invoice_damage_center_mappings using btree (mapping_status) TABLESPACE pg_default
where
  (mapping_status = 'active'::text);

create index IF not exists idx_invoice_dc_mappings_mapped_data_gin on public.invoice_damage_center_mappings using gin (mapped_data jsonb_path_ops) TABLESPACE pg_default;

create trigger update_invoice_dc_mappings_updated_at BEFORE
update on invoice_damage_center_mappings for EACH row
execute FUNCTION update_updated_at ();

Invoice suppliers:

create table public.invoice_suppliers (
  id uuid not null default gen_random_uuid (),
  name text not null,
  tax_id text null,
  business_number text null,
  address text null,
  city text null,
  postal_code text null,
  phone text null,
  email text null,
  website text null,
  category text null,
  subcategory text null,
  is_preferred boolean null default false,
  discount_rate numeric(5, 2) null,
  payment_terms text null,
  total_invoices integer null default 0,
  total_amount numeric(12, 2) null default 0,
  average_invoice_amount numeric(10, 2) null default 0,
  last_invoice_date date null,
  metadata jsonb null,
  notes text null,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint invoice_suppliers_pkey primary key (id),
  constraint invoice_suppliers_name_key unique (name),
  constraint invoice_suppliers_created_by_fkey foreign KEY (created_by) references profiles (user_id),
  constraint invoice_suppliers_updated_by_fkey foreign KEY (updated_by) references profiles (user_id)
) TABLESPACE pg_default;

create index IF not exists idx_invoice_suppliers_name on public.invoice_suppliers using btree (name) TABLESPACE pg_default;

create index IF not exists idx_invoice_suppliers_name_pattern on public.invoice_suppliers using gin (name gin_trgm_ops) TABLESPACE pg_default;

create index IF not exists idx_invoice_suppliers_category on public.invoice_suppliers using btree (category) TABLESPACE pg_default;

create index IF not exists idx_invoice_suppliers_preferred on public.invoice_suppliers using btree (is_preferred) TABLESPACE pg_default
where
  (is_preferred = true);

create index IF not exists idx_invoice_suppliers_last_invoice on public.invoice_suppliers using btree (last_invoice_date desc nulls last) TABLESPACE pg_default;

create index IF not exists idx_invoice_suppliers_metadata_gin on public.invoice_suppliers using gin (metadata jsonb_path_ops) TABLESPACE pg_default;

create trigger update_invoice_suppliers_updated_at BEFORE
update on invoice_suppliers for EACH row
execute FUNCTION update_updated_at ();


invoice_documents:

create table public.invoice_documents (
  id uuid not null default gen_random_uuid (),
  invoice_id uuid null,
  case_id uuid null,
  plate text not null,
  filename text not null,
  file_size bigint null,
  mime_type text null,
  storage_path text null,
  storage_bucket text null default 'docs'::text,
  ocr_status text null default 'pending'::text,
  ocr_raw_text text null,
  ocr_structured_data jsonb null,
  ocr_confidence numeric(5, 2) null,
  language_detected text null default 'he'::text,
  processing_method text null,
  processing_errors jsonb null,
  processing_started_at timestamp with time zone null,
  processing_completed_at timestamp with time zone null,
  uploaded_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  invoice_date date null,
  constraint invoice_documents_pkey primary key (id),
  constraint invoice_documents_case_id_fkey foreign KEY (case_id) references cases (id) on delete CASCADE,
  constraint invoice_documents_invoice_id_fkey foreign KEY (invoice_id) references invoices (id) on delete CASCADE,
  constraint invoice_documents_uploaded_by_fkey foreign KEY (uploaded_by) references profiles (user_id)
) TABLESPACE pg_default;

create index IF not exists idx_invoice_documents_invoice_id on public.invoice_documents using btree (invoice_id) TABLESPACE pg_default;

create index IF not exists idx_invoice_documents_case_id on public.invoice_documents using btree (case_id) TABLESPACE pg_default;

create index IF not exists idx_invoice_documents_plate on public.invoice_documents using btree (plate) TABLESPACE pg_default;

create index IF not exists idx_invoice_documents_ocr_status on public.invoice_documents using btree (ocr_status) TABLESPACE pg_default;

create index IF not exists idx_invoice_documents_uploaded_by on public.invoice_documents using btree (uploaded_by) TABLESPACE pg_default;

create index IF not exists idx_invoice_documents_created_at on public.invoice_documents using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_invoice_documents_ocr_data_gin on public.invoice_documents using gin (ocr_structured_data jsonb_path_ops) TABLESPACE pg_default;

create index IF not exists idx_invoice_documents_case_plate on public.invoice_documents using btree (case_id, plate) TABLESPACE pg_default;

create index IF not exists idx_invoice_documents_invoice_date on public.invoice_documents using btree (invoice_date) TABLESPACE pg_default;

create trigger update_invoice_documents_updated_at BEFORE
update on invoice_documents for EACH row
execute FUNCTION update_updated_at ();



invoice_validations
create table public.invoice_validations (
  id uuid not null default gen_random_uuid (),
  invoice_id uuid not null,
  is_valid boolean null default false,
  validation_errors text[] null,
  validation_warnings text[] null,
  validation_score numeric(5, 2) null,
  manual_corrections jsonb null,
  correction_notes text null,
  approval_status text null default 'pending'::text,
  approval_required boolean null default true,
  reviewed_by uuid null,
  review_date timestamp with time zone null,
  review_notes text null,
  review_duration_seconds integer null,
  approved_by uuid null,
  approval_date timestamp with time zone null,
  approval_notes text null,
  rejected_by uuid null,
  rejection_date timestamp with time zone null,
  rejection_reason text null,
  rules_applied jsonb null,
  auto_validation_enabled boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint invoice_validations_pkey primary key (id),
  constraint invoice_validations_approved_by_fkey foreign KEY (approved_by) references profiles (user_id),
  constraint invoice_validations_invoice_id_fkey foreign KEY (invoice_id) references invoices (id) on delete CASCADE,
  constraint invoice_validations_rejected_by_fkey foreign KEY (rejected_by) references profiles (user_id),
  constraint invoice_validations_reviewed_by_fkey foreign KEY (reviewed_by) references profiles (user_id)
) TABLESPACE pg_default;

create index IF not exists idx_invoice_validations_invoice_id on public.invoice_validations using btree (invoice_id) TABLESPACE pg_default;

create index IF not exists idx_invoice_validations_approval_status on public.invoice_validations using btree (approval_status) TABLESPACE pg_default;

create index IF not exists idx_invoice_validations_is_valid on public.invoice_validations using btree (is_valid) TABLESPACE pg_default;

create index IF not exists idx_invoice_validations_reviewed_by on public.invoice_validations using btree (reviewed_by) TABLESPACE pg_default;

create index IF not exists idx_invoice_validations_review_date on public.invoice_validations using btree (review_date desc nulls last) TABLESPACE pg_default;

create unique INDEX IF not exists idx_invoice_validations_unique_invoice on public.invoice_validations using btree (invoice_id) TABLESPACE pg_default;

create trigger update_invoice_validations_updated_at BEFORE
update on invoice_validations for EACH row
execute FUNCTION update_updated_at ();


selected_parts:

create table public.selected_parts (
  id uuid not null default extensions.uuid_generate_v4 (),
  plate text null,
  search_result_id uuid null,
  part_name text not null,
  price numeric null,
  oem text null,
  quantity integer null default 1,
  damage_center_id text null,
  status text null default 'selected'::text,
  selected_by text null,
  selected_at timestamp with time zone null default now(),
  raw_data jsonb null,
  make text null,
  model text null,
  trim text null,
  year text null,
  engine_volume text null,
  pcode text null,
  cat_num_desc text null,
  source text null,
  availability text null,
  location text null,
  comments text null,
  vin text null,
  engine_code text null,
  engine_type text null,
  supplier_name text null,
  part_family text null,
  data_source text null default 'קטלוג'::text,
  part_make text GENERATED ALWAYS as ((raw_data ->> 'make'::text)) STORED null,
  part_model text GENERATED ALWAYS as ((raw_data ->> 'model'::text)) STORED null,
  part_year_from integer GENERATED ALWAYS as (
    case
      when (
        (raw_data ->> 'year_from'::text) ~ '^[0-9]+$'::text
      ) then ((raw_data ->> 'year_from'::text))::integer
      else null::integer
    end
  ) STORED null,
  part_year_to integer GENERATED ALWAYS as (
    case
      when ((raw_data ->> 'year_to'::text) ~ '^[0-9]+$'::text) then ((raw_data ->> 'year_to'::text))::integer
      else null::integer
    end
  ) STORED null,
  case_id uuid null,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint selected_parts_pkey primary key (id),
  constraint selected_parts_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete set null,
  constraint selected_parts_case_id_fkey foreign KEY (case_id) references cases (id) on delete CASCADE,
  constraint selected_parts_search_result_id_fkey foreign KEY (search_result_id) references parts_search_results (id) on delete set null,
  constraint selected_parts_updated_by_fkey foreign KEY (updated_by) references auth.users (id) on delete set null,
  constraint selected_parts_data_source_check check (
    (
      data_source = any (array['catalog'::text, 'web'::text, 'ocr'::text])
    )
  ),
  constraint selected_parts_status_check check (
    (
      status = any (
        array[
          'selected'::text,
          'assigned'::text,
          'ordered'::text,
          'completed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_selected_parts_oem on public.selected_parts using btree (oem) TABLESPACE pg_default;

create index IF not exists idx_selected_parts_pcode on public.selected_parts using btree (pcode) TABLESPACE pg_default;

create index IF not exists idx_selected_parts_make_model on public.selected_parts using btree (make, model) TABLESPACE pg_default;

create index IF not exists idx_selected_parts_part_make on public.selected_parts using btree (part_make) TABLESPACE pg_default
where
  (part_make is not null);

create index IF not exists idx_selected_parts_compatibility on public.selected_parts using btree (make, part_make, model, part_model) TABLESPACE pg_default
where
  (
    (make is distinct from part_make)
    or (model is distinct from part_model)
  );

create index IF not exists idx_selected_parts_part_year on public.selected_parts using btree (part_year_from, part_year_to) TABLESPACE pg_default
where
  (part_year_from is not null);

create index IF not exists idx_selected_parts_created_by on public.selected_parts using btree (created_by) TABLESPACE pg_default;

create index IF not exists idx_selected_parts_updated_by on public.selected_parts using btree (updated_by) TABLESPACE pg_default;

create index IF not exists idx_selected_parts_plate on public.selected_parts using btree (plate) TABLESPACE pg_default;

create index IF not exists idx_selected_parts_damage_center on public.selected_parts using btree (damage_center_id) TABLESPACE pg_default;

create index IF not exists idx_selected_parts_case_id on public.selected_parts using btree (case_id) TABLESPACE pg_default;

create index IF not exists idx_selected_parts_case_plate on public.selected_parts using btree (case_id, plate) TABLESPACE pg_default;


Supoliers:

create table public.suppliers (
  id uuid not null default extensions.uuid_generate_v4 (),
  slug text not null,
  name text not null,
  type text null,
  active boolean null default true,
  created_at timestamp with time zone null default now(),
  constraint suppliers_pkey primary key (id),
  constraint suppliers_slug_key unique (slug),
  constraint suppliers_type_check check (
    (
      type = any (
        array[
          'catalog'::text,
          'web_search'::text,
          'car-part'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create trigger trg_suppliers_propagate_name
after
update OF name on suppliers for EACH row
execute FUNCTION _propagate_supplier_name_change ();

Catalog;

create table public.catalogs (
  id uuid not null default gen_random_uuid (),
  supplier_id uuid not null,
  version_date date not null,
  source_url text null,
  storage_path text null,
  status text not null default 'queued'::text,
  created_at timestamp with time zone not null default now(),
  processed_at timestamp with time zone null,
  constraint catalogs_pkey primary key (id),
  constraint catalogs_supplier_id_version_date_key unique (supplier_id, version_date),
  constraint catalogs_supplier_id_fkey foreign KEY (supplier_id) references suppliers (id) on delete CASCADE,
  constraint catalogs_status_check check (
    (
      status = any (
        array[
          'queued'::text,
          'processing'::text,
          'ready'::text,
          'error'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;


Catalog items :

create table public.catalog_items (
  id uuid not null default extensions.uuid_generate_v4 (),
  supplier_id uuid null,
  pcode text null,
  cat_num_desc text null,
  price numeric null,
  source text null,
  make text null,
  oem text null,
  availability text null,
  location text null,
  version_date date not null,
  raw_row jsonb null,
  row_hash text null,
  created_at timestamp with time zone null default now(),
  model text null,
  trim text null,
  vin text null,
  engine_volume text null,
  engine_code text null,
  part_family text null,
  supplier_name text null,
  engine_type text null,
  year_from integer null,
  year_to integer null,
  model_code text null,
  year_range text null,
  actual_trim text null,
  side_position text null,
  front_rear text null,
  catalog_id uuid null,
  part_name text null,
  original_price_backup text null,
  extracted_year text null,
  model_display text null,
  make_backup_reversed text null,
  cat_num_desc_backup_reversed text null,
  hebrew_fix_backup jsonb null,
  constraint catalog_items_pkey primary key (id),
  constraint catalog_items_catalog_id_fkey foreign KEY (catalog_id) references catalogs (id) on delete CASCADE,
  constraint catalog_items_supplier_id_fkey foreign KEY (supplier_id) references suppliers (id)
) TABLESPACE pg_default;

create index IF not exists idx_catalog_year_range on public.catalog_items using btree (year_from, year_to) TABLESPACE pg_default;

create index IF not exists idx_catalog_make_model on public.catalog_items using btree (make, model) TABLESPACE pg_default;

create index IF not exists idx_catalog_part_family on public.catalog_items using btree (part_family) TABLESPACE pg_default;

create index IF not exists idx_catalog_supplier_name on public.catalog_items using btree (supplier_name) TABLESPACE pg_default;

create index IF not exists idx_catalog_cat_num_desc_trgm on public.catalog_items using gin (cat_num_desc gin_trgm_ops) TABLESPACE pg_default;

create index IF not exists idx_catalog_model_code on public.catalog_items using btree (model_code) TABLESPACE pg_default;

create index IF not exists idx_catalog_hebrew_text_gin on public.catalog_items using gin (
  to_tsvector(
    'simple'::regconfig,
    (
      (
        (
          (
            (
              (
                (
                  (COALESCE(cat_num_desc, ''::text) || ' '::text) || COALESCE(part_family, ''::text)
                ) || ' '::text
              ) || COALESCE(make, ''::text)
            ) || ' '::text
          ) || COALESCE(model, ''::text)
        ) || ' '::text
      ) || COALESCE(supplier_name, ''::text)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_catalog_part_family_lower on public.catalog_items using btree (lower(part_family)) TABLESPACE pg_default;

create index IF not exists idx_catalog_cat_desc_lower on public.catalog_items using btree (lower(cat_num_desc)) TABLESPACE pg_default;

create index IF not exists idx_catalog_make_lower on public.catalog_items using btree (lower(make)) TABLESPACE pg_default;

create index IF not exists idx_catalog_cat_num_desc_lower_trgm on public.catalog_items using gin (lower(cat_num_desc) gin_trgm_ops) TABLESPACE pg_default;

create index IF not exists idx_catalog_fulltext on public.catalog_items using gin (
  to_tsvector(
    'simple'::regconfig,
    (
      (
        (
          (
            (
              (
                (
                  (
                    (
                      (COALESCE(cat_num_desc, ''::text) || ' '::text) || COALESCE(make, ''::text)
                    ) || ' '::text
                  ) || COALESCE(model, ''::text)
                ) || ' '::text
              ) || COALESCE(part_family, ''::text)
            ) || ' '::text
          ) || COALESCE(oem, ''::text)
        ) || ' '::text
      ) || COALESCE(supplier_name, ''::text)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_catalog_oem on public.catalog_items using btree (oem) TABLESPACE pg_default;

create index IF not exists idx_catalog_make on public.catalog_items using btree (make) TABLESPACE pg_default;

create index IF not exists idx_catalog_model on public.catalog_items using btree (model) TABLESPACE pg_default;

create index IF not exists idx_catalog_desc_gin on public.catalog_items using gin (to_tsvector('simple'::regconfig, cat_num_desc)) TABLESPACE pg_default;

create index IF not exists idx_catalog_supplier on public.catalog_items using btree (supplier_name) TABLESPACE pg_default;

create index IF not exists idx_catalog_items_oem on public.catalog_items using btree (oem) TABLESPACE pg_default;

create index IF not exists idx_catalog_items_pcode on public.catalog_items using btree (pcode) TABLESPACE pg_default;

create index IF not exists idx_catalog_items_make on public.catalog_items using btree (make) TABLESPACE pg_default;

create trigger auto_process_catalog_on_insert BEFORE INSERT on catalog_items for EACH row
execute FUNCTION auto_extract_catalog_data ();

create trigger auto_process_catalog_on_update BEFORE
update on catalog_items for EACH row
execute FUNCTION auto_extract_catalog_data ();

create trigger trigger_01_set_supplier_name BEFORE INSERT
or
update on catalog_items for EACH row
execute FUNCTION _set_supplier_name ();

create trigger trigger_extract_model_and_year BEFORE INSERT
or
update OF cat_num_desc,
make on catalog_items for EACH row
execute FUNCTION extract_model_and_year (); 

name: Parse Parts Catalog

on:
  workflow_dispatch:
    inputs:
      supplier_slug:
        description: Supplier slug
        required: true
        default: m-pines
      signed_url:
        description: Signed URL to PDF (temporary)
        required: true
        default: "https://m-pines.com/wp-content/uploads/2025/06/מחירון-06-25.pdf"
      version_date:
        description: Version date (YYYY-MM-DD)
        required: true
        default: "2025-06-01"
      source_path:
        description: Raw storage path or label
        required: true
        default: vendor_raw/m-pines/2025-06.pdf

  # Listen to ALL repository_dispatch events (no type filter)
  repository_dispatch: {}

jobs:
  parse:
    runs-on: ubuntu-latest
    env:
      # Secrets
      SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
      SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}

      # Prefer repository_dispatch payload; else manual inputs; else defaults
      SUPPLIER_SLUG: ${{ github.event.client_payload.supplier_slug || github.event.inputs.supplier_slug || 'm-pines' }}
      SIGNED_URL:    ${{ github.event.client_payload.signed_url    || github.event.inputs.signed_url    || 'https://example.com/file.pdf' }}
      VERSION_DATE:  ${{ github.event.client_payload.version       || github.event.inputs.version_date  || '2025-06-01' }}
      SOURCE_PATH:   ${{ github.event.client_payload.raw_path      || github.event.inputs.source_path   || 'vendor_raw/m-pines/2025-06.pdf' }}
      PARSED_PATH:   ${{ github.event.client_payload.parsed_path   || 'vendor_parsed/m-pines/2025-06.ndjson' }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Show resolved inputs (debug)
        run: |
          echo "Triggered by: $GITHUB_EVENT_NAME"
          echo "Supplier     : $SUPPLIER_SLUG"
          echo "Version date : $VERSION_DATE"
          echo "Signed URL   : $SIGNED_URL"
          echo "Raw path     : $SOURCE_PATH"
          echo "Parsed path  : $PARSED_PATH"

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install requests pdfplumber supabase

      # Your repo has a folder named "supabase" that shadows the SDK package.
      - name: Avoid local 'supabase' package shadowing
        run: |
          if [ -d "supabase" ]; then mv supabase supabase_project_ci; fi

      - name: Run parser
        run: |
          python parse_mpines_fixed.py


import re
import pdfplumber
import io
import hashlib
import gc

def parse(pdf_bytes, supplier_slug, version_date, source_path):
    """Parse PDF in chunks to avoid memory issues"""
    
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        total_pages = len(pdf.pages)
        print(f"PDF has {total_pages} pages")
        
        # Get supplier ID once
        from supabase_io import get_client, upsert_rows
        client = get_client()
        supplier = client.table("suppliers").select("id").eq("slug", supplier_slug).single().execute()
        supplier_id = supplier.data["id"] if supplier.data else None
        
        batch_rows = []
        total_processed = 0
        BATCH_SIZE = 100  # Process 100 pages at a time
        
        for page_num in range(total_pages):
            try:
                # Progress indicator
                if page_num % 50 == 0:
                    print(f"Processing page {page_num + 1}/{total_pages}...")
                
                page = pdf.pages[page_num]
                tables = page.extract_tables()
                
                if tables:
                    for table in tables:
                        for row_idx, row in enumerate(table):
                            # Skip header
                            if row_idx == 0 and row and 'Pcode' in str(row):
                                continue
                            
                            if row and len(row) >= 5:
                                # Extract columns
                                make = row[0] if row[0] else None
                                source = row[1] if len(row) > 1 else None
                                price_str = row[2] if len(row) > 2 else None
                                cat_num_desc = row[3] if len(row) > 3 else None
                                pcode = row[4] if len(row) > 4 else None
                                
                                # Parse price
                                price = None
                                if price_str:
                                    try:
                                        price_clean = ''.join(c for c in price_str if c.isdigit() or c == '.')
                                        price = float(price_clean) if price_clean else None
                                    except:
                                        pass
                                
                                if pcode or cat_num_desc:
                                    row_data = {
                                        "supplier_id": supplier_id,
                                        "pcode": pcode,
                                        "cat_num_desc": cat_num_desc,
                                        "price": price,
                                        "source": source,
                                        "make": make,
                                        "version_date": version_date,
                                        "raw_row": {"page": page_num + 1}
                                    }
                                    
                                    hash_key = f"{version_date}|{pcode}|{cat_num_desc}|{price}|{make}"
                                    row_data["row_hash"] = hashlib.sha256(hash_key.encode()).hexdigest()
                                    
                                    batch_rows.append(row_data)
                
                # Upload batch every 100 pages
                if (page_num + 1) % BATCH_SIZE == 0 or page_num == total_pages - 1:
                    if batch_rows:
                        print(f"Uploading batch of {len(batch_rows)} rows...")
                        upsert_rows("catalog_items", batch_rows)
                        total_processed += len(batch_rows)
                        print(f"Total processed so far: {total_processed} rows")
                        batch_rows = []  # Clear batch
                        gc.collect()  # Force garbage collection
                        
            except Exception as e:
                print(f"Error on page {page_num + 1}: {str(e)}")
                continue
        
        print(f"Parsing complete. Total rows processed: {total_processed}")
        return []  # Return empty since we already uploaded everything


