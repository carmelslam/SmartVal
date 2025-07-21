// 🔧 Helper Initialization Utility - Ensures proper helper system initialization
// Use this in form handlers to prevent data capture failures

console.log('🔧 Loading Helper Initialization Utility...');

/**
 * Safely get or initialize helper data with validation
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} retryDelay - Delay between retries in ms
 * @returns {Promise<Object>} - Promise resolving to helper object
 */
window.safeGetHelper = async function(maxRetries = 5, retryDelay = 200) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const attemptLoad = () => {
      attempts++;
      
      try {
        // First try to get from window.helper (live object)
        if (window.helper && typeof window.helper === 'object' && Object.keys(window.helper).length > 0) {
          console.log(`✅ Helper loaded from window.helper (attempt ${attempts})`);
          resolve(window.helper);
          return;
        }
        
        // Try to get from sessionStorage
        const sessionData = sessionStorage.getItem('helper');
        if (sessionData) {
          try {
            const parsedHelper = JSON.parse(sessionData);
            if (parsedHelper && typeof parsedHelper === 'object' && Object.keys(parsedHelper).length > 0) {
              // Update window.helper
              window.helper = parsedHelper;
              console.log(`✅ Helper loaded from sessionStorage (attempt ${attempts})`);
              resolve(parsedHelper);
              return;
            }
          } catch (parseError) {
            console.warn('Failed to parse helper from sessionStorage:', parseError);
          }
        }
        
        // Try localStorage fallback
        const localData = localStorage.getItem('helper_data');
        if (localData) {
          try {
            const parsedHelper = JSON.parse(localData);
            if (parsedHelper && typeof parsedHelper === 'object' && Object.keys(parsedHelper).length > 0) {
              // Update both window.helper and sessionStorage
              window.helper = parsedHelper;
              sessionStorage.setItem('helper', localData);
              console.log(`✅ Helper recovered from localStorage (attempt ${attempts})`);
              resolve(parsedHelper);
              return;
            }
          } catch (parseError) {
            console.warn('Failed to parse helper from localStorage:', parseError);
          }
        }
        
        // If we've tried all sources and failed, retry if attempts remain
        if (attempts < maxRetries) {
          console.log(`⏳ Helper not ready, retrying... (${attempts}/${maxRetries})`);
          setTimeout(attemptLoad, retryDelay);
        } else {
          // Create minimal helper structure as fallback
          const minimalHelper = createMinimalHelper();
          window.helper = minimalHelper;
          sessionStorage.setItem('helper', JSON.stringify(minimalHelper));
          console.log('⚠️ Created minimal helper structure as fallback');
          resolve(minimalHelper);
        }
        
      } catch (error) {
        console.error('Error during helper initialization:', error);
        if (attempts >= maxRetries) {
          reject(error);
        } else {
          setTimeout(attemptLoad, retryDelay);
        }
      }
    };
    
    attemptLoad();
  });
};

/**
 * Create minimal helper structure for fallback scenarios
 * @returns {Object} - Minimal helper object
 */
function createMinimalHelper() {
  return {
    meta: {
      plate: '',
      case_id: 'YC-UNKNOWN-2025',
      created_at: new Date().toISOString(),
      last_updated: '',
      last_webhook_update: ''
    },
    vehicle: {
      plate: '',
      manufacturer: '',
      model: '',
      year: '',
      chassis: '',
      km: '',
      owner: ''
    },
    stakeholders: {
      owner: { name: '', phone: '', address: '', email: '' },
      garage: { name: '', contact_person: '', phone: '', email: '', address: '' },
      insurance: { company: '', email: '', policy_number: '', claim_number: '', agent: { name: '', phone: '', email: '' } }
    },
    damage_assessment: {
      summary: { total_damage_amount: 0, damage_percentage: 0, is_total_loss: false },
      centers: []
    },
    parts_search: {
      search_history: [],
      all_results: [],
      selected_parts: [],
      unselected_parts: [],
      summary: {}
    },
    system: {
      version: '2.0.0-minimal',
      last_updated: new Date().toISOString(),
      validation_status: {
        vehicle: false,
        damage: false,
        valuation: false,
        financials: false
      }
    }
  };
}

