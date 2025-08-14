// 🔄 Universal Data Capture System - Real-time input monitoring for ALL modules
// Ensures all UI inputs are automatically captured and saved to helper/session storage

// FIXED: Use window.* directly since helper.js is loaded as regular script
// import { updateHelper, helper } from './helper.js';

class UniversalDataCapture {
  constructor() {
    this.initialized = false;
    this.capturedFields = new Map();
    this.debounceTimers = new Map();
    this.fieldMappings = new Map();
    
    console.log('🔄 UniversalDataCapture: Initializing...');
  }

  init() {
    if (this.initialized) return;
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupListeners());
    } else {
      this.setupListeners();
    }
    
    this.initialized = true;
    console.log('✅ UniversalDataCapture: Initialized successfully');
  }

  setupListeners() {
    console.log('🔍 Setting up universal input listeners...');
    
    // Monitor all input fields in real-time
    this.setupInputListeners();
    
    // Monitor dynamic content changes
    this.setupMutationObserver();
    
    // Set up periodic sync to ensure data persistence
    this.setupPeriodicSync();
    
    // Set up beforeunload to save data
    this.setupDataPersistence();
  }

  setupInputListeners() {
    // Create a comprehensive selector for all input types
    const inputSelector = 'input, select, textarea, [contenteditable="true"]';
    
    // Get all existing inputs
    const allInputs = document.querySelectorAll(inputSelector);
    console.log(`📊 Found ${allInputs.length} input fields to monitor`);
    
    allInputs.forEach(input => {
      this.attachInputListener(input);
    });
  }

  attachInputListener(input) {
    if (input.dataset.universalCaptureAttached) return;
    
    const fieldId = input.id || input.name || `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine helper path mapping
    const helperPath = this.getHelperPath(input, fieldId);
    
    console.log(`🔗 Attaching listener to field: ${fieldId} → ${helperPath}`);
    
    // Handle different input types
    const events = ['input', 'change', 'blur'];
    
    events.forEach(eventType => {
      input.addEventListener(eventType, (e) => {
        this.handleInputChange(e.target, fieldId, helperPath);
      });
    });
    
    // Mark as attached
    input.dataset.universalCaptureAttached = 'true';
    input.dataset.fieldId = fieldId;
    input.dataset.helperPath = helperPath;
  }

  getHelperPath(input, fieldId) {
    // Define field mappings based on common patterns
    const fieldMappings = {
      // Vehicle data
      'plate': 'vehicle.plate',
      'plateNumber': 'vehicle.plate', 
      'manufacturer': 'vehicle.manufacturer',
      'model': 'vehicle.model',
      'year': 'vehicle.year',
      'km': 'vehicle.km',
      'odo': 'vehicle.km',
      
      // Stakeholder data
      'garageName': 'stakeholders.garage.name',
      'garagePhone': 'stakeholders.garage.phone',
      'garageEmail': 'stakeholders.garage.email',
      'agentName': 'stakeholders.insurance.agent.name',
      'agentPhone': 'stakeholders.insurance.agent.phone',
      'agentEmail': 'stakeholders.insurance.agent.email',
      'insuranceCompany': 'stakeholders.insurance.company',
      'insuranceEmail': 'stakeholders.insurance.email',
      // 'ownerPhone': 'stakeholders.owner.phone', // DISABLED - should not auto-populate
      'ownerAddress': 'stakeholders.owner.address',
      
      // Damage data
      'damageDate': 'damage_info.damage_date',
      'damageType': 'damage_info.damage_type',
      
      // Levi report fields
      'עליה לכביש': 'valuation.adjustments.road_registration.percentage',
      'סוג בעלות': 'valuation.adjustments.ownership_type.percentage',
      'מספר ק״מ': 'valuation.adjustments.mileage.percentage',
      'מספר בעלים': 'valuation.adjustments.previous_owners.percentage',
      'מאפיינים': 'valuation.adjustments.features.percentage'
    };
    
    // Try to match by ID first
    if (fieldMappings[fieldId]) {
      return fieldMappings[fieldId];
    }
    
    // Try to match by name attribute
    if (input.name && fieldMappings[input.name]) {
      return fieldMappings[input.name];
    }
    
    // Try to match by placeholder text
    if (input.placeholder) {
      const hebrewField = Object.keys(fieldMappings).find(key => 
        input.placeholder.includes(key) || key.includes(input.placeholder)
      );
      if (hebrewField) {
        return fieldMappings[hebrewField];
      }
    }
    
    // Default fallback - store in general section
    return `general.${fieldId}`;
  }

  handleInputChange(input, fieldId, helperPath) {
    const value = this.getInputValue(input);
    
    console.log(`📝 Input change detected: ${fieldId} = "${value}" → ${helperPath}`);
    
    // Store the captured data
    this.capturedFields.set(fieldId, {
      value,
      helperPath,
      timestamp: new Date().toISOString(),
      element: input
    });
    
    // Debounce the helper update to avoid excessive calls
    this.debounceHelperUpdate(helperPath, value, 500);
  }

  getInputValue(input) {
    if (input.type === 'checkbox') {
      return input.checked;
    } else if (input.type === 'radio') {
      return input.checked ? input.value : null;
    } else if (input.tagName === 'SELECT') {
      return input.value;
    } else if (input.contentEditable === 'true') {
      return input.textContent;
    } else {
      return input.value;
    }
  }

  debounceHelperUpdate(helperPath, value, delay = 500) {
    // Clear existing timer
    if (this.debounceTimers.has(helperPath)) {
      clearTimeout(this.debounceTimers.get(helperPath));
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      this.updateHelperField(helperPath, value);
      this.debounceTimers.delete(helperPath);
    }, delay);
    
    this.debounceTimers.set(helperPath, timer);
  }

  updateHelperField(helperPath, value) {
    try {
      console.log(`💾 Updating helper: ${helperPath} = "${value}"`);
      
      // Parse the path and update the helper
      const pathParts = helperPath.split('.');
      const section = pathParts[0];
      
      // Create nested object structure
      const updateData = {};
      let current = updateData;
      
      for (let i = 1; i < pathParts.length - 1; i++) {
        current[pathParts[i]] = {};
        current = current[pathParts[i]];
      }
      current[pathParts[pathParts.length - 1]] = value;
      
      // Update the helper
      updateHelper(section, updateData, 'universal_capture');
      
      console.log(`✅ Helper updated successfully: ${helperPath}`);
      
    } catch (error) {
      console.error(`❌ Failed to update helper field ${helperPath}:`, error);
    }
  }

  setupMutationObserver() {
    // Monitor for dynamically added form elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the node itself is an input
            if (this.isInputElement(node)) {
              this.attachInputListener(node);
            }
            
            // Check for input elements within the added node
            const inputs = node.querySelectorAll ? node.querySelectorAll('input, select, textarea, [contenteditable="true"]') : [];
            inputs.forEach(input => this.attachInputListener(input));
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('👁️ Mutation observer set up for dynamic content');
  }

  isInputElement(element) {
    return ['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName) || 
           element.contentEditable === 'true';
  }

  setupPeriodicSync() {
    // Sync data every 30 seconds to ensure persistence
    this.syncInterval = setInterval(() => {
      if (this.capturedFields.size > 0) {
        console.log(`🔄 Periodic sync: ${this.capturedFields.size} fields captured`);
        this.syncAllCapturedData();
      }
    }, 30000);
  }

  setupDataPersistence() {
    // Save all data before page unload
    window.addEventListener('beforeunload', () => {
      this.syncAllCapturedData();
      console.log('💾 Data saved before page unload');
      
      // Clean up interval to prevent memory leak
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }
    });
    
    // Save data when page becomes hidden (mobile/tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.syncAllCapturedData();
        console.log('💾 Data saved on visibility change');
      }
    });
  }

  syncAllCapturedData() {
    console.log('🔄 Syncing all captured data to helper...');
    
    // Group updates by section to minimize helper calls
    const sectionUpdates = new Map();
    
    this.capturedFields.forEach((fieldData, fieldId) => {
      const { helperPath, value } = fieldData;
      const section = helperPath.split('.')[0];
      
      if (!sectionUpdates.has(section)) {
        sectionUpdates.set(section, {});
      }
      
      // Build nested structure
      const pathParts = helperPath.split('.').slice(1);
      let current = sectionUpdates.get(section);
      
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!current[pathParts[i]]) {
          current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
      }
      current[pathParts[pathParts.length - 1]] = value;
    });
    
    // Apply all updates
    sectionUpdates.forEach((updateData, section) => {
      updateHelper(section, updateData, 'universal_capture_sync');
      console.log(`✅ Synced section: ${section}`, updateData);
    });
    
    console.log(`✅ Synced ${sectionUpdates.size} sections with ${this.capturedFields.size} fields`);
  }

  // Public method to manually capture a specific field
  captureField(input, helperPath = null) {
    const fieldId = input.id || input.name || `manual_${Date.now()}`;
    const path = helperPath || this.getHelperPath(input, fieldId);
    
    this.handleInputChange(input, fieldId, path);
    console.log(`📝 Manually captured field: ${fieldId} → ${path}`);
  }

  // Public method to get current captured data
  getCapturedData() {
    const data = {};
    this.capturedFields.forEach((fieldData, fieldId) => {
      data[fieldId] = fieldData;
    });
    return data;
  }
}

// Create global instance
const universalCapture = new UniversalDataCapture();

// Auto-initialize when script loads
universalCapture.init();

// Export for manual usage
export default universalCapture;

// Make available globally for debugging
window.universalCapture = universalCapture;

console.log('🚀 Universal Data Capture system loaded and ready');