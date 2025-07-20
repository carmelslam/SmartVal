// 🚀 Helper Initialization Module
// This ensures helper system UI functions work properly
// IMPORTANT: This no longer creates window.helper - that's done by helper.js

(function() {
  console.log('🚀 Helper UI initialization starting...');
  
  // Core initialization function
  function initializeHelperUI() {
    console.log('🔧 Initializing helper UI functions...');
    
    // Wait for helper.js to load
    if (!window.helper || !window.updateHelper) {
      console.log('⏳ Waiting for helper.js to load...');
      setTimeout(initializeHelperUI, 100);
      return;
    }
    
    console.log('✅ Helper detected, initializing UI functions');
    
    // 1. Check for incoming data immediately
    checkForIncomingDataSync();
    
    // 2. Set up storage listeners
    setupStorageListeners();
    
    // 3. Set up global functions
    setupGlobalFunctions();
    
    console.log('✅ Helper UI system initialized');
  }
  
  // Synchronous data check (no async/await)
  function checkForIncomingDataSync() {
    console.log('🔍 Checking for incoming data (sync)...');
    
    // Check makeCarData
    const makeCarData = sessionStorage.getItem('makeCarData');
    if (makeCarData) {
      try {
        const data = JSON.parse(makeCarData);
        console.log('📥 Found Make.com data:', data);
        
        // Use the global processIncomingData from helper.js
        if (window.processIncomingData) {
          window.processIncomingData(data, 'make_car_data');
        }
        
        // Don't remove it yet - let other modules read it
        setTimeout(() => {
          sessionStorage.removeItem('makeCarData');
        }, 5000);
      } catch (e) {
        console.error('Error processing makeCarData:', e);
      }
    }
    
    // Check legacy carData
    const carData = sessionStorage.getItem('carData');
    if (carData) {
      try {
        const data = JSON.parse(carData);
        if (data.plate || data.owner) {
          console.log('📥 Found legacy car data:', data);
          processLegacyData(data);
        }
      } catch (e) {
        console.error('Error processing carData:', e);
      }
    }
    
    // Check URL parameters
    checkUrlParameters();
  }
  
  // Process legacy data format
  function processLegacyData(data) {
    if (!window.updateHelper) return;
    
    const updates = {};
    
    if (data.plate) {
      updates.plate = data.plate;
    }
    if (data.manufacturer) {
      updates.manufacturer = data.manufacturer;
    }
    if (data.model) {
      updates.model = data.model;
    }
    if (data.year) {
      updates.year = data.year;
    }
    
    // Update vehicle data
    if (Object.keys(updates).length > 0) {
      window.updateHelper('vehicle', updates, 'legacy_data');
    }
    
    // Update stakeholder data
    if (data.owner) {
      window.updateHelper('stakeholders', { owner: { name: data.owner } }, 'legacy_data');
    }
    
    // Update meta data
    if (data.location || data.date) {
      const metaUpdates = {};
      if (data.location) metaUpdates.location = data.location;
      if (data.date) metaUpdates.damage_date = data.date;
      window.updateHelper('meta', metaUpdates, 'legacy_data');
    }
    
    populateCurrentPageFields();
  }
  
  // Check URL parameters
  function checkUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    const vehicleUpdates = {};
    const stakeholderUpdates = {};
    
    ['plate', 'manufacturer', 'model', 'year'].forEach(param => {
      const value = params.get(param) || hashParams.get(param);
      if (value) {
        vehicleUpdates[param] = value;
      }
    });
    
    const owner = params.get('owner') || hashParams.get('owner');
    if (owner) {
      stakeholderUpdates.owner = { name: owner };
    }
    
    // Update helper with URL data
    if (Object.keys(vehicleUpdates).length > 0 && window.updateHelper) {
      window.updateHelper('vehicle', vehicleUpdates, 'url_params');
    }
    
    if (Object.keys(stakeholderUpdates).length > 0 && window.updateHelper) {
      window.updateHelper('stakeholders', stakeholderUpdates, 'url_params');
    }
    
    if ((Object.keys(vehicleUpdates).length > 0 || Object.keys(stakeholderUpdates).length > 0)) {
      console.log('📥 Found URL parameters, populated');
      populateCurrentPageFields();
    }
  }
  
  // Populate form fields on current page
  function populateCurrentPageFields() {
    console.log('🔄 Populating current page fields...');
    
    if (!window.helper) {
      console.warn('Helper not available yet');
      return;
    }
    
    // Field mappings
    const fieldMappings = {
      'plate': window.helper.vehicle?.plate || window.helper.meta?.plate,
      'plateNumber': window.helper.vehicle?.plate || window.helper.meta?.plate,
      'owner': window.helper.stakeholders?.owner?.name,
      'manufacturer': window.helper.vehicle?.manufacturer,
      'make': window.helper.vehicle?.manufacturer,
      'model': window.helper.vehicle?.model,
      'year': window.helper.vehicle?.year,
      'chassis': window.helper.vehicle?.chassis,
      'location': window.helper.meta?.location,
      'date': window.helper.meta?.damage_date,
      'garageName': window.helper.stakeholders?.garage?.name,
      'garagePhone': window.helper.stakeholders?.garage?.phone,
      'insuranceCompany': window.helper.stakeholders?.insurance?.company,
      'agentName': window.helper.stakeholders?.insurance?.agent?.name
    };
    
    // Populate fields
    let fieldsPopulated = 0;
    Object.entries(fieldMappings).forEach(([fieldId, value]) => {
      if (value) {
        const element = document.getElementById(fieldId);
        if (element && !element.value) {
          element.value = value;
          fieldsPopulated++;
          console.log(`✅ Populated ${fieldId}: ${value}`);
        }
      }
    });
    
    if (fieldsPopulated > 0) {
      console.log(`✅ Populated ${fieldsPopulated} fields`);
    }
    
    // Also update floating screens if they exist
    updateFloatingScreens();
  }
  
  // Update floating screens
  function updateFloatingScreens() {
    // Update car details floating screen
    if (typeof window.refreshCarData === 'function') {
      window.refreshCarData();
    }
    
    // Ensure currentCaseData is updated
    window.currentCaseData = window.helper;
    sessionStorage.setItem('currentCaseData', JSON.stringify(window.helper));
  }
  
  // Set up storage listeners
  function setupStorageListeners() {
    window.addEventListener('storage', function(e) {
      if (e.key === 'makeCarData' && e.newValue) {
        console.log('📥 Detected makeCarData change from another tab');
        try {
          const data = JSON.parse(e.newValue);
          if (window.processIncomingData) {
            window.processIncomingData(data, 'storage_event');
          }
        } catch (err) {
          console.error('Error processing storage event:', err);
        }
      }
    });
  }
  
  // Set up global functions
  function setupGlobalFunctions() {
    // Make functions globally available
    window.forcePopulateFields = populateCurrentPageFields;
    
    window.forceCaptureFormData = function() {
      console.log('🔄 Force capturing form data...');
      const formData = {};
      
      // Capture all input fields
      document.querySelectorAll('input[id], select[id], textarea[id]').forEach(element => {
        if (element.value) {
          formData[element.id] = element.value;
        }
      });
      
      console.log('📋 Captured form data:', formData);
      
      // Process the captured data
      if (formData.plate || formData.plateNumber) {
        const plate = formData.plate || formData.plateNumber;
        if (window.updateHelper) {
          window.updateHelper('vehicle', { plate }, 'form_capture');
          window.updateHelper('meta', { plate }, 'form_capture');
        }
      }
      
      return formData;
    };
    
    window.ensureFloatingScreenData = function() {
      console.log('🔄 Ensuring floating screen data...');
      
      // Make sure carData exists for floating screens
      if (window.helper && window.helper.vehicle) {
        const carData = {
          plate: window.helper.vehicle.plate || window.helper.meta?.plate || '',
          manufacturer: window.helper.vehicle.manufacturer || '',
          model: window.helper.vehicle.model || '',
          year: window.helper.vehicle.year || '',
          owner: window.helper.stakeholders?.owner?.name || ''
        };
        
        sessionStorage.setItem('carData', JSON.stringify(carData));
        console.log('✅ Updated carData for floating screens:', carData);
      }
      
      updateFloatingScreens();
    };
    
    console.log('✅ Global functions registered');
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHelperUI);
  } else {
    initializeHelperUI();
  }
  
})();