/**
 * Update helper data safely with validation and backup
 * @param {string} section - Section to update (e.g., 'vehicle', 'damage_assessment')
 * @param {Object} data - Data to update
 * @param {string} source - Source module name for tracking
 * @returns {boolean} - Success status
 */
window.safeUpdateHelper = async function(section, data, source = 'unknown') {
  try {
    console.log(`🔄 Safe helper update: ${section} from ${source}`);
    
    // Ensure helper is available
    const helper = await window.safeGetHelper();
    
    // Initialize section if it doesn't exist
    if (!helper[section]) {
      helper[section] = {};
    }
    
    // Update the section
    if (typeof data === 'object' && data !== null) {
      Object.assign(helper[section], data);
    } else {
      helper[section] = data;
    }
    
    // Update metadata
    helper.meta = helper.meta || {};
    helper.meta.last_updated = new Date().toISOString();
    
    // Save to all storage locations
    window.helper = helper;
    sessionStorage.setItem('helper', JSON.stringify(helper));
    localStorage.setItem('helper_data', JSON.stringify(helper));
    
    console.log(`✅ Safe helper update completed: ${section}`);
    
    // Trigger update broadcast if available
    if (typeof window.broadcastHelperUpdate === 'function') {
      window.broadcastHelperUpdate([section], source);
    }
    
    return true;
    
  } catch (error) {
    console.error(`❌ Safe helper update failed for ${section}:`, error);
    return false;
  }
};

/**
 * Validate helper data structure
 * @param {Object} helper - Helper object to validate
 * @returns {Object} - Validation result with isValid boolean and errors array
 */
window.validateHelper = function(helper) {
  const errors = [];
  const warnings = [];
  
  if (!helper || typeof helper !== 'object') {
    errors.push('Helper is not a valid object');
    return { isValid: false, errors, warnings };
  }
  
  // Check essential sections
  const requiredSections = ['meta', 'vehicle', 'stakeholders', 'damage_assessment', 'system'];
  requiredSections.forEach(section => {
    if (!helper[section] || typeof helper[section] !== 'object') {
      warnings.push(`Missing or invalid section: ${section}`);
    }
  });
  
  // Check meta information
  if (helper.meta) {
    if (!helper.meta.case_id) warnings.push('Missing case_id in meta');
    if (!helper.meta.created_at) warnings.push('Missing created_at in meta');
  }
  
  // Check vehicle information
  if (helper.vehicle) {
    if (!helper.vehicle.plate) warnings.push('Missing plate in vehicle data');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Enhanced form submission wrapper that ensures helper integration
 * @param {Function} originalHandler - Original form submission handler
 * @param {string} moduleName - Name of the module for tracking
 * @returns {Function} - Enhanced form handler
 */
window.withHelperIntegration = function(originalHandler, moduleName = 'unknown') {
  return async function(event) {
    console.log(`🔄 Form submission with helper integration: ${moduleName}`);
    
    try {
      // Ensure helper is available before processing
      await window.safeGetHelper();
      
      // Call original handler
      const result = await originalHandler.call(this, event);
      
      // Force refresh forms after successful submission
      if (typeof window.refreshAllModuleForms === 'function') {
        setTimeout(() => window.refreshAllModuleForms(), 200);
      }
      
      console.log(`✅ Form submission completed with helper integration: ${moduleName}`);
      return result;
      
    } catch (error) {
      console.error(`❌ Form submission failed in ${moduleName}:`, error);
      throw error;
    }
  };
};

/**
 * Wait for helper system to be fully loaded
 * @param {number} timeout - Maximum wait time in ms
 * @returns {Promise<boolean>} - Promise resolving to true if helper is loaded
 */
window.waitForHelperSystem = function(timeout = 10000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkHelper = () => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed >= timeout) {
        console.warn('⚠️ Helper system load timeout reached');
        resolve(false);
        return;
      }
      
      if (window.helper && 
          typeof window.processIncomingData === 'function' && 
          typeof window.updateHelper === 'function') {
        console.log('✅ Helper system fully loaded');
        resolve(true);
        return;
      }
      
      setTimeout(checkHelper, 100);
    };
    
    checkHelper();
  });
};

console.log('✅ Helper Initialization Utility loaded successfully');

// Export for ES6 modules
export {
  safeGetHelper,
  safeUpdateHelper,
  validateHelper,
  withHelperIntegration,
  waitForHelperSystem
};