// parts-helper-utils.js - Utility functions for parts helper integration
// Phase 5: Parts Search Module - Smart Form Integration

/**
 * Smart Form Integration Utilities
 * Provides backward compatibility and enhanced reading of parts from helper structure
 */

class PartsHelperUtils {
  constructor() {
    this.requiredFields = [
      'name',
      'pcode',           // Catalog number is now required
      'part_family',     // Part family is now required
      'price',
      'quantity'
    ];
  }

  /**
   * Read selected parts from helper with enhanced structure support
   * Supports both old and new helper formats
   */
  readSelectedPartsFromHelper() {
    if (!window.helper?.parts_search?.selected_parts) {
      console.log('⚠️ No selected parts found in helper');
      return [];
    }

    const parts = window.helper.parts_search.selected_parts;
    console.log('📋 Reading selected parts from helper:', parts.length);

    return parts.map((part, index) => {
      const processedPart = this.validateAndEnhancePart(part, index);
      return processedPart;
    }).filter(part => part !== null);
  }

  /**
   * Validate and enhance a single part entry
   */
  validateAndEnhancePart(part, index = 0) {
    if (!part || typeof part !== 'object') {
      console.warn(`⚠️ Invalid part at index ${index}:`, part);
      return null;
    }

    // Check if this is a legacy part (missing new fields)
    const isLegacyPart = !part.pcode && !part.part_family && !part.catalog_item_id;
    
    if (isLegacyPart) {
      console.log(`🔄 Converting legacy part at index ${index}`);
      return this.convertLegacyPart(part);
    }

    // Validate modern part structure
    const validation = this.validateSelectedPart(part);
    if (!validation.isValid) {
      console.warn(`⚠️ Part validation failed at index ${index}:`, validation.missingFields);
      // Try to fix missing fields
      return this.fixMissingFields(part);
    }

    return part;
  }

