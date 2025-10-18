// 🔄 Helper.js Event-Driven Extensions
// Provides event-driven updates, auto-save, and consistent data integration

// ✅ SESSION 45 FIX: Use global window functions instead of imports (helper.js no longer exports)
const helper = window.helper;
const updateHelper = window.updateHelper;
const saveHelperToStorage = window.saveHelperToStorage;

// Global event system
class HelperEventBus {
  constructor() {
    this.listeners = new Map();
    this.debounceTimers = new Map();
    this.autoSaveEnabled = true;
    this.autoSaveDelay = 2000; // 2 seconds debounce
  }

  // Subscribe to helper data changes
  on(section, callback) {
    if (!this.listeners.has(section)) {
      this.listeners.set(section, new Set());
    }
    this.listeners.get(section).add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(section)?.delete(callback);
    };
  }

  // Emit events when data changes
  emit(section, data, source = 'unknown') {
    const sectionListeners = this.listeners.get(section);
    const globalListeners = this.listeners.get('*');
    
    const eventData = {
      section,
      data,
      source,
      timestamp: new Date().toISOString(),
      helper: helper // Reference to current helper state
    };

    // Notify section-specific listeners
    if (sectionListeners) {
      sectionListeners.forEach(callback => {
        try {
          callback(eventData);
        } catch (error) {
          console.error(`Event listener error for section ${section}:`, error);
        }
      });
    }

    // Notify global listeners
    if (globalListeners) {
      globalListeners.forEach(callback => {
        try {
          callback(eventData);
        } catch (error) {
          console.error('Global event listener error:', error);
        }
      });
    }

    // Trigger auto-save with debouncing
    this.triggerAutoSave(section);
  }

  // Debounced auto-save
  triggerAutoSave(section) {
    if (!this.autoSaveEnabled) return;

    // Clear existing timer for this section
    if (this.debounceTimers.has(section)) {
      clearTimeout(this.debounceTimers.get(section));
    }

    // Set new timer
    const timer = setTimeout(() => {
      try {
        saveHelperToStorage();
        this.emit('auto_saved', { section }, 'helper-events');
        console.log(`Auto-saved helper data for section: ${section}`);
      } catch (error) {
        console.error('Auto-save failed:', error);
        this.emit('auto_save_failed', { section, error: error.message }, 'helper-events');
      }
      this.debounceTimers.delete(section);
    }, this.autoSaveDelay);

    this.debounceTimers.set(section, timer);
  }

  // Enable/disable auto-save
  setAutoSave(enabled, delay = 2000) {
    this.autoSaveEnabled = enabled;
    this.autoSaveDelay = delay;
  }

  // Clear all timers
  clearTimers() {
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}

// Global event bus instance
export const helperEvents = new HelperEventBus();

// Enhanced updateHelper with events
export function updateHelperWithEvents(section, data, source = 'unknown') {
  const success = updateHelper(section, data);
  if (success) {
    helperEvents.emit(section, data, source);
  }
  return success;
}

