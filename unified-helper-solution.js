// 🎯 UNIFIED HELPER SOLUTION - ONE SOURCE OF TRUTH
// This replaces ALL duplicate helper initializations across the system

(function() {
  'use strict';
  
  console.log('🎯 Unified Helper Solution Loading...');
  
  // Import the REAL helper from helper.js module
  let helperModule = null;
  let moduleLoaded = false;
  
  // Try to load the helper module
  import('./helper.js').then(module => {
    helperModule = module;
    
    // Make the module helper THE ONLY window.helper
    window.helper = module.helper;
    
    // Load any existing data from storage
    const storedHelper = sessionStorage.getItem('helper');
    if (storedHelper) {
      try {
        const parsed = JSON.parse(storedHelper);
        Object.assign(window.helper, parsed);
        console.log('✅ Loaded helper data from storage');
      } catch (e) {
        console.error('Failed to parse stored helper:', e);
      }
    }
    
    // Make all module functions available globally
    window.updateHelper = module.updateHelper;
    window.processIncomingData = module.processIncomingData;
    window.saveHelperToStorage = module.saveHelperToStorage;
    window.broadcastHelperUpdate = module.broadcastHelperUpdate;
    
    moduleLoaded = true;
    console.log('✅ Helper module loaded and unified');
    
    // Process any pending data
    checkForPendingData();
    
  }).catch(error => {
    console.error('❌ Failed to load helper module:', error);
    // Fallback - create minimal helper if module fails
    createMinimalHelper();
  });
  
  // Check for incoming data from Make.com or URL
  function checkForPendingData() {
    // Check for Make.com data
    const makeCarData = sessionStorage.getItem('makeCarData');
    if (makeCarData && window.processIncomingData) {
      try {
        const data = JSON.parse(makeCarData);
        window.processIncomingData(data, 'stored_make_data');
        sessionStorage.removeItem('makeCarData');
        console.log('✅ Processed stored Make.com data');
      } catch (e) {
        console.error('Failed to process stored data:', e);
      }
    }
    
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('plate') && window.updateHelper) {
      const plate = urlParams.get('plate');
      window.updateHelper('vehicle', { plate }, 'url_params');
      window.updateHelper('meta', { plate }, 'url_params');
      console.log('✅ Processed URL parameters');
    }
  }
  
  // Minimal fallback if module fails to load
  function createMinimalHelper() {
    if (!window.helper) {
      window.helper = {
        vehicle: {},
        meta: {},
        stakeholders: { owner: {}, garage: {}, insurance: { agent: {} } },
        car_details: {},
        case_info: {},
        documents: { images: [] },
        expertise: {},
        damage_assessment: { centers: [] }
      };
      
      // Basic save function
      window.saveHelperToStorage = function() {
        sessionStorage.setItem('helper', JSON.stringify(window.helper));
      };
      
      console.log('⚠️ Created minimal helper fallback');
    }
  }
  
  // Override any attempt to create duplicate helpers
  Object.defineProperty(window, 'helper', {
    get: function() {
      return this._helper;
    },
    set: function(value) {
      if (!this._helper) {
        this._helper = value;
        console.log('✅ Helper initialized');
      } else if (value !== this._helper) {
        console.warn('⚠️ Attempted to create duplicate helper - merging instead');
        Object.assign(this._helper, value);
      }
    },
    configurable: false
  });
  
  // Listen for storage changes from other tabs
  window.addEventListener('storage', function(e) {
    if (e.key === 'helper' && e.newValue && moduleLoaded) {
      try {
        const newData = JSON.parse(e.newValue);
        Object.assign(window.helper, newData);
        console.log('✅ Helper synced from another tab');
      } catch (err) {
        console.error('Failed to sync helper:', err);
      }
    }
  });
  
  console.log('🎯 Unified Helper Solution Ready');
})();