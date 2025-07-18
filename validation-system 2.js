// 🛡️ Comprehensive Validation System
import { helper, updateHelper } from './helper.js';

class ValidationSystem {
  constructor() {
    this.rules = new Map();
    this.errors = new Map();
    this.warnings = new Map();
    this.validationHistory = [];
    this.realTimeValidation = true;
    this.debounceTimeout = 300;
    this.debounceTimers = new Map();
    
    this.initializeValidationRules();
    this.setupGlobalValidation();
  }

  initializeValidationRules() {
    // Vehicle Data Validation Rules
    this.addRule('vehicle.plate', {
      required: true,
      minLength: 7,
      maxLength: 8,
      pattern: /^[0-9]{2,3}-[0-9]{3}-[0-9]{2}$/,
      message: 'מספר רישוי חייב להיות בפורמט הנכון (XX-XXX-XX)'
    });

    this.addRule('vehicle.manufacturer', {
      required: true,
      minLength: 2,
      maxLength: 50,
      message: 'שם יצרן חייב להכיל 2-50 תווים'
    });

    this.addRule('vehicle.model', {
      required: true,
      minLength: 1,
      maxLength: 50,
      message: 'דגם רכב חייב להכיל 1-50 תווים'
    });

    this.addRule('vehicle.year', {
      required: true,
      min: 1990,
      max: new Date().getFullYear() + 1,
      type: 'number',
      message: 'שנת ייצור חייבת להיות בין 1990 לשנה הבאה'
    });

    this.addRule('vehicle.engine', {
      required: true,
      min: 800,
      max: 8000,
      type: 'number',
      message: 'נפח מנוע חייב להיות בין 800 ל-8000 סמ"ק'
    });

    // Damage Center Validation Rules
    this.addRule('damage.center.location', {
      required: true,
      minLength: 2,
      message: 'מיקום מוקד נזק חייב להיות מוגדר'
    });

    this.addRule('damage.center.description', {
      required: true,
      minLength: 10,
      maxLength: 500,
      message: 'תיאור נזק חייב להכיל 10-500 תווים'
    });

    this.addRule('damage.part.name', {
      required: true,
      minLength: 2,
      maxLength: 100,
      message: 'שם חלק חייב להכיל 2-100 תווים'
    });

    this.addRule('damage.part.price', {
      required: true,
      min: 0,
      max: 50000,
      type: 'number',
      message: 'מחיר חלק חייב להיות בין 0 ל-50,000 ש"ח'
    });

    this.addRule('damage.repair.cost', {
      required: true,
      min: 0,
      max: 100000,
      type: 'number',
      message: 'עלות תיקון חייבת להיות בין 0 ל-100,000 ש"ח'
    });

    // Estimate Validation Rules
    this.addRule('estimate.totalCost', {
      required: true,
      min: 100,
      max: 500000,
      type: 'number',
      message: 'סה"כ הערכה חייב להיות בין 100 ל-500,000 ש"ח'
    });

    // File Upload Validation Rules
    this.addRule('file.image', {
      required: true,
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      message: 'קובץ תמונה חייב להיות JPEG/PNG/WebP ועד 10MB'
    });

    this.addRule('file.pdf', {
      required: true,
      maxSize: 20 * 1024 * 1024, // 20MB
      allowedTypes: ['application/pdf'],
      message: 'קובץ PDF חייב להיות עד 20MB'
    });

    // Business Logic Validation Rules
    this.addRule('business.totalParts', {
      min: 1,
      max: 100,
      type: 'number',
      message: 'מספר חלקים חייב להיות בין 1 ל-100'
    });

    this.addRule('business.totalCenters', {
      min: 1,
      max: 10,
      type: 'number',
      message: 'מספר מוקדי נזק חייב להיות בין 1 ל-10'
    });

    this.addRule('business.costRatio', {
      min: 0.1,
      max: 2.0,
      type: 'number',
      message: 'יחס עלות חלקים לעבודה חייב להיות בין 0.1 ל-2.0'
    });
  }

