/**
 * OCR Data Transformation Layer
 * Handles mapping Hebrew OCR fields to database fields with proper validation
 */

class OCRDataTransformer {
  constructor() {
    // Hebrew field mappings to English database fields
    this.hebrewFieldMappings = {
      // Parts fields (חלקים)
      'מק"ט חלק': 'catalog_code',
      'מק״ט חלק': 'catalog_code', 
      'מק\'ט חלק': 'catalog_code',
      'קוד חלק': 'catalog_code',
      'שם חלק': 'part_name',
      'תיאור': 'description',
      'תיאור חלק': 'description',
      'כמות': 'quantity',
      'מחיר יחידה': 'unit_price',
      'עלות': 'unit_price',
      'מחיר': 'unit_price',
      'מקור': 'part_source',
      'סה״כ': 'line_total',
      'סהכ': 'line_total',
      'סכום': 'line_total',
      
      // Work fields (עבודות)
      'סוג העבודה': 'work_type',
      'תיאור עבודות': 'work_description',
      'עלות עבודות': 'work_cost',
      'שעות עבודה': 'work_hours',
      'תעריף שעה': 'hourly_rate',
      
      // Repair fields (תיקונים)
      'סוג תיקון': 'repair_type',
      'תיאור התיקון': 'repair_description',
      'עלות תיקונים': 'repair_cost',
      
      // Invoice metadata
      'מספר רכב': 'plate',
      'מספר חשבונית': 'invoice_number',
      'יצרן': 'manufacturer',
      'דגם': 'model',
      'שנה': 'year',
      'בעל הרכב': 'vehicle_owner',
      'שם מוסך': 'supplier_name',
      'כתובת מוסך': 'supplier_address',
      'טלפון מוסך': 'supplier_phone',
      'ח.פ מוסך': 'supplier_tax_id',
      'תאריך חשבונית': 'invoice_date',
      'תאריך תשלום': 'due_date',
      'סהכ חלקים': 'parts_total',
      'סהכ עבודות': 'works_total',
      'סהכ תיקונים': 'repairs_total',
      'מע״מ': 'tax_amount',
      'סה״כ כולל מע״מ': 'total_amount',
      'סה״כ לפני מע״מ': 'total_before_tax'
    };

    // Part source mappings (Hebrew to standardized English values)
    // This maps the OCR "מקור" field values to standardized part source values
    this.partSourceMappings = {
      'מקורי': 'Original',
      'תחליפי': 'Aftermarket', 
      'משומש': 'Used',
      'משופץ': 'Refurbished',
      'OEM': 'OEM',
      'חדש': 'New',
      'יד שנייה': 'Used',
      'מקורי לספק': 'Genuine',
      'אחריות': 'Genuine'
    };

    // Category detection patterns
    this.categoryPatterns = {
      part: [
        'חלק', 'פגוש', 'דלת', 'מכסה', 'פנס', 'מראה', 'גלגל', 'צמיג',
        'מנוע', 'תיבה', 'בלם', 'מתלה', 'רדיאטור', 'סוללה', 'מגן',
        'זכוכית', 'שמשה', 'מגב', 'צופר', 'אנטנה', 'ידית', 'מוט'
      ],
      work: [
        'עבודה', 'התקנה', 'הרכבה', 'פירוק', 'ניתוק', 'חיבור', 'ריתוך',
        'צביעה', 'ליטוש', 'תיקון', 'החלפה', 'כיוון', 'בדיקה', 'אבחון',
        'שירות', 'תחזוקה', 'ניקוי', 'שטיפה', 'יישור', 'כיול'
      ],
      repair: [
        'תיקון', 'שיפוץ', 'שיקום', 'חידוש', 'הלחמה', 'הדבקה', 'איטום',
        'מילוי', 'החלקה', 'ליטוש', 'הקשחה', 'חיזוק', 'ייצוב'
      ]
    };
  }

  /**
   * Transform OCR webhook data to database format
   * @param {Object} ocrData - Raw OCR webhook data
   * @param {string} caseId - Case ID for the invoice
   * @param {string} userId - Current user ID
   * @returns {Object} Transformed data ready for database insertion
   */
  transformOCRData(ocrData, caseId, userId) {
    const timestamp = new Date().toISOString();
    
    try {
      // Extract main invoice data
      const invoiceData = this.extractInvoiceData(ocrData, caseId, userId, timestamp);
      
      // Extract and transform line items
      const invoiceLines = this.extractInvoiceLines(ocrData, userId, timestamp);
      
      // Extract damage center mappings if available
      const damageCenterMappings = this.extractDamageCenterMappings(ocrData, caseId, userId, timestamp);
      
      return {
        invoice: invoiceData,
        invoice_lines: invoiceLines,
        damage_center_mappings: damageCenterMappings,
        metadata: {
          transformation_timestamp: timestamp,
          ocr_confidence: this.calculateOverallConfidence(ocrData),
          processing_method: 'hebrew_ocr_transformer_v1',
          raw_data_preserved: true
        }
      };
    } catch (error) {
      console.error('OCR transformation error:', error);
      throw new Error(`OCR data transformation failed: ${error.message}`);
    }
  }

