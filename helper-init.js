// 🚀 Helper Initialization Module
// This ensures helper system is properly initialized on all pages

(function() {
  console.log('🚀 Helper initialization starting...');
  
  // Check if we're in a module context or global context
  const isModule = typeof module !== 'undefined' && module.exports;
  
  // Core initialization function
  function initializeHelperSystem() {
    console.log('🔧 Initializing helper system...');
    
    // 1. Ensure helper exists in window
    if (typeof window.helper === 'undefined') {
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
      console.log('✅ Created new helper structure');
    }
    
    // 2. Load helper from storage if available
    const storedHelper = sessionStorage.getItem('helper');
    if (storedHelper) {
      try {
        const parsed = JSON.parse(storedHelper);
        Object.assign(window.helper, parsed);
        console.log('✅ Loaded helper from storage:', window.helper);
      } catch (e) {
        console.error('❌ Failed to parse stored helper:', e);
      }
    }
    
    // 3. Check for incoming data immediately
    checkForIncomingDataSync();
    
    // 4. Set up storage listeners
    setupStorageListeners();
    
    // 5. Set up global functions
    setupGlobalFunctions();
    
    console.log('✅ Helper system initialized');
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
        processWebhookData(data);
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
  
  // Process webhook data with Hebrew translation
  function processWebhookData(data) {
    console.log('🔄 Processing webhook data...');
    
    // Hebrew to English field mapping
    const hebrewMap = {
      'מספר_רכב': 'plate',
      'מס_רכב': 'plate',
      'יצרן': 'manufacturer',
      'שם_היצרן': 'manufacturer',
      'דגם': 'model',
      'שנת_יצור': 'year',
      'מספר_שלדה': 'chassis',
      'נפח_מנוע': 'engine_volume',
      'סוג_דלק': 'fuel_type',
      'בעל_הרכב': 'owner',
      'שם_בעל_הרכב': 'owner'
    };
    
    // Translate Hebrew fields
    const translated = {};
    Object.keys(data).forEach(key => {
      const englishKey = hebrewMap[key] || key;
      translated[englishKey] = data[key];
    });
    
    // Update helper
    if (translated.plate) {
      window.helper.vehicle.plate = translated.plate;
      window.helper.meta.plate = translated.plate;
    }
    
    // Update vehicle fields
    ['manufacturer', 'model', 'year', 'chassis', 'engine_volume', 'fuel_type'].forEach(field => {
      if (translated[field]) {
        window.helper.vehicle[field] = translated[field];
      }
    });
    
    // Update owner
    if (translated.owner) {
      window.helper.stakeholders.owner.name = translated.owner;
    }
    
    // Save to storage
    saveHelper();
    
    // Trigger population
    populateCurrentPageFields();
  }
  
  // Process legacy data format
  function processLegacyData(data) {
    if (data.plate) {
      window.helper.vehicle.plate = data.plate;
      window.helper.meta.plate = data.plate;
    }
    if (data.owner) {
      window.helper.stakeholders.owner.name = data.owner;
    }
    if (data.location) {
      window.helper.meta.location = data.location;
    }
    if (data.date) {
      window.helper.meta.damage_date = data.date;
    }
    
    saveHelper();
    populateCurrentPageFields();
  }
  
  // Check URL parameters
  function checkUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    let hasData = false;
    
    ['plate', 'manufacturer', 'model', 'year', 'owner'].forEach(param => {
      const value = params.get(param) || hashParams.get(param);
      if (value) {
        hasData = true;
        if (param === 'plate') {
          window.helper.vehicle.plate = value;
          window.helper.meta.plate = value;
        } else if (param === 'owner') {
          window.helper.stakeholders.owner.name = value;
        } else {
          window.helper.vehicle[param] = value;
        }
      }
    });
    
    if (hasData) {
      console.log('📥 Found URL parameters, saving...');
      saveHelper();
      populateCurrentPageFields();
    }
  }
  
  // Save helper to storage
  function saveHelper() {
    sessionStorage.setItem('helper', JSON.stringify(window.helper));
    console.log('💾 Helper saved to storage');
  }
  
  // Populate fields on current page
  function populateCurrentPageFields() {
    console.log('🎯 Attempting to populate fields...');
    
    const fieldMappings = {
      // Common field IDs across different pages
      'plate': window.helper.vehicle?.plate || window.helper.meta?.plate,
      'plateNumber': window.helper.vehicle?.plate || window.helper.meta?.plate,
      'owner': window.helper.stakeholders?.owner?.name,
      'manufacturer': window.helper.vehicle?.manufacturer,
      'make': window.helper.vehicle?.manufacturer,
      'model': window.helper.vehicle?.model,
      'year': window.helper.vehicle?.year,
      'chassis': window.helper.vehicle?.chassis,
      'chassisNumber': window.helper.vehicle?.chassis,
      'engineVolume': window.helper.vehicle?.engine_volume,
      'engineModel': window.helper.vehicle?.engine_model,
      'fuelType': window.helper.vehicle?.fuel_type,
      'ownerPhone': window.helper.stakeholders?.owner?.phone,
      'ownerAddress': window.helper.stakeholders?.owner?.address,
      'garageName': window.helper.stakeholders?.garage?.name,
      'garagePhone': window.helper.stakeholders?.garage?.phone,
      'location': window.helper.meta?.location,
      'damageDate': window.helper.meta?.damage_date,
      'odo': window.helper.vehicle?.km
    };
    
    let populated = 0;
    Object.keys(fieldMappings).forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element && fieldMappings[fieldId]) {
        element.value = fieldMappings[fieldId];
        populated++;
        console.log(`✅ Populated ${fieldId}: ${fieldMappings[fieldId]}`);
      }
    });
    
    console.log(`📊 Populated ${populated} fields`);
    
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
  
  // Set up storage event listeners
  function setupStorageListeners() {
    window.addEventListener('storage', function(e) {
      if (e.key === 'makeCarData' && e.newValue) {
        console.log('📡 Storage event: makeCarData updated');
        try {
          const data = JSON.parse(e.newValue);
          processWebhookData(data);
        } catch (err) {
          console.error('Error processing storage event:', err);
        }
      }
    });
    
    // Also listen for custom events
    document.addEventListener('helperUpdate', function(e) {
      console.log('📡 Helper update event received');
      populateCurrentPageFields();
    });
  }
  
  // Set up global functions
  function setupGlobalFunctions() {
    // Make functions globally available
    window.forcePopulateFields = populateCurrentPageFields;
    window.forceCaptureFormData = function() {
      const data = {};
      document.querySelectorAll('input[id], select[id]').forEach(el => {
        if (el.value) data[el.id] = el.value;
      });
      console.log('📝 Captured form data:', data);
      return data;
    };
    
    window.ensureFloatingScreenData = function() {
      window.currentCaseData = window.helper;
      sessionStorage.setItem('currentCaseData', JSON.stringify(window.helper));
      updateFloatingScreens();
    };
    
    console.log('✅ Global functions registered');
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHelperSystem);
  } else {
    // DOM already loaded
    initializeHelperSystem();
  }
  
  // Also initialize immediately for early data capture
  initializeHelperSystem();
  
})();