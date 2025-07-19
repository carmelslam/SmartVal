// 🧪 Test Helper Data Flow
// This script simulates data flow to help debug why fields aren't being populated

// Function to simulate opening a new case with data
window.testDataFlow = async function() {
  console.log('🧪 Starting helper data flow test...');
  
  // Step 1: Simulate case opening with initial data
  const testCaseData = {
    plate: '1234567',
    owner: 'Test Owner',
    date: '2025-01-19',
    location: 'Test Location'
  };
  
  console.log('📝 Step 1: Simulating case opening with data:', testCaseData);
  
  // Store initial case data
  sessionStorage.setItem('carData', JSON.stringify(testCaseData));
  
  // Step 2: Simulate Make.com webhook response
  const makeComResponse = {
    plate: '1234567',
    manufacturer: 'Toyota',
    model: 'Corolla',
    year: '2020',
    chassis: 'TEST123456789',
    owner: 'Test Owner',
    location: 'Test Location',
    make_com_processed: true
  };
  
  console.log('🌐 Step 2: Simulating Make.com webhook response:', makeComResponse);
  sessionStorage.setItem('makeCarData', JSON.stringify(makeComResponse));
  
  // Step 3: Trigger data processing
  console.log('🔄 Step 3: Triggering data processing...');
  
  if (typeof window.checkForIncomingData === 'function') {
    await window.checkForIncomingData();
  }
  
  // Step 4: Check helper state
  console.log('🔍 Step 4: Checking helper state...');
  
  const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
  console.log('📊 Current helper:', helper);
  
  // Step 5: Check specific fields
  const checkResults = {
    'helper.meta.plate': helper.meta?.plate,
    'helper.vehicle.plate': helper.vehicle?.plate,
    'helper.vehicle.manufacturer': helper.vehicle?.manufacturer,
    'helper.vehicle.model': helper.vehicle?.model,
    'helper.stakeholders.owner.name': helper.stakeholders?.owner?.name
  };
  
  console.log('✅ Field check results:', checkResults);
  
  // Step 6: Try to populate fields
  console.log('🎯 Step 6: Attempting to populate fields...');
  
  if (typeof window.refreshAllModuleForms === 'function') {
    window.refreshAllModuleForms();
  }
  
  // Step 7: Check DOM elements
  console.log('🏷️ Step 7: Checking DOM elements...');
  
  const domCheck = {
    currentPage: window.location.pathname.split('/').pop(),
    inputFields: Array.from(document.querySelectorAll('input[id]')).map(el => ({
      id: el.id,
      value: el.value,
      placeholder: el.placeholder
    }))
  };
  
  console.log('📋 DOM check:', domCheck);
  
  // Step 8: Generate report
  const report = {
    testTime: new Date().toISOString(),
    dataFlowSteps: {
      initialData: !!sessionStorage.getItem('carData'),
      makeCarData: !!sessionStorage.getItem('makeCarData'),
      helperData: !!sessionStorage.getItem('helper'),
      helperPopulated: !!helper.vehicle?.manufacturer
    },
    fieldsPopulated: Object.keys(checkResults).filter(key => checkResults[key]).length,
    totalFields: Object.keys(checkResults).length
  };
  
  console.log('📈 Test Report:', report);
  
  // Return test results
  return {
    success: report.fieldsPopulated > 0,
    report: report,
    checkResults: checkResults,
    helper: helper
  };
};

// Function to clear all test data
window.clearTestData = function() {
  console.log('🧹 Clearing test data...');
  sessionStorage.removeItem('carData');
  sessionStorage.removeItem('makeCarData');
  sessionStorage.removeItem('helper');
  console.log('✅ Test data cleared');
};

// Function to manually populate a specific field
window.testPopulateField = function(fieldId, value) {
  const element = document.getElementById(fieldId);
  if (element) {
    element.value = value;
    console.log(`✅ Field '${fieldId}' populated with '${value}'`);
    
    // Trigger change event
    const event = new Event('change', { bubbles: true });
    element.dispatchEvent(event);
  } else {
    console.error(`❌ Field '${fieldId}' not found in DOM`);
  }
};

// Auto-run diagnostics on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('📊 Helper Data Flow Test Script Loaded');
  console.log('💡 Available commands:');
  console.log('  - testDataFlow() : Run full data flow test');
  console.log('  - clearTestData() : Clear all test data');
  console.log('  - testPopulateField(fieldId, value) : Manually populate a field');
  
  // Check current state
  const currentState = {
    page: window.location.pathname.split('/').pop(),
    hasHelper: !!sessionStorage.getItem('helper'),
    hasMakeCarData: !!sessionStorage.getItem('makeCarData'),
    hasCarData: !!sessionStorage.getItem('carData')
  };
  
  console.log('📍 Current state:', currentState);
});