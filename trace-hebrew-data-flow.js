// 🔍 Hebrew Data Flow Tracer
// This script traces exactly how Hebrew data flows through the system

(function() {
  'use strict';
  
  console.log('🔍 Hebrew Data Flow Tracer Active');
  
  // Override processIncomingData to trace calls
  const originalProcessIncomingData = window.processIncomingData;
  window.processIncomingData = function(data, webhookId) {
    console.log('🔍 TRACE: processIncomingData called with:', {
      webhookId: webhookId,
      dataType: typeof data,
      dataKeys: data ? Object.keys(data) : 'null',
      data: data
    });
    
    if (originalProcessIncomingData) {
      return originalProcessIncomingData.call(this, data, webhookId);
    }
  };
  
  // Monitor helper updates
  const originalUpdateHelper = window.updateHelper;
  window.updateHelper = function(section, data, source) {
    console.log('🔍 TRACE: updateHelper called:', {
      section: section,
      source: source,
      dataKeys: data ? Object.keys(data) : 'null',
      data: data
    });
    
    if (originalUpdateHelper) {
      return originalUpdateHelper.call(this, section, data, source);
    }
  };
  
  // Monitor sessionStorage changes
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    if (key === 'helper' || key === 'makeCarData' || key === 'carData') {
      console.log(`🔍 TRACE: sessionStorage.setItem('${key}') called with:`, {
        valueLength: value ? value.length : 0,
        value: value ? value.substring(0, 200) + '...' : 'null'
      });
      
      // Try to parse and show structure
      try {
        const parsed = JSON.parse(value);
        console.log(`🔍 TRACE: Parsed ${key} structure:`, {
          topLevelKeys: Object.keys(parsed),
          hasVehicle: !!parsed.vehicle,
          hasMeta: !!parsed.meta,
          vehicleKeys: parsed.vehicle ? Object.keys(parsed.vehicle) : [],
          metaKeys: parsed.meta ? Object.keys(parsed.meta) : []
        });
      } catch (e) {
        console.log(`🔍 TRACE: Could not parse ${key}:`, e.message);
      }
    }
    
    return originalSetItem.call(this, key, value);
  };
  
  // Monitor floating screen calls
  const floatingFunctions = ['showCarDetails', 'toggleCarDetails', 'refreshCarData'];
  floatingFunctions.forEach(funcName => {
    const original = window[funcName];
    if (original) {
      window[funcName] = function() {
        console.log(`🔍 TRACE: ${funcName} called`);
        return original.apply(this, arguments);
      };
    }
  });
  
  // Check current state
  console.log('🔍 TRACE: Current sessionStorage state:', {
    helperExists: !!sessionStorage.getItem('helper'),
    makeCarDataExists: !!sessionStorage.getItem('makeCarData'),
    carDataExists: !!sessionStorage.getItem('carData')
  });
  
  // Try to parse current helper
  const currentHelper = sessionStorage.getItem('helper');
  if (currentHelper) {
    try {
      const parsed = JSON.parse(currentHelper);
      console.log('🔍 TRACE: Current helper structure:', {
        topLevelKeys: Object.keys(parsed),
        vehicle: parsed.vehicle,
        meta: parsed.meta,
        car_details: parsed.car_details
      });
    } catch (e) {
      console.log('🔍 TRACE: Could not parse current helper:', e.message);
    }
  }
  
  // Add a test function to simulate Hebrew data
  window.testHebrewDataFlow = function() {
    console.log('🔍 TEST: Simulating Hebrew data flow...');
    
    const hebrewData = {
      plate: '12-345-67',
      manufacturer: 'טויוטה',
      model: 'קורולה',
      year: '2020',
      owner: 'ישראל ישראלי'
    };
    
    console.log('🔍 TEST: Calling processIncomingData with Hebrew data');
    if (window.processIncomingData) {
      window.processIncomingData(hebrewData, 'TEST_HEBREW');
    }
    
    // Check if helper was updated
    setTimeout(() => {
      const helper = sessionStorage.getItem('helper');
      if (helper) {
        const parsed = JSON.parse(helper);
        console.log('🔍 TEST: Helper after Hebrew data:', {
          vehiclePlate: parsed.vehicle?.plate,
          vehicleManufacturer: parsed.vehicle?.manufacturer,
          metaPlate: parsed.meta?.plate
        });
      }
    }, 1000);
  };
  
  console.log('🔍 Use window.testHebrewDataFlow() to test Hebrew data processing');
})();