// Auto-binding for form fields
export function bindFormToHelper(formElement, section, options = {}) {
  if (!formElement) {
    console.error('bindFormToHelper: Form element not provided');
    return;
  }

  const { 
    autoSave = true, 
    validateOnChange = true, 
    debounceDelay = 1000,
    exclude = [] 
  } = options;

  const inputs = formElement.querySelectorAll('input, select, textarea');
  const debounceTimers = new Map();

  inputs.forEach(input => {
    const fieldName = input.id || input.name;
    if (!fieldName || exclude.includes(fieldName)) return;

    // Load initial value from helper
    const currentValue = getNestedValue(helper[section], fieldName);
    if (currentValue !== undefined && currentValue !== input.value) {
      input.value = currentValue;
    }

    // Handle input changes
    const handleChange = () => {
      const value = input.type === 'checkbox' ? input.checked : input.value;
      
      // Validate if enabled
      if (validateOnChange && input.setCustomValidity) {
        if (!input.validity.valid) {
          input.setCustomValidity('שדה זה נדרש או לא תקין');
        } else {
          input.setCustomValidity('');
        }
      }

      // Update helper data
      const updateData = {};
      setNestedValue(updateData, fieldName, value);
      updateHelperWithEvents(section, updateData, `form:${formElement.id || 'unknown'}`);
    };

    // Debounced change handler
    const debouncedChange = () => {
      if (debounceTimers.has(fieldName)) {
        clearTimeout(debounceTimers.get(fieldName));
      }
      
      const timer = setTimeout(() => {
        handleChange();
        debounceTimers.delete(fieldName);
      }, debounceDelay);
      
      debounceTimers.set(fieldName, timer);
    };

    // Attach event listeners
    if (input.type === 'checkbox' || input.type === 'radio') {
      input.addEventListener('change', handleChange);
    } else {
      input.addEventListener('input', debouncedChange);
      input.addEventListener('blur', handleChange); // Immediate save on blur
    }
  });

  // Listen for helper updates to sync form
  const unsubscribe = helperEvents.on(section, (eventData) => {
    inputs.forEach(input => {
      const fieldName = input.id || input.name;
      if (!fieldName || exclude.includes(fieldName)) return;

      const newValue = getNestedValue(eventData.data, fieldName);
      if (newValue !== undefined && newValue !== input.value) {
        input.value = newValue;
      }
    });
  });

  // Return cleanup function
  return () => {
    debounceTimers.forEach(timer => clearTimeout(timer));
    debounceTimers.clear();
    unsubscribe();
  };
}

// Cross-module synchronization
export function setupCrossModuleSync() {
  // Vehicle data synchronization
  helperEvents.on('vehicle', (eventData) => {
    // Sync to car_details and meta sections
    if (eventData.data.plate) {
      updateHelper('meta', { plate: eventData.data.plate });
      updateHelper('car_details', { plate: eventData.data.plate });
    }
    if (eventData.data.manufacturer || eventData.data.model) {
      updateHelper('car_details', {
        manufacturer: eventData.data.manufacturer,
        model: eventData.data.model
      });
    }
  });

  // Car details synchronization
  helperEvents.on('car_details', (eventData) => {
    // Sync to vehicle section
    const vehicleData = {};
    if (eventData.data.plate) vehicleData.plate_number = eventData.data.plate;
    if (eventData.data.manufacturer) vehicleData.manufacturer = eventData.data.manufacturer;
    if (eventData.data.model) vehicleData.model = eventData.data.model;
    if (eventData.data.year) vehicleData.year = eventData.data.year;
    
    if (Object.keys(vehicleData).length > 0) {
      updateHelper('vehicle', vehicleData);
    }
  });

  // Levi data synchronization
  helperEvents.on('levisummary', (eventData) => {
    // Sync to expertise section
    updateHelper('expertise', { levi_report: eventData.data });
    
    // Update vehicle valuation if present
    if (eventData.data.final_price) {
      updateHelper('vehicle', { market_value: eventData.data.final_price });
    }
  });

  // Expertise synchronization
  helperEvents.on('expertise', (eventData) => {
    // Sync Levi data
    if (eventData.data.levi_report) {
      updateHelper('levisummary', eventData.data.levi_report);
    }
    
    // Sync damage blocks
    if (eventData.data.damage_blocks) {
      updateHelper('damage_centers', eventData.data.damage_blocks);
    }
  });

  console.log('Cross-module synchronization enabled');
}

// Storage event handling for cross-tab synchronization
export function setupStorageSync() {
  window.addEventListener('storage', (e) => {
    if (e.key === 'helper_data' && e.newValue) {
      try {
        const newData = JSON.parse(e.newValue);
        
        // Merge new data without overwriting local changes
        Object.keys(newData).forEach(section => {
          if (JSON.stringify(helper[section]) !== JSON.stringify(newData[section])) {
            // Emit update event for each changed section
            helperEvents.emit(section, newData[section], 'storage_sync');
            
            // Update local helper
            helper[section] = newData[section];
          }
        });
        
        console.log('Helper data synchronized from storage');
      } catch (error) {
        console.error('Storage sync error:', error);
      }
    }
  });
}