  /**
   * Extract main invoice data from OCR
   */
  extractInvoiceData(ocrData, caseId, userId, timestamp) {
    const invoice = {
      case_id: caseId,
      created_by: userId,
      updated_by: userId,
      created_at: timestamp,
      updated_at: timestamp
    };

    // Map direct fields
    for (const [hebrewField, dbField] of Object.entries(this.hebrewFieldMappings)) {
      if (ocrData[hebrewField]) {
        if (dbField === 'invoice_date' || dbField === 'due_date') {
          invoice[dbField] = this.parseDate(ocrData[hebrewField]);
        } else if (dbField.includes('total') || dbField.includes('amount') || dbField.includes('cost')) {
          invoice[dbField] = this.parsePrice(ocrData[hebrewField]);
        } else {
          invoice[dbField] = ocrData[hebrewField];
        }
      }
    }

    // Determine invoice type based on content
    invoice.invoice_type = this.determineInvoiceType(ocrData);
    
    // Set default status
    invoice.status = 'DRAFT';
    
    // Store raw OCR data in metadata
    invoice.metadata = {
      raw_ocr_data: ocrData,
      processing_timestamp: timestamp,
      hebrew_fields_detected: Object.keys(ocrData).filter(key => 
        Object.keys(this.hebrewFieldMappings).includes(key)
      )
    };

    return invoice;
  }

  /**
   * Extract invoice lines from OCR parts/works/repairs data
   */
  extractInvoiceLines(ocrData, userId, timestamp) {
    const lines = [];
    let lineNumber = 1;

    // Process parts (חלקים)
    if (ocrData.חלקים && Array.isArray(ocrData.חלקים)) {
      for (const part of ocrData.חלקים) {
        const line = this.transformPartToLine(part, lineNumber++, userId, timestamp);
        lines.push(line);
      }
    }

    // Process works (עבודות)
    if (ocrData.עבודות && Array.isArray(ocrData.עבודות)) {
      for (const work of ocrData.עבודות) {
        const line = this.transformWorkToLine(work, lineNumber++, userId, timestamp);
        lines.push(line);
      }
    }

    // Process repairs (תיקונים)
    if (ocrData.תיקונים && Array.isArray(ocrData.תיקונים)) {
      for (const repair of ocrData.תיקונים) {
        const line = this.transformRepairToLine(repair, lineNumber++, userId, timestamp);
        lines.push(line);
      }
    }

    return lines;
  }

  /**
   * Transform part data to invoice line
   */
  transformPartToLine(part, lineNumber, userId, timestamp) {
    const line = {
      line_number: lineNumber,
      item_category: 'part',
      created_by: userId,
      updated_by: userId,
      created_at: timestamp,
      updated_at: timestamp
    };

    // Map part fields
    for (const [hebrewField, dbField] of Object.entries(this.hebrewFieldMappings)) {
      if (part[hebrewField]) {
        if (dbField === 'part_source') {
          line.source = this.mapPartSourceValue(part[hebrewField]);
        } else if (dbField === 'quantity' || dbField === 'unit_price' || dbField === 'line_total') {
          line[dbField] = this.parsePrice(part[hebrewField]);
        } else {
          line[dbField] = part[hebrewField];
        }
      }
    }

    // Calculate line total if missing
    if (!line.line_total && line.quantity && line.unit_price) {
      line.line_total = line.quantity * line.unit_price;
    }

    // Set category confidence
    line.category_confidence = this.calculateCategoryConfidence(part, 'part');
    line.category_method = 'hebrew_ocr_pattern_matching';

    // Store raw part data
    line.metadata = {
      raw_part_data: part,
      hebrew_source_field: part['מקור'] || null
    };

    return line;
  }

