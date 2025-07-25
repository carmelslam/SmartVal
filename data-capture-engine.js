// 🚀 DATA CAPTURE ENGINE - Universal solution for webhook + UI data
// Handles ALL data input/incoming and transfers to helper

console.log('🚀 Loading Data Capture Engine...');

class DataCaptureEngine {
  constructor() {
    this.fieldMappings = {};
    this.activeListeners = new Set();
    this.debugMode = true;
    this.init();
  }

  init() {
    console.log('🔧 Initializing Data Capture Engine...');
    this.setupFieldMappings();
    this.setupWebhookCapture();
    this.setupUICapture();
  }

  // PHASE 1: Define exact field mappings for each page
  setupFieldMappings() {
    this.fieldMappings = {
      // Vehicle data fields
      'plate': 'vehicle.plate',
      'plateNumber': 'vehicle.plate',
      'manufacturer': 'vehicle.manufacturer', 
      'model': 'vehicle.model',
      'year': 'vehicle.year',
      'chassis': 'vehicle.chassis',
      'vin': 'vehicle.chassis',
      'km': 'vehicle.km',
      'odo': 'vehicle.km',
      'mileage': 'vehicle.km',
      'engine_volume': 'vehicle.engine_volume',
      'fuel_type': 'vehicle.fuel_type',
      'ownership_type': 'vehicle.ownership_type',
      'trim': 'vehicle.trim',
      'model_type': 'vehicle.model_type',
      'model_code': 'vehicle.model_code',

      // Owner fields
      'owner': 'stakeholders.owner.name',
      'ownerName': 'stakeholders.owner.name',
      'ownerPhone': 'stakeholders.owner.phone',
      'ownerAddress': 'stakeholders.owner.address',

      // Garage fields  
      'garage': 'stakeholders.garage.name',
      'garageName': 'stakeholders.garage.name',
      'garagePhone': 'stakeholders.garage.phone',
      'garageEmail': 'stakeholders.garage.email',

      // Case fields
      'damageDate': 'case_info.damage_date',
      'location': 'case_info.inspection_location'
    };

    console.log('✅ Field mappings loaded:', Object.keys(this.fieldMappings).length, 'fields');
  }