  addRule(path, rule) {
    this.rules.set(path, rule);
  }

  setupGlobalValidation() {
    // Monitor all form inputs for real-time validation
    document.addEventListener('input', (event) => {
      if (this.realTimeValidation && event.target.matches('input, textarea, select')) {
        this.debounceValidation(event.target);
      }
    });

    // Monitor data changes in helper
    const originalUpdateHelper = window.updateHelper;
    window.updateHelper = (...args) => {
      const result = originalUpdateHelper.apply(this, args);
      this.validateHelperData();
      return result;
    };
  }

  debounceValidation(element) {
    const elementId = element.id || element.name || 'unnamed';
    
    if (this.debounceTimers.has(elementId)) {
      clearTimeout(this.debounceTimers.get(elementId));
    }

    const timer = setTimeout(() => {
      this.validateElement(element);
      this.debounceTimers.delete(elementId);
    }, this.debounceTimeout);

    this.debounceTimers.set(elementId, timer);
  }

  validateElement(element) {
    const path = this.getElementPath(element);
    const value = element.value;
    const rule = this.rules.get(path);
    
    if (!rule) return true;

    const validation = this.validateValue(value, rule);
    this.updateElementValidation(element, validation);
    
    return validation.isValid;
  }

  getElementPath(element) {
    // Map element to validation path based on data attributes or patterns
    const dataPath = element.getAttribute('data-validation-path');
    if (dataPath) return dataPath;

    const id = element.id;
    const name = element.name;
    const className = element.className;

    // Pattern matching for common element types
    if (id.includes('plate') || name.includes('plate')) return 'vehicle.plate';
    if (id.includes('manufacturer')) return 'vehicle.manufacturer';
    if (id.includes('model')) return 'vehicle.model';
    if (id.includes('year')) return 'vehicle.year';
    if (id.includes('engine')) return 'vehicle.engine';
    if (className.includes('part-name')) return 'damage.part.name';
    if (className.includes('part-price')) return 'damage.part.price';
    if (className.includes('repair-cost')) return 'damage.repair.cost';
    if (className.includes('center-description')) return 'damage.center.description';

    return 'generic';
  }

  validateValue(value, rule) {
    const errors = [];
    const warnings = [];

    // Required validation
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors.push('שדה חובה');
    }

    if (value && value.toString().trim() !== '') {
      // Type validation
      if (rule.type === 'number') {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          errors.push('חייב להיות מספר');
        } else {
          if (rule.min !== undefined && numValue < rule.min) {
            errors.push(`ערך מינימלי: ${rule.min}`);
          }
          if (rule.max !== undefined && numValue > rule.max) {
            errors.push(`ערך מקסימלי: ${rule.max}`);
          }
        }
      }

