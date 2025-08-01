// 🗺️ STANDARDIZED FIELD MAPPING SYSTEM
// Single source of truth for field name to helper path mapping
// Ensures consistent data flow across all modules

class FieldMapper {
  constructor() {
    // Standardized field mappings - field name -> helper path
    this.fieldMappings = {
      // Vehicle Information (Single Source: helper.vehicle.*)
      'vehicle_plate': ['vehicle', 'plate'],
      'plate': ['vehicle', 'plate'],
      'manufacturer': ['vehicle', 'manufacturer'],
      'vehicle_manufacturer': ['vehicle', 'manufacturer'],
      'model': ['vehicle', 'model'],
      'vehicle_model': ['vehicle', 'model'],
      'model_code': ['vehicle', 'model_code'],
      'vehicle_model_code': ['vehicle', 'model_code'],
      'model_type': ['vehicle', 'model_type'],
      'vehicle_model_type': ['vehicle', 'model_type'],
      'trim': ['vehicle', 'trim'],
      'vehicle_trim': ['vehicle', 'trim'],
      'year': ['vehicle', 'year'],
      'vehicle_year': ['vehicle', 'year'],
      'chassis': ['vehicle', 'chassis'],
      'vehicle_chassis': ['vehicle', 'chassis'],
      'engine_volume': ['vehicle', 'engine_volume'],
      'vehicle_engine_volume': ['vehicle', 'engine_volume'],
      'fuel_type': ['vehicle', 'fuel_type'],
      'vehicle_fuel_type': ['vehicle', 'fuel_type'],
      'transmission': ['vehicle', 'transmission'],
      'vehicle_transmission': ['vehicle', 'transmission'],
      'is_automatic': ['vehicle', 'is_automatic'],
      'vehicle_is_automatic': ['vehicle', 'is_automatic'],
      'drive_type': ['vehicle', 'drive_type'],
      'vehicle_drive_type': ['vehicle', 'drive_type'],
      'km': ['vehicle', 'km'],
      'vehicle_km': ['vehicle', 'km'],
      'mileage': ['vehicle', 'km'],
      'office_code': ['vehicle', 'office_code'],
      'vehicle_office_code': ['vehicle', 'office_code'],
      'ownership_type': ['vehicle', 'ownership_type'],
      'vehicle_ownership_type': ['vehicle', 'ownership_type'],
      'registration_date': ['vehicle', 'registration_date'],
      'vehicle_registration_date': ['vehicle', 'registration_date'],
      'category': ['vehicle', 'category'],
      'vehicle_category': ['vehicle', 'category'],
      'features': ['vehicle', 'features'],
      'vehicle_features': ['vehicle', 'features'],
      'condition': ['vehicle', 'condition'],
      'vehicle_condition': ['vehicle', 'condition'],
      'market_value': ['vehicle', 'market_value'],
      'vehicle_market_value': ['vehicle', 'market_value'],

      // Case Information (Single Source: helper.case_info.*)
      'case_id': ['case_info', 'case_id'],
      'case_plate': ['case_info', 'plate'],
      'status': ['case_info', 'status'],
      'case_status': ['case_info', 'status'],
      'damage_date': ['case_info', 'damage_date'],
      'damage_date_independent': ['case_info', 'damage_date'],
      'case_damage_date': ['case_info', 'damage_date'],
      'inspection_date': ['case_info', 'inspection_date'],
      'case_inspection_date': ['case_info', 'inspection_date'],
      'submission_date': ['case_info', 'submission_date'],
      'case_submission_date': ['case_info', 'submission_date'],
      'inspection_location': ['case_info', 'inspection_location'],
      'case_inspection_location': ['case_info', 'inspection_location'],
      'damage_type': ['case_info', 'damage_type'],
      'case_damage_type': ['case_info', 'damage_type'],
      'report_type': ['case_info', 'report_type'],
      'case_report_type': ['case_info', 'report_type'],
      'report_type_display': ['case_info', 'report_type_display'],

      // Stakeholder Information (Single Source: helper.stakeholders.*)
      'owner_name': ['stakeholders', 'owner', 'name'],
      'client_name': ['stakeholders', 'owner', 'name'],
      'owner_address': ['stakeholders', 'owner', 'address'],
      'client_address': ['stakeholders', 'owner', 'address'],
      'owner_phone': ['stakeholders', 'owner', 'phone'],
      'client_phone': ['stakeholders', 'owner', 'phone'],
      'owner_email': ['stakeholders', 'owner', 'email'],
      'client_email': ['stakeholders', 'owner', 'email'],
      
      'garage_name': ['stakeholders', 'garage', 'name'],
      'garage_contact_person': ['stakeholders', 'garage', 'contact_person'],
      'garage_phone': ['stakeholders', 'garage', 'phone'],
      'garage_email': ['stakeholders', 'garage', 'email'],
      'garage_address': ['stakeholders', 'garage', 'address'],
      
      'insurance_company': ['stakeholders', 'insurance', 'company'],
      'insurance_email': ['stakeholders', 'insurance', 'email'],
      'insurance_policy_number': ['stakeholders', 'insurance', 'policy_number'],
      'insurance_claim_number': ['stakeholders', 'insurance', 'claim_number'],
      'insurance_agent_name': ['stakeholders', 'insurance', 'agent', 'name'],
      'insurance_agent_phone': ['stakeholders', 'insurance', 'agent', 'phone'],
      'insurance_agent_email': ['stakeholders', 'insurance', 'agent', 'email'],

      // Valuation Information (Single Source: helper.valuation.*)
      'valuation_source': ['valuation', 'source'],
      'report_date': ['valuation', 'report_date'],
      'valuation_date': ['valuation', 'valuation_date'],
      'base_price': ['valuation', 'base_price'],
      'final_price': ['valuation', 'final_price'],
      'currency': ['valuation', 'currency'],
      'market_conditions': ['valuation', 'market_conditions'],

      // Valuation Adjustments (Single Source: helper.valuation.adjustments.*)
      'registration_percent': ['valuation', 'adjustments', 'registration', 'percent'],
      'registration_amount': ['valuation', 'adjustments', 'registration', 'amount'],
      'registration_cumulative': ['valuation', 'adjustments', 'registration', 'cumulative'],
      'registration_reason': ['valuation', 'adjustments', 'registration', 'reason'],
      'registration_date_adjustment': ['valuation', 'adjustments', 'registration', 'date'],
      
      'mileage_percent': ['valuation', 'adjustments', 'mileage', 'percent'],
      'mileage_amount': ['valuation', 'adjustments', 'mileage', 'amount'],
      'mileage_cumulative': ['valuation', 'adjustments', 'mileage', 'cumulative'],
      'mileage_reason': ['valuation', 'adjustments', 'mileage', 'reason'],
      'mileage_km_value': ['valuation', 'adjustments', 'mileage', 'km_value'],
      
      'ownership_type_percent': ['valuation', 'adjustments', 'ownership_type', 'percent'],
      'ownership_type_amount': ['valuation', 'adjustments', 'ownership_type', 'amount'],
      'ownership_type_cumulative': ['valuation', 'adjustments', 'ownership_type', 'cumulative'],
      'ownership_type_reason': ['valuation', 'adjustments', 'ownership_type', 'reason'],
      'ownership_type_type': ['valuation', 'adjustments', 'ownership_type', 'type'],
      
      'ownership_history_percent': ['valuation', 'adjustments', 'ownership_history', 'percent'],
      'ownership_history_amount': ['valuation', 'adjustments', 'ownership_history', 'amount'],
      'ownership_history_cumulative': ['valuation', 'adjustments', 'ownership_history', 'cumulative'],
      'ownership_history_reason': ['valuation', 'adjustments', 'ownership_history', 'reason'],
      'ownership_history_count': ['valuation', 'adjustments', 'ownership_history', 'owner_count'],
      
      'features_percent': ['valuation', 'adjustments', 'features', 'percent'],
      'features_amount': ['valuation', 'adjustments', 'features', 'amount'],
      'features_cumulative': ['valuation', 'adjustments', 'features', 'cumulative'],
      'features_reason': ['valuation', 'adjustments', 'features', 'reason'],
      'features_list': ['valuation', 'adjustments', 'features', 'feature_list'],
      
      'market_factors_percent': ['valuation', 'adjustments', 'market_factors', 'percent'],
      'market_factors_amount': ['valuation', 'adjustments', 'market_factors', 'amount'],
      'market_factors_reason': ['valuation', 'adjustments', 'market_factors', 'reason'],

      // Depreciation (Single Source: helper.valuation.depreciation.*)
      'global_percentage': ['valuation', 'depreciation', 'global_percentage'],
      'global_amount': ['valuation', 'depreciation', 'global_amount'],
      'work_days_impact': ['valuation', 'depreciation', 'work_days_impact'],
      'total_depreciation': ['valuation', 'depreciation', 'total_depreciation'],

      // Financial Information (Single Source: helper.financials.*)
      'parts_total': ['financials', 'costs', 'parts_total'],
      'repairs_total': ['financials', 'costs', 'repairs_total'],
      'works_total': ['financials', 'costs', 'works_total'],
      'costs_subtotal': ['financials', 'costs', 'subtotal'],
      
      'photography_count': ['financials', 'fees', 'photography', 'count'],
      'photography_unit_price': ['financials', 'fees', 'photography', 'unit_price'],
      'photography_total': ['financials', 'fees', 'photography', 'total'],
      
      'office_fixed_fee': ['financials', 'fees', 'office', 'fixed_fee'],
      'office_percentage': ['financials', 'fees', 'office', 'percentage'],
      'office_total': ['financials', 'fees', 'office', 'total'],
      
      'travel_count': ['financials', 'fees', 'travel', 'count'],
      'travel_unit_price': ['financials', 'fees', 'travel', 'unit_price'],
      'travel_total': ['financials', 'fees', 'travel', 'total'],
      
      'assessment_hours': ['financials', 'fees', 'assessment', 'hours'],
      'assessment_hourly_rate': ['financials', 'fees', 'assessment', 'hourly_rate'],
      'assessment_total': ['financials', 'fees', 'assessment', 'total'],
      
      'fees_subtotal': ['financials', 'fees', 'subtotal'],
      'vat_percentage': ['financials', 'taxes', 'vat_percentage'],
      'vat_amount': ['financials', 'taxes', 'vat_amount'],
      
      'before_tax': ['financials', 'totals', 'before_tax'],
      'after_tax': ['financials', 'totals', 'after_tax'],
      'total_compensation': ['financials', 'totals', 'total_compensation'],
      'salvage_value': ['financials', 'totals', 'salvage_value'],
      'net_settlement': ['financials', 'totals', 'net_settlement'],
      
      'calculation_date': ['financials', 'calculation_date'],
      'calculation_method': ['financials', 'calculation_method'],

      // Parts Search (Single Source: helper.parts_search.*)
      'selected_parts': ['parts_search', 'selected_parts'],
      'unselected_parts': ['parts_search', 'unselected_parts'],
      'all_results': ['parts_search', 'all_results'],
      'search_history': ['parts_search', 'search_history'],
      'total_searches': ['parts_search', 'summary', 'total_searches'],
      'total_results': ['parts_search', 'summary', 'total_results'],
      'selected_count': ['parts_search', 'summary', 'selected_count'],
      'last_search': ['parts_search', 'summary', 'last_search'],

      // Estimate Information (Single Source: helper.estimate.*)
      'estimate_type': ['estimate', 'type'],
      'legal_text': ['estimate', 'legal_text'],
      'attachments': ['estimate', 'attachments'],
      'report_title': ['estimate', 'report_title'],
      'estimate_generated': ['estimate', 'generated'],
      'estimate_generated_date': ['estimate', 'generated_date'],

      // System Information (Single Source: helper.system.*)
      'version': ['system', 'version'],
      'last_updated': ['system', 'last_updated'],
      'processing_history': ['system', 'processing_history'],
      'validation_vehicle': ['system', 'validation_status', 'vehicle'],
      'validation_damage': ['system', 'validation_status', 'damage'],
      'validation_valuation': ['system', 'validation_status', 'valuation'],
      'validation_financials': ['system', 'validation_status', 'financials'],
      'validation_estimate': ['system', 'validation_status', 'estimate'],
      'levi_processed': ['system', 'integrations', 'levi_processed'],
      'invoices_processed': ['system', 'integrations', 'invoices_processed'],
      'images_uploaded': ['system', 'integrations', 'images_uploaded'],
      'estimate_generated_system': ['system', 'integrations', 'estimate_generated'],
      
      // 🚨 CRITICAL MISSING MAPPINGS - DAMAGE ASSESSMENT (23 fields) - ADDED
      'damage_total_amount': ['damage_assessment', 'summary', 'total_damage_amount'],
      'damage_percentage': ['damage_assessment', 'summary', 'damage_percentage'],
      'is_total_loss': ['damage_assessment', 'summary', 'is_total_loss'],
      'damage_classification': ['damage_assessment', 'summary', 'classification'],
      'assessment_notes': ['damage_assessment', 'summary', 'assessment_notes'],
      'damage_centers': ['damage_assessment', 'centers'],
      'damage_center_name': ['damage_assessment', 'centers', 'name'],
      'damage_center_status': ['damage_assessment', 'centers', 'status'],
      'damage_center_type': ['damage_assessment', 'centers', 'type'],
      'damage_center_description': ['damage_assessment', 'centers', 'description'],
      'damage_center_cost': ['damage_assessment', 'centers', 'cost'],
      'damage_center_parts': ['damage_assessment', 'centers', 'parts'],
      'damage_center_labor': ['damage_assessment', 'centers', 'labor'],
      'damage_center_paint': ['damage_assessment', 'centers', 'paint'],
      'damage_center_severity': ['damage_assessment', 'centers', 'severity'],
      'damage_center_repair_method': ['damage_assessment', 'centers', 'repair_method'],
      'damage_center_images': ['damage_assessment', 'centers', 'images'],
      'damage_center_coordinates': ['damage_assessment', 'centers', 'coordinates'],
      'damage_center_measurements': ['damage_assessment', 'centers', 'measurements'],
      'damage_assessment_date': ['damage_assessment', 'assessment_date'],
      'damage_assessor': ['damage_assessment', 'assessor'],
      'damage_location': ['damage_assessment', 'location'],
      'damage_circumstances': ['damage_assessment', 'circumstances'],

      // 🚨 CRITICAL MISSING MAPPINGS - FINANCIAL BREAKDOWN (25 fields) - ADDED
      'costs_parts_total': ['financials', 'costs', 'parts_total'],
      'costs_repairs_total': ['financials', 'costs', 'repairs_total'],
      'costs_works_total': ['financials', 'costs', 'works_total'],
      'costs_subtotal': ['financials', 'costs', 'subtotal'],
      'fees_photography_count': ['financials', 'fees', 'photography', 'count'],
      'fees_photography_price': ['financials', 'fees', 'photography', 'unit_price'],
      'fees_photography_total': ['financials', 'fees', 'photography', 'total'],
      'fees_office_fixed': ['financials', 'fees', 'office', 'fixed_fee'],
      'fees_office_percentage': ['financials', 'fees', 'office', 'percentage'],
      'fees_office_total': ['financials', 'fees', 'office', 'total'],
      'fees_travel_count': ['financials', 'fees', 'travel', 'count'],
      'fees_travel_price': ['financials', 'fees', 'travel', 'unit_price'],
      'fees_travel_total': ['financials', 'fees', 'travel', 'total'],
      'fees_assessment_hours': ['financials', 'fees', 'assessment', 'hours'],
      'fees_assessment_rate': ['financials', 'fees', 'assessment', 'hourly_rate'],
      'fees_assessment_total': ['financials', 'fees', 'assessment', 'total'],
      'fees_subtotal': ['financials', 'fees', 'subtotal'],
      'taxes_vat_percentage': ['financials', 'taxes', 'vat_percentage'],
      'taxes_vat_amount': ['financials', 'taxes', 'vat_amount'],
      'totals_before_tax': ['financials', 'totals', 'before_tax'],
      'totals_after_tax': ['financials', 'totals', 'after_tax'],
      'totals_compensation': ['financials', 'totals', 'total_compensation'],
      'totals_salvage_value': ['financials', 'totals', 'salvage_value'],
      'totals_net_settlement': ['financials', 'totals', 'net_settlement'],
      'calculation_date': ['financials', 'calculation_date'],
      'calculation_method': ['financials', 'calculation_method'],

      // 🚨 CRITICAL MISSING MAPPINGS - DOCUMENT MANAGEMENT (12 fields) - ADDED
      'images_count': ['documents', 'photo_count'],
      'images_list': ['documents', 'images'],
      'invoices_list': ['documents', 'invoices'],
      'reports_list': ['documents', 'reports'],
      'pdfs_list': ['documents', 'pdfs'],
      'other_files_list': ['documents', 'other_files'],
      'document_upload_date': ['documents', 'upload_date'],
      'document_file_name': ['documents', 'file_name'],
      'document_file_size': ['documents', 'file_size'],
      'document_file_type': ['documents', 'file_type'],
      'document_processing_status': ['documents', 'processing_status'],
      'document_metadata': ['documents', 'metadata'],

      // 🚨 CRITICAL MISSING MAPPINGS - ESTIMATE WORKFLOW (18 fields) - ADDED
      'estimate_type': ['estimate', 'type'],
      'estimate_legal_text': ['estimate', 'legal_text'],
      'estimate_attachments': ['estimate', 'attachments'],
      'estimate_report_title': ['estimate', 'report_title'],
      'estimate_generated': ['estimate', 'generated'],
      'estimate_generated_date': ['estimate', 'generated_date'],
      'estimate_status': ['estimate', 'status'],
      'estimate_workflow_stage': ['estimate', 'workflow_stage'],
      'estimate_approval_status': ['estimate', 'approval_status'],
      'estimate_reviewer': ['estimate', 'reviewer'],
      'estimate_review_date': ['estimate', 'review_date'],
      'estimate_comments': ['estimate', 'comments'],
      'estimate_version': ['estimate', 'version'],
      'estimate_total_amount': ['estimate', 'total_amount'],
      'estimate_currency': ['estimate', 'currency'],
      'estimate_validity_period': ['estimate', 'validity_period'],
      'estimate_created_by': ['estimate', 'created_by'],
      'estimate_last_modified': ['estimate', 'last_modified'],

      // 🚨 CRITICAL MISSING MAPPINGS - FINAL REPORT SYSTEM (15 fields) - ADDED
      'final_report_type': ['final_report', 'type'],
      'final_report_legal_text': ['final_report', 'legal_text'],
      'final_report_attachments': ['final_report', 'attachments'],
      'final_report_title': ['final_report', 'title'],
      'final_report_generated': ['final_report', 'generated'],
      'final_report_generated_date': ['final_report', 'generated_date'],
      'final_report_status': ['final_report', 'status'],
      'final_report_approval_status': ['final_report', 'approval_status'],
      'final_report_reviewer': ['final_report', 'reviewer'],
      'final_report_review_date': ['final_report', 'review_date'],
      'final_report_comments': ['final_report', 'comments'],
      'final_report_version': ['final_report', 'version'],
      'final_report_created_by': ['final_report', 'created_by'],
      'final_report_last_modified': ['final_report', 'last_modified'],
      'final_report_pdf_url': ['final_report', 'pdf_url'],

      // 🚨 CRITICAL MISSING MAPPINGS - PARTS SEARCH ADVANCED (20 fields) - ADDED
      'parts_search_query': ['parts_search', 'search_history', 'query'],
      'parts_search_results': ['parts_search', 'all_results'],
      'parts_selected': ['parts_search', 'selected_parts'],
      'parts_unselected': ['parts_search', 'unselected_parts'],
      'parts_total_searches': ['parts_search', 'summary', 'total_searches'],
      'parts_total_results': ['parts_search', 'summary', 'total_results'],
      'parts_selected_count': ['parts_search', 'summary', 'selected_count'],
      'parts_last_search': ['parts_search', 'summary', 'last_search'],
      'parts_search_date': ['parts_search', 'search_date'],
      'parts_search_source': ['parts_search', 'search_source'],
      'parts_search_engine': ['parts_search', 'search_engine'],
      'parts_price_min': ['parts_search', 'price_range', 'min'],
      'parts_price_max': ['parts_search', 'price_range', 'max'],
      'parts_availability': ['parts_search', 'availability'],
      'parts_supplier_name': ['parts_search', 'supplier', 'name'],
      'parts_supplier_contact': ['parts_search', 'supplier', 'contact'],
      'parts_delivery_time': ['parts_search', 'delivery_time'],
      'parts_warranty': ['parts_search', 'warranty'],
      'parts_compatibility': ['parts_search', 'compatibility'],
      'parts_alternative_options': ['parts_search', 'alternative_options']
    };

    // Reverse mapping - helper path -> standardized field names
    this.reverseMapping = {};
    this.buildReverseMapping();

    // Manual entry protection flags
    this.manualEntryFields = new Set([
      'damage_date',
      'damage_date_independent',
      'owner_name',
      'client_name',
      'owner_phone',
      'client_phone',
      'garage_email'
    ]);
  }

