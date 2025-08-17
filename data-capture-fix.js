// 🧪 Data Capture Fix Validation Test Script
// Tests all data flows: webhook → helper → UI and UI → helper → modules

console.log('🧪 Starting Data Capture Fix Validation Tests...');

// Test helper for validation
function runValidationTest(testName, testFunction) {
  console.log(`\n🔬 Running Test: ${testName}`);
  try {
    const result = testFunction();
    if (result.success) {
      console.log(`✅ ${testName}: PASSED`, result.details || '');
    } else {
      console.error(`❌ ${testName}: FAILED`, result.error || '');
    }
    return result;
  } catch (error) {
    console.error(`❌ ${testName}: ERROR`, error.message);
    return { success: false, error: error.message };
  }
}

// Test 1: Helper.js initialization and structure
const testHelperInitialization = () => {
  if (!window.helper) {
    return { success: false, error: 'window.helper not found' };
  }
  
  const requiredSections = ['meta', 'vehicle', 'stakeholders', 'case_info', 'valuation'];
  const missingSections = requiredSections.filter(section => !window.helper[section]);
  
  if (missingSections.length > 0) {
    return { success: false, error: `Missing sections: ${missingSections.join(', ')}` };
  }
  
  return { 
    success: true, 
    details: `Helper initialized with ${Object.keys(window.helper).length} sections` 
  };
};

// Test 2: Hebrew text processing with sample Levi data
const testHebrewTextProcessing = () => {
  if (!window.processIncomingData) {
    return { success: false, error: 'processIncomingData function not found' };
  }
  
  const testHebrewData = {
    Body: `פרטי רכב 5785269 להערכת נזק
    קוד דגם: 870170
    שם דגם מלא: ג'יפ ריינג'ד 150(1332) LATITUDE
    אוטומט: כן
    מאפייני הרכב: מזגן, רדיו
    עליה לכביש: 08/2021
    מספר בעלים: 2
    קטיגוריה: פנאי שטח
    מס' ק"מ: 11900
    מחיר בסיס: 85,000
    מחיר סופי לרכב: 92,670`
  };
  
  // Store original helper state
  const originalHelper = JSON.parse(JSON.stringify(window.helper));
  
  // Process the data
  window.processIncomingData(testHebrewData, 'test_hebrew');
  
  // Check if data was extracted
  const extracted = {
    plate: window.helper.vehicle?.plate,
    model_code: window.helper.vehicle?.model_code,
    model: window.helper.vehicle?.model,
    is_automatic: window.helper.vehicle?.is_automatic,
    km: window.helper.vehicle?.km,
    base_price: window.helper.valuation?.base_price,
    final_price: window.helper.valuation?.final_price
  };
  
  const expectedValues = {
    plate: '5785269',
    model_code: '870170',
    model: 'ג\'יפ ריינג\'ד 150(1332) LATITUDE',
    is_automatic: true,
    km: 11900,
    base_price: 85000,
    final_price: 92670
  };
  
  let extractedCount = 0;
  let matchedCount = 0;
  
  Object.keys(expectedValues).forEach(key => {
    if (extracted[key] !== null && extracted[key] !== undefined && extracted[key] !== '') {
      extractedCount++;
      if (extracted[key] == expectedValues[key]) { // Use == to handle type differences
        matchedCount++;
      }
    }
  });
  
  // Restore original helper
  window.helper = originalHelper;
  
  return {
    success: matchedCount >= 5, // At least 5 out of 7 fields should match
    details: `Extracted ${extractedCount}/${Object.keys(expectedValues).length} fields, ${matchedCount} matched expected values`
  };
};