  /**
   * Transform work data to invoice line
   */
  transformWorkToLine(work, lineNumber, userId, timestamp) {
    const line = {
      line_number: lineNumber,
      item_category: 'work',
      created_by: userId,
      updated_by: userId,
      created_at: timestamp,
      updated_at: timestamp
    };

    // Map work fields
    line.description = work['תיאור עבודות'] || work['סוג העבודה'] || 'עבודה';
    line.unit_price = this.parsePrice(work['עלות עבודות']);
    line.quantity = this.parsePrice(work['שעות עבודה']) || 1;
    
    if (line.unit_price && line.quantity) {
      line.line_total = line.unit_price * line.quantity;
    }

    // Set category confidence
    line.category_confidence = this.calculateCategoryConfidence(work, 'work');
    line.category_method = 'hebrew_ocr_pattern_matching';

    // Store raw work data
    line.metadata = {
      raw_work_data: work,
      work_type: work['סוג העבודה'] || null
    };

    return line;
  }

  /**
   * Transform repair data to invoice line
   */
  transformRepairToLine(repair, lineNumber, userId, timestamp) {
    const line = {
      line_number: lineNumber,
      item_category: 'repair',
      created_by: userId,
      updated_by: userId,
      created_at: timestamp,
      updated_at: timestamp
    };

    // Map repair fields
    line.description = repair['תיאור התיקון'] || repair['סוג תיקון'] || 'תיקון';
    line.unit_price = this.parsePrice(repair['עלות תיקונים']);
    line.quantity = 1; // Repairs typically have quantity 1
    line.line_total = line.unit_price;

    // Set category confidence
    line.category_confidence = this.calculateCategoryConfidence(repair, 'repair');
    line.category_method = 'hebrew_ocr_pattern_matching';

    // Store raw repair data
    line.metadata = {
      raw_repair_data: repair,
      repair_type: repair['סוג תיקון'] || null
    };

    return line;
  }

  /**
   * Extract damage center mappings if available
   */
  extractDamageCenterMappings(ocrData, caseId, userId, timestamp) {
    const mappings = [];
    
    // This will be implemented based on the actual damage center data structure
    // For now, return empty array as this requires more specific OCR structure analysis
    
    return mappings;
  }

  /**
   * Helper method to map Hebrew part source values to standardized English
   */
  mapPartSourceValue(hebrewSource) {
    if (!hebrewSource) return null;
    
    const normalizedSource = hebrewSource.trim();
    return this.partSourceMappings[normalizedSource] || normalizedSource;
  }

  /**
   * Helper method to parse price strings
   */
  parsePrice(priceString) {
    if (!priceString) return null;
    
    // Remove non-numeric characters except decimal point
    const cleanPrice = priceString.toString().replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleanPrice);
    
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Helper method to parse date strings
   */
  parseDate(dateString) {
    if (!dateString) return null;
    
    try {
      // Try to parse various Hebrew date formats
      const parsed = new Date(dateString);
      return isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0];
    } catch (error) {
      console.warn('Date parsing failed:', dateString);
      return null;
    }
  }

  /**
   * Determine invoice type based on content
   */
  determineInvoiceType(ocrData) {
    const hasparts = ocrData.חלקים && ocrData.חלקים.length > 0;
    const hasWorks = ocrData.עבודות && ocrData.עבודות.length > 0;
    const hasRepairs = ocrData.תיקונים && ocrData.תיקונים.length > 0;
    
    if (hasparts && !hasWorks && !hasRepairs) return 'PARTS';
    if (!hasparts && hasWorks && !hasRepairs) return 'LABOR';
    if (hasparts && hasWorks) return 'PARTS'; // Mixed invoices default to PARTS
    
    return 'OTHER';
  }

  /**
   * Calculate category confidence based on pattern matching
   */
  calculateCategoryConfidence(item, expectedCategory) {
    const description = item['תיאור'] || item['תיאור עבודות'] || item['תיאור התיקון'] || '';
    const patterns = this.categoryPatterns[expectedCategory] || [];
    
    let matches = 0;
    for (const pattern of patterns) {
      if (description.includes(pattern)) {
        matches++;
      }
    }
    
    return Math.min(95, Math.max(60, (matches / patterns.length) * 100));
  }

  /**
   * Calculate overall OCR confidence
   */
  calculateOverallConfidence(ocrData) {
    // Simple confidence calculation based on field completeness
    const expectedFields = ['מספר רכב', 'שם מוסך', 'חלקים'];
    let foundFields = 0;
    
    for (const field of expectedFields) {
      if (ocrData[field]) foundFields++;
    }
    
    return Math.max(70, (foundFields / expectedFields.length) * 100);
  }
}

// Export for use in other modules
window.OCRDataTransformer = OCRDataTransformer;

// Usage example:
// const transformer = new OCRDataTransformer();
// const transformedData = transformer.transformOCRData(ocrWebhookData, caseId, userId);