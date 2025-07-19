// Data Flow Validation Test
// This script helps test and validate the Hebrew data flow from Make.com

(function() {
  console.log('🧪 Data Flow Validation Test loaded');
  
  // Test Hebrew text parsing
  window.testHebrewParsing = function() {
    console.log('🧪 Testing Hebrew text parsing...');
    
    // Sample Hebrew text similar to what Make.com sends
    const sampleHebrewText = `פרטי רכב: 12-345-67
שם היצרן: טויוטה
דגם: קורולה
שנת ייצור: 2020
מספר שילדה: ABC123456789
סוג דלק: בנזין
קילומטראז': 45000
שם בעל הרכב: ישראל ישראלי
סוג בעלות: פרטית
מוסך: מוסך השלום
מיקום: תל אביב`;
    
    // Test the parsing function
    if (typeof window.parseHebrewTextToObject === 'function') {
      const parsed = window.parseHebrewTextToObject(sampleHebrewText);
      console.log('✅ Parsed result:', parsed);
      
      // Validate parsed fields
      const expectedFields = ['plate', 'manufacturer', 'model', 'year', 'chassis', 'fuel_type', 'km', 'owner', 'ownership_type', 'garage_name', 'location'];
      const missingFields = expectedFields.filter(field => !parsed[field]);
      
      if (missingFields.length === 0) {
        console.log('✅ All expected fields parsed successfully!');
      } else {
        console.warn('⚠️ Missing fields:', missingFields);
      }
      
      return parsed;
    } else {
      console.error('❌ parseHebrewTextToObject function not found!');
      return null;
    }
  };
  
  // Test complete data flow
  window.testCompleteDataFlow = function() {
    console.log('🧪 Testing complete data flow...');
    
    // Step 1: Parse Hebrew text
    const parsedData = testHebrewParsing();
    if (!parsedData) return;
    
    // Step 2: Process through processCarDetailsData
    if (typeof window.processCarDetailsData === 'function') {
      console.log('📊 Processing parsed data through processCarDetailsData...');
      window.processCarDetailsData(parsedData, 'test');
      
      // Step 3: Verify helper was updated
      const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
      console.log('📊 Helper after processing:', {
        meta: helper.meta,
        vehicle: helper.vehicle,
        stakeholders: helper.stakeholders
      });
      
      // Step 4: Check specific fields
      console.log('🔍 Field verification:');
      console.log('  - Plate in meta:', helper.meta?.plate);
      console.log('  - Plate in vehicle:', helper.vehicle?.plate);
      console.log('  - Manufacturer:', helper.vehicle?.manufacturer);
      console.log('  - Model:', helper.vehicle?.model);
      console.log('  - Year:', helper.vehicle?.year);
      console.log('  - Owner:', helper.stakeholders?.owner?.name);
      
      // Step 5: Trigger UI refresh
      if (typeof window.refreshCarData === 'function') {
        console.log('🔄 Refreshing car details display...');
        window.refreshCarData();
      }
      
      return helper;
    } else {
      console.error('❌ processCarDetailsData function not found!');
    }
  };
  
  // Test Make.com webhook response format
  window.testMakeWebhookFormat = function() {
    console.log('🧪 Testing Make.com webhook response format...');
    
    // Simulate Make.com response with Hebrew text in Body field
    const makeResponse = {
      Body: `פרטי רכב: 98-765-43
שם היצרן: מזדה
דגם: CX-5
שנת ייצור: 2022
מספר שילדה: XYZ987654321
סוג דלק: דיזל
קילומטראז': 15000
שם בעל הרכב: רחל כהן
סוג בעלות: ליסינג
מוסך: מוסך המרכז
מיקום: ירושלים`
    };
    
    // Test processIncomingData
    if (typeof window.processIncomingData === 'function') {
      console.log('📥 Testing processIncomingData with Make.com format...');
      const result = window.processIncomingData(makeResponse, 'test-webhook');
      console.log('📊 Process result:', result);
      
      // Verify helper was updated
      const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
      console.log('✅ Helper updated:', {
        plate: helper.meta?.plate,
        manufacturer: helper.vehicle?.manufacturer,
        model: helper.vehicle?.model
      });
      
      return result;
    } else {
      console.error('❌ processIncomingData function not found!');
    }
  };
  
  // Test floating screen data retrieval
  window.testFloatingScreenData = function() {
    console.log('🧪 Testing floating screen data retrieval...');
    
    // Check if helper exists in sessionStorage
    const helperString = sessionStorage.getItem('helper');
    if (!helperString) {
      console.warn('⚠️ No helper data in sessionStorage');
      return;
    }
    
    const helper = JSON.parse(helperString);
    console.log('📊 Helper data structure:', {
      hasVehicle: !!helper.vehicle,
      hasMeta: !!helper.meta,
      hasCarDetails: !!helper.car_details,
      hasStakeholders: !!helper.stakeholders,
      vehicleKeys: Object.keys(helper.vehicle || {}),
      metaKeys: Object.keys(helper.meta || {}),
      carDetailsKeys: Object.keys(helper.car_details || {})
    });
    
    // Check window.currentCaseData
    console.log('🔍 window.currentCaseData:', window.currentCaseData);
    
    // Check legacy carData
    const carData = sessionStorage.getItem('carData');
    if (carData) {
      console.log('📊 Legacy carData:', JSON.parse(carData));
    }
    
    return helper;
  };
  
  // Run all tests
  window.runAllDataFlowTests = function() {
    console.log('🧪 Running all data flow tests...\n');
    
    console.log('=== TEST 1: Hebrew Parsing ===');
    testHebrewParsing();
    
    console.log('\n=== TEST 2: Complete Data Flow ===');
    testCompleteDataFlow();
    
    console.log('\n=== TEST 3: Make.com Format ===');
    testMakeWebhookFormat();
    
    console.log('\n=== TEST 4: Floating Screen Data ===');
    testFloatingScreenData();
    
    console.log('\n✅ All tests completed! Check console output for results.');
  };
  
  // Add test button to page
  if (document.body) {
    const testButton = document.createElement('button');
    testButton.textContent = '🧪 Test Data Flow';
    testButton.style.cssText = `
      position: fixed;
      bottom: 100px;
      right: 20px;
      padding: 10px 20px;
      background: #17a2b8;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      z-index: 10000;
      font-weight: bold;
    `;
    testButton.onclick = runAllDataFlowTests;
    document.body.appendChild(testButton);
    
    console.log('✅ Test button added to page (bottom right)');
  }
  
  console.log('💡 Test functions available:');
  console.log('  - testHebrewParsing()');
  console.log('  - testCompleteDataFlow()');
  console.log('  - testMakeWebhookFormat()');
  console.log('  - testFloatingScreenData()');
  console.log('  - runAllDataFlowTests()');
})();