// Validation system integration
export function validateSection(section, showErrors = false) {
  const validationRules = {
    vehicle: {
      plate_number: { required: true, pattern: /^\d{7,8}$/ },
      manufacturer: { required: true },
      model: { required: true },
      year: { required: true, min: 1980, max: new Date().getFullYear() + 1 }
    },
    client: {
      name: { required: true, minLength: 2 },
      phone_number: { required: true, pattern: /^[\d\-\+\(\)\s]+$/ },
      insurance_company: { required: true }
    },
    meta: {
      case_id: { required: true },
      report_type: { required: true }
    }
  };

  const rules = validationRules[section];
  if (!rules) return { isValid: true, errors: [] };

  const data = helper[section] || {};
  const errors = [];

  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = data[field];

    if (rule.required && (!value || value.toString().trim() === '')) {
      errors.push(`${field} הוא שדה חובה`);
    }

    if (value && rule.pattern && !rule.pattern.test(value.toString())) {
      errors.push(`${field} לא תואם את הפורמט הנדרש`);
    }

    if (value && rule.min && Number(value) < rule.min) {
      errors.push(`${field} חייב להיות לפחות ${rule.min}`);
    }

    if (value && rule.max && Number(value) > rule.max) {
      errors.push(`${field} לא יכול להיות יותר מ ${rule.max}`);
    }

    if (value && rule.minLength && value.toString().length < rule.minLength) {
      errors.push(`${field} חייב להכיל לפחות ${rule.minLength} תווים`);
    }
  });

  if (showErrors && errors.length > 0) {
    alert(`שגיאות בחלק ${section}:\n${errors.join('\n')}`);
  }

  return { isValid: errors.length === 0, errors };
}

// Utility functions
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

// Global helper utilities
export const HelperUtils = {
  // Get all form fields and bind them automatically
  autoBindForms(section) {
    const forms = document.querySelectorAll(`form[data-helper-section="${section}"], .form[data-helper-section="${section}"]`);
    const cleanupFunctions = [];
    
    forms.forEach(form => {
      const cleanup = bindFormToHelper(form, section);
      if (cleanup) cleanupFunctions.push(cleanup);
    });
    
    return () => cleanupFunctions.forEach(cleanup => cleanup());
  },

  // Show validation status
  showValidationStatus(section, containerId = null) {
    const { isValid, errors } = validateSection(section);
    const container = containerId ? document.getElementById(containerId) : document.body;
    
    let statusElement = container.querySelector('.validation-status');
    if (!statusElement) {
      statusElement = document.createElement('div');
      statusElement.className = 'validation-status';
      statusElement.style.cssText = `
        padding: 8px 12px;
        border-radius: 4px;
        margin: 10px 0;
        font-size: 14px;
        font-weight: bold;
      `;
      container.appendChild(statusElement);
    }
    
    if (isValid) {
      statusElement.style.background = '#d4edda';
      statusElement.style.color = '#155724';
      statusElement.textContent = '✅ כל השדות תקינים';
    } else {
      statusElement.style.background = '#f8d7da';
      statusElement.style.color = '#721c24';
      statusElement.innerHTML = `❌ שגיאות: ${errors.join(', ')}`;
    }
  },

  // Create data summary for display
  createDataSummary(sections = []) {
    const summary = {};
    sections.forEach(section => {
      if (helper[section]) {
        summary[section] = { ...helper[section] };
      }
    });
    return summary;
  },

  // Session activity tracking
  keepSessionAlive() {
    updateHelperWithEvents('meta', { 
      last_activity: new Date().toISOString() 
    }, 'session_keep_alive');
  }
};

// Initialize the event system
export function initializeHelperEvents() {
  setupCrossModuleSync();
  setupStorageSync();
  
  // Auto-bind forms on page load
  document.addEventListener('DOMContentLoaded', () => {
    // Look for forms with data-helper-section attribute
    const forms = document.querySelectorAll('[data-helper-section]');
    forms.forEach(form => {
      const section = form.getAttribute('data-helper-section');
      if (section) {
        bindFormToHelper(form, section);
      }
    });
  });
  
  console.log('Helper event system initialized');
}

// Auto-initialize if not already done
if (typeof window !== 'undefined' && !window.helperEventsInitialized) {
  initializeHelperEvents();
  window.helperEventsInitialized = true;
}