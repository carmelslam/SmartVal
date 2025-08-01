// 🔧 FIELD STANDARDIZATION UTILITY
// Helps standardize field names across modules for consistent terminology

class FieldStandardizer {
  constructor() {
    // Map of current field names to standardized field names
    this.fieldNameMappings = {
      // Vehicle fields
      'km': 'vehicle_km',
      'mileage': 'vehicle_km',
      'plate': 'vehicle_plate',
      'manufacturer': 'vehicle_manufacturer',
      'model': 'vehicle_model',
      'year': 'vehicle_year',
      'chassis': 'vehicle_chassis',
      'engine_volume': 'vehicle_engine_volume',
      'fuel_type': 'vehicle_fuel_type',
      'transmission': 'vehicle_transmission',
      'drive_type': 'vehicle_drive_type',
      'ownership_type': 'vehicle_ownership_type',
      'category': 'vehicle_category',
      'features': 'vehicle_features',
      'condition': 'vehicle_condition',
      
      // Owner/Client fields  
      'owner_name': 'owner_name',
      'client_name': 'owner_name',
      'owner_phone': 'owner_phone', 
      'client_phone': 'owner_phone',
      'owner_address': 'owner_address',
      'client_address': 'owner_address',
      'owner_email': 'owner_email',
      'client_email': 'owner_email',
      
      // Garage fields
      'garage_name': 'garage_name',
      'garage_phone': 'garage_phone', 
      'garage_email': 'garage_email',
      'garage_address': 'garage_address',
      'garage_contact_person': 'garage_contact_person',
      
      // Insurance fields
      'insuranceCompany': 'insurance_company',
      'insurance_company': 'insurance_company',
      'otherInsuranceCompany': 'insurance_company',
      'insuranceEmail': 'insurance_email',
      'insurance_email': 'insurance_email',
      'agent_name': 'insurance_agent_name',
      'insurance_agent_name': 'insurance_agent_name',
      'agent_phone': 'insurance_agent_phone',
      'insurance_agent_phone': 'insurance_agent_phone',
      'agent_email': 'insurance_agent_email',
      'insurance_agent_email': 'insurance_agent_email',
      'policy_number': 'insurance_policy_number',
      'insurance_policy_number': 'insurance_policy_number',
      'claim_number': 'insurance_claim_number',
      'insurance_claim_number': 'insurance_claim_number',
      
      // Case fields
      'damage_date_independent': 'damage_date',
      'case_damage_date': 'damage_date',
      'inspection_date': 'inspection_date',
      'case_inspection_date': 'inspection_date',
      'submission_date': 'submission_date',
      'case_submission_date': 'submission_date',
      'damageType': 'damage_type',
      'damage_type': 'damage_type',
      'otherDamageType': 'damage_type',
      'inspection_location': 'inspection_location',
      'case_inspection_location': 'inspection_location',
      'report_type': 'report_type',
      'case_report_type': 'report_type',
      
      // Valuation fields
      'base_price': 'base_price',
      'final_price': 'final_price',
      'market_value': 'market_value',
      'vehicle_market_value': 'market_value',
      'valuation_date': 'valuation_date',
      'report_date': 'report_date',
      
      // Financial fields
      'parts_total': 'parts_total',
      'repairs_total': 'repairs_total',
      'works_total': 'works_total',
      'costs_subtotal': 'costs_subtotal',
      'vat_percentage': 'vat_percentage',
      'vat_amount': 'vat_amount',
      'before_tax': 'before_tax',
      'after_tax': 'after_tax',
      'total_compensation': 'total_compensation',
      
      // Estimate fields
      'estimate_type': 'estimate_type',
      'legal_text': 'legal_text',
      'attachments': 'attachments',
      'report_title': 'report_title'
    };

    // Reverse mapping for lookups
    this.reverseMapping = {};
    Object.entries(this.fieldNameMappings).forEach(([original, standardized]) => {
      if (!this.reverseMapping[standardized]) {
        this.reverseMapping[standardized] = [];
      }
      this.reverseMapping[standardized].push(original);
    });

    // Fields that should be renamed in HTML files
    this.htmlRenames = {
      'damage_date_independent': 'damage_date',
      'insuranceCompany': 'insurance_company',
      'otherInsuranceCompany': 'insurance_company_other',
      'insuranceEmail': 'insurance_email',
      'damageType': 'damage_type',
      'otherDamageType': 'damage_type_other',
      'agent_name': 'insurance_agent_name',
      'agent_phone': 'insurance_agent_phone',
      'agent_email': 'insurance_agent_email'
    };
  }

  // Get standardized field name
  getStandardizedName(originalName) {
    return this.fieldNameMappings[originalName] || originalName;
  }

  // Get all original names that map to a standardized name
  getOriginalNames(standardizedName) {
    return this.reverseMapping[standardizedName] || [standardizedName];
  }

  // Check if field name needs standardization
  needsStandardization(fieldName) {
    return fieldName in this.fieldNameMappings;
  }

