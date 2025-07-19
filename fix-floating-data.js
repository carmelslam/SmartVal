// 🔧 Fix Floating Screen Data Display
// This script ensures floating screens can access and display helper data

(function() {
  console.log('🔧 Floating Data Fix Script Loaded');
  
  // Function to ensure helper data is accessible to floating screens
  window.ensureFloatingScreenData = function() {
    console.log('🔄 Ensuring floating screen data is accessible...');
    
    // Get helper data
    const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
    
    // Make sure window.currentCaseData exists and is updated
    if (helper && Object.keys(helper).length > 0) {
      window.currentCaseData = {
        meta: helper.meta || {},
        vehicle: helper.vehicle || {},
        car_details: helper.car_details || {},
        stakeholders: helper.stakeholders || {},
        case_info: helper.case_info || {}
      };
      
      console.log('✅ Updated window.currentCaseData:', window.currentCaseData);
      
      // Also store in sessionStorage for persistence
      sessionStorage.setItem('currentCaseData', JSON.stringify(window.currentCaseData));
    }
    
    // If we have carData but no helper, convert it
    const carData = sessionStorage.getItem('carData');
    if (carData && !helper.vehicle) {
      try {
        const parsedCarData = JSON.parse(carData);
        console.log('📋 Converting legacy carData to helper format...');
        
        // Update helper with carData
        if (!helper.vehicle) helper.vehicle = {};
        if (!helper.meta) helper.meta = {};
        if (!helper.stakeholders) helper.stakeholders = { owner: {} };
        
        if (parsedCarData.plate) {
          helper.vehicle.plate = parsedCarData.plate;
          helper.meta.plate = parsedCarData.plate;
        }
        
        if (parsedCarData.owner) {
          helper.stakeholders.owner.name = parsedCarData.owner;
        }
        
        if (parsedCarData.location) {
          helper.meta.location = parsedCarData.location;
        }
        
        if (parsedCarData.date) {
          helper.meta.damage_date = parsedCarData.date;
        }
        
        // Save updated helper
        sessionStorage.setItem('helper', JSON.stringify(helper));
        
        // Update currentCaseData
        window.currentCaseData = helper;
        sessionStorage.setItem('currentCaseData', JSON.stringify(helper));
        
        console.log('✅ Converted carData to helper format');
      } catch (e) {
        console.error('Error converting carData:', e);
      }
    }
  };
  
  // Function to force refresh floating screens
  window.forceRefreshFloatingScreens = function() {
    console.log('🔄 Force refreshing all floating screens...');
    
    // Ensure data is available
    ensureFloatingScreenData();
    
    // Refresh car details
    if (typeof window.refreshCarData === 'function') {
      window.refreshCarData();
    }
    
    // Show car details if hidden
    if (typeof window.showCarDetails === 'function') {
      window.showCarDetails();
    }
    
    // Refresh other floating screens
    const floatingRefreshFunctions = [
      'refreshLeviData',
      'refreshPartsData',
      'refreshInvoiceData'
    ];
    
    floatingRefreshFunctions.forEach(funcName => {
      if (typeof window[funcName] === 'function') {
        window[funcName]();
      }
    });
  };
  
  // Auto-ensure data on page load
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
      ensureFloatingScreenData();
    }, 1000);
  });
  
  // Listen for helper updates
  document.addEventListener('helperUpdate', function(event) {
    console.log('📡 Helper update detected, refreshing floating screen data...');
    ensureFloatingScreenData();
  });
  
  // Override showCarDetails to ensure data is available
  const originalShowCarDetails = window.showCarDetails;
  window.showCarDetails = function() {
    ensureFloatingScreenData();
    if (originalShowCarDetails) {
      originalShowCarDetails();
    }
  };
  
  console.log('💡 Floating data fix functions available:');
  console.log('  - ensureFloatingScreenData() : Ensure helper data is accessible');
  console.log('  - forceRefreshFloatingScreens() : Force refresh all floating screens');
})();