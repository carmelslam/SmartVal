1. 
[
  {
    "audit_type": "Current Search Functions:",
    "function_name": "advanced_parts_search",
    "parameters": "search_make text, search_model text, search_year integer, search_trim text, search_model_code text, search_part_family text, search_part_name text, search_source text, search_limit integer",
    "return_type": "TABLE(id uuid, cat_num_desc text, supplier_name text, pcode text, price numeric, oem text, make text, model text, part_family text, part_name text, side_position text, front_rear text, version_date text, availability text, extracted_year text, year_from integer, year_to integer, model_display text, match_score integer, fallback_level text)",
    "is_smart_search": false,
    "is_cascading_search": true,
    "uses_hebrew_fix": false
  },
  {
    "audit_type": "Current Search Functions:",
    "function_name": "cascading_parts_search",
    "parameters": "make_param text, model_param text, year_from_param integer, year_to_param integer, actual_trim_param text, model_code_param text, engine_code_param text, engine_type_param text, vin_param text, part_name_param text, part_family_param text, source_param text, limit_results integer",
    "return_type": "TABLE(id uuid, cat_num_desc text, supplier_name text, pcode text, price numeric, oem text, make text, model text, part_family text, part_name text, side_position text, front_rear text, version_date text, availability text, extracted_year text, year_from integer, year_to integer, model_display text, match_score integer, fallback_level text)",
    "is_smart_search": false,
    "is_cascading_search": false,
    "uses_hebrew_fix": true
  },
  {
    "audit_type": "Current Search Functions:",
    "function_name": "debug_parts_search",
    "parameters": "search_params jsonb",
    "return_type": "TABLE(debug_info text, result_count bigint)",
    "is_smart_search": false,
    "is_cascading_search": false,
    "uses_hebrew_fix": false
  },
  {
    "audit_type": "Current Search Functions:",
    "function_name": "enhanced_smart_parts_search",
    "parameters": "make_param text, model_param text, free_query_param text, part_param text, oem_param text, family_param text, limit_results integer",
    "return_type": "TABLE(id uuid, cat_num_desc text, supplier_name text, pcode text, price numeric, oem text, make text, model text, part_family text, side_position text, version_date text, availability text)",
    "is_smart_search": false,
    "is_cascading_search": false,
    "uses_hebrew_fix": false
  },
  {
    "audit_type": "Current Search Functions:",
    "function_name": "fix_hebrew_catalog_batch",
    "parameters": "batch_size integer",
    "return_type": "text",
    "is_smart_search": false,
    "is_cascading_search": false,
    "uses_hebrew_fix": false
  },
  {
    "audit_type": "Current Search Functions:",
    "function_name": "fix_hebrew_if_reversed",
    "parameters": "p_text text",
    "return_type": "text",
    "is_smart_search": false,
    "is_cascading_search": false,
    "uses_hebrew_fix": false
  },
  {
    "audit_type": "Current Search Functions:",
    "function_name": "fix_hebrew_text",
    "parameters": "input_text text",
    "return_type": "text",
    "is_smart_search": false,
    "is_cascading_search": false,
    "uses_hebrew_fix": false
  },
  {
    "audit_type": "Current Search Functions:",
    "function_name": "fix_hebrew_words",
    "parameters": "input_text text",
    "return_type": "text",
    "is_smart_search": false,
    "is_cascading_search": false,
    "uses_hebrew_fix": false
  },
  {
    "audit_type": "Current Search Functions:",
    "function_name": "process_catalog_item",
    "parameters": "",
    "return_type": "trigger",
    "is_smart_search": false,
    "is_cascading_search": false,
    "uses_hebrew_fix": false
  },
  {
    "audit_type": "Current Search Functions:",
    "function_name": "process_catalog_item_complete",
    "parameters": "",
    "return_type": "trigger",
    "is_smart_search": false,
    "is_cascading_search": false,
    "uses_hebrew_fix": false
  },
  {
    "audit_type": "Current Search Functions:",
    "function_name": "save_parts_search_session",
    "parameters": "p_plate text, p_search_data jsonb",
    "return_type": "uuid",
    "is_smart_search": false,
    "is_cascading_search": false,
    "uses_hebrew_fix": false
  },
  {
    "audit_type": "Current Search Functions:",
    "function_name": "save_search_result",
    "parameters": "p_session_id uuid, p_result_data jsonb",
    "return_type": "uuid",
    "is_smart_search": false,
    "is_cascading_search": false,
    "uses_hebrew_fix": false
  },
  {
    "audit_type": "Current Search Functions:",
    "function_name": "search_by_part",
    "parameters": "search_part_name text, search_make text",
    "return_type": "TABLE(id uuid, cat_num_desc text, supplier_name text, pcode text, price numeric, oem text, make text, model text, part_family text, side_position text, version_date text, availability text, extracted_year text, model_display text, match_score integer)",
    "is_smart_search": true,
    "is_cascading_search": false,
    "uses_hebrew_fix": false
  },
  {
    "audit_type": "Current Search Functions:",
    "function_name": "search_by_vehicle",
    "parameters": "vehicle_make text, vehicle_model text, vehicle_year text",
    "return_type": "TABLE(id uuid, cat_num_desc text, supplier_name text, pcode text, price numeric, oem text, make text, model text, part_family text, side_position text, version_date text, availability text, extracted_year text, model_display text, match_score integer)",
    "is_smart_search": true,
    "is_cascading_search": false,
    "uses_hebrew_fix": false
  },
  {
    "audit_type": "Current Search Functions:",
    "function_name": "search_catalog",
    "parameters": "search_term text",
    "return_type": "TABLE(pcode text, cat_num_desc text, price numeric, make text, supplier_name text, oem text, availability text)",
    "is_smart_search": false,
    "is_cascading_search": false,
    "uses_hebrew_fix": false
  },
  {
    "audit_type": "Current Search Functions:",
    "function_name": "search_catalog_by_session",
    "parameters": "in_session_id uuid, in_limit integer",
    "return_type": "TABLE(id uuid, supplier_id uuid, supplier_name text, pcode text, oem text, make text, model text, model_code text, \"trim\" text, year_from integer, year_to integer, engine_volume text, engine_code text, engine_type text, vin text, side_position text, front_rear text, part_family text, price numeric, cat_num_desc text, version_date date, location text, availability text, comments text)",
    "is_smart_search": false,
    "is_cascading_search": false,
    "uses_hebrew_fix": false
  },
  {
    "audit_type": "Current Search Functions:",
    "function_name": "search_catalog_hebrew",
    "parameters": "search_term text",
    "return_type": "TABLE(id uuid, pcode text, cat_num_desc text, part_family text, make text, model text, year_from integer, year_to integer, price numeric, oem text, supplier_name text, availability text, location text, comments text, version_date date, created_at timestamp with time zone, source text)",
    "is_smart_search": false,
    "is_cascading_search": false,
    "uses_hebrew_fix": false
  },
  {
    "audit_type": "Current Search Functions:",
    "function_name": "search_catalog_hebrew_filtered",
    "parameters": "search_term text, filter_make text, filter_model text, max_results integer",
    "return_type": "TABLE(id uuid, pcode text, cat_num_desc text, part_family text, make text, model text, year_from integer, year_to integer, price numeric, oem text, supplier_name text, availability text, location text, comments text, version_date date, created_at timestamp with time zone, source text, relevance_score integer)",
    "is_smart_search": false,
    "is_cascading_search": false,
    "uses_hebrew_fix": false
  },
  {
    "audit_type": "Current Search Functions:",
    "function_name": "search_catalog_hebrew_simple",
    "parameters": "search_term text, max_results integer",
    "return_type": "SETOF catalog_items",
    "is_smart_search": false,
    "is_cascading_search": false,
    "uses_hebrew_fix": false
  },
  {
    "audit_type": "Current Search Functions:",
    "function_name": "search_parts_comprehensive",
    "parameters": "p_plate text, p_make text, p_model text, p_trim_level text, p_year text, p_engine_volume text, p_engine_code text, p_engine_type text, p_vin text, p_oem text, p_part_family text, p_part_name text, p_free_query text",
    "return_type": "TABLE(id uuid, supplier_name text, pcode text, cat_num_desc text, price numeric, oem text, availability text, location text, comments text, make text, model text, \"trim\" text, year text, engine_volume text, part_family text, source text)",
    "is_smart_search": false,
    "is_cascading_search": false,
    "uses_hebrew_fix": false
  },
  {
    "audit_type": "Current Search Functions:",
    "function_name": "search_parts_simple",
    "parameters": "search_text text, make_filter text, limit_results integer",
    "return_type": "TABLE(id uuid, cat_num_desc text, supplier_name text, pcode text, price numeric, oem text, make text, model text, part_family text, part_name text, side_position text, front_rear text, year_range text, availability text, version_date date)",
    "is_smart_search": false,
    "is_cascading_search": false,
    "uses_hebrew_fix": false
  },
  {
    "audit_type": "Current Search Functions:",
    "function_name": "simple_parts_search",
    "parameters": "search_make text, search_part_name text, search_limit integer",
    "return_type": "TABLE(id uuid, cat_num_desc text, supplier_name text, pcode text, price numeric, oem text, make text, model text, part_family text, part_name text, side_position text, front_rear text, version_date text, availability text, extracted_year text, year_from integer, year_to integer, model_display text, match_score integer, fallback_level text)",
    "is_smart_search": false,
    "is_cascading_search": true,
    "uses_hebrew_fix": false
  },
  {
    "audit_type": "Current Search Functions:",
    "function_name": "simple_parts_search",
    "parameters": "search_params jsonb",
    "return_type": "TABLE(id bigint, cat_num_desc text, supplier_name text, pcode text, price numeric, oem text, make text, model text, part_family text, side_position text, front_rear text, year_range text, availability text, relevance_score integer)",
    "is_smart_search": true,
    "is_cascading_search": false,
    "uses_hebrew_fix": false
  },
  {
    "audit_type": "Current Search Functions:",
    "function_name": "smart_parts_search",
    "parameters": "make_param text, model_param text, free_query_param text, part_param text, oem_param text, family_param text, limit_results integer, car_plate text, engine_code_param text, engine_type_param text, engine_volume_param text, model_code_param text, quantity_param integer, source_param text, trim_param text, vin_number_param text, year_param text",
    "return_type": "TABLE(id uuid, cat_num_desc text, supplier_name text, pcode text, price numeric, oem text, make text, model text, part_family text, side_position text, version_date text, availability text, extracted_year text, model_display text, match_score integer)",
    "is_smart_search": false,
    "is_cascading_search": false,
    "uses_hebrew_fix": true
  },
  {
    "audit_type": "Current Search Functions:",
    "function_name": "test_hebrew_search",
    "parameters": "",
    "return_type": "text",
    "is_smart_search": false,
    "is_cascading_search": false,
    "uses_hebrew_fix": false
  }
]