  /**
   * Convert legacy part format to new enhanced format
   */
  convertLegacyPart(legacyPart) {
    console.log('🔧 Converting legacy part:', legacyPart.name || 'unnamed');
    
    // Extract what we can from legacy structure
    const convertedPart = {
      // Preserve existing fields
      ...legacyPart,
      
      // Add missing required fields with fallbacks
      "pcode": legacyPart.pcode || legacyPart["מספר קטלוגי"] || this.extractCodeFromDescription(legacyPart),
      "part_family": legacyPart.part_family || legacyPart["משפחת חלק"] || this.inferPartFamily(legacyPart),
      "catalog_item_id": legacyPart.catalog_item_id || `legacy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      
      // Ensure Hebrew fields exist
      "מספר קטלוגי": legacyPart["מספר קטלוגי"] || legacyPart.pcode || "",
      "משפחת חלק": legacyPart["משפחת חלק"] || legacyPart.part_family || "",
      
      // Mark as converted
      "entry_method": legacyPart.entry_method || "manual_typed_converted",
      "converted_from_legacy": true,
      "conversion_timestamp": new Date().toISOString()
    };

    return convertedPart;
  }

  /**
   * Try to extract part code from description or name
   */
  extractCodeFromDescription(part) {
    const text = part.name || part["תיאור"] || part.description || "";
    
    // Look for common part number patterns
    const patterns = [
      /([A-Z0-9]{8,15})/g,  // Alphanumeric codes 8-15 chars
      /(\d{6,12})/g,        // Numeric codes 6-12 digits
      /([A-Z]{2,4}\d{6,10})/g // Letter prefix + numbers
    ];

    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        return matches[0];
      }
    }

    return `UNKNOWN_${Date.now()}`;
  }

  /**
   * Infer part family from name or description
   */
  inferPartFamily(part) {
    const text = (part.name || part["תיאור"] || "").toLowerCase();
    
    const familyMappings = {
      'פנס': 'light',
      'פגוש': 'bumper', 
      'כנף': 'wing',
      'דלת': 'door',
      'מראה': 'mirror',
      'זכוכית': 'glass',
      'גלגל': 'wheel',
      'צמיג': 'tire',
      'מנוע': 'engine',
      'שמשה': 'windshield',
      'מכסה': 'cover',
      'רדיטור': 'radiator',
      'פילטר': 'filter',
      'בלם': 'brake',
      'אור': 'light',
      'חיישן': 'sensor'
    };

    for (const [hebrewTerm, englishFamily] of Object.entries(familyMappings)) {
      if (text.includes(hebrewTerm)) {
        return englishFamily;
      }
    }

    return 'general';
  }

  /**
   * Fix missing fields in a part entry
   */
  fixMissingFields(part) {
    console.log('🔧 Fixing missing fields in part:', part.name);
    
    const fixedPart = { ...part };

    // Fix missing pcode
    if (!fixedPart.pcode && !fixedPart["מספר קטלוגי"]) {
      fixedPart.pcode = this.extractCodeFromDescription(part);
      fixedPart["מספר קטלוגי"] = fixedPart.pcode;
    }

    // Fix missing part_family
    if (!fixedPart.part_family && !fixedPart["משפחת חלק"]) {
      fixedPart.part_family = this.inferPartFamily(part);
      fixedPart["משפחת חלק"] = fixedPart.part_family;
    }

    // Ensure catalog_item_id exists
    if (!fixedPart.catalog_item_id) {
      fixedPart.catalog_item_id = `fixed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Mark as fixed
    fixedPart.auto_fixed = true;
    fixedPart.fix_timestamp = new Date().toISOString();

    return fixedPart;
  }

  /**
   * Validate selected part structure
   */
  validateSelectedPart(part) {
    const missingFields = this.requiredFields.filter(field => {
      const hasField = part[field] || part[this.getHebrewFieldName(field)];
      return !hasField;
    });

    return {
      isValid: missingFields.length === 0,
      missingFields: missingFields,
      part: part
    };
  }

  /**
   * Get Hebrew field name for a given English field
   */
  getHebrewFieldName(englishField) {
    const fieldMappings = {
      'name': 'name',
      'pcode': 'מספר קטלוגי',
      'part_family': 'משפחת חלק',
      'price': 'מחיר',
      'quantity': 'כמות'
    };

    return fieldMappings[englishField] || englishField;
  }

  /**
   * Smart form integration - populate form with selected parts
   */
  populateSmartForm(formSelector = '#parts-form') {
    const selectedParts = this.readSelectedPartsFromHelper();
    
    if (selectedParts.length === 0) {
      console.log('📝 No parts to populate in smart form');
      return false;
    }

    console.log('📝 Populating smart form with', selectedParts.length, 'parts');

    selectedParts.forEach((part, index) => {
      this.addPartToSmartForm(part, index);
    });

    return true;
  }

  /**
   * Add a single part to smart form
   */
  addPartToSmartForm(part, index = 0) {
    console.log(`📝 Adding part ${index + 1} to smart form:`, {
      name: part.name,
      catalogNumber: part.pcode || part["מספר קטלוגי"],
      partFamily: part.part_family || part["משפחת חלק"],
      oemNumber: part["מספר OEM"],
      supplier: part.supplier || part["ספק"],
      price: part.price
    });

    // Call global addPartToForm function if it exists
    if (typeof window.addPartToForm === 'function') {
      window.addPartToForm({
        partName: part.name || part["תיאור"],
        partNumber: part.pcode || part["מספר קטלוגי"],
        partFamily: part.part_family || part["משפחת חלק"],
        oemNumber: part["מספר OEM"],
        supplier: part.supplier || part["ספק"],
        price: part.price,
        quantity: part.quantity || part["כמות"] || 1,
        type: part["סוג חלק"] || part.availability,
        source: part.source || part["מקור"],
        index: index
      });
    } else {
      console.warn('⚠️ addPartToForm function not available globally');
    }
  }

  /**
   * Export parts for external systems (Excel, reports, etc.)
   */
  exportPartsData() {
    const selectedParts = this.readSelectedPartsFromHelper();
    
    return selectedParts.map(part => ({
      // Basic info
      name: part.name || part["תיאור"],
      description: part["תיאור"] || part.name,
      quantity: part.quantity || part["כמות"] || 1,
      price: part.price,
      
      // Identifiers
      catalogNumber: part.pcode || part["מספר קטלוגי"],
      oemNumber: part["מספר OEM"] || part.oem,
      partFamily: part.part_family || part["משפחת חלק"],
      
      // Supplier info
      supplier: part.supplier || part["ספק"] || part.supplier_name,
      source: part.source || part["מקור"] || part.availability,
      location: part["מיקום"] || part.location,
      
      // Metadata
      entryMethod: part.entry_method,
      selectedAt: part.selected_at,
      plateNumber: part.plate_number,
      
      // Vehicle context
      make: part.make,
      model: part.model,
      yearFrom: part.year_from,
      yearTo: part.year_to
    }));
  }

  /**
   * Get summary statistics of selected parts
   */
  getPartsSummary() {
    const selectedParts = this.readSelectedPartsFromHelper();
    
    const summary = {
      totalParts: selectedParts.length,
      totalQuantity: selectedParts.reduce((sum, part) => sum + (part.quantity || part["כמות"] || 1), 0),
      totalValue: selectedParts.reduce((sum, part) => sum + (parseFloat(part.price) || 0), 0),
      byFamily: {},
      bySupplier: {},
      bySource: {},
      validParts: 0,
      legacyParts: 0,
      fixedParts: 0
    };

    selectedParts.forEach(part => {
      // Count by part family
      const family = part.part_family || part["משפחת חלק"] || 'unknown';
      summary.byFamily[family] = (summary.byFamily[family] || 0) + 1;
      
      // Count by supplier
      const supplier = part.supplier || part["ספק"] || part.supplier_name || 'unknown';
      summary.bySupplier[supplier] = (summary.bySupplier[supplier] || 0) + 1;
      
      // Count by source
      const source = part.source || part["מקור"] || part.availability || 'unknown';
      summary.bySource[source] = (summary.bySource[source] || 0) + 1;
      
      // Count validation status
      if (this.validateSelectedPart(part).isValid) {
        summary.validParts++;
      }
      
      if (part.converted_from_legacy) {
        summary.legacyParts++;
      }
      
      if (part.auto_fixed) {
        summary.fixedParts++;
      }
    });

    return summary;
  }

  /**
   * Debug helper - print parts structure analysis
   */
  debugPartsStructure() {
    console.group('🔍 Parts Structure Debug Analysis');
    
    const selectedParts = this.readSelectedPartsFromHelper();
    const summary = this.getPartsSummary();
    
    console.log('📊 Summary:', summary);
    console.log('📋 Sample part (first):', selectedParts[0]);
    
    if (selectedParts.length > 1) {
      console.log('📋 Sample part (last):', selectedParts[selectedParts.length - 1]);
    }
    
    // Field availability analysis
    const fieldAnalysis = {};
    this.requiredFields.forEach(field => {
      const hasField = selectedParts.filter(part => part[field] || part[this.getHebrewFieldName(field)]).length;
      fieldAnalysis[field] = `${hasField}/${selectedParts.length} (${Math.round(hasField/selectedParts.length*100)}%)`;
    });
    
    console.log('📈 Field Availability:', fieldAnalysis);
    console.groupEnd();
    
    return { selectedParts, summary, fieldAnalysis };
  }
}

// Create global instance
window.partsHelperUtils = new PartsHelperUtils();

// Global convenience functions
window.readSelectedPartsFromHelper = () => window.partsHelperUtils.readSelectedPartsFromHelper();
window.populateSmartForm = (selector) => window.partsHelperUtils.populateSmartForm(selector);
window.getPartsSummary = () => window.partsHelperUtils.getPartsSummary();
window.debugPartsStructure = () => window.partsHelperUtils.debugPartsStructure();

// Export for module usage
export { PartsHelperUtils };
export default PartsHelperUtils;