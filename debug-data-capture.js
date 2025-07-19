// Debug data capture issues
(function() {
  console.log('🔍 DEBUG: Data Capture Diagnostic Started');
  
  // Function to check all storage keys
  window.debugStorageData = function() {
    console.log('=== STORAGE DEBUG ===');
    
    // Check all relevant keys
    const keysToCheck = [
      'makeCarData',
      'carData',
      'vehicleDetails',
      'helper',
      'currentCaseData',
      'carDataFromMake'
    ];
    
    keysToCheck.forEach(key => {
      const data = sessionStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          console.log(`✅ ${key}:`, parsed);
          
          // Check if it has actual car data
          if (parsed.manufacturer || parsed.model || parsed.year) {
            console.log(`   → Has car details: ${parsed.manufacturer} ${parsed.model} ${parsed.year}`);
          } else if (parsed.vehicle?.manufacturer) {
            console.log(`   → Has vehicle details: ${parsed.vehicle.manufacturer}`);
          } else {
            console.log(`   → No car details found in this key`);
          }
        } catch (e) {
          console.log(`❌ ${key}: Failed to parse -`, data);
        }
      } else {
        console.log(`❌ ${key}: Not found`);
      }
    });
    
    // Check for webhook fallback data
    const fallbackKeys = Object.keys(sessionStorage).filter(k => k.startsWith('webhook_fallback_'));
    if (fallbackKeys.length > 0) {
      console.log('\n📦 Found webhook fallback data:');
      fallbackKeys.forEach(key => {
        const data = JSON.parse(sessionStorage.getItem(key));
        console.log(`  ${key}:`, data);
      });
    }
  };
  
  // Function to manually process webhook response
  window.debugProcessWebhookResponse = function(responseText) {
    console.log('🔧 Manually processing webhook response...');
    
    try {
      // Try to parse as JSON
      let data = JSON.parse(responseText);
      console.log('📥 Parsed response:', data);
      
      // Check if it's array format
      if (Array.isArray(data) && data.length > 0) {
        console.log('📥 Detected array format');
        const firstItem = data[0];
        
        if (firstItem.value) {
          let actualData = firstItem.value;
          
          // Check if value needs parsing
          if (typeof actualData === 'string') {
            try {
              actualData = JSON.parse(actualData);
              console.log('✅ Parsed nested JSON:', actualData);
            } catch (e) {
              console.log('❌ Could not parse nested value');
            }
          }
          
          // Store the data
          sessionStorage.setItem('makeCarData', JSON.stringify(actualData));
          sessionStorage.setItem('carData', JSON.stringify(actualData));
          console.log('💾 Stored extracted data');
          
          // Update helper
          if (window.helper) {
            window.helper.car_details = actualData;
            window.helper.vehicle = actualData;
            sessionStorage.setItem('helper', JSON.stringify(window.helper));
            console.log('✅ Updated helper');
          }
          
          return actualData;
        }
      }
      
      // Direct object format
      if (typeof data === 'object' && !Array.isArray(data)) {
        console.log('📥 Direct object format');
        sessionStorage.setItem('makeCarData', JSON.stringify(data));
        sessionStorage.setItem('carData', JSON.stringify(data));
        return data;
      }
      
    } catch (e) {
      console.error('Failed to process response:', e);
    }
  };
  
  // Function to force populate from any available data
  window.forcePopulateFromAnyData = function() {
    console.log('🔧 Force populating from any available data...');
    
    // Try to find data in any storage key
    const keysToTry = [
      'makeCarData',
      'carData',
      'vehicleDetails',
      'carDataFromMake'
    ];
    
    for (const key of keysToTry) {
      const data = sessionStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.manufacturer || parsed.model || parsed.plate) {
            console.log(`✅ Found data in ${key}:`, parsed);
            
            // Update helper
            window.helper = window.helper || {};
            window.helper.vehicle = {
              plate: parsed.plate || '',
              manufacturer: parsed.manufacturer || '',
              model: parsed.model || '',
              year: parsed.year || '',
              chassis: parsed.chassis || '',
              engine_volume: parsed.engine_volume || '',
              fuel_type: parsed.fuel_type || ''
            };
            
            window.helper.stakeholders = window.helper.stakeholders || {};
            window.helper.stakeholders.owner = {
              name: parsed.owner || ''
            };
            
            window.helper.meta = {
              plate: parsed.plate || '',
              location: parsed.location || ''
            };
            
            window.helper.car_details = parsed;
            
            // Save
            sessionStorage.setItem('helper', JSON.stringify(window.helper));
            console.log('✅ Helper populated:', window.helper);
            
            // Refresh UI
            if (typeof window.forcePopulateFields === 'function') {
              window.forcePopulateFields();
            }
            
            return true;
          }
        } catch (e) {
          console.error(`Failed to parse ${key}:`, e);
        }
      }
    }
    
    console.log('❌ No valid data found in any storage key');
    return false;
  };
  
  // Auto-run diagnostics on load
  setTimeout(() => {
    console.log('\n🔍 AUTO-DIAGNOSTIC:');
    debugStorageData();
  }, 1000);
  
  console.log('💡 Debug functions available:');
  console.log('  - debugStorageData() : Check all storage keys');
  console.log('  - debugProcessWebhookResponse(responseText) : Manually process webhook response');
  console.log('  - forcePopulateFromAnyData() : Force populate from any available data');
})();