2. 

[
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "check_catalog_processing_status",
    "parameters": "",
    "function_category": "Data Processing"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "process_catalog_item",
    "parameters": "",
    "function_category": "Data Processing"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "process_catalog_item_complete",
    "parameters": "",
    "function_category": "Data Processing"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "auto_extract_catalog_data",
    "parameters": "",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "enhanced_extract_batch_fixed",
    "parameters": "IN batch_limit integer",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "extract_all_catnumdesc_data",
    "parameters": "",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "extract_core_part_term",
    "parameters": "query_text text",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "extract_model_code_from_desc",
    "parameters": "desc_text text",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "extract_model_from_desc",
    "parameters": "desc_text text",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "extract_oem_from_desc",
    "parameters": "desc_text text",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "extract_part_family_fixed",
    "parameters": "desc_text text",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "extract_part_family_from_desc",
    "parameters": "desc_text text",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "extract_part_name",
    "parameters": "desc_text text",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "extract_part_name_from_desc",
    "parameters": "cat_desc text",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "extract_position_fixed",
    "parameters": "desc_text text",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "extract_position_from_desc",
    "parameters": "desc_text text",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "extract_side_fixed",
    "parameters": "desc_text text",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "extract_side_from_desc",
    "parameters": "cat_desc text",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "extract_simple_make",
    "parameters": "desc_text text",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "extract_simple_part_family",
    "parameters": "desc_text text",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "extract_simple_position",
    "parameters": "desc_text text",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "extract_simple_side",
    "parameters": "desc_text text",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "extract_simple_years",
    "parameters": "desc_text text",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "extract_trim_from_desc",
    "parameters": "desc_text text",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "extract_year_range_as_text",
    "parameters": "desc_text text",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "extract_year_range_from_desc",
    "parameters": "desc_text text",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "gin_extract_query_trgm",
    "parameters": "text, internal, smallint, internal, internal, internal, internal",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "gin_extract_value_trgm",
    "parameters": "text, internal",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "parse_and_extract_catnumdesc",
    "parameters": "catalog_id uuid",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "run_simple_hebrew_extraction",
    "parameters": "batch_size integer",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "simple_extract_batch",
    "parameters": "IN batch_limit integer",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "test_extraction_enhanced",
    "parameters": "test_desc text",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "test_extraction_simple",
    "parameters": "test_desc text",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "test_extraction_simple_fixed",
    "parameters": "test_desc text",
    "function_category": "Field Extraction"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "fix_hebrew_catalog_batch",
    "parameters": "batch_size integer",
    "function_category": "Hebrew Fix"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "fix_hebrew_if_reversed",
    "parameters": "p_text text",
    "function_category": "Hebrew Fix"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "fix_hebrew_text",
    "parameters": "input_text text",
    "function_category": "Hebrew Fix"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "fix_hebrew_words",
    "parameters": "input_text text",
    "function_category": "Hebrew Fix"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "get_hebrew_part_family",
    "parameters": "desc_text text, eng_family text",
    "function_category": "Hebrew Fix"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "reverse_hebrew",
    "parameters": "input_text text",
    "function_category": "Hebrew Fix"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "reverse_hebrew_text",
    "parameters": "input_text text",
    "function_category": "Hebrew Fix"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "search_catalog_hebrew",
    "parameters": "search_term text",
    "function_category": "Hebrew Fix"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "search_catalog_hebrew_filtered",
    "parameters": "search_term text, filter_make text, filter_model text, max_results integer",
    "function_category": "Hebrew Fix"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "search_catalog_hebrew_simple",
    "parameters": "search_term text, max_results integer",
    "function_category": "Hebrew Fix"
  },
  {
    "audit_type": "Extraction & Processing Functions:",
    "function_name": "test_hebrew_search",
    "parameters": "",
    "function_category": "Hebrew Fix"
  }
]