      // String validation
      if (rule.type !== 'number') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`אורך מינימלי: ${rule.minLength} תווים`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`אורך מקסימלי: ${rule.maxLength} תווים`);
        }
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(rule.message || 'פורמט לא תקין');
      }
    }

    // Warnings for edge cases
    if (rule.type === 'number' && value) {
      const numValue = parseFloat(value);
      if (rule.min !== undefined && numValue === rule.min) {
        warnings.push('ערך מינימלי - וודא שהוא נכון');
      }
      if (rule.max !== undefined && numValue === rule.max) {
        warnings.push('ערך מקסימלי - וודא שהוא נכון');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      value
    };
  }

  updateElementValidation(element, validation) {
    // Remove existing validation classes
    element.classList.remove('validation-error', 'validation-warning', 'validation-success');
    
    // Remove existing validation messages
    const existingMessage = element.parentNode.querySelector('.validation-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    // Add appropriate class and message
    if (!validation.isValid) {
      element.classList.add('validation-error');
      this.showValidationMessage(element, validation.errors, 'error');
    } else if (validation.warnings.length > 0) {
      element.classList.add('validation-warning');
      this.showValidationMessage(element, validation.warnings, 'warning');
    } else {
      element.classList.add('validation-success');
    }
  }

  showValidationMessage(element, messages, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `validation-message validation-${type}`;
    messageDiv.innerHTML = messages.map(msg => `<span>${msg}</span>`).join('<br>');
    
    // Insert after the element
    element.parentNode.insertBefore(messageDiv, element.nextSibling);
    
    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.remove();
        }
      }, 3000);
    }
  }

  validateHelperData() {
    const helperData = helper;
    const validationResults = {
      isValid: true,
      errors: [],
      warnings: [],
      details: {}
    };

    // Validate vehicle data
    if (helperData.vehicle) {
      const vehicleValidation = this.validateVehicleData(helperData.vehicle);
      validationResults.details.vehicle = vehicleValidation;
      if (!vehicleValidation.isValid) {
        validationResults.isValid = false;
        validationResults.errors.push('פרטי רכב לא תקינים');
      }
    }

    // Validate damage data
    if (helperData.damage) {
      const damageValidation = this.validateDamageData(helperData.damage);
      validationResults.details.damage = damageValidation;
      if (!damageValidation.isValid) {
        validationResults.isValid = false;
        validationResults.errors.push('נתוני נזק לא תקינים');
      }
    }

    // Validate business rules
    const businessValidation = this.validateBusinessRules(helperData);
    validationResults.details.business = businessValidation;
    if (!businessValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors.push('חוקי עסק לא מתקיימים');
    }

    // Store validation results
    this.validationHistory.push({
      timestamp: new Date(),
      results: validationResults
    });

    // Keep only last 10 validation results
    if (this.validationHistory.length > 10) {
      this.validationHistory = this.validationHistory.slice(-10);
    }

    return validationResults;
  }

  validateVehicleData(vehicleData) {
    const results = {
      isValid: true,
      errors: [],
      warnings: [],
      fields: {}
    };

    const fields = ['plate', 'manufacturer', 'model', 'year', 'engine'];
    
    for (const field of fields) {
      const rule = this.rules.get(`vehicle.${field}`);
      if (rule) {
        const validation = this.validateValue(vehicleData[field], rule);
        results.fields[field] = validation;
        
        if (!validation.isValid) {
          results.isValid = false;
          results.errors.push(`${field}: ${validation.errors.join(', ')}`);
        }
        
        if (validation.warnings.length > 0) {
          results.warnings.push(`${field}: ${validation.warnings.join(', ')}`);
        }
      }
    }

    return results;
  }

  validateDamageData(damageData) {
    const results = {
      isValid: true,
      errors: [],
      warnings: [],
      centers: []
    };

    if (!damageData.centers || !Array.isArray(damageData.centers)) {
      results.isValid = false;
      results.errors.push('לא נמצאו מוקדי נזק');
      return results;
    }

    damageData.centers.forEach((center, index) => {
      const centerValidation = this.validateDamageCenter(center);
      results.centers[index] = centerValidation;
      
      if (!centerValidation.isValid) {
        results.isValid = false;
        results.errors.push(`מוקד נזק ${index + 1}: ${centerValidation.errors.join(', ')}`);
      }
    });

    return results;
  }

  validateDamageCenter(center) {
    const results = {
      isValid: true,
      errors: [],
      warnings: [],
      parts: [],
      repairs: []
    };

    // Validate center location
    if (!center.location || center.location.trim() === '') {
      results.isValid = false;
      results.errors.push('מיקום מוקד נזק חסר');
    }

    // Validate center description
    if (!center.description || center.description.trim().length < 10) {
      results.isValid = false;
      results.errors.push('תיאור נזק חסר או קצר מדי');
    }

    // Validate parts
    if (center.parts && Array.isArray(center.parts)) {
      center.parts.forEach((part, index) => {
        const partValidation = this.validatePart(part);
        results.parts[index] = partValidation;
        
        if (!partValidation.isValid) {
          results.isValid = false;
          results.errors.push(`חלק ${index + 1}: ${partValidation.errors.join(', ')}`);
        }
      });
    }

    // Validate repairs
    if (center.repairs && Array.isArray(center.repairs)) {
      center.repairs.forEach((repair, index) => {
        const repairValidation = this.validateRepair(repair);
        results.repairs[index] = repairValidation;
        
        if (!repairValidation.isValid) {
          results.isValid = false;
          results.errors.push(`תיקון ${index + 1}: ${repairValidation.errors.join(', ')}`);
        }
      });
    }

    return results;
  }

  validatePart(part) {
    const results = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validate part name
    const nameRule = this.rules.get('damage.part.name');
    if (nameRule) {
      const nameValidation = this.validateValue(part.name, nameRule);
      if (!nameValidation.isValid) {
        results.isValid = false;
        results.errors.push(...nameValidation.errors);
      }
    }

    // Validate part price
    const priceRule = this.rules.get('damage.part.price');
    if (priceRule) {
      const priceValidation = this.validateValue(part.price, priceRule);
      if (!priceValidation.isValid) {
        results.isValid = false;
        results.errors.push(...priceValidation.errors);
      }
    }

    return results;
  }

  validateRepair(repair) {
    const results = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validate repair cost
    const costRule = this.rules.get('damage.repair.cost');
    if (costRule) {
      const costValidation = this.validateValue(repair.cost, costRule);
      if (!costValidation.isValid) {
        results.isValid = false;
        results.errors.push(...costValidation.errors);
      }
    }

    return results;
  }

  validateBusinessRules(helperData) {
    const results = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validate total parts count
    const totalParts = this.getTotalPartsCount(helperData);
    const partsRule = this.rules.get('business.totalParts');
    if (partsRule) {
      const partsValidation = this.validateValue(totalParts, partsRule);
      if (!partsValidation.isValid) {
        results.isValid = false;
        results.errors.push(`מספר חלקים: ${partsValidation.errors.join(', ')}`);
      }
    }

    // Validate total centers count
    const totalCenters = this.getTotalCentersCount(helperData);
    const centersRule = this.rules.get('business.totalCenters');
    if (centersRule) {
      const centersValidation = this.validateValue(totalCenters, centersRule);
      if (!centersValidation.isValid) {
        results.isValid = false;
        results.errors.push(`מספר מוקדי נזק: ${centersValidation.errors.join(', ')}`);
      }
    }

    // Validate cost ratios
    const costRatio = this.calculateCostRatio(helperData);
    if (costRatio !== null) {
      const ratioRule = this.rules.get('business.costRatio');
      if (ratioRule) {
        const ratioValidation = this.validateValue(costRatio, ratioRule);
        if (!ratioValidation.isValid) {
          results.warnings.push(`יחס עלות חלקים לעבודה: ${ratioValidation.errors.join(', ')}`);
        }
      }
    }

    return results;
  }

  getTotalPartsCount(helperData) {
    if (!helperData.damage || !helperData.damage.centers) return 0;
    
    return helperData.damage.centers.reduce((total, center) => {
      return total + (center.parts ? center.parts.length : 0);
    }, 0);
  }

  getTotalCentersCount(helperData) {
    if (!helperData.damage || !helperData.damage.centers) return 0;
    return helperData.damage.centers.length;
  }

  calculateCostRatio(helperData) {
    if (!helperData.damage || !helperData.damage.centers) return null;
    
    let totalPartsCost = 0;
    let totalRepairsCost = 0;
    
    helperData.damage.centers.forEach(center => {
      if (center.parts) {
        center.parts.forEach(part => {
          totalPartsCost += parseFloat(part.price || 0);
        });
      }
      
      if (center.repairs) {
        center.repairs.forEach(repair => {
          totalRepairsCost += parseFloat(repair.cost || 0);
        });
      }
    });
    
    if (totalRepairsCost === 0) return null;
    return totalPartsCost / totalRepairsCost;
  }

  validateFile(file, type = 'image') {
    const rule = this.rules.get(`file.${type}`);
    if (!rule) return { isValid: true, errors: [], warnings: [] };

    const errors = [];
    const warnings = [];

    // Check file size
    if (rule.maxSize && file.size > rule.maxSize) {
      errors.push(`גודל קובץ מקסימלי: ${this.formatFileSize(rule.maxSize)}`);
    }

    // Check file type
    if (rule.allowedTypes && !rule.allowedTypes.includes(file.type)) {
      errors.push(`סוג קובץ לא נתמך. סוגים נתמכים: ${rule.allowedTypes.join(', ')}`);
    }

    // Warnings for large files
    if (file.size > rule.maxSize * 0.8) {
      warnings.push('קובץ גדול - עלול להאט את המערכת');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getValidationSummary() {
    const helperValidation = this.validateHelperData();
    
    return {
      isValid: helperValidation.isValid,
      totalErrors: helperValidation.errors.length,
      totalWarnings: helperValidation.warnings.length,
      lastValidation: new Date(),
      details: helperValidation.details
    };
  }

  generateValidationReport() {
    const summary = this.getValidationSummary();
    const report = {
      timestamp: new Date(),
      summary,
      history: this.validationHistory,
      recommendations: this.generateRecommendations(summary)
    };

    return report;
  }

  generateRecommendations(summary) {
    const recommendations = [];

    if (!summary.isValid) {
      recommendations.push('יש לתקן את השגיאות הבאות לפני המשך');
    }

    if (summary.totalWarnings > 0) {
      recommendations.push('יש לבדוק את האזהרות ולוודא שהנתונים נכונים');
    }

    if (summary.details.vehicle && !summary.details.vehicle.isValid) {
      recommendations.push('יש לבדוק ולתקן את פרטי הרכב');
    }

    if (summary.details.damage && !summary.details.damage.isValid) {
      recommendations.push('יש לבדוק ולתקן את נתוני הנזק');
    }

    if (summary.details.business && !summary.details.business.isValid) {
      recommendations.push('יש לבדוק את חוקי העסק והיחסים בין העלויות');
    }

    return recommendations;
  }

  // CSS Styles for validation
  injectValidationStyles() {
    const existingStyles = document.getElementById('validation-styles');
    if (existingStyles) return;

    const styles = document.createElement('style');
    styles.id = 'validation-styles';
    styles.textContent = `
      .validation-error {
        border: 2px solid #dc3545 !important;
        background-color: #fff5f5 !important;
      }
      
      .validation-warning {
        border: 2px solid #ffc107 !important;
        background-color: #fffdf0 !important;
      }
      
      .validation-success {
        border: 2px solid #28a745 !important;
        background-color: #f0fff4 !important;
      }
      
      .validation-message {
        margin-top: 5px;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 14px;
        line-height: 1.4;
      }
      
      .validation-message.validation-error {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }
      
      .validation-message.validation-warning {
        background-color: #fff3cd;
        color: #856404;
        border: 1px solid #ffeaa7;
      }
      
      .validation-message.validation-success {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }
      
      .validation-summary {
        background: white;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      
      .validation-summary.valid {
        border-left: 4px solid #28a745;
      }
      
      .validation-summary.invalid {
        border-left: 4px solid #dc3545;
      }
      
      .validation-summary h3 {
        margin: 0 0 15px 0;
        color: #333;
      }
      
      .validation-summary .errors {
        color: #dc3545;
        margin-bottom: 10px;
      }
      
      .validation-summary .warnings {
        color: #ffc107;
        margin-bottom: 10px;
      }
      
      .validation-summary .recommendations {
        color: #17a2b8;
        font-style: italic;
      }
    `;
    
    document.head.appendChild(styles);
  }
}

// Initialize validation system
const validationSystem = new ValidationSystem();
validationSystem.injectValidationStyles();

// Export for global use
window.ValidationSystem = ValidationSystem;
window.validationSystem = validationSystem;

export { ValidationSystem, validationSystem };