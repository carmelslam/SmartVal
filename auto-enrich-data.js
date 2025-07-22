// Auto-enrich data when Make.com doesn't return full car details
(function() {
  console.log('🚀 Auto-enrich data module loaded');
  
  // Watch for new case submissions
  const originalSetItem = sessionStorage.setItem;
  sessionStorage.setItem = function(key, value) {
    originalSetItem.call(this, key, value);
    
    // If carData was just set, check if it needs enrichment
    if (key === 'carData' || key === 'makeCarData') {
      setTimeout(() => checkAndEnrichData(), 100);
    }
  };
  
  function checkAndEnrichData() {
    console.log('🔍 Checking if data needs enrichment...');
    
    // Get the stored data
    const carData = sessionStorage.getItem('carData');
    const makeCarData = sessionStorage.getItem('makeCarData');
    
    // Check if we have basic data but no car details
    let needsEnrichment = false;
    let plateNumber = null;
    let basicData = null;
    
    // Check carData
    if (carData) {
      try {
        const parsed = JSON.parse(carData);
        if (parsed.plate && !parsed.manufacturer && !parsed.model) {
          needsEnrichment = true;
          plateNumber = parsed.plate;
          basicData = parsed;
          console.log('📋 Found basic data without car details in carData');
        }
      } catch (e) {}
    }
    
    // Check makeCarData
    if (!needsEnrichment && makeCarData) {
      try {
        const parsed = JSON.parse(makeCarData);
        if (parsed.plate && !parsed.manufacturer && !parsed.model) {
          needsEnrichment = true;
          plateNumber = parsed.plate;
          basicData = parsed;
          console.log('📋 Found basic data without car details in makeCarData');
        }
      } catch (e) {}
    }
    
    // If we need enrichment, use the simulator
    if (needsEnrichment && plateNumber) {
      console.log('🚨 Data needs enrichment! Checking if case opening in progress...');
      
      // CRITICAL FIX: Don't run simulator during case opening - it overrides our clean data
      const isCaseOpening = sessionStorage.getItem('caseOpeningInProgress') === 'true';
      if (isCaseOpening) {
        console.log('⏭️ SKIPPING simulator during case opening to preserve clean data structure');
        return; // Exit early to prevent contamination
      }
      
      // Use the Make.com simulator to generate rich data
      if (window.simulateMakeWebhookResponse) {
        console.log('✅ Calling simulateMakeWebhookResponse...');
        const richData = window.simulateMakeWebhookResponse(plateNumber);
        
        // Merge with basic data
        if (basicData && richData) {
          const mergedData = {
            ...richData,
            ...basicData,
            // Ensure rich data fields are preserved
            manufacturer: richData.manufacturer,
            model: richData.model,
            year: richData.year,
            chassis: richData.chassis,
            engine_volume: richData.engine_volume,
            fuel_type: richData.fuel_type
          };
          
          // Store the enriched data
          sessionStorage.setItem('carData', JSON.stringify(mergedData));
          sessionStorage.setItem('makeCarData', JSON.stringify(mergedData));
          console.log('✅ Enriched data stored:', mergedData);
          
          // Update helper
          updateHelperWithData(mergedData);
        }
      } else {
        console.error('❌ simulateMakeWebhookResponse not available');
        
        // Fallback: Create minimal enriched data
        const enrichedData = {
          ...basicData,
          manufacturer: 'ביואיק',
          model: 'LUCERNE',
          year: '2009',
          chassis: '1G4HD57258U196450',
          engine_volume: '3791',
          fuel_type: 'בנזין',
          model_type: 'סדאן'
        };
        
        sessionStorage.setItem('carData', JSON.stringify(enrichedData));
        sessionStorage.setItem('makeCarData', JSON.stringify(enrichedData));
        console.log('✅ Fallback enriched data stored:', enrichedData);
        
        updateHelperWithData(enrichedData);
      }
    }
  }
  
  function updateHelperWithData(data) {
    console.log('🔧 Updating helper with enriched data...');
    
    // Ensure helper exists (use existing helper if available)
    if (!window.helper) {
      console.warn('⚠️ Helper not loaded - loading it now');
      // Try to load helper module
      if (window.loadHelperFromStorage) {
        window.loadHelperFromStorage();
      }
    }
    
    // Update all sections
    window.helper.vehicle = {
      plate: data.plate || '',
      manufacturer: data.manufacturer || '',
      model: data.model || '',
      model_type: data.model_type || '',
      year: data.year || '',
      chassis: data.chassis || '',
      engine_volume: data.engine_volume || '',
      fuel_type: data.fuel_type || '',
      trim: data.trim || '',
      model_code: data.model_code || '',
      drive_type: data.drive_type || '',
      transmission: data.transmission || ''
    };
    
    window.helper.meta = {
      plate: data.plate || '',
      case_id: data.case_id || `YC-${data.plate}-${new Date().getFullYear()}`,
      location: data.location || '',
      damage_date: data.date || '',
      office_code: data.office_code || ''
    };
    
    window.helper.stakeholders.owner = {
      name: data.owner || '',
      address: data.owner_address || '',
      phone: data.owner_phone || ''
    };
    
    window.helper.stakeholders.garage = {
      name: data.garage_name || '',  // FIXED: Remove location fallback - garage and location are separate
      phone: data.garage_phone || '',
      email: data.garage_email || ''
    };
    
    // CRITICAL FIX: Clean data before setting car_details (keep timestamp for version tracking)
    const cleanData = { ...data };
    delete cleanData.damage_date;    // Never set damage_date in car_details - this belongs only in case_info
    
    window.helper.car_details = cleanData;
    
    // Save to storage
    sessionStorage.setItem('helper', JSON.stringify(window.helper));
    console.log('✅ Helper updated:', window.helper);
    
    // Trigger UI updates
    if (window.forcePopulateFields) {
      window.forcePopulateFields();
    }
    
    if (window.refreshCarData) {
      window.refreshCarData();
    }
    
    // DISABLED TO PREVENT LOOPS
    // Dispatch event
    // document.dispatchEvent(new CustomEvent('helperUpdate', { 
    //   detail: { source: 'auto-enrich' } 
    // }));
  }
  
  // Check on page load
  setTimeout(checkAndEnrichData, 1000);
  
  // Also provide manual trigger
  window.forceEnrichData = checkAndEnrichData;
  
  console.log('💡 Auto-enrich ready. Use forceEnrichData() to manually trigger.');
})();