3. 

[
  {
    "audit_type": "Active Triggers:",
    "trigger_name": "save_helper_version_trigger",
    "table_name": "case_helper",
    "action_timing": "AFTER",
    "trigger_event": "INSERT",
    "action_statement": "EXECUTE FUNCTION save_helper_version()"
  },
  {
    "audit_type": "Active Triggers:",
    "trigger_name": "save_helper_version_trigger",
    "table_name": "case_helper",
    "action_timing": "AFTER",
    "trigger_event": "UPDATE",
    "action_statement": "EXECUTE FUNCTION save_helper_version()"
  },
  {
    "audit_type": "Active Triggers:",
    "trigger_name": "update_case_helper_updated_at",
    "table_name": "case_helper",
    "action_timing": "BEFORE",
    "trigger_event": "UPDATE",
    "action_statement": "EXECUTE FUNCTION update_updated_at()"
  },
  {
    "audit_type": "Active Triggers:",
    "trigger_name": "update_cases_updated_at",
    "table_name": "cases",
    "action_timing": "BEFORE",
    "trigger_event": "UPDATE",
    "action_statement": "EXECUTE FUNCTION update_updated_at()"
  },
  {
    "audit_type": "Active Triggers:",
    "trigger_name": "01_catalog_items_set_supplier_name",
    "table_name": "catalog_items",
    "action_timing": "BEFORE",
    "trigger_event": "UPDATE",
    "action_statement": "EXECUTE FUNCTION _set_supplier_name()"
  },
  {
    "audit_type": "Active Triggers:",
    "trigger_name": "01_catalog_items_set_supplier_name",
    "table_name": "catalog_items",
    "action_timing": "BEFORE",
    "trigger_event": "INSERT",
    "action_statement": "EXECUTE FUNCTION _set_supplier_name()"
  },
  {
    "audit_type": "Active Triggers:",
    "trigger_name": "auto_process_catalog_item",
    "table_name": "catalog_items",
    "action_timing": "BEFORE",
    "trigger_event": "UPDATE",
    "action_statement": "EXECUTE FUNCTION process_catalog_item_complete()"
  },
  {
    "audit_type": "Active Triggers:",
    "trigger_name": "auto_process_catalog_item",
    "table_name": "catalog_items",
    "action_timing": "BEFORE",
    "trigger_event": "INSERT",
    "action_statement": "EXECUTE FUNCTION process_catalog_item_complete()"
  },
  {
    "audit_type": "Active Triggers:",
    "trigger_name": "auto_process_catalog_on_insert",
    "table_name": "catalog_items",
    "action_timing": "BEFORE",
    "trigger_event": "INSERT",
    "action_statement": "EXECUTE FUNCTION auto_extract_catalog_data()"
  },
  {
    "audit_type": "Active Triggers:",
    "trigger_name": "auto_process_catalog_on_update",
    "table_name": "catalog_items",
    "action_timing": "BEFORE",
    "trigger_event": "UPDATE",
    "action_statement": "EXECUTE FUNCTION auto_extract_catalog_data()"
  },
  {
    "audit_type": "Active Triggers:",
    "trigger_name": "update_invoices_updated_at",
    "table_name": "invoices",
    "action_timing": "BEFORE",
    "trigger_event": "UPDATE",
    "action_statement": "EXECUTE FUNCTION update_updated_at()"
  },
  {
    "audit_type": "Active Triggers:",
    "trigger_name": "update_orgs_updated_at",
    "table_name": "orgs",
    "action_timing": "BEFORE",
    "trigger_event": "UPDATE",
    "action_statement": "EXECUTE FUNCTION update_updated_at()"
  },
  {
    "audit_type": "Active Triggers:",
    "trigger_name": "update_parts_required_updated_at",
    "table_name": "parts_required",
    "action_timing": "BEFORE",
    "trigger_event": "UPDATE",
    "action_statement": "EXECUTE FUNCTION update_updated_at()"
  },
  {
    "audit_type": "Active Triggers:",
    "trigger_name": "update_profiles_updated_at",
    "table_name": "profiles",
    "action_timing": "BEFORE",
    "trigger_event": "UPDATE",
    "action_statement": "EXECUTE FUNCTION update_updated_at()"
  },
  {
    "audit_type": "Active Triggers:",
    "trigger_name": "trg_suppliers_propagate_name",
    "table_name": "suppliers",
    "action_timing": "AFTER",
    "trigger_event": "UPDATE",
    "action_statement": "EXECUTE FUNCTION _propagate_supplier_name_change()"
  }
]

