// Universal Data Sync - Ensures data flows to all UI components
(function() {
  console.log('🔄 Universal Data Sync Module loaded');
  
  // Global sync debouncer
  let syncTimeout = null;
  
  // Watch for helper updates and sync to all expected locations
  const originalSetItem = sessionStorage.setItem;
  sessionStorage.setItem = function(key, value) {
    originalSetItem.call(this, key, value);
    
    // If helper was updated, sync data everywhere with debouncing
    if (key === 'helper') {
      if (syncTimeout) {
        clearTimeout(syncTimeout);
      }
      syncTimeout = setTimeout(syncHelperDataEverywhere, 100);
    }
  };
  
  function syncHelperDataEverywhere() {
    console.log('🔄 Syncing helper data everywhere...');
    
    try {
      const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
      
      // Create currentCaseData in the format floating screens expect
      const currentCaseData = {
        vehicle: helper.vehicle || {},
        car_details: {
          ...helper.car_details,
          ...helper.vehicle, // Merge vehicle data
          owner: helper.stakeholders?.owner?.name || '',
          ownerPhone: helper.stakeholders?.owner?.phone || '',
          ownerAddress: helper.stakeholders?.owner?.address || '',
          garageName: helper.stakeholders?.garage?.name || '',
          garagePhone: helper.stakeholders?.garage?.phone || '',
          insuranceCompany: helper.stakeholders?.insurance?.company || '',
          agentName: helper.stakeholders?.insurance?.agent?.name || '',
          agentPhone: helper.stakeholders?.insurance?.agent?.phone || ''
        },
        stakeholders: {
          ...helper.stakeholders,
          owner_name: helper.stakeholders?.owner?.name || '', // Add legacy field
          insurance_agent: helper.stakeholders?.insurance?.agent?.name || '',
          insurance_agent_phone: helper.stakeholders?.insurance?.agent?.phone || ''
        },
        meta: {
          ...helper.meta,
          damage_date: helper.meta?.damage_date || helper.car_details?.date || ''
        }
      };
      
      // Store in all expected locations
      sessionStorage.setItem('currentCaseData', JSON.stringify(currentCaseData));
      window.currentCaseData = currentCaseData;
      
      // Also ensure carData has the latest info for legacy components
      const carData = {
        plate: helper.vehicle?.plate || helper.meta?.plate || '',
        owner: helper.stakeholders?.owner?.name || '',
        manufacturer: helper.vehicle?.manufacturer || '',
        model: helper.vehicle?.model || '',
        year: helper.vehicle?.year || '',
        chassis: helper.vehicle?.chassis || '',
        engine_volume: helper.vehicle?.engine_volume || '',
        fuel_type: helper.vehicle?.fuel_type || '',
        location: helper.meta?.location || '',
        date: helper.meta?.damage_date || '',
        // Add all other fields from vehicle
        ...helper.vehicle,
        // Add translated fields
        'מספר רכב': helper.vehicle?.plate || helper.meta?.plate || '',
        'שם היצרן': helper.vehicle?.manufacturer || '',
        'דגם': helper.vehicle?.model || '',
        'שנת ייצור': helper.vehicle?.year || '',
        'מספר שילדה': helper.vehicle?.chassis || '',
        'נפח מנוע': helper.vehicle?.engine_volume || '',
        'סוג דלק': helper.vehicle?.fuel_type || '',
        'בעל הרכב': helper.stakeholders?.owner?.name || '',
        'מוסך': helper.stakeholders?.garage?.name || ''
      };
      
      sessionStorage.setItem('carData', JSON.stringify(carData));
      
      console.log('✅ Data synced to all locations');
      console.log('  currentCaseData:', currentCaseData);
      console.log('  carData:', carData);
      
      // Trigger UI updates
      refreshAllUIComponents();
      
    } catch (e) {
      console.error('Error syncing data:', e);
    }
  }
  
  function refreshAllUIComponents() {
    // Refresh floating car details
    if (typeof window.refreshCarData === 'function') {
      window.refreshCarData();
    }
    
    // DISABLED TO PREVENT LOOPS
    // Refresh floating levi
    // if (typeof window.refreshLeviData === 'function') {
    //   window.refreshLeviData();
    // }
    
    // Populate form fields
    if (typeof window.forcePopulateFields === 'function') {
      window.forcePopulateFields();
    }
    
    // DISABLED TO PREVENT LOOPS
    // Broadcast helper update event
    // document.dispatchEvent(new CustomEvent('helperUpdate', { 
    //   detail: { source: 'universal-sync' } 
    // }));
  }
  
  // Function to manually trigger sync
  window.syncAllData = function() {
    console.log('🔄 Manual sync triggered');
    syncHelperDataEverywhere();
  };
  
  // Sync on page load
  setTimeout(() => {
    syncHelperDataEverywhere();
  }, 1000);
  
  // Also sync when helper is updated via updateHelper
  const originalUpdateHelper = window.updateHelper;
  if (originalUpdateHelper) {
    window.updateHelper = function(...args) {
      const result = originalUpdateHelper.apply(this, args);
      setTimeout(syncHelperDataEverywhere, 100);
      return result;
    };
  }
  
  console.log('💡 Universal sync ready. Use syncAllData() to manually sync.');
})();