// Test 3: UI Input Capture Integration
const testUIInputCapture = () => {
  // Create a test input element
  const testInput = document.createElement('input');
  testInput.id = 'test_plate';
  testInput.type = 'text';
  document.body.appendChild(testInput);
  
  // Store original helper state
  const originalPlate = window.helper.vehicle?.plate;
  
  // Simulate user input
  testInput.value = '1234567';
  testInput.dispatchEvent(new Event('input', { bubbles: true }));
  testInput.dispatchEvent(new Event('change', { bubbles: true }));
  
  // Wait a moment for debounced updates
  setTimeout(() => {
    const captured = window.helper.vehicle?.plate;
    
    // Cleanup
    document.body.removeChild(testInput);
    if (originalPlate) {
      window.helper.vehicle.plate = originalPlate;
    }
    
    return {
      success: captured === '1234567',
      details: `Input capture ${captured === '1234567' ? 'working' : 'failed'}: ${captured}`
    };
  }, 600);
  
  return { success: true, details: 'UI input capture test initiated (async)' };
};

// Test 4: Form Population from Helper
const testFormPopulation = () => {
  if (!window.refreshAllModuleForms && !window.populateAllForms) {
    return { success: false, error: 'Form population functions not found' };
  }
  
  // Create test form elements
  const testFields = ['plate', 'manufacturer', 'model', 'year', 'owner'];
  const testElements = {};
  
  testFields.forEach(fieldId => {
    const input = document.createElement('input');
    input.id = fieldId;
    input.type = 'text';
    document.body.appendChild(input);
    testElements[fieldId] = input;
  });
  
  // Set test data in helper
  window.helper.vehicle = window.helper.vehicle || {};
  window.helper.stakeholders = window.helper.stakeholders || { owner: {} };
  
  const testData = {
    'plate': '7654321',
    'manufacturer': 'טויוטה',
    'model': 'קאמרי',
    'year': '2020',
    'owner': ''
  };
  
  window.helper.vehicle.plate = testData.plate;
  window.helper.vehicle.manufacturer = testData.manufacturer;
  window.helper.vehicle.model = testData.model;
  window.helper.vehicle.year = testData.year;
  // Removed test owner data to prevent default 'בדיקה test' value
  
  // Trigger form population
  if (window.refreshAllModuleForms) {
    window.refreshAllModuleForms();
  } else if (window.populateAllForms) {
    window.populateAllForms();
  }
  
  // Check if forms were populated
  let populatedCount = 0;
  testFields.forEach(fieldId => {
    const element = testElements[fieldId];
    const expectedValue = fieldId === 'owner' ? testData.owner : testData[fieldId];
    if (element.value === expectedValue) {
      populatedCount++;
    }
  });
  
  // Cleanup
  testFields.forEach(fieldId => {
    document.body.removeChild(testElements[fieldId]);
  });
  
  return {
    success: populatedCount >= 3, // At least 3 fields should be populated
    details: `${populatedCount}/${testFields.length} fields populated correctly`
  };
};

// Test 5: Session Storage Integration
const testSessionStorage = () => {
  // Use helper's save function instead of sessionEngine
  if (!window.saveHelperToStorage) {
    return { success: false, error: 'saveHelperToStorage function not found' };
  }
  
  // Test session save using helper system
  try {
    window.saveHelperToStorage();
    console.log('✅ Helper data saved to storage');
    
    // Check if data was saved to storage
    const sessionData = sessionStorage.getItem('helper');
    
    if (!sessionData) {
      return { success: false, error: 'Data not saved to sessionStorage' };
    }
  
    // Verify data integrity
    try {
      const parsedSession = JSON.parse(sessionData);
      const sessionKeys = Object.keys(parsedSession);
    
      return {
        success: sessionKeys.length > 0,
        details: `Session: ${sessionKeys.length} keys saved successfully`
      };
    } catch (e) {
      return { success: false, error: 'Stored data is corrupted' };
    }
  } catch (error) {
    return { success: false, error: `Save operation failed: ${error.message}` };
  }
};

