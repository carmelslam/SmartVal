// 🏥 Diagnose Data Issue
// Run this in the console to diagnose why data isn't showing

window.diagnoseDataIssue = function() {
  console.log('🏥 DIAGNOSING DATA ISSUE...\n');
  
  console.log('=== 1. CHECKING STORAGE ===');
  const storageItems = ['helper', 'makeCarData', 'carData', 'currentCaseData'];
  storageItems.forEach(item => {
    const data = sessionStorage.getItem(item);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        console.log(`✅ ${item}:`, parsed);
        
        // Check specific fields
        if (item === 'helper') {
          console.log(`  - vehicle.plate: ${parsed.vehicle?.plate}`);
          console.log(`  - meta.plate: ${parsed.meta?.plate}`);
          console.log(`  - vehicle.manufacturer: ${parsed.vehicle?.manufacturer}`);
          console.log(`  - stakeholders.owner.name: ${parsed.stakeholders?.owner?.name}`);
        }
      } catch (e) {
        console.log(`❌ ${item}: Invalid JSON`);
      }
    } else {
      console.log(`❌ ${item}: Not found`);
    }
  });
  
  console.log('\n=== 2. CHECKING GLOBAL OBJECTS ===');
  console.log('window.helper:', window.helper);
  console.log('window.currentCaseData:', window.currentCaseData);
  
  console.log('\n=== 3. CHECKING DOM ELEMENTS ===');
  const testFields = ['plate', 'owner', 'manufacturer', 'model', 'ownerPhone'];
  testFields.forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element) {
      console.log(`✅ #${fieldId}: value="${element.value}"`);
    } else {
      console.log(`❌ #${fieldId}: Not found in DOM`);
    }
  });
  
  console.log('\n=== 4. TESTING DATA FLOW ===');
  
  // Test 1: Can we create and save data?
  const testData = {
    meta: { plate: 'TEST123' },
    vehicle: { manufacturer: 'TestMake', model: 'TestModel' },
    stakeholders: { owner: { name: 'Test Owner' } }
  };
  
  sessionStorage.setItem('testHelper', JSON.stringify(testData));
  const retrieved = JSON.parse(sessionStorage.getItem('testHelper'));
  if (retrieved && retrieved.meta.plate === 'TEST123') {
    console.log('✅ Storage read/write working');
    sessionStorage.removeItem('testHelper');
  } else {
    console.log('❌ Storage read/write FAILED');
  }
  
  console.log('\n=== 5. RECOMMENDATIONS ===');
  
  // Check if helper exists but is empty
  const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
  if (!helper.vehicle || !helper.vehicle.plate) {
    console.log('⚠️ Helper exists but vehicle data is empty');
    console.log('💡 Try running: simulateMakeWebhookResponse("1234567")');
  }
  
  // Check if makeCarData exists
  if (sessionStorage.getItem('makeCarData')) {
    console.log('⚠️ makeCarData exists but may not be processed');
    console.log('💡 Try running: checkForIncomingData()');
  }
  
  // Check if fields exist but are empty
  const plateField = document.getElementById('plate');
  if (plateField && !plateField.value && helper.vehicle?.plate) {
    console.log('⚠️ Data exists but fields are empty');
    console.log('💡 Try running: forcePopulateFields()');
  }
  
  console.log('\n🏥 DIAGNOSIS COMPLETE');
};

// Auto-run on load if in debug mode
if (window.location.search.includes('debug=true')) {
  setTimeout(diagnoseDataIssue, 2000);
}

console.log('💡 Run diagnoseDataIssue() to check why data isn\'t showing');