4.

[
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "cat_num_desc",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Core Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "price",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Core Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "make",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Core Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "model",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Core Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "part_family",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Extracted Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "part_name",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Extracted Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "extracted_year",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Extracted Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "model_display",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Extracted Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()",
    "field_category": "Other Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "supplier_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Other Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "pcode",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Other Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "source",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Other Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "oem",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Other Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "availability",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Other Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "location",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Other Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "version_date",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": null,
    "field_category": "Other Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "raw_row",
    "data_type": "jsonb",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Other Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "row_hash",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Other Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "field_category": "Other Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "trim",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Other Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "vin",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Other Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "engine_volume",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Other Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "engine_code",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Other Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "supplier_name",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Other Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "engine_type",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Other Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "year_from",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Other Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "year_to",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Other Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "actual_trim",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Other Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "front_rear",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Other Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "catalog_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Other Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "original_price_backup",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Other Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "model_code",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Parsed Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "year_range",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Parsed Field"
  },
  {
    "audit_type": "Table Structure Analysis:",
    "column_name": "side_position",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "field_category": "Parsed Field"
  }
]

5. 

[
  {
    "audit_type": "Data Quality Status:",
    "total_records": 48272,
    "has_part_name": 48272,
    "has_extracted_year": 10463,
    "has_model_display": 48272,
    "has_valid_part_family": 34829,
    "part_name_completion_pct": "100.0",
    "year_extraction_pct": "21.7",
    "family_categorization_pct": "72.2"
  }
]

6. 

Success. No rows returned

7.

[
  {
    "audit_type": "Potential Conflicts Analysis:",
    "smart_search_variants": 1,
    "cascading_search_exists": 1,
    "simple_search_exists": 2,
    "advanced_search_exists": 1,
    "hebrew_fix_exists": 1,
    "deployment_status": "WARNING: cascading_parts_search already exists"
  }
]

8. 

Success. No rows returned

9.


=== FUNCTION AUDIT COMPLETE ===