  // PHASE 2: Webhook data capture (Hebrew processing)
  setupWebhookCapture() {
    // Simple Hebrew field extraction
    this.hebrewPatterns = [
      { pattern: /מס[׳״\'"`]*\s*רכב[:\s]*([0-9]+)/i, field: 'plate' },
      { pattern: /שם\s*היצרן[:\s]*([^\n\r]+)/i, field: 'manufacturer' },
      { pattern: /דגם[:\s]*([^\n\r]+)/i, field: 'model' },
      { pattern: /שנת\s*ייצור[:\s]*([0-9\/]+)/i, field: 'year' },
      { pattern: /מספר\s*שילדה[:\s]*([A-Z0-9]+)/i, field: 'chassis' },
      { pattern: /שם\s*בעל\s*הרכב[:\s]*([^\n\r]+)/i, field: 'owner' },
      { pattern: /מוסך[:\s]*([^\n\r]+)/i, field: 'garage' },
      { pattern: /נפח\s*מנוע[:\s]*([0-9]+)/i, field: 'engine_volume' },
      { pattern: /סוג\s*דלק[:\s]*([^\n\r]+)/i, field: 'fuel_type' },
      { pattern: /רמת\s*גימור[:\s]*([^\n\r]+)/i, field: 'trim' },
      { pattern: /סוג\s*הדגם[:\s]*([^\n\r]+)/i, field: 'model_type' },
      { pattern: /מספר\s*דגם\s*הרכב[:\s]*([A-Z0-9]+)/i, field: 'model_code' }
    ];

    console.log('✅ Hebrew patterns loaded:', this.hebrewPatterns.length, 'patterns');
  }

  // PHASE 3: UI field capture
  setupUICapture() {
    // Auto-setup on DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.captureAllFields());
    } else {
      this.captureAllFields();
    }
  }

  // CORE METHOD: Process any data (webhook or manual)
  processData(data, source = 'unknown') {
    console.log(`🔄 Processing data from: ${source}`);
    
    if (!window.helper) {
      console.warn('⚠️ Helper not found, cannot store data');
      return { success: false, error: 'Helper not available' };
    }

    let captured = 0;
    
    // If it's Hebrew text, extract using patterns
    if (typeof data === 'string' && /[\u0590-\u05FF]/.test(data)) {
      captured = this.extractHebrewData(data);
    }
    
    // If it's object data, map directly
    else if (typeof data === 'object') {
      captured = this.mapObjectData(data);
    }

    this.saveToHelper();
    
    console.log(`✅ Data processed: ${captured} fields captured from ${source}`);
    return { success: true, captured, source };
  }

  // Extract data from Hebrew text
  extractHebrewData(text) {
    let captured = 0;
    
    this.hebrewPatterns.forEach(({ pattern, field }) => {
      const match = text.match(pattern);
      if (match) {
        const value = match[1].trim();
        if (value) {
          this.setHelperValue(field, value);
          captured++;
          console.log(`✅ Hebrew extracted: ${field} = ${value}`);
        }
      }
    });

    return captured;
  }

  // Map object data to helper
  mapObjectData(data) {
    let captured = 0;
    
    Object.entries(data).forEach(([key, value]) => {
      if (this.fieldMappings[key] && value) {
        this.setHelperValue(key, value);
        captured++;
        console.log(`✅ Object mapped: ${key} = ${value}`);
      }
    });

    return captured;
  }

  // Capture all form fields in current page
  captureAllFields() {
    const inputs = document.querySelectorAll('input[type="text"], input[type="number"], select, textarea');
    let setupCount = 0;

    inputs.forEach(input => {
      const fieldKey = input.id || input.name;
      if (this.fieldMappings[fieldKey] && !this.activeListeners.has(fieldKey)) {
        
        input.addEventListener('input', (e) => {
          const value = e.target.value?.trim();
          if (value) {
            this.setHelperValue(fieldKey, value);
            this.saveToHelper();
            console.log(`📝 UI captured: ${fieldKey} = ${value}`);
          }
        });

        this.activeListeners.add(fieldKey);
        setupCount++;
      }
    });

    console.log(`🎯 UI capture setup: ${setupCount} fields monitored`);
  }

  // Set value in helper structure
  setHelperValue(fieldKey, value) {
    const helperPath = this.fieldMappings[fieldKey];
    if (!helperPath) return;

    const keys = helperPath.split('.');
    let current = window.helper;

    // Navigate to the right location
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    // Set the value
    current[keys[keys.length - 1]] = value;
  }

  // Save helper to storage
  saveToHelper() {
    if (window.helper) {
      window.helper.meta.last_updated = new Date().toISOString();
      
      // Save to session storage using helper utilities
      if (typeof updateHelperFromObject === 'function') {
        updateHelperFromObject(window.helper);
      } else if (typeof updateHelperAndSession === 'function') {
        Object.entries(window.helper).forEach(([key, value]) => {
          updateHelperAndSession(key, value);
        });
      }
      sessionStorage.setItem('helper_timestamp', new Date().toISOString());
      
      // Save to local storage  
      localStorage.setItem('helper_data', JSON.stringify(window.helper));
    }
  }

  // Public method to test with your webhook data
  testWithWebhookData() {
    const testData = `פרטי רכב: 5785269
מס' רכב: 5785269
שם היצרן: ביואיק
דגם: LUCERNE
סוג הדגם: סדאן
רמת גימור:CXL
מספר שילדה: 1G4HD57258U196450
שם בעל הרכב: כרמל כיוף
נפח מנוע: 3791
סוג דלק: בנזין
מספר דגם הרכב:HD572
מוסך: UMI חיפה`;

    console.log('🧪 Testing with your webhook data...');
    const result = this.processData(testData, 'WEBHOOK_TEST');
    
    // Show results
    console.log('📊 Test Results:', result);
    console.log('🎯 Helper data:', {
      plate: window.helper?.vehicle?.plate,
      manufacturer: window.helper?.vehicle?.manufacturer,
      model: window.helper?.vehicle?.model,
      owner: window.helper?.stakeholders?.owner?.name,
      garage: window.helper?.stakeholders?.garage?.name
    });

    return result;
  }
}

// Initialize the engine
window.dataCaptureEngine = new DataCaptureEngine();

// Expose public methods
window.processIncomingWebhookData = (data, source) => window.dataCaptureEngine.processData(data, source);
window.testDataCapture = () => window.dataCaptureEngine.testWithWebhookData();

console.log('✅ Data Capture Engine loaded and ready');
console.log('💡 Test with: testDataCapture()');