  // Generate HTML field replacement suggestions
  generateHtmlReplacements(htmlContent) {
    const replacements = [];
    
    Object.entries(this.htmlRenames).forEach(([oldName, newName]) => {
      // Check for id attributes
      const idPattern = new RegExp(`id=["']${oldName}["']`, 'g');
      if (idPattern.test(htmlContent)) {
        replacements.push({
          type: 'id',
          original: `id="${oldName}"`,
          replacement: `id="${newName}"`,
          fieldName: oldName,
          standardizedName: newName
        });
      }

      // Check for getElementById calls
      const getElementPattern = new RegExp(`getElementById\\(['"]${oldName}['"]\\)`, 'g');
      if (getElementPattern.test(htmlContent)) {
        replacements.push({
          type: 'getElementById',
          original: `getElementById('${oldName}')`,
          replacement: `getElementById('${newName}')`,
          fieldName: oldName,
          standardizedName: newName
        });
      }

      // Check for name attributes
      const namePattern = new RegExp(`name=["']${oldName}["']`, 'g');
      if (namePattern.test(htmlContent)) {
        replacements.push({
          type: 'name',
          original: `name="${oldName}"`,
          replacement: `name="${newName}"`,
          fieldName: oldName,
          standardizedName: newName
        });
      }
    });

    return replacements;
  }

  // Generate JavaScript field replacement suggestions
  generateJsReplacements(jsContent) {
    const replacements = [];

    Object.entries(this.fieldNameMappings).forEach(([oldName, newName]) => {
      if (oldName !== newName) {
        // Check for getElementById calls
        const getElementPattern = new RegExp(`getElementById\\(['"]${oldName}['"]\\)`, 'g');
        if (getElementPattern.test(jsContent)) {
          replacements.push({
            type: 'getElementById',
            original: `getElementById('${oldName}')`,
            replacement: `getElementById('${newName}')`,
            fieldName: oldName,
            standardizedName: newName
          });
        }

        // Check for field references in helper updates
        const helperPattern = new RegExp(`['"]${oldName}['"]`, 'g');
        if (helperPattern.test(jsContent)) {
          replacements.push({
            type: 'helper_reference',
            original: `'${oldName}'`,
            replacement: `'${newName}'`,
            fieldName: oldName,
            standardizedName: newName
          });
        }
      }
    });

    return replacements;
  }

  // Apply standardization to HTML content
  standardizeHtmlContent(htmlContent) {
    let standardizedContent = htmlContent;
    const replacements = this.generateHtmlReplacements(htmlContent);

    replacements.forEach(replacement => {
      standardizedContent = standardizedContent.replace(
        new RegExp(replacement.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        replacement.replacement
      );
    });

    return {
      content: standardizedContent,
      replacements: replacements
    };
  }

  // Apply standardization to JavaScript content
  standardizeJsContent(jsContent) {
    let standardizedContent = jsContent;
    const replacements = this.generateJsReplacements(jsContent);

    replacements.forEach(replacement => {
      // Be more careful with JavaScript replacements to avoid false positives
      if (replacement.type === 'getElementById') {
        standardizedContent = standardizedContent.replace(
          new RegExp(`getElementById\\(['"]${replacement.fieldName}['"]\\)`, 'g'),
          `getElementById('${replacement.standardizedName}')`
        );
      }
    });

    return {
      content: standardizedContent,
      replacements: replacements
    };
  }

  // Create bidirectional mapping for all fields
  createBidirectionalMapping() {
    const mapping = {
      htmlToStandardized: {},
      standardizedToHtml: {},
      jsToStandardized: {},
      standardizedToJs: {}
    };

    // HTML mappings
    Object.entries(this.htmlRenames).forEach(([html, standardized]) => {
      mapping.htmlToStandardized[html] = standardized;
      mapping.standardizedToHtml[standardized] = html;
    });

    // JavaScript mappings (use field name mappings)
    Object.entries(this.fieldNameMappings).forEach(([js, standardized]) => {
      mapping.jsToStandardized[js] = standardized;
      if (!mapping.standardizedToJs[standardized]) {
        mapping.standardizedToJs[standardized] = js;
      }
    });

    return mapping;
  }

  // Helper to integrate with field-mapper.js
  integratWithFieldMapper() {
    if (window.fieldMapper) {
      // Add compatibility method to field mapper
      window.fieldMapper.getStandardizedFieldName = (originalName) => {
        return this.getStandardizedName(originalName);
      };

      window.fieldMapper.getAllVariantsOfField = (fieldName) => {
        const standardized = this.getStandardizedName(fieldName);
        return this.getOriginalNames(standardized);
      };

      console.log('✅ Field standardizer integrated with field mapper');
      return true;
    } else {
      console.warn('⚠️ Field mapper not found - integration skipped');
      return false;
    }
  }

  // Generate field mapping report
  generateMappingReport() {
    const report = {
      totalMappings: Object.keys(this.fieldNameMappings).length,
      htmlRenames: Object.keys(this.htmlRenames).length,
      standardizedFields: [...new Set(Object.values(this.fieldNameMappings))].length,
      mappings: this.fieldNameMappings,
      htmlRenames: this.htmlRenames,
      reverseMapping: this.reverseMapping
    };

    console.log('📊 Field Standardization Report:', report);
    return report;
  }
}

// Global instance
window.fieldStandardizer = new FieldStandardizer();

// Integration function
window.standardizeFieldReferences = function(content, type = 'html') {
  if (type === 'html') {
    return window.fieldStandardizer.standardizeHtmlContent(content);
  } else if (type === 'js') {
    return window.fieldStandardizer.standardizeJsContent(content);
  }
  return { content, replacements: [] };
};

// Helper function to get standardized field name
window.getStandardizedFieldName = function(originalName) {
  return window.fieldStandardizer.getStandardizedName(originalName);
};

// Export for module use
export { FieldStandardizer };