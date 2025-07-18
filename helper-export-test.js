// 🧪 HELPER EXPORT TEST - Does the system send a UNIFIED helper to Make.com?
// This test answers the critical question: Can the exported helper restore a full case session?

import { helper, updateHelper, saveHelperToStorage, loadHelperFromStorage, sendHelperToMake } from './helper.js';
import { standardizeHelperData, updateHelperWithStandardizedData } from './data-flow-standardizer.js';

// Test function to simulate data flow and check export
export function testHelperExportUnification() {
  console.log('🚀 TESTING HELPER EXPORT UNIFICATION');
  console.log('=====================================');
  
  // STEP 1: Simulate different modules updating helper
  console.log('\n📝 STEP 1: Simulating module updates...');
  
  // Module 1: Car Details Module
  updateHelper('vehicle', {
    plate_number: '1234567',
    manufacturer: 'Toyota',
    model: 'Camry'
  });
  
  // Module 2: Car Details (different structure)
  updateHelper('car_details', {
    plate: '1234567',
    manufacturer: 'Toyota',
    model: 'Camry'
  });
  
  // Module 3: Meta info
  updateHelper('meta', {
    plate: '1234567',
    case_id: 'CASE-TEST-001'
  });
  
  // Module 4: Levi Report
  updateHelper('expertise', {
    levi_report: {
      base_price: '100000',
      final_price: '95000',
      adjustments: {
        features: { percent: '5', value: '5000', total: '105000' },
        km: { percent: '-10', value: '-10000', total: '95000' }
      }
    }
  });
  
  // Module 5: Damage Centers
  updateHelper('damage_centers', [
    {
      center: 'Front',
      parts: [{ name: 'Bumper', cost: '1500' }],
      works: [{ name: 'Paint', cost: '800' }]
    }
  ]);
  
  console.log('✅ All modules updated helper');
  
  // STEP 2: Check current helper state
  console.log('\n📊 STEP 2: Current helper state...');
  console.log('Plate in vehicle:', helper.vehicle?.plate_number);
  console.log('Plate in car_details:', helper.car_details?.plate);
  console.log('Plate in meta:', helper.meta?.plate);
  console.log('Base price in levi:', helper.expertise?.levi_report?.base_price);
  console.log('Damage centers count:', helper.damage_centers?.length || 0);
  
  // STEP 3: Check if standardization works
  console.log('\n🔄 STEP 3: Testing standardization...');
  try {
    const standardizedData = standardizeHelperData(helper);
    console.log('Standardized vehicle plate:', standardizedData.vehicle?.plate);
    console.log('Standardized base price:', standardizedData.valuation?.base_price);
    console.log('Standardized damage centers:', standardizedData.damage_assessment?.centers?.length || 0);
    console.log('✅ Standardization works');
  } catch (error) {
    console.error('❌ Standardization failed:', error.message);
  }
  
  // STEP 4: Check what gets exported to Make.com
  console.log('\n📤 STEP 4: Checking Make.com export...');
  
  // Mock the sendHelperToMake function to see what data is sent
  const originalFetch = global.fetch;
  let exportedData = null;
  
  global.fetch = async (url, options) => {
    exportedData = JSON.parse(options.body);
    return { status: 200 };
  };
  
  // Test the export
  sendHelperToMake('test_export').then(() => {
    console.log('📦 EXPORTED DATA ANALYSIS:');
    console.log('=====================================');
    
    const helperData = exportedData.helper;
    
    // Check data completeness
    console.log('\n🔍 DATA COMPLETENESS CHECK:');
    console.log('Vehicle data:', !!helperData.vehicle);
    console.log('Car details data:', !!helperData.car_details);
    console.log('Meta data:', !!helperData.meta);
    console.log('Expertise data:', !!helperData.expertise);
    console.log('Damage centers:', !!helperData.damage_centers);
    console.log('Levi report:', !!helperData.expertise?.levi_report);
    
    // Check for data duplication
    console.log('\n⚠️  DATA DUPLICATION CHECK:');
    console.log('Plate in vehicle:', helperData.vehicle?.plate_number);
    console.log('Plate in car_details:', helperData.car_details?.plate);
    console.log('Plate in meta:', helperData.meta?.plate);
    
    // Check if all required sections exist
    console.log('\n✅ REQUIRED SECTIONS CHECK:');
    const requiredSections = ['vehicle', 'meta', 'expertise', 'stakeholders', 'damage_assessment', 'valuation', 'financials', 'parts_search', 'documents', 'system'];
    requiredSections.forEach(section => {
      const exists = !!helperData[section];
      console.log(`${section}: ${exists ? '✅' : '❌'}`);
    });
    
    // Calculate data size
    const dataSize = JSON.stringify(helperData).length;
    console.log(`\n📏 EXPORTED DATA SIZE: ${dataSize} characters`);
    
    // FINAL VERDICT
    console.log('\n🎯 FINAL VERDICT:');
    console.log('=====================================');
    
    const hasAllSections = requiredSections.every(section => !!helperData[section]);
    const hasNoDuplication = helperData.vehicle?.plate_number === helperData.car_details?.plate && helperData.car_details?.plate === helperData.meta?.plate;
    const hasCompleteData = !!helperData.expertise?.levi_report && !!helperData.vehicle?.manufacturer;
    
    if (hasAllSections && hasCompleteData) {
      console.log('✅ EXPORT IS UNIFIED - Can restore full case session');
      console.log('   - All required sections present');
      console.log('   - Complete data structure');
      console.log('   - Ready for case restoration');
    } else {
      console.log('❌ EXPORT IS PARTIAL - Cannot restore full case session');
      console.log('   - Missing sections or incomplete data');
      console.log('   - Needs helper structure fixes');
    }
    
    if (!hasNoDuplication) {
      console.log('⚠️  DATA DUPLICATION DETECTED - May cause conflicts');
    }
    
    // Restore original fetch
    global.fetch = originalFetch;
  });
  
  return exportedData;
}

// Run the test
console.log('🧪 Starting Helper Export Test...');
testHelperExportUnification();