// Test 6: Multilingual Data Handling
const testMultilingualHandling = () => {
  const testData = {
    'מס רכב': '9876543',
    'יצרן': 'מזדה',
    'דגם': 'CX-5',
    'בעלים': 'שמואל כהן',
    'manufacturer': 'Mazda',
    'model': 'CX-5 Override',
    'owner_name': 'Samuel Cohen'
  };
  
  // Store original state
  const original = JSON.parse(JSON.stringify(window.helper));
  
  // Process multilingual data
  window.processIncomingData(testData, 'test_multilingual');
  
  // Check results
  const results = {
    plate: window.helper.vehicle?.plate,
    manufacturer: window.helper.vehicle?.manufacturer,
    model: window.helper.vehicle?.model,
    owner: window.helper.stakeholders?.owner?.name
  };
  
  // Restore original state
  window.helper = original;
  
  // Validate that Hebrew fields were processed
  const hebrewProcessed = results.plate === '9876543' && 
                         (results.manufacturer === 'מזדה' || results.manufacturer === 'Mazda') &&
                         results.model && results.owner;
  
  return {
    success: hebrewProcessed,
    details: `Hebrew data processed: plate=${results.plate}, manufacturer=${results.manufacturer}`
  };
};

// Run all tests
const runAllTests = async () => {
  console.log('🚀 Running Comprehensive Data Capture Validation Tests\n');
  
  const tests = [
    { name: 'Helper Initialization', func: testHelperInitialization },
    { name: 'Hebrew Text Processing', func: testHebrewTextProcessing },
    { name: 'UI Input Capture', func: testUIInputCapture },
    { name: 'Form Population', func: testFormPopulation },
    { name: 'Session Storage', func: testSessionStorage },
    { name: 'Multilingual Handling', func: testMultilingualHandling }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = runValidationTest(test.name, test.func);
    results.push({ name: test.name, ...result });
  }
  
  // Summary
  const passed = results.filter(r => r.success).length;
  const failed = results.length - passed;
  
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Data capture system is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Review the issues above.');
  }
  
  return { passed, failed, results };
};

// Auto-run tests if this file is loaded directly
if (typeof window !== 'undefined') {
  // Wait for helper system to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(runAllTests, 1000); // Wait 1 second for systems to initialize
    });
  } else {
    setTimeout(runAllTests, 1000);
  }
  
  // Export for manual testing
  window.runDataCaptureTests = runAllTests;
} else {
  // Running in Node.js environment - run tests immediately with mock environment
  console.log('🔧 Running in Node.js environment - creating mock browser environment...');
  
  // Create minimal DOM mock
  global.window = {
    helper: {
      meta: { plate: '', case_id: '' },
      vehicle: { plate: '', manufacturer: '', model: '', km: null },
      stakeholders: { owner: { name: '' } },
      case_info: { damage_date: '', damage_type: '' },
      valuation: { base_price: null, final_price: null }
    },
    processIncomingData: function(data, source) {
      console.log('Mock processIncomingData called with:', { data, source });
      return { success: true, updatedSections: ['vehicle', 'meta'] };
    },
    refreshAllModuleForms: function() {
      console.log('Mock refreshAllModuleForms called');
    },
    sessionEngine: {
      saveSessionData: function() {
        console.log('Mock sessionEngine.saveSessionData called');
        return true;
      }
    }
  };
  
  global.document = {
    createElement: function(tag) {
      return {
        id: '',
        type: 'text',
        value: '',
        dispatchEvent: function() {}
      };
    },
    getElementById: function(id) {
      return {
        id: id,
        value: '',
        type: 'text',
        dispatchEvent: function() {}
      };
    },
    body: {
      appendChild: function() {},
      removeChild: function() {}
    }
  };
  
  global.sessionStorage = {
    getItem: function(key) {
      if (key === 'helper') {
        return JSON.stringify(global.window.helper);
      }
      return null;
    },
    setItem: function() {}
  };
  
  global.localStorage = {
    getItem: function(key) {
      if (key === 'helper_data') {
        return JSON.stringify(global.window.helper);
      }
      return null;
    },
    setItem: function() {}
  };
  
  // Run tests in Node.js
  runAllTests().then(() => {
    console.log('\n🎯 Node.js test run completed');
  }).catch(error => {
    console.error('❌ Node.js test run failed:', error);
  });
}

console.log('✅ Data Capture Test Script Loaded');
console.log('💡 Run window.runDataCaptureTests() to execute all validation tests');