  buildReverseMapping() {
    Object.entries(this.fieldMappings).forEach(([fieldName, helperPath]) => {
      const pathKey = helperPath.join('.');
      if (!this.reverseMapping[pathKey]) {
        this.reverseMapping[pathKey] = [];
      }
      this.reverseMapping[pathKey].push(fieldName);
    });
  }

  // Get helper path for a field name
  getHelperPath(fieldName) {
    return this.fieldMappings[fieldName] || null;
  }

  // Get all field names that map to a helper path
  getFieldNames(helperPath) {
    const pathKey = Array.isArray(helperPath) ? helperPath.join('.') : helperPath;
    return this.reverseMapping[pathKey] || [];
  }

  // Check if field requires manual entry protection
  isManualEntryField(fieldName) {
    return this.manualEntryFields.has(fieldName);
  }

  // Get value from helper using field name
  getValueFromHelper(fieldName, helper) {
    const path = this.getHelperPath(fieldName);
    if (!path) return null;

    let value = helper;
    for (const key of path) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return null;
      }
    }
    return value;
  }

  // Set value in helper using field name
  setValueInHelper(fieldName, value, helper) {
    const path = this.getHelperPath(fieldName);
    if (!path) return false;

    let current = helper;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    const finalKey = path[path.length - 1];
    current[finalKey] = value;
    return true;
  }

  // Get all standardized field names
  getAllFieldNames() {
    return Object.keys(this.fieldMappings);
  }

  // Check if field name is standardized
  isStandardizedField(fieldName) {
    return fieldName in this.fieldMappings;
  }

  // Get field suggestions for autocomplete
  getFieldSuggestions(query) {
    const lowerQuery = query.toLowerCase();
    return this.getAllFieldNames()
      .filter(field => field.toLowerCase().includes(lowerQuery))
      .sort();
  }

  // Validate helper structure against field mappings
  validateHelperStructure(helper) {
    const issues = [];
    const requiredPaths = new Set();

    // Collect all required paths
    Object.values(this.fieldMappings).forEach(path => {
      let currentPath = [];
      for (const segment of path) {
        currentPath.push(segment);
        requiredPaths.add(currentPath.join('.'));
      }
    });

    // Check for missing paths
    requiredPaths.forEach(pathStr => {
      const path = pathStr.split('.');
      let current = helper;
      let validPath = true;

      for (const segment of path) {
        if (!current || typeof current !== 'object' || !(segment in current)) {
          validPath = false;
          break;
        }
        current = current[segment];
      }

      if (!validPath) {
        issues.push(`Missing helper path: ${pathStr}`);
      }
    });

    return {
      valid: issues.length === 0,
      issues: issues
    };
  }
}

