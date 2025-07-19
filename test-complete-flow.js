// Test Complete Data Flow
(function() {
  console.log('🧪 Complete Data Flow Test Module loaded');
  
  // Test function to simulate complete data flow
  window.testCompleteDataFlow = function() {
    console.log('🧪 Starting complete data flow test...');
    
    // 1. Simulate Make.com response with Hebrew Body field
    const makeResponse = {
      success: true,
      message: "Data retrieved successfully",
      Body: `פרטי רכב: 5785269
תאריך: 2025-07-19T21:26:38.366+02:00
מס' רכב: 5785269
שם היצרן: ביואיק
דגם: LUCERNE
סוג הדגם: סדאן
סוג הרכב: פרטי
רמת גימור:CXL
מספר שילדה: 1G4HD57258U196450
שנת ייצור: 05/2009
שם בעל הרכב: כרמל כיוף
סוג בעלות: פרטי
נפח מנוע: 3791
סוג דלק: בנזין
מספר דגם הרכב:HD572
דגם מנוע: 428
הנעה: 4X2
מוסך: UMI חיפה
קוד משרד התחבורה:156-11
מאפיינים נוספים: כיסא חשמלי, מזגן אוטומטי, ABS, כריות אוויר`,
      timestamp: new Date().toISOString(),
      webhook_id: "OPEN_CASE_UI"
    };
    
    console.log('📥 Simulated Make.com response:', makeResponse);
    
    // 2. Process through the system
    if (window.processIncomingData) {
      const result = window.processIncomingData(makeResponse, 'OPEN_CASE_UI');
      console.log('✅ processIncomingData result:', result);
    } else {
      console.error('❌ processIncomingData not found');
    }
    
    // 3. Check helper state
    setTimeout(() => {
      console.log('🔍 Checking helper state after processing...');
      const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
      
      console.log('📊 Helper structure:');
      console.log('  vehicle:', helper.vehicle);
      console.log('  meta:', helper.meta);
      console.log('  stakeholders:', helper.stakeholders);
      console.log('  car_details:', helper.car_details);
      
      // 4. Verify critical fields
      const criticalFields = {
        'helper.vehicle.plate': helper.vehicle?.plate,
        'helper.vehicle.manufacturer': helper.vehicle?.manufacturer,
        'helper.vehicle.model': helper.vehicle?.model,
        'helper.vehicle.year': helper.vehicle?.year,
        'helper.vehicle.chassis': helper.vehicle?.chassis,
        'helper.meta.plate': helper.meta?.plate,
        'helper.stakeholders.owner.name': helper.stakeholders?.owner?.name,
        'helper.stakeholders.garage.name': helper.stakeholders?.garage?.name
      };
      
      console.log('🔍 Critical fields check:');
      Object.entries(criticalFields).forEach(([field, value]) => {
        if (value) {
          console.log(`  ✅ ${field}: ${value}`);
        } else {
          console.log(`  ❌ ${field}: EMPTY`);
        }
      });
      
      // 5. Check storage
      console.log('\n📦 Storage check:');
      console.log('  makeCarData:', sessionStorage.getItem('makeCarData') ? 'EXISTS' : 'MISSING');
      console.log('  carData:', sessionStorage.getItem('carData') ? 'EXISTS' : 'MISSING');
      console.log('  currentCaseData:', sessionStorage.getItem('currentCaseData') ? 'EXISTS' : 'MISSING');
      
      // 6. Trigger UI refresh
      console.log('\n🔄 Refreshing UI components...');
      if (window.refreshCarData) {
        window.refreshCarData();
        console.log('  ✅ Car details floating refreshed');
      }
      
      if (window.forcePopulateFields) {
        window.forcePopulateFields();
        console.log('  ✅ Form fields populated');
      }
      
    }, 500);
  };
  
  // Function to manually inject test data
  window.injectTestData = function() {
    console.log('💉 Injecting test data directly...');
    
    const testData = {
      plate: '5785269',
      manufacturer: 'ביואיק',
      model: 'LUCERNE',
      model_type: 'סדאן',
      vehicle_type: 'פרטי',
      trim: 'CXL',
      chassis: '1G4HD57258U196450',
      year: '2009',
      owner: 'כרמל כיוף',
      ownership_type: 'פרטי',
      engine_volume: '3791',
      fuel_type: 'בנזין',
      model_code: 'HD572',
      engine_model: '428',
      drive_type: '4X2',
      garage_name: 'UMI חיפה',
      office_code: '156-11',
      location: 'UMI חיפה'
    };
    
    // Update helper directly
    if (!window.helper) window.helper = {};
    
    window.helper.vehicle = {
      plate: testData.plate,
      manufacturer: testData.manufacturer,
      model: testData.model,
      model_type: testData.model_type,
      vehicle_type: testData.vehicle_type,
      trim: testData.trim,
      chassis: testData.chassis,
      year: testData.year,
      engine_volume: testData.engine_volume,
      fuel_type: testData.fuel_type,
      model_code: testData.model_code,
      engine_model: testData.engine_model,
      drive_type: testData.drive_type,
      ownership_type: testData.ownership_type,
      office_code: testData.office_code
    };
    
    window.helper.meta = {
      plate: testData.plate,
      location: testData.location,
      office_code: testData.office_code
    };
    
    window.helper.stakeholders = {
      owner: {
        name: testData.owner
      },
      garage: {
        name: testData.garage_name
      }
    };
    
    window.helper.car_details = testData;
    
    // Save to storage
    sessionStorage.setItem('helper', JSON.stringify(window.helper));
    sessionStorage.setItem('currentCaseData', JSON.stringify(window.helper));
    sessionStorage.setItem('makeCarData', JSON.stringify(testData));
    
    console.log('✅ Test data injected into helper');
    
    // Refresh UI
    if (window.refreshCarData) window.refreshCarData();
    if (window.forcePopulateFields) window.forcePopulateFields();
  };
  
  console.log('💡 Test functions available:');
  console.log('  - testCompleteDataFlow() : Test the complete data flow');
  console.log('  - injectTestData() : Manually inject test data');
})();