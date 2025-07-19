// 🔧 Direct Fix for Helper Data Flow
// This ensures rich data from Make.com actually populates the helper

(function() {
  console.log('🔧 Helper Data Flow Fix Loaded');
  
  // Override simulateMakeWebhookResponse to ensure data flows to helper
  const originalSimulate = window.simulateMakeWebhookResponse;
  window.simulateMakeWebhookResponse = function(plateNumber = '5785269') {
    console.log('🔧 Intercepting simulateMakeWebhookResponse...');
    
    // Call original function
    if (originalSimulate) {
      originalSimulate(plateNumber);
    }
    
    // Ensure data flows to helper after a short delay
    setTimeout(() => {
      const makeCarData = sessionStorage.getItem('makeCarData');
      if (makeCarData) {
        const data = JSON.parse(makeCarData);
        console.log('🔧 Forcing Make.com data into helper:', data);
        
        // Force update helper with ALL fields
        if (typeof window.helper === 'undefined') {
          window.helper = {};
        }
        
        // Update vehicle section
        if (!window.helper.vehicle) window.helper.vehicle = {};
        window.helper.vehicle = {
          plate: data.plate,
          manufacturer: data.manufacturer,
          model: data.model,
          model_type: data.model_type,
          trim: data.trim,
          year: data.year,
          chassis: data.chassis,
          engine_volume: data.engine_volume,
          fuel_type: data.fuel_type,
          model_code: data.model_code,
          engine_model: data.engine_model,
          drive_type: data.drive_type,
          transmission: data.transmission
        };
        
        // Update meta section
        if (!window.helper.meta) window.helper.meta = {};
        window.helper.meta = {
          plate: data.plate,
          case_id: data.case_id,
          location: data.location,
          office_code: data.office_code,
          registration_date: data.registration_date
        };
        
        // Update stakeholders
        if (!window.helper.stakeholders) window.helper.stakeholders = {};
        window.helper.stakeholders = {
          owner: {
            name: data.owner,
            address: data.owner_address,
            phone: data.owner_phone
          },
          garage: {
            name: data.garage_name,
            phone: data.garage_phone,
            email: data.garage_email
          }
        };
        
        // Update car_details for compatibility
        window.helper.car_details = data;
        
        // Save to sessionStorage
        sessionStorage.setItem('helper', JSON.stringify(window.helper));
        console.log('✅ Helper fully updated:', window.helper);
        
        // Also ensure carData is set
        sessionStorage.setItem('carData', JSON.stringify(data));
        
        // Force populate fields
        if (typeof window.forcePopulateFields === 'function') {
          window.forcePopulateFields();
        }
        
        // Update floating screens
        if (typeof window.refreshCarData === 'function') {
          window.refreshCarData();
        }
      }
    }, 500);
  };
  
  // Function to manually fix empty helper
  window.fixEmptyHelper = function() {
    console.log('🔧 Fixing empty helper...');
    
    // Try to get data from various sources
    let data = null;
    
    // Try makeCarData first
    const makeCarData = sessionStorage.getItem('makeCarData');
    if (makeCarData) {
      data = JSON.parse(makeCarData);
      console.log('📥 Found data in makeCarData');
    }
    
    // Try carData
    if (!data || !data.manufacturer) {
      const carData = sessionStorage.getItem('carData');
      if (carData) {
        try {
          data = JSON.parse(carData);
          console.log('📥 Found data in carData');
        } catch (e) {
          console.error('Error parsing carData:', e);
        }
      }
    }
    
    if (data && data.manufacturer) {
      console.log('🔧 Applying rich data to helper:', data);
      
      // Apply to helper
      window.helper = {
        vehicle: {
          plate: data.plate || '',
          manufacturer: data.manufacturer || '',
          model: data.model || '',
          model_type: data.model_type || '',
          trim: data.trim || '',
          year: data.year || '',
          chassis: data.chassis || '',
          engine_volume: data.engine_volume || '',
          fuel_type: data.fuel_type || '',
          model_code: data.model_code || '',
          engine_model: data.engine_model || '',
          drive_type: data.drive_type || '',
          transmission: data.transmission || ''
        },
        meta: {
          plate: data.plate || '',
          case_id: data.case_id || '',
          location: data.location || '',
          office_code: data.office_code || '',
          registration_date: data.registration_date || ''
        },
        stakeholders: {
          owner: {
            name: data.owner || '',
            address: data.owner_address || '',
            phone: data.owner_phone || ''
          },
          garage: {
            name: data.garage_name || data.location || '',
            phone: data.garage_phone || '',
            email: data.garage_email || ''
          }
        },
        car_details: data,
        case_info: {},
        documents: { images: [] },
        expertise: {},
        damage_assessment: { centers: [] }
      };
      
      // Save to storage
      sessionStorage.setItem('helper', JSON.stringify(window.helper));
      console.log('✅ Helper fixed and saved:', window.helper);
      
      // Populate fields
      if (typeof window.forcePopulateFields === 'function') {
        window.forcePopulateFields();
      }
      
      return true;
    } else {
      console.log('❌ No rich data found to fix helper');
      return false;
    }
  };
  
  // Auto-fix on page load if helper is empty
  setTimeout(() => {
    const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
    if (!helper.vehicle || !helper.vehicle.manufacturer) {
      console.log('🔧 Helper is empty, attempting auto-fix...');
      fixEmptyHelper();
    }
  }, 1000);
  
  console.log('💡 Fix functions available:');
  console.log('  - simulateMakeWebhookResponse() : Now ensures data flows to helper');
  console.log('  - fixEmptyHelper() : Manually fix empty helper from available data');
})();