// Global instance
window.fieldMapper = new FieldMapper();

// Helper functions for easy integration
window.getStandardizedValue = function(fieldName, helper = null) {
  helper = helper || window.helper;
  return window.fieldMapper.getValueFromHelper(fieldName, helper);
};

window.setStandardizedValue = function(fieldName, value, helper = null) {
  helper = helper || window.helper;
  const success = window.fieldMapper.setValueInHelper(fieldName, value, helper);
  if (success && window.saveHelperToAllStorageLocations) {
    window.saveHelperToAllStorageLocations();
  }
  return success;
};

window.isStandardizedField = function(fieldName) {
  return window.fieldMapper.isStandardizedField(fieldName);
};

// Enhanced updateHelper that uses standardized field mapping
window.updateHelperWithStandardizedFields = function(fieldName, value, source = 'manual') {
  console.log(`🗺️ STANDARDIZED UPDATE: ${fieldName} = ${value} (source: ${source})`);
  
  if (!window.helper) {
    console.error('❌ Helper not initialized');
    return false;
  }

  // Check if field is standardized
  if (!window.fieldMapper.isStandardizedField(fieldName)) {
    console.warn(`⚠️ Field "${fieldName}" is not in standardized mapping - using legacy updateHelper`);
    return window.updateHelper(fieldName, value);
  }

  // Check manual entry protection
  if (window.fieldMapper.isManualEntryField(fieldName)) {
    const existingValue = window.fieldMapper.getValueFromHelper(fieldName, window.helper);
    if (existingValue && source !== 'manual') {
      console.log(`🚫 PROTECTED: Field "${fieldName}" has manual entry - rejecting auto-update`);
      return false;
    }
  }

  // Use standardized field mapping
  const success = window.fieldMapper.setValueInHelper(fieldName, value, window.helper);
  
  if (success) {
    // Update metadata
    window.helper.system = window.helper.system || {};
    window.helper.system.last_updated = new Date().toISOString();
    
    if (source === 'manual') {
      // Track manual modifications
      if (!window.helper.system.processing_history) {
        window.helper.system.processing_history = [];
      }
      window.helper.system.processing_history.push({
        action: 'manual_field_update',
        field: fieldName,
        value: value,
        timestamp: new Date().toISOString()
      });
    }

    // Save to storage
    if (window.saveHelperToAllStorageLocations) {
      window.saveHelperToAllStorageLocations();
    }

    console.log(`✅ STANDARDIZED: Updated ${fieldName} via helper path: ${window.fieldMapper.getHelperPath(fieldName).join('.')}`);
    return true;
  }

  return false;
};

// Export for module use
export { FieldMapper };