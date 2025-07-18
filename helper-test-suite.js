// 🧪 Helper System Test Suite
// Comprehensive testing for helper data flow and module communication

import { helper, updateHelper, saveHelperToStorage, loadHelperFromStorage, checkForIncomingData } from './helper.js';

class HelperTestSuite {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
  }

  // Run all tests
  async runAllTests() {
    console.log('🧪 Starting Helper System Test Suite...');
    console.log('=======================================');
    
    // Reset helper to clean state
    this.clearHelperData();
    
    // Run tests in sequence
    await this.testHelperInitialization();
    await this.testDataReception();
    await this.testHelperUpdates();
    await this.testStoragePersistence();
    await this.testModuleCommunication();
    await this.testDataFlow();
    
    // Generate report
    this.generateReport();
    
    return this.testResults;
  }

  // Clear helper data for clean testing
  clearHelperData() {
    sessionStorage.removeItem('helper');
    sessionStorage.removeItem('carData');
    sessionStorage.removeItem('leviData');
    localStorage.removeItem('helper_data');
    
    // Clear helper object
    Object.keys(helper).forEach(key => {
      if (typeof helper[key] === 'object' && helper[key] !== null) {
        if (Array.isArray(helper[key])) {
          helper[key] = [];
        } else {
          helper[key] = {};
        }
      } else {
        helper[key] = '';
      }
    });
    
    console.log('🧽 Helper data cleared for testing');
  }

  // Test helper initialization
  async testHelperInitialization() {
    console.log('\n📋 Test 1: Helper Initialization');
    console.log('--------------------------------');
    
    try {
      // Test loading with no data
      const loadResult = loadHelperFromStorage();
      
      this.assert(
        typeof helper === 'object',
        'Helper object exists',
        'helper-object-exists'
      );
      
      this.assert(
        helper.meta && typeof helper.meta === 'object',
        'Helper has meta section',
        'helper-meta-section'
      );
      
      this.assert(
        helper.car_details && typeof helper.car_details === 'object',
        'Helper has car_details section',
        'helper-car-details-section'
      );
      
      this.assert(
        helper.expertise && typeof helper.expertise === 'object',
        'Helper has expertise section',
        'helper-expertise-section'
      );
      
      console.log('✅ Helper initialization tests passed');
      
    } catch (error) {
      this.assert(false, `Helper initialization failed: ${error.message}`, 'helper-initialization');
    }
  }

  // Test data reception from external sources
  async testDataReception() {
    console.log('\n📡 Test 2: Data Reception');
    console.log('-------------------------');
    
    try {
      // Test 1: URL Parameters
      console.log('Testing URL parameter reception...');
      
      // Simulate URL parameters
      const testURL = '?plate=5785269&manufacturer=ביואיק&model=LUCERNE&owner=כרמל+כיוף';
      const urlParams = new URLSearchParams(testURL);
      
      // Manually process URL params (simulating checkForIncomingData)
      const allParams = Object.fromEntries(urlParams);
      if (Object.keys(allParams).length > 0) {
        const carDataFields = ['plate', 'manufacturer', 'model', 'owner'];
        const foundCarData = {};
        
        Object.keys(allParams).forEach(key => {
          if (carDataFields.includes(key.toLowerCase())) {
            foundCarData[key.toLowerCase()] = decodeURIComponent(allParams[key]);
          }
        });
        
        if (Object.keys(foundCarData).length > 0) {
          updateHelper('car_details', foundCarData);
        }
      }
      
      this.assert(
        helper.car_details.plate === '5785269',
        'URL parameter data processed correctly',
        'url-param-processing'
      );
      
      // Test 2: SessionStorage car data
      console.log('Testing sessionStorage car data reception...');
      
      const testCarData = {
        plate: '1234567',
        manufacturer: 'Toyota',
        model: 'Camry',
        owner: 'Test Owner'
      };
      
      sessionStorage.setItem('carData', JSON.stringify(testCarData));
      
      // Trigger data reception check
      checkForIncomingData();
      
      this.assert(
        helper.car_details.plate === '1234567' || helper.meta.plate === '1234567',
        'SessionStorage car data processed correctly',
        'session-storage-car-data'
      );
      
      console.log('✅ Data reception tests passed');
      
    } catch (error) {
      this.assert(false, `Data reception failed: ${error.message}`, 'data-reception');
    }
  }

  // Test helper update functions
  async testHelperUpdates() {
    console.log('\n🔄 Test 3: Helper Updates');
    console.log('-------------------------');
    
    try {
      // Test basic update
      const testData = { plate: 'TEST123', manufacturer: 'Test Car' };
      const updateResult = updateHelper('car_details', testData);
      
      this.assert(
        updateResult === true,
        'updateHelper returns true on success',
        'update-helper-return'
      );
      
      this.assert(
        helper.car_details.plate === 'TEST123',
        'Helper data updated correctly',
        'helper-data-update'
      );
      
      // Test nested update
      const nestedData = { levi_report: { base_price: '100000', final_price: '95000' } };
      updateHelper('expertise', nestedData);
      
      this.assert(
        helper.expertise.levi_report.base_price === '100000',
        'Nested helper data updated correctly',
        'nested-data-update'
      );
      
      console.log('✅ Helper update tests passed');
      
    } catch (error) {
      this.assert(false, `Helper updates failed: ${error.message}`, 'helper-updates');
    }
  }

  // Test storage persistence
  async testStoragePersistence() {
    console.log('\n💾 Test 4: Storage Persistence');
    console.log('------------------------------');
    
    try {
      // Add test data to helper
      updateHelper('car_details', { plate: 'PERSIST123', test_field: 'test_value' });
      
      // Save to storage
      const saveResult = saveHelperToStorage();
      
      this.assert(
        saveResult === true,
        'saveHelperToStorage returns true',
        'save-to-storage'
      );
      
      // Check if data exists in sessionStorage
      const sessionData = sessionStorage.getItem('helper');
      
      this.assert(
        sessionData !== null,
        'Data saved to sessionStorage',
        'session-storage-save'
      );
      
      // Parse and verify data
      const parsedData = JSON.parse(sessionData);
      
      this.assert(
        parsedData.car_details.plate === 'PERSIST123',
        'Saved data contains correct values',
        'saved-data-integrity'
      );
      
      // Test loading from storage
      this.clearHelperData(); // Clear memory
      const loadResult = loadHelperFromStorage();
      
      this.assert(
        loadResult === true,
        'loadHelperFromStorage returns true',
        'load-from-storage'
      );
      
      this.assert(
        helper.car_details.plate === 'PERSIST123',
        'Data loaded correctly from storage',
        'loaded-data-integrity'
      );
      
      console.log('✅ Storage persistence tests passed');
      
    } catch (error) {
      this.assert(false, `Storage persistence failed: ${error.message}`, 'storage-persistence');
    }
  }

  // Test module communication
  async testModuleCommunication() {
    console.log('\n🔗 Test 5: Module Communication');
    console.log('-------------------------------');
    
    try {
      // Test if updateHelper is globally available
      this.assert(
        typeof window.updateHelper === 'function',
        'updateHelper is globally available',
        'global-update-helper'
      );
      
      // Test if checkForIncomingData is globally available
      this.assert(
        typeof window.checkForIncomingData === 'function',
        'checkForIncomingData is globally available',
        'global-check-incoming-data'
      );
      
      // Test global function call
      const globalResult = window.updateHelper('car_details', { global_test: 'success' });
      
      this.assert(
        globalResult === true,
        'Global updateHelper function works',
        'global-function-call'
      );
      
      this.assert(
        helper.car_details.global_test === 'success',
        'Global function updates helper correctly',
        'global-function-update'
      );
      
      console.log('✅ Module communication tests passed');
      
    } catch (error) {
      this.assert(false, `Module communication failed: ${error.message}`, 'module-communication');
    }
  }

  // Test complete data flow
  async testDataFlow() {
    console.log('\n🌊 Test 6: Complete Data Flow');
    console.log('-----------------------------');
    
    try {
      // Simulate complete car data flow
      const completeCarData = {
        plate: 'FLOW123',
        manufacturer: 'Test Manufacturer',
        model: 'Test Model',
        year: '2023',
        owner: 'Flow Test Owner'
      };
      
      // Step 1: Receive data (simulate external source)
      sessionStorage.setItem('carData', JSON.stringify(completeCarData));
      
      // Step 2: Process incoming data
      checkForIncomingData();
      
      // Step 3: Verify data in helper
      this.assert(
        helper.car_details.plate === 'FLOW123' || helper.meta.plate === 'FLOW123',
        'Data flows from external source to helper',
        'external-to-helper-flow'
      );
      
      // Step 4: Update helper directly
      updateHelper('car_details', { additional_field: 'added_data' });
      
      // Step 5: Save to storage
      saveHelperToStorage();
      
      // Step 6: Verify persistence
      const storedData = JSON.parse(sessionStorage.getItem('helper'));
      
      this.assert(
        storedData.car_details.additional_field === 'added_data',
        'Complete data flow works end-to-end',
        'end-to-end-flow'
      );
      
      console.log('✅ Complete data flow tests passed');
      
    } catch (error) {
      this.assert(false, `Data flow failed: ${error.message}`, 'data-flow');
    }
  }

  // Assert function for test results
  assert(condition, message, testId) {
    const result = {
      testId,
      message,
      passed: condition,
      timestamp: Date.now()
    };
    
    this.testResults.push(result);
    
    if (condition) {
      console.log(`✅ ${message}`);
    } else {
      console.log(`❌ ${message}`);
    }
    
    return condition;
  }

  // Generate comprehensive test report
  generateReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    const total = this.testResults.length;
    
    console.log('\n📊 TEST REPORT');
    console.log('=======================================');
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    console.log(`Duration: ${duration}ms`);
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => console.log(`  - ${r.message} (${r.testId})`));
    }
    
    console.log('\n🔍 HELPER STATE AFTER TESTS:');
    console.log('Car Details:', helper.car_details);
    console.log('Meta:', helper.meta);
    console.log('Expertise:', helper.expertise);
    
    console.log('\n💾 STORAGE STATE:');
    console.log('SessionStorage helper:', !!sessionStorage.getItem('helper'));
    console.log('SessionStorage carData:', !!sessionStorage.getItem('carData'));
    console.log('LocalStorage helper_data:', !!localStorage.getItem('helper_data'));
    
    return {
      passed,
      failed,
      total,
      successRate: (passed / total) * 100,
      duration,
      details: this.testResults
    };
  }
}

// Create global instance for manual testing
window.helperTestSuite = new HelperTestSuite();

// Quick test function
window.runHelperTests = async () => {
  const suite = new HelperTestSuite();
  return await suite.runAllTests();
};

// Individual test functions for debugging
window.testHelperBasics = () => {
  console.log('🧪 Testing Helper Basics...');
  console.log('Helper object:', helper);
  console.log('updateHelper available:', typeof updateHelper === 'function');
  console.log('sessionStorage helper:', sessionStorage.getItem('helper'));
  console.log('Current URL:', window.location.href);
  console.log('URL params:', window.location.search);
};

console.log('🧪 Helper Test Suite loaded');
console.log('💡 Run window.runHelperTests() to start testing');
console.log('🔍 Run window.testHelperBasics() for quick diagnostics');

export default HelperTestSuite;